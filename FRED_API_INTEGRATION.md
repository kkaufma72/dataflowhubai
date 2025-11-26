# 📊 FRED API Integration Guide

## Overview

This integration allows users to search and import economic datasets directly from the Federal Reserve Economic Data (FRED) database into DataFlowHub AI.

**FRED Database:**
- 800,000+ economic time series
- Data from 100+ sources
- Updated daily
- Free API access

---

## 🚀 Quick Start

### 1. Get Your FRED API Key

1. Visit [FRED API Key Registration](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Sign in or create a free account
3. Request an API key
4. Copy your API key

### 2. Configure Your Environment

Add to your `.env` file:

```bash
VITE_FRED_API_KEY=your_fred_api_key_here
```

### 3. Restart Your Dev Server

```bash
npm run dev
```

That's it! The FRED importer is now ready to use.

---

## 📁 Files Created

### 1. **FRED API Service** (`src/lib/fredAPI.ts`)

Core API integration with complete TypeScript types:

```typescript
import {
  searchFREDSeries,
  getFREDSeries,
  getFREDObservations,
  convertFREDToDataset,
  POPULAR_ECONOMIC_INDICATORS
} from './lib/fredAPI';
```

**Key Functions:**

- `searchFREDSeries(query, options)` - Search FRED database
- `getFREDSeries(seriesId)` - Get series metadata
- `getFREDObservations(seriesId, options)` - Get actual data points
- `convertFREDToDataset(seriesId, options)` - Convert to platform format
- `getPopularFREDSeries(limit)` - Get most popular series
- `getFREDCategories(categoryId)` - Browse by category
- `getFREDCategorySeries(categoryId)` - Get series in a category

### 2. **FRED Importer Component** (`src/components/data/FREDDatasetImporter.tsx`)

User-friendly UI for searching and importing FRED datasets:

**Features:**
- ✅ Search 800,000+ economic series
- ✅ Advanced filters (date range, frequency)
- ✅ Popular indicators quick access
- ✅ One-click import
- ✅ Series details and metadata
- ✅ Automatic data conversion

---

## 🎯 Usage Examples

### Basic Search

```typescript
// Search for GDP data
const results = await searchFREDSeries('GDP', {
  limit: 10,
  orderBy: 'popularity',
  sortOrder: 'desc'
});
```

### Get Specific Series

```typescript
// Get unemployment rate
const series = await getFREDSeries('UNRATE');
console.log(series.title); // "Unemployment Rate"
console.log(series.frequency); // "Monthly"
console.log(series.units); // "Percent"
```

### Download Data

```typescript
// Get observations with options
const observations = await getFREDObservations('UNRATE', {
  observationStart: '2020-01-01',
  observationEnd: '2024-01-01',
  frequency: 'm', // monthly
  limit: 100000
});
```

### Convert to Dataset

```typescript
// Convert FRED data to DataFlowHub format
const dataset = await convertFREDToDataset('GDP', {
  observationStart: '2000-01-01',
  frequency: 'q' // quarterly
});

console.log(dataset.name); // "Gross Domestic Product"
console.log(dataset.data.length); // Number of data points
console.log(dataset.metadata); // FRED metadata
```

---

## 📊 Popular Economic Indicators

Pre-configured quick access to commonly used indicators:

| Series ID | Description |
|-----------|-------------|
| `GDP` | Gross Domestic Product |
| `UNRATE` | Unemployment Rate |
| `CPIAUCSL` | Consumer Price Index (CPI) |
| `FEDFUNDS` | Federal Funds Rate |
| `DGS10` | 10-Year Treasury Rate |
| `SP500` | S&P 500 Stock Index |
| `DEXUSEU` | USD/EUR Exchange Rate |
| `DCOILWTICO` | Crude Oil Prices (WTI) |
| `HOUST` | Housing Starts |
| `RSXFS` | Retail Sales |
| `PAYEMS` | Total Nonfarm Payrolls |
| `INDPRO` | Industrial Production Index |
| `UMCSENT` | Consumer Sentiment |
| `MORTGAGE30US` | 30-Year Mortgage Rate |
| `VIXCLS` | VIX (Volatility Index) |

---

## 🔧 Advanced Features

### Date Range Filtering

```typescript
const observations = await getFREDObservations('GDP', {
  observationStart: '2020-01-01',
  observationEnd: '2023-12-31'
});
```

### Frequency Conversion

Available frequencies:
- `d` - Daily
- `w` - Weekly  
- `bw` - Bi-weekly
- `m` - Monthly
- `q` - Quarterly
- `sa` - Semi-annual
- `a` - Annual

```typescript
const observations = await getFREDObservations('GDP', {
  frequency: 'a' // Convert to annual
});
```

### Units Transformation

Available units:
- `lin` - Levels (no change)
- `chg` - Change
- `ch1` - Change from Year Ago
- `pch` - Percent Change
- `pc1` - Percent Change from Year Ago
- `pca` - Compounded Annual Rate of Change
- `cch` - Continuously Compounded Rate of Change
- `cca` - Continuously Compounded Annual Rate of Change
- `log` - Natural Log

```typescript
const observations = await getFREDObservations('GDP', {
  units: 'pc1' // Percent change from year ago
});
```

### Category Browsing

```typescript
// Get top-level categories
const categories = await getFREDCategories();

// Get child categories
const childCategories = await getFREDCategories(32991); // Money, Banking, & Finance

// Get series in a category
const series = await getFREDCategorySeries(32991, {
  limit: 20,
  orderBy: 'popularity'
});
```

---

## 🎨 UI Component Integration

### Add to Data Management Page

```typescript
import FREDDatasetImporter from './components/data/FREDDatasetImporter';

// In your data management page
<Tabs>
  <Tab label="Upload">
    <DataUploader />
  </Tab>
  <Tab label="FRED Economic Data">
    <FREDDatasetImporter />
  </Tab>
  <Tab label="Browse">
    <DatasetBrowser />
  </Tab>
</Tabs>
```

### Standalone Page

Create `src/pages/FREDImporter.tsx`:

```typescript
import React from 'react';
import FREDDatasetImporter from '../components/data/FREDDatasetImporter';
import AppLayout from '../components/layout/AppLayoutKoyfin';

const FREDImporterPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <FREDDatasetImporter />
      </div>
    </AppLayout>
  );
};

export default FREDImporterPage;
```

---

## 📈 Dataset Format

FRED datasets are converted to this standardized format:

```typescript
{
  name: "Unemployment Rate",
  description: "FRED Series: UNRATE\n\nFrequency: Monthly\nUnits: Percent...",
  data: [
    {
      date: "2020-01-01",
      value: 3.5,
      realtime_start: "2020-02-07",
      realtime_end: "2020-02-07"
    },
    // ... more observations
  ],
  metadata: {
    source: "FRED",
    fred_series_id: "UNRATE",
    frequency: "Monthly",
    frequency_short: "M",
    units: "Percent",
    units_short: "%",
    seasonal_adjustment: "Seasonally Adjusted",
    observation_start: "1948-01-01",
    observation_end: "2024-10-01",
    last_updated: "2024-11-01 07:44:03-05",
    popularity: 95,
    data_points: 920
  }
}
```

---

## 🔒 Security & Best Practices

### API Key Security

✅ **DO:**
- Store API key in `.env` file
- Add `.env` to `.gitignore`
- Use `VITE_` prefix for frontend access
- Keep production keys separate

❌ **DON'T:**
- Commit API keys to git
- Share keys in code comments
- Use same key for dev and prod
- Expose keys in client-side code

### Rate Limits

FRED API has generous rate limits:
- **120 requests per minute**
- **Unlimited total requests**

Our implementation handles rate limiting automatically.

### Error Handling

All API functions include comprehensive error handling:

```typescript
try {
  const results = await searchFREDSeries('GDP');
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle configuration error
  } else if (error.message.includes('404')) {
    // Handle not found
  } else {
    // Handle general error
  }
}
```

---

## 🧪 Testing

### Test FRED Configuration

```typescript
import { isFREDConfigured } from './lib/fredAPI';

if (isFREDConfigured()) {
  console.log('✅ FRED API is configured');
} else {
  console.log('❌ FRED API key missing');
}
```

### Test Search

```bash
# In browser console
import { searchFREDSeries } from './lib/fredAPI';
const results = await searchFREDSeries('unemployment');
console.log(results);
```

### Test Import

1. Navigate to FRED Importer component
2. Search for "GDP"
3. Click "Import" on a result
4. Verify dataset appears in your data management

---

## 📚 API Reference

### Search Options

```typescript
interface SearchOptions {
  limit?: number;           // Max results (default: 25)
  offset?: number;          // Pagination offset
  orderBy?: string;         // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort direction
  filterVariable?: string;  // Filter field
  filterValue?: string;     // Filter value
}
```

### Observation Options

```typescript
interface ObservationOptions {
  observationStart?: string;     // YYYY-MM-DD
  observationEnd?: string;       // YYYY-MM-DD
  units?: string;               // Units transformation
  frequency?: string;           // Frequency aggregation
  aggregationMethod?: 'avg' | 'sum' | 'eop';
  limit?: number;               // Max observations
}
```

---

## 🎓 Use Cases

### 1. Economic Analysis
- Compare GDP growth across countries
- Analyze unemployment trends
- Study inflation patterns

### 2. Financial Modeling
- Interest rate predictions
- Stock market correlation analysis
- Currency exchange forecasting

### 3. Business Intelligence
- Retail sales trends
- Consumer sentiment tracking
- Housing market analysis

### 4. Academic Research
- Economic policy impact studies
- Time series analysis
- Econometric modeling

---

## 🐛 Troubleshooting

### "FRED API key not configured"

**Solution:** Add `VITE_FRED_API_KEY` to your `.env` file and restart dev server.

### "Failed to fetch series"

**Possible causes:**
- Invalid series ID
- Network issues
- Rate limit exceeded

**Solution:** Check series ID on [fred.stlouisfed.org](https://fred.stlouisfed.org) and try again.

### "No results found"

**Solution:** Try broader search terms or check spelling.

### Import fails silently

**Solution:** Check browser console for errors. Ensure user is authenticated.

---

## 🔗 Resources

- **FRED Website:** https://fred.stlouisfed.org
- **API Documentation:** https://fred.stlouisfed.org/docs/api/fred/
- **Get API Key:** https://fred.stlouisfed.org/docs/api/api_key.html
- **Series Search:** https://fred.stlouisfed.org/search
- **Category Browser:** https://fred.stlouisfed.org/categories

---

## 🎯 Next Steps

1. ✅ Get your FRED API key
2. ✅ Add to `.env` file
3. ✅ Test the importer component
4. ✅ Import your first dataset
5. ✅ Start analyzing economic data!

**Happy analyzing!** 📊

---

*Last Updated: November 26, 2025*
*Version: 1.0*

