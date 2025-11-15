# DataFlowHub AI - Copilot Instructions

## Project Overview
DataFlowHub AI is an enterprise AutoML platform built with React + TypeScript (frontend) and FastAPI (backend). The platform enables businesses to build, train, and deploy ML models without specialized expertise, featuring automated ML workflows, visual pipeline builders, real-time monitoring, and integrated AI assistants with advanced UX patterns.

## Architecture & Key Patterns

### Frontend Stack
- **Framework**: React 18 + TypeScript + Vite with aggressive lazy loading
- **Routing**: React Router v6 with nested routes under `/app/*` (authenticated) and public routes at root
- **Styling**: Tailwind CSS with dark mode (`class` strategy), custom color scheme (primary: #4F46E5, secondary: #10B981)
- **State Management**: React Context API for global state (MLContext, AuthProvider, UserProvider, DemoProvider)
- **Authentication**: Supabase Auth with OAuth support (Google, GitHub)
- **UI Libraries**: 
  - Chart.js + react-chartjs-2 for charts
  - D3.js for advanced visualizations (lineage graphs, network diagrams)
  - react-dnd + react-dnd-html5-backend for drag-and-drop
  - react-joyride for guided product tours
  - react-hot-toast for notifications
  - Lucide React for icons

### Backend Stack
- **API**: FastAPI with async/await patterns, custom middleware stack
- **Databases**: PostgreSQL (Supabase), TimescaleDB (time-series), Neo4j (knowledge graphs), Redis (caching)
- **Infrastructure**: Docker Compose orchestration (15+ services), Kafka for streaming, MinIO for S3-compatible object storage

### Advanced UI Features

#### 1. Command Palette (⌘K / Ctrl+K)
- **Component**: `src/components/CommandPalette/CommandPalette.tsx`
- **Features**: Fuzzy search across navigation, datasets, models, actions
- **Keyboard Navigation**: Arrow keys + Enter, tracks recent searches
- **Usage**: Opens with keyboard shortcut, accessible from `Navbar`

#### 2. Global AI Assistant
- **Component**: `src/components/ai/GlobalAIAssistant.tsx`
- **Pattern**: Floating action button (FAB) with pulse animation on first visit
- **Features**: Full-screen chat modal, lazy-loaded, context-aware responses
- **AI Backend**: Routes through Supabase Edge Function (`ai-chat/`) for security
- **Memory**: Conversation persistence via `conversationMemory.ts` with RAG retrieval

#### 3. Drag-and-Drop Interface
- **Library**: `react-dnd` + `react-dnd-html5-backend`
- **Components**: 
  - `DraggableDatasetCard.tsx` - Dataset cards with reordering
  - `PipelineBuilder.tsx` - Visual ML pipeline construction
  - `DatasetBucket.tsx` - Drop zones for dataset organization
- **Item Types**: Defined in each component, supports drag preview customization

#### 4. Interactive Product Tours
- **Library**: `react-joyride`
- **Components**: 
  - `TourProvider.tsx` - Global tour state management
  - `ProductTour.tsx` - Personalized onboarding based on user profile
  - `GuidedTour.tsx` - Reusable tour component with route filtering
- **Triggers**: First visit detection via localStorage, context-aware step filtering
- **Personalization**: Steps adapt based on `user_profile.use_case` field

#### 5. "Magic Moment" Onboarding
- **Component**: `MagicMomentWelcome.tsx` (lazy loaded)
- **Pattern**: First-time user experience with instant dataset sample loading
- **Flow**: Welcome → Sample data load → Instant insights → Tour start
- **State**: Tracked in localStorage (`hasSeenMagicMoment`, `hasSkippedMagicMoment`)

#### 6. Data Quality Dashboard
- **Component**: `DataQualityDashboard.tsx`
- **Features**: 
  - Real-time quality score calculation (0-100)
  - Column-level analysis (null %, uniqueness, outliers)
  - Type detection (numeric, text, date, categorical, boolean)
  - Issue identification with actionable recommendations
  - Visual health indicators with color-coded badges
- **Algorithm**: Multi-metric scoring (completeness, consistency, validity)

#### 7. Visual Pipeline Builder
- **Component**: `PipelineBuilder.tsx` (1089 lines)
- **Features**:
  - Drag-and-drop node-based workflow editor
  - Node types: Data Source, Preprocessing, Feature Engineering, Model Training, Evaluation, Deployment
  - Connection validation (input/output port matching)
  - Configuration panels per node type
  - Real-time validation and preview
  - Save/load pipeline definitions
- **State Management**: Local state with undo/redo capability

#### 8. Interactive Visualizations
- **D3 Visualizations**:
  - `DataLineage.tsx` - Force-directed graph for dataset lineage/provenance
  - Zoom/pan controls, node selection, interactive tooltips
  - Auto-syncs with Neo4j knowledge graph via `neo4jSync.ts`
- **Chart.js Dashboards**:
  - `RealTimeMonitoring.tsx` - Live model performance metrics
  - `InteractiveCharts.tsx` - Dynamic chart generation from datasets
  - Registered components: Line, Bar, Scatter, Bubble, Pie, Doughnut

#### 9. Theme System
- **Layouts**:
  - `AppLayoutKoyfin.tsx` - Dark terminal-style theme (default)
  - `AppLayout.tsx` - Light theme variant
  - `DataManagementHybrid.tsx` - Excel-inspired tabs + card view
- **Dark Mode**: `darkMode: 'class'` in Tailwind config, toggle support built-in
- **Color Palette**: Extended Tailwind with primary (indigo), secondary (green), accent (amber)

#### 10. Dataset Management UX
- **Hybrid Interface**: Excel-style tabs + rich card view + quality scores
- **Features**:
  - Health score badges with color coding
  - Inline AI helper suggestions (session-based)
  - Quick actions (preview, analyze, delete, export)
  - Real-time search and filtering
  - Virtualization for large lists (ready for react-window integration)

#### 11. UI Design System & CSS Architecture
- **Design System Files**:
  - `src/styles/designSystem.css` - Base design tokens (buttons, cards, badges, icons)
  - `src/styles/uiImprovements.css` - Enhanced visibility classes (typography, forms, alerts)
  - `src/index.css` - Global styles, imports design system first
- **CSS Class Naming Pattern**: Semantic utility classes with `@apply` directives
  - Typography: `page-title`, `section-title`, `card-title`, `page-subtitle`, `body-text`, `label-text`
  - Cards: `card-improved`, `card-header`, `stat-card`, `card-gradient`
  - Buttons: `btn-primary-improved`, `btn-secondary-improved`
  - Icons: `icon-container-primary`, `icon-container-success`, `icon-container-warning`, `icon-container-info`
  - Badges: `badge-premium`, `badge-pro`, `badge-success`, `badge-warning`
  - Forms: `form-label`, `form-input-improved`
  - Alerts: `alert-info`, `alert-success`, `alert-warning`, `alert-error`
- **Theme Variants**:
  - Landing pages use Linear-inspired light theme (minimalist, white space)
  - Dashboard uses Koyfin-inspired dark terminal theme (professional, data-dense)
  - Both themes share consistent component patterns but different color palettes
- **Color Usage Pattern**: Use neutral greys (`bg-gray-700`, `text-gray-300`) for dashboard KPI icons on dark backgrounds instead of colorful gradients for better visibility

### Critical Developer Workflows

#### 1. Local Development
```bash
npm run dev              # Frontend dev server on :5173
npm run build           # Production build with code splitting
npm run test            # Vitest unit tests
npm run test:e2e        # Cypress E2E tests
npm run stripe:setup    # Initialize Stripe products (Node script)
```

**Important**: 
- Environment variables MUST be prefixed with `VITE_` to be accessible in frontend code
- HMR runs on port 5173 with 120s timeout (handles large dependencies)
- Assets organized: images → `assets/images/`, fonts → `assets/fonts/`

#### 2. Authentication Flow (Critical!)
- **Provider**: `AuthProvider` in `src/components/auth/AuthProvider.tsx`
- **Session Storage**: localStorage with key `sb-bcobpxgktvgfsffdsiog-auth-token`
- **Route Protection**: `PrivateRoute` component checks `user` state, redirects to `/signin` if unauthenticated
- **OAuth Callback**: MUST be at `/app/auth/callback` route (defined before `/app` in route hierarchy)
- **Profile Creation**: Auto-created on `SIGNED_IN` event via Supabase auth listener
- **Session Recovery**: Reads from localStorage on mount to avoid hanging on `supabase.auth.getSession()`
- **Error Handling**: Clears localStorage + IndexedDB on `refresh_token_not_found` errors

#### 3. Data Storage Strategy (Dual Storage Pattern)
**Primary Storage (Supabase PostgreSQL)**:
- All persistent data stored in Supabase with Row-Level Security (RLS)
- Tables: `datasets`, `ml_models`, `projects`, `user_profiles`, `conversations`, `deployments`
- Migrations in `supabase/migrations/` (NEVER modify existing migrations)

**Secondary Storage (IndexedDB)**:
- Offline caching for datasets via `idb` library
- Managed through `StorageManager` singleton in `src/lib/storage.ts`
- **Important Pattern**: Always save to Supabase FIRST, then IndexedDB
- **Timeout Handling**: IndexedDB saves have 3s timeout to prevent blocking UI
- **Error Recovery**: Don't throw on IndexedDB errors - log and continue (data already in Supabase)

**Storage Flow**:
```typescript
// 1. Save to Supabase (primary)
const { data, error } = await supabase.from('datasets').insert(dataset);
// 2. Save to IndexedDB (secondary, non-blocking)
await storage.saveDataset(dataset).catch(err => console.warn(err));
```

#### 4. Component Organization & Best Practices
```
src/
├── components/
│   ├── auth/           # AuthProvider, PrivateRoute, OAuthCallback
│   ├── common/         # NotificationSystem, TourProvider, ErrorBoundary, CommandPalette
│   ├── layout/         # AppLayoutKoyfin (dark), AppLayout (light), Sidebar, Navbar
│   ├── data/           # DataUploader, DataQualityDashboard, DataLineage, EnhancedAIChat
│   ├── ml/             # Model training/evaluation components
│   ├── pipeline/       # PipelineBuilder, node components
│   ├── visualizations/ # D3/Chart.js components
│   ├── onboarding/     # ProductTour, MagicMomentWelcome
│   └── [feature]/      # Feature-specific grouped components
├── pages/              # Route components (ALL lazy-loaded)
│   ├── DashboardKoyfin.tsx      # Main dashboard (Koyfin terminal style)
│   ├── DataManagementHybrid.tsx # Hybrid Excel + cards + AI helper
│   ├── LandingPageLinear.tsx    # Public landing (Linear minimalist style)
│   └── [other pages]
├── context/            # Global state providers (MLContext, UserContext, DemoContext)
├── lib/                # Services and utilities
│   ├── supabase.ts              # Client config, health checks
│   ├── storage.ts               # IndexedDB manager
│   ├── aiAgents.ts              # AI orchestration (routes to Edge Functions)
│   ├── conversationMemory.ts    # RAG conversation persistence
│   ├── neo4jSync.ts             # Auto-sync datasets to Neo4j
│   └── [other services]
├── hooks/              # Custom React hooks
└── types/              # TypeScript interfaces (Dataset, MLModel, Project, etc.)
```

**Component Patterns**:
- **Lazy Loading**: ALL route components use `lazy(() => import(...))` with `<Suspense>`
- **Error Boundaries**: Wrap feature sections, provide fallback UI with reload option
- **Loading States**: Consistent `LoadingFallback` component with spinner + message
- **Toast Notifications**: `react-hot-toast` configured in `main.tsx` (3s duration, styled)
- **Prop Drilling Avoidance**: Use Context for cross-component state, avoid passing through many layers

### Project-Specific Conventions & Patterns

#### 1. Lazy Loading (CRITICAL for Bundle Size)
All route components MUST be lazy-loaded:
```typescript
const Dashboard = lazy(() => import('./pages/DashboardKoyfin.tsx'));
const DataManagement = lazy(() => import('./pages/DataManagementHybrid.tsx'));
// Wrap in <Suspense fallback={<LoadingFallback />}>
```
**Heavy libraries** also lazy-loaded:
- `EnhancedAIChat` - AI chat interface
- `DataQualityDashboard` - Quality analysis
- `MagicMomentWelcome` - Onboarding flow
- `GuidedTour` - Product tours (react-joyride)

#### 2. Error Handling Strategy
**Three Layers**:
1. **Global Boundary**: `GlobalErrorFallback` in `main.tsx` catches all unhandled errors
   - Shows error message + details toggle + reload button
   - Logs to console with `onError` callback
2. **Component Boundaries**: `ErrorBoundary` from `react-error-boundary`
   - Wrap feature sections that might fail independently
3. **Toast Notifications**: `react-hot-toast` for user-facing feedback
   - Success: 3s duration, green icon
   - Error: 4s duration, red icon
   - Configured in `main.tsx` with custom styling

**Backend Middleware Stack** (order matters):
```python
# FastAPI - outermost to innermost
ErrorHandlerMiddleware  # Catch all exceptions, return JSON errors
PerformanceMiddleware   # Track response times, log slow requests
LoggingMiddleware       # Log all requests/responses
# ... then routes
```

#### 3. Supabase Integration Patterns
**Configuration Check** (CRITICAL):
```typescript
import { isSupabaseConfigured } from './lib/supabase';

if (!isSupabaseConfigured) {
  return <SupabaseConfigError />; // Don't render app without config
}
```

**Row-Level Security (RLS)**:
- ALL tables protected - queries automatically scoped by `user_id`
- Enable RLS in migrations: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Create policies for INSERT, SELECT, UPDATE, DELETE per user

**Edge Functions** (Serverless Functions):
```
supabase/functions/
├── ai-chat/                    # AI assistant (OpenAI integration)
├── create-checkout-session/    # Stripe checkout
├── stripe-webhook/             # Subscription lifecycle
├── create_dataset_from_upload/ # Data processing
└── chat-config/                # Chat configuration
```
**Calling Edge Functions**:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...params }
});
```

#### 4. Stripe Payment Integration (Complex Flow)
**Two Checkout Modes**:

**A) Authenticated User Upgrade**:
```typescript
// User logged in, has Stripe customer ID
sessionOptions.customer = customerId;
sessionOptions.success_url = `${origin}/app?success=true`;
sessionOptions.metadata = { user_id: user.id, tier, billing };
```

**B) New Signup (Unauthenticated)**:
```typescript
// User not logged in, email provided
sessionOptions.customer_email = userEmail;
sessionOptions.success_url = `${origin}/signup-complete?success=true`;
sessionOptions.metadata = {
  tier, billing,
  new_signup: 'true',  // KEY FLAG
  email: userEmail
};
```

**Webhook Handler**:
- Detects `new_signup: 'true'` in metadata
- Creates Supabase user via admin API
- Inserts user_profile with tier info
- Sends password setup email
- Stripe customer ID stored in user_metadata

**Price IDs** (Environment Variables):
```
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID
VITE_STRIPE_TEAM_MONTHLY_PRICE_ID
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID
```

#### 5. Testing Conventions
**Unit Tests (Vitest)**:
- Files: `src/**/*.test.ts` or `*.test.tsx`
- Setup: `vitest.setup.ts` extends `@testing-library/jest-dom` matchers
- **Mock Toast**: ALWAYS mock `react-hot-toast` to avoid implementation errors
```typescript
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}));
```

**E2E Tests (Cypress)**:
- Files: `cypress/e2e/**/*.cy.ts`
- Config: `cypress.config.js` (baseUrl: `localhost:3002`)
- **Retries**: 2 in CI, 0 in dev
- **Video**: Only in CI (saves space locally)
- Commands: `npm run test:e2e` (headless), `npm run test:e2e:open` (interactive)

**Test Patterns**:
- Use `data-testid` attributes for stable selectors
- Mock Supabase calls with `msw` (Mock Service Worker)
- Test user flows, not implementation details
- Accessibility tests: `vitest.a11y.config.ts` with `jest-axe`

#### 6. State Management Best Practices
**Context Providers (Order Matters!)**:
```tsx
<AuthProvider>           {/* 1. Auth first (user session) */}
  <UserProvider>         {/* 2. User profile (depends on auth) */}
    <MLProvider>         {/* 3. ML data (needs user) */}
      <DemoProvider>     {/* 4. Demo state */}
        <AIChatProvider> {/* 5. AI chat */}
          <NotificationProvider> {/* 6. Notifications */}
            <TourProvider>       {/* 7. Tours */}
              <App />
            </TourProvider>
          </NotificationProvider>
        </AIChatProvider>
      </DemoProvider>
    </MLProvider>
  </UserProvider>
</AuthProvider>
```

**When to Use What**:
- **Context**: Cross-cutting concerns (auth, theme, data)
- **Local State**: UI-only state (modal open, selected tab)
- **URL State**: Shareable state (filters, search, pagination)
- **LocalStorage**: Persistent UI preferences (tour completed, theme)
- **SessionStorage**: Session-only state (helper shown this visit)

### Integration Points & External Services

#### 1. AI/ML Services
**OpenAI Integration**:
- Frontend: `VITE_OPENAI_API_KEY` (routed through Edge Functions for security)
- Backend: Direct OpenAI API calls
- **Security Pattern**: Client calls Supabase Edge Function → Edge Function calls OpenAI
- No direct API key exposure in browser

**TensorFlow.js**:
- Client-side model inference
- Docker service for server-side training (`dataflow_tensorflow` container)
- Integration via `tensorflowClient.ts` and `tensorflowDocker.ts`

**LangChain/LangGraph**:
- Multi-agent orchestration (see `AI_AGENT_ARCHITECTURE.md`)
- Agents: Data Analyst, Chart Generator, Insight Finder, Business Advisor
- State management via LangGraph
- Conversation memory with RAG retrieval (`conversationMemory.ts`)

#### 2. Data Pipeline Architecture
**Event Streaming (Kafka)**:
- Topics for dataset events, model training, deployment
- Producers/consumers in FastAPI backend
- Zookeeper for coordination (port 2181)
- Kafka broker on port 9092

**Knowledge Graphs (Neo4j)**:
- Dataset lineage and provenance tracking
- Auto-sync via `neo4jSync.ts` (calls `syncDatasetToNeo4j()`)
- Visualized with D3 force-directed graphs in `DataLineage.tsx`
- Ports: 7687 (Bolt), 7474 (HTTP), 7473 (HTTPS)

**Time-Series (TimescaleDB)**:
- Model performance metrics over time
- Real-time monitoring data
- Hypertable optimizations for time-series queries
- Port 5433

**Object Storage (MinIO)**:
- S3-compatible storage for large datasets
- Ports: 9000 (API), 9001 (Console)
- Credentials: `minioadmin` / `minioadmin_secure_password`

**Caching (Redis)**:
- API response caching
- Real-time data storage
- Session management
- Port 6379

#### 3. Monitoring & Observability
**Prometheus** (Port 9090):
- Scrapes metrics from FastAPI backend
- Custom metrics via `PerformanceMiddleware`
- Config: `prometheus.yml` in root

**Grafana** (Port 3000):
- Visualization dashboards
- Pre-configured to read from Prometheus
- Default credentials: `admin` / `admin`

**Application Monitoring**:
- Frontend: `react-error-boundary` + `ErrorBoundary` components
- Backend: Custom middleware logging to stdout
- Performance tracking: Response times, error rates, throughput

### Performance Optimizations (Critical!)

#### 1. Code Splitting Strategy
**Vite Build Config** (`vite.config.ts`):
```typescript
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    if (id.includes('chart.js')) return 'charts';
    if (id.includes('d3')) return 'd3';
    if (id.includes('langchain')) return 'ai';
    if (id.includes('supabase')) return 'supabase';
    if (id.includes('stripe')) return 'stripe';
    return 'vendor';
  }
}
```
**Result**: Vendor bundle split into ~6 chunks (50-150KB each vs 1MB monolithic)

**Chunk Size Limits**:
- Warning at 500KB
- All routes lazy-loaded
- Heavy components (AI chat, tours, quality dashboard) lazy-loaded

#### 2. Asset Organization
**Automatic Asset Routing** (vite.config.ts):
- Images → `assets/images/[name]-[hash][ext]`
- Fonts → `assets/fonts/[name]-[hash][ext]`
- Other → `assets/[name]-[hash][ext]`

**Asset Optimization**:
- Use WebP for images where possible
- SVG for icons (Lucide React)
- Font subsetting for web fonts
- Lazy load images below fold

#### 3. Caching Strategy
**Browser Cache**:
- Static assets: Cache-Control headers in Vercel config
- Service worker: Not implemented (consider for PWA)

**Application Cache**:
- IndexedDB: Dataset previews, offline access
- LocalStorage: UI preferences, tour state
- SessionStorage: Temporary session data

**API Cache**:
- Redis: Expensive query results (5-60min TTL)
- Edge Functions: Not cached (Supabase limitation)

#### 4. Bundle Analysis
```bash
npm run build  # Check "dist" folder size
```
**Target Sizes**:
- Main bundle: <200KB
- Vendor chunks: <150KB each
- Total initial load: <500KB
- Route chunks: <100KB each

#### 5. Database Query Optimization
**Connection Pooling**:
- PostgreSQL: Max 200 connections (docker-compose.yml)
- Supabase: Handled automatically
- Backend: AsyncSession with proper cleanup

**Query Patterns**:
- Use `select('*')` sparingly - specify needed columns
- Paginate large result sets (limit + offset)
- Use indexes for frequently queried columns
- RLS policies optimized with proper indexes

### Security Best Practices

#### 1. Environment Variables
**Frontend** (MUST prefix with `VITE_`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_OPENAI_API_KEY (routes through Edge Function)
```

**Backend** (No prefix):
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
OPENAI_API_KEY
DATABASE_URL
```

**Never Commit**:
- `.env` file gitignored
- `.env.example` committed with placeholder values
- Vercel/production: Set via dashboard

#### 2. Authentication Security
- JWT tokens auto-refreshed by Supabase
- Session stored in localStorage (encrypted by Supabase)
- OAuth: Supabase handles flow securely
- Password requirements: Min 8 chars (Supabase default)
- Email verification: Configurable in Supabase dashboard

#### 3. Data Security
**Row-Level Security (RLS)**:
```sql
-- Example policy (all tables follow this pattern)
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

**Input Validation**:
- Frontend: Zod schemas for type-safe forms
- Backend: Pydantic models for FastAPI
- SQL Injection: Prevented by Supabase client (parameterized queries)
- XSS: React auto-escapes, never use `dangerouslySetInnerHTML`

#### 4. API Security
**CORS Configuration** (FastAPI):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

**Rate Limiting**:
- Supabase: Built-in rate limiting on auth endpoints
- Backend: Should implement per-route rate limiting (TODO)
- Stripe webhooks: Signature verification required

### Common Gotchas & Solutions

1. **HMR Issues**: If hot reload hangs, check for circular dependencies in imports (especially with LangChain packages)
   - **Solution**: Suppressed in `vite.config.ts` with `onwarn` handler
   - **Debug**: Check browser console for module resolution errors

2. **Build Warnings**: LangChain has known circular dependencies - suppressed in `vite.config.ts`
   - **Expected**: `CIRCULAR_DEPENDENCY` warnings from `@langchain` packages
   - **Action**: Ignore these specific warnings

3. **IndexedDB Timeout**: Dataset saves may timeout after 3s - this is expected, don't throw errors
   - **Pattern**: `await storage.saveDataset(dataset).catch(err => console.warn(err));`
   - **Why**: Data already in Supabase, IndexedDB is secondary cache

4. **OAuth Redirects**: OAuth callback MUST be processed at `/app/auth/callback` before redirecting to `/app`
   - **Route Order**: `/app/auth/callback` BEFORE `/app` in route definitions
   - **Component**: `OAuthCallback.tsx` handles session establishment

5. **Context Providers Order**: Matters! AuthProvider → UserProvider → MLProvider → DemoProvider → ...
   - **Why**: Each depends on the previous (UserProvider needs auth state, MLProvider needs user)
   - **See**: `main.tsx` for correct nesting order

6. **Dark Mode**: Uses `class` strategy in Tailwind, toggled via Koyfin-style layout
   - **Implementation**: `darkMode: 'class'` in `tailwind.config.js`
   - **Toggle**: Add/remove `dark` class to `<html>` element

7. **Toast Errors in Tests**: Always mock `react-hot-toast` in Vitest tests
   - **Why**: Toast implementation tries to access DOM during test setup
   - **Pattern**: `vi.mock('react-hot-toast', () => ({ default: { ... } }))`

8. **Environment Variable Not Found**: Frontend vars MUST start with `VITE_`
   - **Wrong**: `process.env.SUPABASE_URL`
   - **Right**: `import.meta.env.VITE_SUPABASE_URL`

9. **Supabase Session Hanging**: Don't call `supabase.auth.getSession()` on mount
   - **Problem**: Can hang for 30+ seconds
   - **Solution**: Read from localStorage first (see `AuthProvider.tsx`)

10. **Docker Service Won't Start**: Check port conflicts
    - **Common**: PostgreSQL (5432), Redis (6379), Neo4j (7687)
    - **Solution**: `docker-compose down -v` then `docker-compose up -d`

### Key Files to Reference (Deep Dive)

#### 1. Application Entry
- **File**: `src/main.tsx`
- **Contains**: Route definitions, provider hierarchy, lazy loading setup, global error boundary
- **Key Pattern**: Check `isSupabaseConfigured` before rendering app
- **Provider Order**: AuthProvider → UserProvider → MLProvider → DemoProvider → AIChatProvider → NotificationProvider → TourProvider

#### 2. Authentication
- **File**: `src/components/auth/AuthProvider.tsx` (210 lines)
- **Key Functions**: `initializeAuth()`, `handleAuthError()`, `clearLocalData()`
- **OAuth Flow**: SIGNED_IN event → create user_profile if missing
- **Session Recovery**: Read localStorage first, fallback to `getSession()`
- **Error Handling**: Clear all data on refresh_token errors

#### 3. ML/Data Context
- **File**: `src/context/MLContext.tsx` (294 lines)
- **State**: `currentProject`, `datasets`, `models`, `isLoading`, `error`
- **Key Functions**: `addDataset()`, `addModel()`, `updateModelStatus()`
- **Pattern**: Dual storage (Supabase + IndexedDB)
- **Init**: Loads data on mount, creates default project if needed

#### 4. Storage Manager
- **File**: `src/lib/storage.ts` (98 lines)
- **Pattern**: Singleton class (`StorageManager.getInstance()`)
- **Methods**: `saveDataset()`, `getDataset()`, `getAllDatasets()`, `deleteDataset()`
- **Timeout**: 3s timeout on all operations to prevent hanging
- **Error Handling**: Catch and warn, never throw (allows app to continue)

#### 5. Supabase Client
- **File**: `src/lib/supabase.ts` (90 lines)
- **Exports**: `supabase`, `isSupabaseConfigured`, `checkSupabaseConnection()`, `handleSupabaseError()`
- **Config**: Custom auth settings, localStorage persistence
- **Health Check**: `checkSupabaseHealth()` tests connection

#### 6. Type Definitions
- **File**: `src/types/index.ts` (274 lines)
- **Key Interfaces**: `Dataset`, `MLModel`, `Project`, `DataQualityRule`, `DataLineageNode`, `PreprocessingStep`
- **Pattern**: All types match Supabase table schemas
- **Convention**: Use `snake_case` for DB fields, convert to `camelCase` in components

#### 7. Build Configuration
- **File**: `vite.config.ts` (147 lines)
- **Key Sections**: `build.rollupOptions.manualChunks`, `optimizeDeps`, `server.hmr`
- **Externals**: `swagger-ui-react`, `pg`, `neo4j-driver` (server-only)
- **Chunk Strategy**: Separate chunks for charts, d3, ai, supabase, stripe
- **HMR**: 120s timeout, polling enabled, port 5173

#### 8. Tailwind Config
- **File**: `tailwind.config.js` (89 lines)
- **Custom Colors**: `primary` (indigo), `secondary` (green), `accent` (amber)
- **Dark Mode**: `class` strategy
- **Safelist**: Dynamic color classes for charts/badges
- **Fonts**: Montserrat (headings), Open Sans (body)

#### 9. Docker Compose
- **File**: `docker-compose.yml` (230 lines)
- **Services**: 15+ containers (PostgreSQL, Redis, Neo4j, Kafka, MinIO, TimescaleDB, Prometheus, Grafana)
- **Networks**: Single bridge network (`dataflow_network`)
- **Volumes**: Persistent data for all databases
- **Health Checks**: All services have health checks for orchestration

#### 10. API Backend
- **File**: `backend/main.py` (80 lines)
- **Pattern**: FastAPI with lifespan context manager for startup/shutdown
- **Middleware Order**: ErrorHandler → Performance → Logging (outermost to innermost)
- **Routers**: `/api/health`, `/api/auth`, `/api/data`, `/api/ml`, `/api/deploy`
- **Docs**: Auto-generated at `/api/docs` (Swagger UI)

### Development Workflows & Commands

#### Starting the Stack
```bash
# Frontend only (for UI development)
npm run dev

# Full stack (requires Docker)
docker-compose up -d        # Start all services
npm run dev                 # Start frontend

# Check service health
docker-compose ps           # See all services
docker logs dataflow_postgres  # Check specific service
```

#### Database Operations
```bash
# Apply new migration
supabase migration new migration_name
# Edit supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
supabase db push

# Reset database (destructive!)
supabase db reset

# Generate TypeScript types from DB
supabase gen types typescript --local > src/types/supabase.ts
```

#### Testing Workflows
```bash
# Unit tests
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# E2E tests
npm run test:e2e          # Headless
npm run test:e2e:open     # Interactive (Cypress UI)

# Accessibility tests
npm run test:a11y
```

#### Build & Deploy
```bash
# Production build
npm run build
npm run preview           # Test prod build locally

# Stripe setup (one-time)
npm run stripe:setup      # Creates products in Stripe

# Deploy to Vercel (automatic on git push)
git push origin main      # Triggers Vercel deployment
```

### When Making Changes

#### UI Improvements Workflow
**When applying design system improvements:**
1. **Check Instructions**: Review `.github/instructions/uiimprovements.css.instructions.md` for available CSS classes
2. **Replace Inline Styles**: Convert Tailwind utilities to design system classes:
   ```tsx
   // Before
   <h1 className="text-3xl font-bold text-gray-900">Title</h1>
   // After
   <h1 className="page-title">Title</h1>
   ```
3. **Common Replacements**:
   - Page headers → `page-title` + `page-subtitle`
   - Card wrappers → `card-improved` with `card-header`
   - Buttons → `btn-primary-improved` or `btn-secondary-improved`
   - Form inputs → `form-label` + `form-input-improved`
   - Stat cards → `stat-card` with `stat-value` and `stat-label`
4. **Dark Theme Considerations**: For `DashboardKoyfin.tsx` and dark-themed pages:
   - Keep existing dark background classes (`bg-gray-950`, `bg-gray-900`)
   - Use neutral icon containers (`bg-gray-700`) instead of colorful gradients
   - Maintain monospace fonts for numbers (`font-mono`)
   - Preserve terminal aesthetic with `text-gray-100`, `text-gray-400` text colors

#### Adding Routes
1. Create page component in `src/pages/`
2. Lazy load: `const NewPage = lazy(() => import('./pages/NewPage.tsx'));`
3. Add to routes in `src/main.tsx` within `<Suspense>`
4. Update navigation in `Sidebar.tsx` and/or `CommandPalette.tsx`

#### Adding API Endpoints
1. Create route file in `backend/routers/new_route.py`
2. Define FastAPI router: `router = APIRouter()`
3. Add routes: `@router.get("/endpoint")`
4. Register in `backend/main.py`: `app.include_router(new_route.router)`

#### Database Changes
1. **NEVER modify existing migrations**
2. Create new migration: `supabase migration new descriptive_name`
3. Write SQL in `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`
4. Test locally: `supabase db reset` (reapplies all migrations)
5. Apply to production via Supabase dashboard or CLI

#### Adding Dependencies
```bash
# Frontend
npm install package-name
# If large library, consider lazy loading

# Backend
pip install package-name
# Update backend/requirements.txt
```

#### Styling Guidelines
- **Prefer**: Tailwind utility classes over custom CSS
- **Design System**: Always use classes from `uiImprovements.css` and `designSystem.css` for consistency
  - Import order: `designSystem.css` → `uiImprovements.css` → Tailwind (already set in `index.css`)
- **Custom Colors**: Use `primary` (indigo), `secondary` (green), `accent` (amber) from Tailwind config
  - **Avoid hardcoded colors**: Replace `text-purple-600`, `bg-indigo-500` with `text-primary`, `bg-primary`
- **Dark Mode**: Add `dark:` variants for all colors/backgrounds (uses `class` strategy)
- **Responsive**: Mobile-first, use `sm:`, `md:`, `lg:`, `xl:` breakpoints
- **Consistency**: 
  - Landing pages: Match Linear minimalist aesthetic (light theme, large typography, white space)
  - Dashboard: Match Koyfin terminal aesthetic (dark theme, monospace numbers, data-dense)
  - App pages: Use design system classes for unified look
- **Icon Containers**: For dashboard metrics on dark backgrounds, use neutral greys instead of gradient backgrounds for better visibility
  - ❌ Avoid: `icon-container-primary` (colorful gradient hard to see)
  - ✅ Use: `bg-gray-700` with `text-gray-300` icons

#### State Management
- **New Context**: Create in `src/context/`, export provider and hook
- **Add to Hierarchy**: Update `main.tsx` in correct order
- **Local State**: Use `useState` for component-only state
- **Derived State**: Use `useMemo` to avoid recalculation
- **Side Effects**: Use `useEffect` with proper dependencies

#### Error Handling
- **Component Errors**: Wrap in `<ErrorBoundary>` with fallback UI
- **Async Errors**: Try-catch with toast notification
- **Form Validation**: Use Zod schemas, show inline errors
- **API Errors**: Extract message from Supabase error, show user-friendly message

---

*Last Updated: 2025-11-15 | Version: 2.1*
