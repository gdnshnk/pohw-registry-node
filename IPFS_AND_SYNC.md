# IPFS Snapshots & Registry Synchronization

Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!



Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!






Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!



Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!






Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!



Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!






Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!



Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!






Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!



Implementation of whitepaper requirements for durability and federation.

## IPFS Snapshots

**Per whitepaper Section 12.2:** "Each node maintains its own signed transparency log and publishes periodic state snapshots to IPFS"

### What It Does

- **Periodic Snapshots**: Automatically publishes complete registry state to IPFS every 24 hours (configurable)
- **Snapshot Contents**: All proofs, batches, Merkle roots, and metadata
- **Manifest**: Creates a manifest with snapshot metadata and CID
- **Verification**: Allows anyone to download and verify snapshot integrity

### Configuration

```bash
# Enable/disable IPFS snapshots (default: enabled)
IPFS_ENABLED=true

# IPFS gateway URL (default: https://ipfs.io)
IPFS_URL=https://ipfs.io

# Snapshot interval in milliseconds (default: 86400000 = 24 hours)
SNAPSHOT_INTERVAL=86400000
```

### API Endpoints

- `GET /pohw/snapshots/latest` - Get latest snapshot manifest
- `POST /pohw/snapshots/publish` - Manually trigger snapshot
- `GET /pohw/snapshots/:cid` - Retrieve snapshot by IPFS CID

### How It Works

1. **Snapshot Creation**: Collects all proofs and batches from database
2. **IPFS Upload**: Serializes data and uploads to IPFS
3. **Manifest Creation**: Creates manifest with metadata and CIDs
4. **Storage**: Stores manifest CID in audit log for retrieval

### Example

```bash
# Get latest snapshot
curl https://proofofhumanwork.org/pohw/snapshots/latest

# Response:
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T14:00:00Z",
  "registryId": "pohw-registry-node",
  "merkleRoot": "0xabc123...",
  "totalProofs": 1000,
  "totalBatches": 5,
  "snapshotCid": "QmXxx...",
  "manifestCid": "QmYyy..."
}

# Retrieve snapshot data
curl https://ipfs.io/ipfs/QmXxx...
```

---

## Registry Synchronization

**Per whitepaper Section 7.2:** "Each registry periodically mirrors its state to at least three peers"

### What It Does

- **Peer Mirroring**: Synchronizes with other registry nodes
- **Merkle Root Exchange**: Compares Merkle roots to detect divergence
- **Data Sync**: Automatically syncs missing proofs and batches
- **Consistency Verification**: Ensures all peers have identical state

### Configuration

```bash
# Enable/disable synchronization (default: enabled)
SYNC_ENABLED=true

# Sync interval in milliseconds (default: 3600000 = 1 hour)
SYNC_INTERVAL=3600000

# Peer nodes (comma-separated URLs)
REGISTRY_PEERS=https://gdn.sh,https://proofofhumanwork.org
```

### API Endpoints

- `GET /pohw/sync/merkle-root` - Exchange Merkle root (for peers)
- `GET /pohw/sync/proofs` - Get proofs for synchronization
- `GET /pohw/sync/batches` - Get batches for synchronization
- `GET /pohw/sync/status` - Get synchronization status with all peers
- `POST /pohw/sync/peers` - Add a peer node

### How It Works

1. **Merkle Root Exchange**: Each node shares its latest Merkle root
2. **Comparison**: Nodes compare roots to detect differences
3. **Data Sync**: If roots differ, nodes exchange missing data
4. **Verification**: Both nodes verify they have identical state

### Example

```bash
# Get sync status
curl https://proofofhumanwork.org/pohw/sync/status

# Response:
{
  "peers": [
    {
      "registryId": "gdn.sh",
      "endpoint": "https://gdn.sh",
      "status": "active",
      "lastSync": "2025-11-27T14:00:00Z"
    }
  ],
  "syncStatus": [
    {
      "peerId": "gdn.sh",
      "rootsMatch": true,
      "proofsSynced": 0,
      "batchesSynced": 0,
      "status": "success"
    }
  ]
}

# Add a peer
curl -X POST https://proofofhumanwork.org/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "university.edu",
    "endpoint": "https://pohw.university.edu",
    "region": "US",
    "institutionType": "university"
  }'
```

---

## Benefits

### IPFS Snapshots

✅ **Long-term Archival** - Data survives beyond individual nodes  
✅ **Independent Verification** - Anyone can download and verify  
✅ **Historical Reconstruction** - Rebuild network from snapshots  
✅ **Public Auditability** - Transparent and verifiable  

### Registry Synchronization

✅ **Real-time Redundancy** - Active mirroring between nodes  
✅ **Fast Recovery** - If one node dies, others have the data  
✅ **Consistency Verification** - Detect corruption immediately  
✅ **Federation** - No single point of failure  

### Together

✅ **Multi-layer Durability** - Active sync + archival snapshots  
✅ **Institutional Independence** - No single entity controls data  
✅ **100-Year Survivability** - Meets whitepaper requirements  
✅ **Public Auditability** - Anyone can verify integrity  

---

## Testing

### Test IPFS Snapshots

```bash
# Manually trigger snapshot
curl -X POST http://localhost:3000/pohw/snapshots/publish

# Get latest snapshot
curl http://localhost:3000/pohw/snapshots/latest
```

### Test Registry Sync

```bash
# Get sync status
curl http://localhost:3000/pohw/sync/status

# Add a peer
curl -X POST http://localhost:3000/pohw/sync/peers \
  -H "Content-Type: application/json" \
  -d '{
    "registryId": "test-peer",
    "endpoint": "https://test-peer.example.com"
  }'
```

---

## Status

✅ **IPFS Snapshots**: Implemented and ready  
✅ **Registry Synchronization**: Implemented and ready  
✅ **API Endpoints**: All endpoints available  
✅ **Automatic Operation**: Services start automatically  

Both features are now fully implemented per whitepaper requirements!





