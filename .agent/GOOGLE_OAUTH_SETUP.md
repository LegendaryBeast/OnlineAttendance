# Google OAuth Configuration Guide

## Issues Fixed

1. ✅ **Changed API_URL from `https://localhost:3000` to `http://localhost:3000`**
   - Your backend runs on HTTP locally, not HTTPS
   - This was causing connection failures

## Google Cloud Console Setup

To fix Google Sign-In, you need to configure your Google Cloud Console properly:

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)

### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (or Internal if you have a Google Workspace)
3. Fill in the required fields:
   - App name: `SUST Digital Attendance`
   - User support email: Your email
   - Developer contact email: Your email
4. **Add Test Users** (Important for development):
   - Click "Add Users" in the Test Users section
   - Add your SUST email addresses that you'll use for testing
   - Add: `your-email@sust.edu`, `2021331006@student.sust.edu`, etc.
5. Save and continue

### Step 3: Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: `SUST Digital Attendance Web`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5500
     http://localhost:3000
     http://127.0.0.1:5500
     http://127.0.0.1:3000
     ```
   - **Authorized redirect URIs**: Leave empty (not needed for Google Identity Services)
5. Click **Create**
6. Copy your **Client ID**

### Step 4: Update Your Code
Your Client ID in `auth.js` (line 158) is:
```
590867699522-0cobj67nq9m575n9h0enbvje0gs52nch.apps.googleusercontent.com
```

✅ This should match the Client ID from your Google Cloud Console.

## Current Configuration

### Frontend (auth.js)
- ✅ API URL: `http://localhost:3000/api`
- ✅ Google Client ID: `590867699522-0cobj67nq9m575n9h0enbvje0gs52nch.apps.googleusercontent.com`
- ✅ Google Identity Services library loaded in index.html

### Backend Requirements
Your backend should be running on: `http://localhost:3000`
- ✅ Backend is currently running

## Common Issues & Solutions

### Issue 1: "Access blocked: This app's request is invalid"
**Solution:** 
- Your Authorized JavaScript origins don't match
- Make sure you added: `http://localhost:5500` (where your frontend runs)
- Wait 5 minutes after making changes in Google Cloud Console

### Issue 2: "Pop-up blocked" or button doesn't appear
**Solution:**
- Clear browser cache
- Make sure the Google script is loaded: Check line 8 in index.html
- Open browser console and look for errors

### Issue 3: "redirect_uri_mismatch"
**Solution:**
- For Google Identity Services (One Tap), you don't need redirect URIs
- Only Authorized JavaScript origins are needed

### Issue 4: "Invalid token" or backend errors
**Solution:**
- Check backend console for errors
- Verify backend endpoint: `POST /api/auth/google` exists
- Check if `google-auth-library` is installed in backend

### Issue 5: "Only users with access can sign in"
**Solution:**
- Your app is in "Testing" mode
- Add your email to Test Users in OAuth consent screen
- OR publish your app (not recommended for development)

## Testing Steps

1. **Clear browser cache and cookies**
   - Important: Old Google tokens might be cached

2. **Open browser console** (F12)
   - Check for any JavaScript errors
   - Look for network request failures

3. **Open the login page**
   - Navigate to: `http://localhost:5500/`
   - Google Sign-In button should appear

4. **Click Google Sign-In**
   - Google popup should open
   - Select your SUST email
   - Should redirect to dashboard

## Debugging

### Check if Google button loads:
```javascript
// In browser console:
console.log(window.google); // Should show object, not undefined
```

### Check API calls:
```javascript
// In browser console:
console.log(window.API_URL); // Should show: http://localhost:3000/api
```

### Test backend directly:
```bash
# In terminal:
curl http://localhost:3000/api/auth/google -X POST -H "Content-Type: application/json" -d '{"token":"test"}'
```

## What's in Your Code

### Frontend Flow:
1. Google Sign-In button rendered (index.html, line 30)
2. User clicks button → Google popup opens
3. Google returns credential token
4. `handleGoogleLoginResponse()` sends token to backend (auth.js, line 187)
5. Backend verifies token and returns JWT
6. User redirected to dashboard

### Backend Flow (what should happen):
1. Receive Google ID token
2. Verify with Google (`google-auth-library`)
3. Extract email and profile info
4. Check if user exists, create if needed
5. Determine role (student/teacher) based on email domain
6. Return JWT token

## File Locations Changed

- ✅ `/frontend/js/auth.js` - Fixed API_URL to use HTTP

## Next Steps

1. Verify your Google Cloud Console settings match the guide above
2. Add your email to Test Users
3. Clear browser cache
4. Try logging in again
5. Check browser console for any errors
6. Check backend terminal for any errors

If issues persist, share:
- Browser console errors
- Backend terminal errors
- Screenshot of your Google Cloud Console OAuth settings
