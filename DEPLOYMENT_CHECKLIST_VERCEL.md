# ✅ Deployment Checklist (Vercel + Supabase)

## Pre-Deployment

- [ ] Old OpenAI API key revoked at https://platform.openai.com/api-keys
- [ ] New OpenAI API key created and copied
- [ ] Supabase CLI installed: `npm i -g supabase`
- [ ] Logged in to Supabase: `npx supabase login`
- [ ] Project linked: `npx supabase link`

## Supabase Setup

- [ ] OpenAI API key added to Supabase secrets:
      ```bash
      npx supabase secrets set OPENAI_API_KEY=sk-proj-YOUR-KEY
      ```
- [ ] Verified secret is set:
      ```bash
      npx supabase secrets list
      ```
- [ ] Edge Function deployed:
      ```bash
      npx supabase functions deploy ai-chat
      ```
- [ ] Verified deployment:
      ```bash
      npx supabase functions list
      ```

## Vercel Setup

- [ ] Deleted `VITE_OPENAI_API_KEY` from Vercel environment variables
- [ ] Verified `VITE_SUPABASE_URL` is set in Vercel
- [ ] Verified `VITE_SUPABASE_ANON_KEY` is set in Vercel
- [ ] Environment variables set for all environments (Production, Preview, Development)

## Code Deployment

- [ ] All changes committed:
      ```bash
      git add .
      git commit -m "fix: Secure OpenAI API calls through Edge Functions"
      ```
- [ ] Code pushed to GitHub:
      ```bash
      git push origin main
      ```
- [ ] Vercel deployment triggered automatically
- [ ] Deployment completed successfully in Vercel dashboard

## Testing

- [ ] Visited production URL
- [ ] AI chat feature works
- [ ] Marketing content generation works
- [ ] Data transformation works
- [ ] No errors in browser console
- [ ] Network tab shows calls to `supabase.co/functions/v1/ai-chat`
- [ ] Network tab shows NO calls to `api.openai.com`

## Verification

- [ ] Local build has no API keys:
      ```bash
      npm run build
      grep -r "sk-" dist/
      ```
      (Should find nothing)

- [ ] Edge Function logs show successful requests:
      ```bash
      npx supabase functions logs ai-chat
      ```

- [ ] OpenAI usage dashboard shows activity (after testing)

## Monitoring Setup

- [ ] OpenAI hard limit set: https://platform.openai.com/usage
- [ ] OpenAI email alerts configured
- [ ] Supabase Edge Function monitoring enabled
- [ ] Vercel analytics checked

## Final Verification

- [ ] All AI features tested in production
- [ ] No API keys visible in browser DevTools → Sources
- [ ] No API keys in Vercel environment variables
- [ ] Old API key confirmed revoked at OpenAI

---

## Quick Commands

```bash
# Check Supabase secrets
npx supabase secrets list

# Check Supabase functions
npx supabase functions list

# Watch Supabase logs
npx supabase functions logs ai-chat --follow

# Check Vercel env vars
vercel env ls

# Force redeploy on Vercel
vercel --prod --force

# Test local build
npm run build && grep -r "sk-" dist/
```

---

**Status:** All checked? 🎉 You're SECURE and DEPLOYED!
