#!/bin/bash

echo "🔴 COMPLETE RESTART SCRIPT"
echo "=========================="
echo ""

# Step 1: Kill ALL processes
echo "1️⃣  Killing all Vite processes..."
pkill -9 -f "vite" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
sleep 2

# Step 2: Nuclear cache clear
echo "2️⃣  Clearing ALL caches..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache  
rm -rf dist
rm -rf .vite
rm -rf coverage

# Step 3: Show current port config
echo "3️⃣  Current Vite configuration:"
grep -A 1 "port:" vite.config.ts | head -3

echo ""
echo "✅ All clean! Now run:"
echo "   npm run dev"
echo ""
echo "📌 IMPORTANT: Access your app at http://localhost:3003 (PORT 3003!)"
echo "📌 Use INCOGNITO/PRIVATE window to avoid browser cache"
echo ""




