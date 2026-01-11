# Supabase Edge Function Deployment Script
# 
# INSTRUCTIONS:
# 1. Get your Access Token from: https://supabase.com/dashboard/account/tokens
# 2. Replace YOUR_TOKEN_HERE below with your actual token
# 3. Run this script in PowerShell

Write-Host "🚀 Deploying Edge Function to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Set your Supabase Access Token here
$env:SUPABASE_ACCESS_TOKEN = "YOUR_TOKEN_HERE"

if ($env:SUPABASE_ACCESS_TOKEN -eq "YOUR_TOKEN_HERE") {
    Write-Host "❌ ERROR: Please edit this file and replace YOUR_TOKEN_HERE with your actual Supabase Access Token" -ForegroundColor Red
    Write-Host ""
    Write-Host "Get your token from: https://supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📁 Deploying generate-event-description function..." -ForegroundColor Yellow
npx supabase functions deploy generate-event-description --project-ref suueubckrgtiniymoxio

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Now test the 'Generate with AI' button and check Supabase logs for:" -ForegroundColor Cyan
    Write-Host "   - === Edge Function called ===" -ForegroundColor White
    Write-Host "   - ✅ Authenticated Firebase user: VjNhy9vaDfRgF8hxbA1wktb4AKJ2" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error above." -ForegroundColor Red
}
