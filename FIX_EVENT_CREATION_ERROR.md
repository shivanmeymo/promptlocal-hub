# Quick Fix for Event Creation Error

## Problem
Getting error: `null value in column "user_id" of relation "events" violates not-null constraint`

## Solution
Run this SQL in your Supabase dashboard (https://supabase.com/dashboard/project/YOUR_PROJECT/editor):

```sql
-- Make user_id optional in events table
ALTER TABLE public.events ALTER COLUMN user_id DROP NOT NULL;
```

## Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Paste the SQL above
6. Click "Run" or press Ctrl+Enter
7. Try creating an event again!

## Why This Fixes It
The events table was created with `user_id` as NOT NULL, but Firebase auth users might not have synced to Supabase yet. Making it optional allows event creation while the auth system stabilizes.

## Alternative: Apply Migration File
If you have psql or Supabase CLI installed:
```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f supabase/migrations/20260107_make_events_user_id_optional.sql
```

The migration file is already created at:
`supabase/migrations/20260107_make_events_user_id_optional.sql`
