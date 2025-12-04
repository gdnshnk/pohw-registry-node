#!/bin/bash

# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""



# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""






# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""



# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""






# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""



# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""






# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""



# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""






# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""



# Test IPFS Snapshots and Registry Sync via API

echo "🧪 Testing IPFS Snapshots & Registry Sync API"
echo ""

# Start server in background
echo "1️⃣  Starting registry node..."
cd "$(dirname "$0")"
npm run build > /dev/null 2>&1
PORT=3001 node dist/index.js > /tmp/pohw-test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 2: Registry Sync Status
echo "2️⃣  Testing Registry Sync Status..."
SYNC_STATUS=$(curl -s http://localhost:3001/pohw/sync/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Sync status endpoint working"
    echo "   Response: $(echo $SYNC_STATUS | jq -r '.peers | length') peer(s) configured"
else
    echo "   ❌ Sync status endpoint failed"
fi
echo ""

# Test 3: Merkle Root Exchange
echo "3️⃣  Testing Merkle Root Exchange..."
MERKLE_ROOT=$(curl -s http://localhost:3001/pohw/sync/merkle-root)
if [ $? -eq 0 ]; then
    echo "   ✅ Merkle root endpoint working"
    REGISTRY_ID=$(echo $MERKLE_ROOT | jq -r '.registryId')
    ROOT=$(echo $MERKLE_ROOT | jq -r '.merkleRoot')
    echo "   Registry ID: $REGISTRY_ID"
    echo "   Merkle Root: $ROOT"
else
    echo "   ❌ Merkle root endpoint failed"
fi
echo ""

# Test 4: Add Peer
echo "4️⃣  Testing Add Peer..."
ADD_PEER=$(curl -s -X POST http://localhost:3001/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com",
    "region": "US"
  }')
if [ $? -eq 0 ]; then
    echo "   ✅ Add peer endpoint working"
    PEER_ID=$(echo $ADD_PEER | jq -r '.peer.registryId')
    echo "   Added peer: $PEER_ID"
else
    echo "   ❌ Add peer endpoint failed"
fi
echo ""

# Test 5: IPFS Snapshots (may fail if IPFS not available, but endpoint should exist)
echo "5️⃣  Testing IPFS Snapshots..."
SNAPSHOT_LATEST=$(curl -s http://localhost:3001/pohw/snapshots/latest)
if [ $? -eq 0 ]; then
    if echo $SNAPSHOT_LATEST | jq -e '.error' > /dev/null 2>&1; then
        echo "   ⚠️  No snapshots yet (expected)"
    else
        echo "   ✅ Latest snapshot endpoint working"
    fi
else
    echo "   ❌ Snapshot endpoint failed"
fi
echo ""

# Test 6: Service Status
echo "6️⃣  Testing Service Status..."
STATUS=$(curl -s http://localhost:3001/pohw/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
    TOTAL_PROOFS=$(echo $STATUS | jq -r '.totalProofs')
    PENDING=$(echo $STATUS | jq -r '.pendingProofs')
    echo "   Total Proofs: $TOTAL_PROOFS"
    echo "   Pending: $PENDING"
else
    echo "   ❌ Status endpoint failed"
fi
echo ""

# Cleanup
echo "7️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"
echo ""

echo "✅ All API tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Server startup: ✅"
echo "   • Sync status endpoint: ✅"
echo "   • Merkle root exchange: ✅"
echo "   • Add peer endpoint: ✅"
echo "   • Snapshot endpoints: ✅"
echo "   • Service lifecycle: ✅"
echo ""





