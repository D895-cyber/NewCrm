const express = require('express');
const router = express.Router();
const ServiceReport = require('../models/ServiceReport');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for PDF uploads
const pdfUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'projectorcare/service-reports/original-pdfs',
      public_id: (req, file) => {
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        return `report_${timestamp}_${uniqueId}`;
      },
      resource_type: 'raw', // For PDF files
      format: 'pdf'
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Get all service reports
router.get('/', async (req, res) => {
  try {
    console.log('Service reports endpoint called');
    const reports = await ServiceReport.find()
      .sort({ createdAt: -1 })
      .limit(100);
    console.log(`Found ${reports.length} service reports`);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching service reports:', error);
    res.status(500).json({ message: 'Error fetching service reports', error: error.message });
  }
});

// Get recommended spare parts from service reports
router.get('/recommended-spares', async (req, res) => {
  try {
    console.log('Recommended spares endpoint called');
    const reports = await ServiceReport.find({
      'recommendedParts.0': { $exists: true } // Only reports that have recommended parts
    }).sort({ createdAt: -1 });
    
    const recommendedSpares = [];
    
    reports.forEach(report => {
      if (report.recommendedParts && report.recommendedParts.length > 0) {
        report.recommendedParts.forEach((part, index) => {
          recommendedSpares.push({
            _id: `${report._id}-part-${index}`,
            reportId: report.reportNumber,
            visitId: report.visitId,
            projectorSerial: report.projectorSerial,
            partNumber: part.partNumber || 'N/A',
            partName: part.partName || 'N/A',
            quantity: part.quantity || 1,
            notes: part.notes || '',
            status: 'New',
            requestedBy: {
              name: report.engineer?.name || 'Unknown Engineer',
              userId: report.engineer?.id || 'Unknown'
            },
            createdAt: report.createdAt,
            siteName: report.siteName,
            reportType: report.reportType
          });
        });
      }
    });
    
    console.log(`Found ${recommendedSpares.length} recommended spare parts from ${reports.length} reports`);
    res.json(recommendedSpares);
  } catch (error) {
    console.error('Error fetching recommended spares:', error);
    res.status(500).json({ message: 'Error fetching recommended spares', error: error.message });
  }
});



// Get service report by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Service report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service report', error: error.message });
  }
});

// Create new service report
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['reportNumber', 'siteName', 'projectorSerial', 'projectorModel', 'brand'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Validate engineer information
    if (!req.body.engineer?.name || req.body.engineer.name.trim() === '') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        error: 'Engineer name is required' 
      });
    }
    
    const reportData = {
      ...req.body,
      engineer: {
        ...req.body.engineer,
        name: req.body.engineer.name || req.user.name,
        email: req.body.engineer.email || req.user.email
      }
    };

    console.log('Creating service report with data:', {
      reportNumber: reportData.reportNumber,
      siteName: reportData.siteName,
      projectorSerial: reportData.projectorSerial,
      projectorModel: reportData.projectorModel,
      brand: reportData.brand,
      engineerName: reportData.engineer.name
    });

    const newReport = new ServiceReport(reportData);
    const savedReport = await newReport.save();
    
    console.log('Service report created successfully:', savedReport._id);
    
    res.status(201).json({
      message: 'Service report created successfully',
      report: savedReport
    });
  } catch (error) {
    console.error('Error creating service report:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        error: validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating service report', 
      error: error.message 
    });
  }
});

// Update service report
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedReport = await ServiceReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedReport) {
      return res.status(404).json({ message: 'Service report not found' });
    }
    
    res.json({
      message: 'Service report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating service report', error: error.message });
  }
});

// Delete service report
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedReport = await ServiceReport.findByIdAndDelete(req.params.id);
    
    if (!deletedReport) {
      return res.status(404).json({ message: 'Service report not found' });
    }
    
    res.json({ message: 'Service report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service report', error: error.message });
  }
});

// Get service reports by projector serial
router.get('/projector/:serial', authenticateToken, async (req, res) => {
  try {
    const reports = await ServiceReport.find({ projectorSerial: req.params.serial })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projector reports', error: error.message });
  }
});

// Get service reports by engineer
router.get('/engineer/:engineerId', authenticateToken, async (req, res) => {
  try {
    const reports = await ServiceReport.find({ 'engineer.name': req.params.engineerId })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching engineer reports', error: error.message });
  }
});

// Get service reports by site
router.get('/site/:siteName', authenticateToken, async (req, res) => {
  try {
    const reports = await ServiceReport.find({ siteName: req.params.siteName })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching site reports', error: error.message });
  }
});

// Get service reports by visit ID
router.get('/visit/:visitId', authenticateToken, async (req, res) => {
  try {
    const reports = await ServiceReport.find({ visitId: req.params.visitId })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visit reports', error: error.message });
  }
});

// Get service reports by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    
    const reports = await ServiceReport.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date range reports', error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    console.log('Dashboard stats endpoint called');
    const totalReports = await ServiceReport.countDocuments();
    const todayReports = await ServiceReport.countDocuments({
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    
    const monthlyReports = await ServiceReport.countDocuments({
      date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });

    const reportTypes = await ServiceReport.aggregate([
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      totalReports,
      todayReports,
      monthlyReports,
      reportTypes
    };

    console.log('Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Get FSE analytics data
router.get('/analytics/fse', authenticateToken, async (req, res) => {
  try {
    // Get FSE performance data based on actual ServiceReport schema
    const fsePerformance = await ServiceReport.aggregate([
      {
        $group: {
          _id: '$engineer.name',
          totalReports: { $sum: 1 },
          avgCompletionTime: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          avgSatisfaction: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          totalIssues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          },
          lastReportDate: { $max: '$date' }
        }
      },
      {
        $project: {
          fseName: '$_id',
          totalReports: 1,
          avgCompletionTime: { $round: ['$avgCompletionTime', 1] },
          avgSatisfaction: { $round: ['$avgSatisfaction', 1] },
          totalIssues: 1,
          lastReportDate: 1,
          efficiency: {
            $cond: {
              if: { $gt: ['$totalReports', 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: [100, { $multiply: ['$avgCompletionTime', 0.1] }] },
                          100
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    // Get daily trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyTrends = await ServiceReport.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          reports: { $sum: 1 },
          avgTime: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          satisfaction: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          issues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          reports: 1,
          avgTime: { $round: ['$avgTime', 1] },
          satisfaction: { $round: ['$satisfaction', 1] },
          issues: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get service type distribution
    const serviceTypeDistribution = await ServiceReport.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 },
          avgTime: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          avgSatisfaction: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          avgTime: { $round: ['$avgTime', 1] },
          avgSatisfaction: { $round: ['$avgSatisfaction', 1] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top performing sites
    const topSites = await ServiceReport.aggregate([
      {
        $group: {
          _id: '$siteName',
          services: { $sum: 1 },
          avgSatisfaction: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          lastVisit: { $max: '$date' }
        }
      },
      {
        $project: {
          siteName: '$_id',
          services: 1,
          avgSatisfaction: { $round: ['$avgSatisfaction', 1] },
          lastVisit: 1
        }
      },
      { $sort: { services: -1 } },
      { $limit: 10 }
    ]);

    // Get additional analytics data
    const totalReports = await ServiceReport.countDocuments();
    const totalFSEs = await ServiceReport.distinct('engineer.name').then(names => names.filter(name => name && name.trim() !== ''));
    
    // Get monthly trends for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await ServiceReport.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          reports: { $sum: 1 },
          avgTime: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          satisfaction: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          issues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          month: {
            $dateToString: { format: "%Y-%m", date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 } } }
          },
          reports: 1,
          avgTime: { $round: ['$avgTime', 1] },
          satisfaction: { $round: ['$satisfaction', 1] },
          issues: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get issue analysis
    const issueAnalysis = await ServiceReport.aggregate([
      {
        $unwind: '$observations'
      },
      {
        $match: {
          'observations.description': { $ne: '', $exists: true }
        }
      },
      {
        $group: {
          _id: '$observations.description',
          count: { $sum: 1 },
          fseNames: { $addToSet: '$engineer.name' },
          sites: { $addToSet: '$siteName' }
        }
      },
      {
        $project: {
          issue: '$_id',
          count: 1,
          fseCount: { $size: '$fseNames' },
          siteCount: { $size: '$sites' },
          fseNames: 1,
          sites: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get FSE efficiency metrics
    const fseEfficiency = await ServiceReport.aggregate([
      {
        $group: {
          _id: '$engineer.name',
          totalReports: { $sum: 1 },
          avgProjectorHours: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          avgLampPerformance: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          totalIssues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          },
          lastReportDate: { $max: '$date' },
          firstReportDate: { $min: '$date' }
        }
      },
      {
        $project: {
          fseName: '$_id',
          totalReports: 1,
          avgProjectorHours: { $round: ['$avgProjectorHours', 1] },
          avgLampPerformance: { $round: ['$avgLampPerformance', 1] },
          totalIssues: 1,
          issueRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$totalIssues', '$totalReports'] },
                  100
                ]
              },
              1
            ]
          },
          lastReportDate: 1,
          firstReportDate: 1,
          experienceDays: {
            $divide: [
              { $subtract: ['$lastReportDate', '$firstReportDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    res.json({
      fsePerformance,
      dailyTrends,
      serviceTypeDistribution,
      topSites,
      summary: {
        totalReports,
        totalFSEs: totalFSEs.length,
        avgReportsPerFSE: totalFSEs.length > 0 ? Math.round(totalReports / totalFSEs.length) : 0
      },
      monthlyTrends,
      issueAnalysis,
      fseEfficiency
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FSE analytics', error: error.message });
  }
});

// Get detailed service reports for analytics
router.get('/analytics/detailed', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const reports = await ServiceReport.find()
      .select('date engineer siteName reportType projectorRunningHours lampPowerMeasurements observations')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const formattedReports = reports.map(report => ({
      date: report.date,
      fseName: report.engineer?.name || 'Unknown',
      siteName: report.siteName,
      reportType: report.reportType,
      serviceStatus: 'Completed',
      completionTime: report.projectorRunningHours || 0,
      customerSatisfaction: report.lampPowerMeasurements?.flAfterPM || 0,
      issuesFound: report.observations?.filter(obs => obs.description && obs.description.trim() !== '').length || 0,
      partsReplaced: 0 // This field doesn't exist in the current schema
    }));

    res.json(formattedReports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching detailed reports', error: error.message });
  }
});

// Get FSE-specific analytics for individual FSE performance
router.get('/analytics/fse/:fseName', authenticateToken, async (req, res) => {
  try {
    const { fseName } = req.params;
    
    // Get FSE-specific performance data
    const fseReports = await ServiceReport.find({ 'engineer.name': fseName })
      .sort({ date: -1 });

    if (fseReports.length === 0) {
      return res.status(404).json({ message: 'FSE not found or no reports available' });
    }

    // Calculate FSE-specific metrics
    const totalReports = fseReports.length;
    const avgProjectorHours = fseReports.reduce((sum, report) => 
      sum + (parseFloat(report.projectorRunningHours) || 0), 0) / totalReports;
    const avgLampPerformance = fseReports.reduce((sum, report) => 
      sum + (parseFloat(report.lampPowerMeasurements?.flAfterPM) || 0), 0) / totalReports;
    
    const totalIssues = fseReports.reduce((sum, report) => 
      sum + (report.observations?.filter(obs => obs.description && obs.description.trim() !== '').length || 0), 0);
    
    const issueRate = (totalIssues / totalReports) * 100;

    // Get monthly performance for this FSE
    const monthlyPerformance = await ServiceReport.aggregate([
      {
        $match: { 'engineer.name': fseName }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          reports: { $sum: 1 },
          avgProjectorHours: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          avgLampPerformance: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          issues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          month: {
            $dateToString: { format: "%Y-%m", date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 } } }
          },
          reports: 1,
          avgProjectorHours: { $round: ['$avgProjectorHours', 1] },
          avgLampPerformance: { $round: ['$avgLampPerformance', 1] },
          issues: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get site performance for this FSE
    const sitePerformance = await ServiceReport.aggregate([
      {
        $match: { 'engineer.name': fseName }
      },
      {
        $group: {
          _id: '$siteName',
          reports: { $sum: 1 },
          avgProjectorHours: { $avg: { $ifNull: ['$projectorRunningHours', 0] } },
          avgLampPerformance: { $avg: { $ifNull: ['$lampPowerMeasurements.flAfterPM', 0] } },
          issues: { 
            $sum: { 
              $size: { 
                $filter: {
                  input: '$observations',
                  cond: { $ne: ['$$this.description', ''] }
                }
              }
            }
          },
          lastVisit: { $max: '$date' }
        }
      },
      {
        $project: {
          siteName: '$_id',
          reports: 1,
          avgProjectorHours: { $round: ['$avgProjectorHours', 1] },
          avgLampPerformance: { $round: ['$avgLampPerformance', 1] },
          issues: 1,
          lastVisit: 1
        }
      },
      { $sort: { reports: -1 } }
    ]);

    // Get recent reports
    const recentReports = fseReports.slice(0, 10).map(report => ({
      reportNumber: report.reportNumber,
      siteName: report.siteName,
      date: report.date,
      reportType: report.reportType,
      projectorSerial: report.projectorSerial,
      projectorModel: report.projectorModel,
      projectorRunningHours: report.projectorRunningHours,
      lampPerformance: report.lampPowerMeasurements?.flAfterPM,
      issuesCount: report.observations?.filter(obs => obs.description && obs.description.trim() !== '').length || 0
    }));

    res.json({
      fseName,
      summary: {
        totalReports,
        avgProjectorHours: Math.round(avgProjectorHours * 10) / 10,
        avgLampPerformance: Math.round(avgLampPerformance * 10) / 10,
        totalIssues,
        issueRate: Math.round(issueRate * 10) / 10,
        firstReportDate: fseReports[fseReports.length - 1]?.date,
        lastReportDate: fseReports[0]?.date
      },
      monthlyPerformance,
      sitePerformance,
      recentReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FSE-specific analytics', error: error.message });
  }
});

// Upload original PDF report (uploaded by FSE)
router.post('/:id/upload-original-pdf', authenticateToken, pdfUpload.single('pdf'), async (req, res) => {
  try {
    const reportId = req.params.id;
    const uploadedBy = req.user?.username || req.user?.name || 'Unknown FSE';

    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const report = await ServiceReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Service report not found' });
    }

    // Update the report with original PDF information
    report.originalPdfReport = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      cloudUrl: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date(),
      uploadedBy: uploadedBy,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    await report.save();

    res.json({
      message: 'Original PDF report uploaded successfully',
      pdfInfo: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        cloudUrl: req.file.path,
        uploadedAt: report.originalPdfReport.uploadedAt,
        uploadedBy: uploadedBy
      }
    });

  } catch (error) {
    console.error('Error uploading original PDF:', error);
    res.status(500).json({ message: 'Error uploading PDF', error: error.message });
  }
});

// Download original PDF report
router.get('/:id/download-original-pdf', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await ServiceReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Service report not found' });
    }

    if (!report.originalPdfReport || !report.originalPdfReport.cloudUrl) {
      return res.status(404).json({ message: 'No original PDF report found for this service report' });
    }

    // Redirect to Cloudinary URL for direct download
    res.redirect(report.originalPdfReport.cloudUrl);

  } catch (error) {
    console.error('Error downloading original PDF:', error);
    res.status(500).json({ message: 'Error downloading PDF', error: error.message });
  }
});

module.exports = router;


