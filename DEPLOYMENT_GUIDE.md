# Deployment Guide

This guide covers different deployment options for the Projector Warranty CRM system.

## 🚀 Quick Deployment Options

### Option 1: Docker Compose (Recommended)

**Prerequisites:**
- Docker and Docker Compose installed
- 4GB+ RAM available

**Steps:**
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd projector-warranty-crm

# 2. Configure environment (optional)
cp .env.example .env.production
# Edit .env.production with your settings

# 3. Deploy
./scripts/deploy-production.sh

# 4. Access your application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

### Option 2: Manual Deployment

**Frontend (Static Hosting):**
```bash
# 1. Build frontend
cd frontend
npm install
npm run build

# 2. Deploy dist/ folder to:
# - Netlify: Drag & drop dist/ folder
# - Vercel: Connect GitHub repo
# - AWS S3: Upload dist/ contents
```

**Backend (Cloud Server):**
```bash
# 1. Setup server (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm mongodb

# 2. Deploy backend
cd backend
npm install --production
npm start

# 3. Configure reverse proxy (Nginx)
sudo nano /etc/nginx/sites-available/crm
# Add configuration for your domain
```

### Option 3: Cloud Platform Deployment

#### AWS App Runner
1. Connect your GitHub repository
2. Select backend folder as source
3. Configure environment variables
4. Deploy frontend to S3 + CloudFront

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Add backend service
3. Add frontend static site
4. Configure environment variables

#### Railway
1. Connect GitHub repository
2. Add MongoDB service
3. Deploy backend service
4. Deploy frontend service

## 🔧 Environment Configuration

### Required Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/projector_warranty
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Projector Warranty CRM
VITE_APP_VERSION=1.0.0
```

## 🐳 Docker Deployment Details

### Services Overview
- **Frontend**: React app with Nginx
- **Backend**: Express.js API server
- **MongoDB**: Database with initialization
- **Nginx**: Reverse proxy (optional)

### Customization
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - MONGODB_URI=mongodb://your-mongo-uri
      - JWT_SECRET=your-secret
    volumes:
      - ./your-uploads:/app/uploads
```

## 📊 Production Checklist

### Before Deployment
- [ ] Update environment variables
- [ ] Set strong JWT secret
- [ ] Configure MongoDB connection
- [ ] Set up SSL certificates
- [ ] Configure domain names
- [ ] Set up monitoring
- [ ] Backup strategy

### After Deployment
- [ ] Test all API endpoints
- [ ] Verify frontend loads correctly
- [ ] Check database connectivity
- [ ] Test file uploads
- [ ] Verify user authentication
- [ ] Monitor logs for errors
- [ ] Set up automated backups

## 🔍 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env

# Restart service
docker-compose restart backend
```

**Frontend not loading:**
```bash
# Check if backend is running
curl http://localhost:4000/api/health

# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
```

**Database connection issues:**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec backend node -e "console.log(process.env.MONGODB_URI)"
```

### Performance Optimization

**For High Traffic:**
- Use MongoDB Atlas (cloud database)
- Enable Redis for caching
- Use CDN for static assets
- Implement load balancing
- Monitor with APM tools

**For Development:**
- Use nodemon for auto-restart
- Enable hot reload for frontend
- Use MongoDB local instance
- Disable production optimizations

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Database Scaling
- Use MongoDB replica sets
- Implement read replicas
- Use connection pooling
- Monitor query performance

## 🔒 Security

### Production Security
- Use HTTPS everywhere
- Set secure JWT secrets
- Enable CORS properly
- Use environment variables
- Regular security updates
- Database access controls
- File upload restrictions

### Monitoring
- Set up log aggregation
- Monitor API response times
- Track error rates
- Set up alerts
- Regular health checks

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review this guide
6. Create an issue in the repository

---

**Happy Deploying! 🚀**
