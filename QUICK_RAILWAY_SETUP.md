# Quick Railway PostgreSQL Setup

You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard



You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard






You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard



You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard






You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard



You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard






You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard



You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard






You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard



You're already logged in to Railway! Here's the fastest way to set up PostgreSQL:

## Method 1: Railway CLI (Terminal)

Run these commands in your terminal:

```bash
# 1. Initialize Railway project (if not already done)
railway init

# 2. Add PostgreSQL service
railway add postgresql

# 3. Get DATABASE_URL
railway variables | grep DATABASE_URL

# 4. Copy the DATABASE_URL value and set it
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# 5. Test the connection
npm run test:postgres
```

## Method 2: Railway Web Interface (Visual)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - You should see your projects

2. **Create/Select Project**
   - Click "New Project" → "Empty Project" (if starting fresh)
   - Or select an existing project

3. **Add PostgreSQL**
   - Click the "+ New" button
   - Select "Database" → "Add PostgreSQL"
   - Railway will create the database automatically

4. **Get DATABASE_URL**
   - Click on the PostgreSQL service card
   - Go to the "Variables" tab
   - Find `DATABASE_URL` (or `POSTGRES_URL`)
   - Click the copy icon to copy the value

5. **Set Environment Variable**
   ```bash
   export DATABASE_URL="your_copied_connection_string"
   ```

6. **Test Connection**
   ```bash
   npm run test:postgres
   ```

## Method 3: Add to Existing Registry Node Service

If you already have the registry node deployed on Railway:

1. Go to your registry node service
2. Click "Variables" tab
3. Click "+ New Variable"
4. Name: `DATABASE_URL`
5. Value: (paste from PostgreSQL service)
6. Redeploy the service

The registry node will automatically:
- Detect DATABASE_URL
- Use PostgreSQL instead of file storage
- Initialize schema on first run
- Persist data across deployments

## Verify It's Working

After setting DATABASE_URL, you should see:

```bash
$ npm run test:postgres

🧪 Testing PostgreSQL Database Adapter

1️⃣  Initializing database connection...
   ✅ Database schema initialized

2️⃣  Testing proof storage...
   ✅ Proof stored with ID: 1

... (more tests) ...

✅ All tests passed!
```

## Troubleshooting

**Can't find DATABASE_URL?**
- Check PostgreSQL service → Variables tab
- Look for `POSTGRES_URL` or `DATABASE_URL`
- Railway sometimes uses different variable names

**Connection fails?**
- Verify DATABASE_URL is correct (no extra spaces)
- Check PostgreSQL service is running in Railway
- Ensure network connectivity

**Schema errors?**
- Schema auto-initializes on first connection
- Check Railway PostgreSQL service logs
- Verify user has CREATE TABLE permissions

## Next Steps

Once PostgreSQL is working:

1. ✅ Test locally: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL set
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage in Railway dashboard





