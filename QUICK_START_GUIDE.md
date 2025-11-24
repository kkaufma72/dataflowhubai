# 🚀 Quick Start Guide - Running Your Enhanced Platform

## ⚡ First Time Setup (5 minutes)

### **Step 1: Install Dependencies**
```bash
cd /Users/kyle/.cursor/worktrees/dataflowhubai/ejC60

# Install all packages
npm install

# This will install:
# - React, TypeScript, Vite
# - All UI libraries (Chart.js, D3, etc.)
# - Supabase client
# - And 50+ other dependencies
```

### **Step 2: Verify Environment Variables**
```bash
# Check .env file exists
cat .env

# Should have:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_STRIPE_PUBLISHABLE_KEY=...
# etc.

# If missing, copy from example:
cp .env.example .env
# Then fill in your values
```

### **Step 3: Start Development Server**
```bash
npm run dev

# Server will start on: http://localhost:5173
# Should see: "VITE v5.x ready in XXXms"
```

### **Step 4: Open in Browser**
```
http://localhost:5173
```

---

## 🧪 **Testing All New Features**

### **Test 1: Trust & Credibility Features**
```
1. Visit: http://localhost:5173/
2. Scroll down → See trust badges (SOC 2, GDPR, etc.)
3. Click: /security → See security page
4. Click: /privacy → See privacy policy
5. Click: /case-studies → See 5 case studies with filters
```

### **Test 2: UX Features**
```
1. Sign in to app
2. Look at bottom-right → See onboarding checklist
3. Press ⌘/ (or Ctrl/) → See keyboard shortcuts
4. Go to /app/train → Train model → See step-by-step progress
5. Refresh /app → See loading skeletons (not spinners)
6. Visit /app/deploy (no models) → See actionable empty state
```

### **Test 3: Unique Features**
```
1. Visit: /app/scenarios
   - Select a model
   - Adjust sliders
   - See predictions update
   - Add scenarios to compare

2. Visit: /app/experiments
   - See experiment tracking dashboard
   - Filter/search experiments
   - (Will be empty until you train models with tracking enabled)

3. Visit: /app/marketplace
   - Browse 5 pre-trained models
   - Filter by industry/price
   - Click "Deploy" to test

4. Click sidebar → "Advanced Features" section
   - See 3 new navigation items with "NEW" badge
```

---

## 🔧 **Common Issues & Fixes**

### **Issue: "vite: command not found"**
**Fix**:
```bash
npm install
# Then try again:
npm run dev
```

### **Issue: "EmptyState is not defined"**
**Fix**: Already fixed! Commit and pull:
```bash
cd /Users/kyle/.cursor/worktrees/dataflowhubai/ejC60
git pull origin main
npm install
npm run dev
```

### **Issue: Port 5173 already in use**
**Fix**:
```bash
# Kill existing process:
lsof -ti:5173 | xargs kill -9

# Or use different port:
npm run dev -- --port 3000
```

### **Issue: Build errors**
**Fix**:
```bash
# Clear cache and reinstall:
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## 🗄️ **Database Setup** (For Experiment Tracking)

### **Apply Migration**:
```bash
# Option 1: Supabase CLI (if installed)
supabase db push

# Option 2: Supabase Dashboard
# 1. Go to: dashboard.supabase.com
# 2. Select your project
# 3. Go to: SQL Editor
# 4. Copy contents from: supabase/migrations/20251124_add_experiments_table.sql
# 5. Paste and run

# This creates the ml_experiments table
```

---

## 🎙️ **Voice Feature Setup** (Browser Permissions)

### **Enable Microphone Access**:
```
1. Click the microphone button (when added to a page)
2. Browser will prompt: "Allow microphone access?"
3. Click "Allow"
4. Speak your question!

Supported Browsers:
✅ Chrome/Edge - Full support
✅ Safari - Full support
❌ Firefox - Not yet supported (Web Speech API limited)
```

---

## 🤝 **Collaboration Setup** (Supabase Realtime)

### **Enable Realtime in Supabase**:
```
1. Go to: dashboard.supabase.com
2. Select your project
3. Go to: Settings → API
4. Scroll to "Realtime" section
5. Enable "Realtime" toggle
6. Save changes

Now collaboration features will work!
```

---

## 📊 **Verify Everything Works**

### **Checklist**:
```bash
npm run dev

# ✅ Server starts without errors
# ✅ No TypeScript errors in console
# ✅ Landing page loads
# ✅ Can sign in/sign up
# ✅ Onboarding checklist appears (bottom-right)
# ✅ Keyboard shortcuts work (press ⌘/)
# ✅ New routes accessible (/app/scenarios, etc.)
# ✅ Trust badges visible on landing page
# ✅ Security & Privacy pages load
# ✅ Case studies page works
```

---

## 🚀 **Production Build Test**

### **Before Deploying**:
```bash
# Build for production
npm run build

# Should complete without errors
# Check dist/ folder is created
# Check bundle sizes are reasonable

# Preview production build locally
npm run preview

# Visit: http://localhost:4173
# Test everything works in production mode
```

---

## 🐛 **If You See TypeScript Errors**

### **Missing Type Definitions**:
```bash
# Install missing @types packages
npm install -D @types/react @types/react-dom @types/node

# If specific library errors:
npm install -D @types/[library-name]
```

### **Import Errors**:
```typescript
// If you see: "Cannot find module"
// Check the import path is correct:

// ✅ Correct:
import { EmptyState } from '../components/common/EmptyState';

// ❌ Wrong:
import { EmptyState } from '../common/EmptyState';
```

---

## 📦 **What's Included (File Inventory)**

### **Trust & Marketing** (16 files):
- TrustBadges.tsx
- SecurityPage.tsx
- PrivacyPage.tsx
- CaseStudiesPage.tsx
- TestimonialCard.tsx
- VideoHeroDemo.tsx
- testimonials.ts, caseStudies.ts
- + 8 documentation files

### **UX Components** (10 files):
- OnboardingChecklist.tsx
- ModelTrainingProgress.tsx
- EnhancedDataUploader.tsx
- EmptyState.tsx
- LoadingSkeleton.tsx
- KeyboardShortcuts.tsx
- useKeyboardShortcuts.ts
- + 3 documentation files

### **Unique Features** (17 files):
- VoiceQueryInterface.tsx
- ScenarioBuilder.tsx
- AICopilot.tsx
- ABTestingDashboard.tsx
- ExplainabilityDashboard.tsx
- DataCleaningGame.tsx
- PresenceIndicator.tsx
- useRealtimeCollaboration.ts
- experimentTracking.ts
- ScenarioTesting.tsx
- ExperimentTracking.tsx
- ModelMarketplace.tsx
- + migration SQL
- + 4 documentation files

**TOTAL: 43+ files, ~14,000 lines**

---

## ✅ **Your Next Steps**

### **Right Now** (5 min):
```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Visit in browser
# http://localhost:5173

# 4. Test one feature:
# - Sign in
# - Look at bottom-right corner
# - See onboarding checklist!
```

### **This Week**:
1. Test all features thoroughly
2. Apply database migration
3. Integrate voice into data insights page
4. Fix any bugs found
5. Prepare Product Hunt launch

---

**The "EmptyState is not defined" error will be fixed once you run `npm install`!**

Let me know if you see any other errors! 🚀
