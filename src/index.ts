/**
 * PoHW Registry Node
 * Main entry point for registry server
 */

import express from 'express';
import cors from 'cors';
import { RegistryDatabase } from './database';
import { BatchManager } from './batcher';
import { createAPIRouter } from './api';

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

// Setup API routes
const apiRouter = createAPIRouter(db, batcher, anchorConfig);
app.use('/', apiRouter);

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

