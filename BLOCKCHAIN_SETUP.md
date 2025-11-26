# Real Blockchain Anchoring Setup Guide

## Overview

This guide explains how to set up real blockchain anchoring for Bitcoin testnet and Ethereum Sepolia testnet.

## Prerequisites

1. **Testnet Coins**
   - Bitcoin testnet: Get from https://testnet-faucet.mempool.co/
   - Ethereum Sepolia: Get from https://sepoliafaucet.com/

2. **Testnet Wallets**
   - Generate testnet wallets
   - Save private keys securely

3. **RPC Access** (Optional)
   - Bitcoin RPC node (or use public APIs)
   - Ethereum RPC endpoint (public RPCs available)

## Step 1: Generate Testnet Wallets

### Bitcoin Testnet Wallet

```bash
# Using bitcoinjs-lib (in Node.js)
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

### Ethereum Sepolia Wallet

```bash
# Using ethers (in Node.js)
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
"
```

## Step 2: Get Testnet Coins

### Bitcoin Testnet
1. Visit https://testnet-faucet.mempool.co/
2. Enter your testnet address
3. Request testnet BTC

### Ethereum Sepolia
1. Visit https://sepoliafaucet.com/
2. Enter your Sepolia address
3. Request Sepolia ETH

## Step 3: Configure Registry Node

Set environment variables:

```bash
# Enable anchoring
export ANCHORING_ENABLED=true

# Bitcoin testnet
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet
export BITCOIN_PRIVATE_KEY=your_wif_private_key_here
# Optional: Bitcoin RPC
export BITCOIN_RPC_URL=http://localhost:18332

# Ethereum Sepolia
export ETHEREUM_ENABLED=true
export ETHEREUM_NETWORK=sepolia
export ETHEREUM_PRIVATE_KEY=your_hex_private_key_here
# Optional: Custom RPC (defaults to public Sepolia RPC)
export ETHEREUM_RPC_URL=https://rpc.sepolia.org
```

## Step 4: Start Registry Node

```bash
cd pohw-registry-node
npm start
```

You should see:
```
🔗 Blockchain Anchoring: ENABLED
   Bitcoin: testnet
   Ethereum: sepolia
```

## Step 5: Test Anchoring

```bash
# Create a batch
curl -X POST http://localhost:3000/pohw/batch/create

# Anchor the batch
curl -X POST http://localhost:3000/pohw/batch/anchor/BATCH_ID
```

## Current Implementation Status

### Bitcoin
- ✅ Transaction structure creation
- ✅ OP_RETURN output generation
- ⚠️  RPC integration (requires Bitcoin node)
- ⚠️  UTXO management (requires wallet/RPC)
- ⚠️  Transaction broadcasting (requires RPC or API)

**Options for Bitcoin:**
1. **Full RPC** - Run Bitcoin testnet node, use RPC
2. **Block Explorer API** - Use blockstream.info API for broadcasting
3. **Simplified** - Create transaction hex, user broadcasts manually

### Ethereum
- ✅ Transaction creation
- ✅ Transaction signing
- ✅ Transaction broadcasting
- ✅ Confirmation waiting
- ✅ Block number retrieval

**Ethereum is fully functional** with public RPC endpoints!

## Testing

Run the test script:

```bash
node test-blockchain.js
```

## Production Considerations

### Bitcoin Mainnet
- Requires real BTC for fees
- Use proper UTXO management
- Implement fee estimation
- Use reliable RPC endpoint

### Ethereum Mainnet
- Requires real ETH for gas
- Use proper gas estimation
- Monitor gas prices
- Use reliable RPC endpoint

## Security Notes

- **Never commit private keys to git**
- **Use environment variables or secure key management**
- **Test on testnets extensively before mainnet**
- **Keep private keys backed up securely**
- **Use hardware wallets for mainnet**

## Troubleshooting

**Transaction fails:**
- Check you have testnet coins
- Verify private keys are correct format
- Check RPC endpoints are accessible
- Verify network settings (testnet vs mainnet)

**RPC connection fails:**
- Check RPC URL is correct
- Verify authentication if required
- Try public RPC endpoints
- Check network connectivity

## Next Steps

1. Implement full Bitcoin RPC integration
2. Add UTXO management
3. Implement fee estimation
4. Add transaction confirmation tracking
5. Add retry logic for failed transactions

