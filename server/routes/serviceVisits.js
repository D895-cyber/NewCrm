const express = require('express');
const router = express.Router();
const ServiceVisit = require('../models/ServiceVisit');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken } = require('./auth');
require('dotenv').config();

// Cloudinary configuration
console.log('Loading Cloudinary config...');
console.log('Environment variables:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
});

// Cloudinary configuration from environment variables only
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary credentials not properly configured!');
  console.error('Please check your .env file for CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
}

// Automated folder structure with categories
const createAutomatedStorage = (serialNumber, visitId, category) => {
  console.log('createAutomatedStorage called with:');
  console.log('  serialNumber:', serialNumber);
  console.log('  visitId:', visitId);
  console.log('  category:', category);
  console.log('  category type:', typeof category);
  
  // Map category to folder name
  const categoryFolderMap = {
    'Before Service': 'before-service',
    'During Service': 'during-service', 
    'After Service': 'after-service',
    'Spare Parts': 'spare-parts',
    'RMA': 'rma',
    'Issue Found': 'issues',
    'Parts Used': 'parts-used',
    'Other': 'other'
  };

  console.log('Category folder map:', categoryFolderMap);
  const folderName = categoryFolderMap[category] || 'other';
  console.log('Selected folder name:', folderName);
  console.log('Full folder path:', `projectorcare/${serialNumber}/${visitId}/${folderName}`);
  
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `projectorcare/${serialNumber}/${visitId}/${folderName}`,
      public_id: (req, file) => {
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        return `${timestamp}_${uniqueId}`;
      },
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Resize large images
        { quality: 'auto:good' }, // Optimize quality
        { format: 'auto' } // Auto format based on browser support
      ]
    }
  });
};

// Legacy storage for backward compatibility
const createStorage = (serialNumber, visitId) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `projectorcare/${serialNumber}/${visitId}`,
      public_id: (req, file) => {
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        return `${timestamp}_${uniqueId}`;
      },
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Resize large images
        { quality: 'auto:good' }, // Optimize quality
        { format: 'auto' } // Auto format based on browser support
      ]
    }
  });
};

// Default upload configuration (for other routes that might need it)
const defaultUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'projectorcare/default',
      public_id: (req, file) => {
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        return `${timestamp}_${uniqueId}`;
      }
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  }
});

// Get all service visits
router.get('/', async (req, res) => {
  try {
    const visits = await ServiceVisit.find().sort({ scheduledDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Get Cloudinary storage statistics
router.get('/cloud-stats', async (req, res) => {
  try {
    const stats = {
      totalFolders: 0,
      totalFiles: 0,
      totalSize: 0,
      foldersBySerial: {},
      cloudinaryUsage: {}
    };

    // Get Cloudinary usage statistics
    try {
      const cloudinaryStats = await cloudinary.api.usage();
      stats.cloudinaryUsage = {
        plan: cloudinaryStats.plan,
        credits: cloudinaryStats.credits,
        objects: cloudinaryStats.objects,
        bandwidth: cloudinaryStats.bandwidth,
        storage: cloudinaryStats.storage,
        requests: cloudinaryStats.requests
      };
    } catch (cloudinaryError) {
      console.error('Error fetching Cloudinary stats:', cloudinaryError);
    }

    // Get folder statistics from database
    const visits = await ServiceVisit.find({});
    const serialFolders = {};
    
    visits.forEach(visit => {
      if (visit.projectorSerial && visit.photos && visit.photos.length > 0) {
        if (!serialFolders[visit.projectorSerial]) {
          serialFolders[visit.projectorSerial] = {
            visits: 0,
            files: 0,
            size: 0,
            categories: {}
          };
        }
        
        serialFolders[visit.projectorSerial].visits++;
        serialFolders[visit.projectorSerial].files += visit.photos.length;
        
        visit.photos.forEach(photo => {
          serialFolders[visit.projectorSerial].size += photo.fileSize || 0;
          
          // Count by category
          const category = photo.category || 'Other';
          if (!serialFolders[visit.projectorSerial].categories[category]) {
            serialFolders[visit.projectorSerial].categories[category] = 0;
          }
          serialFolders[visit.projectorSerial].categories[category]++;
        });
      }
    });

    stats.foldersBySerial = serialFolders;
    stats.totalFolders = Object.keys(serialFolders).length;
    stats.totalFiles = Object.values(serialFolders).reduce((sum, folder) => sum + folder.files, 0);
    stats.totalSize = Object.values(serialFolders).reduce((sum, folder) => sum + folder.size, 0);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visit by ID
router.get('/:id', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new service visit
router.post('/', async (req, res) => {
  try {
    const visit = new ServiceVisit(req.body);
    const newVisit = await visit.save();
    res.status(201).json(newVisit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service visit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await ServiceVisit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }
    res.json(visit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete service visit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const visit = await ServiceVisit.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }
    
    // Clean up Cloudinary resources for this visit
    if (visit.photos && visit.photos.length > 0) {
      try {
        const publicIds = visit.photos.map(photo => photo.publicId).filter(id => id);
        if (publicIds.length > 0) {
          await cloudinary.api.delete_resources(publicIds);
          console.log(`Deleted ${publicIds.length} photos from Cloudinary`);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    res.json({ message: 'Service visit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Automated photo upload with category-based folder structure
router.post('/:id/photos/automated', authenticateToken, async (req, res) => {
  try {
    // Validate required parameters
    if (!req.params.id) {
      return res.status(400).json({ message: 'Service visit ID is required' });
    }

    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    console.log('Received request body:', req.body);
    console.log('Received category:', req.body.category);
    console.log('Category type:', typeof req.body.category);
    
    const { category = 'Other' } = req.body;
    console.log('Extracted category:', category);

    // Validate category
    const validCategories = ['Before Service', 'During Service', 'After Service', 'Spare Parts', 'RMA', 'Issue Found', 'Parts Used', 'Other'];
    console.log('Valid categories:', validCategories);
    console.log('Category in valid categories:', validCategories.includes(category));
    
    if (!validCategories.includes(category)) {
      console.log('Invalid category received:', category);
      return res.status(400).json({ 
        message: 'Invalid category', 
        validCategories: validCategories 
      });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        message: 'Cloudinary configuration error. Please check environment variables.' 
      });
    }

    // Create storage with automated folder structure
    console.log('Creating storage for category:', category);
    console.log('Projector serial:', visit.projectorSerial);
    console.log('Visit ID:', visit.visitId);
    console.log('AUTOMATED ROUTE - About to create storage');
    const storage = createAutomatedStorage(visit.projectorSerial, visit.visitId, category);
    console.log('AUTOMATED ROUTE - Storage created, creating multer middleware');
    const uploadMiddleware = multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
        }
      }
    });
    console.log('AUTOMATED ROUTE - Multer middleware created, about to process request');

    // Use the upload middleware to handle both files and form fields
    console.log('AUTOMATED ROUTE - About to call multer.any()');
    uploadMiddleware.any()(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }
      
      console.log('AUTOMATED ROUTE - After multer processing - req.body:', req.body);
      console.log('AUTOMATED ROUTE - After multer processing - req.files:', req.files);

      const uploadedPhotos = [];
      const files = Array.isArray(req.files) ? req.files : [];
      
      if (files.length > 0) {
        console.log(`Processing ${files.length} files for visit ${visit.visitId} in automated folder: projectorcare/${visit.projectorSerial}/${visit.visitId}/${category}`);
        console.log('AUTOMATED ROUTE - Category being used:', category);
        console.log('AUTOMATED ROUTE - Files structure:', JSON.stringify(req.files, null, 2));
        
        for (const file of files) {
          const photoData = {
            filename: file.filename,
            originalName: file.originalname,
            cloudUrl: file.path, // Cloudinary URL
            publicId: file.filename, // Cloudinary public ID
            uploadedAt: new Date(),
            description: req.body.description || '',
            category: category,
            fileSize: file.size,
            mimeType: file.mimetype,
            cloudinaryData: {
              assetId: file.asset_id,
              versionId: file.version_id,
              signature: file.signature,
              format: file.format,
              width: file.width,
              height: file.height
            }
          };
          
          uploadedPhotos.push(photoData);
        }
        
        // Add photos to the visit
        visit.photos = visit.photos || [];
        visit.photos.push(...uploadedPhotos);
        await visit.save();
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to automated Cloudinary folder for visit ${visit.visitId}`);
      }

      res.json({
        message: 'Photos uploaded successfully to automated Cloudinary folder',
        photos: uploadedPhotos,
        totalPhotos: visit.photos.length,
        folderStructure: `projectorcare/${visit.projectorSerial}/${visit.visitId}/${category}`
      });
    });
  } catch (error) {
    console.error('Automated photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload photos for a service visit (legacy method)
router.post('/:id/photos', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    // Create storage with proper folder structure
    const storage = createStorage(visit.projectorSerial, visit.visitId);
    const uploadMiddleware = multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
        }
      }
    });

    // Use the upload middleware to handle both files and form fields
    uploadMiddleware.fields([
      { name: 'photos', maxCount: 10 },
      { name: 'photo', maxCount: 10 }
    ])(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }

      const uploadedPhotos = [];
      const files = [];
      
      // Extract files from both 'photos' and 'photo' fields
      if (req.files && req.files.photos) {
        files.push(...req.files.photos);
      }
      if (req.files && req.files.photo) {
        files.push(...req.files.photo);
      }
      
      if (files.length > 0) {
        console.log(`Processing ${files.length} files for visit ${visit.visitId} in folder: projectorcare/${visit.projectorSerial}/${visit.visitId}`);
        console.log('LEGACY ROUTE - Category from body:', req.body.category);
        
        for (const file of files) {
          const photoData = {
            filename: file.filename,
            originalName: file.originalname,
            cloudUrl: file.path, // Cloudinary URL
            publicId: file.filename, // Cloudinary public ID
            uploadedAt: new Date(),
            description: req.body.description || '',
            category: req.body.category || 'Other',
            fileSize: file.size,
            mimeType: file.mimetype,
            cloudinaryData: {
              assetId: file.asset_id,
              versionId: file.version_id,
              signature: file.signature,
              format: file.format,
              width: file.width,
              height: file.height
            }
          };
          
          uploadedPhotos.push(photoData);
        }
        
        // Add photos to the visit
        visit.photos = visit.photos || [];
        visit.photos.push(...uploadedPhotos);
        await visit.save();
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to Cloudinary for visit ${visit.visitId}`);
      }

      res.json({
        message: 'Photos uploaded successfully to Cloudinary',
        photos: uploadedPhotos,
        totalPhotos: visit.photos.length
      });
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get photos for a service visit
router.get('/:id/photos', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }
    res.json(visit.photos || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a specific photo
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    const photoIndex = visit.photos.findIndex(p => p.publicId === req.params.photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const photo = visit.photos[photoIndex];
    
    // Delete from Cloudinary
    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
        console.log(`Deleted photo from Cloudinary: ${photo.publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    // Remove photo from visit
    visit.photos.splice(photoIndex, 1);
    await visit.save();
    
    res.json({ message: 'Photo deleted successfully from Cloudinary' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visits by FSE
router.get('/fse/:fseId', async (req, res) => {
  try {
    const { fseId } = req.params;

    // Try to find the FSE document by its code to support legacy records
    const FSE = require('../models/FSE');
    let legacyMongoId = null;
    try {
      const fseDoc = await FSE.findOne({ fseId });
      if (fseDoc) {
        legacyMongoId = String(fseDoc._id);
      }
    } catch (_) {}

    const query = legacyMongoId
      ? { $or: [{ fseId }, { fseId: legacyMongoId }] }
      : { fseId };

    const visits = await ServiceVisit.find(query).sort({ scheduledDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visits by site
router.get('/site/:siteId', async (req, res) => {
  try {
    const visits = await ServiceVisit.find({ siteId: req.params.siteId }).sort({ scheduledDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visits by projector
router.get('/projector/:serialNumber', async (req, res) => {
  try {
    const visits = await ServiceVisit.find({ projectorSerial: req.params.serialNumber }).sort({ scheduledDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visits by status
router.get('/status/:status', async (req, res) => {
  try {
    const visits = await ServiceVisit.find({ status: req.params.status }).sort({ scheduledDate: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visits by date range
router.get('/date-range/:startDate/:endDate', async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    
    const visits = await ServiceVisit.find({
      scheduledDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ scheduledDate: -1 });
    
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service visit statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalVisits = await ServiceVisit.countDocuments();
    const completedVisits = await ServiceVisit.countDocuments({ status: 'Completed' });
    const scheduledVisits = await ServiceVisit.countDocuments({ status: 'Scheduled' });
    const inProgressVisits = await ServiceVisit.countDocuments({ status: 'In Progress' });
    const cancelledVisits = await ServiceVisit.countDocuments({ status: 'Cancelled' });

    res.json({
      totalVisits,
      completedVisits,
      scheduledVisits,
      inProgressVisits,
      cancelledVisits
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 