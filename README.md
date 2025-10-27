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
   git clone https://github.com/your-organization/dataflowhub-ai.git
   cd dataflowhub-ai
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

The application can be deployed to Netlify:

1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set up environment variables in Netlify settings

### Backend Deployment

The backend is managed through Supabase:

1. Create a production Supabase project
2. Run the migrations
3. Deploy the Edge Functions
4. Update the environment variables in your frontend deployment

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

For detailed development setup instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Documentation

- [User Documentation](https://dataflowhub.ai/documentation)
- [API Reference](https://dataflowhub.ai/api-reference)
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
