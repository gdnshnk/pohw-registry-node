# PoHW Registry Node - Public Deployment Guide

This guide helps you deploy your PoHW registry node publicly so it can be accessed by verification clients like `gdn.sh/pohw/verify`.

## Why Public Deployment?

According to PoHW principles:
- **Open Verification**: "Anyone—without permission or platform access—can verify proofs"
- **Federated Architecture**: "Each registry maintains its own infrastructure and publishes public audit logs"
- **No Paywalled Truth**: Verification must remain free and accessible

## Deployment Options

### Option 1: Railway (Recommended for Quick Start)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize Project:**
   ```bash
   cd pohw-registry-node
   railway init
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set BATCH_SIZE=1000
   # Optional: Add anchoring config
   railway variables set ANCHORING_ENABLED=true
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Get Public URL:**
   Railway will provide a public URL like `https://your-app.railway.app`

### Option 2: Render

1. **Create `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: pohw-registry-node
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 3000
   ```

2. **Deploy via Render Dashboard:**
   - Connect your GitHub repository
   - Render will auto-detect and deploy

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server:**
   ```bash
   ssh user@your-server.com
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and Setup:**
   ```bash
   git clone https://github.com/gdnshnk/pohw-registry-node.git
   cd pohw-registry-node
   npm install
   npm run build
   ```

4. **Setup PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name pohw-registry
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 80;
       server_name registry.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d registry.yourdomain.com
   ```

### Option 4: Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`:**
   ```toml
   app = "pohw-registry-node"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 1
   ```

3. **Deploy:**
   ```bash
   fly launch
   fly secrets set NODE_ENV=production
   fly deploy
   ```

## Environment Variables

Set these in your deployment platform:

**Required:**
- `NODE_ENV=production`
- `PORT=3000` (or your platform's port)

**Optional:**
- `BATCH_SIZE=1000` (default: 1000)
- `ANCHORING_ENABLED=true` (if using blockchain anchoring)
- `BITCOIN_ENABLED=true`
- `BITCOIN_NETWORK=testnet`
- `BITCOIN_PRIVATE_KEY=...` (WIF format)
- `ETHEREUM_ENABLED=true`
- `ETHEREUM_NETWORK=sepolia`
- `ETHEREUM_PRIVATE_KEY=...` (hex format)

## Verify Deployment

Once deployed, test your public registry:

```bash
# Health check
curl https://your-registry-url.com/health

# Status
curl https://your-registry-url.com/pohw/status

# Verify a proof
curl https://your-registry-url.com/pohw/verify/0x...
```

## Update Verification Page

After deployment, update `gdn.sh/pohw/verify/index.html` to use your public registry URL:

```javascript
const REGISTRY_URL = 'https://your-registry-url.com';
```

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting for public endpoints
2. **HTTPS**: Always use HTTPS in production
3. **Database Backups**: Regularly backup your `data/` directory
4. **Monitoring**: Set up monitoring and alerts
5. **Private Keys**: Never commit private keys; use environment variables

## CORS Configuration

CORS is already enabled in the registry node (`app.use(cors())`), which allows browsers to access the API from any domain. This is correct for PoHW's open verification principle.

## Next Steps

1. Deploy your registry node to a public URL
2. Update `gdn.sh/pohw/verify/index.html` with the public URL
3. Test verification from the browser
4. Add your registry to the federated network

## Support

For issues, see:
- Registry Node README: `README.md`
- API Documentation: `README.md#api-endpoints`
- PoHW Protocol: https://proofofhumanwork.org/spec

