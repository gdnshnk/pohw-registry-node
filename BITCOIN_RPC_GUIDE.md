# Bitcoin RPC Integration Guide

## Overview

Full Bitcoin RPC integration has been implemented for anchoring Merkle roots to the Bitcoin blockchain. The implementation supports both direct RPC access and block explorer API fallback.

## Features

✅ **Full RPC Integration**
- UTXO fetching via `listunspent` RPC
- Transaction building with PSBT
- Fee estimation via `estimatesmartfee` RPC
- Transaction signing with Ed25519 keys
- Transaction broadcasting via `sendrawtransaction` RPC
- Block number retrieval

✅ **Block Explorer API Fallback**
- Uses blockstream.info API when RPC is not available
- Works for both testnet and mainnet
- No authentication required
- Public API access

✅ **Smart Coin Selection**
- Sorts UTXOs by amount (smallest first)
- Minimizes change output
- Handles insufficient balance errors

✅ **Fee Management**
- Automatic fee estimation
- Configurable fee rate
- Conservative defaults for testnet

## Configuration

### Option 1: Bitcoin RPC Node

```bash
# Enable Bitcoin anchoring
export ANCHORING_ENABLED=true
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet

# RPC Configuration
export BITCOIN_RPC_URL=http://localhost:18332
export BITCOIN_RPC_USER=your_rpc_username
export BITCOIN_RPC_PASSWORD=your_rpc_password

# Or include credentials in URL
export BITCOIN_RPC_URL=http://username:password@localhost:18332

# Private Key (WIF format)
export BITCOIN_PRIVATE_KEY=your_wif_private_key
```

### Option 2: Block Explorer API (No RPC Required)

```bash
# Enable Bitcoin anchoring
export ANCHORING_ENABLED=true
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet

# No RPC URL needed - will use block explorer API
# Private Key (WIF format)
export BITCOIN_PRIVATE_KEY=your_wif_private_key
```

## How It Works

### RPC Flow

1. **Get UTXOs** - Fetches unspent transaction outputs for the address
2. **Estimate Fees** - Uses `estimatesmartfee` RPC to get fee rate
3. **Select UTXOs** - Chooses smallest UTXOs that cover fees
4. **Build Transaction** - Creates PSBT with:
   - Inputs from selected UTXOs
   - OP_RETURN output with Merkle root
   - Change output (if needed)
5. **Sign Transaction** - Signs all inputs with private key
6. **Broadcast** - Sends transaction via `sendrawtransaction` RPC
7. **Get Block Number** - Retrieves block height after confirmation

### Block Explorer API Flow

1. **Get UTXOs** - Fetches from blockstream.info API
2. **Estimate Fees** - Uses conservative default (10 sat/byte)
3. **Select UTXOs** - Same algorithm as RPC
4. **Build Transaction** - Same as RPC
5. **Sign Transaction** - Same as RPC
6. **Broadcast** - Sends via blockstream.info API
7. **Get Block Number** - Polls API for confirmation

## Transaction Structure

### Inputs
- Uses P2PKH (Pay-to-Public-Key-Hash) inputs
- Requires full transaction hex for signing
- Supports both witness and non-witness UTXOs

### Outputs
1. **OP_RETURN Output** (0 value)
   - Contains Merkle root data
   - Max 80 bytes (Bitcoin limit)
   - Format: JSON with `pohw`, `root`, `batch`, `registry`, `timestamp`

2. **Change Output** (if needed)
   - Returns excess funds to sender address
   - Only created if change > dust limit (546 satoshis)

## Fee Calculation

### Automatic Estimation
- Uses `estimatesmartfee` RPC with 6-block target
- Falls back to 10 satoshis/byte if estimation fails
- Calculates total fee: `fee = estimated_size * fee_per_byte`

### Transaction Size
- Input: ~148 bytes (P2PKH)
- OP_RETURN output: ~43 bytes
- Change output: ~34 bytes
- Total: ~225 bytes (1 input, 2 outputs)

## Error Handling

### Insufficient Balance
```
Error: Insufficient balance. Need at least 0.00000225 BTC for fees.
Current balance: 0.00000100 BTC
```

### No UTXOs
```
Error: No UTXOs available for address. Need testnet coins.
```

### RPC Connection Failed
- Automatically falls back to block explorer API
- Logs warning message
- Continues with explorer API

### Transaction Broadcast Failed
- Returns error in result
- Does not crash the system
- Allows other chains to anchor

## Testing

### 1. Get Testnet Coins

Visit: https://testnet-faucet.mempool.co/

### 2. Generate Testnet Wallet

```bash
node -e "
const bitcoin = require('bitcoinjs-lib');
const network = bitcoin.networks.testnet;
const keyPair = bitcoin.ECPair.makeRandom({ network });
const wif = keyPair.toWIF();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network });
console.log('WIF:', wif);
console.log('Address:', address);
"
```

### 3. Set Environment Variables

```bash
export ANCHORING_ENABLED=true
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet
export BITCOIN_PRIVATE_KEY=your_wif_key_here
# Optional: RPC URL (if you have Bitcoin node)
export BITCOIN_RPC_URL=http://localhost:18332
```

### 4. Test Anchoring

```bash
# Start registry node
npm start

# Create batch
curl -X POST http://localhost:3000/pohw/batch/create

# Anchor batch
curl -X POST http://localhost:3000/pohw/batch/anchor/BATCH_ID
```

## RPC Methods Used

### `listunspent`
- Gets unspent transaction outputs for an address
- Parameters: `[minconf, maxconf, [addresses]]`

### `getrawtransaction`
- Gets raw transaction hex by txid
- Parameters: `[txid, verbose]`

### `estimatesmartfee`
- Estimates fee rate for confirmation target
- Parameters: `[blocks]`
- Returns: `{ feerate: number }` (BTC per KB)

### `sendrawtransaction`
- Broadcasts raw transaction to network
- Parameters: `[hexstring]`
- Returns: Transaction hash

### `gettransaction`
- Gets transaction details by txid
- Parameters: `[txid]`
- Returns: Transaction info with confirmations

### `getblockcount`
- Gets current block height
- Returns: Block number

## Security Considerations

⚠️ **Private Keys**
- Never commit private keys to git
- Use environment variables
- Store securely (use key management service for production)

⚠️ **RPC Authentication**
- Use strong passwords for RPC
- Restrict RPC access to localhost
- Use SSL/TLS for remote RPC

⚠️ **Testnet First**
- Always test on testnet before mainnet
- Verify transactions on block explorer
- Check fees before broadcasting

## Troubleshooting

### "No UTXOs available"
- Get testnet coins from faucet
- Wait for confirmation (usually 1 block)
- Check address is correct

### "RPC call failed"
- Check RPC URL is correct
- Verify RPC credentials
- Ensure Bitcoin node is running
- Check firewall settings

### "Insufficient balance"
- Get more testnet coins
- Check fee estimation is reasonable
- Verify UTXOs are confirmed

### "Transaction broadcast failed"
- Check transaction is valid
- Verify network (testnet vs mainnet)
- Check fee is sufficient
- Verify UTXOs haven't been spent

## Production Checklist

- [ ] Use Bitcoin mainnet node (not testnet)
- [ ] Configure proper RPC authentication
- [ ] Set up monitoring for RPC failures
- [ ] Implement retry logic for failed broadcasts
- [ ] Monitor fee rates and adjust if needed
- [ ] Backup private keys securely
- [ ] Test thoroughly on testnet first
- [ ] Set up alerts for failed transactions
- [ ] Document RPC endpoint and credentials
- [ ] Implement rate limiting for RPC calls

## Next Steps

1. **Multi-UTXO Support** - Improve coin selection algorithm
2. **Fee Optimization** - Dynamic fee adjustment based on network conditions
3. **Transaction Retry** - Automatic retry for failed broadcasts
4. **Confirmation Tracking** - Poll for confirmations and update status
5. **Batch Optimization** - Group multiple anchors in single transaction

