# 🔧 Signup Troubleshooting Guide

## Issue: "Something went wrong" Error

If you're seeing this error during signup, here are the most common causes and fixes:

---

## ✅ Quick Fixes (Try These First)

### Fix 1: Make Sure All REQUIRED Fields Are Filled
The signup form requires:
- ✅ Full Name
- ✅ Email (real email domain)
- ✅ Password (8+ characters)
- ✅ **Use Case (MUST select from dropdown!)**

**Common mistake:** Leaving dropdown at "What will you use this app for?"
**Fix:** Click dropdown and select an option!

---

### Fix 2: Use a Real Email Domain
**Don't use:** test.com, example.com, fake.com, temp.com  
**Do use:** gmail.com, outlook.com, yahoo.com, or your company email

The app blocks fake email domains to prevent spam.

---

### Fix 3: Check Supabase Email Settings

1. Go to: https://app.supabase.com
2. Select your project: `bcobpxgktvgfsffdsiog`
3. Go to: **Authentication** → **Settings**
4. Find: **"Enable email confirmations"**
5. **Turn it OFF** for development
6. Click **Save**
7. Try signup again

---

## 🔍 Detailed Debugging

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Try signing up again
4. Look for error messages

### Step 2: Look for These Logs
You should see:
```
Starting signup with profile: {
  email: "...",
  fullName: "...",
  company: "...",
  useCase: "..."
}
```

Then:
```
Signup response: { data: {...}, error: null }
```

Or if error:
```
Supabase signup error: { message: "..." }
```

### Step 3: Common Error Messages

| Error Message | What It Means | Fix |
|--------------|---------------|-----|
| "Please fill in all required fields" | Missing field | Fill all required fields (including Use Case!) |
| "Please use a real email address" | Fake email domain | Use gmail.com, outlook.com, etc. |
| "User already registered" | Email exists | Use different email or sign in |
| "Email rate limit exceeded" | Too many attempts | Wait 5 minutes |
| "invalid api" or "API key" | Supabase config | Disable email confirmation in Supabase |
| "Database error" | Connection issue | Wait and try again |

---

## 🧪 Test With Valid Data

Try this exact data to test:

```
Full Name: Test User
Company: Test Company (leave blank if you want)
Job Title: Tester (leave blank if you want)
LinkedIn: (leave blank - it's optional)

Use Case: Click dropdown → Select "Accounting & Bookkeeping"
          (Or any option - just MUST select something!)

Email: youractual email@gmail.com
       (Use YOUR real email address)

Password: testpass123
          (8+ characters)
```

Click "Create Account"

---

## ⚡ Most Common Issue

### 90% of signup failures are because:

**User forgot to select "Use Case" from dropdown!**

The dropdown shows: "What will you use this app for?"

**This is NOT a selection!** You must click it and choose an option:
- Accounting & Bookkeeping
- Real Estate & Property Management
- Personal Finance & Investments
- etc.

---

## 🔧 If Still Not Working

### Check Supabase Auth Logs:

1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Look for your email
4. If it's there: Account was created! Just sign in.
5. If not there: Check **Logs** tab for errors

### Check Supabase Email Provider:

1. **Authentication** → **Providers**
2. Make sure **Email** is **Enabled**
3. Settings should be:
   - ✅ Enable Email Provider: ON
   - ✅ Enable Email Signups: ON
   - ❌ Enable Email Confirmations: OFF (for dev)
   - ❌ Secure Email Change: OFF (for dev)

---

## 🚨 Emergency Workaround

If signup keeps failing, you can create a user directly in Supabase:

1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Click **"Add user"**
4. Enter:
   - Email: your@email.com
   - Password: yourpassword
   - Auto Confirm User: ✅ ON
5. Click "Create user"
6. Go back to app and sign in!

Then update your profile in **Settings** after signing in.

---

## 📞 Still Stuck?

**Share these details:**

1. **What error message do you see?** (exact text)
2. **Browser console logs** (copy/paste the errors)
3. **Which fields did you fill in?**
4. **Did you select a Use Case?** (this is the #1 issue!)

**Check browser console:**
```
Right-click → Inspect → Console tab
Try signup
Copy any RED error messages
```

---

## ✅ Success Checklist

When signup works, you'll see:

1. ✅ Toast: "🎉 Account created successfully!"
2. ✅ Toast: "You can now sign in with your credentials!"
3. ✅ Form switches from "Create Account" to "Sign In"
4. ✅ Email field is pre-filled
5. ✅ NO redirect to pricing page
6. ✅ NO "something went wrong" message

Then:
- Enter your password again
- Click "Sign In"
- Should redirect to /app dashboard
- You're in! 🎉

---

**Try again with these fixes!** The most common issue is forgetting to select the Use Case dropdown.

