# Quick Admin Setup for Windows PowerShell

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "NowInTown - Admin Setup Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up:" -ForegroundColor Yellow
Write-Host "1. Admin email environment variable in Supabase"
Write-Host "2. Admin role for your user in the database"
Write-Host ""

# Admin email
$ADMIN_EMAIL = "shivan.meymo@gmail.com"
Write-Host "✓ Admin Email: $ADMIN_EMAIL" -ForegroundColor Green
Write-Host ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Step 1: Supabase Environment Variable" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to your Supabase Dashboard and add this environment variable:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Variable Name:  " -NoNewline
Write-Host "ADMIN_EMAIL" -ForegroundColor Green
Write-Host "Variable Value: " -NoNewline
Write-Host "$ADMIN_EMAIL" -ForegroundColor Green
Write-Host ""
Write-Host "Path: Dashboard → Settings → Edge Functions → Add Secret" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter when you've added the environment variable"

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Step 2: Find Your Firebase UID" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need your Firebase User ID (UID) to grant admin access." -ForegroundColor Yellow
Write-Host "Choose one of these methods:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Method 1: Firebase Console" -ForegroundColor Magenta
Write-Host "  1. Go to https://console.firebase.google.com/"
Write-Host "  2. Select your project"
Write-Host "  3. Go to Authentication → Users"
Write-Host "  4. Find: $ADMIN_EMAIL"
Write-Host "  5. Copy the User UID"
Write-Host ""
Write-Host "Method 2: From your app (easiest)" -ForegroundColor Magenta
Write-Host "  1. Log in to your app with $ADMIN_EMAIL"
Write-Host "  2. Open Browser DevTools (F12)"
Write-Host "  3. Go to Console tab"
Write-Host "  4. Look for a log that shows your user ID"
Write-Host ""
Write-Host "Method 3: Check database" -ForegroundColor Magenta
Write-Host "  1. Go to Supabase SQL Editor"
Write-Host "  2. Run: SELECT DISTINCT user_id FROM public.events WHERE user_id IS NOT NULL LIMIT 10;"
Write-Host "  3. Find your user_id"
Write-Host ""
$FIREBASE_UID = Read-Host "Enter your Firebase UID"

if ([string]::IsNullOrWhiteSpace($FIREBASE_UID)) {
    Write-Host "❌ Error: Firebase UID is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Step 3: Grant Admin Role" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy and run this SQL in your Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "---------------------------------------" -ForegroundColor Gray
Write-Host "-- Grant admin role to your user" -ForegroundColor Gray
Write-Host "INSERT INTO public.user_roles (user_id, role)" -ForegroundColor Green
Write-Host "VALUES ('$FIREBASE_UID', 'admin')" -ForegroundColor Green
Write-Host "ON CONFLICT (user_id, role) DO NOTHING;" -ForegroundColor Green
Write-Host ""
Write-Host "-- Verify admin role" -ForegroundColor Gray
Write-Host "SELECT * FROM public.user_roles WHERE user_id = '$FIREBASE_UID';" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter when you've run the SQL"

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What you can do now:" -ForegroundColor Yellow
Write-Host "✓ Receive email notifications for new events" -ForegroundColor Green
Write-Host "✓ Access the admin dashboard at /admin" -ForegroundColor Green
Write-Host "✓ Approve or reject events" -ForegroundColor Green
Write-Host "✓ Edit any event (not just your own)" -ForegroundColor Green
Write-Host "✓ View event statistics" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Log out and log back in to your app"
Write-Host "2. Navigate to: https://your-domain.com/admin"
Write-Host "3. Create a test event to verify email notifications"
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "- Not receiving emails? Check Edge Functions logs in Supabase"
Write-Host "- Can't access /admin? Verify user_roles table has your admin role"
Write-Host "- Clear browser cache and cookies if you have issues"
Write-Host ""
Write-Host "For more details, see: ADMIN_SETUP.md" -ForegroundColor Cyan
Write-Host ""
