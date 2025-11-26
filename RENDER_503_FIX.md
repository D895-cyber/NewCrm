# Render 503 Error Fix Guide

## Problem
Your Render service is returning 503 (Service Unavailable) errors. This typically happens when:
1. The server doesn't start listening before Render's health checks timeout
2. MongoDB connection failures prevent the server from starting
3. Missing or incorrect environment variables

## Fix Applied

The server has been updated to:
1. **Start immediately** - Server now starts listening on the port BEFORE MongoDB connection completes
2. **Non-blocking MongoDB** - Database connection happens asynchronously and doesn't prevent server startup
3. **Auto-retry** - If MongoDB connection fails, it automatically retries after 10 seconds
4. **Better health checks** - Health endpoint always returns 200, even if database is disconnected

## Deployment Steps

### Option 1: Single Service Deployment (Recommended)

1. **Create Web Service** on Render:
   - **Root Directory**: Leave empty (root of repo)
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Health Check Path**: `/api/health`

2. **Required Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

3. **Optional Environment Variables**:
   ```
   FRONTEND_URL=https://your-service.onrender.com
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### Option 2: Separate Services (Using render.yaml)

The `render.yaml` file is configured for two separate services:

1. **Backend Service** - Handles API and serves frontend
2. **Frontend Service** - Static site (alternative if you don't want backend serving frontend)

To use `render.yaml`:
- Connect your GitHub repo to Render
- Render will auto-detect `render.yaml` and create both services
- Set environment variables in Render dashboard for each service

## Verification Steps

1. **Check Health Endpoint**:
   ```bash
   curl https://your-service.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "server": "running",
     "database": "connected",
     "timestamp": "...",
     "environment": "production"
   }
   ```

2. **Check Server Logs** in Render dashboard:
   - Look for "Server running on port 4000"
   - Check MongoDB connection status
   - Verify no `process.exit(1)` errors

3. **Test Root Endpoint**:
   ```bash
   curl https://your-service.onrender.com/
   ```
   Should serve the frontend or return server info

## Common Issues & Solutions

### Issue: Still getting 503 after deployment
**Solution**: 
- Check Render service logs for errors
- Verify `MONGODB_URI` environment variable is set correctly
- Ensure MongoDB Atlas allows connections from Render IPs (0.0.0.0/0)

### Issue: Health check fails
**Solution**:
- Health endpoint now always returns 200
- If health check still fails, check if server is listening on correct port
- Verify `PORT` environment variable matches Render's expected port

### Issue: MongoDB connection timeout
**Solution**:
- Server now starts even if MongoDB connection fails
- Connection will retry automatically
- Check MongoDB Atlas network access settings
- Verify MongoDB credentials in `MONGODB_URI`

### Issue: Service sleeping on free tier
**Solution**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep can take 30-60 seconds to wake up
- Consider upgrading to a paid plan for always-on service

## What Changed in the Code

### Before:
```javascript
// Server would exit if MongoDB connection failed
connectDB().then(() => {
  startServer();
}).catch((error) => {
  process.exit(1); // ❌ Server never starts
});
```

### After:
```javascript
// Server starts immediately, MongoDB connects in background
const startApp = async () => {
  await startServerWithFallback(); // ✅ Server starts first
  connectDB().then(() => {
    // Database connected
  }).catch((error) => {
    // ⚠️ Retry in production, don't exit
  });
};
```

## Next Steps

1. **Commit and push** the changes:
   ```bash
   git add backend/server/index.js
   git commit -m "Fix Render 503: Start server before MongoDB connection"
   git push
   ```

2. **Redeploy** on Render (auto-deploys if connected to GitHub)

3. **Monitor logs** in Render dashboard to verify successful startup

4. **Test** the health endpoint and root URL

## Support

If issues persist:
- Check Render service logs
- Verify all environment variables are set
- Test MongoDB connection from Render IP
- Review `backend/server/index.js` startup sequence in logs












