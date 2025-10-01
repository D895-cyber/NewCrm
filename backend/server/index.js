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
const serviceAssignmentRoutes = require('./routes/serviceAssignments');
const projectorTrackingRoutes = require('./routes/projectorTracking');
const reportTemplateRoutes = require('./routes/reportTemplates');
const { router: authRoutes } = require('./routes/auth');
const { router: settingsRoutes } = require('./routes/settings');
const webhookRoutes = require('./routes/webhooks');
const schedulerService = require('./services/schedulerService');
const trackingUpdateService = require('./services/TrackingUpdateService');
const FRONTEND_DIST_PATH = path.resolve(__dirname, '../../frontend/dist');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });
dotenv.config({ path: __dirname + '/../.env' });

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] // Replace with your actual domain
    : [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        /^http:\/\/192\.168\.1\.\d+:3000$/, // Allow any 192.168.1.x:3000
        /^http:\/\/192\.168\.1\.\d+:5173$/, // Allow any 192.168.1.x:5173
        /^http:\/\/192\.168\.1\.\d+:5174$/, // Allow any 192.168.1.x:5174
        /^http:\/\/192\.168\.1\.\d+:8080$/  // Allow any 192.168.1.x:8080
      ], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security middleware
app.use(helmet());

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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
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
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 10000,
          connectTimeoutMS: 10000,
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

// Connect to MongoDB
connectDB().then(() => {
  // Start scheduler service after database connection
  schedulerService.start();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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
app.use('/api/service-assignments', serviceAssignmentRoutes);
app.use('/api/projector-tracking', projectorTrackingRoutes);
app.use('/api/webhooks', webhookRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve cloud storage files
app.use('/cloud-storage', express.static('cloud-storage'));

// Serve static files from frontend build when available
if (NODE_ENV === 'production') {
  app.use(express.static(FRONTEND_DIST_PATH));

  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_PATH, 'index.html'));
  });
}

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
// In non-production environments, serve the built frontend if it exists
if (NODE_ENV !== 'production') {
  app.use(express.static(FRONTEND_DIST_PATH));

  app.get('*', (req, res, next) => {
    res.sendFile(path.join(FRONTEND_DIST_PATH, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });
}

// Start server with port conflict handling
const startServer = async (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
      
      // Initialize tracking service
      try {
        trackingUpdateService.start();
        console.log('✅ Tracking update service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize tracking service:', error);
      }
      
      resolve(server);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Trying next available port...`);
        reject(error);
      } else {
        reject(error);
      }
    });
  });
};

// Try to start server with fallback ports
const startServerWithFallback = async () => {
  const ports = [PORT, 4001, 4002, 4003, 5000, 5001];
  
  for (const port of ports) {
    try {
      await startServer(port);
      return; // Success, exit the function
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
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

startServerWithFallback();

module.exports = app;