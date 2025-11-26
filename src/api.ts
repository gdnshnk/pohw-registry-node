/**
 * API Routes
 * Express routes for registry endpoints
 */

import { Router, Request, Response } from 'express';
import { RegistryDatabase } from './database';
import { BatchManager } from './batcher';
import { AttestationRequest, AttestationReceipt, VerificationResult, RegistryStatus, MerkleProof } from './types';
import { createHash } from 'crypto';
import { anchorMerkleRoot, AnchorPayload } from './anchoring';
import { ProcessSession, ProcessDigest, generateCompoundHash } from './process-layer';
import { DIDManager, generateDIDFromKeypair, isValidDID, parseDID } from './did';
import { AttestorManager } from './attestors';
import { createPAVClaimFromProof, PAVClaimBuilder, PAVClaimValidator, PAVClaimParser } from './pav';
import { FraudMitigationManager } from './fraud-mitigation';

export function createAPIRouter(
  db: RegistryDatabase, 
  batcher: BatchManager,
  anchorConfig?: any
): Router {
  const router = Router();
  
  // Initialize DID manager with database-backed storage
  const didManager = new DIDManager();
  
  // Load existing DID documents from database into manager
  const existingDIDs = db.getAllDIDDocuments();
  existingDIDs.forEach(doc => {
    didManager.storeDIDDocument(doc);
  });

  // Initialize Attestor Manager with database-backed storage
  const attestorManager = new AttestorManager();
  
  // Load existing attestors from database
  const existingAttestors = db.getAllAttestors();
  existingAttestors.forEach(attestor => {
    attestorManager.registerAttestor(
      attestor.did,
      attestor.name,
      attestor.type,
      attestor.publicKey,
      attestor.publicKeyUrl,
      attestor.metadata
    );
    if (attestor.status === 'active') {
      attestorManager.approveAttestor(attestor.did, attestor.nextAuditDue);
    }
  });

  // Create mock attestors if none exist (for development/testing)
  if (existingAttestors.length === 0 && process.env.NODE_ENV !== 'production') {
    const { createMockAttestors } = require('./mock-attestors');
    createMockAttestors(attestorManager).then(() => {
      // Store mock attestors in database
      const mockAttestors = attestorManager.getActiveAttestors();
      mockAttestors.forEach(attestor => {
        db.storeAttestor(attestor.did, attestor);
      });
      console.log('[API] Mock attestors initialized for testing');
    }).catch((err: any) => {
      console.warn('[API] Failed to create mock attestors:', err);
    });
  }

  // Initialize Fraud Mitigation Manager with database-backed storage
  const fraudMitigation = new FraudMitigationManager(db);

  /**
   * POST /pohw/attest
   * Submit a new attestation
   */
  router.post('/pohw/attest', async (req: Request, res: Response) => {
    try {
      const request: AttestationRequest = req.body;

      // Validate request
      if (!request.hash || !request.signature || !request.did || !request.timestamp) {
        return res.status(400).json({
          error: 'Missing required fields: hash, signature, did, timestamp'
        });
      }

      // Check if proof already exists
      const existing = db.getProofByHash(request.hash);
      if (existing) {
        return res.status(409).json({
          error: 'Proof already exists',
          receipt_hash: existing.hash
        });
      }

      // Check rate limits (fraud mitigation)
      const rateLimitResult = fraudMitigation.checkRateLimit(request.did, request.timestamp);
      if (!rateLimitResult.allowed) {
        // Record anomaly
        fraudMitigation.updateReputation(request.did, 'anomaly');
        return res.status(429).json({
          error: 'Rate limit exceeded',
          reason: rateLimitResult.reason,
          currentRate: rateLimitResult.currentRate,
          entropyDiscrepancy: rateLimitResult.entropyDiscrepancy
        });
      }

      // Verify attestor credentials and determine tier (following whitepaper Section 3.3)
      // Get assistance profile from request (user-selected or auto-detected)
      // Default to 'human-only' if not specified and process digest exists
      let assistanceProfile = request.assistanceProfile || 
        (request.processDigest ? 'human-only' : undefined);
      
      // Determine tier based on credentials
      const tier = attestorManager.determineTierFromCredentials(
        request.did,
        assistanceProfile as 'human-only' | 'AI-assisted' | 'AI-generated' | undefined
      );
      
      // Get credentials for logging/debugging
      const credentials = attestorManager.getCredentialsForDID(request.did);
      const credentialHashes = attestorManager.getCredentialHashesForDID(request.did);
      
      // Log credential verification (for transparency)
      if (credentials.length > 0) {
        console.log(`[Attest] DID ${request.did} has ${credentials.length} credential(s), tier: ${tier}`);
      } else {
        console.log(`[Attest] DID ${request.did} has no credentials, tier: ${tier} (default)`);
      }

      // IMPORTANT: Store proof with ORIGINAL content hash, not compound hash
      // The compound hash is stored separately in compound_hash field
      // This allows verification by content hash to work correctly
      let finalHash = request.hash; // Always use original content hash for storage
      let compoundHash: string | undefined = undefined;
      
      if (request.processDigest) {
        // Calculate compound hash but don't use it as the primary hash
        if (request.compoundHash) {
          compoundHash = request.compoundHash;
        } else {
          // Generate compound hash from content + process
          compoundHash = generateCompoundHash(request.hash, request.processDigest);
        }
        
        // Note: According to whitepaper Section 8.5 "Assistance Disclosure Model",
        // proofs should be accepted even if they don't meet human thresholds.
        // The assistance profile determines the tier, not threshold validation.
        // If process metrics don't meet thresholds and no assistance profile is specified,
        // we should default to 'AI-assisted' or 'AI-generated' based on the metrics.
        
        // Assistance profile should already be determined from actual data on client side
        // If not provided, determine from process metrics
        if (!request.assistanceProfile && request.processMetrics) {
          if (request.processMetrics.meetsThresholds) {
            request.assistanceProfile = 'human-only';
          } else {
            // Determine based on how far off the metrics are
            const entropy = request.processMetrics.entropy || 0;
            const duration = request.processMetrics.duration || 0;
            const inputEvents = request.processMetrics.inputEvents || 0;
            
            if (entropy < 0.1 && duration < 5000 && inputEvents < 5) {
              request.assistanceProfile = 'AI-generated';
            } else {
              request.assistanceProfile = 'AI-assisted';
            }
          }
          console.log(`[Attest] Determined assistance profile from data: ${request.assistanceProfile} for DID ${request.did}`);
        }
      }

      // Store proof with tier
      // Store with ORIGINAL content hash (not compound hash) so verification works
      const proofId = db.storeProof({
        hash: finalHash, // Original content hash (allows verification by content hash)
        signature: request.signature,
        did: request.did,
        timestamp: request.timestamp,
        process_digest: request.processDigest,
        compound_hash: compoundHash, // Store compound hash separately
        process_metrics: request.processMetrics ? JSON.stringify(request.processMetrics) : undefined,
        zk_proof: request.zkProof ? JSON.stringify(request.zkProof) : undefined,
        tier: tier,
        authored_on_device: request.authoredOnDevice,
        environment_attestation: request.environmentAttestation ? JSON.stringify(request.environmentAttestation) : undefined
      });

      // Record submission (fraud mitigation)
      fraudMitigation.recordSubmission(request.did, finalHash, request.timestamp, rateLimitResult);

      // Generate receipt hash (use compound hash if available)
      const receiptData = `${finalHash}-${request.did}-${request.timestamp}`;
      const receiptHash = '0x' + createHash('sha256').update(receiptData).digest('hex');

      // Check if we should create a batch
      if (batcher.shouldCreateBatch()) {
        await batcher.createBatch();
      }

      const receipt: AttestationReceipt = {
        receipt_hash: receiptHash,
        timestamp: new Date().toISOString(),
        registry: 'proofofhumanwork.org'
      };

      res.status(201).json(receipt);
    } catch (error: any) {
      console.error('Attestation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/batch/anchor/:batchId
   * Manually anchor a batch to blockchains
   */
  router.post('/pohw/batch/anchor/:batchId', async (req: Request, res: Response) => {
    try {
      const batchId = req.params.batchId;
      const batch = db.getLatestBatch();
      
      if (!batch || batch.id !== batchId) {
        return res.status(404).json({
          error: 'Batch not found'
        });
      }

      if (!anchorConfig || !anchorConfig.enabled) {
        return res.status(400).json({
          error: 'Anchoring is not enabled. Set ANCHORING_ENABLED=true and configure blockchain settings.'
        });
      }

      const anchorPayload: AnchorPayload = {
        merkleRoot: batch.root,
        batchId: batch.id,
        registryId: 'pohw-registry-node',
        timestamp: batch.created_at
      };

      const anchorResults = await anchorMerkleRoot(anchorPayload, anchorConfig);
      
      // Store anchor information
      const anchors = anchorResults
        .filter(r => r.success)
        .map(r => ({
          chain: r.chain,
          tx: r.txHash,
          block: r.blockNumber
        }));

      if (anchors.length > 0) {
        db.updateBatchAnchors(batchId, anchors);
      }

      // Enhance results with explorer links and summary
      const enhancedResults = anchorResults.map(result => {
        const base: any = { ...result };
        
        if (result.success && result.txHash) {
          if (result.chain === 'bitcoin') {
            const network = anchorConfig?.bitcoin?.network || 'testnet';
            base.explorer_url = `https://blockstream.info/${network === 'testnet' ? 'testnet/' : ''}tx/${result.txHash}`;
          } else if (result.chain === 'ethereum') {
            const network = anchorConfig?.ethereum?.network || 'sepolia';
            base.explorer_url = `https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/tx/${result.txHash}`;
          }
        }
        
        return base;
      });

      res.json({
        success: true,
        batch_id: batchId,
        anchors: enhancedResults,
        stored_anchors: anchors,
        summary: {
          total: anchorResults.length,
          successful: anchorResults.filter(r => r.success).length,
          failed: anchorResults.filter(r => !r.success).length
        }
      });
    } catch (error: any) {
      console.error('Anchoring error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/batch/:batchId/anchors
   * Get anchor status for a batch
   */
  router.get('/pohw/batch/:batchId/anchors', async (req: Request, res: Response) => {
    try {
      const batchId = req.params.batchId;
      const batch = db.getBatchById(batchId);
      
      if (!batch) {
        return res.status(404).json({
          error: 'Batch not found'
        });
      }

      // Get anchor information from batch
      // Anchors are stored as JSON string in anchor_tx field
      let anchors: Array<{ chain: string; tx: string; block?: number }> = [];
      if (batch.anchor_tx) {
        try {
          anchors = JSON.parse(batch.anchor_tx);
        } catch (e) {
          // If parsing fails, try to extract from anchor_tx as single value
          if (batch.anchor_tx && batch.anchor_chain) {
            anchors = [{
              chain: batch.anchor_chain,
              tx: batch.anchor_tx
            }];
          }
        }
      }
      
      // Enhance with explorer links and status
      const enhancedAnchors = anchors.map((anchor: any) => {
        const explorerUrl = anchor.chain === 'bitcoin'
          ? `https://blockstream.info/${anchorConfig?.bitcoin?.network === 'testnet' ? 'testnet/' : ''}tx/${anchor.tx}`
          : `https://${anchorConfig?.ethereum?.network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/tx/${anchor.tx}`;
        
        return {
          ...anchor,
          explorer_url: explorerUrl,
          status: anchor.block ? 'confirmed' : 'pending'
        };
      });

      res.json({
        batch_id: batchId,
        merkle_root: batch.root,
        anchors: enhancedAnchors,
        total_anchors: anchors.length,
        confirmed_count: anchors.filter((a: any) => a.block).length,
        pending_count: anchors.filter((a: any) => !a.block).length
      });
    } catch (error: any) {
      console.error('Error getting anchor status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/batch/create
   * Manually trigger batch creation
   */
  router.post('/pohw/batch/create', async (req: Request, res: Response) => {
    try {
      const pendingCount = db.getPendingCount();
      
      if (pendingCount === 0) {
        return res.status(400).json({
          error: 'No pending proofs to batch',
          pending_count: 0
        });
      }

      const batch = await batcher.createBatch();

      if (!batch) {
        return res.status(500).json({
          error: 'Failed to create batch'
        });
      }

      res.json({
        success: true,
        batch_id: batch.id,
        merkle_root: batch.root,
        size: batch.size,
        created_at: batch.created_at
      });
    } catch (error: any) {
      console.error('Batch creation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/verify/index.json
   * Node status endpoint (compatible with gdn.sh format)
   * Must come before /pohw/verify/:hash to avoid route collision
   */
  router.get('/pohw/verify/index.json', (req: Request, res: Response) => {
    try {
      const latestBatch = db.getLatestBatch();
      
      // Use authentic batch creation timestamp (PoHW integrity principle)
      // If no batch exists, use current time as fallback
      const createdTimestamp = latestBatch?.created_at || new Date().toISOString();
      
      const status = {
        created: createdTimestamp,
        hash: latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000',
        node: 'pohw-registry-node',
        protocol: 'Proof of Human Work',
        public_key: 'https://proofofhumanwork.org/.well-known/public.txt',
        registry: 'https://proofofhumanwork.org',
        signature: 'active',
        status: 'active',
        type: 'registry-node',
        verified_by: 'PoHW Foundation'
      };

      res.json(status);
    } catch (error: any) {
      console.error('Node status error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /pohw/verify/:hash
   * Verify a proof by hash
   */
  router.get('/pohw/verify/:hash', (req: Request, res: Response) => {
    try {
      let hash = req.params.hash;
      // Normalize hash: ensure it has 0x prefix for lookup
      if (!hash.startsWith('0x')) {
        hash = '0x' + hash;
      }

      // Look up proof by hash (now stored as original content hash, not compound hash)
      let proof = db.getProofByHash(hash);

      // Fallback: If not found, check if any proof has this as compound_hash
      // This handles old proofs that were stored with compound hash as primary hash
      if (!proof) {
        proof = db.getProofByCompoundHash(hash);
      }

      if (!proof) {
        return res.status(404).json({
          valid: false,
          error: 'Proof not found'
        } as VerificationResult);
      }

      // Get Merkle proof if batched
      let merkleProof: string[] | undefined;
      let merkleRoot: string | undefined;

      if (proof.batch_id) {
        const merkle = batcher.getMerkleProof(hash);
        if (merkle) {
          merkleProof = merkle.proof;
          merkleRoot = merkle.root;
        }
      }

      const result: VerificationResult = {
        valid: true,
        signer: proof.did,
        timestamp: proof.timestamp,
        registry: 'proofofhumanwork.org',
        merkle_proof: merkleProof,
        merkle_root: merkleRoot
      };

      res.json(result);
    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({
        valid: false,
        error: 'Internal server error'
      } as VerificationResult);
    }
  });

  /**
   * GET /pohw/proofs/:hash
   * Get all proofs for a hash (with optional filtering)
   * Query params: did, tier, from, to, sort, limit, offset
   */
  router.get('/pohw/proofs/:hash', (req: Request, res: Response) => {
    try {
      let hash = req.params.hash;
      if (!hash.startsWith('0x')) {
        hash = '0x' + hash;
      }

      // Get all proofs for this hash
      let proofs = db.getAllProofsByHash(hash);

      if (proofs.length === 0) {
        return res.status(404).json({
          error: 'No proofs found for this hash',
          total: 0,
          proofs: []
        });
      }

      // Apply filters
      const { did, tier, from, to, sort = 'newest', limit = '50', offset = '0' } = req.query;

      // Filter by DID (partial match)
      if (did && typeof did === 'string') {
        const didLower = did.toLowerCase();
        proofs = proofs.filter(p => p.did.toLowerCase().includes(didLower));
      }

      // Filter by tier
      if (tier && typeof tier === 'string' && tier !== 'all') {
        proofs = proofs.filter(p => p.tier === tier);
      }

      // Filter by date range
      if (from && typeof from === 'string') {
        const fromDate = new Date(from);
        proofs = proofs.filter(p => new Date(p.timestamp) >= fromDate);
      }
      if (to && typeof to === 'string') {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        proofs = proofs.filter(p => new Date(p.timestamp) <= toDate);
      }

      // Sort
      if (sort === 'newest') {
        proofs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else if (sort === 'oldest') {
        proofs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } else if (sort === 'tier') {
        const tierOrder = { 'green': 0, 'blue': 1, 'purple': 2, 'grey': 3 };
        proofs.sort((a, b) => {
          const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 4;
          const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 4;
          return aTier - bTier;
        });
      } else if (sort === 'did') {
        proofs.sort((a, b) => a.did.localeCompare(b.did));
      }

      const total = proofs.length;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offsetNum = parseInt(offset as string, 10) || 0;

      // Paginate
      const paginatedProofs = proofs.slice(offsetNum, offsetNum + limitNum);

      // Get Merkle proofs for each
      const proofsWithMerkle = paginatedProofs.map(proof => {
        let merkleProof: string[] | undefined;
        let merkleRoot: string | undefined;

        if (proof.batch_id) {
          const merkle = batcher.getMerkleProof(proof.hash);
          if (merkle) {
            merkleProof = merkle.proof;
            merkleRoot = merkle.root;
          }
        }

        return {
          id: proof.id,
          hash: proof.hash,
          signature: proof.signature,
          did: proof.did,
          timestamp: proof.timestamp,
          tier: proof.tier || 'grey',
          batch_id: proof.batch_id,
          merkle_index: proof.merkle_index,
          merkle_proof: merkleProof,
          merkle_root: merkleRoot
        };
      });

      res.json({
        hash,
        total,
        limit: limitNum,
        offset: offsetNum,
        has_more: offsetNum + limitNum < total,
        proofs: proofsWithMerkle
      });
    } catch (error: any) {
      console.error('Get all proofs error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/proof/:hash
   * Get Merkle proof for a hash
   */
  router.get('/pohw/proof/:hash', (req: Request, res: Response) => {
    try {
      let hash = req.params.hash;
      // Normalize hash: ensure it has 0x prefix for lookup
      if (!hash.startsWith('0x')) {
        hash = '0x' + hash;
      }
      const merkle = batcher.getMerkleProof(hash);

      if (!merkle) {
        return res.status(404).json({
          error: 'Proof not found or not yet batched'
        });
      }

      // Get anchor information from batch
      const proofRecord = db.getProofByHash(hash);
      let anchors: Array<{ chain: string; tx: string; block?: number }> = [];
      
      if (proofRecord?.batch_id) {
        const batch = db.getBatchById(proofRecord.batch_id);
        if (batch?.anchor_tx) {
          try {
            anchors = JSON.parse(batch.anchor_tx);
          } catch (e) {
            // If not JSON, try to parse as single anchor
            if (batch.anchor_tx && batch.anchor_chain) {
              anchors = [{
                chain: batch.anchor_chain,
                tx: batch.anchor_tx
              }];
            }
          }
        }
      }

      // Return PAV format if requested
      const format = req.query.format as string | undefined;
      if (format === 'pav' || format === 'json-ld') {
        // Normalize hash for lookup
        let normalizedHash = hash;
        if (!normalizedHash.startsWith('0x')) {
          normalizedHash = '0x' + normalizedHash;
        }
        const proofRecord = db.getProofByHash(normalizedHash);
        if (proofRecord) {
          // Create PAV claim using builder
          const builder = new PAVClaimBuilder();
          builder
            .setHash(proofRecord.hash)
            .setCreatedBy(proofRecord.did)
            .setCreatedOn(proofRecord.timestamp)
            .setSignature(proofRecord.signature)
            .setRegistry('proofofhumanwork.org');

          if (proofRecord.process_digest) {
            builder.setProcessDigest(proofRecord.process_digest);
          }

          if (proofRecord.compound_hash) {
            builder.setCompoundHash(proofRecord.compound_hash);
          }

          // Extract entropy and temporal coherence from process metrics
          let entropyProof: string | undefined;
          let temporalCoherence: string | undefined;
          if (proofRecord.process_metrics) {
            try {
              const metrics = JSON.parse(proofRecord.process_metrics);
              if (metrics.entropy !== undefined && metrics.entropy >= 0.3) {
                entropyProof = 'entropy-verified';
              }
              if (metrics.temporalCoherence !== undefined) {
                temporalCoherence = metrics.temporalCoherence.toString();
              }
            } catch (e) {
              // Ignore parse errors
            }
          }

          if (entropyProof) {
            builder.setEntropyProof(entropyProof);
          }

          if (temporalCoherence) {
            builder.setTemporalCoherence(temporalCoherence);
          }

          // Add environment attestations
          if (proofRecord.authored_on_device) {
            builder.setAuthoredOnDevice(proofRecord.authored_on_device);
          }

          if (proofRecord.environment_attestation) {
            try {
              const envAttestation = JSON.parse(proofRecord.environment_attestation);
              builder.setEnvironmentAttestation(envAttestation);
            } catch (e) {
              // Ignore parse errors
            }
          }

          if (merkle && merkle.proof.length > 0) {
            builder.setMerkleInclusion(merkle.proof.join(','));
          }

          if (anchors && anchors.length > 0) {
            builder.setAnchors(anchors);
          }

          // Set assistance profile (default to human-only)
          builder.setAssistanceProfile('human-only');

          // Use tier from proof record (determined from credentials) or fall back to reputation
          let tier: string = 'grey';
          if (proofRecord.tier) {
            tier = proofRecord.tier;
          } else {
            // Fall back to reputation tier if proof record doesn't have tier
            const reputation = fraudMitigation.getReputation(proofRecord.did);
            if (reputation) {
              tier = reputation.tier;
            }
          }

          // Map tier to PAV format (capitalize first letter)
          const tierMap: { [key: string]: string } = {
            'green': 'Green',
            'blue': 'Blue',
            'purple': 'Purple',
            'grey': 'Grey'
          };
          builder.setVerificationTier((tierMap[tier] || 'Grey') as 'Green' | 'Blue' | 'Purple' | 'Grey');
          builder.setTier(tier);

          // Set revocation state (default to active)
          builder.setRevocationState('active');

          // Set registry anchor
          const registryUrl = req.protocol + '://' + req.get('host');
          builder.setRegistryAnchor(`${registryUrl}/pohw/proof/${normalizedHash.startsWith('0x') ? normalizedHash.substring(2) : normalizedHash}`);

          const pavClaim = builder.build();
          res.setHeader('Content-Type', 'application/ld+json');
          res.json(pavClaim);
          return;
        }
      }

      const result: MerkleProof = {
        proof: merkle.proof,
        root: merkle.root,
        anchors
      };

      res.json(result);
    } catch (error: any) {
      console.error('Merkle proof error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /pohw/claim/:hash
   * Get PAV claim object for a hash (JSON-LD format)
   */
  router.get('/pohw/claim/:hash', (req: Request, res: Response) => {
    try {
      let hash = req.params.hash;
      // Normalize hash: ensure it has 0x prefix for lookup
      if (!hash.startsWith('0x')) {
        hash = '0x' + hash;
      }
      
      const proofRecord = db.getProofByHash(hash);

      if (!proofRecord) {
        return res.status(404).json({
          error: 'Proof not found',
          hash
        });
      }

      // Get Merkle proof if available
      const merkle = batcher.getMerkleProof(hash);
      let anchors: Array<{ chain: string; tx: string; block?: number }> = [];
      
      if (proofRecord.batch_id) {
        const batch = db.getBatchById(proofRecord.batch_id);
        if (batch?.anchor_tx) {
          try {
            anchors = JSON.parse(batch.anchor_tx);
          } catch (e) {
            if (batch.anchor_tx && batch.anchor_chain) {
              anchors = [{
                chain: batch.anchor_chain,
                tx: batch.anchor_tx
              }];
            }
          }
        }
      }

      // Parse process metrics if available
      let entropyProof: string | undefined;
      let temporalCoherence: string | undefined;
      let zkProof: any = undefined;
      
      if (proofRecord.process_metrics) {
        try {
          const metrics = JSON.parse(proofRecord.process_metrics);
          if (metrics.entropy !== undefined) {
            entropyProof = `zkp:entropy>${metrics.entropy.toFixed(3)}`;
          }
          if (metrics.temporalCoherence !== undefined) {
            temporalCoherence = `zkp:coherence>${metrics.temporalCoherence.toFixed(3)}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Parse ZK-SNARK proof if available
      if (proofRecord.zk_proof) {
        try {
          zkProof = JSON.parse(proofRecord.zk_proof);
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Create PAV claim using builder
      const builder = new PAVClaimBuilder();
      builder
        .setHash(proofRecord.hash)
        .setCreatedBy(proofRecord.did)
        .setCreatedOn(proofRecord.timestamp)
        .setSignature(proofRecord.signature)
        .setRegistry('proofofhumanwork.org');

      if (proofRecord.process_digest) {
        builder.setProcessDigest(proofRecord.process_digest);
      }

      if (proofRecord.compound_hash) {
        builder.setCompoundHash(proofRecord.compound_hash);
      }

      if (entropyProof) {
        builder.setEntropyProof(entropyProof);
      }

      if (temporalCoherence) {
        builder.setTemporalCoherence(temporalCoherence);
      }

      // Add environment attestations
      if (proofRecord.authored_on_device) {
        builder.setAuthoredOnDevice(proofRecord.authored_on_device);
      }

      if (proofRecord.environment_attestation) {
        try {
          const envAttestation = JSON.parse(proofRecord.environment_attestation);
          builder.setEnvironmentAttestation(envAttestation);
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Add ZK-SNARK proof if available
      if (zkProof) {
        builder.setCustomField('pav:zkProof', zkProof);
      }

      if (merkle && merkle.proof.length > 0) {
        builder.setMerkleInclusion(merkle.proof.join(','));
      }

      if (anchors && anchors.length > 0) {
        builder.setAnchors(anchors);
      }

      // Set assistance profile (default to human-only if process digest exists)
      if (proofRecord.process_digest) {
        builder.setAssistanceProfile('human-only');
      } else {
        builder.setAssistanceProfile('human-only'); // Default
      }

      // Use tier from proof record (determined from credentials) or fall back to reputation
      let tier: string = 'grey';
      if (proofRecord.tier) {
        tier = proofRecord.tier;
      } else {
        // Fall back to reputation tier if proof record doesn't have tier
        const reputation = fraudMitigation.getReputation(proofRecord.did);
        if (reputation) {
          tier = reputation.tier;
        }
      }

      // Map tier to PAV format (capitalize first letter)
      const tierMap: { [key: string]: string } = {
        'green': 'Green',
        'blue': 'Blue',
        'purple': 'Purple',
        'grey': 'Grey'
      };
      builder.setVerificationTier((tierMap[tier] || 'Grey') as 'Green' | 'Blue' | 'Purple' | 'Grey');
      builder.setTier(tier);

      // Set revocation state (default to active, can be enhanced with revocation registry check)
      builder.setRevocationState('active');

      // Set registry anchor
      const registryUrl = req.protocol + '://' + req.get('host');
      builder.setRegistryAnchor(`${registryUrl}/pohw/proof/${proofRecord.hash.startsWith('0x') ? proofRecord.hash.substring(2) : proofRecord.hash}`);

      // Set compliance profile (can be configurable)
      // builder.setComplianceProfile('https://pohw.org/policy/eidas-ltv');

      const pavClaim = builder.build();

      res.setHeader('Content-Type', 'application/ld+json');
      res.json(pavClaim);
    } catch (error: any) {
      console.error('PAV claim error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/claim/validate
   * Validate a PAV claim object
   */
  router.post('/pohw/claim/validate', (req: Request, res: Response) => {
    try {
      const claim = req.body;

      const validation = PAVClaimValidator.validate(claim);
      const completeness = PAVClaimValidator.validateCompleteness(claim);

      res.json({
        valid: validation.valid,
        complete: completeness.complete,
        errors: validation.errors,
        missing: completeness.missing
      });
    } catch (error: any) {
      console.error('PAV validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/did/:did
   * Resolve DID to DID Document (W3C DID Resolution)
   */
  router.get('/pohw/did/:did', (req: Request, res: Response) => {
    try {
      const did = req.params.did;

      // Validate DID format
      if (!isValidDID(did)) {
        return res.status(400).json({
          error: 'Invalid DID format',
          expected: 'did:pohw:{method-specific-id}'
        });
      }

      // Resolve DID document from database
      const document = db.getDIDDocument(did);

      if (!document) {
        return res.status(404).json({
          error: 'DID not found',
          did
        });
      }

      // Return DID document (W3C DID Core format)
      res.json(document);
    } catch (error: any) {
      console.error('DID resolution error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/did
   * Register a new DID document
   */
  router.post('/pohw/did', (req: Request, res: Response) => {
    try {
      const document = req.body as any;

      // Validate DID document structure
      if (!document.id || !document.verificationMethod || !Array.isArray(document.verificationMethod)) {
        return res.status(400).json({
          error: 'Invalid DID document format',
          required: ['id', 'verificationMethod']
        });
      }

      // Validate DID format
      if (!isValidDID(document.id)) {
        return res.status(400).json({
          error: 'Invalid DID format in document',
          did: document.id
        });
      }

      // Check if DID already exists
      const existing = db.getDIDDocument(document.id);
      if (existing) {
        return res.status(409).json({
          error: 'DID already exists',
          did: document.id
        });
      }

      // Store DID document in both manager and database
      didManager.storeDIDDocument(document);
      db.storeDIDDocument(document.id, document);

      // Create KCG node
      const verificationMethod = document.verificationMethod[0];
      const keyFingerprint = createHash('sha256')
        .update(verificationMethod.publicKeyHex || verificationMethod.publicKeyMultibase)
        .digest('hex');

      const kcgNode = {
        did: document.id,
        keyFingerprint,
        previousNode: document.previousDID,
        continuityClaim: document.continuityClaim,
        createdAt: document.created || new Date().toISOString(),
        status: 'active' as const
      };

      db.storeKCGNode(document.id, kcgNode);

      res.status(201).json({
        did: document.id,
        created: document.created || new Date().toISOString(),
        message: 'DID document registered successfully'
      });
    } catch (error: any) {
      console.error('DID registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/did/:did/rotate
   * Rotate a DID (create new DID with continuity claim)
   */
  router.post('/pohw/did/:did/rotate', async (req: Request, res: Response) => {
    try {
      const oldDID = req.params.did;
      const { newPublicKey, oldPrivateKey, lastAnchor } = req.body;

      if (!newPublicKey) {
        return res.status(400).json({
          error: 'Missing required field: newPublicKey'
        });
      }

      // Get old DID document
      const oldDocument = db.getDIDDocument(oldDID);
      if (!oldDocument) {
        return res.status(404).json({
          error: 'Old DID not found',
          did: oldDID
        });
      }

      // Rotate DID
      const oldKeyBuffer = Buffer.from(oldPrivateKey, 'hex');
      const newKeyBuffer = Buffer.from(newPublicKey, 'hex');

      const rotation = didManager.rotateDID(
        oldDID,
        oldKeyBuffer,
        newKeyBuffer,
        lastAnchor
      );

      // Store new DID document in both manager and database
      didManager.storeDIDDocument(rotation.document);
      db.storeDIDDocument(rotation.newDID.did, rotation.document);

      // Update KCG
      const oldNode = db.getKCGNode(oldDID);
      if (oldNode) {
        oldNode.status = 'rotated';
        db.storeKCGNode(oldDID, oldNode);
      }

      // Create new KCG node
      const verificationMethod = rotation.document.verificationMethod[0];
      const keyFingerprint = createHash('sha256')
        .update(verificationMethod.publicKeyHex || verificationMethod.publicKeyMultibase)
        .digest('hex');

      db.storeKCGNode(rotation.newDID.did, {
        did: rotation.newDID.did,
        keyFingerprint,
        previousNode: oldDID,
        continuityClaim: rotation.continuityClaim,
        createdAt: rotation.newDID.createdAt,
        status: 'active'
      });

      res.status(201).json({
        oldDID,
        newDID: rotation.newDID.did,
        continuityClaim: rotation.continuityClaim,
        message: 'DID rotated successfully'
      });
    } catch (error: any) {
      console.error('DID rotation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/did/:did/continuity
   * Get Key Continuity Graph for a DID
   */
  router.get('/pohw/did/:did/continuity', (req: Request, res: Response) => {
    try {
      const did = req.params.did;

      if (!isValidDID(did)) {
        return res.status(400).json({
          error: 'Invalid DID format'
        });
      }

      const chain = db.getContinuityChain(did);

      if (chain.length === 0) {
        return res.status(404).json({
          error: 'DID not found in continuity graph',
          did
        });
      }

      res.json({
        did,
        chain,
        length: chain.length
      });
    } catch (error: any) {
      console.error('Continuity graph error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/attestors/registry
   * Get public attestor registry
   */
  router.get('/pohw/attestors/registry', (req: Request, res: Response) => {
    try {
      const registry = attestorManager.getRegistry();
      res.json(registry);
    } catch (error: any) {
      console.error('Attestor registry error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/attestors/register
   * Register a new attestor (requires Foundation approval)
   */
  router.post('/pohw/attestors/register', (req: Request, res: Response) => {
    try {
      const { did, name, type, publicKey, publicKeyUrl, metadata } = req.body;

      if (!did || !name || !type || !publicKey) {
        return res.status(400).json({
          error: 'Missing required fields: did, name, type, publicKey'
        });
      }

      const record = attestorManager.registerAttestor(
        did,
        name,
        type,
        publicKey,
        publicKeyUrl,
        metadata
      );

      // Store in database
      db.storeAttestor(did, record);
      db.appendAuditLog({
        timestamp: new Date().toISOString(),
        action: 'status_changed',
        attestorDID: did,
        details: `Attestor registered: ${name}`
      });

      res.status(201).json({
        message: 'Attestor registration submitted (pending approval)',
        attestor: record
      });
    } catch (error: any) {
      console.error('Attestor registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/attestors/:did/approve
   * Approve an attestor (Foundation action)
   */
  router.post('/pohw/attestors/:did/approve', (req: Request, res: Response) => {
    try {
      const { did } = req.params;
      const { nextAuditDue } = req.body;

      const record = attestorManager.approveAttestor(did, nextAuditDue);
      db.storeAttestor(did, record);
      db.appendAuditLog({
        timestamp: new Date().toISOString(),
        action: 'status_changed',
        attestorDID: did,
        details: `Attestor approved: ${record.name}`
      });

      res.json({
        message: 'Attestor approved',
        attestor: record
      });
    } catch (error: any) {
      console.error('Attestor approval error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/attestors/:did
   * Get attestor record
   */
  router.get('/pohw/attestors/:did', (req: Request, res: Response) => {
    try {
      const { did } = req.params;
      const attestor = attestorManager.getAttestor(did);

      if (!attestor) {
        return res.status(404).json({
          error: 'Attestor not found',
          did
        });
      }

      res.json(attestor);
    } catch (error: any) {
      console.error('Get attestor error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/attestors/credentials/issue
   * Issue a Verifiable Human Credential
   */
  router.post('/pohw/attestors/credentials/issue', (req: Request, res: Response) => {
    try {
      const { attestorDID, subjectDID, verificationMethod, assuranceLevel, policy, expirationDate } = req.body;

      if (!attestorDID || !subjectDID || !verificationMethod || !assuranceLevel) {
        return res.status(400).json({
          error: 'Missing required fields: attestorDID, subjectDID, verificationMethod, assuranceLevel'
        });
      }

      const credential = attestorManager.issueCredential(
        attestorDID,
        subjectDID,
        verificationMethod,
        assuranceLevel,
        policy,
        expirationDate
      );

      // Store in database
      if (credential.credentialHash) {
        db.storeCredential(credential.credentialHash, credential);
        db.appendAuditLog({
          timestamp: new Date().toISOString(),
          action: 'credential_issued',
          credentialHash: credential.credentialHash,
          attestorDID,
          details: `Credential issued to ${subjectDID}`
        });
      }

      res.status(201).json({
        message: 'Credential issued',
        credential
      });
    } catch (error: any) {
      console.error('Credential issuance error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/attestors/credentials/:hash
   * Get credential by hash
   */
  router.get('/pohw/attestors/credentials/:hash', (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const credential = attestorManager.getCredential(hash);

      if (!credential) {
        return res.status(404).json({
          error: 'Credential not found',
          hash
        });
      }

      const isValid = attestorManager.isCredentialValid(hash);
      const revocation = attestorManager.getRevocation(hash);

      res.json({
        credential,
        valid: isValid,
        revoked: !!revocation,
        revocation
      });
    } catch (error: any) {
      console.error('Get credential error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/attestors/credentials/:hash/revoke
   * Revoke a credential
   */
  router.post('/pohw/attestors/credentials/:hash/revoke', (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const { attestorDID, reason, metadata } = req.body;

      if (!attestorDID || !reason) {
        return res.status(400).json({
          error: 'Missing required fields: attestorDID, reason'
        });
      }

      const revocation = attestorManager.revokeCredential(hash, attestorDID, reason, metadata);

      // Store in database
      db.storeRevocation(hash, revocation);
      db.appendAuditLog({
        timestamp: new Date().toISOString(),
        action: 'credential_revoked',
        credentialHash: hash,
        attestorDID,
        details: `Credential revoked: ${reason}`
      });

      res.json({
        message: 'Credential revoked',
        revocation
      });
    } catch (error: any) {
      console.error('Credential revocation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/attestors/revocations
   * Get revocation list
   */
  router.get('/pohw/attestors/revocations', (req: Request, res: Response) => {
    try {
      const revocations = attestorManager.getRevocationList();
      res.json(revocations);
    } catch (error: any) {
      console.error('Get revocations error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /pohw/attestors/policies/verify
   * Verify multi-attestor policy compliance
   */
  router.post('/pohw/attestors/policies/verify', (req: Request, res: Response) => {
    try {
      const { credentialHashes, policyName } = req.body;

      if (!credentialHashes || !Array.isArray(credentialHashes)) {
        return res.status(400).json({
          error: 'Missing or invalid credentialHashes array'
        });
      }

      const result = attestorManager.verifyMultiAttestorPolicy(
        credentialHashes,
        policyName || 'green'
      );

      res.json(result);
    } catch (error: any) {
      console.error('Policy verification error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/attestors/audit
   * Get audit logs
   */
  router.get('/pohw/attestors/audit', (req: Request, res: Response) => {
    try {
      const { attestorDID, limit } = req.query;
      const logs = attestorManager.getAuditLogs(
        attestorDID as string,
        limit ? parseInt(limit as string) : 100
      );
      res.json(logs);
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/status
   * Get registry status
   */
  router.get('/pohw/status', (req: Request, res: Response) => {
    try {
      const latestBatch = db.getLatestBatch();
      const totalProofs = db.getTotalProofs();
      const pendingCount = db.getPendingCount();

      // Use authentic batch creation timestamp (PoHW integrity principle)
      // If no batch exists, use current time as fallback
      const timestamp = latestBatch?.created_at || new Date().toISOString();

      const status: RegistryStatus = {
        status: 'active',
        node: 'pohw-registry-node',
        protocol: 'Proof of Human Work',
        latest_hash: latestBatch?.root,
        timestamp: timestamp,
        total_proofs: totalProofs,
        pending_batch: pendingCount
      };

      res.json(status);
    } catch (error: any) {
      console.error('Status error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /pohw/reputation/:did
   * Get reputation for a DID
   */
  router.get('/pohw/reputation/:did', (req: Request, res: Response) => {
    try {
      const { did } = req.params;
      const reputation = fraudMitigation.getReputation(did);
      const stats = fraudMitigation.getSubmissionStats(did);
      const anomalies = fraudMitigation.getAnomalyLog(did);

      res.json({
        did,
        reputation,
        stats,
        anomalies: anomalies.slice(-10), // Last 10 anomalies
        hasRecentAnomalies: fraudMitigation.hasRecentAnomalies(did, 24)
      });
    } catch (error: any) {
      console.error('Get reputation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/reputation
   * Get all reputation records (for transparency)
   */
  router.get('/pohw/reputation', (req: Request, res: Response) => {
    try {
      const allReputation = db.getAllReputation();
      const result: any[] = [];

      for (const [did, reputation] of Object.entries(allReputation)) {
        const stats = fraudMitigation.getSubmissionStats(did);
        result.push({
          did,
          reputation,
          stats: {
            totalSubmissions: stats.totalSubmissions,
            submissionsLastHour: stats.submissionsLastHour,
            warnings: stats.warnings
          }
        });
      }

      res.json({
        total: result.length,
        reputations: result.sort((a, b) => b.reputation.score - a.reputation.score)
      });
    } catch (error: any) {
      console.error('Get all reputation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /pohw/rate-limit/:did
   * Check current rate limit status for a DID
   */
  router.get('/pohw/rate-limit/:did', (req: Request, res: Response) => {
    try {
      const { did } = req.params;
      const rateLimitResult = fraudMitigation.checkRateLimit(did);
      const stats = fraudMitigation.getSubmissionStats(did);

      res.json({
        did,
        rateLimit: rateLimitResult,
        stats
      });
    } catch (error: any) {
      console.error('Get rate limit error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  return router;
}

