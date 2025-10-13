# AWS Deployment Guide for Projector Warranty CRM 

## 🚀 Quick AWS Deployment

### Prerequisites
- AWS CLI installed and configured
- Node.js 16+ installed
- Git repository access

## 📋 Deployment Architecture

### Frontend (React + Vite)
- **Service**: AWS S3 + CloudFront
- **Domain**: Custom domain or CloudFront URL
- **SSL**: Automatic via CloudFront

### Backend (Express.js + MongoDB)
- **Service**: AWS App Runner or EC2
- **Database**: MongoDB Atlas (already configured)
- **Domain**: Custom domain or App Runner URL

## 🛠️ Step-by-Step Deployment

### 1. Frontend Deployment (S3 + CloudFront)

#### Create S3 Bucket
```bash
# Create S3 bucket for frontend
aws s3 mb s3://your-projector-crm-frontend

# Enable static website hosting
aws s3 website s3://your-projector-crm-frontend --index-document index.html --error-document index.html
```

#### Upload Frontend Build
```bash
# Upload built frontend to S3
aws s3 sync frontend/dist/ s3://your-projector-crm-frontend --delete

# Set proper permissions
aws s3api put-bucket-policy --bucket your-projector-crm-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-projector-crm-frontend/*"
    }
  ]
}'
```

#### Create CloudFront Distribution
```bash
# Create CloudFront distribution (use AWS Console for this)
# Origin: S3 bucket (your-projector-crm-frontend)
# Default root object: index.html
# Error pages: 404 -> /index.html (for React routing)
```

### 2. Backend Deployment (App Runner)

#### Create App Runner Service
```bash
# Create apprunner.yaml configuration
# Deploy using AWS Console or CLI
```

#### Environment Variables
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-production-jwt-secret-here
FRONTEND_URL=https://your-cloudfront-url.cloudfront.net
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com
```


### 3. Domain Configuration

#### Custom Domain Setup
1. **Frontend**: Point your domain to CloudFront distribution
2. **Backend**: Point API subdomain to App Runner service
3. **SSL**: Automatic via CloudFront and App Runner

## 🔧 Configuration Files

### Frontend Environment (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Projector CRM
VITE_APP_VERSION=1.0.0
```

### Backend Environment
- Set in App Runner service configuration
- Or use AWS Systems Manager Parameter Store

## 📊 Monitoring & Logs

### CloudWatch Logs
- App Runner automatically sends logs to CloudWatch
- Monitor application performance and errors

### Health Checks
- Frontend: CloudFront distribution health
- Backend: App Runner service health
- Database: MongoDB Atlas monitoring

## 🔒 Security Considerations

### CORS Configuration
- Update backend CORS to allow your production domain
- Remove localhost origins in production

### Environment Variables
- Use AWS Secrets Manager for sensitive data
- Never commit production secrets to Git

### SSL/TLS
- CloudFront provides automatic SSL
- App Runner provides automatic SSL
- Use HTTPS everywhere

## 🚀 Deployment Commands

### Quick Deploy Script
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting AWS deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Upload to S3
echo "☁️ Uploading to S3..."
aws s3 sync frontend/dist/ s3://your-projector-crm-frontend --delete

# Invalidate CloudFront
echo "🔄 Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
echo "Frontend: https://your-cloudfront-url.cloudfront.net"
echo "Backend: https://your-app-runner-url.awsapprunner.com"
```

## 🔍 Troubleshooting

### Common Issues
1. **CORS Errors**: Update backend CORS configuration
2. **404 on Refresh**: Configure CloudFront error pages
3. **Environment Variables**: Check App Runner configuration
4. **Database Connection**: Verify MongoDB Atlas whitelist

### Logs
```bash
# View App Runner logs
aws logs describe-log-groups --log-group-name-prefix /aws/apprunner

# View specific log stream
aws logs get-log-events --log-group-name /aws/apprunner/your-service --log-stream-name your-stream
```

## 📈 Cost Optimization

### S3 + CloudFront
- S3: ~$0.023 per GB stored
- CloudFront: ~$0.085 per GB transferred
- Total: ~$5-20/month for typical usage

### App Runner
- ~$0.007 per vCPU hour
- ~$0.0008 per GB hour
- Total: ~$25-50/month for 24/7 service

### Total Estimated Cost: $30-70/month

## 🎯 Next Steps

1. **Set up monitoring**: CloudWatch alarms
2. **Configure backups**: MongoDB Atlas backups
3. **Set up CI/CD**: GitHub Actions with AWS
4. **Performance optimization**: CDN caching, compression
5. **Security hardening**: WAF, rate limiting

---

**Ready to deploy? Let's start with the S3 + CloudFront setup!**