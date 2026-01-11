# 🚨 Email Not Received? Troubleshooting Guide

## Most Common Issue: Resend Sandbox Mode

**Resend sandbox mode only sends emails to VERIFIED addresses!**

### ✅ Solution: Verify Your Admin Email

1. **Go to Resend Dashboard**: https://resend.com
2. **Check your account status**:
   - Look for "Sandbox" mode warning
   - In sandbox mode, emails only go to verified addresses

3. **Verify contact@nowintown.se**:
   - Go to: https://resend.com/domains or https://resend.com/settings
   - Look for "Add recipient" or "Verify email"
   - Enter: `contact@nowintown.se`
   - Check inbox for verification email from Resend
   - Click verification link

---

## Step-by-Step Diagnostic

### Check 1: Is RESEND_API_KEY Set?

1. Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions
2. Click "Manage secrets"
3. Verify you see:
   - `RESEND_API_KEY` = `re_...` (your actual key)
   - `ADMIN_EMAIL` = `contact@nowintown.se`

**If missing**: Add them now, then test again.

### Check 2: Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions
2. Find `notify-admin-new-event` function
3. Click on it to see recent invocations
4. Look for log messages:

**Good signs** ✅:
```
notify-admin-new-event function called
Using admin email: contact@nowintown.se
Sending email to admin: contact@nowintown.se
Admin notification sent successfully
```

**Bad signs** ❌:
```
CRITICAL: RESEND_API_KEY environment variable is not set!
Email service not configured: RESEND_API_KEY is missing
```

If you see error messages, the environment variables aren't set correctly.

### Check 3: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. Look for recent email sends
3. Check the status:
   - **Delivered** ✅ - Email was sent successfully
   - **Bounced** ❌ - Email address doesn't exist
   - **Blocked** ⚠️ - Recipient not verified (sandbox mode)

### Check 4: Check Your Email

- **Check spam/junk folder** - Emails from `onboarding@resend.dev` may be filtered
- **Check contact@nowintown.se inbox** - Make sure you have access
- **Check email forwarding** - If contact@nowintown.se forwards, check that inbox too

---

## Quick Test

### Test if Function is Being Called:

1. **Open browser console** (F12) in your app
2. **Create a new test event**
3. **Watch console** for:
   ```
   Failed to notify admin: [error message]
   ```

4. **Immediately check** Supabase logs (within 1 minute)

### Manual Test Email:

If you want to test Resend directly, run this PowerShell script:

```powershell
# Replace with your actual Resend API key
$apiKey = "re_YOUR_KEY_HERE"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    from = "NowInTown <onboarding@resend.dev>"
    to = @("contact@nowintown.se")
    subject = "Test Email from NowInTown"
    html = "<h1>Test Email</h1><p>If you receive this, Resend is working!</p>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers $headers -Body $body
```

---

## Solutions by Error Type

### "Email service not configured: RESEND_API_KEY is missing"
**Fix**: Go to Supabase → Functions → Manage secrets → Add `RESEND_API_KEY`

### No error, but email not received
**Fix**: 
1. Verify email address in Resend (sandbox mode issue)
2. Check spam folder
3. Check Resend dashboard for delivery status

### "Failed to send email" in logs
**Fix**:
1. Check API key is valid (not expired)
2. Check Resend account isn't over quota
3. Verify `onboarding@resend.dev` sender is allowed

### Function not being called at all
**Fix**: Check browser console for errors when creating event

---

## Production Setup (Recommended)

To avoid sandbox restrictions:

### Option 1: Verify Domain (Best for production)

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `nowintown.se`
4. Follow DNS instructions:
   - Add SPF record
   - Add DKIM records
5. Wait for verification (5-30 minutes)
6. Update function to use `noreply@nowintown.se` instead of `onboarding@resend.dev`

### Option 2: Upgrade Resend Account

- Free tier: Sandbox mode, 100 emails/day
- Paid tier: Production mode, unlimited verified recipients

---

## Testing Checklist

Run through this checklist:

- [ ] RESEND_API_KEY is set in Supabase
- [ ] ADMIN_EMAIL is set to `contact@nowintown.se`
- [ ] contact@nowintown.se is verified in Resend (if sandbox mode)
- [ ] Created a test event
- [ ] Checked Supabase logs (no errors)
- [ ] Checked Resend dashboard (email sent)
- [ ] Checked spam folder
- [ ] Checked actual inbox for contact@nowintown.se

---

## Still Not Working?

If you've done all the above:

1. **Run the diagnostic script**: `.\test-email-functions.ps1`
2. **Share the error message** from Supabase logs
3. **Check Resend dashboard** for bounced/blocked emails
4. **Verify email address** - Make sure `contact@nowintown.se` is the correct admin email

---

## Quick Reference

- **Supabase Functions**: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions
- **Resend Dashboard**: https://resend.com
- **Resend Emails Log**: https://resend.com/emails
- **Resend Domains**: https://resend.com/domains

**Admin Email**: contact@nowintown.se
**Sender Email**: onboarding@resend.dev (sandbox) or noreply@nowintown.se (production)
