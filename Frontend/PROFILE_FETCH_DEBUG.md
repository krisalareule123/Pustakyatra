# Profile Fetch Debugging Guide

## Issue
"Failed to load profile data" error appears when opening Account Details page.

## Most Likely Causes

### 1. Backend Server Not Running
**Check**: Is the backend server running on http://localhost:5001?

**Solution**:
```bash
cd Backend
npm start
```

You should see:
```
Server running on port 5001
MySQL Connected
```

### 2. Token Not Being Sent Correctly
**Check**: Open browser console (F12) and look for logs:
- "Fetching profile with token..."
- "Profile response: ..."

**What to look for**:
- If you see "No token found" → Login again
- If you see network error → Backend server is down
- If you see 401 error → Token is invalid or expired

### 3. CORS Issues
**Check**: Look for CORS errors in browser console

**Solution**: Backend should have CORS enabled in server.js:
```javascript
app.use(cors());
```

## Improved Error Handling

The UserDashboard now:
1. **Tries to fetch from backend first**
2. **Falls back to localStorage data** if backend is unreachable
3. **Shows helpful error messages**:
   - "Could not connect to server. Showing cached data..." (if localStorage has data)
   - "Could not load profile. Please check if backend server is running." (if no cached data)
4. **Only redirects to login** if it's an authentication error (401)

## Testing Steps

### Step 1: Verify Backend is Running
```bash
cd Backend
npm start
```

### Step 2: Test Profile API Directly
Open browser console and run:
```javascript
fetch('http://localhost:5001/api/readers/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
```

Expected response:
```json
{
  "success": true,
  "user": {
    "reader_id": 1,
    "fullName": "Your Name",
    "email": "your@email.com",
    "phone": "...",
    "address": "...",
    "emailVerified": 0,
    "createdAt": "..."
  }
}
```

### Step 3: Check Token
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('AuthToken:', localStorage.getItem('authToken'));
console.log('UserData:', localStorage.getItem('userData'));
```

All three should have values if you're logged in.

### Step 4: Check Network Tab
1. Open DevTools → Network tab
2. Refresh the Account Details page
3. Look for request to `http://localhost:5001/api/readers/profile`
4. Check:
   - Status code (should be 200)
   - Request headers (should have Authorization: Bearer ...)
   - Response body (should have user data)

## Common Issues

### Issue: "Failed to fetch"
**Cause**: Backend server is not running
**Solution**: Start backend with `npm start` in Backend folder

### Issue: 401 Unauthorized
**Cause**: Token is invalid or expired
**Solution**: Logout and login again

### Issue: CORS error
**Cause**: Backend CORS not configured
**Solution**: Check server.js has `app.use(cors())`

### Issue: Network timeout
**Cause**: Backend server crashed or port 5001 is blocked
**Solution**: Restart backend, check if port 5001 is available

## What Changed

The UserDashboard now:
- ✓ Fetches profile data on mount
- ✓ Prefills all form fields
- ✓ Uses localStorage as fallback
- ✓ Better error messages
- ✓ Console logging for debugging
- ✓ Only redirects to login on auth errors
- ✓ Shows helpful messages for network errors
