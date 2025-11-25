# Quick Deploy Guide

## Fastest Way: Railway (5 minutes)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy:**
   ```bash
   cd pohw-registry-node
   railway init
   railway up
   ```

3. **Get your public URL:**
   Railway will show: `https://your-app.railway.app`

4. **Update gdn.sh verification page:**
   Edit `gdn.sh/pohw/verify/index.html` and change:
   ```javascript
   const REGISTRY_URL = 'https://your-app.railway.app';
   ```

5. **Test:**
   Visit `https://gdn.sh/pohw/verify` and verify a hash!

## Alternative: Render (No CLI needed)

1. Go to https://render.com
2. Connect your GitHub repo: `gdnshnk/pohw-registry-node`
3. Render will auto-detect `render.yaml`
4. Click "Deploy"
5. Get your public URL and update `gdn.sh` as above

## What You Get

✅ Public registry API accessible from browsers
✅ CORS enabled (already configured)
✅ Open verification per PoHW principles
✅ Works with `gdn.sh/pohw/verify` page

## Next Steps

After deployment:
1. Update `REGISTRY_URL` in `gdn.sh/pohw/verify/index.html`
2. Test verification with a real hash
3. Your registry is now part of the PoHW federated network!

