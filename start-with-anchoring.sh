#!/bin/bash
# Start registry node with Bitcoin testnet anchoring enabled

echo "🔗 Starting Registry Node with Bitcoin Anchoring..."
echo ""

# Set environment variables
export ANCHORING_ENABLED=true
export BITCOIN_ENABLED=true
export BITCOIN_NETWORK=testnet
export BITCOIN_PRIVATE_KEY=cPq4fg3yLXXuYF4z32uKcS5MqUYhXtqzShD9qHffzHyQWTn9KobU

echo "✅ Environment variables set:"
echo "   ANCHORING_ENABLED=true"
echo "   BITCOIN_ENABLED=true"
echo "   BITCOIN_NETWORK=testnet"
echo "   BITCOIN_PRIVATE_KEY=***"
echo ""
echo "💰 Wallet: tb1qfahz94rserz50pm9mcqfaf8hxs0dm2wz8el2ht"
echo "   Balance: 4000 satoshis"
echo ""
echo "🚀 Starting server..."
echo ""

# Start the server
npm start

