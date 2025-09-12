#!/bin/bash

echo "🚀 Photo-First Workflow Test Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running."
    echo "   Please start MongoDB first:"
    echo "   - On macOS: brew services start mongodb-community"
    echo "   - On Linux: sudo systemctl start mongod"
    echo "   - On Windows: net start MongoDB"
    echo ""
    read -p "Press Enter to continue anyway (test will fail if MongoDB is not running)..."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create test visit
echo "🔧 Creating test service visit..."
node create-test-visit.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test setup completed successfully!"
    echo ""
    echo "📱 To test on your phone:"
    echo "1. Start your server: npm start"
    echo "2. Find your computer's IP address:"
    echo "   - macOS: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo "   - Linux: ip addr show | grep 'inet ' | grep -v 127.0.0.1"
    echo "   - Windows: ipconfig | findstr IPv4"
    echo ""
    echo "3. Open this URL on your phone:"
    echo "   http://YOUR_IP_ADDRESS:3001/mobile-test-build/photo-workflow-test.html"
    echo ""
    echo "🧪 Test Features:"
    echo "   - Photo capture with categories"
    echo "   - Step-by-step workflow"
    echo "   - Digital signature capture"
    echo "   - API connection testing"
    echo "   - Debug information"
    echo ""
    echo "🔍 Debug Tips:"
    echo "   - Check the debug info section for detailed logs"
    echo "   - Use 'Test API Connection' button to verify server connection"
    echo "   - Use 'Reset Test' to start over"
    echo ""
else
    echo "❌ Test setup failed. Please check the error messages above."
    exit 1
fi

