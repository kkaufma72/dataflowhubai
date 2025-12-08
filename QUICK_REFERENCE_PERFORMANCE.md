# ⚡ Quick Reference Card - Performance, Testing & Debugging

## 🚀 Getting Started (3 Commands)
```bash
npm run perf:setup        # Install all tools (one time)
npm run test:coverage     # Run tests + coverage
npm run build            # Check bundle sizes
```

## 🐛 Debug Panel (Ctrl+Shift+D)
**In Browser:**
- Press `Ctrl+Shift+D` to toggle debug panel
- **Errors Tab:** View all logged errors with stack traces
- **Performance Tab:** See component render times, slow operations
- **Memory Tab:** Check heap usage (Chrome only)

**In Console:**
```javascript
window.__performanceMonitor.logMetrics()      // Table view of all metrics
window.__performanceMonitor.getSlowOperations(500)  // Find slow ops >500ms
window.__performanceMonitor.export()          // Export as JSON
```

## 📊 Testing Commands
```bash
npm run test                # Run unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report → ./coverage/index.html
npm run test:e2e            # E2E tests (headless)
npm run test:e2e:open       # E2E tests (interactive)
npm run test:e2e:report     # E2E tests + HTML report
npm run test:a11y           # Accessibility tests
```

## 📦 Bundle Analysis
```bash
npm run build               # Build + see chunk sizes
npm run analyze            # Visual bundle analysis
npm run build:analyze      # Build + analyze together
```

**Key Metrics to Watch:**
- Vendor chunk: Target <1.5 MB (currently 2.17 MB)
- Individual chunks: Target <500 KB
- Total bundle: Target <2.5 MB (currently 3.0 MB)

## ⚡ Performance Monitoring Code

### Track Component Render Time
```typescript
import { performanceMonitor } from './lib/performanceMonitor';

function MyComponent() {
  useEffect(() => {
    performanceMonitor.markStart('MyComponent-render');
    return () => performanceMonitor.markEnd('MyComponent-render');
  }, []);
  
  return <div>...</div>;
}
```

### Track Custom Operations
```typescript
const start = performance.now();
await someExpensiveOperation();
performanceMonitor.record('operation-name', performance.now() - start);
```

### React Hook (Automatic)
```typescript
import { usePerformanceMonitor } from './lib/performanceMonitor';

function MyComponent() {
  const endMeasurement = usePerformanceMonitor('MyComponent');
  useEffect(() => endMeasurement, []);
}
```

## 🧪 Writing Tests

### Unit Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Template
```typescript
// cypress/e2e/my-feature.cy.ts
describe('My Feature', () => {
  beforeEach(() => {
    cy.visit('/my-page');
  });
  
  it('should work', () => {
    cy.get('[data-testid="button"]').click();
    cy.contains('Success').should('be.visible');
  });
});
```

## 🎯 Coverage Targets
| Category | Target | Priority |
|----------|--------|----------|
| Overall | 70% | Must |
| Critical paths | 90% | Must |
| UI components | 60% | Nice |
| Utils/libs | 80% | Must |

## 🔍 Finding Issues

### Slow Pages
1. Open Debug Panel (Ctrl+Shift+D)
2. Go to Performance tab
3. Navigate to page
4. Check for operations >500ms
5. Optimize identified components

### Memory Leaks
1. Open Debug Panel → Memory tab
2. Navigate between pages 10+ times
3. Watch heap size
4. If heap grows >50MB continuously, investigate
5. Use Chrome DevTools → Memory → Take snapshot

### Bundle Size Issues
1. Run `npm run build`
2. Look for warnings about large chunks
3. Run `npm run analyze`
4. Identify heavy dependencies
5. Consider lazy loading or alternatives

## 📈 Performance Benchmarks

### Current Status
```
✅ Build Time: 13.32s
⚠️ Initial Load: ~2.5s (target: <2s)
⚠️ Time to Interactive: ~3s (target: <2.5s)
⚠️ Vendor Bundle: 2.17 MB (target: <1.5 MB)
✅ Main Bundle: 98 KB
✅ TypeScript Errors: 0
```

### After Optimizations
```
Expected Improvements:
- Vendor Bundle: -40% (2.17 MB → 1.3 MB)
- Initial Load: -20% (2.5s → 2.0s)
- Time to Interactive: -17% (3.0s → 2.5s)
```

## 🛠️ Troubleshooting

### Coverage Report Fails
```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Try again
npm run test:coverage
```

### Debug Panel Not Showing
- Only works in DEV mode (`npm run dev`)
- Press `Ctrl+Shift+D` to toggle
- Check console for errors
- Clear browser cache

### Bundle Analysis Fails
```bash
# Install visualizer
npm install -D vite-bundle-visualizer

# Build first
npm run build

# Then analyze
npm run analyze
```

## 📁 Important Files

```
/PERFORMANCE_TESTING_DEBUG_GUIDE.md    # Complete guide
/🎉_PERFORMANCE_TOOLS_READY.md          # Implementation summary
/vitest.config.ts                       # Test coverage config
/vite.config.ts                         # Build & bundle config
/src/lib/performanceMonitor.ts         # Performance tracking
/src/components/debug/DebugPanel.tsx   # Debug UI
/setup-performance-tools.sh            # Installation script
```

## 💡 Pro Tips

1. **Daily:** Check Debug Panel for errors and slow operations
2. **Before Commit:** Run `npm run test` and `npm run build`
3. **Weekly:** Review performance trends, add tests for new features
4. **Monthly:** Run full coverage audit, optimize slow operations

## 🎯 Quick Wins

1. ✅ Install tools: `npm run perf:setup`
2. ✅ Check coverage baseline: `npm run test:coverage`
3. ✅ Analyze bundle: `npm run build && npm run analyze`
4. ✅ Test Debug Panel: `npm run dev` → Ctrl+Shift+D
5. ✅ Add performance tracking to 3-5 key components

## 🚀 Ready to Optimize!

**Your toolkit is ready. Start with:** `npm run perf:setup`
