# How to Get Public DATABASE_URL from Railway

The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public



The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public






The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public



The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public






The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public



The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public






The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public



The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public






The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public



The URL you have uses Railway's internal network which only works from within Railway.

## Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Select your project

2. **Open PostgreSQL Service**
   - Click on the PostgreSQL service card

3. **Check Variables Tab**
   - Go to "Variables" tab
   - Look for `DATABASE_URL` or `POSTGRES_URL`
   - **Important**: The URL should NOT contain `internal`
   - It should look like: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`

4. **If you only see internal URL:**
   - Railway databases are private by default
   - You need to enable public networking

## Option 2: Enable Public Networking

Railway databases are private by default. To access from your local machine:

1. **Go to PostgreSQL Service**
   - Click on PostgreSQL service in Railway

2. **Enable Public Networking**
   - Go to "Settings" tab
   - Look for "Networking" or "Public Networking"
   - Enable "Public Networking" or "Expose Port"
   - Railway will generate a public URL

3. **Get Public URL**
   - Go back to "Variables" tab
   - You should now see a public `DATABASE_URL`
   - It will have a domain like `containers-us-west-xxx.railway.app`

## Option 3: Use Railway CLI

```bash
# List all variables
railway variables

# Get specific service variables
railway variables --service postgres

# Look for DATABASE_URL that doesn't contain "internal"
```

## Option 4: Test from Railway Service (Alternative)

If you can't get public access, you can:

1. Deploy the registry node to Railway
2. Set the internal DATABASE_URL in Railway service variables
3. Test from within Railway's network

The internal URL will work fine when the registry node is deployed on Railway.

## Quick Check

Your current URL:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@postgres.railway.internal:5432/railway
```

Notice: `postgres.railway.internal` ← This is internal only

You need one like:
```
postgresql://postgres:VfMgOqgzvQOYhxrQNBAiShZELyIPPbLR@containers-us-west-xxx.railway.app:5432/railway
```

Notice: `containers-xxx.railway.app` ← This is public





