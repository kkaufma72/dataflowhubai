# DataFlowHub AI - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER (Browser)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        React 18 + TypeScript                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │  Dashboard │  │   Data     │  │  Feature   │  │   Model    │         │   │
│  │  │   (Home)   │  │ Management │  │ Engineering│  │  Training  │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Model    │  │ Deployment │  │ Monitoring │  │  Settings  │         │   │
│  │  │ Evaluation │  │   (API)    │  │(Real-Time) │  │   (Auth)   │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │   │
│  │                                                                            │   │
│  │  UI Components: Chart.js, D3.js, Tremor, Tailwind CSS                    │   │
│  │  State: React Context API, React Router v6, React Query                  │   │
│  │  Features: Command Palette (⌘K), Drag-and-Drop, Guided Tours            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                        ▼                                          │
└───────────────────────────────────────┼───────────────────────────────────────────┘
                                        │
                                   HTTPS/WSS
                                        │
┌───────────────────────────────────────┼───────────────────────────────────────────┐
│                              APPLICATION LAYER                                    │
├───────────────────────────────────────┼───────────────────────────────────────────┤
│                                        ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          FastAPI Backend (Python)                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Auth     │  │    Data    │  │     ML     │  │  Deployment│         │   │
│  │  │   Router   │  │   Router   │  │   Router   │  │   Router   │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │   │
│  │                                                                            │   │
│  │  Middleware: Error Handler → Performance → Logging → CORS                │   │
│  │  Patterns: Async/Await, RESTful APIs, Dependency Injection               │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                        ▼                                          │
└───────────────────────────────────────┼───────────────────────────────────────────┘
                                        │
┌───────────────────────────────────────┼───────────────────────────────────────────┐
│                              SERVICES LAYER                                       │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────┐ │
│  │   Supabase Cloud    │      │   Stripe Payment    │      │  OpenAI / LangChain│
│  │  ┌───────────────┐  │      │   ┌─────────────┐   │      │  ┌──────────────┐ │
│  │  │  PostgreSQL   │  │      │   │  Checkout   │   │      │  │   GPT-4      │ │
│  │  │  (Primary DB) │  │      │   │  Session    │   │      │  │  Integration │ │
│  │  └───────────────┘  │      │   └─────────────┘   │      │  └──────────────┘ │
│  │  ┌───────────────┐  │      │   ┌─────────────┐   │      │  ┌──────────────┐ │
│  │  │     Auth      │  │      │   │ Webhooks    │   │      │  │  Multi-Agent │ │
│  │  │  (OAuth 2.0)  │  │      │   │  Handler    │   │      │  │   System     │ │
│  │  └───────────────┘  │      │   └─────────────┘   │      │  └──────────────┘ │
│  │  ┌───────────────┐  │      │   ┌─────────────┐   │      │                    │
│  │  │ Edge Functions│  │      │   │Subscription │   │      │  AI Agents:        │
│  │  │  (Serverless) │  │      │   │  Management │   │      │  • Data Analyst    │
│  │  └───────────────┘  │      │   └─────────────┘   │      │  • Chart Generator │
│  └─────────────────────┘      └─────────────────────┘      │  • Business Advisor│
│                                                              └──────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           DATA & INFRASTRUCTURE LAYER                             │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────────────────── DATABASES ─────────────────────────────────┐     │
│  │                                                                          │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │     │
│  │  │  PostgreSQL    │  │  TimescaleDB   │  │     Neo4j      │           │     │
│  │  │   (Supabase)   │  │  (Time-Series) │  │ (Knowledge Graph)          │     │
│  │  ├────────────────┤  ├────────────────┤  ├────────────────┤           │     │
│  │  │ • Users        │  │ • Model Metrics│  │ • Dataset      │           │     │
│  │  │ • Datasets     │  │ • Training Logs│  │   Lineage      │           │     │
│  │  │ • ML Models    │  │ • Performance  │  │ • Provenance   │           │     │
│  │  │ • Projects     │  │   Over Time    │  │   Tracking     │           │     │
│  │  │ • Deployments  │  │ • System Health│  │ • Relationships│           │     │
│  │  │ RLS Enabled    │  │ Hypertables    │  │ Cypher Queries │           │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘           │     │
│  │                                                                          │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │     │
│  │  │    InfluxDB    │  │      Redis     │  │     MinIO      │           │     │
│  │  │(Real-Time TSDB)│  │     (Cache)    │  │ (Object Store) │           │     │
│  │  ├────────────────┤  ├────────────────┤  ├────────────────┤           │     │
│  │  │ • Live Metrics │  │ • Session Data │  │ • Raw Datasets │           │     │
│  │  │ • Model Stats  │  │ • API Cache    │  │ • Trained      │           │     │
│  │  │ • Dashboards   │  │ • Query Cache  │  │   Models       │           │     │
│  │  │ Sub-second     │  │ • Rate Limits  │  │ • Artifacts    │           │     │
│  │  │   Queries      │  │ TTL Support    │  │ S3 Compatible  │           │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘           │     │
│  └──────────────────────────────────────────────────────────────────────────┘     │
│                                                                                   │
│  ┌─────────────────────── MESSAGE QUEUE & STREAMING ──────────────────────┐     │
│  │                                                                          │     │
│  │  ┌────────────────────────────────────────────────────────────────┐     │     │
│  │  │                    Apache Kafka + Zookeeper                    │     │     │
│  │  ├────────────────────────────────────────────────────────────────┤     │     │
│  │  │  Topics:                                                       │     │     │
│  │  │  • dataset.uploaded      → Data Profiling Service             │     │     │
│  │  │  • model.training        → Training Worker Pool                │     │     │
│  │  │  • model.deployed        → Deployment Service                 │     │     │
│  │  │  • metrics.realtime      → InfluxDB Writer                    │     │     │
│  │  │                                                                │     │     │
│  │  │  Event-Driven Architecture: Async Processing, Retry Logic    │     │     │
│  │  └────────────────────────────────────────────────────────────────┘     │     │
│  └──────────────────────────────────────────────────────────────────────────┘     │
│                                                                                   │
│  ┌────────────────────── ML PROCESSING ─────────────────────────────────┐       │
│  │                                                                        │       │
│  │  ┌──────────────────┐         ┌──────────────────┐                   │       │
│  │  │  TensorFlow.js   │         │   scikit-learn   │                   │       │
│  │  │   (Browser)      │         │    (Backend)     │                   │       │
│  │  ├──────────────────┤         ├──────────────────┤                   │       │
│  │  │ • Client-side    │         │ • Model Training │                   │       │
│  │  │   Inference      │         │ • Preprocessing  │                   │       │
│  │  │ • Light Models   │         │ • Evaluation     │                   │       │
│  │  └──────────────────┘         └──────────────────┘                   │       │
│  │                                                                        │       │
│  │  ┌──────────────────────────────────────────────────────────────┐     │       │
│  │  │              TensorFlow Docker Service                       │     │       │
│  │  │  Heavy Model Training, Distributed Computing, GPU Support   │     │       │
│  │  └──────────────────────────────────────────────────────────────┘     │       │
│  └────────────────────────────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          MONITORING & OBSERVABILITY                               │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────┐ │
│  │    Prometheus       │ ───▶ │      Grafana        │      │  Application     │ │
│  │  (Metrics Store)    │      │   (Dashboards)      │      │    Logging       │ │
│  ├─────────────────────┤      ├─────────────────────┤      ├──────────────────┤ │
│  │ • Scrapes /metrics  │      │ • System Health     │      │ • FastAPI Logs   │ │
│  │ • Time-series DB    │      │ • API Performance   │      │ • Error Tracking │ │
│  │ • Alerting Rules    │      │ • Resource Usage    │      │ • Access Logs    │ │
│  └─────────────────────┘      └─────────────────────┘      └──────────────────┘ │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT & HOSTING                                 │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────┐ │
│  │   Vercel (Frontend) │      │  Docker Compose     │      │   Supabase       │ │
│  │   ────────────────  │      │  ───────────────    │      │   ──────────     │ │
│  │ • Edge Network      │      │ • Local Development │      │ • Managed DB     │ │
│  │ • Auto Deploy      │      │ • 15+ Services      │      │ • Edge Functions │ │
│  │ • SSL/CDN          │      │ • Orchestration     │      │ • Auth Service   │ │
│  └─────────────────────┘      └─────────────────────┘      └──────────────────┘ │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flow

### 1. Data Upload Flow
```
User Upload → FastAPI → MinIO (Storage) → Kafka (dataset.uploaded) 
→ Data Profiler → PostgreSQL + Neo4j (Lineage)
```

### 2. Model Training Flow
```
User Config → FastAPI → Kafka (model.training) → Training Worker 
→ TensorFlow/scikit-learn → Model Artifacts (MinIO) 
→ Metrics (InfluxDB + TimescaleDB) → PostgreSQL (Model Record)
```

### 3. Real-Time Monitoring Flow
```
Deployed Model → Metrics → InfluxDB → Grafana Dashboard 
→ Alerts (Prometheus) → User Notification
```

### 4. AI Assistant Flow
```
User Query → React → Supabase Edge Function → OpenAI API 
→ LangChain Agents → Context (PostgreSQL) → Response
```

---

## Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Chart.js, D3.js, React Router v6 |
| **Backend** | FastAPI, Python 3.11+, Async/Await, Pydantic, SQLAlchemy |
| **Databases** | PostgreSQL (Supabase), TimescaleDB, Neo4j, InfluxDB, Redis |
| **Message Queue** | Apache Kafka, Zookeeper |
| **Object Storage** | MinIO (S3-compatible) |
| **ML/AI** | TensorFlow.js, TensorFlow (Docker), scikit-learn, LangChain, OpenAI GPT-4 |
| **Monitoring** | Prometheus, Grafana, InfluxDB |
| **Authentication** | Supabase Auth, OAuth 2.0 (Google, GitHub), JWT |
| **Payments** | Stripe Checkout, Webhooks, Subscriptions |
| **Infrastructure** | Docker Compose, Nginx, Vercel (CDN) |
| **DevOps** | GitHub Actions, Docker, Environment Variables |

---

## Key Features by Component

### Frontend (React)
- ⌘K Command Palette for fast navigation
- Drag-and-drop pipeline builder (react-dnd)
- Real-time charts with auto-refresh
- Guided product tours (react-joyride)
- Dark/Light theme support
- Responsive design (mobile-friendly)

### Backend (FastAPI)
- RESTful API with auto-generated docs
- Async request handling
- File upload with streaming
- WebSocket support for real-time updates
- Custom middleware stack
- Rate limiting and caching

### Data Layer
- Multi-database architecture for specialized workloads
- Real-time metrics with sub-second latency
- Graph-based lineage tracking
- Time-series optimization with hypertables
- S3-compatible object storage

### ML Pipeline
- Automated feature engineering
- Distributed model training
- Real-time inference APIs
- A/B testing support
- Model versioning and rollback

### Monitoring
- System health dashboards
- API performance metrics
- Error tracking and alerting
- Resource usage monitoring
- Custom business metrics

---

## Scalability & Performance

- **Horizontal Scaling**: Stateless backend, load balancing ready
- **Database Sharding**: PostgreSQL read replicas, TimescaleDB compression
- **Caching Strategy**: Redis for hot data, CDN for static assets
- **Async Processing**: Kafka for event-driven workflows
- **Code Splitting**: React lazy loading, <500KB initial bundle
- **Edge Computing**: Vercel Edge Network, Supabase Edge Functions

---

## Security Features

- Row-Level Security (RLS) in PostgreSQL
- OAuth 2.0 authentication
- JWT token-based authorization
- API rate limiting
- Input validation and sanitization
- HTTPS everywhere
- Environment variable encryption
- Stripe secure payment processing

---

*Last Updated: November 16, 2025*
