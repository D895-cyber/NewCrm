# Vercel Deployment Guide for PWA

## Quick Fix for 401 Errors

The 401 Unauthorized errors you're seeing are likely due to Vercel's authentication settings.

### Steps to Fix:

1. **Go to your Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → General**
4. **Make sure "Public" is enabled** (not private)
5. **Go to Settings → Functions**
6. **Make sure "Serverless Functions" is enabled**

### Alternative: Redeploy with Public Settings

1. **Delete the current deployment**
2. **Redeploy with these settings:**
   - ✅ Public project
   - ✅ Allow public access
   - ✅ No authentication required

### Vercel Configuration

The `vercel.json` file is already configured correctly with:
- ✅ `"public": true` - Makes all files publicly accessible
- ✅ Proper MIME types for PWA files
- ✅ CORS headers for cross-origin access

### Test URLs After Fix:

- `https://your-vercel-url.vercel.app/manifest.json`
- `https://your-vercel-url.vercel.app/sw.js`
- `https://your-vercel-url.vercel.app/pwa.js`
- `https://your-vercel-url.vercel.app/christie.svg`

All should return 200 OK with correct content types.
