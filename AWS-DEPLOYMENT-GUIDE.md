# 🚀 AWS Deployment Guide for ProjectorCare Frontend

## 📋 Prerequisites
- AWS Account
- AWS CLI configured (optional)
- Git repository set up
- Domain name (optional, for custom domain)

## 🏗️ Build Process

### 1. Build for Production
```bash
# Option 1: Using the build script
./build-for-aws.sh https://your-domain.com/api

# Option 2: Using npm script
npm run build:aws

# Option 3: Manual build with environment variables
VITE_API_URL=https://your-domain.com/api npm run build
```

### 2. Build Output
- **Location**: `./dist/` folder
- **Size**: ~1.6MB (optimized)
- **Files**: Static HTML, CSS, JS, and assets

## 🌐 AWS Deployment Options

### Option 1: AWS S3 + CloudFront (Recommended)

#### Step 1: Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://projectorcare-frontend

# Enable static website hosting
aws s3 website s3://projectorcare-frontend --index-document index.html --error-document index.html
```

#### Step 2: Upload Build Files
```bash
# Upload dist folder to S3
aws s3 sync dist/ s3://projectorcare-frontend --delete

# Set proper permissions
aws s3api put-bucket-policy --bucket projectorcare-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::projectorcare-frontend/*"
    }
  ]
}'
```

#### Step 3: Create CloudFront Distribution
- Origin: S3 bucket
- Default root object: `index.html`
- Error pages: Redirect 404 to `index.html` (for SPA routing)

### Option 2: AWS Amplify (Easiest)

#### Step 1: Connect Repository
1. Go to AWS Amplify Console
2. Connect your Git repository
3. Select the frontend folder

#### Step 2: Build Settings
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - VITE_API_URL=https://your-domain.com/api npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### Step 3: Environment Variables
- `VITE_API_URL`: `https://your-domain.com/api`
- `VITE_NODE_ENV`: `production`

### Option 3: AWS EC2 + Nginx

#### Step 1: EC2 Setup
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create web directory
sudo mkdir -p /var/www/projectorcare
sudo chown -R $USER:$USER /var/www/projectorcare
```

#### Step 2: Upload Files
```bash
# Upload dist folder to EC2
scp -r dist/* user@your-ec2-ip:/var/www/projectorcare/
```

#### Step 3: Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/projectorcare;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if backend is on same server)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# .env.production
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=ProjectorCare
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

### Backend CORS Configuration
Update your backend server to allow your frontend domain:
```javascript
// server/index.js
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true
}));
```

## 📱 Mobile Access Configuration

The frontend is already configured to work with mobile devices. The API URL will automatically adjust based on the domain:

- **Development**: `http://localhost:4000/api`
- **Production**: `https://your-domain.com/api`
- **Mobile**: Automatically detects and uses the correct API URL

## 🚀 Deployment Commands

### Quick Deploy Script
```bash
#!/bin/bash
# deploy-to-aws.sh

echo "🚀 Deploying ProjectorCare to AWS..."

# Build for production
VITE_API_URL=https://your-domain.com/api npm run build

# Upload to S3 (replace with your bucket name)
aws s3 sync dist/ s3://projectorcare-frontend --delete

# Invalidate CloudFront cache (replace with your distribution ID)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
```

## 🔍 Testing Deployment

### 1. Test Frontend
- Visit your deployed URL
- Check if the app loads correctly
- Test login functionality

### 2. Test Mobile Access
- Access from mobile device
- Verify API calls work
- Test FSE workflow

### 3. Test API Connectivity
```bash
# Test API endpoint
curl https://your-domain.com/api/health
```

## 📊 Performance Optimization

### Build Optimizations Applied
- ✅ Code splitting (vendor, ui, charts, forms)
- ✅ Terser minification
- ✅ CSS code splitting
- ✅ Asset inlining for small files
- ✅ Gzip compression (via CloudFront/Nginx)

### Bundle Analysis
- **Total Size**: ~1.6MB
- **Vendor**: 140KB (React, React-DOM)
- **UI Components**: 70KB (Radix UI)
- **Charts**: 413KB (Recharts)
- **Main App**: 853KB

## 🛠️ Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check CORS configuration
   - Verify API URL in environment variables
   - Test API endpoint directly

2. **Routing Issues (404 on refresh)**
   - Configure server to serve `index.html` for all routes
   - Check CloudFront error pages configuration

3. **Mobile Access Issues**
   - Verify HTTPS is enabled
   - Check mobile browser compatibility
   - Test with different mobile browsers

### Debug Commands
```bash
# Check build output
ls -la dist/

# Test local production build
npm run preview

# Check environment variables
echo $VITE_API_URL
```

## 📝 Next Steps

1. **Set up CI/CD** with GitHub Actions or AWS CodePipeline
2. **Configure monitoring** with CloudWatch
3. **Set up SSL certificate** for HTTPS
4. **Configure custom domain** if needed
5. **Set up backup and disaster recovery**

## 🎉 Success!

Your ProjectorCare frontend is now ready for AWS deployment! The build is optimized, mobile-friendly, and production-ready.
