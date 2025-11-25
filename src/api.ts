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

export function createAPIRouter(
  db: RegistryDatabase, 
  batcher: BatchManager,
  anchorConfig?: any
): Router {
  const router = Router();

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

      // Store proof
      const proofId = db.storeProof({
        hash: request.hash,
        signature: request.signature,
        did: request.did,
        timestamp: request.timestamp
      });

      // Generate receipt hash
      const receiptData = `${request.hash}-${request.did}-${request.timestamp}`;
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
      const hash = req.params.hash;

      const proof = db.getProofByHash(hash);

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
   * GET /pohw/proof/:hash
   * Get Merkle proof for a hash
   */
  router.get('/pohw/proof/:hash', (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
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


  return router;
}

