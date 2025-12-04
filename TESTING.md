# PostgreSQL Database Testing Guide

This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```



This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```






This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```



This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```






This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```



This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```






This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```



This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```






This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```



This guide explains how to test the PostgreSQL database implementation.

## Prerequisites

You need a PostgreSQL database. Options:

### Option 1: Railway PostgreSQL (Recommended for Production Testing)

1. Go to [Railway](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the `DATABASE_URL` from the service variables
4. Export it:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create test database:
   ```bash
   createdb pohw_registry_test
   ```

3. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://localhost/pohw_registry_test"
   ```

### Option 3: Docker PostgreSQL (If Docker is installed)

1. Start PostgreSQL container:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
   ```

## Running Tests

### Test PostgreSQL Adapter Directly

```bash
npm run test:postgres
```

This will:
- Initialize the database schema
- Test proof storage and retrieval
- Test batch operations
- Test reputation storage
- Test challenge/dispute functionality
- Verify all CRUD operations

### Test with Registry Node

1. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your_postgresql_connection_string"
   ```

2. Start the registry node:
   ```bash
   npm run build
   npm start
   ```

3. The node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run

4. Test API endpoints:
   ```bash
   # Submit a proof
   curl -X POST http://localhost:3000/pohw/attest \
     -H "Content-Type: application/json" \
     -d '{
       "hash": "0x123...",
       "signature": "0xabc...",
       "did": "did:pohw:test:123",
       "timestamp": "2025-01-01T00:00:00Z"
     }'
   
   # Verify proof
   curl http://localhost:3000/pohw/verify/0x123...
   ```

## Verification

After running tests, verify:

1. **Schema Created**: Check that all tables exist:
   ```sql
   \dt  -- List all tables
   ```

2. **Data Persisted**: Check that data survives restarts:
   ```bash
   # Stop node
   # Start node again
   # Verify data still exists
   ```

3. **Performance**: Compare with file-based storage:
   - PostgreSQL should be faster for large datasets
   - File-based is fine for development

## Troubleshooting

### Connection Errors

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify network connectivity (for remote databases)
- Check firewall rules

### Schema Errors

- The schema auto-initializes on first connection
- If issues occur, check PostgreSQL logs
- Ensure user has CREATE TABLE permissions

### Migration Issues

- Current implementation auto-creates schema
- No manual migrations needed
- Schema is idempotent (safe to run multiple times)

## Expected Test Output

```
🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

3️⃣  Testing proof retrieval by hash...
   ✅ Proof retrieved successfully
      DID: did:pohw:test:123
      Timestamp: 2025-01-01T00:00:00.000Z
      Assistance Profile: human-only

... (more tests) ...

✅ All tests passed!
```





