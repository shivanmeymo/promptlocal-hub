# Quick Email Test - Step by Step

## Do This Right Now:

### Step 1: Check Resend Sandbox Mode (MOST COMMON ISSUE!)

1. Go to: **https://resend.com**
2. Log in to your account
3. Look at the top of the page - do you see "SANDBOX MODE" or similar warning?

**If YES**: Your account is in sandbox mode. This means emails ONLY go to verified addresses!

**To fix**:
- Go to: https://resend.com/domains (or look for "Add Recipient" or "Verify Email")
- Verify `contact@nowintown.se` by adding it as a recipient
- Check that email inbox for verification link from Resend
- Click the verification link

### Step 2: Test by Creating an Event

1. Go to your app: http://localhost:5173
2. Log in as a user (not admin)
3. Click **Create Event**
4. Fill in ALL required fields
5. Click **Submit**

### Step 3: Check Supabase Logs (Do this IMMEDIATELY after creating event)

1. Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions
2. Click on `notify-admin-new-event`
3. Click **Logs** tab
4. Look for the latest invocation (should be within seconds)

**What you should see** ✅:
```
notify-admin-new-event function called
Using admin email: contact@nowintown.se
📧 Attempting to send email...
   From: NowInTown <onboarding@resend.dev>
   To: contact@nowintown.se
✅ Admin notification sent successfully!
📬 Email ID: [some-id]
```

**What's bad** ❌:
```
CRITICAL: RESEND_API_KEY environment variable is not set!
```
→ Fix: Set RESEND_API_KEY in Supabase secrets

### Step 4: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. Look for the latest email
3. Check its status:
   - **Delivered** ✅ = Email was sent successfully, check inbox!
   - **Blocked** ❌ = Recipient not verified (sandbox mode issue)
   - **Bounced** ❌ = Email address doesn't exist

### Step 5: Check Email Inbox

- Check `contact@nowintown.se` inbox
- **Check spam/junk folder** (very important!)
- Look for email from `onboarding@resend.dev`
- Subject: "New Event Pending Review: [your event title]"

---

## Common Problems & Solutions

### ❌ "Email service not configured"
**Problem**: RESEND_API_KEY not set
**Fix**: 
1. Get key from https://resend.com/api-keys
2. Go to https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions
3. Click "Manage secrets"
4. Add: `RESEND_API_KEY` = `re_...`
5. Create new test event

### ❌ Email shows as "Blocked" in Resend
**Problem**: Sandbox mode - recipient not verified
**Fix**:
1. Go to https://resend.com
2. Find option to verify recipient or add domain
3. Verify `contact@nowintown.se`
4. Check that inbox for verification email
5. Click verification link
6. Create new test event

### ❌ Email shows as "Delivered" but not in inbox
**Problem**: Email in spam or wrong inbox
**Fix**:
- Check spam/junk folder thoroughly
- Make sure you have access to contact@nowintown.se
- Check if contact@nowintown.se forwards to another email
- Add onboarding@resend.dev to safe senders

### ❌ No logs in Supabase at all
**Problem**: Function not being triggered
**Fix**:
- Check browser console (F12) for errors when creating event
- Make sure you're logged in when creating event
- Check that event creation actually succeeds

---

## The #1 Most Common Issue

**🚨 99% of the time, the issue is:**

Resend is in **sandbox mode** and `contact@nowintown.se` is **not verified**.

**How to know if this is your issue:**
- Resend dashboard shows "Sandbox" mode
- Email status shows "Blocked" or similar
- Supabase logs show email sent successfully
- But no email arrives in inbox

**Fix**: Verify the recipient email in Resend!

---

## Still stuck?

After testing:
1. Copy the output from Supabase logs
2. Copy the status from Resend dashboard
3. Share them so I can help debug further

**Important links:**
- Supabase Logs: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions
- Resend Emails: https://resend.com/emails
- Resend API Keys: https://resend.com/api-keys
