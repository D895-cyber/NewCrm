# 🚀 Quick Deploy Guide

## ⚡ Fastest Way to Deploy

### 1. Frontend (Vercel) - 5 minutes

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project root
vercel

# Follow the prompts and deploy!
```

### 2. Backend (Railway) - 10 minutes

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Create new project from your repository
4. Select the `server` folder
5. Set environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

### 3. Database (MongoDB Atlas) - 5 minutes

1. Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. Create free account
3. Create new cluster
4. Get connection string
5. Add to Railway environment variables

## 🔧 Environment Setup

### Frontend (.env.local)
```env
VITE_API_URL=https://your-backend.railway.app
VITE_APP_NAME=Projector CRM
```

### Backend (Railway Dashboard)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=https://your-frontend.vercel.app
```

## 🎯 One-Command Deployment

Run the automated deployment script:

```bash
./deploy.sh
```

This will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Build frontend
- ✅ Test production build
- ✅ Guide you through deployment

## 📱 PWA Features

Your app includes Progressive Web App features:
- Installable on mobile devices
- Offline functionality
- Push notifications ready
- Mobile-optimized interface

## 🆘 Need Help?

- **Full Guide**: See `DEPLOYMENT.md`
- **Issues**: Check server logs in Railway dashboard
- **Frontend**: Check Vercel deployment logs
- **Database**: Verify MongoDB Atlas connection

---

**Ready to deploy? Run `./deploy.sh` and follow the prompts! 🚀**

