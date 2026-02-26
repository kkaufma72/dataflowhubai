# DataFlowHub AI Setup Guide

This guide provides detailed instructions for setting up the DataFlowHub AI platform for development, testing, and production environments.

## Development Environment Setup

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 1GB for the application, plus space for datasets
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Git**: Latest version

### Step 1: Clone the Repository

```bash
git clone https://github.com/kkaufma72/dataflowhubai.git
cd dataflowhubai
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from the API settings
4. Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_ASYNC_WORKLOAD_API_KEY=your-async-workload-api-key
```

### Step 4: Set Up Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the migration scripts from `/supabase/migrations` in order

Alternatively, if you have the Supabase CLI installed:

```bash
supabase migration up
```

### Step 5: Set Up Edge Functions

1. Navigate to the Edge Functions section in your Supabase dashboard
2. Create new functions for each directory in `/supabase/functions`
3. Deploy the function code

Alternatively, if you have the Supabase CLI installed:

```bash
supabase functions deploy
```

### Step 6: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3002`

## Production Environment Setup

### Netlify Deployment

1. **Connect Repository**
   - Sign up for Netlify
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

3. **Environment Variables**
   - Add all environment variables from your `.env` file to Netlify

4. **Deploy**
   - Trigger a manual deploy or push to your main branch

### Supabase Production Setup

1. **Create Production Project**
   - Create a new Supabase project for production

2. **Run Migrations**
   - Run all migration scripts in the SQL Editor
   - Or use the Supabase CLI: `supabase migration up`

3. **Deploy Edge Functions**
   - Deploy all edge functions to the production project
   - Set up environment variables for the functions

4. **Update Frontend Configuration**
   - Update the environment variables in your Netlify deployment to point to the production Supabase project

## Testing Environment Setup

### Setting Up a Testing Database

1. Create a separate Supabase project for testing
2. Run the migrations to set up the schema
3. Create a `.env.test` file with the testing environment variables

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Docker Setup (Optional)

### Prerequisites

- Docker
- Docker Compose

### Building and Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t dataflowhub-ai .
   ```

2. Run the container:
   ```bash
   docker run -p 3002:3002 -e VITE_SUPABASE_URL=your-url -e VITE_SUPABASE_ANON_KEY=your-key dataflowhub-ai
   ```

Or use Docker Compose:

```bash
docker-compose up
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check for typos in import statements

2. **Environment variable issues**
   - Ensure all variables in `.env` are prefixed with `VITE_`
   - Restart the development server after changing environment variables

3. **Supabase connection issues**
   - Verify your Supabase URL and anon key
   - Check network connectivity
   - Ensure your IP is not blocked by Supabase

4. **Build errors**
   - Run `npm run lint` to check for code issues
   - Fix TypeScript errors before building

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/kkaufma72/dataflowhubai/issues) for similar problems
2. Join our [Discord community](https://discord.gg/dataflowhub) for real-time help
3. Contact support at support@dataflowhub.ai

## Updating

To update your local development environment:

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Run any new migrations:
   ```bash
   # Using Supabase CLI
   supabase migration up
   
   # Or manually in the SQL Editor
   ```

4. Restart the development server:
   ```bash
   npm run dev
   ```

## Next Steps

After setting up your environment:

1. Read the [CONTRIBUTING.md](./CONTRIBUTING.md) guide
2. Explore the codebase to understand the architecture
3. Try creating a simple feature or fixing a bug
4. Run the tests to ensure everything is working correctly