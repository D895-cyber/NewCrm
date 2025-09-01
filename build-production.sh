#!/bin/bash

# Production Build Script for CRM System

echo "🏗️ Building for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Create production environment file
echo "⚙️ Creating production environment..."
cat > .env.production << EOF
NODE_ENV=production
PORT=4000
MONGODB_URI=${MONGODB_URI}
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
FRONTEND_URL=https://your-domain.com
EOF

echo "✅ Production build complete!"
echo "📁 Build files are in the dist/ directory"




