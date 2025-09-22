#!/bin/bash

# AWS Deployment Script for Projector Warranty CRM
# Make sure AWS CLI is configured with proper credentials

set -e

# Configuration
BUCKET_NAME="your-projector-crm-frontend"
DISTRIBUTION_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"
APP_RUNNER_SERVICE="your-projector-crm-backend"

echo "🚀 Starting AWS deployment for Projector Warranty CRM..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
echo "✅ Frontend build completed"

# Check if S3 bucket exists, create if not
echo "☁️ Checking S3 bucket..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "✅ S3 bucket exists"
else
    echo "📦 Creating S3 bucket..."
    aws s3 mb "s3://$BUCKET_NAME"
    echo "✅ S3 bucket created"
fi

# Upload frontend to S3
echo "☁️ Uploading frontend to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete
echo "✅ Frontend uploaded to S3"

# Set bucket policy for public read
echo "🔒 Setting S3 bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'
echo "✅ S3 bucket policy set"

# Enable static website hosting
echo "🌐 Enabling static website hosting..."
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html
echo "✅ Static website hosting enabled"

# Invalidate CloudFront cache (if distribution ID is provided)
if [ "$DISTRIBUTION_ID" != "YOUR_CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    echo "✅ CloudFront cache invalidated"
else
    echo "⚠️  CloudFront distribution ID not set. Please update the script with your distribution ID."
fi

# Deploy backend to App Runner (if service name is provided)
if [ "$APP_RUNNER_SERVICE" != "your-projector-crm-backend" ]; then
    echo "🚀 Deploying backend to App Runner..."
    # Note: App Runner deployment is typically done through AWS Console or GitHub integration
    echo "⚠️  Please deploy the backend through AWS App Runner console or GitHub integration"
else
    echo "⚠️  App Runner service name not set. Please update the script with your service name."
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a CloudFront distribution pointing to your S3 bucket"
echo "2. Set up App Runner service for the backend"
echo "3. Update CORS settings in backend to allow your CloudFront domain"
echo "4. Test your deployment"
echo ""
echo "🔗 Your S3 website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo "📖 Check aws-deployment-guide.md for detailed instructions"
