# Render 502 Bad Gateway Error Fix Guide

## Problem
Your Render deployment is returning **502 Bad Gateway** errors for:
- `/api/auth/profile`
- `/api/auth/login`
- `/manifest.json`
- `/christie.svg`
- `/pwa.js`
- Other static files

This indicates the backend server isn't starting properly or isn't responding to requests.

## Root Causes Fixed

### 1. Separate Services Configuration
**Problem**: The `render.yaml` was configured with two separate services (backend and frontend), but the frontend service was static-only and couldn't access backend APIs. This caused 502 errors.

**Fix**: Updated `render.yaml` to use a **single unified service** that:
- Builds the frontend first
- Installs backend dependencies
- Starts the backend which serves both API and frontend static files

### 2. Static File Serving Issues
**Problem**: Static files like `manifest.json`, `christie.svg`, and `pwa.js` might not be served with correct MIME types or might not be found.

**Fix**: 
- Added explicit routes for critical static files
- Ensured correct MIME types are set
- Added proper error handling and logging

### 3. Build Order
**Problem**: If the backend starts before the frontend is built, static files won't be available.

**Fix**: Build command now builds frontend FIRST, then installs backend dependencies.

## Changes Made

### 1. `render.yaml`
**Before:**
```yaml
services:
  - type: web
    name: projector-crm-backend
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    
  - type: web
    name: projector-crm-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
```

**After:**
```yaml
services:
  - type: web
    name: projector-crm
    env: node
    buildCommand: cd frontend && npm install && npm run build && cd ../backend && npm install
    startCommand: cd backend && npm start
    healthCheckPath: /api/health
```

### 2. `backend/server/index.js`
- Added explicit routes for `/manifest.json`, `/christie.svg`, `/pwa.js`, `/sw.js`
- Improved MIME type handling in static file serving
- Better error logging for missing static files

## Deployment Steps

### Step 1: Update Your Render Service

If you're using `render.yaml` (recommended):
1. Commit the changes:
   ```bash
   git add render.yaml backend/server/index.js
   git commit -m "Fix Render 502 errors: Unified service and improved static file serving"
   git push
   ```
2. Render will automatically redeploy if connected to GitHub

If configuring manually in Render dashboard:
1. **Delete the old frontend service** (if it exists as a separate static service)
2. **Update the backend service**:
   - **Root Directory**: Leave empty (root of repo)
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Health Check Path**: `/api/health`
   - **Environment**: Node.js

### Step 2: Set Environment Variables

Make sure these are set in your Render service:

**Required:**
```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
JWT_SECRET=your-super-secret-jwt-key-here
```

**Optional:**
```
FRONTEND_URL=https://your-service.onrender.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important**: Do NOT manually set `PORT` - let Render assign it automatically.

### Step 3: Verify Deployment

1. **Check Build Logs**:
   - Should see: `✓ built in X.XXs`
   - Should see: Frontend dist folder created
   - Should see: Backend dependencies installed

2. **Check Runtime Logs**:
   - Should see: `✅ Server running on port <PORT>`
   - Should see: `🔗 Listening on all interfaces (0.0.0.0)`
   - Should see: `📁 FRONTEND_DIST_PATH: /opt/render/project/src/frontend/dist`
   - Should see: `📄 index.html exists: true`

3. **Test Endpoints**:
   ```bash
   # Health check
   curl https://your-service.onrender.com/api/health
   
   # Manifest
   curl https://your-service.onrender.com/manifest.json
   
   # Root
   curl https://your-service.onrender.com/
   ```

## Verification Checklist

- [ ] Build completes successfully
- [ ] Server starts without errors
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Manifest.json is accessible: `/manifest.json`
- [ ] Root URL serves frontend or API info
- [ ] No 502 errors in browser console
- [ ] API endpoints respond correctly

## Troubleshooting

### Still Getting 502 Errors

1. **Check Render Service Logs**:
   - Look for "Server running on port"
   - Check for MongoDB connection errors
   - Verify no `process.exit(1)` calls

2. **Verify Frontend Build**:
   - Check if `frontend/dist` folder exists after build
   - Verify `manifest.json` is in `frontend/dist/`
   - Check that `christie.svg` is in `frontend/dist/`

3. **Check Environment Variables**:
   - Ensure `MONGODB_URI` is set correctly
   - Verify `NODE_ENV=production` is set
   - Make sure `PORT` is NOT manually set

4. **Test Health Endpoint**:
   ```bash
   curl https://your-service.onrender.com/api/health
   ```
   Should return JSON with `"status": "healthy"`

### Manifest.json Syntax Error

The "Manifest: Line: 1, column: 1, Syntax error" is usually a false error caused by:
- The server returning a 502 (HTML error page) instead of JSON
- Browser trying to parse the error as JSON

**Fix**: Once the 502 errors are resolved, this will disappear automatically.

### Service Sleeping (Free Tier)

On Render's free tier, services sleep after 15 minutes of inactivity. The first request can take 30-60 seconds to wake up the service. This is normal behavior.

## What Changed in Detail

### render.yaml
- **Single unified service** instead of two separate services
- **Correct build order**: Frontend builds first, then backend installs
- **Proper start command**: Backend serves both API and frontend

### backend/server/index.js
- **Explicit static file routes**: `/manifest.json`, `/christie.svg`, `/pwa.js`, `/sw.js`
- **MIME type handling**: Correct Content-Type headers for JSON, SVG, JS
- **Better error logging**: Warnings when static files are missing
- **Improved static middleware**: Enhanced with MIME type detection

## Expected Behavior After Fix

- ✅ Single service handles both API and frontend
- ✅ All static files served with correct MIME types
- ✅ No 502 errors
- ✅ Manifest.json loads correctly
- ✅ API endpoints respond normally
- ✅ Frontend loads from root URL

## Next Steps

1. **Commit and push** the changes
2. **Monitor** Render deployment logs
3. **Test** all endpoints after deployment
4. **Verify** no errors in browser console

## Support

If issues persist after these fixes:
1. Check Render service logs thoroughly
2. Verify all environment variables are set
3. Test with `curl` to isolate browser issues
4. Check MongoDB connection status
5. Review static file paths in logs












