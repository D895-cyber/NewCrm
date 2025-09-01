# 🚀 CRM Deployment Guide

This guide will help you deploy your Projector CRM application to production.

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git repository set up
- Cloudinary account (for file uploads)

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - **Recommended**

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   cd /path/to/your/crm
   vercel
   ```

3. **Configure Environment Variables in Vercel Dashboard:**
   - `VITE_API_URL`: Your backend URL
   - `VITE_APP_NAME`: Projector CRM

4. **Automatic Deployments:**
   - Connect your GitHub repository
   - Vercel will auto-deploy on every push

#### Backend Deployment (Railway)

1. **Go to [Railway.app](https://railway.app)**
2. **Create new project from GitHub**
3. **Select your repository and server folder**
4. **Set Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

### Option 2: Netlify (Frontend) + Heroku (Backend)

#### Frontend Deployment (Netlify)

1. **Go to [Netlify.com](https://netlify.com)**
2. **Drag & drop your `dist` folder** or connect GitHub
3. **Set build command:** `npm run build`
4. **Set publish directory:** `dist`

#### Backend Deployment (Heroku)

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-crm-app
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-secret
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🗄️ Database Setup

### MongoDB Atlas

1. **Create MongoDB Atlas account**
2. **Create new cluster**
3. **Get connection string**
4. **Set `MONGODB_URI` environment variable**

### Local MongoDB (Development)

```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
sudo systemctl start mongod     # Linux

# Connection string
MONGODB_URI=mongodb://localhost:27017/projector_warranty
```

## 🔧 Environment Configuration

### Frontend (.env.local)

```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_NAME=Projector CRM
```

### Backend (.env)

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-frontend-url.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🚀 Deployment Commands

### Build Frontend

```bash
npm run build
```

### Test Production Build

```bash
npm run preview
```

### Deploy Backend

```bash
cd server
npm start
```

## 📱 PWA Deployment

Your app includes PWA features. After deployment:

1. **Update `manifest.json`** with your domain
2. **Test PWA installation** on mobile devices
3. **Verify offline functionality**

## 🔍 Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Backend API endpoints respond
- [ ] Database connection established
- [ ] File uploads work (if using Cloudinary)
- [ ] Authentication flows work
- [ ] PWA features function on mobile
- [ ] SSL certificates are valid
- [ ] Environment variables are set correctly

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check `FRONTEND_URL` in backend environment
   - Verify CORS configuration in `server/index.js`

2. **Database Connection:**
   - Verify MongoDB URI format
   - Check network access in MongoDB Atlas

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names match exactly

### Support

- Check server logs in your deployment platform
- Verify environment variables are correctly set
- Test API endpoints individually

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📊 Monitoring

- **Health Check:** `/api/health` endpoint
- **Logs:** Check your deployment platform logs
- **Performance:** Use browser dev tools and network tab
- **Errors:** Monitor for 500 errors and failed requests

---

**Happy Deploying! 🎉**

For additional help, check the platform-specific documentation or create an issue in your repository.

