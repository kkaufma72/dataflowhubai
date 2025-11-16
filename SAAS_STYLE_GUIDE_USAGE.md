# Modern SaaS Dark Theme - Usage Guide

## 🎨 Overview
This style guide implements modern SaaS UI/UX design principles based on 2025 best practices, featuring a dark mode theme with high contrast, minimalist layouts, and vibrant accent colors.

## 🚀 Quick Start

The styles are automatically available after importing in `index.css`. Simply use the class names in your components.

## 📐 Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-gray-950">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Your content */}
  </div>
</div>
```

### Page Header
```tsx
<div className="mb-8">
  <h1 className="saas-h1">Dashboard</h1>
  <p className="saas-body-large mt-2">Welcome back! Here's what's happening today.</p>
</div>
```

## 📦 Component Patterns

### Stat Cards (KPI Metrics)
```tsx
<div className="saas-stat-card">
  <div className="flex items-center justify-between">
    <div>
      <p className="saas-stat-label">Total Revenue</p>
      <p className="saas-stat-value">$45,231</p>
      <div className="saas-stat-change-positive mt-2">
        <TrendingUp className="w-4 h-4" />
        <span>+12.5%</span>
      </div>
    </div>
    <div className="saas-icon-blue">
      <DollarSign className="w-6 h-6" />
    </div>
  </div>
</div>
```

### Data Cards
```tsx
<div className="saas-card-hover">
  <div className="saas-card-header">
    <h3 className="saas-h4">Recent Activity</h3>
  </div>
  <div className="saas-card-body">
    {/* Card content */}
  </div>
  <div className="saas-card-footer">
    <button className="saas-btn-ghost saas-btn-sm">View All</button>
  </div>
</div>
```

### Icon Containers
```tsx
{/* Blue accent */}
<div className="saas-icon-blue">
  <Database className="w-6 h-6" />
</div>

{/* Purple accent */}
<div className="saas-icon-purple">
  <Layers className="w-6 h-6" />
</div>

{/* Green accent */}
<div className="saas-icon-green">
  <CheckCircle className="w-6 h-6" />
</div>
```

## 🎯 Typography

```tsx
{/* Headings */}
<h1 className="saas-h1">Main Page Title</h1>
<h2 className="saas-h2">Section Title</h2>
<h3 className="saas-h3">Subsection</h3>

{/* Body Text */}
<p className="saas-body">Regular paragraph text</p>
<p className="saas-body-large">Important description</p>
<p className="saas-body-small">Small helper text</p>

{/* Labels */}
<label className="saas-label">Section Label</label>
<span className="saas-caption">Fine print</span>
```

## 🔘 Buttons

```tsx
{/* Primary action */}
<button className="saas-btn-primary">
  Create New
</button>

{/* Secondary action */}
<button className="saas-btn-secondary">
  Cancel
</button>

{/* Outline button */}
<button className="saas-btn-outline">
  Learn More
</button>

{/* Ghost button */}
<button className="saas-btn-ghost">
  View Details
</button>

{/* Sizes */}
<button className="saas-btn-primary saas-btn-sm">Small</button>
<button className="saas-btn-primary saas-btn-lg">Large</button>
```

## 🏷️ Badges & Status

```tsx
{/* Status badges */}
<span className="saas-badge-success">Active</span>
<span className="saas-badge-warning">Pending</span>
<span className="saas-badge-error">Failed</span>
<span className="saas-badge-info">Processing</span>
<span className="saas-badge-neutral">Draft</span>
```

## 📊 Tables

```tsx
<table className="saas-table">
  <thead className="saas-table-header">
    <tr>
      <th className="saas-table-header-cell">Name</th>
      <th className="saas-table-header-cell">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr className="saas-table-row">
      <td className="saas-table-cell">Dataset 1</td>
      <td className="saas-table-cell">
        <span className="saas-badge-success">Ready</span>
      </td>
    </tr>
  </tbody>
</table>
```

## 📝 Forms

```tsx
<div>
  <label className="saas-input-label">Email Address</label>
  <input 
    type="email" 
    className="saas-input" 
    placeholder="you@example.com"
  />
</div>

<div>
  <label className="saas-input-label">Country</label>
  <select className="saas-select">
    <option>United States</option>
    <option>Canada</option>
  </select>
</div>

<div>
  <label className="saas-input-label">Description</label>
  <textarea className="saas-textarea" rows={4} />
</div>
```

## 🚨 Alerts

```tsx
<div className="saas-alert-success">
  <CheckCircle className="w-5 h-5" />
  <div>
    <p className="font-medium">Success!</p>
    <p className="text-sm">Your changes have been saved.</p>
  </div>
</div>

<div className="saas-alert-error">
  <AlertCircle className="w-5 h-5" />
  <div>
    <p className="font-medium">Error</p>
    <p className="text-sm">Something went wrong.</p>
  </div>
</div>
```

## 📈 Progress Bars

```tsx
<div className="saas-progress-bar">
  <div className="saas-progress-fill" style={{ width: '75%' }} />
</div>

{/* Different colors */}
<div className="saas-progress-bar">
  <div className="saas-progress-fill-success" style={{ width: '90%' }} />
</div>
```

## 🎨 Color Palette

### Background Colors
- `bg-gray-950` - Primary dark background
- `bg-gray-900` - Secondary dark background
- `bg-gray-800` - Card backgrounds
- `bg-gray-700` - Elevated elements

### Text Colors
- `text-white` - Primary text
- `text-gray-300` - Secondary text
- `text-gray-400` - Tertiary text
- `text-gray-500` - Muted text

### Accent Colors
- `text-blue-400`, `bg-blue-600` - Primary actions
- `text-purple-400`, `bg-purple-600` - Special features
- `text-green-400`, `bg-green-600` - Success states
- `text-orange-400`, `bg-orange-600` - Warnings
- `text-pink-400`, `bg-pink-600` - Highlights

### Border Colors
- `border-gray-700` - Subtle borders
- `border-gray-600` - Hover states
- `border-gray-500` - Active states

## 🔄 Migration Checklist

When updating a page to use the new style guide:

1. **Update Background**
   ```tsx
   // Before
   <div className="bg-white">
   
   // After
   <div className="bg-gray-950">
   ```

2. **Update Text Colors**
   ```tsx
   // Before
   <h1 className="text-gray-900">Title</h1>
   
   // After
   <h1 className="saas-h1">Title</h1>
   ```

3. **Update Cards**
   ```tsx
   // Before
   <div className="bg-white border rounded-lg">
   
   // After
   <div className="saas-card">
   ```

4. **Update Buttons**
   ```tsx
   // Before
   <button className="bg-blue-600 text-white px-4 py-2 rounded">
   
   // After
   <button className="saas-btn-primary">
   ```

5. **Update Icons**
   ```tsx
   // Before
   <div className="w-10 h-10 bg-blue-50 rounded">
   
   // After
   <div className="saas-icon-blue">
   ```

## 📱 Responsive Behavior

All components automatically adjust for mobile:
- Stat cards reduce padding
- Tables become scrollable
- Text sizes scale down
- Spacing reduces appropriately

## 💡 Best Practices

1. **Use Semantic Classes**: Prefer `saas-card` over manual Tailwind combinations
2. **Maintain Consistency**: Stick to the predefined components
3. **Test Dark Mode**: All text should be readable on dark backgrounds
4. **Check Contrast**: Ensure WCAG AA compliance
5. **Use Vibrant Accents**: Leverage blue, purple, green for visual interest

## 🎯 Examples in Your App

**Dashboard Page**: Use `saas-stat-card` for KPIs, `saas-card` for data sections
**Data Management**: Use `saas-table` for dataset lists, `saas-badge` for status
**Model Training**: Use `saas-card-hover` for model cards, `saas-progress-bar` for training progress
**Settings**: Use `saas-input` and `saas-select` for forms

Ready to apply! 🚀
