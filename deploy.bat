@echo off
REM AWS Deployment Script for Projector Warranty CRM (Windows)
REM Make sure AWS CLI is installed and configured

echo 🚀 Starting AWS deployment for Projector Warranty CRM...

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ AWS CLI is not installed. Please install it first.
    pause
    exit /b 1
)

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ AWS CLI is not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

echo ✅ AWS CLI is configured

REM Build frontend
echo 📦 Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend build completed

REM Upload frontend to S3
echo ☁️ Uploading frontend to S3...
aws s3 sync dist/ s3://your-projector-crm-frontend --delete
if %ERRORLEVEL% NEQ 0 (
    echo ❌ S3 upload failed
    pause
    exit /b 1
)
echo ✅ Frontend uploaded to S3

REM Set bucket policy for public read
echo 🔒 Setting S3 bucket policy...
aws s3api put-bucket-policy --bucket your-projector-crm-frontend --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::your-projector-crm-frontend/*\"}]}"
echo ✅ S3 bucket policy set

REM Enable static website hosting
echo 🌐 Enabling static website hosting...
aws s3 website s3://your-projector-crm-frontend --index-document index.html --error-document index.html
echo ✅ Static website hosting enabled

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next steps:
echo 1. Create a CloudFront distribution pointing to your S3 bucket
echo 2. Set up App Runner service for the backend
echo 3. Update CORS settings in backend to allow your CloudFront domain
echo 4. Test your deployment
echo.
echo 🔗 Your S3 website URL: http://your-projector-crm-frontend.s3-website-us-east-1.amazonaws.com
echo 📖 Check aws-deployment-guide.md for detailed instructions
echo.
pause
