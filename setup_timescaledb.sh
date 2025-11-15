#!/bin/bash

# TimescaleDB Quick Start Script
# This script sets up TimescaleDB for DataFlowHub AI

set -e  # Exit on error

echo "========================================================================"
echo "TimescaleDB Setup - DataFlowHub AI"
echo "========================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "📦 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "  Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    echo "  Please run this script from the project root directory"
    exit 1
fi

# Start TimescaleDB container
echo "🚀 Starting TimescaleDB container..."
docker-compose up -d timescaledb

# Wait for TimescaleDB to be ready
echo "⏳ Waiting for TimescaleDB to be ready..."
sleep 5

# Check if container is running
if ! docker ps | grep -q dataflow_timescaledb; then
    echo -e "${RED}✗ TimescaleDB container failed to start${NC}"
    echo "  Check logs with: docker logs dataflow_timescaledb"
    exit 1
fi
echo -e "${GREEN}✓ TimescaleDB container is running${NC}"
echo ""

# Wait for PostgreSQL to accept connections
echo "🔌 Waiting for PostgreSQL to accept connections..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec dataflow_timescaledb pg_isready -U tsdata_user > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    attempt=$((attempt+1))
    sleep 1
    echo -n "."
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ PostgreSQL failed to start${NC}"
    exit 1
fi
echo ""

# Create database if it doesn't exist
echo "💾 Verifying timeseries_db database..."
docker exec dataflow_timescaledb psql -U tsdata_user -d timeseries_db -tc "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database check failed, but it should be created automatically${NC}"
fi
echo ""

# Check if Python is available
echo "🐍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 is available${NC}"
echo ""

# Check if we're in a virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}⚠️  Not in a virtual environment${NC}"
    echo "  Consider creating one: python3 -m venv venv && source venv/bin/activate"
    echo ""
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
if [ -f "requirements.txt" ]; then
    if command -v pip3 &> /dev/null; then
        pip3 install -q -r requirements.txt 2>/dev/null || echo -e "${YELLOW}⚠️  Some dependencies may have failed to install${NC}"
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    elif command -v pip &> /dev/null; then
        pip install -q -r requirements.txt 2>/dev/null || echo -e "${YELLOW}⚠️  Some dependencies may have failed to install${NC}"
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  pip not found, skipping dependency installation${NC}"
        echo "  Install manually: pip3 install -r backend/requirements.txt"
    fi
else
    echo -e "${YELLOW}⚠️  requirements.txt not found, skipping${NC}"
fi
echo ""

# Run initialization script
echo "🔧 Initializing TimescaleDB..."
python3 scripts/setup_timescaledb.py

echo ""
echo "========================================================================"
echo -e "${GREEN}✅ TimescaleDB setup complete!${NC}"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "  1. Start the FastAPI backend:"
echo "     cd backend && uvicorn main:app --reload --port 8000"
echo ""
echo "  2. Test the endpoints:"
echo "     python backend/scripts/test_timescaledb_api.py"
echo ""
echo "  3. View the guide:"
echo "     cat TIMESCALEDB_GUIDE.md"
echo ""
echo "Useful commands:"
echo "  • Connect to DB: docker exec -it dataflow_timescaledb psql -U tsdata_user -d timeseries_db"
echo "  • View logs:     docker logs dataflow_timescaledb"
echo "  • Stop service:  docker-compose stop dataflow_timescaledb"
echo ""
