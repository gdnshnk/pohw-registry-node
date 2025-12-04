/**
 * Registry Synchronization Service
 * Implements peer-to-peer mirroring per whitepaper Section 7.2
 * "Each registry periodically mirrors its state to at least three peers"
 */

import { RegistryDatabase } from './database';
import { MerkleBatch, ProofRecord } from './types';
import { createHash } from 'crypto';

export interface PeerNode {
  /** Peer registry identifier */
  registryId: string;
  /** Peer API endpoint URL */
  endpoint: string;
  /** Last successful sync timestamp */
  lastSync?: string;
  /** Status: active, inactive, error */
  status: 'active' | 'inactive' | 'error';
  /** Geographic region (optional) */
  region?: string;
  /** Institution type (optional) */
  institutionType?: string;
}

export interface SyncStatus {
  /** Peer registry ID */
  peerId: string;
  /** Sync timestamp */
  timestamp: string;
  /** Latest Merkle root from peer */
  peerMerkleRoot: string;
  /** Our latest Merkle root */
  localMerkleRoot: string;
  /** Roots match? */
  rootsMatch: boolean;
  /** Number of proofs synced */
  proofsSynced: number;
  /** Number of batches synced */
  batchesSynced: number;
  /** Sync status */
  status: 'success' | 'partial' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface MerkleRootExchange {
  /** Registry ID */
  registryId: string;
  /** Latest Merkle root */
  merkleRoot: string;
  /** Batch ID for this root */
  batchId: string;
  /** Timestamp */
  timestamp: string;
  /** Total proofs */
  totalProofs: number;
  /** Total batches */
  totalBatches: number;
  /** Signature (optional) */
  signature?: string;
}

export class RegistrySynchronizationService {
  private db: RegistryDatabase;
  private registryId: string;
  private peers: PeerNode[] = [];
  private syncInterval: number; // milliseconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    db: RegistryDatabase,
    registryId: string = 'pohw-registry-node',
    syncInterval: number = 60 * 60 * 1000 // 1 hour
  ) {
    this.db = db;
    this.registryId = registryId;
    this.syncInterval = syncInterval;

    // Load peers from environment or default
    this.loadPeers();
  }

  /**
   * Load peer nodes from environment or configuration
   */
  private loadPeers(): void {
    // Default peers (can be overridden by environment)
    const defaultPeers: PeerNode[] = [
      {
        registryId: 'gdn.sh',
        endpoint: 'https://gdn.sh',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
      {
        registryId: 'proofofhumanwork.org',
        endpoint: 'https://proofofhumanwork.org',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
    ];

    // Load from environment variable (comma-separated)
    const peersEnv = process.env.REGISTRY_PEERS;
    if (peersEnv) {
      const peerUrls = peersEnv.split(',').map(url => url.trim());
      for (const url of peerUrls) {
        try {
          const urlObj = new URL(url);
          this.peers.push({
            registryId: urlObj.hostname,
            endpoint: url,
            status: 'active',
          });
        } catch (e) {
          console.warn(`[Sync] Invalid peer URL: ${url}`);
        }
      }
    } else {
      this.peers = defaultPeers;
    }

    console.log(`[Sync] Loaded ${this.peers.length} peer nodes`);
  }

  /**
   * Add a peer node
   */
  addPeer(peer: PeerNode): void {
    // Check if peer already exists
    const existing = this.peers.find(p => p.endpoint === peer.endpoint);
    if (existing) {
      existing.status = peer.status;
      existing.lastSync = peer.lastSync;
    } else {
      this.peers.push(peer);
    }
    console.log(`[Sync] Added peer: ${peer.registryId} (${peer.endpoint})`);
  }

  /**
   * Remove a peer node
   */
  removePeer(endpoint: string): void {
    this.peers = this.peers.filter(p => p.endpoint !== endpoint);
    console.log(`[Sync] Removed peer: ${endpoint}`);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerNode[] {
    return [...this.peers];
  }

  /**
   * Start periodic synchronization
   */
  start(): void {
    // Perform initial sync
    this.syncWithAllPeers().catch(err => {
      console.error('[Sync] Initial sync failed:', err);
    });

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('[Sync] Periodic sync failed:', err);
      });
    }, this.syncInterval);

    console.log(`[Sync] Synchronization service started (interval: ${this.syncInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Sync] Synchronization service stopped');
    }
  }

  /**
   * Synchronize with all peers
   */
  async syncWithAllPeers(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const peer of this.peers) {
      if (peer.status === 'active') {
        try {
          const status = await this.syncWithPeer(peer);
          results.push(status);
          
          // Update peer status
          peer.lastSync = status.timestamp;
          if (status.status === 'failed') {
            peer.status = 'error';
          } else {
            peer.status = 'active';
          }
        } catch (error: any) {
          console.error(`[Sync] Failed to sync with ${peer.registryId}:`, error.message);
          peer.status = 'error';
          results.push({
            peerId: peer.registryId,
            timestamp: new Date().toISOString(),
            peerMerkleRoot: '',
            localMerkleRoot: await this.getLocalMerkleRoot(),
            rootsMatch: false,
            proofsSynced: 0,
            batchesSynced: 0,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Synchronize with a single peer
   */
  async syncWithPeer(peer: PeerNode): Promise<SyncStatus> {
    console.log(`[Sync] Syncing with peer: ${peer.registryId} (${peer.endpoint})`);

    // Get local Merkle root
    const localMerkleRoot = await this.getLocalMerkleRoot();

    // Exchange Merkle roots with peer
    const peerRoot = await this.exchangeMerkleRoot(peer);

    // Compare roots
    const rootsMatch = localMerkleRoot === peerRoot.merkleRoot;

    let proofsSynced = 0;
    let batchesSynced = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';

    if (!rootsMatch) {
      // Roots don't match - need to sync
      console.log(`[Sync] Roots differ - syncing data from peer`);
      
      // Get missing proofs and batches from peer
      const syncResult = await this.syncMissingData(peer, peerRoot);
      proofsSynced = syncResult.proofsSynced;
      batchesSynced = syncResult.batchesSynced;
      status = syncResult.status;
    } else {
      console.log(`[Sync] Roots match - no sync needed`);
    }

    return {
      peerId: peer.registryId,
      timestamp: new Date().toISOString(),
      peerMerkleRoot: peerRoot.merkleRoot,
      localMerkleRoot: localMerkleRoot,
      rootsMatch: rootsMatch,
      proofsSynced: proofsSynced,
      batchesSynced: batchesSynced,
      status: status,
    };
  }

  /**
   * Exchange Merkle root with peer
   */
  private async exchangeMerkleRoot(peer: PeerNode): Promise<MerkleRootExchange> {
    try {
      // Call peer's API endpoint
      const response = await fetch(`${peer.endpoint}/pohw/sync/merkle-root`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MerkleRootExchange;
    } catch (error: any) {
      throw new Error(`Failed to exchange Merkle root with ${peer.registryId}: ${error.message}`);
    }
  }

  /**
   * Get local Merkle root
   */
  private async getLocalMerkleRoot(): Promise<string> {
    const latestBatch = await this.db.getLatestBatch();
    return latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Sync missing data from peer
   */
  private async syncMissingData(
    peer: PeerNode,
    peerRoot: MerkleRootExchange
  ): Promise<{ proofsSynced: number; batchesSynced: number; status: 'success' | 'partial' | 'failed' }> {
    let proofsSynced = 0;
    let batchesSynced = 0;

    try {
      // Get list of missing proofs from peer
      const localTotal = await this.db.getTotalProofs();
      
      if (peerRoot.totalProofs > localTotal) {
        // Peer has more proofs - request missing ones
        const missingCount = peerRoot.totalProofs - localTotal;
        console.log(`[Sync] Peer has ${missingCount} more proofs - requesting...`);

        // Request missing proofs (simplified - would need pagination in production)
        const response = await fetch(`${peer.endpoint}/pohw/sync/proofs?since=${localTotal}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const proofs = await response.json() as ProofRecord[];
          for (const proof of proofs) {
            // Check if proof already exists
            const existing = await this.db.getProofByHash(proof.hash);
            if (!existing) {
              // Store proof (without id and submitted_at - let DB generate)
              const { id, submitted_at, ...proofData } = proof;
              await this.db.storeProof(proofData);
              proofsSynced++;
            }
          }
        }
      }

      // Get missing batches
      const localBatches = await this.db.getAllBatches();
      const localBatchIds = new Set(localBatches.map(b => b.id));

      const batchesResponse = await fetch(`${peer.endpoint}/pohw/sync/batches`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (batchesResponse.ok) {
        const batches = await batchesResponse.json() as MerkleBatch[];
        for (const batch of batches) {
          if (!localBatchIds.has(batch.id)) {
            // Store batch (storeMerkleBatch expects Omit<MerkleBatch, 'created_at'>)
            await this.db.storeMerkleBatch({
              id: batch.id,
              root: batch.root,
              size: batch.size,
              anchored_at: batch.anchored_at,
              anchor_tx: batch.anchor_tx,
              anchor_chain: batch.anchor_chain,
            });
            batchesSynced++;
          }
        }
      }

      const status = proofsSynced > 0 || batchesSynced > 0 ? 'success' : 'partial';
      return { proofsSynced, batchesSynced, status };
    } catch (error: any) {
      console.error(`[Sync] Failed to sync missing data:`, error);
      return { proofsSynced, batchesSynced, status: 'failed' };
    }
  }

  /**
   * Get synchronization status for all peers
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncWithAllPeers();
  }

  /**
   * Get our Merkle root for exchange
   */
  async getMerkleRootForExchange(): Promise<MerkleRootExchange> {
    const latestBatch = await this.db.getLatestBatch();
    const totalProofs = await this.db.getTotalProofs();
    const allBatches = await this.db.getAllBatches();

    return {
      registryId: this.registryId,
      merkleRoot: latestBatch?.root || '0x0',
      batchId: latestBatch?.id || '',
      timestamp: new Date().toISOString(),
      totalProofs: totalProofs,
      totalBatches: allBatches.length,
    };
  }
}

/**
 * Implements peer-to-peer mirroring per whitepaper Section 7.2
 * "Each registry periodically mirrors its state to at least three peers"
 */

import { RegistryDatabase } from './database';
import { MerkleBatch, ProofRecord } from './types';
import { createHash } from 'crypto';

export interface PeerNode {
  /** Peer registry identifier */
  registryId: string;
  /** Peer API endpoint URL */
  endpoint: string;
  /** Last successful sync timestamp */
  lastSync?: string;
  /** Status: active, inactive, error */
  status: 'active' | 'inactive' | 'error';
  /** Geographic region (optional) */
  region?: string;
  /** Institution type (optional) */
  institutionType?: string;
}

export interface SyncStatus {
  /** Peer registry ID */
  peerId: string;
  /** Sync timestamp */
  timestamp: string;
  /** Latest Merkle root from peer */
  peerMerkleRoot: string;
  /** Our latest Merkle root */
  localMerkleRoot: string;
  /** Roots match? */
  rootsMatch: boolean;
  /** Number of proofs synced */
  proofsSynced: number;
  /** Number of batches synced */
  batchesSynced: number;
  /** Sync status */
  status: 'success' | 'partial' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface MerkleRootExchange {
  /** Registry ID */
  registryId: string;
  /** Latest Merkle root */
  merkleRoot: string;
  /** Batch ID for this root */
  batchId: string;
  /** Timestamp */
  timestamp: string;
  /** Total proofs */
  totalProofs: number;
  /** Total batches */
  totalBatches: number;
  /** Signature (optional) */
  signature?: string;
}

export class RegistrySynchronizationService {
  private db: RegistryDatabase;
  private registryId: string;
  private peers: PeerNode[] = [];
  private syncInterval: number; // milliseconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    db: RegistryDatabase,
    registryId: string = 'pohw-registry-node',
    syncInterval: number = 60 * 60 * 1000 // 1 hour
  ) {
    this.db = db;
    this.registryId = registryId;
    this.syncInterval = syncInterval;

    // Load peers from environment or default
    this.loadPeers();
  }

  /**
   * Load peer nodes from environment or configuration
   */
  private loadPeers(): void {
    // Default peers (can be overridden by environment)
    const defaultPeers: PeerNode[] = [
      {
        registryId: 'gdn.sh',
        endpoint: 'https://gdn.sh',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
      {
        registryId: 'proofofhumanwork.org',
        endpoint: 'https://proofofhumanwork.org',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
    ];

    // Load from environment variable (comma-separated)
    const peersEnv = process.env.REGISTRY_PEERS;
    if (peersEnv) {
      const peerUrls = peersEnv.split(',').map(url => url.trim());
      for (const url of peerUrls) {
        try {
          const urlObj = new URL(url);
          this.peers.push({
            registryId: urlObj.hostname,
            endpoint: url,
            status: 'active',
          });
        } catch (e) {
          console.warn(`[Sync] Invalid peer URL: ${url}`);
        }
      }
    } else {
      this.peers = defaultPeers;
    }

    console.log(`[Sync] Loaded ${this.peers.length} peer nodes`);
  }

  /**
   * Add a peer node
   */
  addPeer(peer: PeerNode): void {
    // Check if peer already exists
    const existing = this.peers.find(p => p.endpoint === peer.endpoint);
    if (existing) {
      existing.status = peer.status;
      existing.lastSync = peer.lastSync;
    } else {
      this.peers.push(peer);
    }
    console.log(`[Sync] Added peer: ${peer.registryId} (${peer.endpoint})`);
  }

  /**
   * Remove a peer node
   */
  removePeer(endpoint: string): void {
    this.peers = this.peers.filter(p => p.endpoint !== endpoint);
    console.log(`[Sync] Removed peer: ${endpoint}`);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerNode[] {
    return [...this.peers];
  }

  /**
   * Start periodic synchronization
   */
  start(): void {
    // Perform initial sync
    this.syncWithAllPeers().catch(err => {
      console.error('[Sync] Initial sync failed:', err);
    });

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('[Sync] Periodic sync failed:', err);
      });
    }, this.syncInterval);

    console.log(`[Sync] Synchronization service started (interval: ${this.syncInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Sync] Synchronization service stopped');
    }
  }

  /**
   * Synchronize with all peers
   */
  async syncWithAllPeers(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const peer of this.peers) {
      if (peer.status === 'active') {
        try {
          const status = await this.syncWithPeer(peer);
          results.push(status);
          
          // Update peer status
          peer.lastSync = status.timestamp;
          if (status.status === 'failed') {
            peer.status = 'error';
          } else {
            peer.status = 'active';
          }
        } catch (error: any) {
          console.error(`[Sync] Failed to sync with ${peer.registryId}:`, error.message);
          peer.status = 'error';
          results.push({
            peerId: peer.registryId,
            timestamp: new Date().toISOString(),
            peerMerkleRoot: '',
            localMerkleRoot: await this.getLocalMerkleRoot(),
            rootsMatch: false,
            proofsSynced: 0,
            batchesSynced: 0,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Synchronize with a single peer
   */
  async syncWithPeer(peer: PeerNode): Promise<SyncStatus> {
    console.log(`[Sync] Syncing with peer: ${peer.registryId} (${peer.endpoint})`);

    // Get local Merkle root
    const localMerkleRoot = await this.getLocalMerkleRoot();

    // Exchange Merkle roots with peer
    const peerRoot = await this.exchangeMerkleRoot(peer);

    // Compare roots
    const rootsMatch = localMerkleRoot === peerRoot.merkleRoot;

    let proofsSynced = 0;
    let batchesSynced = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';

    if (!rootsMatch) {
      // Roots don't match - need to sync
      console.log(`[Sync] Roots differ - syncing data from peer`);
      
      // Get missing proofs and batches from peer
      const syncResult = await this.syncMissingData(peer, peerRoot);
      proofsSynced = syncResult.proofsSynced;
      batchesSynced = syncResult.batchesSynced;
      status = syncResult.status;
    } else {
      console.log(`[Sync] Roots match - no sync needed`);
    }

    return {
      peerId: peer.registryId,
      timestamp: new Date().toISOString(),
      peerMerkleRoot: peerRoot.merkleRoot,
      localMerkleRoot: localMerkleRoot,
      rootsMatch: rootsMatch,
      proofsSynced: proofsSynced,
      batchesSynced: batchesSynced,
      status: status,
    };
  }

  /**
   * Exchange Merkle root with peer
   */
  private async exchangeMerkleRoot(peer: PeerNode): Promise<MerkleRootExchange> {
    try {
      // Call peer's API endpoint
      const response = await fetch(`${peer.endpoint}/pohw/sync/merkle-root`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MerkleRootExchange;
    } catch (error: any) {
      throw new Error(`Failed to exchange Merkle root with ${peer.registryId}: ${error.message}`);
    }
  }

  /**
   * Get local Merkle root
   */
  private async getLocalMerkleRoot(): Promise<string> {
    const latestBatch = await this.db.getLatestBatch();
    return latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Sync missing data from peer
   */
  private async syncMissingData(
    peer: PeerNode,
    peerRoot: MerkleRootExchange
  ): Promise<{ proofsSynced: number; batchesSynced: number; status: 'success' | 'partial' | 'failed' }> {
    let proofsSynced = 0;
    let batchesSynced = 0;

    try {
      // Get list of missing proofs from peer
      const localTotal = await this.db.getTotalProofs();
      
      if (peerRoot.totalProofs > localTotal) {
        // Peer has more proofs - request missing ones
        const missingCount = peerRoot.totalProofs - localTotal;
        console.log(`[Sync] Peer has ${missingCount} more proofs - requesting...`);

        // Request missing proofs (simplified - would need pagination in production)
        const response = await fetch(`${peer.endpoint}/pohw/sync/proofs?since=${localTotal}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const proofs = await response.json() as ProofRecord[];
          for (const proof of proofs) {
            // Check if proof already exists
            const existing = await this.db.getProofByHash(proof.hash);
            if (!existing) {
              // Store proof (without id and submitted_at - let DB generate)
              const { id, submitted_at, ...proofData } = proof;
              await this.db.storeProof(proofData);
              proofsSynced++;
            }
          }
        }
      }

      // Get missing batches
      const localBatches = await this.db.getAllBatches();
      const localBatchIds = new Set(localBatches.map(b => b.id));

      const batchesResponse = await fetch(`${peer.endpoint}/pohw/sync/batches`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (batchesResponse.ok) {
        const batches = await batchesResponse.json() as MerkleBatch[];
        for (const batch of batches) {
          if (!localBatchIds.has(batch.id)) {
            // Store batch (storeMerkleBatch expects Omit<MerkleBatch, 'created_at'>)
            await this.db.storeMerkleBatch({
              id: batch.id,
              root: batch.root,
              size: batch.size,
              anchored_at: batch.anchored_at,
              anchor_tx: batch.anchor_tx,
              anchor_chain: batch.anchor_chain,
            });
            batchesSynced++;
          }
        }
      }

      const status = proofsSynced > 0 || batchesSynced > 0 ? 'success' : 'partial';
      return { proofsSynced, batchesSynced, status };
    } catch (error: any) {
      console.error(`[Sync] Failed to sync missing data:`, error);
      return { proofsSynced, batchesSynced, status: 'failed' };
    }
  }

  /**
   * Get synchronization status for all peers
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncWithAllPeers();
  }

  /**
   * Get our Merkle root for exchange
   */
  async getMerkleRootForExchange(): Promise<MerkleRootExchange> {
    const latestBatch = await this.db.getLatestBatch();
    const totalProofs = await this.db.getTotalProofs();
    const allBatches = await this.db.getAllBatches();

    return {
      registryId: this.registryId,
      merkleRoot: latestBatch?.root || '0x0',
      batchId: latestBatch?.id || '',
      timestamp: new Date().toISOString(),
      totalProofs: totalProofs,
      totalBatches: allBatches.length,
    };
  }
}

/**
 * Implements peer-to-peer mirroring per whitepaper Section 7.2
 * "Each registry periodically mirrors its state to at least three peers"
 */

import { RegistryDatabase } from './database';
import { MerkleBatch, ProofRecord } from './types';
import { createHash } from 'crypto';

export interface PeerNode {
  /** Peer registry identifier */
  registryId: string;
  /** Peer API endpoint URL */
  endpoint: string;
  /** Last successful sync timestamp */
  lastSync?: string;
  /** Status: active, inactive, error */
  status: 'active' | 'inactive' | 'error';
  /** Geographic region (optional) */
  region?: string;
  /** Institution type (optional) */
  institutionType?: string;
}

export interface SyncStatus {
  /** Peer registry ID */
  peerId: string;
  /** Sync timestamp */
  timestamp: string;
  /** Latest Merkle root from peer */
  peerMerkleRoot: string;
  /** Our latest Merkle root */
  localMerkleRoot: string;
  /** Roots match? */
  rootsMatch: boolean;
  /** Number of proofs synced */
  proofsSynced: number;
  /** Number of batches synced */
  batchesSynced: number;
  /** Sync status */
  status: 'success' | 'partial' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface MerkleRootExchange {
  /** Registry ID */
  registryId: string;
  /** Latest Merkle root */
  merkleRoot: string;
  /** Batch ID for this root */
  batchId: string;
  /** Timestamp */
  timestamp: string;
  /** Total proofs */
  totalProofs: number;
  /** Total batches */
  totalBatches: number;
  /** Signature (optional) */
  signature?: string;
}

export class RegistrySynchronizationService {
  private db: RegistryDatabase;
  private registryId: string;
  private peers: PeerNode[] = [];
  private syncInterval: number; // milliseconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    db: RegistryDatabase,
    registryId: string = 'pohw-registry-node',
    syncInterval: number = 60 * 60 * 1000 // 1 hour
  ) {
    this.db = db;
    this.registryId = registryId;
    this.syncInterval = syncInterval;

    // Load peers from environment or default
    this.loadPeers();
  }

  /**
   * Load peer nodes from environment or configuration
   */
  private loadPeers(): void {
    // Default peers (can be overridden by environment)
    const defaultPeers: PeerNode[] = [
      {
        registryId: 'gdn.sh',
        endpoint: 'https://gdn.sh',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
      {
        registryId: 'proofofhumanwork.org',
        endpoint: 'https://proofofhumanwork.org',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
    ];

    // Load from environment variable (comma-separated)
    const peersEnv = process.env.REGISTRY_PEERS;
    if (peersEnv) {
      const peerUrls = peersEnv.split(',').map(url => url.trim());
      for (const url of peerUrls) {
        try {
          const urlObj = new URL(url);
          this.peers.push({
            registryId: urlObj.hostname,
            endpoint: url,
            status: 'active',
          });
        } catch (e) {
          console.warn(`[Sync] Invalid peer URL: ${url}`);
        }
      }
    } else {
      this.peers = defaultPeers;
    }

    console.log(`[Sync] Loaded ${this.peers.length} peer nodes`);
  }

  /**
   * Add a peer node
   */
  addPeer(peer: PeerNode): void {
    // Check if peer already exists
    const existing = this.peers.find(p => p.endpoint === peer.endpoint);
    if (existing) {
      existing.status = peer.status;
      existing.lastSync = peer.lastSync;
    } else {
      this.peers.push(peer);
    }
    console.log(`[Sync] Added peer: ${peer.registryId} (${peer.endpoint})`);
  }

  /**
   * Remove a peer node
   */
  removePeer(endpoint: string): void {
    this.peers = this.peers.filter(p => p.endpoint !== endpoint);
    console.log(`[Sync] Removed peer: ${endpoint}`);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerNode[] {
    return [...this.peers];
  }

  /**
   * Start periodic synchronization
   */
  start(): void {
    // Perform initial sync
    this.syncWithAllPeers().catch(err => {
      console.error('[Sync] Initial sync failed:', err);
    });

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('[Sync] Periodic sync failed:', err);
      });
    }, this.syncInterval);

    console.log(`[Sync] Synchronization service started (interval: ${this.syncInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Sync] Synchronization service stopped');
    }
  }

  /**
   * Synchronize with all peers
   */
  async syncWithAllPeers(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const peer of this.peers) {
      if (peer.status === 'active') {
        try {
          const status = await this.syncWithPeer(peer);
          results.push(status);
          
          // Update peer status
          peer.lastSync = status.timestamp;
          if (status.status === 'failed') {
            peer.status = 'error';
          } else {
            peer.status = 'active';
          }
        } catch (error: any) {
          console.error(`[Sync] Failed to sync with ${peer.registryId}:`, error.message);
          peer.status = 'error';
          results.push({
            peerId: peer.registryId,
            timestamp: new Date().toISOString(),
            peerMerkleRoot: '',
            localMerkleRoot: await this.getLocalMerkleRoot(),
            rootsMatch: false,
            proofsSynced: 0,
            batchesSynced: 0,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Synchronize with a single peer
   */
  async syncWithPeer(peer: PeerNode): Promise<SyncStatus> {
    console.log(`[Sync] Syncing with peer: ${peer.registryId} (${peer.endpoint})`);

    // Get local Merkle root
    const localMerkleRoot = await this.getLocalMerkleRoot();

    // Exchange Merkle roots with peer
    const peerRoot = await this.exchangeMerkleRoot(peer);

    // Compare roots
    const rootsMatch = localMerkleRoot === peerRoot.merkleRoot;

    let proofsSynced = 0;
    let batchesSynced = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';

    if (!rootsMatch) {
      // Roots don't match - need to sync
      console.log(`[Sync] Roots differ - syncing data from peer`);
      
      // Get missing proofs and batches from peer
      const syncResult = await this.syncMissingData(peer, peerRoot);
      proofsSynced = syncResult.proofsSynced;
      batchesSynced = syncResult.batchesSynced;
      status = syncResult.status;
    } else {
      console.log(`[Sync] Roots match - no sync needed`);
    }

    return {
      peerId: peer.registryId,
      timestamp: new Date().toISOString(),
      peerMerkleRoot: peerRoot.merkleRoot,
      localMerkleRoot: localMerkleRoot,
      rootsMatch: rootsMatch,
      proofsSynced: proofsSynced,
      batchesSynced: batchesSynced,
      status: status,
    };
  }

  /**
   * Exchange Merkle root with peer
   */
  private async exchangeMerkleRoot(peer: PeerNode): Promise<MerkleRootExchange> {
    try {
      // Call peer's API endpoint
      const response = await fetch(`${peer.endpoint}/pohw/sync/merkle-root`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MerkleRootExchange;
    } catch (error: any) {
      throw new Error(`Failed to exchange Merkle root with ${peer.registryId}: ${error.message}`);
    }
  }

  /**
   * Get local Merkle root
   */
  private async getLocalMerkleRoot(): Promise<string> {
    const latestBatch = await this.db.getLatestBatch();
    return latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Sync missing data from peer
   */
  private async syncMissingData(
    peer: PeerNode,
    peerRoot: MerkleRootExchange
  ): Promise<{ proofsSynced: number; batchesSynced: number; status: 'success' | 'partial' | 'failed' }> {
    let proofsSynced = 0;
    let batchesSynced = 0;

    try {
      // Get list of missing proofs from peer
      const localTotal = await this.db.getTotalProofs();
      
      if (peerRoot.totalProofs > localTotal) {
        // Peer has more proofs - request missing ones
        const missingCount = peerRoot.totalProofs - localTotal;
        console.log(`[Sync] Peer has ${missingCount} more proofs - requesting...`);

        // Request missing proofs (simplified - would need pagination in production)
        const response = await fetch(`${peer.endpoint}/pohw/sync/proofs?since=${localTotal}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const proofs = await response.json() as ProofRecord[];
          for (const proof of proofs) {
            // Check if proof already exists
            const existing = await this.db.getProofByHash(proof.hash);
            if (!existing) {
              // Store proof (without id and submitted_at - let DB generate)
              const { id, submitted_at, ...proofData } = proof;
              await this.db.storeProof(proofData);
              proofsSynced++;
            }
          }
        }
      }

      // Get missing batches
      const localBatches = await this.db.getAllBatches();
      const localBatchIds = new Set(localBatches.map(b => b.id));

      const batchesResponse = await fetch(`${peer.endpoint}/pohw/sync/batches`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (batchesResponse.ok) {
        const batches = await batchesResponse.json() as MerkleBatch[];
        for (const batch of batches) {
          if (!localBatchIds.has(batch.id)) {
            // Store batch (storeMerkleBatch expects Omit<MerkleBatch, 'created_at'>)
            await this.db.storeMerkleBatch({
              id: batch.id,
              root: batch.root,
              size: batch.size,
              anchored_at: batch.anchored_at,
              anchor_tx: batch.anchor_tx,
              anchor_chain: batch.anchor_chain,
            });
            batchesSynced++;
          }
        }
      }

      const status = proofsSynced > 0 || batchesSynced > 0 ? 'success' : 'partial';
      return { proofsSynced, batchesSynced, status };
    } catch (error: any) {
      console.error(`[Sync] Failed to sync missing data:`, error);
      return { proofsSynced, batchesSynced, status: 'failed' };
    }
  }

  /**
   * Get synchronization status for all peers
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncWithAllPeers();
  }

  /**
   * Get our Merkle root for exchange
   */
  async getMerkleRootForExchange(): Promise<MerkleRootExchange> {
    const latestBatch = await this.db.getLatestBatch();
    const totalProofs = await this.db.getTotalProofs();
    const allBatches = await this.db.getAllBatches();

    return {
      registryId: this.registryId,
      merkleRoot: latestBatch?.root || '0x0',
      batchId: latestBatch?.id || '',
      timestamp: new Date().toISOString(),
      totalProofs: totalProofs,
      totalBatches: allBatches.length,
    };
  }
}

/**
 * Implements peer-to-peer mirroring per whitepaper Section 7.2
 * "Each registry periodically mirrors its state to at least three peers"
 */

import { RegistryDatabase } from './database';
import { MerkleBatch, ProofRecord } from './types';
import { createHash } from 'crypto';

export interface PeerNode {
  /** Peer registry identifier */
  registryId: string;
  /** Peer API endpoint URL */
  endpoint: string;
  /** Last successful sync timestamp */
  lastSync?: string;
  /** Status: active, inactive, error */
  status: 'active' | 'inactive' | 'error';
  /** Geographic region (optional) */
  region?: string;
  /** Institution type (optional) */
  institutionType?: string;
}

export interface SyncStatus {
  /** Peer registry ID */
  peerId: string;
  /** Sync timestamp */
  timestamp: string;
  /** Latest Merkle root from peer */
  peerMerkleRoot: string;
  /** Our latest Merkle root */
  localMerkleRoot: string;
  /** Roots match? */
  rootsMatch: boolean;
  /** Number of proofs synced */
  proofsSynced: number;
  /** Number of batches synced */
  batchesSynced: number;
  /** Sync status */
  status: 'success' | 'partial' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface MerkleRootExchange {
  /** Registry ID */
  registryId: string;
  /** Latest Merkle root */
  merkleRoot: string;
  /** Batch ID for this root */
  batchId: string;
  /** Timestamp */
  timestamp: string;
  /** Total proofs */
  totalProofs: number;
  /** Total batches */
  totalBatches: number;
  /** Signature (optional) */
  signature?: string;
}

export class RegistrySynchronizationService {
  private db: RegistryDatabase;
  private registryId: string;
  private peers: PeerNode[] = [];
  private syncInterval: number; // milliseconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    db: RegistryDatabase,
    registryId: string = 'pohw-registry-node',
    syncInterval: number = 60 * 60 * 1000 // 1 hour
  ) {
    this.db = db;
    this.registryId = registryId;
    this.syncInterval = syncInterval;

    // Load peers from environment or default
    this.loadPeers();
  }

  /**
   * Load peer nodes from environment or configuration
   */
  private loadPeers(): void {
    // Default peers (can be overridden by environment)
    const defaultPeers: PeerNode[] = [
      {
        registryId: 'gdn.sh',
        endpoint: 'https://gdn.sh',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
      {
        registryId: 'proofofhumanwork.org',
        endpoint: 'https://proofofhumanwork.org',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
    ];

    // Load from environment variable (comma-separated)
    const peersEnv = process.env.REGISTRY_PEERS;
    if (peersEnv) {
      const peerUrls = peersEnv.split(',').map(url => url.trim());
      for (const url of peerUrls) {
        try {
          const urlObj = new URL(url);
          this.peers.push({
            registryId: urlObj.hostname,
            endpoint: url,
            status: 'active',
          });
        } catch (e) {
          console.warn(`[Sync] Invalid peer URL: ${url}`);
        }
      }
    } else {
      this.peers = defaultPeers;
    }

    console.log(`[Sync] Loaded ${this.peers.length} peer nodes`);
  }

  /**
   * Add a peer node
   */
  addPeer(peer: PeerNode): void {
    // Check if peer already exists
    const existing = this.peers.find(p => p.endpoint === peer.endpoint);
    if (existing) {
      existing.status = peer.status;
      existing.lastSync = peer.lastSync;
    } else {
      this.peers.push(peer);
    }
    console.log(`[Sync] Added peer: ${peer.registryId} (${peer.endpoint})`);
  }

  /**
   * Remove a peer node
   */
  removePeer(endpoint: string): void {
    this.peers = this.peers.filter(p => p.endpoint !== endpoint);
    console.log(`[Sync] Removed peer: ${endpoint}`);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerNode[] {
    return [...this.peers];
  }

  /**
   * Start periodic synchronization
   */
  start(): void {
    // Perform initial sync
    this.syncWithAllPeers().catch(err => {
      console.error('[Sync] Initial sync failed:', err);
    });

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('[Sync] Periodic sync failed:', err);
      });
    }, this.syncInterval);

    console.log(`[Sync] Synchronization service started (interval: ${this.syncInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Sync] Synchronization service stopped');
    }
  }

  /**
   * Synchronize with all peers
   */
  async syncWithAllPeers(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const peer of this.peers) {
      if (peer.status === 'active') {
        try {
          const status = await this.syncWithPeer(peer);
          results.push(status);
          
          // Update peer status
          peer.lastSync = status.timestamp;
          if (status.status === 'failed') {
            peer.status = 'error';
          } else {
            peer.status = 'active';
          }
        } catch (error: any) {
          console.error(`[Sync] Failed to sync with ${peer.registryId}:`, error.message);
          peer.status = 'error';
          results.push({
            peerId: peer.registryId,
            timestamp: new Date().toISOString(),
            peerMerkleRoot: '',
            localMerkleRoot: await this.getLocalMerkleRoot(),
            rootsMatch: false,
            proofsSynced: 0,
            batchesSynced: 0,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Synchronize with a single peer
   */
  async syncWithPeer(peer: PeerNode): Promise<SyncStatus> {
    console.log(`[Sync] Syncing with peer: ${peer.registryId} (${peer.endpoint})`);

    // Get local Merkle root
    const localMerkleRoot = await this.getLocalMerkleRoot();

    // Exchange Merkle roots with peer
    const peerRoot = await this.exchangeMerkleRoot(peer);

    // Compare roots
    const rootsMatch = localMerkleRoot === peerRoot.merkleRoot;

    let proofsSynced = 0;
    let batchesSynced = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';

    if (!rootsMatch) {
      // Roots don't match - need to sync
      console.log(`[Sync] Roots differ - syncing data from peer`);
      
      // Get missing proofs and batches from peer
      const syncResult = await this.syncMissingData(peer, peerRoot);
      proofsSynced = syncResult.proofsSynced;
      batchesSynced = syncResult.batchesSynced;
      status = syncResult.status;
    } else {
      console.log(`[Sync] Roots match - no sync needed`);
    }

    return {
      peerId: peer.registryId,
      timestamp: new Date().toISOString(),
      peerMerkleRoot: peerRoot.merkleRoot,
      localMerkleRoot: localMerkleRoot,
      rootsMatch: rootsMatch,
      proofsSynced: proofsSynced,
      batchesSynced: batchesSynced,
      status: status,
    };
  }

  /**
   * Exchange Merkle root with peer
   */
  private async exchangeMerkleRoot(peer: PeerNode): Promise<MerkleRootExchange> {
    try {
      // Call peer's API endpoint
      const response = await fetch(`${peer.endpoint}/pohw/sync/merkle-root`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MerkleRootExchange;
    } catch (error: any) {
      throw new Error(`Failed to exchange Merkle root with ${peer.registryId}: ${error.message}`);
    }
  }

  /**
   * Get local Merkle root
   */
  private async getLocalMerkleRoot(): Promise<string> {
    const latestBatch = await this.db.getLatestBatch();
    return latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Sync missing data from peer
   */
  private async syncMissingData(
    peer: PeerNode,
    peerRoot: MerkleRootExchange
  ): Promise<{ proofsSynced: number; batchesSynced: number; status: 'success' | 'partial' | 'failed' }> {
    let proofsSynced = 0;
    let batchesSynced = 0;

    try {
      // Get list of missing proofs from peer
      const localTotal = await this.db.getTotalProofs();
      
      if (peerRoot.totalProofs > localTotal) {
        // Peer has more proofs - request missing ones
        const missingCount = peerRoot.totalProofs - localTotal;
        console.log(`[Sync] Peer has ${missingCount} more proofs - requesting...`);

        // Request missing proofs (simplified - would need pagination in production)
        const response = await fetch(`${peer.endpoint}/pohw/sync/proofs?since=${localTotal}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const proofs = await response.json() as ProofRecord[];
          for (const proof of proofs) {
            // Check if proof already exists
            const existing = await this.db.getProofByHash(proof.hash);
            if (!existing) {
              // Store proof (without id and submitted_at - let DB generate)
              const { id, submitted_at, ...proofData } = proof;
              await this.db.storeProof(proofData);
              proofsSynced++;
            }
          }
        }
      }

      // Get missing batches
      const localBatches = await this.db.getAllBatches();
      const localBatchIds = new Set(localBatches.map(b => b.id));

      const batchesResponse = await fetch(`${peer.endpoint}/pohw/sync/batches`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (batchesResponse.ok) {
        const batches = await batchesResponse.json() as MerkleBatch[];
        for (const batch of batches) {
          if (!localBatchIds.has(batch.id)) {
            // Store batch (storeMerkleBatch expects Omit<MerkleBatch, 'created_at'>)
            await this.db.storeMerkleBatch({
              id: batch.id,
              root: batch.root,
              size: batch.size,
              anchored_at: batch.anchored_at,
              anchor_tx: batch.anchor_tx,
              anchor_chain: batch.anchor_chain,
            });
            batchesSynced++;
          }
        }
      }

      const status = proofsSynced > 0 || batchesSynced > 0 ? 'success' : 'partial';
      return { proofsSynced, batchesSynced, status };
    } catch (error: any) {
      console.error(`[Sync] Failed to sync missing data:`, error);
      return { proofsSynced, batchesSynced, status: 'failed' };
    }
  }

  /**
   * Get synchronization status for all peers
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncWithAllPeers();
  }

  /**
   * Get our Merkle root for exchange
   */
  async getMerkleRootForExchange(): Promise<MerkleRootExchange> {
    const latestBatch = await this.db.getLatestBatch();
    const totalProofs = await this.db.getTotalProofs();
    const allBatches = await this.db.getAllBatches();

    return {
      registryId: this.registryId,
      merkleRoot: latestBatch?.root || '0x0',
      batchId: latestBatch?.id || '',
      timestamp: new Date().toISOString(),
      totalProofs: totalProofs,
      totalBatches: allBatches.length,
    };
  }
}

/**
 * Implements peer-to-peer mirroring per whitepaper Section 7.2
 * "Each registry periodically mirrors its state to at least three peers"
 */

import { RegistryDatabase } from './database';
import { MerkleBatch, ProofRecord } from './types';
import { createHash } from 'crypto';

export interface PeerNode {
  /** Peer registry identifier */
  registryId: string;
  /** Peer API endpoint URL */
  endpoint: string;
  /** Last successful sync timestamp */
  lastSync?: string;
  /** Status: active, inactive, error */
  status: 'active' | 'inactive' | 'error';
  /** Geographic region (optional) */
  region?: string;
  /** Institution type (optional) */
  institutionType?: string;
}

export interface SyncStatus {
  /** Peer registry ID */
  peerId: string;
  /** Sync timestamp */
  timestamp: string;
  /** Latest Merkle root from peer */
  peerMerkleRoot: string;
  /** Our latest Merkle root */
  localMerkleRoot: string;
  /** Roots match? */
  rootsMatch: boolean;
  /** Number of proofs synced */
  proofsSynced: number;
  /** Number of batches synced */
  batchesSynced: number;
  /** Sync status */
  status: 'success' | 'partial' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface MerkleRootExchange {
  /** Registry ID */
  registryId: string;
  /** Latest Merkle root */
  merkleRoot: string;
  /** Batch ID for this root */
  batchId: string;
  /** Timestamp */
  timestamp: string;
  /** Total proofs */
  totalProofs: number;
  /** Total batches */
  totalBatches: number;
  /** Signature (optional) */
  signature?: string;
}

export class RegistrySynchronizationService {
  private db: RegistryDatabase;
  private registryId: string;
  private peers: PeerNode[] = [];
  private syncInterval: number; // milliseconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    db: RegistryDatabase,
    registryId: string = 'pohw-registry-node',
    syncInterval: number = 60 * 60 * 1000 // 1 hour
  ) {
    this.db = db;
    this.registryId = registryId;
    this.syncInterval = syncInterval;

    // Load peers from environment or default
    this.loadPeers();
  }

  /**
   * Load peer nodes from environment or configuration
   */
  private loadPeers(): void {
    // Default peers (can be overridden by environment)
    const defaultPeers: PeerNode[] = [
      {
        registryId: 'gdn.sh',
        endpoint: 'https://gdn.sh',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
      {
        registryId: 'proofofhumanwork.org',
        endpoint: 'https://proofofhumanwork.org',
        status: 'active',
        region: 'US',
        institutionType: 'foundation',
      },
    ];

    // Load from environment variable (comma-separated)
    const peersEnv = process.env.REGISTRY_PEERS;
    if (peersEnv) {
      const peerUrls = peersEnv.split(',').map(url => url.trim());
      for (const url of peerUrls) {
        try {
          const urlObj = new URL(url);
          this.peers.push({
            registryId: urlObj.hostname,
            endpoint: url,
            status: 'active',
          });
        } catch (e) {
          console.warn(`[Sync] Invalid peer URL: ${url}`);
        }
      }
    } else {
      this.peers = defaultPeers;
    }

    console.log(`[Sync] Loaded ${this.peers.length} peer nodes`);
  }

  /**
   * Add a peer node
   */
  addPeer(peer: PeerNode): void {
    // Check if peer already exists
    const existing = this.peers.find(p => p.endpoint === peer.endpoint);
    if (existing) {
      existing.status = peer.status;
      existing.lastSync = peer.lastSync;
    } else {
      this.peers.push(peer);
    }
    console.log(`[Sync] Added peer: ${peer.registryId} (${peer.endpoint})`);
  }

  /**
   * Remove a peer node
   */
  removePeer(endpoint: string): void {
    this.peers = this.peers.filter(p => p.endpoint !== endpoint);
    console.log(`[Sync] Removed peer: ${endpoint}`);
  }

  /**
   * Get all peers
   */
  getPeers(): PeerNode[] {
    return [...this.peers];
  }

  /**
   * Start periodic synchronization
   */
  start(): void {
    // Perform initial sync
    this.syncWithAllPeers().catch(err => {
      console.error('[Sync] Initial sync failed:', err);
    });

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('[Sync] Periodic sync failed:', err);
      });
    }, this.syncInterval);

    console.log(`[Sync] Synchronization service started (interval: ${this.syncInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Sync] Synchronization service stopped');
    }
  }

  /**
   * Synchronize with all peers
   */
  async syncWithAllPeers(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    for (const peer of this.peers) {
      if (peer.status === 'active') {
        try {
          const status = await this.syncWithPeer(peer);
          results.push(status);
          
          // Update peer status
          peer.lastSync = status.timestamp;
          if (status.status === 'failed') {
            peer.status = 'error';
          } else {
            peer.status = 'active';
          }
        } catch (error: any) {
          console.error(`[Sync] Failed to sync with ${peer.registryId}:`, error.message);
          peer.status = 'error';
          results.push({
            peerId: peer.registryId,
            timestamp: new Date().toISOString(),
            peerMerkleRoot: '',
            localMerkleRoot: await this.getLocalMerkleRoot(),
            rootsMatch: false,
            proofsSynced: 0,
            batchesSynced: 0,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Synchronize with a single peer
   */
  async syncWithPeer(peer: PeerNode): Promise<SyncStatus> {
    console.log(`[Sync] Syncing with peer: ${peer.registryId} (${peer.endpoint})`);

    // Get local Merkle root
    const localMerkleRoot = await this.getLocalMerkleRoot();

    // Exchange Merkle roots with peer
    const peerRoot = await this.exchangeMerkleRoot(peer);

    // Compare roots
    const rootsMatch = localMerkleRoot === peerRoot.merkleRoot;

    let proofsSynced = 0;
    let batchesSynced = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';

    if (!rootsMatch) {
      // Roots don't match - need to sync
      console.log(`[Sync] Roots differ - syncing data from peer`);
      
      // Get missing proofs and batches from peer
      const syncResult = await this.syncMissingData(peer, peerRoot);
      proofsSynced = syncResult.proofsSynced;
      batchesSynced = syncResult.batchesSynced;
      status = syncResult.status;
    } else {
      console.log(`[Sync] Roots match - no sync needed`);
    }

    return {
      peerId: peer.registryId,
      timestamp: new Date().toISOString(),
      peerMerkleRoot: peerRoot.merkleRoot,
      localMerkleRoot: localMerkleRoot,
      rootsMatch: rootsMatch,
      proofsSynced: proofsSynced,
      batchesSynced: batchesSynced,
      status: status,
    };
  }

  /**
   * Exchange Merkle root with peer
   */
  private async exchangeMerkleRoot(peer: PeerNode): Promise<MerkleRootExchange> {
    try {
      // Call peer's API endpoint
      const response = await fetch(`${peer.endpoint}/pohw/sync/merkle-root`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MerkleRootExchange;
    } catch (error: any) {
      throw new Error(`Failed to exchange Merkle root with ${peer.registryId}: ${error.message}`);
    }
  }

  /**
   * Get local Merkle root
   */
  private async getLocalMerkleRoot(): Promise<string> {
    const latestBatch = await this.db.getLatestBatch();
    return latestBatch?.root || '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  /**
   * Sync missing data from peer
   */
  private async syncMissingData(
    peer: PeerNode,
    peerRoot: MerkleRootExchange
  ): Promise<{ proofsSynced: number; batchesSynced: number; status: 'success' | 'partial' | 'failed' }> {
    let proofsSynced = 0;
    let batchesSynced = 0;

    try {
      // Get list of missing proofs from peer
      const localTotal = await this.db.getTotalProofs();
      
      if (peerRoot.totalProofs > localTotal) {
        // Peer has more proofs - request missing ones
        const missingCount = peerRoot.totalProofs - localTotal;
        console.log(`[Sync] Peer has ${missingCount} more proofs - requesting...`);

        // Request missing proofs (simplified - would need pagination in production)
        const response = await fetch(`${peer.endpoint}/pohw/sync/proofs?since=${localTotal}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const proofs = await response.json() as ProofRecord[];
          for (const proof of proofs) {
            // Check if proof already exists
            const existing = await this.db.getProofByHash(proof.hash);
            if (!existing) {
              // Store proof (without id and submitted_at - let DB generate)
              const { id, submitted_at, ...proofData } = proof;
              await this.db.storeProof(proofData);
              proofsSynced++;
            }
          }
        }
      }

      // Get missing batches
      const localBatches = await this.db.getAllBatches();
      const localBatchIds = new Set(localBatches.map(b => b.id));

      const batchesResponse = await fetch(`${peer.endpoint}/pohw/sync/batches`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (batchesResponse.ok) {
        const batches = await batchesResponse.json() as MerkleBatch[];
        for (const batch of batches) {
          if (!localBatchIds.has(batch.id)) {
            // Store batch (storeMerkleBatch expects Omit<MerkleBatch, 'created_at'>)
            await this.db.storeMerkleBatch({
              id: batch.id,
              root: batch.root,
              size: batch.size,
              anchored_at: batch.anchored_at,
              anchor_tx: batch.anchor_tx,
              anchor_chain: batch.anchor_chain,
            });
            batchesSynced++;
          }
        }
      }

      const status = proofsSynced > 0 || batchesSynced > 0 ? 'success' : 'partial';
      return { proofsSynced, batchesSynced, status };
    } catch (error: any) {
      console.error(`[Sync] Failed to sync missing data:`, error);
      return { proofsSynced, batchesSynced, status: 'failed' };
    }
  }

  /**
   * Get synchronization status for all peers
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    return this.syncWithAllPeers();
  }

  /**
   * Get our Merkle root for exchange
   */
  async getMerkleRootForExchange(): Promise<MerkleRootExchange> {
    const latestBatch = await this.db.getLatestBatch();
    const totalProofs = await this.db.getTotalProofs();
    const allBatches = await this.db.getAllBatches();

    return {
      registryId: this.registryId,
      merkleRoot: latestBatch?.root || '0x0',
      batchId: latestBatch?.id || '',
      timestamp: new Date().toISOString(),
      totalProofs: totalProofs,
      totalBatches: allBatches.length,
    };
  }
}
