# Railway PostgreSQL Setup Guide

This guide will help you set up a PostgreSQL database on Railway for the PoHW registry node.

## Step 1: Create Railway Account (if needed)

1. Go to [railway.app](https://railway.app)
2. Sign up or log in with GitHub

## Step 2: Create a New Project

1. Click "New Project"
2. Select "Empty Project" or "Deploy from GitHub repo" (if you want to deploy the registry node)

## Step 3: Add PostgreSQL Service

1. In your project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database

## Step 4: Get DATABASE_URL

1. Click on the PostgreSQL service
2. Go to the "Variables" tab
3. Find `DATABASE_URL` (or `POSTGRES_URL`)
4. Copy the connection string

It will look like:
```
postgresql://postgres:password@hostname.railway.app:5432/railway
```

## Step 5: Set Environment Variable

### Option A: In Railway (for deployment)

1. Go to your registry node service (or create one)
2. Go to "Variables" tab
3. Add variable:
   - Name: `DATABASE_URL`
   - Value: (paste the PostgreSQL connection string)

### Option B: Locally (for testing)

```bash
export DATABASE_URL="postgresql://postgres:password@hostname.railway.app:5432/railway"
```

Or add to your `.env` file:
```
DATABASE_URL=postgresql://postgres:password@hostname.railway.app:5432/railway
```

## Step 6: Test Connection

```bash
npm run test:postgres
```

## Step 7: Deploy Registry Node

If deploying the registry node to Railway:

1. Connect your GitHub repo or deploy directly
2. Set `DATABASE_URL` in service variables
3. The registry node will automatically:
   - Detect DATABASE_URL
   - Use PostgreSQL instead of file-based storage
   - Initialize schema on first run
   - Persist data across deployments

## Troubleshooting

### Connection Issues

- Verify DATABASE_URL is correct
- Check Railway service is running
- Ensure network connectivity
- Check Railway service logs

### Schema Issues

- Schema auto-initializes on first connection
- Check PostgreSQL service logs in Railway
- Verify user has CREATE TABLE permissions

### Performance

- Railway PostgreSQL is shared by default
- For production, consider Railway Pro plan
- Monitor database usage in Railway dashboard

## Security Notes

- Never commit DATABASE_URL to git
- Use Railway's environment variables
- Rotate passwords regularly
- Use Railway's private networking when possible

## Next Steps

After setting up PostgreSQL:

1. ✅ Test connection: `npm run test:postgres`
2. ✅ Deploy registry node with DATABASE_URL
3. ✅ Verify data persists across deployments
4. ✅ Monitor database usage
5. ✅ Set up backups (Railway handles this automatically)
