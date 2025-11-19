# 🎨 IBM Watson Design System - Application Guide

## Quick Reference: Converting Existing Pages to IBM Design

### Step 1: Update Page Container

**Before (Dark Theme):**
```tsx
<div className="min-h-screen bg-gray-950 text-gray-100">
```

**After (IBM Watson):**
```tsx
<div className="min-h-screen bg-gray-50">
```

---

### Step 2: Update Page Headers

**Before:**
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-100 mb-2">Model Training</h1>
  <p className="text-gray-400">Train and evaluate your ML models</p>
</div>
```

**After:**
```tsx
<div className="bg-white border-b border-gray-200 px-8 py-6">
  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Model Training</h1>
  <p className="text-sm text-gray-600 mt-1">Train and evaluate your ML models</p>
</div>
```

---

### Step 3: Update Cards

**Before:**
```tsx
<div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
  <h3 className="text-lg font-bold text-gray-100 mb-4">Card Title</h3>
  <p className="text-gray-400">Content</p>
</div>
```

**After:**
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Title</h3>
  <p className="text-sm text-gray-600">Content</p>
</div>
```

---

### Step 4: Update Buttons

**Before:**
```tsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
  Train Model
</button>
```

**After:**
```tsx
<button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors">
  Train Model
</button>
```

**Or use utility class:**
```tsx
<button className="ibm-btn-primary">
  Train Model
</button>
```

---

### Step 5: Update Tables

**Before:**
```tsx
<table className="min-w-full divide-y divide-gray-700">
  <thead className="bg-gray-800">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
        Name
      </th>
    </tr>
  </thead>
  <tbody className="bg-gray-900 divide-y divide-gray-800">
    <tr className="hover:bg-gray-800">
      <td className="px-6 py-4 text-sm text-gray-300">Data</td>
    </tr>
  </tbody>
</table>
```

**After:**
```tsx
<table className="ibm-table">
  <thead>
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Name
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="px-6 py-4 text-sm text-gray-900">Data</td>
    </tr>
  </tbody>
</table>
```

---

### Step 6: Update Forms

**Before:**
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Model Name
    </label>
    <input
      type="text"
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      placeholder="Enter model name"
    />
  </div>
</div>
```

**After:**
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
      Model Name
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      placeholder="Enter model name"
    />
  </div>
</div>
```

**Or use utility class:**
```tsx
<input type="text" className="ibm-input" placeholder="Enter model name" />
```

---

### Step 7: Update Badges/Status Indicators

**Before:**
```tsx
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-600 text-white">
  Active
</span>
```

**After:**
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
  Active
</span>
```

**Or use utility class:**
```tsx
<span className="ibm-badge-success">Active</span>
```

---

### Step 8: Update Icons

**Before:**
```tsx
<div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
  <Brain className="w-6 h-6 text-indigo-400" />
</div>
```

**After:**
```tsx
<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
  <Brain className="w-6 h-6 text-primary-600" />
</div>
```

---

### Step 9: Update Stat Cards

**Before:**
```tsx
<div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">Total Models</p>
      <p className="text-3xl font-bold text-gray-100 mt-1">24</p>
    </div>
    <Brain className="w-8 h-8 text-indigo-400" />
  </div>
</div>
```

**After:**
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <Brain className="w-6 h-6 text-primary-600" />
    </div>
  </div>
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      Total Models
    </p>
    <p className="text-3xl font-semibold text-gray-900 font-mono">24</p>
  </div>
</div>
```

---

### Step 10: Update Tabs

**Before:**
```tsx
<div className="flex space-x-4 border-b border-gray-800">
  <button className={`px-4 py-2 text-sm font-medium ${
    activeTab === 'train' 
      ? 'text-indigo-400 border-b-2 border-indigo-400' 
      : 'text-gray-400 hover:text-gray-300'
  }`}>
    Train
  </button>
</div>
```

**After:**
```tsx
<div className="flex space-x-1 border-b border-gray-200 bg-white">
  <button className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
    activeTab === 'train' 
      ? 'text-primary-700 bg-primary-50 border-b-2 border-primary-600' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
  }`}>
    Train
  </button>
</div>
```

---

## Color Palette Quick Reference

```css
/* Primary Colors */
bg-primary-600     /* IBM Blue #0062FF */
text-primary-700   /* Darker Blue for text */
border-primary-200 /* Light Blue for borders */

/* Success */
bg-green-50        /* Light green background */
text-green-700     /* Dark green text */
border-green-200   /* Green border */

/* Warning */
bg-yellow-50       /* Light yellow background */
text-yellow-700    /* Dark yellow text */
border-yellow-200  /* Yellow border */

/* Error */
bg-red-50          /* Light red background */
text-red-700       /* Dark red text */
border-red-200     /* Red border */

/* Backgrounds */
bg-gray-50         /* Page background */
bg-white           /* Card background */
bg-gray-100        /* Hover state */

/* Borders */
border-gray-200    /* Default border */
border-gray-300    /* Input border */

/* Text */
text-gray-900      /* Primary text */
text-gray-600      /* Secondary text */
text-gray-500      /* Tertiary text/icons */
```

---

## Typography Scale

```css
/* Headings */
text-3xl font-semibold         /* Page titles (30px) */
text-2xl font-semibold         /* Section titles (24px) */
text-lg font-semibold          /* Card titles (18px) */
text-base font-medium          /* Subsections (16px) */

/* Body Text */
text-sm                        /* Body text (14px) */
text-xs                        /* Small text (12px) */

/* Labels */
text-xs font-semibold uppercase tracking-wide  /* Form labels */
```

---

## Common Patterns

### Loading States

**Before:**
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
</div>
```

**After:**
```tsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
</div>
```

### Empty States

**Before:**
```tsx
<div className="text-center py-12">
  <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
  <p className="text-gray-400">No data available</p>
</div>
```

**After:**
```tsx
<div className="text-center py-12">
  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <p className="text-sm text-gray-600 mb-4">No data available</p>
  <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700">
    Add Data
  </button>
</div>
```

### Modal Overlays

**Before:**
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-800">
    {/* Content */}
  </div>
</div>
```

**After:**
```tsx
<div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-xl">
    {/* Content */}
  </div>
</div>
```

---

## Testing Checklist

After applying IBM design to a page, verify:

- [ ] **Background** is light gray (`bg-gray-50`)
- [ ] **Cards** have white background with border (`bg-white border border-gray-200`)
- [ ] **Text** is dark gray (`text-gray-900` for primary, `text-gray-600` for secondary)
- [ ] **Buttons** use IBM Blue (`bg-primary-600`)
- [ ] **Icons** are in colored containers (`bg-blue-100` with `text-primary-600`)
- [ ] **Hover states** work (cards get shadow, buttons darken)
- [ ] **Badges** use light backgrounds with colored text/borders
- [ ] **Forms** have proper focus states (`focus:ring-primary-500`)
- [ ] **Tables** have zebra striping and hover effects
- [ ] **Typography** follows IBM Plex Sans font family

---

## Files Already Updated ✅

1. ✅ `tailwind.config.js` - IBM colors and fonts
2. ✅ `src/index.css` - Global styles with IBM Plex
3. ✅ `src/styles/ibmWatson.css` - Utility classes
4. ✅ `src/pages/DashboardIBM.tsx` - New IBM dashboard
5. ✅ `src/components/layout/SidebarIBM.tsx` - New IBM sidebar
6. ✅ `src/components/layout/AppLayoutIBM.tsx` - New IBM layout
7. ✅ `src/pages/DataCatalog.tsx` - Already IBM styled
8. ✅ `src/main.tsx` - Routes to IBM components

---

## Files That Need Updates ⚠️

1. ⚠️ `src/pages/ModelTraining.tsx` (1533 lines)
2. ⚠️ `src/pages/DataManagementHybrid.tsx`
3. ⚠️ `src/pages/FeatureEngineering.tsx`
4. ⚠️ `src/pages/ModelEvaluation.tsx`
5. ⚠️ `src/pages/DatasetInsights.tsx` (1780 lines)
6. ⚠️ `src/pages/Deployment.tsx` (948 lines)
7. ⚠️ `src/pages/ModelMonitoring.tsx`
8. ⚠️ Various components in `src/components/`

---

*Use this guide as a reference when updating pages to match the IBM Watson design system.*
