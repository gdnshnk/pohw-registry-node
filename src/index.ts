/**
 * PoHW Registry Node
 * Main entry point for registry server
 */

import express from 'express';
import cors from 'cors';
import { RegistryDatabase } from './database';
import { BatchManager } from './batcher';
import { createAPIRouter } from './api';
import { IPFSSnapshotService } from './ipfs-snapshots';
import { RegistrySynchronizationService } from './registry-sync';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize database
const db = new RegistryDatabase('./data/registry.db');

// Initialize anchor config from environment
const anchorConfig = {
  enabled: process.env.ANCHORING_ENABLED === 'true',
  bitcoin: process.env.BITCOIN_ENABLED === 'true' ? {
    network: (process.env.BITCOIN_NETWORK || 'testnet') as 'testnet' | 'mainnet',
    rpcUrl: process.env.BITCOIN_RPC_URL,
    privateKey: process.env.BITCOIN_PRIVATE_KEY
  } : undefined,
  ethereum: process.env.ETHEREUM_ENABLED === 'true' ? {
    network: (process.env.ETHEREUM_NETWORK || 'sepolia') as 'sepolia' | 'mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    privateKey: process.env.ETHEREUM_PRIVATE_KEY
  } : undefined
};

// Initialize batch manager
const batcher = new BatchManager(db, {
  batchSize: parseInt(process.env.BATCH_SIZE || '1000')
}, anchorConfig);

// Initialize IPFS Snapshot Service (per whitepaper Section 12.2)
const snapshotService = new IPFSSnapshotService(
  db,
  process.env.REGISTRY_ID || 'pohw-registry-node',
  process.env.IPFS_URL || 'https://ipfs.io',
  parseInt(process.env.SNAPSHOT_INTERVAL || '86400000') // 24 hours default
);

// Initialize Registry Synchronization Service (per whitepaper Section 7.2)
const syncService = new RegistrySynchronizationService(
  db,
  process.env.REGISTRY_ID || 'pohw-registry-node',
  parseInt(process.env.SYNC_INTERVAL || '3600000') // 1 hour default
);

// Setup API routes (pass services to router)
const apiRouter = createAPIRouter(db, batcher, anchorConfig, snapshotService, syncService);
app.use('/', apiRouter);

// Start services if enabled
if (process.env.IPFS_ENABLED !== 'false') {
  snapshotService.start();
  console.log('📸 IPFS snapshot service: ENABLED');
} else {
  console.log('📸 IPFS snapshot service: DISABLED');
}

if (process.env.SYNC_ENABLED !== 'false') {
  syncService.start();
  console.log('🔄 Registry synchronization: ENABLED');
} else {
  console.log('🔄 Registry synchronization: DISABLED');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`PoHW Registry Node running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Batch size: ${batcher['config'].batchSize}`);
  console.log(`Database: ./data/registry.db`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   /pohw/attest          - Submit proof`);
  console.log(`  POST   /pohw/batch/create    - Manually create batch`);
  console.log(`  POST   /pohw/batch/anchor/:id - Anchor batch to blockchains`);
  console.log(`  GET    /pohw/verify/:hash   - Verify proof`);
  console.log(`  GET    /pohw/proof/:hash   - Get Merkle proof`);
  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});


  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);

  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});


  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);

  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});


  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);

  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});


  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);

  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down registry node...');
  db.close();
  process.exit(0);
});


  console.log(`  GET    /pohw/status         - Registry status`);
  console.log(`  GET    /health              - Health check`);
  
  if (process.env.IPFS_ENABLED !== 'false') {
    console.log(`\n📸 IPFS Snapshot Endpoints:`);
    console.log(`  GET    /pohw/snapshots/latest - Get latest snapshot`);
    console.log(`  POST   /pohw/snapshots/publish - Publish snapshot`);
    console.log(`  GET    /pohw/snapshots/:cid - Retrieve snapshot by CID`);
  }
  
  if (process.env.SYNC_ENABLED !== 'false') {
    console.log(`\n🔄 Registry Sync Endpoints:`);
    console.log(`  GET    /pohw/sync/merkle-root - Exchange Merkle root`);
    console.log(`  GET    /pohw/sync/proofs - Get proofs for sync`);
    console.log(`  GET    /pohw/sync/batches - Get batches for sync`);
    console.log(`  GET    /pohw/sync/status - Get sync status`);
    console.log(`  POST   /pohw/sync/peers - Add peer node`);
  }
  
  if (anchorConfig.enabled) {
    console.log(`\n🔗 Blockchain Anchoring: ENABLED`);
    if (anchorConfig.bitcoin) {
      console.log(`   Bitcoin: ${anchorConfig.bitcoin.network}`);
    }
    if (anchorConfig.ethereum) {
      console.log(`   Ethereum: ${anchorConfig.ethereum.network}`);
    }
  } else {
    console.log(`\n🔗 Blockchain Anchoring: DISABLED (set ANCHORING_ENABLED=true to enable)`);
  }
  
  console.log(`\nRegistry ready to accept proofs!`);
