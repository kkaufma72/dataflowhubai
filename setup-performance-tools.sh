#!/bin/bash

# Performance, Testing & Debugging Setup Script
# Run this to install all necessary dependencies and configure the environment

echo "🚀 Setting up Performance, Testing & Debugging Tools..."
echo ""

# Install coverage provider for Vitest
echo "📦 Installing Vitest coverage provider..."
npm install -D @vitest/coverage-v8

# Install bundle analysis tools
echo "📊 Installing bundle analysis tools..."
npm install -D vite-bundle-visualizer rollup-plugin-visualizer

# Install E2E test reporting
echo "📝 Installing E2E test reporters..."
npm install -D mochawesome mochawesome-merge mochawesome-report-generator

# Install additional testing utilities
echo "🧪 Installing additional testing utilities..."
npm install -D @testing-library/user-event @testing-library/react-hooks

echo ""
echo "✅ Installation complete!"
echo ""
echo "📚 Available Commands:"
echo "  npm run test                - Run unit tests"
echo "  npm run test:coverage       - Run tests with coverage report"
echo "  npm run test:e2e            - Run E2E tests"
echo "  npm run analyze             - Analyze bundle sizes"
echo "  npm run build:analyze       - Build and analyze"
echo ""
echo "🐛 Debug Panel:"
echo "  Press Ctrl+Shift+D in the app to open debug panel"
echo "  Console: window.__performanceMonitor.logMetrics()"
echo ""
echo "📊 Next Steps:"
echo "  1. Run: npm run test:coverage"
echo "  2. Check coverage report in: ./coverage/index.html"
echo "  3. Run: npm run build"
echo "  4. Check bundle sizes"
echo "  5. Run: npm run analyze (after build)"
echo ""
