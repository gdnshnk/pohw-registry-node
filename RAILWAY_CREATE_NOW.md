# Create Railway Service - Right Now! 🚀

## Step 1: Create Service (2 minutes)

1. **Open Railway Dashboard:**
   👉 https://railway.com/project/28b4954a-2b43-4095-a1a9-b0afd6dd28af

2. **Click the "+" button** (top right) or **"New"** button

3. **Select "GitHub Repo"**

4. **Choose your repository:**
   - If you see `gdnshnk/pohw-registry-node` → select it
   - If not, search for it or connect it

5. **Service will be created automatically:**
   - Railway detects the Dockerfile
   - Starts building immediately
   - Name it `pohw-registry-node` if prompted

## Step 2: After Service is Created

**Run this command immediately:**
```bash
cd /Users/gideon/Desktop/pohw/pohw-registry-node
./setup-railway-service.sh
```

This will:
- ✅ Link the CLI to the service
- ✅ Trigger deployment
- ✅ Get the public URL

## Step 3: Set Environment Variables

In Railway Dashboard → Your Service → Settings → Variables:

```
ANCHORING_ENABLED=true
BITCOIN_ENABLED=true
BITCOIN_NETWORK=testnet
BITCOIN_PRIVATE_KEY=cPq4fg3yLXXuYF4z32uKcS5MqUYhXtqzShD9qHffzHyQWTn9KobU
ETHEREUM_ENABLED=true
ETHEREUM_NETWORK=sepolia
ETHEREUM_PRIVATE_KEY=0xcdaffeccb9b68e266e7f71dd74bc5a3cbdcb9e8837cae822b7e643d01381bcc3
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Step 4: Get Public URL

1. Go to Service → Settings → Networking
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://pohw-registry-node-production.up.railway.app`)

## Step 5: Update gdn.sh

Once you have the URL, I'll update `gdn.sh/pohw/verify/index.html` with it!

---

**Ready?** Go create the service now, then tell me when it's done! 🎯

