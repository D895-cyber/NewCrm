#!/bin/bash

echo "🚀 Setting up Projector Warranty Management System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! curl -s http://localhost:27017 &> /dev/null; then
    echo "⚠️  MongoDB doesn't seem to be running on localhost:27017"
    echo "   Please start MongoDB:"
    echo "   - macOS: brew services start mongodb-community"
    echo "   - Windows: net start MongoDB"
    echo "   - Linux: sudo systemctl start mongod"
    echo ""
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create .env file for backend if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "🔧 Creating backend environment file..."
    cat > server/.env << EOF
MONGODB_URI=mongodb://localhost:27017/projector_warranty
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Created server/.env file"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 To start the application:"
echo "   1. Start MongoDB (if not already running)"
echo "   2. Run: npm run dev (for frontend)"
echo "   3. Run: cd server && npm run dev (for backend)"
echo ""
echo "🌐 Access the application at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:4000"
echo ""
echo "📊 Health check: http://localhost:4000/api/health" 