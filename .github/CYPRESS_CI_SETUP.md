# Cypress CI/CD Setup Guide

This guide explains how to run Cypress E2E tests automatically in GitHub Actions.

## 📋 Available Workflows

We have two workflow options:

### 1. `cypress-basic.yml` - Simple Setup (Recommended to start)
✅ No additional setup required
✅ Runs all tests sequentially
✅ Great for getting started
❌ No parallelization
❌ No Cypress Cloud dashboard

### 2. `cypress.yml` - Advanced Setup with Cypress Cloud
✅ Parallel test execution (faster)
✅ Cypress Cloud dashboard with test recordings
✅ Test analytics and insights
✅ Flake detection
❌ Requires Cypress Cloud account
❌ Requires CYPRESS_RECORD_KEY secret

---

## 🚀 Quick Start (Basic Setup)

### Option A: Use the Basic Workflow

1. **Enable the basic workflow** (no setup needed):
   - The `cypress-basic.yml` workflow will automatically run on every push/PR
   - No secrets or additional configuration required

2. **That's it!** Push your code and watch tests run:
   ```bash
   git add .github/workflows/cypress-basic.yml
   git commit -m "ci: Add Cypress E2E tests to CI pipeline"
   git push
   ```

3. **View results** in GitHub:
   - Go to your repo → Actions tab
   - Click on the workflow run
   - See test results, screenshots (on failure), and videos

---

## ⚡ Advanced Setup (Cypress Cloud + Parallelization)

If you want faster test execution with parallelization and the Cypress Cloud dashboard:

### Step 1: Create Cypress Cloud Account

1. Go to https://cloud.cypress.io/
2. Sign up with your GitHub account
3. Create a new project or connect existing one

### Step 2: Get Your Record Key

1. In Cypress Cloud, go to Project Settings
2. Copy your **Project ID** and **Record Key**
3. The Record Key looks like: `a1b2c3d4-e5f6-7890-ab12-cd34ef567890`

### Step 3: Add Secret to GitHub

1. Go to your GitHub repo
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Name: `CYPRESS_RECORD_KEY`
5. Value: Paste your Record Key from Cypress Cloud
6. Click **"Add secret"**

### Step 4: Update Cypress Config (if needed)

Add your Project ID to `cypress.config.js`:

```js
export default defineConfig({
  projectId: 'your-project-id', // Add this line
  e2e: {
    // ... rest of config
  }
})
```

### Step 5: Choose Which Workflow to Use

**Disable the basic workflow:**
```bash
# Rename to disable
mv .github/workflows/cypress-basic.yml .github/workflows/cypress-basic.yml.disabled
```

**Enable the advanced workflow:**
```bash
git add .github/workflows/cypress.yml
git commit -m "ci: Enable Cypress Cloud recording with parallelization"
git push
```

---

## 🔧 Configuration Options

### Changing the Number of Parallel Instances

Edit `.github/workflows/cypress.yml`:

```yaml
matrix:
  containers: [1, 2, 3, 4] # Run on 4 machines in parallel
```

More instances = faster execution, but uses more CI minutes.

### Running Tests on Specific Branches Only

Edit the `on` section:

```yaml
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
```

### Changing Node.js Version

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20' # Change to desired version
```

---

## 📊 Viewing Test Results

### In GitHub Actions

1. Go to your repo's **Actions** tab
2. Click on a workflow run
3. View:
   - ✅ Test summary and results
   - 📸 Screenshots (on failures) under **Artifacts**
   - 🎥 Videos under **Artifacts**
   - 📋 Detailed logs for each step

### In Cypress Cloud (Advanced Setup)

1. Go to https://cloud.cypress.io/
2. Select your project
3. View:
   - Test recordings with time-travel debugging
   - Performance trends over time
   - Flaky test detection
   - Stack traces and error details
   - Test analytics

---

## 🐛 Troubleshooting

### Tests fail in CI but pass locally

**Common causes:**
- Timing issues (CI is slower)
- Missing environment variables
- Port conflicts

**Solutions:**
```yaml
# Increase timeouts in cypress.config.js
defaultCommandTimeout: 10000,
pageLoadTimeout: 60000,

# Add retries
retries: {
  runMode: 2,  // Retry failed tests in CI
  openMode: 0
}
```

### "CYPRESS_RECORD_KEY not set" error

Either:
1. **Option A:** Use `cypress-basic.yml` instead (no record key needed)
2. **Option B:** Add the secret as described in Step 3 above

### Server doesn't start in time

Increase the wait-on-timeout:

```yaml
wait-on-timeout: 180  # Wait up to 3 minutes
```

### Tests are too slow in CI

1. Enable parallelization (advanced setup)
2. Increase parallel instances in matrix
3. Optimize test code (remove unnecessary waits)

---

## 📈 Best Practices

### 1. Run Tests on Every PR
```yaml
on:
  pull_request:
    branches:
      - main
```

### 2. Require Tests to Pass Before Merging

In GitHub:
1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Require status checks to pass
4. Select "Cypress E2E Tests"

### 3. Save Artifacts on Failure

Already configured! Check the "Artifacts" section in failed workflow runs.

### 4. Use Environment Variables for Secrets

Never commit API keys or secrets. Use GitHub Secrets:

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 5. Cache Dependencies

Already configured with `cache: 'npm'` in the workflow.

---

## 📝 Current Test Coverage

Your app now has **51 comprehensive E2E tests** covering:

- ✅ Authentication flows (5 tests)
- ✅ Data management (6 tests)
- ✅ Dashboard navigation (15 tests)
- ✅ Model workflow (6 tests)
- ✅ Landing pages (8 tests)
- ✅ Button interactions (11 tests)

**Total:** 6 test files, 51 tests, all routes verified

---

## 🆘 Need Help?

- **Cypress Docs:** https://docs.cypress.io/
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Cypress GitHub Action:** https://github.com/cypress-io/github-action

---

## 📌 Quick Commands

```bash
# Run tests locally (headless)
npm run test:e2e

# Run tests locally (UI)
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "cypress/e2e/dashboard-navigation.cy.ts"

# Run tests in specific browser
npx cypress run --browser chrome

# Debug test in headed mode
npx cypress run --headed --no-exit
```

---

**Status:** ✅ CI/CD workflows ready to use
**Last Updated:** October 24, 2025
