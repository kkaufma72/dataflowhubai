# 🔒 Security Update Plan

## Current Vulnerabilities (18 total)

### High Priority
1. **vega-expression XSS** - High severity
2. **node-fetch header leakage** - High  
3. **d3-color ReDoS** - High

### Medium Priority
4. **esbuild dev server** - Moderate

## Safe Update Strategy

### Phase 1: Non-Breaking Updates ✅
```bash
# Update specific packages that won't break
npm update node-fetch
npm update d3-color
```

### Phase 2: Test Breaking Updates (One at a time)
```bash
# Create backup branch first
git checkout -b security-updates

# Update vite (test thoroughly)
npm install vite@latest

# If works, update tensorflow
npm install @tensorflow/tfjs-vis@latest
```

### Phase 3: Alternative Solutions
If updates break things:
- **Option A**: Remove @tensorflow/tfjs-vis (if not critical)
- **Option B**: Use overrides in package.json
- **Option C**: Wait for compatible versions

## Testing Checklist After Each Update
- [ ] Dev server starts
- [ ] No build errors
- [ ] App loads in browser
- [ ] Data upload works
- [ ] Charts render
- [ ] No console errors

## Rollback Plan
```bash
git checkout main
npm install
```

