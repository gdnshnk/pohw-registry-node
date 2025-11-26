# Blockchain Anchoring Guide

## Overview

PoHW Registry Node supports anchoring Merkle roots to multiple blockchains for durability and timestamping. This ensures proofs remain verifiable even if the registry node goes offline.

## Supported Blockchains

- **Bitcoin** (testnet/mainnet) - OP_RETURN transactions
- **Ethereum** (sepolia/mainnet) - Transaction data or smart contract events

## Configuration

### Enable Anchoring

Set environment variables to enable anchoring:

```bash
# Enable anchoring
export ANCHORING_ENABLED=true

# Enable Bitcoin anchoring (testnet)
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet
export BITCOIN_PRIVATE_KEY=your_wif_private_key_here

# Enable Ethereum anchoring (sepolia)
export ETHEREUM_ENABLED=true
export ETHEREUM_NETWORK=sepolia
export ETHEREUM_PRIVATE_KEY=your_hex_private_key_here

# Optional: Custom RPC endpoints
export BITCOIN_RPC_URL=https://your-bitcoin-rpc-endpoint
export ETHEREUM_RPC_URL=https://your-ethereum-rpc-endpoint
```

### Testnet Configuration (Recommended for Development)

```bash
export ANCHORING_ENABLED=true
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet
export ETHEREUM_ENABLED=true
export ETHEREUM_NETWORK=sepolia
```

**Note:** For testnets, you can use testnet faucets to get test coins.

## How It Works

1. **Batch Creation**: When a Merkle batch is created (manually or automatically)
2. **Anchoring**: The Merkle root is anchored to configured blockchains
3. **Storage**: Transaction hashes are stored in the database
4. **Verification**: Anchors are included in Merkle proof responses

## API Endpoints

### POST /pohw/batch/anchor/:batchId

Manually anchor a batch to blockchains.

**Example:**
```bash
curl -X POST http://localhost:3000/pohw/batch/anchor/abc123
```

**Response:**
```json
{
  "success": true,
  "batch_id": "abc123",
  "anchors": [
    {
      "chain": "bitcoin",
      "txHash": "tx_hash_here",
      "blockNumber": 12345,
      "timestamp": "2025-11-25T...",
      "success": true
    },
    {
      "chain": "ethereum",
      "txHash": "tx_hash_here",
      "blockNumber": 67890,
      "timestamp": "2025-11-25T...",
      "success": true
    }
  ]
}
```

## Automatic Anchoring

When `ANCHORING_ENABLED=true`, batches are automatically anchored when created (via `POST /pohw/batch/create` or when batch size threshold is reached).

## Verification

Anchors are automatically included in Merkle proof responses:

```bash
curl http://localhost:3000/pohw/proof/0x...
```

**Response includes anchors:**
```json
{
  "proof": ["0x...", "0x..."],
  "root": "0x...",
  "anchors": [
    {
      "chain": "bitcoin",
      "tx": "tx_hash",
      "block": 12345
    },
    {
      "chain": "ethereum",
      "tx": "tx_hash",
      "block": 67890
    }
  ]
}
```

## Current Implementation Status

**Mock Mode (Default):**
- Anchoring infrastructure is in place
- Returns mock transaction hashes
- Ready for real blockchain integration

**Real Blockchain (Coming Soon):**
- Bitcoin OP_RETURN transactions
- Ethereum transaction data
- Transaction confirmation tracking
- Block number retrieval

## Testing

Run the anchoring test:

```bash
node test-anchoring.js
```

This will:
1. Create test proofs
2. Create a batch
3. Test the anchoring endpoint
4. Verify anchors in Merkle proofs

## Security Notes

- **Private Keys**: Store securely, never commit to git
- **Testnet First**: Always test on testnets before mainnet
- **Backup Keys**: Keep secure backups of private keys
- **RPC Security**: Use secure RPC endpoints (HTTPS, authentication)

## Next Steps

To enable real blockchain anchoring:

1. Get testnet coins (Bitcoin testnet, Ethereum Sepolia)
2. Generate testnet wallets
3. Set environment variables with testnet keys
4. Test anchoring on testnets
5. When ready, switch to mainnet

## Troubleshooting

**Anchoring not working:**
- Check `ANCHORING_ENABLED=true`
- Verify blockchain-specific flags are set
- Check private keys are correct format
- Ensure RPC endpoints are accessible

**Mock transactions:**
- Current implementation uses mock transactions
- Real blockchain integration requires additional setup
- See implementation details in `src/anchoring.ts`

