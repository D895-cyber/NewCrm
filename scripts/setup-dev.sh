#!/bin/bash

# Development Setup Script for Projector Warranty CRM
set -e

echo "🚀 Setting up Projector Warranty CRM for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend environment file..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Projector Warranty CRM
VITE_APP_VERSION=1.0.0
EOF
    echo "✅ Frontend environment file created"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads/visits
mkdir -p backend/cloud-storage
mkdir -p logs

echo "✅ Development setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Update backend/.env with your MongoDB connection string"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Frontend will be available at http://localhost:5173"
echo "4. Backend API will be available at http://localhost:4000"
echo ""
echo "📚 Available commands:"
echo "  npm run dev          - Start both frontend and backend in development mode"
echo "  npm run dev:frontend - Start only frontend"
echo "  npm run dev:backend  - Start only backend"
echo "  npm run build        - Build both frontend and backend"
echo "  npm run start        - Start production server"
