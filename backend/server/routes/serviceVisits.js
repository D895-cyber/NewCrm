const express = require('express');
const router = express.Router();
const ServiceVisit = require('../models/ServiceVisit');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken } = require('./auth');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');
const {
  validateUnableToComplete,
  validateBulkUnableToComplete,
  validateBulkReschedule,
  validateExport,
  validateWeeklyReport,
  validateAuditLogs,
  validateServiceVisitId,
  validateDateRangeLogic,
  sanitizeInput
} = require('../middleware/validation');
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
    'Service Photos': 'service-photos',
    'BEFORE': 'before-service',
    'DURING': 'during-service',
    'AFTER': 'after-service',
    'ISSUE': 'issues',
    'PARTS': 'parts-used',
    'Other': 'other'
  };

  console.log('Category folder map:', categoryFolderMap);
  const folderName = categoryFolderMap[category] || 'Not Found';
  if (folderName === 'Not Found') {
    console.log('Category not found:', category);
  }
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
    // Clean up the request body before updating
    const updateData = { ...req.body };
    
    // Ensure recommendations is properly formatted
    if (updateData.recommendations === "" || updateData.recommendations === null || updateData.recommendations === undefined) {
      updateData.recommendations = [];
    } else if (!Array.isArray(updateData.recommendations)) {
      updateData.recommendations = [];
    }
    
    // Ensure issuesFound is properly formatted
    if (updateData.issuesFound === "" || updateData.issuesFound === null || updateData.issuesFound === undefined) {
      updateData.issuesFound = [];
    } else if (!Array.isArray(updateData.issuesFound)) {
      updateData.issuesFound = [];
    }
    
    console.log('PUT route - Cleaned updateData.recommendations:', updateData.recommendations);
    console.log('PUT route - Cleaned updateData.issuesFound:', updateData.issuesFound);
    
    const visit = await ServiceVisit.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }
    res.json(visit);
  } catch (error) {
    console.error('PUT route error:', error);
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
router.post('/:id/photos/automated', async (req, res) => {
  try {
    // Validate required parameters
    if (!req.params.id) {
      return res.status(400).json({ message: 'Service visit ID is required' });
    }

    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        message: 'Cloudinary configuration error. Please check environment variables.' 
      });
    }

    // Use a simpler approach - upload to temp first, then move to correct category folder
    const uploadMiddleware = multer({
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: `projectorcare/${visit.projectorSerial}/${visit.visitId}/temp`, // Temporary folder
          public_id: (req, file) => {
            const timestamp = Date.now();
            const uniqueId = Math.random().toString(36).substring(2, 8);
            return `${timestamp}_${uniqueId}`;
          },
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ]
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

    // Process the upload
    uploadMiddleware.any()(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }
      
      console.log('AUTOMATED ROUTE - After multer processing - req.body:', req.body);
      console.log('AUTOMATED ROUTE - After multer processing - req.files:', req.files);

      // Extract category from form data
      const category = req.body.category || 'Other';
      console.log('AUTOMATED ROUTE - Category from form data:', category);
      
      // Validate category
      const validCategories = [
        'Before Service', 'During Service', 'After Service', 'Spare Parts', 'RMA', 'Issue Found', 'Parts Used', 'Service Photos', 'Other',
        'BEFORE', 'DURING', 'AFTER', 'ISSUE', 'PARTS'  // Frontend categories
      ];
      
      if (!validCategories.includes(category)) {
        console.log('Invalid category received:', category);
        return res.status(400).json({ 
          message: 'Invalid category', 
          validCategories: validCategories 
        });
      }

      const uploadedPhotos = [];
      const files = Array.isArray(req.files) ? req.files : [];
      
      if (files.length > 0) {
        console.log(`Processing ${files.length} files for visit ${visit.visitId} in category: ${category}`);
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
        
        // Move files from temp folder to correct category folder
        const categoryFolderMap = {
          'Before Service': 'before-service',
          'During Service': 'during-service', 
          'After Service': 'after-service',
          'Spare Parts': 'spare-parts',
          'RMA': 'rma',
          'Issue Found': 'issues',
          'Parts Used': 'parts-used',
          'Service Photos': 'service-photos',
          'BEFORE': 'before-service',
          'DURING': 'during-service',
          'AFTER': 'after-service',
          'ISSUE': 'issues',
          'PARTS': 'parts-used',
          'Other': 'other'
        };
        
        const folderName = categoryFolderMap[category] || 'other';
        const finalFolderPath = `projectorcare/${visit.projectorSerial}/${visit.visitId}/${folderName}`;
        
        // Move each uploaded photo to the correct folder
        for (const photo of uploadedPhotos) {
          try {
            // Use the publicId from the file object
            const currentPublicId = photo.publicId;
            console.log(`Current public_id: ${currentPublicId}`);
            
            // Create the new public_id with the correct folder structure
            const newPublicId = `${finalFolderPath}/${currentPublicId.split('/').pop()}`;
            console.log(`New public_id: ${newPublicId}`);
            
            // Move the file to the correct folder
            await cloudinary.uploader.rename(currentPublicId, newPublicId);
            
            // Update the photo data with new paths
            photo.cloudUrl = photo.cloudUrl.replace('/temp/', `/${folderName}/`);
            photo.publicId = newPublicId;
            
            console.log(`✅ Moved photo from temp to ${folderName} folder: ${currentPublicId} -> ${newPublicId}`);
          } catch (moveError) {
            console.error(`❌ Failed to move photo to ${folderName} folder:`, moveError);
            console.error(`Current public_id: ${photo.publicId}`);
            console.error(`Attempted new public_id: ${finalFolderPath}/${photo.publicId.split('/').pop()}`);
            // Continue with other photos even if one fails
          }
        }

        // Add photos to the visit
        visit.photos = visit.photos || [];
        visit.photos.push(...uploadedPhotos);
        
        // Ensure recommendations and issuesFound are properly formatted before saving
        if (visit.recommendations === "" || visit.recommendations === null || visit.recommendations === undefined) {
          visit.recommendations = [];
        } else if (!Array.isArray(visit.recommendations)) {
          visit.recommendations = [];
        }
        
        if (visit.issuesFound === "" || visit.issuesFound === null || visit.issuesFound === undefined) {
          visit.issuesFound = [];
        } else if (!Array.isArray(visit.issuesFound)) {
          visit.issuesFound = [];
        }
        
        console.log('Before save - recommendations:', visit.recommendations);
        console.log('Before save - issuesFound:', visit.issuesFound);
        
        await visit.save();
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to category folder for visit ${visit.visitId}`);
      }

      // Map category to folder name for response
      const categoryFolderMap = {
        'Before Service': 'before-service',
        'During Service': 'during-service', 
        'After Service': 'after-service',
        'Spare Parts': 'spare-parts',
        'RMA': 'rma',
        'Issue Found': 'issues',
        'Parts Used': 'parts-used',
        'Service Photos': 'service-photos',
        'BEFORE': 'before-service',
        'DURING': 'during-service',
        'AFTER': 'after-service',
        'ISSUE': 'issues',
        'PARTS': 'parts-used',
        'Other': 'other'
      };
      
      const folderName = categoryFolderMap[category] || 'other';
      const finalFolderPath = `projectorcare/${visit.projectorSerial}/${visit.visitId}/${folderName}`;

      res.json({
        message: 'Photos uploaded successfully to category-specific Cloudinary folder',
        photos: uploadedPhotos,
        totalPhotos: visit.photos.length,
        folderStructure: finalFolderPath,
        category: category,
        folderName: folderName
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

    // Use multer().any() to get both form data and files first
    const tempMulter = multer().any();
    
    // Process the request to get form data and files
    tempMulter(req, res, async (err) => {
      if (err) {
        console.error('Form data processing error:', err);
        return res.status(400).json({ message: err.message });
      }
      
      // Now we can access req.body.category and req.files
      const category = req.body.category || 'Other';
      console.log('LEGACY ROUTE - Creating category-based storage for:', category);
      
      // Use the automated storage function for category-based folders
      const storage = createAutomatedStorage(visit.projectorSerial, visit.visitId, category);
      
      // Create a new multer instance with the category-based storage
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

      // Now process the files with the category-based storage
      const files = req.files || [];
      
      if (files.length > 0) {
        console.log(`Processing ${files.length} files for visit ${visit.visitId} in category-based folder: projectorcare/${visit.projectorSerial}/${visit.visitId}/${category}`);
        console.log('LEGACY ROUTE - Category from body:', req.body.category);
        console.log('LEGACY ROUTE - Using category-based storage for:', category);
        
        const uploadedPhotos = [];
        
        for (const file of files) {
          // Upload the file to Cloudinary using the category-based storage
          try {
            // Create a new multer instance for each file to use the category-based storage
            const singleUpload = uploadMiddleware.single('photo');
            
            // Create a mock request object for the single file upload
            const mockReq = {
              file: file,
              body: req.body
            };
            
            // Upload the file using the category-based storage
            singleUpload(mockReq, res, async (uploadErr) => {
              if (uploadErr) {
                console.error('File upload error:', uploadErr);
                return;
              }
                
              if (mockReq.file) {
                const photoData = {
                  filename: mockReq.file.filename,
                  originalName: mockReq.file.originalname,
                  cloudUrl: mockReq.file.path, // Cloudinary URL
                  publicId: mockReq.file.filename, // Cloudinary public ID
                  uploadedAt: new Date(),
                  description: req.body.description || '',
                  category: req.body.category || 'Other',
                  fileSize: mockReq.file.size,
                  mimeType: mockReq.file.mimetype,
                  cloudinaryData: {
                    assetId: mockReq.file.asset_id,
                    versionId: mockReq.file.version_id,
                    signature: mockReq.file.signature,
                    format: mockReq.file.format,
                    width: mockReq.file.width,
                    height: mockReq.file.height
                  }
                };
                
                uploadedPhotos.push(photoData);
              }
            });
          } catch (fileError) {
            console.error('File processing error:', fileError);
          }
        }
        
        // Wait a bit for uploads to complete, then save to database
        setTimeout(async () => {
          if (uploadedPhotos.length > 0) {
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
        }, 1000);
        
      } else {
        res.json({
          message: 'No files to upload',
          photos: [],
          totalPhotos: visit.photos ? visit.photos.length : 0
        });
      }
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
    const unableToCompleteVisits = await ServiceVisit.countDocuments({ status: 'Unable to Complete' });

    res.json({
      totalVisits,
      completedVisits,
      scheduledVisits,
      inProgressVisits,
      cancelledVisits,
      unableToCompleteVisits
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unable to complete analytics
router.get('/stats/unable-to-complete', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        actualDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const unableToCompleteVisits = await ServiceVisit.find({
      status: 'Unable to Complete',
      ...dateFilter
    });

    // Group by category
    const categoryStats = unableToCompleteVisits.reduce((acc, visit) => {
      const category = visit.unableToCompleteCategory || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Group by FSE
    const fseStats = unableToCompleteVisits.reduce((acc, visit) => {
      const fseName = visit.fseName || 'Unknown';
      acc[fseName] = (acc[fseName] || 0) + 1;
      return acc;
    }, {});

    // Group by site
    const siteStats = unableToCompleteVisits.reduce((acc, visit) => {
      const siteName = visit.siteName || 'Unknown';
      acc[siteName] = (acc[siteName] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: unableToCompleteVisits.length,
      categoryBreakdown: categoryStats,
      fseBreakdown: fseStats,
      siteBreakdown: siteStats,
      visits: unableToCompleteVisits.map(visit => ({
        visitId: visit.visitId,
        fseName: visit.fseName,
        siteName: visit.siteName,
        projectorSerial: visit.projectorSerial,
        category: visit.unableToCompleteCategory,
        reason: visit.unableToCompleteReason,
        actualDate: visit.actualDate
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk mark multiple service visits as unable to complete
router.post('/bulk/unable-to-complete', 
  authenticateToken, 
  sanitizeInput, 
  validateBulkUnableToComplete, 
  async (req, res) => {
  try {
    const { visitIds, reason, category } = req.body;
    
    // Validation
    if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
      return res.status(400).json({ 
        message: 'Visit IDs array is required',
        code: 'MISSING_VISIT_IDS'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ 
        message: 'Reason for unable to complete is required',
        code: 'MISSING_REASON'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Reason must be at least 10 characters long',
        code: 'REASON_TOO_SHORT'
      });
    }

    // Find all visits
    const visits = await ServiceVisit.find({ 
      _id: { $in: visitIds },
      status: { $nin: ['Completed', 'Cancelled'] }
    });

    if (visits.length === 0) {
      return res.status(404).json({ 
        message: 'No valid visits found to mark as unable to complete',
        code: 'NO_VALID_VISITS'
      });
    }

    // Update all visits
    const updatePromises = visits.map(visit => {
      visit.status = 'Unable to Complete';
      visit.unableToCompleteReason = reason.trim();
      visit.unableToCompleteCategory = category || 'Other';
      visit.actualDate = new Date();
      visit.endTime = new Date().toLocaleTimeString();
      
      if (visit.workflowStatus) {
        visit.workflowStatus.serviceCompleted = false;
        visit.workflowStatus.completed = false;
        visit.workflowStatus.lastUpdated = new Date();
      }
      
      return visit.save();
    });

    await Promise.all(updatePromises);

    // Send email notifications for each visit
    visits.forEach(visit => {
      emailService.sendUnableToCompleteNotification(visit, visit.fseName).catch(err => {
        console.error(`Failed to send email notification for visit ${visit.visitId}:`, err);
      });
    });

    // Log the bulk action
    console.log(`Bulk unable to complete: ${visits.length} visits marked by user ${req.user?.username || 'unknown'}. Reason: ${reason.substring(0, 50)}...`);

    // Create audit log for bulk operation (async, don't wait for it)
    auditService.logBulkUnableToComplete(visitIds, req.user, reason, category, req).catch(err => {
      console.error('Failed to create bulk audit log:', err);
    });

    res.json({
      message: `Successfully marked ${visits.length} service visits as unable to complete`,
      updatedVisits: visits.map(visit => ({
        _id: visit._id,
        visitId: visit.visitId,
        status: visit.status,
        fseName: visit.fseName,
        siteName: visit.siteName
      })),
      skipped: visitIds.length - visits.length
    });
  } catch (error) {
    console.error('Bulk unable to complete error:', error);
    res.status(500).json({ 
      message: 'Internal server error during bulk unable to complete operation',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Reschedule unable to complete visits
router.post('/bulk/reschedule', 
  authenticateToken, 
  sanitizeInput, 
  validateBulkReschedule, 
  async (req, res) => {
  try {
    const { visitIds, newScheduledDate, reason } = req.body;
    
    // Validation
    if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
      return res.status(400).json({ 
        message: 'Visit IDs array is required',
        code: 'MISSING_VISIT_IDS'
      });
    }

    if (!newScheduledDate) {
      return res.status(400).json({ 
        message: 'New scheduled date is required',
        code: 'MISSING_SCHEDULED_DATE'
      });
    }

    // Find all unable to complete visits
    const visits = await ServiceVisit.find({ 
      _id: { $in: visitIds },
      status: 'Unable to Complete'
    });

    if (visits.length === 0) {
      return res.status(404).json({ 
        message: 'No unable to complete visits found to reschedule',
        code: 'NO_VALID_VISITS'
      });
    }

    // Update all visits
    const updatePromises = visits.map(visit => {
      visit.status = 'Scheduled';
      visit.scheduledDate = new Date(newScheduledDate);
      visit.unableToCompleteReason = null;
      visit.unableToCompleteCategory = null;
      visit.actualDate = null;
      visit.endTime = null;
      
      if (visit.workflowStatus) {
        visit.workflowStatus.serviceCompleted = false;
        visit.workflowStatus.completed = false;
        visit.workflowStatus.lastUpdated = new Date();
      }
      
      return visit.save();
    });

    await Promise.all(updatePromises);

    // Log the bulk reschedule action
    console.log(`Bulk reschedule: ${visits.length} visits rescheduled by user ${req.user?.username || 'unknown'} to ${newScheduledDate}. Reason: ${reason || 'No reason provided'}`);

    // Create audit log for bulk reschedule (async, don't wait for it)
    auditService.logBulkReschedule(visitIds, req.user, newScheduledDate, reason, req).catch(err => {
      console.error('Failed to create bulk reschedule audit log:', err);
    });

    res.json({
      message: `Successfully rescheduled ${visits.length} service visits`,
      rescheduledVisits: visits.map(visit => ({
        _id: visit._id,
        visitId: visit.visitId,
        status: visit.status,
        scheduledDate: visit.scheduledDate,
        fseName: visit.fseName,
        siteName: visit.siteName
      })),
      skipped: visitIds.length - visits.length
    });
  } catch (error) {
    console.error('Bulk reschedule error:', error);
    res.status(500).json({ 
      message: 'Internal server error during bulk reschedule operation',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Export unable to complete data as CSV
router.get('/export/unable-to-complete', 
  authenticateToken, 
  validateExport, 
  validateDateRangeLogic, 
  async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        actualDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const unableToCompleteVisits = await ServiceVisit.find({
      status: 'Unable to Complete',
      ...dateFilter
    }).sort({ actualDate: -1 });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Visit ID',
        'FSE Name',
        'Site Name',
        'Projector Serial',
        'Visit Type',
        'Category',
        'Reason',
        'Scheduled Date',
        'Actual Date',
        'End Time',
        'Priority'
      ];

      const csvRows = unableToCompleteVisits.map(visit => [
        visit.visitId,
        visit.fseName,
        visit.siteName,
        visit.projectorSerial,
        visit.visitType,
        visit.unableToCompleteCategory || 'Other',
        `"${(visit.unableToCompleteReason || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
        new Date(visit.scheduledDate).toLocaleDateString(),
        new Date(visit.actualDate).toLocaleDateString(),
        visit.endTime || '',
        visit.priority
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

      // Log export action (async, don't wait for it)
      auditService.logExport(req.user, 'csv', 'ServiceVisit', { startDate, endDate, status: 'Unable to Complete' }, req).catch(err => {
        console.error('Failed to create export audit log:', err);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="unable-to-complete-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else if (format === 'json') {
      // Generate JSON
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalRecords: unableToCompleteVisits.length,
        dateRange: { startDate, endDate },
        data: unableToCompleteVisits.map(visit => ({
          visitId: visit.visitId,
          fseName: visit.fseName,
          siteName: visit.siteName,
          projectorSerial: visit.projectorSerial,
          visitType: visit.visitType,
          category: visit.unableToCompleteCategory || 'Other',
          reason: visit.unableToCompleteReason,
          scheduledDate: visit.scheduledDate,
          actualDate: visit.actualDate,
          endTime: visit.endTime,
          priority: visit.priority
        }))
      };

      // Log export action (async, don't wait for it)
      auditService.logExport(req.user, 'json', 'ServiceVisit', { startDate, endDate, status: 'Unable to Complete' }, req).catch(err => {
        console.error('Failed to create export audit log:', err);
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="unable-to-complete-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(jsonData);
    } else {
      res.status(400).json({ 
        message: 'Invalid format. Supported formats: csv, json',
        code: 'INVALID_FORMAT'
      });
    }
  } catch (error) {
    console.error('Export unable to complete error:', error);
    res.status(500).json({ 
      message: 'Internal server error during export operation',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Send weekly unable to complete report via email
router.post('/reports/weekly-unable-to-complete', 
  authenticateToken, 
  sanitizeInput, 
  validateWeeklyReport, 
  async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required',
        code: 'MISSING_DATES'
      });
    }

    const unableToCompleteVisits = await ServiceVisit.find({
      status: 'Unable to Complete',
      actualDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ actualDate: -1 });

    const dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    
    const emailSent = await emailService.sendBulkUnableToCompleteReport(unableToCompleteVisits, dateRange);

    if (emailSent) {
      res.json({
        message: 'Weekly unable to complete report sent successfully',
        totalVisits: unableToCompleteVisits.length,
        dateRange: dateRange
      });
    } else {
      res.status(500).json({
        message: 'Failed to send weekly report email',
        code: 'EMAIL_SEND_FAILED'
      });
    }
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ 
      message: 'Internal server error during weekly report generation',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get audit logs for unable to complete operations
router.get('/audit/unable-to-complete', 
  authenticateToken, 
  validateAuditLogs, 
  validateDateRangeLogic, 
  async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      action, 
      userId, 
      category, 
      limit = 50, 
      skip = 0 
    } = req.query;

    const filters = {
      startDate,
      endDate,
      action: action || 'UNABLE_TO_COMPLETE',
      userId,
      category,
      limit: parseInt(limit),
      skip: parseInt(skip)
    };

    const auditLogs = await auditService.getAuditLogs(filters);
    const auditStats = await auditService.getAuditStats(filters);

    res.json({
      logs: auditLogs,
      stats: auditStats,
      pagination: {
        limit: filters.limit,
        skip: filters.skip,
        total: auditLogs.length
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ 
      message: 'Internal server error while fetching audit logs',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get audit statistics
router.get('/audit/stats', 
  authenticateToken, 
  validateDateRangeLogic, 
  async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = { startDate, endDate };
    const auditStats = await auditService.getAuditStats(filters);

    res.json(auditStats);
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error while fetching audit statistics',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ===== NEW PHOTO-FIRST WORKFLOW ENDPOINTS =====

// Get workflow status for a service visit
router.get('/:id/workflow-status', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    const workflowStatus = {
      photosCaptured: visit.workflowStatus?.photosCaptured || false,
      serviceCompleted: visit.workflowStatus?.serviceCompleted || false,
      reportGenerated: visit.workflowStatus?.reportGenerated || false,
      signatureCaptured: visit.workflowStatus?.signatureCaptured || false,
      completed: visit.workflowStatus?.completed || false,
      progress: visit.getWorkflowProgress ? visit.getWorkflowProgress() : 0,
      lastUpdated: visit.workflowStatus?.lastUpdated || visit.updatedAt
    };

    res.json(workflowStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workflow status for a service visit
router.put('/:id/workflow-status', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    const { photosCaptured, serviceCompleted, reportGenerated, signatureCaptured } = req.body;

    // Update workflow status
    if (photosCaptured !== undefined) visit.workflowStatus.photosCaptured = photosCaptured;
    if (serviceCompleted !== undefined) visit.workflowStatus.serviceCompleted = serviceCompleted;
    if (reportGenerated !== undefined) visit.workflowStatus.reportGenerated = reportGenerated;
    if (signatureCaptured !== undefined) visit.workflowStatus.signatureCaptured = signatureCaptured;

    visit.workflowStatus.lastUpdated = new Date();

    await visit.save();

    res.json({
      message: 'Workflow status updated successfully',
      workflowStatus: visit.workflowStatus,
      progress: visit.getWorkflowProgress()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload photos with category-based organization (Enhanced for photo-first workflow)
router.post('/:id/photos/categorized', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        message: 'Cloudinary configuration error. Please check environment variables.' 
      });
    }

    // Use multer to process form data and files together
    const uploadMiddleware = multer({
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'projectorcare/temp', // Temporary folder, will be moved
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

    // Process the upload
    uploadMiddleware.any()(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }
      
      // Extract category from form data
      const category = req.body.category || 'Other';
      const description = req.body.description || '';
      
      // Validate category
      const validCategories = ['Before Service', 'During Service', 'After Service', 'Issue Found', 'Parts Used'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ 
          message: 'Invalid category', 
          validCategories: validCategories 
        });
      }

      const uploadedPhotos = [];
      const files = Array.isArray(req.files) ? req.files : [];
      
      if (files.length > 0) {
        console.log(`Processing ${files.length} files for visit ${visit.visitId} in category: ${category}`);
        
        for (const file of files) {
          const photoData = {
            filename: file.filename,
            originalName: file.originalname,
            cloudUrl: file.path,
            publicId: file.filename,
            uploadedAt: new Date(),
            description: description,
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
        
        // Add photos to the appropriate category in photoCategories
        if (!visit.photoCategories) {
          visit.photoCategories = {
            beforeService: [],
            duringService: [],
            afterService: [],
            issuesFound: [],
            partsUsed: []
          };
        }

        // Map category to the correct array
        const categoryMap = {
          'Before Service': 'beforeService',
          'During Service': 'duringService',
          'After Service': 'afterService',
          'Issue Found': 'issuesFound',
          'Parts Used': 'partsUsed'
        };

        const categoryKey = categoryMap[category];
        if (categoryKey && visit.photoCategories[categoryKey]) {
          visit.photoCategories[categoryKey].push(...uploadedPhotos);
        }

        // Also add to legacy photos array for backward compatibility
        visit.photos = visit.photos || [];
        visit.photos.push(...uploadedPhotos);

        // Mark photos as captured if this is the first photo upload
        if (!visit.workflowStatus.photosCaptured) {
          visit.workflowStatus.photosCaptured = true;
        }

        await visit.save();
        
        console.log(`Successfully uploaded ${uploadedPhotos.length} photos to category ${category} for visit ${visit.visitId}`);
      }

      res.json({
        message: 'Photos uploaded successfully with category organization',
        photos: uploadedPhotos,
        category: category,
        totalPhotos: visit.photos.length,
        workflowStatus: visit.workflowStatus
      });
    });
  } catch (error) {
    console.error('Categorized photo upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Capture digital signature
router.post('/:id/signature', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    const { siteInCharge, fse } = req.body;

    // Validate required fields
    if (!siteInCharge || !fse) {
      return res.status(400).json({ 
        message: 'Both site in-charge and FSE signature data are required' 
      });
    }

    // Initialize digitalSignature if it doesn't exist
    if (!visit.digitalSignature) {
      visit.digitalSignature = {
        siteInCharge: {},
        fse: {}
      };
    }

    // Update site in-charge signature
    if (siteInCharge.name) visit.digitalSignature.siteInCharge.name = siteInCharge.name;
    if (siteInCharge.designation) visit.digitalSignature.siteInCharge.designation = siteInCharge.designation;
    if (siteInCharge.signature) visit.digitalSignature.siteInCharge.signature = siteInCharge.signature;
    if (siteInCharge.location) visit.digitalSignature.siteInCharge.location = siteInCharge.location;
    visit.digitalSignature.siteInCharge.timestamp = new Date();
    visit.digitalSignature.siteInCharge.verified = true;

    // Update FSE signature
    if (fse.name) visit.digitalSignature.fse.name = fse.name;
    if (fse.signature) visit.digitalSignature.fse.signature = fse.signature;
    if (fse.location) visit.digitalSignature.fse.location = fse.location;
    visit.digitalSignature.fse.timestamp = new Date();

    // Mark signature as captured
    visit.workflowStatus.signatureCaptured = true;

    await visit.save();

    res.json({
      message: 'Digital signature captured successfully',
      digitalSignature: visit.digitalSignature,
      workflowStatus: visit.workflowStatus
    });
  } catch (error) {
    console.error('Digital signature capture error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get categorized photos for a service visit
router.get('/:id/photos/categorized', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    res.json({
      photoCategories: visit.photoCategories || {
        beforeService: [],
        duringService: [],
        afterService: [],
        issuesFound: [],
        partsUsed: []
      },
      totalPhotos: visit.photos ? visit.photos.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get digital signature for a service visit
router.get('/:id/signature', async (req, res) => {
  try {
    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Service visit not found' });
    }

    res.json({
      digitalSignature: visit.digitalSignature || null,
      signatureCaptured: visit.workflowStatus?.signatureCaptured || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark service visit as unable to complete
router.put('/:id/unable-to-complete', 
  authenticateToken, 
  validateServiceVisitId, 
  sanitizeInput, 
  validateUnableToComplete, 
  async (req, res) => {
  try {
    const { reason, category } = req.body;
    
    // Enhanced validation
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ 
        message: 'Reason for unable to complete is required',
        code: 'MISSING_REASON'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Reason must be at least 10 characters long',
        code: 'REASON_TOO_SHORT'
      });
    }

    if (reason.trim().length > 1000) {
      return res.status(400).json({ 
        message: 'Reason cannot exceed 1000 characters',
        code: 'REASON_TOO_LONG'
      });
    }

    const visit = await ServiceVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ 
        message: 'Service visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }

    // Check if visit is already completed or cancelled
    if (visit.status === 'Completed') {
      return res.status(400).json({ 
        message: 'Cannot mark completed service as unable to complete',
        code: 'ALREADY_COMPLETED'
      });
    }

    if (visit.status === 'Cancelled') {
      return res.status(400).json({ 
        message: 'Cannot mark cancelled service as unable to complete',
        code: 'ALREADY_CANCELLED'
      });
    }

    // Update the visit status and reason
    visit.status = 'Unable to Complete';
    visit.unableToCompleteReason = reason.trim();
    visit.actualDate = new Date();
    visit.endTime = new Date().toLocaleTimeString();
    
    // Add category if provided
    if (category) {
      visit.unableToCompleteCategory = category;
    }

    // Update workflow status to reflect inability to complete
    if (visit.workflowStatus) {
      visit.workflowStatus.serviceCompleted = false;
      visit.workflowStatus.completed = false;
      visit.workflowStatus.lastUpdated = new Date();
    }

    await visit.save();

    // Log the action for audit trail
    console.log(`Service visit ${visit.visitId} marked as unable to complete by user ${req.user?.username || 'unknown'}. Reason: ${reason.substring(0, 50)}...`);

    // Create audit log (async, don't wait for it)
    auditService.logUnableToComplete(visit, req.user, reason, category, req).catch(err => {
      console.error('Failed to create audit log:', err);
    });

    // Send email notification (async, don't wait for it)
    emailService.sendUnableToCompleteNotification(visit, visit.fseName).catch(err => {
      console.error('Failed to send email notification:', err);
    });

    res.json({
      message: 'Service visit marked as unable to complete successfully',
      visit: {
        _id: visit._id,
        visitId: visit.visitId,
        status: visit.status,
        unableToCompleteReason: visit.unableToCompleteReason,
        unableToCompleteCategory: visit.unableToCompleteCategory,
        actualDate: visit.actualDate,
        endTime: visit.endTime,
        updatedBy: req.user?.username || 'system'
      }
    });
  } catch (error) {
    console.error('Unable to complete service visit error:', error);
    res.status(500).json({ 
      message: 'Internal server error while marking service as unable to complete',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;