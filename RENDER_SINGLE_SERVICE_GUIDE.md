# Render Single Service Deployment Guide

Deploy both frontend and backend as **one unified service** on Render.

## 🎯 **How It Works**

1. **Build Process**: Frontend is built during deployment and placed in `frontend/dist`
2. **Static Serving**: Backend serves the frontend static files from `/frontend/dist`
3. **API Routes**: Backend handles all `/api/*` requests
4. **SPA Routing**: All other routes serve `index.html` for React Router

## 🚀 **Deployment Steps**

### 1. Create Web Service on Render

1. **Connect Repository**: Link your GitHub repo
2. **Root Directory**: Leave empty (use root of repo)
3. **Build Command**: `npm run build:production`
4. **Start Command**: `npm run start:backend`

### 2. Environment Variables

Set these in your Render service:

```bash
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Override API URL (usually not needed for single service)
# VITE_API_URL=https://your-service.onrender.com/api
```

### 3. Advanced Settings

- **Auto-Deploy**: Yes
- **Health Check Path**: `/api/health`
- **Build Command**: `npm run build:production`
- **Start Command**: `npm run start:backend`

## 📁 **File Structure After Build**

```
├── backend/
│   ├── server/
│   └── node_modules/
├── frontend/
│   ├── dist/          # Built frontend files
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   └── src/
└── package.json       # Root package.json with build scripts
```

## 🔧 **How Requests Are Handled**

| Request | Handler | Response |
|---------|---------|----------|
| `/` | Backend → `frontend/dist/index.html` | React App |
| `/sites` | Backend → `frontend/dist/index.html` | React App (SPA routing) |
| `/api/health` | Backend API | JSON response |
| `/api/sites` | Backend API | JSON response |
| `/assets/*` | Backend → `frontend/dist/assets/*` | Static files |

## ✅ **Advantages of Single Service**

- **Simpler Deployment**: Only one service to manage
- **No CORS Issues**: Frontend and API on same domain
- **Cost Effective**: Only one Render service needed
- **Easier Environment Management**: Single set of environment variables

## 🛠️ **Build Process Details**

The `npm run build:production` command:

1. **Installs Dependencies**: 
   - Root dependencies
   - Frontend dependencies  
   - Backend dependencies

2. **Builds Frontend**:
   - Runs `vite build` in frontend directory
   - Creates optimized static files in `frontend/dist`

3. **Backend Serves Everything**:
   - API routes at `/api/*`
   - Static files from `frontend/dist`
   - SPA fallback for React Router

## 🐛 **Troubleshooting**

### Build Fails
- Check that all dependencies are in package.json files
- Verify Node.js version compatibility
- Ensure frontend builds successfully locally

### Frontend Not Loading
- Check that `frontend/dist` exists after build
- Verify backend static file serving configuration
- Check browser network tab for 404 errors

### API Not Working
- Verify backend starts successfully
- Check `/api/health` endpoint
- Review backend logs for errors

## 📋 **Deployment Checklist**

- [ ] Repository connected to Render
- [ ] Build command: `npm run build:production`
- [ ] Start command: `npm run start:backend`
- [ ] Environment variables set
- [ ] MongoDB connection string configured
- [ ] Health check path: `/api/health`
- [ ] Service deploys successfully
- [ ] Frontend loads at root URL
- [ ] API endpoints respond correctly

## 🔄 **Local Testing**

Test the production build locally:

```bash
# Build everything
npm run build:production

# Start backend (serves frontend too)
npm run start:backend

# Visit http://localhost:4000
```

This simulates exactly how it will work on Render!
