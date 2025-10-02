# Render Deployment Guide

This guide will help you deploy your CRM application on Render with proper environment configuration.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Database**: Either MongoDB Atlas or a cloud MongoDB instance

## Deployment Steps

### 1. Deploy Backend Service

1. **Create Web Service** on Render:
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Environment Variables** for Backend:
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

3. **Advanced Settings**:
   - Auto-Deploy: Yes
   - Health Check Path: `/api/health`

### 2. Deploy Frontend Service

1. **Create Static Site** on Render:
   - Connect your GitHub repository
   - Select the `frontend` folder as the root directory
   - Set build command: `npm install && npm run build`
   - Set publish directory: `dist`

2. **Environment Variables** for Frontend:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com/api
   VITE_APP_NAME=Projector CRM
   ```

### 3. Configure MongoDB (if using Atlas)

1. **Create MongoDB Atlas Cluster**:
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Create a database user
   - Whitelist IP addresses (0.0.0.0/0 for Render)

2. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/projector_warranty
   ```

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.onrender.com` |
| `ALLOWED_ORIGINS` | Additional allowed origins | `https://custom-domain.com` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.onrender.com/api` |
| `VITE_APP_NAME` | Application name | `Projector CRM` |

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` in backend matches your frontend URL
- Check that both services are deployed and running
- Verify environment variables are set correctly

### Connection Issues
- Check backend logs for MongoDB connection errors
- Verify `VITE_API_URL` points to correct backend service
- Ensure backend service is healthy at `/api/health`

### Build Issues
- Check build logs for missing dependencies
- Verify Node.js version compatibility
- Ensure all required files are committed to repository

## Health Checks

### Backend Health Check
```bash
curl https://your-backend-service.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Frontend Health Check
Visit your frontend URL and check browser console for:
- API URL configuration
- Successful backend connection
- No CORS errors

## Deployment Checklist

- [ ] Backend service deployed and running
- [ ] Frontend static site deployed
- [ ] MongoDB database accessible
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Health checks passing
- [ ] Authentication working
- [ ] API endpoints responding

## Support

If you encounter issues:

1. Check Render service logs
2. Verify environment variables
3. Test API endpoints manually
4. Check MongoDB connection
5. Review CORS configuration

## Security Notes

- Never commit sensitive environment variables to repository
- Use strong JWT secrets in production
- Regularly rotate database passwords
- Monitor service logs for security issues
