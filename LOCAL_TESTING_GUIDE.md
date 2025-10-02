# Local Frontend-Backend Testing Guide

## Overview
This guide helps you test your frontend build (dist) with the backend locally before deploying to AWS.

## ✅ What I Fixed

### 1. **Backend Configuration Updated**
- ✅ Fixed middleware order in `backend/server/index.js`
- ✅ Backend now serves frontend dist files in both development and production
- ✅ Proper SPA (Single Page Application) routing support
- ✅ API routes are protected and work correctly

### 2. **Static File Serving**
- ✅ Frontend dist files served from `frontend/dist/`
- ✅ All routes (except `/api/*`) serve the React app
- ✅ API routes remain functional at `/api/*`

## 🚀 Quick Start

### Option 1: Use the Automated Script
```bash
# Run the startup script (Windows)
start-local-test.bat

# This will:
# 1. Check if frontend is built (build if needed)
# 2. Start backend server
# 3. Serve frontend at http://localhost:4000
```

### Option 2: Manual Steps
```bash
# 1. Build frontend (if not already built)
cd frontend
npm run build
cd ..

# 2. Start backend server
cd backend/server
npm start

# 3. Access application at http://localhost:4000
```

## 🧪 Testing Your Setup

### Automated Testing
```bash
# Run the test script
node test-local-deployment.js
```

This will test:
- ✅ Frontend build exists
- ✅ Backend health check
- ✅ Frontend serving
- ✅ API routes working
- ✅ SPA routing

### Manual Testing Checklist

#### 1. **Basic Access**
- [ ] Open http://localhost:4000
- [ ] Should see your React application
- [ ] Check browser console for errors

#### 2. **API Endpoints**
- [ ] http://localhost:4000/api/health - Should return JSON health status
- [ ] http://localhost:4000/api/sites - Should return sites data (or 401 if auth required)
- [ ] http://localhost:4000/api/projectors - Should return projectors data
- [ ] http://localhost:4000/api/rma - Should return RMA data

#### 3. **Frontend Routing**
- [ ] http://localhost:4000/ - Main page
- [ ] http://localhost:4000/dashboard - Dashboard (should serve React app)
- [ ] http://localhost:4000/sites - Sites page (should serve React app)
- [ ] http://localhost:4000/rma - RMA page (should serve React app)

#### 4. **Missing Pages Test**
- [ ] Navigate to "Operations" → "RMA Tracking" - Should work
- [ ] Navigate to "Other" → "Report Templates" - Should work
- [ ] Access FSE Mobile Portal - Should have error reporting

## 🔧 Configuration Details

### Backend Changes Made
```javascript
// backend/server/index.js

// 1. Serve static files from frontend dist
app.use(express.static(FRONTEND_DIST_PATH));

// 2. SPA fallback for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next(); // Skip API routes
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(FRONTEND_DIST_PATH, 'index.html'));
});
```

### Frontend Build Configuration
- ✅ Vite config properly set up
- ✅ Build output in `frontend/dist/`
- ✅ Base path set to `/`
- ✅ Assets properly chunked

## 🐛 Troubleshooting

### Issue: "Cannot GET /"
**Solution**: Make sure backend is serving static files
```bash
# Check if dist folder exists
dir frontend\dist

# Rebuild if needed
cd frontend && npm run build
```

### Issue: API calls fail
**Solution**: Check API base URL configuration
- In production: Uses `window.location.origin`
- In development: Uses `http://localhost:4000`

### Issue: Pages show 404
**Solution**: Ensure SPA routing is working
- All non-API routes should serve `index.html`
- React Router handles client-side routing

### Issue: Missing features
**Solution**: All features are present, check navigation:
- **RMA Tracking**: Operations → RMA Tracking
- **Report Templates**: Other → Report Templates  
- **FSE Error Reporting**: FSE Mobile Portal → Error Report button

## 📱 Mobile Testing

### FSE Portal Testing
1. Open http://localhost:4000 on mobile or desktop
2. Login with FSE credentials
3. Should see mobile-optimized interface
4. Test error reporting functionality:
   - Click "Report Error" button
   - Select site → Select projector → Fill error details
   - Submit should work and create notifications

## 🌐 Production Readiness

Once local testing passes:
1. ✅ Frontend build is production-ready
2. ✅ Backend serves frontend correctly
3. ✅ All API endpoints work
4. ✅ SPA routing functions properly
5. ✅ All missing features are confirmed present

## 🚀 Deploy to AWS

After successful local testing:
1. Commit changes: `git add . && git commit -m "Fix local deployment"`
2. Push to repository: `git push origin main`
3. AWS App Runner will auto-deploy with the updated configuration

## 📊 Expected Test Results

When everything works correctly:
```
🧪 Testing Local Frontend-Backend Connection

✅ Frontend Build Exists
✅ Backend Health Check - Status: healthy, Database: connected
✅ Frontend Serving - React app loaded correctly
✅ API Routes Working - All endpoints accessible
✅ SPA Routing Test - All routes serve React app

📊 Test Results: Passed: 5/5, Success Rate: 100%

🎉 All tests passed! Your local deployment is working correctly.
🌐 Access your application at: http://localhost:4000
```

## 📋 Next Steps

1. **Run Local Tests**: Use the provided scripts to verify everything works
2. **Test All Features**: Verify RMA Tracking, Report Templates, FSE Error Reporting
3. **Deploy to AWS**: Once local testing passes, deploy to production
4. **Monitor Deployment**: Check AWS App Runner logs for any issues

Your application is now ready for local testing and AWS deployment!
