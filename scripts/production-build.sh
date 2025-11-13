#!/bin/bash
# Production Build & Deployment Script
# Run this before deploying to production

set -e  # Exit on error

echo "🚀 DataFlowHub AI - Production Build Script"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check environment
echo "📋 Step 1: Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with required variables"
    exit 1
fi

required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_OPENAI_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables OK${NC}"
echo ""

# Step 2: Run linter
echo "🔍 Step 2: Running ESLint..."
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting has warnings (continuing anyway)${NC}"
fi
echo ""

# Step 3: Run tests
echo "🧪 Step 3: Running tests..."
if npm run test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed!${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 4: Build for production
echo "🔨 Step 4: Building for production..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 5: Check bundle sizes
echo "📦 Step 5: Analyzing bundle sizes..."
VENDOR_SIZE=$(du -h dist/js/vendor-*.js | cut -f1)
TOTAL_SIZE=$(du -sh dist | cut -f1)

echo "  Total dist size: $TOTAL_SIZE"
echo "  Vendor bundle: $VENDOR_SIZE"

if [[ "$VENDOR_SIZE" == *M* ]] && [[ "${VENDOR_SIZE%M}" -gt 2 ]]; then
    echo -e "${YELLOW}⚠️  Vendor bundle is large (>2MB). Consider optimizing.${NC}"
    echo "  See PRODUCTION_DEBUG_CHECKLIST.md Section 2 for optimization tips"
else
    echo -e "${GREEN}✅ Bundle size acceptable${NC}"
fi
echo ""

# Step 6: Preview build (optional)
echo "🔍 Step 6: Preview production build..."
echo "Run: npm run preview"
echo "Then open: http://localhost:5173"
echo ""

# Step 7: Deployment checklist
echo "📋 Step 7: Pre-deployment checklist:"
echo ""
echo "  [ ] All environment variables set in Vercel/hosting platform"
echo "  [ ] Supabase Edge Functions deployed"
echo "  [ ] Stripe webhook configured"
echo "  [ ] Database migrations applied"
echo "  [ ] OAuth redirect URLs updated for production domain"
echo ""

echo -e "${GREEN}🎉 Build complete! Ready to deploy.${NC}"
echo ""
echo "Next steps:"
echo "  1. Review PRODUCTION_DEBUG_CHECKLIST.md"
echo "  2. Run 'npm run preview' to test locally"
echo "  3. Deploy: 'vercel --prod' or 'git push origin main'"
echo ""
