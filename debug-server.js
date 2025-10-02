const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4001; // Use different port for testing
const FRONTEND_DIST_PATH = path.resolve(__dirname, 'frontend/dist');

console.log('🔍 Debug Server Starting...');
console.log('📁 Frontend dist path:', FRONTEND_DIST_PATH);
console.log('📄 Index.html exists:', fs.existsSync(path.join(FRONTEND_DIST_PATH, 'index.html')));

// Basic middleware
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// Serve static files from frontend dist
console.log('🗂️  Setting up static file serving...');
app.use(express.static(FRONTEND_DIST_PATH, {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false, // Don't auto-serve index.html
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    console.log('📤 Serving static file:', path);
  }
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  console.log(`🔄 SPA fallback for: ${req.path}`);
  
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    console.log('⏭️  Skipping API route');
    return next();
  }
  
  const indexPath = path.join(FRONTEND_DIST_PATH, 'index.html');
  console.log('📄 Serving index.html from:', indexPath);
  
  // Check if file exists before serving
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    return res.status(404).json({ error: 'Frontend not found' });
  }
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(500).json({ error: 'Error serving frontend' });
    } else {
      console.log('✅ Successfully served index.html');
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('❌ API route not found:', req.path);
  res.status(404).json({ error: 'API route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Debug server running on http://localhost:${PORT}`);
  console.log('📋 Test these URLs:');
  console.log(`   http://localhost:${PORT}/ - Should serve React app`);
  console.log(`   http://localhost:${PORT}/api/test - Should return JSON`);
  console.log(`   http://localhost:${PORT}/dashboard - Should serve React app`);
  console.log('\n🛑 Press Ctrl+C to stop the server\n');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down debug server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
