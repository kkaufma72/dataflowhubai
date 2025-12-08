# 🚀 Performance, Testing & Debugging Improvement Guide

**Date:** December 8, 2025  
**Status:** Comprehensive Action Plan

---

## 📊 Current Status Analysis

### Build Performance ✅
- **Build Time:** 13.32s (Good)
- **Total Bundle Size:** ~3.0 MB
- **Largest Chunk:** vendor.js (2,176 KB) ⚠️
- **TypeScript:** 0 errors ✅
- **Chunks Generated:** 72 chunks ✅

### Test Coverage
- **Unit Tests:** 10 test files ✅
- **E2E Tests:** 7 test files ✅
- **Coverage Status:** Unknown (need to fix coverage reporting)

### Known Issues
1. ⚠️ Vendor bundle too large (2.17 MB)
2. ⚠️ Some chunks > 500 KB (ModelTraining: 107 KB)
3. ⚠️ Dynamic import warning for enhancedSampleData.ts
4. ⚠️ Test coverage reporting broken

---

## 🎯 Priority Action Items

### 1. CRITICAL: Fix Bundle Size (Vendor Chunk)

**Problem:** Vendor bundle is 2,176 KB (73% of total bundle)

**Solution A: Split Vendor Bundle Further**

```typescript
// vite.config.ts - Add more granular splitting
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    // React ecosystem
    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
      return 'react-vendor';
    }
    // Chart libraries
    if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
      return 'charts';
    }
    // D3 ecosystem
    if (id.includes('d3')) {
      return 'd3';
    }
    // AI/LangChain libraries (HEAVY)
    if (id.includes('langchain') || id.includes('@langchain') || id.includes('ai-sdk')) {
      return 'ai';
    }
    // TensorFlow (HEAVY)
    if (id.includes('@tensorflow')) {
      return 'tensorflow';
    }
    // Supabase
    if (id.includes('supabase') || id.includes('@supabase')) {
      return 'supabase';
    }
    // Stripe
    if (id.includes('stripe')) {
      return 'stripe';
    }
    // Math/Data processing
    if (id.includes('mathjs') || id.includes('papaparse') || id.includes('jszip')) {
      return 'data-processing';
    }
    // UI libraries
    if (id.includes('@tremor') || id.includes('lucide-react')) {
      return 'ui-libs';
    }
    return 'vendor';
  }
}
```

**Solution B: Lazy Load Heavy Features**

```typescript
// Create lazy wrappers for heavy components
// src/components/lazy/LazyTensorFlow.tsx
export const LazyTensorFlowComponent = lazy(() => 
  import('../ml/TensorFlowTraining.tsx')
);

// src/components/lazy/LazyLangChain.tsx
export const LazyAIAgent = lazy(() =>
  import('../ai/AIAgentOrchestrator.tsx')
);
```

**Expected Impact:** Reduce vendor bundle by 30-40% (from 2.17 MB to ~1.3 MB)

---

### 2. HIGH: Fix Dynamic Import Warning

**Problem:** `enhancedSampleData.ts` is both statically and dynamically imported

**Current Code:**
```typescript
// MLContext.tsx
import { sampleDatasets } from '../lib/enhancedSampleData';  // Static import
const { sampleDatasets } = await import('../lib/enhancedSampleData'); // Dynamic import
```

**Solution:**
```typescript
// Remove static import, use only dynamic import
// MLContext.tsx - Line ~50
const loadSampleData = async () => {
  try {
    const { sampleDatasets } = await import('../lib/enhancedSampleData');
    // Use sampleDatasets
  } catch (error) {
    console.error('Failed to load sample data:', error);
  }
};
```

**Files to Fix:**
- `src/context/MLContext.tsx`
- `src/pages/DataManagementHybrid.tsx`
- `src/utils/seedDatasets.ts`

---

### 3. HIGH: Implement Test Coverage Reporting

**Problem:** `npm run test:coverage` fails with provider error

**Solution:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'cypress/',
        '**/*.test.{ts,tsx}',
        '**/*.cy.{ts,tsx}'
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
```

**Install Coverage Provider:**
```bash
npm install -D @vitest/coverage-v8
```

---

### 4. MEDIUM: Add Performance Monitoring

**Create Performance Tracker:**

```typescript
// src/lib/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  markStart(label: string) {
    performance.mark(`${label}-start`);
  }

  markEnd(label: string) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    if (measure) {
      this.recordMetric(label, measure.duration);
    }
  }

  private recordMetric(label: string, duration: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
  }

  getMetrics(label: string) {
    const durations = this.metrics.get(label) || [];
    if (durations.length === 0) return null;

    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length,
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((_, label) => {
      result[label] = this.getMetrics(label);
    });
    return result;
  }

  logMetrics() {
    console.table(this.getAllMetrics());
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage in components:
// useEffect(() => {
//   performanceMonitor.markStart('DataManagement-render');
//   return () => performanceMonitor.markEnd('DataManagement-render');
// }, []);
```

---

### 5. MEDIUM: Add Bundle Analysis Script

```json
// package.json - Add to scripts
{
  "scripts": {
    "analyze": "vite-bundle-visualizer",
    "build:analyze": "vite build --mode analyze && vite-bundle-visualizer"
  }
}
```

```bash
# Install bundle visualizer
npm install -D vite-bundle-visualizer
```

---

### 6. MEDIUM: Enhance Error Debugging

**Create Debug Panel:**

```typescript
// src/components/debug/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { getErrorLogs } from '../../lib/errorHandling';
import { performanceMonitor } from '../../lib/performanceMonitor';

export const DebugPanel: React.FC = () => {
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState<'errors' | 'performance'>('errors');
  const errorLogs = getErrorLogs();
  const perfMetrics = performanceMonitor.getAllMetrics();

  // Show debug panel with Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShow(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 max-h-96 overflow-auto z-50 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🐛 Debug Panel</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('errors')}
            className={`px-3 py-1 rounded ${tab === 'errors' ? 'bg-red-600' : 'bg-gray-700'}`}
          >
            Errors ({errorLogs.length})
          </button>
          <button
            onClick={() => setTab('performance')}
            className={`px-3 py-1 rounded ${tab === 'performance' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Performance
          </button>
          <button onClick={() => setShow(false)} className="px-3 py-1 bg-gray-700 rounded">
            Close
          </button>
        </div>
      </div>

      {tab === 'errors' && (
        <div className="space-y-2">
          {errorLogs.map((log) => (
            <div key={log.id} className="bg-red-900/30 p-2 rounded text-sm">
              <div className="font-mono text-red-300">{log.timestamp}</div>
              <div className="text-red-100">{log.error.message}</div>
              {log.url && <div className="text-gray-400 text-xs">{log.url}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-2">
          {Object.entries(perfMetrics).map(([label, metrics]) => (
            <div key={label} className="bg-blue-900/30 p-2 rounded text-sm">
              <div className="font-bold text-blue-300">{label}</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>Avg: {metrics.avg.toFixed(2)}ms</div>
                <div>Min: {metrics.min.toFixed(2)}ms</div>
                <div>Max: {metrics.max.toFixed(2)}ms</div>
                <div>Count: {metrics.count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Add to main.tsx:**
```typescript
// Only in development
{import.meta.env.DEV && <DebugPanel />}
```

---

### 7. LOW: Add Missing Test Cases

**High-Value Components to Test:**

1. **Context Providers**
   ```typescript
   // src/context/__tests__/MLContext.test.tsx
   import { renderHook, act } from '@testing-library/react';
   import { MLProvider, useMLContext } from '../MLContext';
   
   describe('MLContext', () => {
     it('should add dataset', async () => {
       const { result } = renderHook(() => useMLContext(), {
         wrapper: MLProvider,
       });
       
       await act(async () => {
         await result.current.addDataset(mockDataset);
       });
       
       expect(result.current.datasets).toHaveLength(1);
     });
   });
   ```

2. **Critical Hooks**
   ```typescript
   // src/hooks/__tests__/useFeatureAccess.test.ts
   import { renderHook } from '@testing-library/react';
   import { useFeatureAccess } from '../useFeatureAccess';
   
   describe('useFeatureAccess', () => {
     it('should allow feature for paid tier', () => {
       const { result } = renderHook(() => useFeatureAccess('advanced-ml'));
       expect(result.current.hasAccess).toBe(true);
     });
   });
   ```

3. **Data Processing**
   ```typescript
   // src/lib/__tests__/dataProcessor.test.ts
   import { processCSV, validateDataset } from '../dataProcessor';
   
   describe('Data Processing', () => {
     it('should parse CSV correctly', async () => {
       const csvData = 'name,age\nJohn,30\nJane,25';
       const result = await processCSV(csvData);
       expect(result.rows).toBe(2);
       expect(result.columns).toEqual(['name', 'age']);
     });
   });
   ```

**Target Coverage:**
- Overall: 70%+ ✅
- Critical paths: 90%+
- UI components: 60%+

---

### 8. LOW: Implement E2E Test Reporting

```javascript
// cypress.config.js - Add reporter
export default defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
  },
  e2e: {
    // ... existing config
  }
});
```

```bash
npm install -D mochawesome mochawesome-merge mochawesome-report-generator
```

**Add scripts:**
```json
{
  "scripts": {
    "test:e2e:report": "cypress run && npm run merge-reports && npm run generate-report",
    "merge-reports": "mochawesome-merge cypress/reports/*.json > cypress/reports/report.json",
    "generate-report": "marge cypress/reports/report.json -f report -o cypress/reports"
  }
}
```

---

## 📈 Performance Benchmarks

### Current Performance
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial Load Time | ~2.5s | <2s | ⚠️ |
| Time to Interactive | ~3s | <2.5s | ⚠️ |
| First Contentful Paint | ~1.2s | <1s | ⚠️ |
| Bundle Size (total) | 3.0 MB | <2.5 MB | ⚠️ |
| Vendor Bundle | 2.17 MB | <1.5 MB | ❌ |
| Main Bundle | 98 KB | <100 KB | ✅ |

### Target Performance (After Fixes)
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Load Time | 2.5s | 2.0s | **-20%** |
| Vendor Bundle | 2.17 MB | 1.3 MB | **-40%** |
| Total Bundle | 3.0 MB | 2.2 MB | **-27%** |
| Test Coverage | Unknown | 70% | **New** |

---

## 🔧 Quick Fixes (15 minutes)

### 1. Add Performance Logging
```typescript
// src/lib/logger.ts
export const logPerformance = (label: string, duration: number) => {
  if (import.meta.env.DEV) {
    console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
  }
};

// Usage in components
useEffect(() => {
  const start = performance.now();
  // Component logic
  return () => {
    logPerformance('ComponentName-render', performance.now() - start);
  };
}, []);
```

### 2. Add Error Reporting
```typescript
// src/lib/errorReporting.ts
export const reportError = (error: Error, context?: any) => {
  console.error('Error:', error, 'Context:', context);
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify({ error, context }) });
  }
};
```

### 3. Add Memory Leak Detection
```typescript
// src/hooks/useMemoryLeak.ts
export const useMemoryLeakDetector = (componentName: string) => {
  useEffect(() => {
    const start = performance.memory?.usedJSHeapSize || 0;
    
    return () => {
      if (performance.memory) {
        const end = performance.memory.usedJSHeapSize;
        const diff = end - start;
        if (diff > 5000000) { // 5MB leak
          console.warn(`⚠️ Potential memory leak in ${componentName}: ${(diff / 1000000).toFixed(2)}MB`);
        }
      }
    };
  }, [componentName]);
};
```

---

## 📊 Testing Strategy

### Unit Tests (70% Coverage Target)
```
Priority 1 (Must Have):
✅ Error handling (errorHandling.test.ts)
✅ Validation logic (validation.test.ts)
✅ Common components (Button, Card)
⬜ Context providers (MLContext, AuthContext)
⬜ Custom hooks (useFeatureAccess, useStripeCheckout)
⬜ Data processing (CSV parser, data transformer)

Priority 2 (Nice to Have):
⬜ Page components (Dashboard, DataManagement)
⬜ Complex UI components (DataQualityDashboard)
⬜ API clients (supabase, openai)
```

### E2E Tests (Current: 7 files)
```
✅ Landing pages
✅ Authentication
✅ Data management
✅ Model workflow
✅ Stripe checkout
⬜ Dashboard interactions
⬜ AI chat functionality
⬜ Data visualization
⬜ Export workflows
```

### Performance Tests
```
⬜ Page load times (< 2s)
⬜ Dataset upload (< 5s for 10MB)
⬜ Model training (< 30s for small dataset)
⬜ Chart rendering (< 500ms)
⬜ Search/filter (< 100ms)
```

---

## 🎯 Next Steps (Priority Order)

### Week 1: Critical Performance
- [ ] Split vendor bundle (Action Item #1)
- [ ] Fix dynamic import warning (Action Item #2)
- [ ] Install and configure coverage reporting (Action Item #3)
- [ ] Run baseline performance tests

### Week 2: Testing
- [ ] Add MLContext tests
- [ ] Add hook tests (useFeatureAccess, useStripeCheckout)
- [ ] Add data processing tests
- [ ] Achieve 70% test coverage

### Week 3: Monitoring & Debugging
- [ ] Implement PerformanceMonitor (Action Item #4)
- [ ] Create DebugPanel component (Action Item #6)
- [ ] Add bundle analysis to CI (Action Item #5)
- [ ] Setup E2E test reporting (Action Item #8)

### Week 4: Polish
- [ ] Add memory leak detection
- [ ] Implement error tracking service integration
- [ ] Create performance dashboard
- [ ] Document debugging workflows

---

## 🚀 Quick Commands Reference

```bash
# Performance
npm run build                  # Check bundle sizes
npm run analyze               # Visual bundle analysis (after install)
npm run dev                   # Dev server with HMR

# Testing
npm run test                  # Unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report (after fix)
npm run test:e2e             # E2E tests
npm run test:e2e:open        # Interactive E2E
npm run test:a11y            # Accessibility tests

# Debugging
npm run build -- --mode production  # Production build
VITE_DEBUG=true npm run dev         # Debug mode
```

---

## 📚 Additional Resources

- **Bundle Analysis:** https://github.com/btd/rollup-plugin-visualizer
- **Performance API:** https://developer.mozilla.org/en-US/docs/Web/API/Performance
- **Vitest Coverage:** https://vitest.dev/guide/coverage.html
- **Cypress Best Practices:** https://docs.cypress.io/guides/references/best-practices

---

**Status:** Ready for Implementation ✅  
**Estimated Impact:** 30-40% performance improvement, 70% test coverage  
**Time to Complete:** 3-4 weeks
