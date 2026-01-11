# Email Service Quick Start

## ✅ What's Done

Both email functions are now **deployed and ready**:
- `notify-admin-new-event` → Notifies admin when events are created
- `send-event-approval-notification` → Sends approval/rejection emails

## 🚨 What You Need to Do

### 1. Get Resend API Key (2 minutes)
1. Go to: https://resend.com
2. Sign up/Login
3. Go to: **API Keys** → **Create API Key**
4. Name it: "NowInTown"
5. **Copy the key** (starts with `re_...`)

### 2. Set Environment Variable in Supabase (1 minute)
1. Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions
2. Click: **Manage secrets**
3. Add secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_...` (paste your key from step 1)
4. Click **Save**

### 3. Test It!
1. Create a test event in your app
2. Check email at: **contact@nowintown.se**
3. You should receive an approval email with Approve/Reject buttons

## 📧 Email Flows

```
User creates event
    ↓
Email sent to: contact@nowintown.se
    ↓
Admin clicks Approve/Reject
    ↓
Email sent to: Organizer
```

## 🐛 Troubleshooting

**No email received?**
- Check spam folder
- Verify `RESEND_API_KEY` is set in Supabase
- Check logs: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions
- Check Resend: https://resend.com/emails

**"Email service not configured" error?**
- Go back to step 2 above
- Make sure the secret name is exactly `RESEND_API_KEY`

## 📚 Full Documentation

See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) for complete setup instructions, production configuration, and troubleshooting.

---

**Admin Email**: contact@nowintown.se
**Project**: https://supabase.com/dashboard/project/suueubckrgtiniymoxio
