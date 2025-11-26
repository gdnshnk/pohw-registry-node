# Registry Node Quick Start

## Installation

```bash
npm install
npm run build
```

## Start the Server

```bash
npm start
```

The registry will start on `http://localhost:3000` by default.

## Test the Registry

In another terminal:

```bash
node test-registry.js
```

## API Usage Examples

### Submit a Proof

```bash
curl -X POST http://localhost:3000/pohw/attest \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "0x...",
    "signature": "...",
    "did": "did:pohw:...",
    "timestamp": "2025-11-25T00:00:00Z"
  }'
```

### Verify a Proof

```bash
curl http://localhost:3000/pohw/verify/0x...
```

### Get Registry Status

```bash
curl http://localhost:3000/pohw/status
```

### Get Merkle Proof

```bash
curl http://localhost:3000/pohw/proof/0x...
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `BATCH_SIZE` - Proofs per Merkle batch (default: 1000)

## Data Storage

Proofs are stored in `./data/proofs.json` and batches in `./data/batches.json`.

## Next Steps

- Integrate with SDK to submit proofs
- Configure Merkle batching
- Add blockchain anchoring (Bitcoin, Ethereum, etc.)
- Set up federation with other registry nodes

