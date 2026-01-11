Write-Host "`n=== Firebase Google Sign-In Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Check Firebase Console Configuration" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
Write-Host "1. Go to: https://console.firebase.google.com" -ForegroundColor White
Write-Host "2. Select project: 'nowintown'" -ForegroundColor White
Write-Host "3. Navigate to: Authentication > Sign-in method" -ForegroundColor White
Write-Host "4. Find 'Google' provider and click on it" -ForegroundColor White
Write-Host ""
Write-Host "   CHECK: Is Google sign-in ENABLED? (Toggle should be ON)" -ForegroundColor Green
Write-Host "   CHECK: Is there a Web client ID shown?" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter when you've verified these..." -ForegroundColor Gray
Read-Host

Write-Host "`nSTEP 2: Check Authorized Domains" -ForegroundColor Yellow
Write-Host "--------------------------------"
Write-Host "In Firebase Console:" -ForegroundColor White
Write-Host "1. Authentication > Settings > Authorized domains" -ForegroundColor White
Write-Host ""
Write-Host "   Required domains:" -ForegroundColor Green
Write-Host "   ✓ localhost" -ForegroundColor Gray
Write-Host "   ✓ Your production domain (e.g., nowintown.se)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter when verified..." -ForegroundColor Gray
Read-Host

Write-Host "`nSTEP 3: Check Google Cloud Console OAuth" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host "1. Go to: https://console.cloud.google.com" -ForegroundColor White
Write-Host "2. Select your Firebase project" -ForegroundColor White
Write-Host "3. Navigate to: APIs & Services > Credentials" -ForegroundColor White
Write-Host "4. Find OAuth 2.0 Client ID for Web" -ForegroundColor White
Write-Host "5. Click Edit (pencil icon)" -ForegroundColor White
Write-Host ""
Write-Host "   CHECK Authorized JavaScript origins:" -ForegroundColor Green
Write-Host "   ✓ http://localhost:5173" -ForegroundColor Gray
Write-Host "   ✓ http://localhost" -ForegroundColor Gray
Write-Host "   ✓ https://your-domain.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   CHECK Authorized redirect URIs:" -ForegroundColor Green
Write-Host "   ✓ http://localhost:5173" -ForegroundColor Gray
Write-Host "   ✓ https://nowintown.firebaseapp.com/__/auth/handler" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter when verified..." -ForegroundColor Gray
Read-Host

Write-Host "`nSTEP 4: OAuth Consent Screen & Test Users" -ForegroundColor Yellow
Write-Host "------------------------------------------"
Write-Host "In Google Cloud Console:" -ForegroundColor White
Write-Host "1. Navigate to: APIs & Services > OAuth consent screen" -ForegroundColor White
Write-Host ""
Write-Host "   CHECK: What is the Publishing status?" -ForegroundColor Green
$status = Read-Host "   Enter status (Testing/Production)"

if ($status -like "*test*" -or $status -like "*Test*") {
    Write-Host ""
    Write-Host "   ⚠️  APP IS IN TESTING MODE!" -ForegroundColor Red
    Write-Host "   You MUST add test users:" -ForegroundColor Red
    Write-Host ""
    Write-Host "   1. Click 'ADD USERS' button" -ForegroundColor White
    Write-Host "   2. Add: shivan.meymo@gmail.com" -ForegroundColor White
    Write-Host "   3. Save" -ForegroundColor White
    Write-Host ""
    Write-Host "   WITHOUT THIS, Google Sign-In will NOT work!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press Enter after adding test user..." -ForegroundColor Gray
    Read-Host
}

Write-Host "`nSTEP 5: Test the Fix" -ForegroundColor Yellow
Write-Host "--------------------"
Write-Host "Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   # Stop dev server" -ForegroundColor Gray
Write-Host '   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force' -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Clear browser cache (or use Incognito/Private window)" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Start dev server" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then try logging in with: shivan.meymo@gmail.com" -ForegroundColor Green
Write-Host ""

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common causes of 'auth/invalid-credential' error:" -ForegroundColor Yellow
Write-Host "1. App in Testing mode without test user added ← MOST COMMON" -ForegroundColor Red
Write-Host "2. Google provider not enabled in Firebase" -ForegroundColor White
Write-Host "3. Missing authorized domains" -ForegroundColor White
Write-Host "4. Incorrect OAuth redirect URIs" -ForegroundColor White
Write-Host ""
Write-Host "If error persists, check browser console (F12) for more details." -ForegroundColor Gray
Write-Host ""
