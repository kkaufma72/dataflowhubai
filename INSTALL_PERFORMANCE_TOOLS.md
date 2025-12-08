# 🚀 Quick Installation Guide

## ⚡ Install All Tools (Copy & Paste)

Run this single command in your terminal:

```bash
npm install -D @vitest/coverage-v8 vite-bundle-visualizer rollup-plugin-visualizer mochawesome mochawesome-merge mochawesome-report-generator @testing-library/user-event
```

## ✅ After Installation

### 1. Test Coverage
```bash
npm run test:coverage
open coverage/index.html
```

### 2. Bundle Analysis
```bash
npm run build
npm run analyze
```

### 3. Debug Panel
```bash
npm run dev
# Press Ctrl+Shift+D in browser
```

## 📊 Verify Installation

Check if packages are installed:
```bash
npm list @vitest/coverage-v8
npm list vite-bundle-visualizer
```

## 🐛 Troubleshooting

### Coverage Provider Not Found
```bash
npm install -D @vitest/coverage-v8
```

### Bundle Visualizer Missing
```bash
npm install -D vite-bundle-visualizer
```

### E2E Reports Not Generating
```bash
npm install -D mochawesome mochawesome-merge mochawesome-report-generator
```

## 🎯 Quick Test

After installation, verify everything works:

```bash
# 1. Run tests with coverage
npm run test:coverage

# 2. Build and analyze
npm run build
npm run analyze

# 3. Start dev server with debug panel
npm run dev
```

## 📦 What Gets Installed

| Package | Purpose | Size |
|---------|---------|------|
| @vitest/coverage-v8 | Test coverage provider | ~2MB |
| vite-bundle-visualizer | Visual bundle analysis | ~500KB |
| rollup-plugin-visualizer | Additional bundle analysis | ~300KB |
| mochawesome | E2E test reporter | ~1MB |
| mochawesome-merge | Merge test reports | ~100KB |
| mochawesome-report-generator | Generate HTML reports | ~800KB |
| @testing-library/user-event | Enhanced test utilities | ~200KB |

**Total:** ~5MB dev dependencies

## ⚡ All Set!

Once installed, you can use:
- `npm run test:coverage` - See test coverage
- `npm run analyze` - Visualize bundle sizes
- `Ctrl+Shift+D` - Open debug panel
- `window.__performanceMonitor.logMetrics()` - View performance data

Happy optimizing! 🚀
