# PoHW Registry Node

Registry node implementation for the Proof of Human Work protocol. Handles proof submission, Merkle tree batching, and verification.

## Features

- **Proof Storage** - SQLite database for persistent proof storage
- **Merkle Batching** - Automatically batches proofs into Merkle trees
- **Verification API** - RESTful endpoints for proof verification
- **Status Endpoints** - Registry health and status information

## Installation

```bash
npm install
npm run build
```

## Usage

### Start the registry node:

```bash
npm start
# or for development
npm run dev
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `BATCH_SIZE` - Proofs per Merkle batch (default: 1000)
- `NODE_ENV` - Environment (development/production)

**Blockchain Anchoring:**
- `ANCHORING_ENABLED` - Enable blockchain anchoring (default: false)
- `BITCOIN_ENABLED` - Enable Bitcoin anchoring (default: false)
- `BITCOIN_NETWORK` - Bitcoin network: testnet or mainnet (default: testnet)
- `BITCOIN_RPC_URL` - Bitcoin RPC endpoint (optional)
- `BITCOIN_PRIVATE_KEY` - Bitcoin private key in WIF format (optional)
- `ETHEREUM_ENABLED` - Enable Ethereum anchoring (default: false)
- `ETHEREUM_NETWORK` - Ethereum network: sepolia or mainnet (default: sepolia)
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint (optional, defaults to public RPC)
- `ETHEREUM_PRIVATE_KEY` - Ethereum private key in hex format (optional)

## API Endpoints

### POST /pohw/attest

Submit a new proof attestation.

**Request:**
```json
{
  "hash": "0x...",
  "signature": "...",
  "did": "did:pohw:...",
  "timestamp": "2025-11-25T00:00:00Z"
}
```

**Response:**
```json
{
  "receipt_hash": "0x...",
  "timestamp": "2025-11-25T00:00:00Z",
  "registry": "proofofhumanwork.org"
}
```

### GET /pohw/verify/:hash

Verify a proof by hash.

**Response:**
```json
{
  "valid": true,
  "signer": "did:pohw:...",
  "timestamp": "2025-11-25T00:00:00Z",
  "registry": "proofofhumanwork.org",
  "merkle_proof": [...],
  "merkle_root": "0x..."
}
```

### POST /pohw/batch/create

Manually trigger batch creation from pending proofs.

**Response:**
```json
{
  "success": true,
  "batch_id": "...",
  "merkle_root": "0x...",
  "size": 24,
  "created_at": "2025-11-25T11:18:48.193Z"
}
```

**Error Response (no pending proofs):**
```json
{
  "error": "No pending proofs to batch",
  "pending_count": 0
}
```

### POST /pohw/batch/anchor/:batchId

Manually anchor a batch to blockchains.

**Response:**
```json
{
  "success": true,
  "batch_id": "...",
  "anchors": [
    {
      "chain": "bitcoin",
      "txHash": "...",
      "blockNumber": 12345,
      "timestamp": "2025-11-25T...",
      "success": true
    }
  ],
  "stored_anchors": [...]
}
```

### GET /pohw/proof/:hash

Get Merkle proof for a hash.

**Response:**
```json
{
  "proof": ["0x...", "0x..."],
  "root": "0x...",
  "anchors": [
    {
      "chain": "bitcoin",
      "tx": "tx_hash_here",
      "block": 12345
    },
    {
      "chain": "ethereum",
      "tx": "tx_hash_here",
      "block": 67890
    }
  ]
}
```

### GET /pohw/status

Get registry status.

**Response:**
```json
{
  "status": "active",
  "node": "pohw-registry-node",
  "protocol": "Proof of Human Work",
  "latest_hash": "0x...",
  "timestamp": "2025-11-25T00:00:00Z",
  "total_proofs": 1234,
  "pending_batch": 567
}
```

### GET /health

Health check endpoint.

## Database

The registry uses SQLite for storage. Database file is created at `./data/registry.db`.

**Tables:**
- `proofs` - Stored proof attestations
- `merkle_batches` - Merkle tree batches

## Merkle Batching

Proofs are automatically batched into Merkle trees when:
- Pending proof count reaches `BATCH_SIZE` (default: 1000)
- Or manually triggered

Each batch creates a Merkle root that can be anchored to blockchains.

## Development

```bash
# Build
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## License

MIT

