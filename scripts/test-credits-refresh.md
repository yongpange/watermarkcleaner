# Credits Display Refresh Test

## Test Steps

### 1. Restart Development Server
```bash
# Stop current server (Ctrl + C)
# Start again
npm run dev
```

### 2. Test Upload as Guest User
- Open browser: http://localhost:3001/convert
- Ensure you are logged out (check header)
- Upload any image
- Click "Start Watermark Removal"
- Wait for processing to complete

### 3. Check Credits Display Update
**Expected Result:**
- Before: "Monthly usage: 0 / 3 images"
- After: "Monthly usage: 1 / 3 images"
- Remaining: 2 images

### 4. Verify Console Logs
Look for:
```
IP Processing Debug: {...}
Processing history recorded successfully
CreditsDisplay: Fetching credits...  // (in CreditsDisplay)
```

### 5. Check Database
Query the database to confirm record was added:
```sql
SELECT * FROM wmc_processing_history ORDER BY created_at DESC LIMIT 3;
```

Should see:
- ip_address: 64-char hash (not plain IP)
- user_id: null (guest user)

## Troubleshooting

If credits don't update:

1. **Check console for errors**
2. **Verify API call**
   - Open Network tab in DevTools
   - Look for `/api/credits/check-ip` call after processing
   - Should return: `{ tier: "unverified", used: 1, limit: 3, remaining: 2 }`

3. **Check CreditsDisplay component**
   - Should re-render when key prop changes
   - useEffect should trigger new API call

## Implementation Details

### How it works:

1. **ConvertPage** (Client Component)
   - Manages `processingCount` state
   - Passes `key={processingCount}` to CreditsDisplay
   - Provides callback to WatermarkEditor

2. **WatermarkEditor**
   - Calls `onProcessingComplete()` after successful processing
   - Triggers parent re-render

3. **CreditsDisplay**
   - Key prop change forces re-render
   - useEffect runs again, fetching updated credits
   - UI shows new usage count
