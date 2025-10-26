# Environment Variables Setup for Deployment

This document explains how to configure the required environment variables for the DataFlowHub AI application in your deployment platform (Netlify or Vercel).

## Required Environment Variables

The application requires these environment variables to function properly:

### Core Supabase Variables
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### AI Integration
- `VITE_OPENAI_API_KEY` - Your OpenAI API key for AI features

### Optional Variables
- `VITE_ASYNC_WORKLOAD_API_KEY` - For async workload features (if needed)

## How to Set Environment Variables

### For Netlify

1. **Log in to Netlify Dashboard**
   - Go to [netlify.com](https://netlify.com) and sign in
   - Select your site from the dashboard

2. **Navigate to Environment Variables**
   - Click on "Site settings" (gear icon)
   - Go to "Environment variables" in the left sidebar
   - Click "Add variable" or "Add a new variable"

3. **Add Each Variable**
   For each required variable:
   - **Variable name**: Copy exactly as shown above (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Paste your actual value
   - **Scopes**: Select "Same value for all deploy contexts" (unless you need different values for different branches)

4. **Required Variables to Add:**

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy Changes**
   - Click "Save" for each variable
   - Trigger a new deployment (push to main branch or use "Deploy manually")

### For Vercel

1. **Log in to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Select your project from the dashboard

2. **Navigate to Environment Variables**
   - Click on "Settings" tab
   - Go to "Environment Variables" in the left sidebar
   - Click "Add New..." button

3. **Add Each Variable**
   For each required variable:
   - **Name**: Copy exactly as shown above (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Paste your actual value
   - **Environments**: Select "All Environments" (Production, Preview, Development)

4. **Required Variables to Add:**

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy Changes**
   - Click "Save" for each variable
   - Trigger a new deployment (push to main branch or redeploy)

## Getting Your Supabase Credentials

### Step 1: Log in to Supabase
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one)

### Step 2: Get Project URL
1. In your Supabase dashboard, look at the URL in your browser
2. It will be in format: `https://your-project-id.supabase.co`
3. Copy this entire URL

### Step 3: Get Anonymous Key
1. In your Supabase dashboard, go to "Settings" (gear icon)
2. Click on "API" in the left sidebar
3. Copy the "anon public" key (starts with `eyJ...`)

## Getting Your OpenAI API Key

### Step 1: Log in to OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in to your account (or create one)

### Step 2: Generate API Key
1. Click on your profile (top right) → "API keys"
2. Click "Create new secret key"
3. Give it a name (e.g., "DataFlowHub AI")
4. Copy the generated key (starts with `sk-...`)

⚠️ **Important**: Keep your API keys secure and never commit them to version control!

## Testing Your Configuration

After setting up the environment variables:

1. **Wait for deployment** to complete (usually 2-5 minutes)
2. **Visit your live site**
3. **Check the browser console** (F12 → Console) for any error messages
4. **Verify the site loads** and shows the landing page instead of a blank screen

## Troubleshooting

### Still Showing Blank Screen?
1. **Check console logs** in browser developer tools
2. **Verify all variables** are set correctly in your deployment platform
3. **Check variable names** - they must start with `VITE_` for Vite to include them
4. **Redeploy** after making changes to environment variables

### Getting "Configuration Required" Message?
This means the environment variables are properly missing and the app is showing the helpful error message instead of crashing.

### Need Help?
- Check the [SETUP.md](./SETUP.md) file for detailed setup instructions
- Review the [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for deployment checklist
- Visit the [GitHub repository](https://github.com/kkaufma72/dataflowhubai) for issues and discussions

## Security Notes

- ✅ Environment variables are properly excluded from version control (.env files are in .gitignore)
- ✅ Never commit API keys to the repository
- ✅ Use different keys for development vs production
- ✅ Regularly rotate your API keys for security

---

**After completing this setup, your app should load properly instead of showing a blank screen!** 🎉
