# Email Function Diagnostic Script
# Run this to check if email functions are working

Write-Host "`n=== Email Service Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check 1: Environment Variables
Write-Host "Step 1: Checking if you've set the environment variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions" -ForegroundColor White
Write-Host ""
Write-Host "Check if these secrets are set:" -ForegroundColor White
Write-Host "  - RESEND_API_KEY" -ForegroundColor Gray
Write-Host "  - ADMIN_EMAIL (should be: contact@nowintown.se)" -ForegroundColor Gray
Write-Host ""
$envCheck = Read-Host "Have you set these? (yes/no)"

if ($envCheck -ne "yes") {
    Write-Host ""
    Write-Host "⚠️  Please set the environment variables first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick steps:" -ForegroundColor Yellow
    Write-Host "1. Get API key from: https://resend.com" -ForegroundColor White
    Write-Host "2. Add RESEND_API_KEY secret in Supabase" -ForegroundColor White
    Write-Host "3. Add ADMIN_EMAIL = contact@nowintown.se" -ForegroundColor White
    Write-Host ""
    exit
}

# Check 2: Resend Account Setup
Write-Host "`nStep 2: Checking Resend configuration..." -ForegroundColor Yellow
Write-Host ""
Write-Host "In Resend (https://resend.com):" -ForegroundColor White
Write-Host ""
Write-Host "Q1: Is contact@nowintown.se verified in Resend?" -ForegroundColor Green
Write-Host "    If you're in sandbox mode, you need to verify the email address" -ForegroundColor Gray
$resendVerified = Read-Host "Is it verified? (yes/no/don't know)"

if ($resendVerified -eq "no" -or $resendVerified -eq "don't know") {
    Write-Host ""
    Write-Host "⚠️  This is likely the issue!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Resend sandbox mode only sends to VERIFIED email addresses." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solution:" -ForegroundColor Green
    Write-Host "1. Go to: https://resend.com/emails" -ForegroundColor White
    Write-Host "2. Look for verification email sent to contact@nowintown.se" -ForegroundColor White
    Write-Host "3. Click the verification link" -ForegroundColor White
    Write-Host ""
    Write-Host "OR" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verify your domain:" -ForegroundColor Green
    Write-Host "1. Go to: https://resend.com/domains" -ForegroundColor White
    Write-Host "2. Add domain: nowintown.se" -ForegroundColor White
    Write-Host "3. Follow DNS setup instructions" -ForegroundColor White
    Write-Host ""
    exit
}

# Check 3: Function Logs
Write-Host "`nStep 3: Checking Edge Function logs..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/functions" -ForegroundColor White
Write-Host ""
Write-Host "Look for 'notify-admin-new-event' invocations" -ForegroundColor White
Write-Host ""
Write-Host "What do you see in the logs?" -ForegroundColor Green
Write-Host "  A) Email sent successfully" -ForegroundColor Gray
Write-Host "  B) RESEND_API_KEY is missing error" -ForegroundColor Gray
Write-Host "  C) Other error message" -ForegroundColor Gray
Write-Host "  D) No logs at all (function not called)" -ForegroundColor Gray
Write-Host ""
$logStatus = Read-Host "Choose (A/B/C/D)"

switch ($logStatus.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "✅ Function is working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "If email still not received:" -ForegroundColor Yellow
        Write-Host "1. Check spam/junk folder" -ForegroundColor White
        Write-Host "2. Check Resend dashboard: https://resend.com/emails" -ForegroundColor White
        Write-Host "3. Verify contact@nowintown.se is correct email" -ForegroundColor White
        Write-Host "4. Check email forwarding/filters" -ForegroundColor White
    }
    "B" {
        Write-Host ""
        Write-Host "❌ RESEND_API_KEY not set correctly!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solution:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://supabase.com/dashboard/project/suueubckrgtiniymoxio/settings/functions" -ForegroundColor White
        Write-Host "2. Click 'Manage secrets'" -ForegroundColor White
        Write-Host "3. Add secret:" -ForegroundColor White
        Write-Host "   Name: RESEND_API_KEY" -ForegroundColor Gray
        Write-Host "   Value: re_..." -ForegroundColor Gray
        Write-Host "4. Save" -ForegroundColor White
    }
    "C" {
        Write-Host ""
        Write-Host "Please share the error message so I can help debug!" -ForegroundColor Yellow
    }
    "D" {
        Write-Host ""
        Write-Host "⚠️  Function is not being triggered!" -ForegroundColor Red
        Write-Host ""
        Write-Host "This means the event creation isn't calling the function." -ForegroundColor Yellow
        Write-Host "Let me check the frontend code..." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== Additional Troubleshooting ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test email sending manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create a new test event in your app" -ForegroundColor White
Write-Host "2. Immediately check Supabase logs (within 1 minute)" -ForegroundColor White
Write-Host "3. Check Resend dashboard for sent emails" -ForegroundColor White
Write-Host ""
Write-Host "Common Issues:" -ForegroundColor Yellow
Write-Host "  • Email in spam folder" -ForegroundColor Gray
Write-Host "  • Resend sandbox mode (need to verify recipient)" -ForegroundColor Gray
Write-Host "  • RESEND_API_KEY not set or expired" -ForegroundColor Gray
Write-Host "  • Wrong email address in ADMIN_EMAIL" -ForegroundColor Gray
Write-Host ""
