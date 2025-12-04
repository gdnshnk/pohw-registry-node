#!/bin/bash

# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi



# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi






# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi



# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi






# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi



# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi






# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi



# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi






# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi



# PostgreSQL Test Setup Script
# Sets up a test PostgreSQL database for testing

set -e

echo "🔧 PoHW PostgreSQL Test Setup"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    echo ""
    echo "Starting PostgreSQL test container..."
    docker-compose -f docker-compose.test.yml up -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec pohw-postgres-test pg_isready -U pohw &> /dev/null; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    echo ""
    echo "📝 Setting DATABASE_URL environment variable..."
    export DATABASE_URL="postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test"
    
    echo ""
    echo "✅ Test database ready!"
    echo ""
    echo "To run tests:"
    echo "  export DATABASE_URL=\"postgresql://pohw:pohw_test_password@localhost:5433/pohw_registry_test\""
    echo "  npm run test:postgres"
    echo ""
    echo "To stop the test database:"
    echo "  docker-compose -f docker-compose.test.yml down"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Alternative: Use local PostgreSQL"
    echo "1. Install PostgreSQL locally"
    echo "2. Create database: createdb pohw_registry_test"
    echo "3. Set DATABASE_URL: export DATABASE_URL=\"postgresql://localhost/pohw_registry_test\""
    echo "4. Run: npm run test:postgres"
fi





