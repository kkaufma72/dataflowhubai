# 🔧 Quick Fix for Coverage Error

## Problem
Version mismatch between Vitest (4.0.14) and coverage provider (1.6.1)

## Solution

Run these commands:

```bash
# Remove old coverage provider
npm uninstall @vitest/coverage-v8 @vitest/ui

# Install matching versions
npm install -D @vitest/coverage-v8@^4.0.14 @vitest/ui@^4.0.14

# Also install other tools
npm install -D vite-bundle-visualizer rollup-plugin-visualizer mochawesome mochawesome-merge mochawesome-report-generator

# Fix security vulnerabilities (optional)
npm audit fix
```

## Then Test

```bash
npm run test:coverage
```

## Alternative: Downgrade Vitest

If you prefer to keep the old coverage provider:

```bash
npm install -D vitest@^1.6.1
```

But I recommend upgrading the coverage provider to match Vitest 4.x instead.

## Quick One-Liner

```bash
npm uninstall @vitest/coverage-v8 @vitest/ui && npm install -D @vitest/coverage-v8@^4.0.14 @vitest/ui@^4.0.14 vite-bundle-visualizer rollup-plugin-visualizer mochawesome mochawesome-merge mochawesome-report-generator && npm audit fix
```
