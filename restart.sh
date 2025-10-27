#!/bin/bash
echo "🛑 Step 1: Stopping all Vite processes..."
pkill -9 -f "vite" 2>/dev/null || true
sleep 2

echo "🗑️  Step 2: Removing ALL cache directories..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite
rm -rf node_modules/.cache

echo "✅ Step 3: Ready! Now run: npm run dev"
