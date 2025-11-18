# Onboarding Questionnaire Testing Guide

## Prerequisites
✅ Migration applied (onboarding fields added to user_profiles table)

## Test Scenarios

### Test 1: First-Time User (Complete Flow)
1. **Clear browser data** for localhost:5173 (or use incognito)
2. Sign up with a new account
3. After signup, you should be redirected to `/app` (dashboard)
4. **Expected:** Onboarding modal appears after 500ms
5. **Complete all 4 steps:**
   - Step 1: Select a use case (e.g., "Customer Insights")
   - Step 2: Select profession (e.g., "Marketing Manager")
   - Step 3: Select industry (e.g., "E-commerce / Retail")
   - Step 4: Select objectives (e.g., "Increase revenue", "Better customer understanding")
6. Click "Complete Setup"
7. **Expected:** Modal closes, dashboard shows
8. Open AI chat on any dataset
9. **Expected:** Personalized welcome message shows (e.g., "Hi! As a Marketing Manager...")

### Test 2: User Skips Onboarding
1. **Clear browser data** or use new incognito window
2. Sign up with a new account
3. When onboarding modal appears, click **"Skip for now"**
4. **Expected:** Modal closes immediately, dashboard shows
5. Open AI chat
6. **Expected:** Generic welcome message (no personalization)

### Test 3: Returning User
1. Sign out and sign back in with account that completed onboarding
2. **Expected:** Onboarding modal does NOT appear
3. AI chat should show personalized messages

### Test 4: Context Personalization in AI
Complete onboarding as different roles and verify AI responses:

**Marketing Manager + E-commerce:**
- Ask: "What metrics should I track?"
- Expected mentions: CAC, ROAS, conversion rate, customer lifetime value

**Data Scientist + Healthcare:**
- Ask: "How should I approach this data?"
- Expected mentions: HIPAA compliance, patient privacy, statistical rigor

**Executive + Financial Services:**
- Ask: "Give me insights"
- Expected: High-level summaries, risk indicators, ROI focus

### Test 5: Database Verification
Check Supabase directly:
1. Go to: https://supabase.com/dashboard/project/bcobpxgktvgfsffdsiog/editor
2. Run query:
```sql
SELECT 
  email,
  use_case,
  profession,
  industry,
  objectives,
  onboarding_completed,
  onboarding_skipped,
  onboarding_completed_at
FROM auth.users
LEFT JOIN user_profiles ON users.id = user_profiles.user_id
ORDER BY created_at DESC
LIMIT 10;
```
3. Verify data is saved correctly

## What to Look For

### ✅ Success Indicators
- [ ] Modal appears on first login (not signup)
- [ ] All 4 steps work smoothly with progress bar
- [ ] Skip button works at any step
- [ ] Data saves to database on completion
- [ ] AI chat shows personalized greeting
- [ ] AI responses adapt to role/industry
- [ ] Modal doesn't appear for returning users
- [ ] No console errors

### ❌ Issues to Watch For
- Modal appears every time (not just first login)
- Modal appears during signup instead of after
- Data not saving to database
- AI chat not reading user context
- Modal blocks entire app (can't click anywhere)
- Progress bar stuck or incorrect
- Skip button not working

## Quick Dev Test Commands

```bash
# Start dev server
npm run dev

# Check build
npm run build

# View recent users in DB (via CLI if linked)
supabase db dump --data-only --schema auth --table users | tail -20
```

## Rollback Plan (If Issues)
If major issues found, revert migration:
```sql
-- Remove onboarding columns
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS use_case,
DROP COLUMN IF EXISTS profession,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS objectives,
DROP COLUMN IF EXISTS onboarding_completed,
DROP COLUMN IF EXISTS onboarding_skipped,
DROP COLUMN IF EXISTS onboarding_completed_at;

DROP INDEX IF EXISTS idx_user_profiles_onboarding;
```

## Production Deployment Checklist
Before deploying to production:
- [ ] Test all scenarios above
- [ ] Verify migration applied successfully
- [ ] Check no console errors
- [ ] Test on mobile (responsive design)
- [ ] Verify skip flow works
- [ ] Confirm AI personalization works
- [ ] Test with real OpenAI API key
- [ ] Verify analytics/tracking (if enabled)
