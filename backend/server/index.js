const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Import routes
const projectorRoutes = require('./routes/projectors');
const serviceRoutes = require('./routes/services');
const rmaRoutes = require('./routes/rma');
const sparePartsRoutes = require('./routes/spareParts');
const siteRoutes = require('./routes/sites');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const fseRoutes = require('./routes/fse');
const serviceVisitRoutes = require('./routes/serviceVisits');
const serviceReportRoutes = require('./routes/serviceReports');
const recommendedSpareRoutes = require('./routes/recommendedSpares');
const dtrRoutes = require('./routes/dtr');
const amcContractRoutes = require('./routes/amcContracts');
const proformaInvoiceRoutes = require('./routes/proformaInvoices');
const serviceTicketRoutes = require('./routes/serviceTickets');
const analyticsRoutes = require('./routes/analytics');
const workflowRoutes = require('./routes/workflow');
const serviceAssignmentRoutes = require('./routes/serviceAssignments');
const projectorTrackingRoutes = require('./routes/projectorTracking');
const reportTemplateRoutes = require('./routes/reportTemplates');
const importRoutes = require('./routes/import');
const partCommentsRoutes = require('./routes/partComments');
const ascompReportRoutes = require('./routes/ascompReports');
const wordTemplateRoutes = require('./routes/wordTemplates');
const htmlToPdfRoutes = require('./routes/htmlToPdf');
const dashboardRoutes = require('./routes/dashboard');
const { router: authRoutes } = require('./routes/auth');
const { router: settingsRoutes } = require('./routes/settings');
const webhookRoutes = require('./routes/webhooks');
const schedulerService = require('./services/schedulerService');
const trackingUpdateService = require('./services/TrackingUpdateService');
const FRONTEND_DIST_PATH = path.resolve(__dirname, '../../frontend/dist');
const FRONTEND_PUBLIC_PATH = path.resolve(__dirname, '../../frontend/public');

// Verify frontend dist path on startup and copy missing PWA files
console.log('🔍 Checking frontend dist path...');
console.log('📁 FRONTEND_DIST_PATH:', FRONTEND_DIST_PATH);
console.log('📁 FRONTEND_PUBLIC_PATH:', FRONTEND_PUBLIC_PATH);
console.log('📄 index.html exists:', require('fs').existsSync(path.join(FRONTEND_DIST_PATH, 'index.html')));
console.log('📂 dist folder exists:', require('fs').existsSync(FRONTEND_DIST_PATH));

// Ensure PWA files exist in dist folder
const requiredPwaFiles = ['manifest.json', 'pwa.js', 'sw.js', 'christie.svg'];
requiredPwaFiles.forEach(file => {
  const distFile = path.join(FRONTEND_DIST_PATH, file);
  const publicFile = path.join(FRONTEND_PUBLIC_PATH, file);
  
  if (!require('fs').existsSync(distFile) && require('fs').existsSync(publicFile)) {
    try {
      require('fs').copyFileSync(publicFile, distFile);
      console.log(`✅ Copied ${file} from public to dist`);
    } catch (error) {
      console.warn(`⚠️ Failed to copy ${file}:`, error.message);
    }
  } else if (!require('fs').existsSync(distFile)) {
    console.warn(`⚠️ ${file} not found in dist or public folder`);
  }
});

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });
dotenv.config({ path: __dirname + '/../.env' });

// Set global Mongoose options
mongoose.set('bufferCommands', false);

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [];
    
    if (NODE_ENV === 'production') {
      // Production origins
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      
      // Allow Render.com domains
      if (origin.includes('onrender.com')) {
        allowedOrigins.push(origin);
      }
      
      // Allow Vercel domains
      if (origin.includes('vercel.app')) {
        allowedOrigins.push(origin);
      }
      
      // Allow Netlify domains
      if (origin.includes('netlify.app')) {
        allowedOrigins.push(origin);
      }
      
      // Allow custom domains if specified
      const customDomains = process.env.ALLOWED_ORIGINS?.split(',') || [];
      allowedOrigins.push(...customDomains);
      
    } else {
      // Development origins - be more permissive
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:8080'
      );
      
      // Allow any localhost port for development
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        allowedOrigins.push(origin);
      }
      
      // Allow local network IPs
      if (origin && origin.match(/^http:\/\/192\.168\.1\.\d+:\d+$/)) {
        allowedOrigins.push(origin);
      }
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed:', origin);
      console.log('🔍 Allowed origins:', allowedOrigins);
      console.log('🔍 NODE_ENV:', NODE_ENV);
      console.log('🔍 Origin type:', typeof origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security middleware with CSP configuration for Cloudinary
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const connectDB = async () => {
  try {
    // First try environment variable
    const mongoURI = process.env.MONGODB_URI;
    
    if (mongoURI) {
      console.log('Trying MongoDB connection with environment variable...');
      await mongoose.connect(mongoURI, {
        maxPoolSize: 50, // Increased for bulk operations
        serverSelectionTimeoutMS: 120000, // Increased to 120 seconds
        socketTimeoutMS: 120000, // Increased to 120 seconds
        connectTimeoutMS: 120000, // Increased to 120 seconds
        maxIdleTimeMS: 30000, // 30 seconds
        bufferCommands: false, // Disable mongoose buffering
      });
      console.log('MongoDB connected successfully using environment variable');
      return;
    }
    
    // Fallback to hardcoded connection strings
    const mongoURIs = [
      process.env.MONGODB_URI || 'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0',
      'mongodb+srv://dev:dev134@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0',
    ];
    
    let connected = false;
    
    for (let i = 0; i < mongoURIs.length; i++) {
      try {
        console.log(`Trying MongoDB connection ${i + 1}/${mongoURIs.length}...`);
        await mongoose.connect(mongoURIs[i], {
          maxPoolSize: 50, // Increased for bulk operations
          serverSelectionTimeoutMS: 120000, // Increased to 120 seconds
          socketTimeoutMS: 120000, // Increased to 120 seconds
          connectTimeoutMS: 120000, // Increased to 120 seconds
          maxIdleTimeMS: 30000, // 30 seconds
          bufferCommands: false, // Disable mongoose buffering
        });
        console.log('MongoDB Atlas connected successfully');
        connected = true;
        break;
      } catch (uriError) {
        console.log(`Connection attempt ${i + 1} failed:`, uriError.message);
        if (i < mongoURIs.length - 1) {
          await mongoose.disconnect();
        }
      }
    }
    
    if (!connected) {
      throw new Error('All MongoDB Atlas connection attempts failed');
    }
    
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    
    // Try fallback to local MongoDB
    console.log('Attempting to connect to local MongoDB...');
    try {
      await mongoose.connect('mongodb://localhost:27017/projector_warranty', {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Connected to local MongoDB successfully');
    } catch (localError) {
      console.error('Local MongoDB connection also failed:', localError.message);
      
      // Create a mock database for development
      console.log('Creating mock database for development...');
      await createMockDatabase();
    }
  }       
};

// Mock database for development when MongoDB is not available
const createMockDatabase = async () => {
  console.log('⚠️  Running in MOCK MODE - No database connection available');
  console.log('⚠️  Data will not persist between server restarts');
  
  // Set up mock data
  global.mockDatabase = {
    serviceAssignments: [],
    serviceVisits: [],
    fses: [],
    sites: [],
    projectors: []
  };
  
  console.log('Mock database initialized');
};

// Start server with port conflict handling
const startServer = async (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`📍 Health check: http://0.0.0.0:${port}/api/health`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🔗 Listening on all interfaces (0.0.0.0)`);
      
      // Initialize tracking service
      try {
        trackingUpdateService.start();
        console.log('✅ Tracking update service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize tracking service:', error);
        // Don't fail server startup if tracking fails
      }
      
      resolve(server);
    });

    server.on('error', (error) => {
      console.error(`❌ Server error on port ${port}:`, error.message);
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is already in use. Trying next available port...`);
        reject(error);
      } else {
        console.error(`❌ Fatal server error:`, error);
        reject(error);
      }
    });
  });
};

// Try to start server with fallback ports
const startServerWithFallback = async () => {
  // In production (like Render), only use the PORT env variable
  // Don't try fallback ports as Render assigns a specific port
  if (NODE_ENV === 'production' && process.env.PORT) {
    console.log(`🚀 Production mode: Starting server on Render-assigned port ${PORT}`);
    try {
      await startServer(PORT);
      return;
    } catch (error) {
      console.error('❌ Failed to start server on production port:', error);
      process.exit(1);
    }
  }
  
  // Development: Try multiple ports
  const ports = [PORT, 4001, 4002, 4003, 5000, 5001];
  
  for (const port of ports) {
    try {
      await startServer(port);
      return; // Success, exit the function
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} in use, trying next...`);
        continue; // Try next port
      } else {
        console.error('Server startup error:', error);
        process.exit(1);
      }
    }
  }
  
  console.error('Could not find an available port. Please check your system.');
  process.exit(1);
};

// Connect to MongoDB and start server
// For production (Render/cloud), start server even if DB connection is slow
const startApp = async () => {
  // Start server first so health checks can pass
  await startServerWithFallback();
  
  // Then try to connect to MongoDB (non-blocking)
  connectDB().then(() => {
    console.log('✅ MongoDB connected successfully');
    // Start scheduler service after database connection
    schedulerService.start();
  }).catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    // In production, don't exit - allow server to run and retry DB connection
    if (NODE_ENV === 'production') {
      console.log('⚠️  Server running without database connection. Will retry...');
      // Retry connection after 10 seconds
      setTimeout(() => {
        console.log('🔄 Retrying MongoDB connection...');
        connectDB().catch(err => {
          console.error('❌ MongoDB retry failed:', err.message);
        });
      }, 10000);
    } else {
      // In development, exit if DB connection fails
      console.error('❌ Exiting in development mode due to DB connection failure');
      process.exit(1);
    }
  });
};

// Start the application
startApp();

// Root endpoint - redirects to frontend or returns basic info
app.get('/', (req, res) => {
  try {
    // If frontend dist exists, let the SPA handler serve it
    // Otherwise return basic server info
    const indexPath = path.join(FRONTEND_DIST_PATH, 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(indexPath)) {
      console.log('📄 Serving frontend from:', indexPath);
      return res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Error serving frontend:', err);
          // Fallback to API info if frontend fails to serve
          res.json({
            message: 'Projector CRM Backend API',
            status: 'running',
            frontend: 'not available',
            health: '/api/health',
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    // No frontend, return API info
    console.log('📄 Serving API info (frontend not found)');
    res.json({
      message: 'Projector CRM Backend API',
      status: 'running',
      frontend: 'not built',
      health: '/api/health',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV
    });
  } catch (error) {
    console.error('❌ Error in root endpoint:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint - always returns 200 so Render health checks pass
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const status = dbStatus === 'connected' ? 'healthy' : 'degraded';
  
  res.status(200).json({ 
    status: status,
    server: 'running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projectors', projectorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/rma', rmaRoutes);
app.use('/api/spare-parts', sparePartsRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/fse', fseRoutes);
app.use('/api/service-visits', serviceVisitRoutes);
app.use('/api/service-reports', serviceReportRoutes);
app.use('/api/report-templates', reportTemplateRoutes);
app.use('/api/recommended-spares', recommendedSpareRoutes);
app.use('/api/dtr', dtrRoutes);
app.use('/api/proforma-invoices', proformaInvoiceRoutes);
app.use('/api/service-tickets', serviceTicketRoutes);
app.use('/api/amc-contracts', amcContractRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/service-assignments', serviceAssignmentRoutes);
app.use('/api/projector-tracking', projectorTrackingRoutes);
app.use('/api/import', importRoutes);
app.use('/api/part-comments', partCommentsRoutes);
app.use('/api/ascomp-reports', ascompReportRoutes);
app.use('/api/word-templates', wordTemplateRoutes);
app.use('/api/html-to-pdf', htmlToPdfRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve cloud storage files
app.use('/cloud-storage', express.static('cloud-storage'));

// Serve static files from frontend build when available
console.log('📁 Setting up static file serving from:', FRONTEND_DIST_PATH);

// Explicit routes for critical static files to ensure they're served correctly
// These MUST be before the static middleware to take precedence
const fs = require('fs');

app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(FRONTEND_DIST_PATH, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(manifestPath, (err) => {
      if (err) {
        console.error('❌ Error serving manifest.json:', err);
        res.status(500).json({ error: 'Failed to serve manifest' });
      }
    });
  } else {
    console.warn('⚠️ manifest.json not found in dist folder');
    res.status(404).json({ error: 'Manifest not found' });
  }
});

app.get('/christie.svg', (req, res) => {
  const svgPath = path.join(FRONTEND_DIST_PATH, 'christie.svg');
  
  if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(svgPath, (err) => {
      if (err) {
        console.error('❌ Error serving christie.svg:', err);
        res.status(500).json({ error: 'Failed to serve SVG' });
      }
    });
  } else {
    console.warn('⚠️ christie.svg not found in dist folder');
    res.status(404).json({ error: 'SVG not found' });
  }
});

app.get('/pwa.js', (req, res) => {
  const pwaPath = path.join(FRONTEND_DIST_PATH, 'pwa.js');
  
  if (fs.existsSync(pwaPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(pwaPath, (err) => {
      if (err) {
        console.error('❌ Error serving pwa.js:', err);
        res.status(500).json({ error: 'Failed to serve pwa.js' });
      }
    });
  } else {
    console.warn('⚠️ pwa.js not found in dist folder');
    res.status(404).json({ error: 'pwa.js not found' });
  }
});

app.get('/sw.js', (req, res) => {
  const swPath = path.join(FRONTEND_DIST_PATH, 'sw.js');
  
  if (fs.existsSync(swPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(swPath, (err) => {
      if (err) {
        console.error('❌ Error serving sw.js:', err);
        res.status(500).json({ error: 'Failed to serve sw.js' });
      }
    });
  } else {
    console.warn('⚠️ sw.js not found in dist folder');
    res.status(404).json({ error: 'sw.js not found' });
  }
});

// Explicitly set MIME types for critical static files
const expressStatic = express.static(FRONTEND_DIST_PATH, {
  dotfiles: 'ignore',
  etag: false,
  index: ['index.html'],
  maxAge: '1d',
  redirect: false,
  setHeaders: (res, path, stat) => {
    // Set correct MIME types for specific file types
    if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
});

app.use(expressStatic);

// Clear database endpoint - removes all sample data
app.post('/api/clear-all-data', async (req, res) => {
  try {
    const Site = require('./models/Site');
    const Projector = require('./models/Projector');
    const Service = require('./models/Service');
    const RMA = require('./models/RMA');
    const SparePart = require('./models/SparePart');
    const FSE = require('./models/FSE');
    const ServiceVisit = require('./models/ServiceVisit');
    const PurchaseOrder = require('./models/PurchaseOrder');

    // Clear all existing data
    await Promise.all([
      Site.deleteMany({}),
      Projector.deleteMany({}),
      Service.deleteMany({}),
      RMA.deleteMany({}),
      SparePart.deleteMany({}),
      FSE.deleteMany({}),
      ServiceVisit.deleteMany({}),
      PurchaseOrder.deleteMany({})
    ]);

    res.json({
      message: 'All sample data cleared successfully. Database is now empty and ready for user data only.',
      data: {
        sites: 0,
        projectors: 0,
        services: 0,
        rmaRecords: 0,
        spareParts: 0,
        fses: 0,
        serviceVisits: 0,
        purchaseOrders: 0
      }
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error', details: error.message });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Serve frontend for all non-API routes (SPA fallback) - MUST be last
app.get('*', (req, res, next) => {
  console.log(`🔄 Request for: ${req.path}`);
  
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    console.log('⏭️  Skipping API route');
    return next();
  }
  
  const indexPath = path.join(FRONTEND_DIST_PATH, 'index.html');
  console.log('📄 Serving SPA fallback - index.html from:', indexPath);
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(404).json({ error: 'Frontend not found' });
    } else {
      console.log('✅ Successfully served index.html for:', req.path);
    }
  });
});

module.exports = app;