@echo off
title WatermarkCleaner - Development Mode
echo.
echo ========================================================
echo 🚀 WatermarkCleaner Development
echo ========================================================
echo.
echo 📝 Current Configuration:
echo.

:: 检查环境变量是否设置
if defined NEXT_PUBLIC_USE_MOCK_API (
    echo ✅ Mock API Mode: %NEXT_PUBLIC_USE_MOCK_API%
) else (
    echo ⚠️  Mock API Mode: Not set (will use default)
)

if defined IP_HASH_SALT (
    echo ✅ IP Hash Salt: Configured
    echo ✅ IP Hash Value: %IP_HASH_SALT:~0,20%... (%IP_HASH_SALT:~20,44% characters)
) else (
    echo ❌ IP Hash Salt: Not found in environment
)

echo.
echo ========================================================
echo 🎯 Access URLs:
echo ========================================================
echo.
echo 🌐 Use this URL for development (IPv4):
echo    http://127.0.0.1:3000/convert
echo.
echo 📍 Alternative URLs:
echo    http://localhost:3000/convert (may use IPv6)
echo    http://[::1]:3000/convert (IPv6 only)
echo.
echo ⚠️  NOTE: Using IPv6 (::1) will create separate records from IPv4!
echo    Always use 127.0.0.1 for consistent IP hashing

echo.
echo ========================================================
echo 🐛 Debug Tools:
echo ========================================================
echo.
echo 🔍 To verify IP hashing:
echo    node scripts\verify-ip-hashing.js
echo.
echo 🔍 To diagnose IPv4/IPv6 issues:
echo    node scripts\diagnose-ip-issue.js
echo
echo 🔍 To monitor processing history in real-time:
echo    1. Open Supabase dashboard
echo    2. Navigate to SQL Editor
echo    3. Run: SELECT * FROM wmc_processing_history ORDER BY created_at DESC LIMIT 10;
echo.

echo ========================================================
echo 📊 Expected Behaviors:
echo ========================================================
echo.
echo ✅ New visitor (no records):
echo    Monthly usage: 0 / 3 images
echo.
echo ✅ After processing 1 image:
echo    Monthly usage: 1 / 3 images
echo.
echo ✅ After processing 3 images:
echo    Monthly usage: 3 / 3 images (limit reached)
echo.
echo 🔄 Credit reset:
echo    Monthly limit resets on the 1st of each month
echo.

echo ========================================================
echo 🚀 Starting Next.js development server...
echo ========================================================
echo.

:: Start the development server
npm run dev

:: Keep window open if there are errors
if errorlevel 1 (
    echo.
    echo ❌ Error starting server!
    echo.
    pause
)
