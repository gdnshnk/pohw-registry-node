#!/usr/bin/env bash
# Quick setup after service is created in Railway dashboard

echo "🔗 Linking to pohw-registry-node service..."
railway service pohw-registry-node

echo ""
echo "📦 Deploying..."
railway up --detach

echo ""
echo "🌐 Getting domain..."
railway domain

echo ""
echo "✅ Done! Check Railway dashboard for deployment status."
