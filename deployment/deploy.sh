#!/bin/bash

# 🚀 CRM Deployment Script
# This script helps you deploy your CRM application

set -e

echo "🚀 Starting CRM Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detected"
}

# Install dependencies
install_deps() {
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Installing backend dependencies..."
    cd server
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    npm run build
    
    if [ -d "dist" ]; then
        print_success "Frontend built successfully in dist/ folder"
    else
        print_error "Frontend build failed"
        exit 1
    fi
}

# Test production build
test_build() {
    print_status "Testing production build..."
    npm run preview &
    PREVIEW_PID=$!
    
    sleep 5
    
    if curl -s http://localhost:4173 > /dev/null; then
        print_success "Production build test successful"
        kill $PREVIEW_PID 2>/dev/null || true
    else
        print_warning "Production build test failed or timed out"
        kill $PREVIEW_PID 2>/dev/null || true
    fi
}

# Check environment variables
check_env() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
        print_warning "No environment file found. Please create .env.local with:"
        echo "VITE_API_URL=https://your-backend-url.com"
        echo "VITE_APP_NAME=Projector CRM"
    else
        print_success "Environment file found"
    fi
    
    if [ ! -f "server/.env" ]; then
        print_warning "No backend environment file found. Please create server/.env with:"
        echo "NODE_ENV=production"
        echo "MONGODB_URI=your-mongodb-uri"
        echo "JWT_SECRET=your-secret-key"
        echo "FRONTEND_URL=https://your-frontend-url.com"
    else
        print_success "Backend environment file found"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    if command -v vercel &> /dev/null; then
        print_status "Deploying to Vercel..."
        vercel --prod
        print_success "Deployed to Vercel successfully"
    else
        print_warning "Vercel CLI not found. Install with: npm i -g vercel"
        print_status "You can also deploy manually at https://vercel.com"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    if command -v netlify &> /dev/null; then
        print_status "Deploying to Netlify..."
        netlify deploy --prod --dir=dist
        print_success "Deployed to Netlify successfully"
    else
        print_warning "Netlify CLI not found. Install with: npm i -g netlify-cli"
        print_status "You can also deploy manually at https://netlify.com"
    fi
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "🚀 Projector CRM Deployment Script"
    echo "=========================================="
    
    check_node
    install_deps
    build_frontend
    test_build
    check_env
    
    echo ""
    echo "=========================================="
    echo "🎯 Choose your deployment platform:"
    echo "1. Vercel (Recommended)"
    echo "2. Netlify"
    echo "3. Manual deployment"
    echo "=========================================="
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_netlify
            ;;
        3)
            print_status "Manual deployment instructions:"
            echo "1. Upload dist/ folder to your hosting provider"
            echo "2. Configure your backend server"
            echo "3. Set environment variables"
            echo "4. Update API URLs in your frontend"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment process completed!"
    print_status "Next steps:"
    echo "1. Configure your backend server (Railway, Heroku, etc.)"
    echo "2. Set up MongoDB Atlas database"
    echo "3. Configure environment variables"
    echo "4. Test your deployed application"
    echo ""
    echo "📚 See DEPLOYMENT.md for detailed instructions"
}

# Run main function
main "$@"
