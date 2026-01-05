@echo off
title IP Hashing Verification Tool
echo.
echo 🔍 IP Hashing Verification Tool
echo ========================================
echo.
echo This script will verify your IP_HASH_SALT
echo configuration and check database records.
echo.
echo 🚀 Starting verification...
echo.

:: Set Supabase environment variables
set NEXT_PUBLIC_SUPABASE_URL=https://hatwvsjfedokodofiqsb.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdHd2c2pmZWRva29kb2ZpcXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzMjkwNiwiZXhwIjoyMDY5NDA4OTA2fQ.jS7MfF1OD8CSaVC7xTpHAtqNHsrThJaQ_ryA8q23vCM

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

:: Run the verification script
echo 📊 Running verification...
echo.
node scripts\verify-ip-hashing.js

:: Check exit code
if errorlevel 1 (
    echo.
    echo ❌ Verification failed!
    echo.
    echo Please check the errors above and fix them.
) else (
    echo.
    echo ✅ Verification completed successfully!
)

echo.
echo ========================================
echo.
echo Press any key to exit...
pause >nul
