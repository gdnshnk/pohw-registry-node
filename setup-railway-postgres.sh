#!/bin/bash

# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi



# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi






# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi



# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi






# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi



# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi






# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi



# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi






# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi



# Railway PostgreSQL Setup Helper Script
# This script helps set up PostgreSQL on Railway

set -e

echo "🚂 Railway PostgreSQL Setup Helper"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI found"
    echo ""
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        echo "✅ Logged in to Railway"
        USER=$(railway whoami 2>/dev/null | head -1 || echo "unknown")
        echo "   User: $USER"
        echo ""
    else
        echo "⚠️  Not logged in to Railway"
        echo "   Run: railway login"
        exit 1
    fi
    
    echo "📋 Setting up PostgreSQL on Railway..."
    echo ""
    
    # Check if in a Railway project
    if [ -f ".railway/project.json" ]; then
        echo "✅ Railway project detected"
        PROJECT_ID=$(cat .railway/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
        echo "   Project ID: $PROJECT_ID"
        echo ""
    else
        echo "ℹ️  No Railway project found"
        echo "   Initializing new Railway project..."
        railway init
        echo ""
    fi
    
    echo "🔧 Adding PostgreSQL service..."
    echo "   (This will create a new PostgreSQL database)"
    echo ""
    
    # Add PostgreSQL service
    railway add postgresql
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "📝 Getting DATABASE_URL..."
    DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || railway variables | grep DATABASE_URL | cut -d'=' -f2- | tr -d ' ')
    
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL found!"
        echo ""
        echo "📋 Add this to your environment:"
        echo ""
        echo "export DATABASE_URL=\"$DATABASE_URL\""
        echo ""
        echo "Or add to .env file:"
        echo "DATABASE_URL=$DATABASE_URL"
        echo ""
        
        # Ask if user wants to test
        read -p "Would you like to test the connection now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            export DATABASE_URL="$DATABASE_URL"
            echo ""
            echo "🧪 Running PostgreSQL tests..."
            npm run test:postgres
        fi
    else
        echo "⚠️  Could not automatically get DATABASE_URL"
        echo ""
        echo "Please:"
        echo "1. Go to Railway dashboard"
        echo "2. Open your PostgreSQL service"
        echo "3. Go to Variables tab"
        echo "4. Copy DATABASE_URL"
        echo "5. Run: export DATABASE_URL=\"your_connection_string\""
        echo "6. Run: npm run test:postgres"
    fi
    
else
    echo "❌ Railway CLI not installed"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or use Railway web interface:"
    echo "  1. Go to https://railway.app"
    echo "  2. Create new project"
    echo "  3. Add PostgreSQL service"
    echo "  4. Copy DATABASE_URL from Variables tab"
    echo "  5. Set: export DATABASE_URL=\"your_connection_string\""
    echo "  6. Run: npm run test:postgres"
    echo ""
    echo "See RAILWAY_SETUP.md for detailed instructions"
fi





