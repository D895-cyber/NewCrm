# AWS Deployment Configuration

## Environment Variables for Production

Create a `.env.production` file with these variables:

```bash
# Production Environment Variables
VITE_API_URL=https://your-aws-domain.com/api
VITE_APP_NAME=ProjectorCare
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

## Build Commands

### Development Build
```bash
npm run build
```

### Production Build with Environment Variables
```bash
VITE_API_URL=https://your-domain.com/api npm run build
```

## AWS Deployment Options

### Option 1: AWS S3 + CloudFront (Static Hosting)
1. Build the frontend: `npm run build`
2. Upload `dist/` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain

### Option 2: AWS Amplify
1. Connect your Git repository
2. Set build environment variables
3. Deploy automatically on push

### Option 3: AWS EC2 + Nginx
1. Build the frontend: `npm run build`
2. Upload `dist/` folder to EC2 instance
3. Configure Nginx to serve static files
4. Set up reverse proxy for API

## Build Script
```bash
#!/bin/bash
# build-for-aws.sh

echo "Building frontend for AWS deployment..."

# Set production environment variables
export VITE_API_URL=https://your-domain.com/api
export VITE_NODE_ENV=production

# Build the application
npm run build

echo "Build completed! Upload the 'dist' folder to your AWS service."
echo "Build output: ./dist/"
```
