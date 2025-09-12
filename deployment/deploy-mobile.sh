#!/bin/bash

echo "🚀 Deploying FSE Portal for Mobile Testing..."

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

echo "📱 Building mobile-optimized version..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build with mobile optimizations
echo "🔨 Building with mobile optimizations..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Create mobile-specific build directory
    MOBILE_DIR="mobile-build"
    rm -rf $MOBILE_DIR
    mkdir -p $MOBILE_DIR
    
    # Copy built files
    echo "📁 Preparing mobile build..."
    cp -r dist/* $MOBILE_DIR/
    cp public/manifest.json $MOBILE_DIR/
    cp public/sw.js $MOBILE_DIR/
    
    # Create mobile-specific index.html
    cat > $MOBILE_DIR/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/christie.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>ProjectorCare FSE Portal</title>
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
    
    <!-- Preload critical resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
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
    <script type="module" src="/assets/index-*.js"></script>
    
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
        installButton.textContent = 'Install App';
        installButton.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50';
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
    
    echo "📱 Mobile build ready in: $MOBILE_DIR/"
    echo ""
    echo "🌐 To test locally:"
    echo "   cd $MOBILE_DIR"
    echo "   python3 -m http.server 8080"
    echo "   # or"ir
    echo "   npx serve -s . -l 8080"
    echo ""
    echo "📱 To test on mobile device:"
    echo "   1. Find your computer's IP address:"
    echo "      ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo "   2. On mobile device, navigate to:"
    echo "      http://YOUR_IP:8080"
    echo ""
    echo "🔧 For production deployment:"
    echo "   - Upload contents of $MOBILE_DIR/ to your web server"
    echo "   - Ensure HTTPS is enabled for PWA features"
    echo "   - Test camera permissions on actual mobile devices"
    
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
