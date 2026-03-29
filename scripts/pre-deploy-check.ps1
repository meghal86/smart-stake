# AlphaWhale Pre-Deploy Check (PowerShell)
Write-Host "🐋 AlphaWhale Pre-Deploy Check" -ForegroundColor Cyan
Write-Host "================================"

$errors = 0
$required = @(
  "VITE_SUPABASE_URL","VITE_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_PROJECT_REF","VITE_ADMIN_EMAILS","STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET","CRON_SECRET"
)

Write-Host "`n📋 Checking environment variables..."
foreach ($var in $required) {
  $val = [System.Environment]::GetEnvironmentVariable($var)
  if (-not $val) { Write-Host "  ❌ Missing: $var" -ForegroundColor Red; $errors++ }
  else { Write-Host "  ✅ Set: $var" -ForegroundColor Green }
}

Write-Host "`n🔨 Running build..."
npm run build | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  ✅ Build: PASSED" -ForegroundColor Green }
else { Write-Host "  ❌ Build: FAILED" -ForegroundColor Red; $errors++ }

Write-Host "`n================================"
if ($errors -eq 0) { Write-Host "✅ Ready to deploy!" -ForegroundColor Green; exit 0 }
else { Write-Host "❌ $errors check(s) failed." -ForegroundColor Red; exit 1 }
