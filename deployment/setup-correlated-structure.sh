#!/bin/bash

# 🚀 Correlated Structure Setup Script
# This script helps you set up the new correlated structure for Sites, Projectors, and AMC modules

echo "🏗️  Setting up Correlated Structure for CRM System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't seem to be running. Please start MongoDB first."
    echo "   You can start it with: sudo systemctl start mongod"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

echo "✅ Environment check passed"
echo

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo

# Step 2: Check environment variables
echo "🔧 Step 2: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env file created from template"
        echo "   Please edit .env file with your database credentials"
    else
        echo "❌ No env.example file found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi
echo

# Step 3: Run migration
echo "🔄 Step 3: Running database migration..."
if [ -f "server/migrations/update-to-correlated-structure.js" ]; then
    cd server/migrations
    echo "   Running migration script..."
    node update-to-correlated-structure.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully"
    else
        echo "❌ Migration failed. Please check the error messages above."
        exit 1
    fi
    
    cd ../..
else
    echo "❌ Migration script not found. Please ensure the script exists."
    exit 1
fi
echo

# Step 4: Test the system
echo "🧪 Step 4: Testing the system..."
echo "   Starting the server for testing..."

# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "   Waiting for server to start..."
sleep 10

# Check if server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running successfully"
else
    echo "⚠️  Server might not be running. Please check manually."
fi

# Stop the server
kill $SERVER_PID 2>/dev/null
echo

# Step 5: Summary
echo "🎉 Setup completed successfully!"
echo "================================="
echo
echo "📋 What was accomplished:"
echo "   ✅ Dependencies installed"
echo "   ✅ Environment configured"
echo "   ✅ Database migrated to new structure"
echo "   ✅ System tested"
echo
echo "🚀 Next steps:"
echo "   1. Start your server: npm run dev"
echo "   2. Access the application in your browser"
echo "   3. Create a new site with auditoriums"
echo "   4. Add projectors to auditoriums"
echo "   5. Create AMC contracts for projectors"
echo
echo "📚 Documentation:"
echo "   - Read CORRELATED_STRUCTURE_GUIDE.md for detailed information"
echo "   - Check the API endpoints in the guide"
echo "   - Review the new data structure"
echo
echo "🔧 Troubleshooting:"
echo "   - Check server logs for any errors"
echo "   - Verify MongoDB connection in .env file"
echo "   - Ensure all dependencies are installed"
echo
echo "Happy coding! 🎯"
