# Render Deployment Guide

## Fixing "Node cannot be found" Warning

The "Node cannot be found" warning in the browser console is usually **harmless** and comes from browser extensions like React DevTools. It doesn't break functionality.

## Render Environment Setup

### 1. Frontend Service (Static Site) on Render

1. **Build Command:**
   ```
   cd frontend && npm install && npm run build
   ```

2. **Publish Directory:**
   ```
   frontend/dist
   ```

3. **Environment Variables (if needed):**
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```

### 2. Backend Service (Web Service) on Render

1. **Build Command:**
   ```
   cd backend && npm install
   ```

2. **Start Command:**
   ```
   npm start
   ```

3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

### 3. CORS Configuration

Make sure your backend allows requests from your frontend domain. Update `backend/server/server.js` or similar:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-frontend-service.onrender.com',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}));
```

## Testing the Deployment

1. **Check Backend Health:**
   Visit: `https://your-backend-service.onrender.com/api/health`

2. **Check Frontend:**
   Visit: `https://your-frontend-service.onrender.com`

3. **Browser Console:**
   - Open DevTools (F12)
   - Check Console tab
   - Look for the API URL being used
   - Check Network tab for failed API requests

## Common Issues

### API URL Not Configured
- **Symptom**: Frontend can't connect to backend
- **Fix**: Set `VITE_API_URL` environment variable in Render frontend service

### CORS Errors
- **Symptom**: Network requests blocked
- **Fix**: Update CORS settings in backend to include frontend domain

### Build Failures
- **Symptom**: Deployment fails during build
- **Fix**: Check build logs, ensure all dependencies are in `package.json`

## Quick Fix for Current Issue

If you're seeing the "Node cannot be found" warning:

1. **Ignore it** - It's usually harmless (from browser extensions)

2. **If you want to suppress it**, add this to your `frontend/index.html`:
   ```html
   <script>
     if (typeof window !== 'undefined') {
       window.Node = window.Node || {};
     }
   </script>
   ```

3. **Focus on actual errors** - Check the Network tab for failed API calls instead
