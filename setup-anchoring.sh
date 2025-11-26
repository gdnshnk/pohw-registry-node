#!/bin/bash
# Setup script for Bitcoin testnet anchoring

echo "🔗 Setting up Bitcoin Testnet Anchoring..."
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
echo "📝 Your wallet addresses:"
echo "   P2PKH: mnkwcbWanggKgXBWQTud1nbDsVr6UVmHFy"
echo "   Bech32: tb1qfahz94rserz50pm9mcqfaf8hxs0dm2wz8el2ht"
echo ""
echo "💰 Balance: 4000 satoshis (0.00004 BTC)"
echo ""
echo "⚠️  Next steps:"
echo "   1. Stop the current server (Ctrl+C if running)"
echo "   2. Restart with: npm start"
echo "   3. Or run: npm run dev"
echo ""

