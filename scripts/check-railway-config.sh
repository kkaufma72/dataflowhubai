#!/bin/bash
# Railway Setup Verification Script

echo "🚂 Railway Backend Configuration Check"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_required() {
    local var_name=$1
    local var_value=$2
    
    if [ -z "$var_value" ] || [[ "$var_value" == *"YOUR_"* ]] || [[ "$var_value" == *"[YOUR"* ]]; then
        echo -e "${RED}✗${NC} $var_name is missing or not set"
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name is configured"
        return 0
    fi
}

check_optional() {
    local var_name=$1
    local var_value=$2
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}○${NC} $var_name (optional - not set)"
        return 0
    else
        echo -e "${GREEN}✓${NC} $var_name is configured"
        return 0
    fi
}

echo "Required Variables:"
echo "-------------------"
all_required_ok=true

check_required "DATABASE_URL" "$DATABASE_URL" || all_required_ok=false
check_required "SUPABASE_URL" "$SUPABASE_URL" || all_required_ok=false
check_required "SUPABASE_KEY" "$SUPABASE_KEY" || all_required_ok=false
check_required "SUPABASE_JWT_SECRET" "$SUPABASE_JWT_SECRET" || all_required_ok=false
check_required "JWT_SECRET_KEY" "$JWT_SECRET_KEY" || all_required_ok=false

echo ""
echo "Optional Services:"
echo "------------------"
check_optional "REDIS_URL" "$REDIS_URL"
check_optional "MINIO_ENDPOINT" "$MINIO_ENDPOINT"
check_optional "NEO4J_URI" "$NEO4J_URI"
check_optional "TIMESCALEDB_HOST" "$TIMESCALEDB_HOST"

echo ""
echo "Application Settings:"
echo "--------------------"
echo "ENVIRONMENT: ${ENVIRONMENT:-development}"
echo "DEBUG: ${DEBUG:-false}"
echo "LOG_LEVEL: ${LOG_LEVEL:-INFO}"

echo ""
echo "========================================"

if [ "$all_required_ok" = true ]; then
    echo -e "${GREEN}✓ All required variables are configured!${NC}"
    echo ""
    echo "Your backend should now connect to Supabase successfully."
    echo "Optional services will be skipped gracefully."
    exit 0
else
    echo -e "${RED}✗ Some required variables are missing!${NC}"
    echo ""
    echo "Please set the missing variables in Railway:"
    echo "1. Go to your Railway project"
    echo "2. Select your backend service"
    echo "3. Click 'Variables' tab"
    echo "4. Add the missing variables from .railway-env-template"
    echo ""
    echo "Get your credentials from:"
    echo "https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/settings/api"
    exit 1
fi
