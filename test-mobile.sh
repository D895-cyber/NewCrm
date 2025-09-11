#!/bin/bash

echo "🧪 FSE Mobile Portal Testing Script"
echo "=================================="

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm found: $(npm --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_success "All prerequisites met!"

# Step 1: Install dependencies
print_status "Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed, skipping..."
fi

# Step 2: Build the project
print_status "Building project for mobile deployment..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 3: Create mobile build directory
print_status "Creating mobile build directory..."
MOBILE_DIR="mobile-test-build"
rm -rf $MOBILE_DIR
mkdir -p $MOBILE_DIR

# Copy built files
cp -r dist/* $MOBILE_DIR/
cp public/manifest.json $MOBILE_DIR/ 2>/dev/null || print_warning "manifest.json not found"
cp public/sw.js $MOBILE_DIR/ 2>/dev/null || print_warning "sw.js not found"

# Step 4: Create mobile-optimized index.html
print_status "Creating mobile-optimized index.html..."
cat > $MOBILE_DIR/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/christie.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>ProjectorCare FSE Portal - Mobile Test</title>
    <meta name="description" content="Mobile portal for Field Service Engineers to manage service reports and photo uploads" />
    
    <!-- PWA Support -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="FSE Portal" />
    <link rel="apple-touch-icon" href="/christie.svg" />
    
    <!-- Mobile Optimizations -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-TileColor" content="#2563eb" />
    
    <!-- Prevent zoom on input focus for mobile -->
    <style>
      input[type="text"], input[type="email"], input[type="password"], textarea, select {
        font-size: 16px !important;
      }
      /* Prevent horizontal scroll on mobile */
      body { overflow-x: hidden; }
      /* Optimize touch targets */
      button, [role="button"] { min-height: 44px; min-width: 44px; }
      /* Mobile-specific optimizations */
      .mobile-optimized { touch-action: manipulation; }
      /* Hide scrollbars on mobile */
      ::-webkit-scrollbar { display: none; }
      * { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    
    <!-- Find and load the main JS file -->
    <script>
      // Find the main JS file dynamically
      const scriptFiles = document.querySelectorAll('script[src*="index-"]');
      if (scriptFiles.length > 0) {
        const mainScript = scriptFiles[0].src;
        const script = document.createElement('script');
        script.type = 'module';
        script.src = mainScript;
        document.body.appendChild(script);
      }
    </script>
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
      
      // Add to home screen prompt
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('App can be installed');
        
        // Show install button
        const installButton = document.createElement('button');
        installButton.textContent = '📱 Install App';
        installButton.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        installButton.onclick = () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installButton.remove();
          });
        };
        document.body.appendChild(installButton);
      });
      
      // Handle app installed
      window.addEventListener('appinstalled', () => {
        console.log('App was installed');
      });
    </script>
  </body>
</html>
EOF

print_success "Mobile build directory created: $MOBILE_DIR"

# Step 5: Start local server
print_status "Starting local server for testing..."
cd $MOBILE_DIR

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    print_status "Starting server with Python 3..."
    print_success "Server starting on http://localhost:8080"
    print_status "Press Ctrl+C to stop the server"
    print_status ""
    print_status "📱 Mobile Testing Instructions:"
    print_status "1. Find your computer's IP address:"
    print_status "   ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    print_status ""
    print_status "2. On mobile device, navigate to:"
    print_status "   http://YOUR_IP:8080"
    print_status ""
    print_status "3. Test these features:"
    print_status "   - Camera access and photo capture"
    print_status "   - Photo upload functionality"
    print_status "   - PWA installation"
    print_status "   - Touch gestures and responsiveness"
    print_status ""
    print_status "4. Access mobile components:"
    print_status "   - #mobile-test - Mobile testing hub"
    print_status "   - #photo-test - Photo capture test"
    print_status "   - #mobile-fse - FSE mobile portal"
    print_status ""
    
    python3 -m http.server 8080 --bind 0.0.0.0
    
elif command -v python &> /dev/null; then
    print_status "Starting server with Python..."
    print_success "Server starting on http://localhost:8080"
    python -m http.server 8080 --bind 0.0.0.0
    
elif command -v npx &> /dev/null; then
    print_status "Starting server with npx serve..."
    print_success "Server starting on http://localhost:8080"
    npx serve -s . -l 8080
    
else
    print_error "No suitable server found. Please install Python 3 or Node.js serve package."
    print_status "You can manually start a server in the $MOBILE_DIR directory."
    exit 1
fi
