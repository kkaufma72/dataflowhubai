# DataFlowHub AI

DataFlowHub AI is an enterprise AutoML platform that enables businesses to build, train, and deploy machine learning models without specialized expertise.

## Features

- **Automated Machine Learning**: Train models with just a few clicks
- **Data Management**: Upload, preprocess, and manage datasets
- **Feature Engineering**: Create and select features to improve model performance
- **Model Training**: Train models using various algorithms
- **Model Evaluation**: Evaluate model performance with comprehensive metrics
- **Deployment**: Deploy models as APIs with one click
- **Monitoring**: Monitor model performance and detect drift
- **Visualization**: Interactive charts and dashboards
- **Pipeline Builder**: Create end-to-end ML pipelines with drag-and-drop
- **Collaboration**: Team-based workflow with sharing and permissions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Supabase account for backend services

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kkaufma72/dataflowhubai.git
   cd dataflowhubai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Supabase credentials
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:3002`

## Development

### Project Structure

- `/src`: Source code
  - `/components`: React components
  - `/context`: React context providers
  - `/lib`: Utility functions and services
  - `/pages`: Page components
  - `/types`: TypeScript type definitions
- `/public`: Static assets
- `/supabase`: Supabase configuration and migrations
  - `/functions`: Supabase Edge Functions
  - `/migrations`: Database migrations

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check for code issues
- `npm run test`: Run tests

### Database Setup

The application uses Supabase for the backend. You'll need to:

1. Create a Supabase project
2. Run the migrations in `/supabase/migrations`
3. Set up the Edge Functions in `/supabase/functions`

## Testing

We use Vitest for unit and integration testing. Run tests with:

```bash
npm run test
```

For more details on testing procedures and requirements, see [TESTING.md](./TESTING.md).

## Deployment

### Frontend Deployment

The application can be deployed to Netlify or Vercel:

#### Netlify
1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set up environment variables in Netlify settings:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_API_BASE_URL`: (Optional) Your FastAPI backend URL if not using proxy
   - See `.env.example` for all required variables
4. Update `netlify.toml`: Replace `https://your-backend-api-url.com` with your actual backend URL

#### Vercel
1. Connect your GitHub repository to Vercel
2. Configure build settings (auto-detected for Vite)
3. Set up environment variables in Vercel settings
4. Update `vercel.json`: Replace `https://your-backend-api-url.com` with your actual backend URL

**Important**: See [PRODUCTION_API_SETUP.md](./PRODUCTION_API_SETUP.md) for detailed API configuration to avoid 405 errors.

### Backend Deployment

The FastAPI backend can be deployed to:
- Docker containers (recommended)
- Cloud platforms (AWS, GCP, Azure)
- Heroku, Railway, or similar PaaS

Steps:
1. Set up PostgreSQL database (or use Supabase)
2. Configure environment variables (see `backend/.env.example`)
3. Deploy using Docker: `docker-compose up -d backend`
4. Run migrations if needed
5. Ensure CORS is configured to allow your frontend domain

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

For detailed development setup instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Documentation

- [User Documentation](https://www.dataflowhub.ai/documentation)
- [API Reference](https://www.dataflowhub.ai/api-reference)
- [Developer Documentation](./DEVELOPMENT.md)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [Chart.js](https://www.chartjs.org/)
- [D3.js](https://d3js.org/)// Trigger Vercel redeploy with env vars
// Trigger redeploy with env vars
