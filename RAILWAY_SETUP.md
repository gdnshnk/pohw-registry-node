# Railway Deployment - Quick Setup

## ✅ What's Already Done

- ✅ Railway CLI installed
- ✅ Logged in to Railway
- ✅ Project created: `pohw-registry-node`
- ✅ Configuration files created:
  - `railway.json` - Railway settings
  - `nixpacks.toml` - Build configuration
  - `package.json` - Updated to create data directory
- ✅ Code pushed to GitHub: `gdnshnk/pohw-registry-node`

## 🔗 Connect Service via Dashboard (Easiest)

### Step 1: Open Railway Dashboard
Go to: https://railway.com/project/28b4954a-2b43-4095-a1a9-b0afd6dd28af

### Step 2: Add GitHub Service
1. Click the **"+"** button or **"New"** button
2. Select **"GitHub Repo"**
3. Choose repository: **`gdnshnk/pohw-registry-node`**
4. Railway will automatically:
   - Detect it's a Node.js project
   - Use `nixpacks.toml` for build
   - Deploy automatically

### Step 3: Wait for Deployment
- Railway will build and deploy
- Watch the logs in the dashboard
- Should take 2-3 minutes

### Step 4: Get Public URL
Once deployed:
1. Click on the service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `https://pohw-registry-node-production.up.railway.app`)

### Step 5: Update Verification Page
```bash
cd /Users/gideon/Desktop/pohw/gdn.sh
./update-registry-url.sh https://YOUR-RAILWAY-URL.railway.app
git add pohw/verify/index.html
git commit -m "Connect to deployed registry"
git push
```

## 🐛 If Deployment Fails

Check the logs in Railway dashboard:
1. Click on the service
2. Click **"Deployments"** tab
3. Click on the failed deployment
4. Check **"Build Logs"** for errors

Common fixes:
- **Missing dependencies**: Already handled by `nixpacks.toml`
- **Port issues**: Already configured to use `process.env.PORT`
- **Data directory**: Already handled in `package.json` start script

## ✅ Verification

Once deployed, test:
```bash
curl https://YOUR-URL.railway.app/health
curl https://YOUR-URL.railway.app/pohw/status
```

Both should return JSON responses.

