# Email Service Setup Guide for NowInTown

## ✅ Status: Functions Deployed

The email notification functions have been **successfully deployed** to Supabase:
- ✅ `notify-admin-new-event` - Sends email to admin when new event is created
- ✅ `send-event-approval-notification` - Sends approval/rejection emails to organizers

**Next Step**: Configure the RESEND_API_KEY to enable email sending.

---

## 🚨 REQUIRED: Set Environment Variables in Supabase

### Step 1: Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and sign up/login
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name like "NowInTown Production"
5. Copy the API key (starts with `re_...`)

### Step 2: Set Environment Variables in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions)
2. Navigate to: **Project Settings → Edge Functions → Manage secrets**
3. Add the following secrets:

   | Secret Name | Value | Required? |
   |------------|-------|-----------|
   | `RESEND_API_KEY` | `re_...` (from Step 1) | ✅ YES |
   | `ADMIN_EMAIL` | `contact@nowintown.se` | ✅ YES |

4. Click **Save** after adding each secret

### Step 3: Verify Configuration

After setting the environment variables, test the email service:

1. **Create a test event** in your application
2. **Check Supabase Edge Function logs**:
   - Go to: [Supabase Dashboard → Functions → Logs](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions)
   - Look for `notify-admin-new-event` invocations
3. **Check for these log messages**:
   - ✅ `Using admin email: contact@nowintown.se`
   - ✅ `Sending email to admin: contact@nowintown.se`
   - ✅ `Admin notification sent successfully`

If you see errors about missing RESEND_API_KEY, go back to Step 2.

---

## 📧 Email Workflows

### 1. New Event Submitted
**Function**: `notify-admin-new-event`

**Trigger**: When user creates a new event (status = 'pending')

**Email sent to**: `contact@nowintown.se` (admin)

**Email contains**:
- Event title, description, dates
- Organizer information
- **Approve** button (green)
- **Reject** button (red)

### 2. Event Approved/Rejected
**Function**: `send-event-approval-notification`

**Trigger**: When admin clicks Approve or Reject

**Email sent to**: Organizer's email address

**Approval Email contains**:
- Confirmation that event was approved
- Event details
- Link to view event on website

**Rejection Email contains**:
- Notification that event was not approved
- Admin's reason/notes (if provided)
- Encouragement to resubmit with changes

---

## 🔍 Troubleshooting

### Issue: "Email service not configured: RESEND_API_KEY is missing"

**Solution**:
1. Verify you set `RESEND_API_KEY` in Supabase Dashboard
2. Check the secret name is exactly `RESEND_API_KEY` (case-sensitive)
3. Make sure the API key starts with `re_`
4. Try redeploying the function:
   ```powershell
   npx supabase functions deploy notify-admin-new-event --project-ref suueubckrgtiniymoxio
   ```

### Issue: Emails not arriving

**Possible causes**:
1. **Resend sandbox mode**: By default, Resend only sends to verified email addresses
   - Solution: Add `contact@nowintown.se` as a verified sender in Resend Dashboard
   - Or: Verify your domain (see Production Setup below)

2. **Check spam folder**: Emails from `onboarding@resend.dev` may be flagged

3. **Check Resend Dashboard**: Go to [Resend Dashboard → Emails](https://resend.com/emails) to see delivery status

### Issue: "Failed to send email" in logs

1. Check Resend API key is valid (not expired)
2. Check Resend account status (not over quota)
3. Verify sender email (`onboarding@resend.dev` is allowed in sandbox)
4. Check Supabase Edge Function logs for detailed error messages

---

## 🚀 Production Setup (Optional but Recommended)

### Domain Verification

For production, verify your domain to send from `noreply@nowintown.se`:

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter: `nowintown.se`
4. Follow the DNS configuration steps:
   - Add SPF record
   - Add DKIM records
   - Add DMARC record (optional)
5. Wait for verification (usually 5-30 minutes)

### Update Email Sender

Once domain is verified, update the functions to use your domain:

In `supabase/functions/notify-admin-new-event/index.ts` and `send-event-approval-notification/index.ts`:

```typescript
// Change from:
from: "NowInTown <onboarding@resend.dev>",

// To:
from: "NowInTown <noreply@nowintown.se>",
```

Then redeploy:
```powershell
npx supabase functions deploy notify-admin-new-event --project-ref suueubckrgtiniymoxio
npx supabase functions deploy send-event-approval-notification --project-ref suueubckrgtiniymoxio
```

---

## 📊 Testing Checklist

- [ ] RESEND_API_KEY set in Supabase
- [ ] ADMIN_EMAIL set to `contact@nowintown.se`
- [ ] Create test event from frontend
- [ ] Check Supabase logs for `notify-admin-new-event`
- [ ] Verify email arrives at `contact@nowintown.se`
- [ ] Click Approve/Reject button in email
- [ ] Verify organizer receives approval/rejection email
- [ ] Check email content is correct (no broken links)

---

## 🔐 Security Notes

- API keys are stored securely in Supabase environment variables
- Never commit API keys to git
- The `RESEND_API_KEY` is only accessible by Edge Functions
- Emails are sent server-side, never exposing API key to frontend
- HTML content is escaped to prevent XSS attacks

---

## 📚 Resources

- **Resend Documentation**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Your Supabase Project**: https://supabase.com/dashboard/project/suueubckrgtiniymoxio
- **Resend Dashboard**: https://resend.com/home

---

## 🆘 Support

If you encounter issues:

1. Check Supabase Edge Function logs: [View Logs](https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions)
2. Check Resend delivery logs: [Resend Emails](https://resend.com/emails)
3. Verify environment variables are set correctly
4. Test with a simple curl command:
   ```bash
   curl -X POST "https://suueubckrgtiniymoxio.supabase.co/functions/v1/notify-admin-new-event" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"event_id":"test-event-id"}'
   ```

---

**Last Updated**: Deployment completed successfully
**Functions Deployed**: 2024-01-XX
**Admin Email**: contact@nowintown.se
