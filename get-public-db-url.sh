#!/bin/bash

# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi



# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi






# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi



# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi






# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi



# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi






# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi



# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi






# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi



# Get Public DATABASE_URL from Railway
# Railway internal URLs don't work from local machines

echo "🔍 Getting Public DATABASE_URL from Railway"
echo ""

if command -v railway &> /dev/null; then
    echo "Using Railway CLI..."
    echo ""
    
    # Try to get DATABASE_URL from Railway
    PUBLIC_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 | grep -v "internal" | head -1)
    
    if [ -z "$PUBLIC_URL" ]; then
        # Try alternative method
        PUBLIC_URL=$(railway variables 2>/dev/null | grep DATABASE_URL | grep -v internal | cut -d'=' -f2- | tr -d ' ' | head -1)
    fi
    
    if [ -n "$PUBLIC_URL" ]; then
        echo "✅ Found public DATABASE_URL:"
        echo ""
        echo "export DATABASE_URL=\"$PUBLIC_URL\""
        echo ""
        echo "Run this command to set it, then test:"
        echo "  export DATABASE_URL=\"$PUBLIC_URL\""
        echo "  npm run test:postgres"
    else
        echo "⚠️  Could not automatically get public URL"
        echo ""
        echo "Please get it manually:"
        echo "1. Go to Railway dashboard"
        echo "2. Click PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Look for DATABASE_URL (should NOT contain 'internal')"
        echo "5. It should look like: postgresql://postgres:pass@containers-xxx.railway.app:5432/railway"
    fi
else
    echo "❌ Railway CLI not found"
    echo ""
    echo "Get public DATABASE_URL from Railway dashboard:"
    echo "1. Go to https://railway.app"
    echo "2. Click PostgreSQL service"
    echo "3. Variables tab"
    echo "4. Copy DATABASE_URL (public one, not internal)"
fi





