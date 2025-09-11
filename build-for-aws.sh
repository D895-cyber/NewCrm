#!/bin/bash

# AWS Deployment Build Script
echo "🚀 Building ProjectorCare Frontend for AWS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if API URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  No API URL provided. Using default localhost.${NC}"
    echo -e "${BLUE}Usage: ./build-for-aws.sh https://your-domain.com/api${NC}"
    API_URL="http://localhost:4000/api"
else
    API_URL="$1"
    echo -e "${GREEN}✅ Using API URL: $API_URL${NC}"
fi

# Set environment variables
export VITE_API_URL="$API_URL"
export VITE_NODE_ENV="production"
export VITE_APP_NAME="ProjectorCare"
export VITE_APP_VERSION="1.0.0"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔨 Building production bundle...${NC}"
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${BLUE}📁 Build output: ./dist/${NC}"
    echo -e "${BLUE}📊 Build size:${NC}"
    du -sh dist/
    
    echo -e "${YELLOW}📋 Next steps for AWS deployment:${NC}"
    echo "1. Upload the 'dist' folder to your AWS service"
    echo "2. Configure your web server to serve static files"
    echo "3. Set up API proxy if needed"
    echo "4. Configure HTTPS/SSL certificate"
    
    echo -e "${GREEN}🎉 Ready for AWS deployment!${NC}"
else
    echo -e "${RED}❌ Build failed! Please check the errors above.${NC}"
    exit 1
fi
