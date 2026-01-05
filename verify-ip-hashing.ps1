# IP Hashing Verification Tool
# PowerShell Version

Write-Host ""
Write-Host "🔍 IP Hashing Verification Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will verify your IP_HASH_SALT"
Write-Host "configuration and check database records."
Write-Host ""
Write-Host "🚀 Starting verification..." -ForegroundColor Green
Write-Host ""

# Set Supabase environment variables
$env:NEXT_PUBLIC_SUPABASE_URL = "https://hatwvsjfedokodofiqsb.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdHd2c2pmZWRva29kb2ZpcXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzMjkwNiwiZXhwIjoyMDY5NDA4OTA2fQ.jS7MfF1OD8CSaVC7xTpHAtqNHsrThJaQ_ryA8q23vCM"

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Run the verification script
Write-Host "📊 Running verification..." -ForegroundColor Green
Write-Host ""
node scripts\verify-ip-hashing.js

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Verification completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Verification failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the errors above and fix them." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
