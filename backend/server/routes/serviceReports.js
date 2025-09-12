const express = require('express');
const router = express.Router();
const ServiceReport = require('../models/ServiceReport');
const { authenticateToken } = require('../middleware/auth');

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
    const reportData = {
      ...req.body,
      engineer: {
        ...req.body.engineer,
        name: req.body.engineer.name || req.user.name,
        email: req.body.engineer.email || req.user.email
      }
    };

    const newReport = new ServiceReport(reportData);
    const savedReport = await newReport.save();
    
    res.status(201).json({
      message: 'Service report created successfully',
      report: savedReport
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating service report', error: error.message });
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
    // Get FSE performance data
    const fsePerformance = await ServiceReport.aggregate([
      {
        $group: {
          _id: '$engineer.name',
          totalReports: { $sum: 1 },
          avgCompletionTime: { $avg: { $ifNull: ['$completionTime', 0] } },
          avgSatisfaction: { $avg: { $ifNull: ['$customerSatisfaction', 0] } },
          totalIssues: { $sum: { $ifNull: ['$issuesFound', 0] } },
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
                          { $subtract: [100, { $multiply: ['$avgCompletionTime', 10] }] },
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
          avgTime: { $avg: { $ifNull: ['$completionTime', 0] } },
          satisfaction: { $avg: { $ifNull: ['$customerSatisfaction', 0] } },
          issues: { $sum: { $ifNull: ['$issuesFound', 0] } }
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
          avgTime: { $avg: { $ifNull: ['$completionTime', 0] } },
          avgSatisfaction: { $avg: { $ifNull: ['$customerSatisfaction', 0] } }
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
          avgSatisfaction: { $avg: { $ifNull: ['$customerSatisfaction', 0] } },
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

    res.json({
      fsePerformance,
      dailyTrends,
      serviceTypeDistribution,
      topSites
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
      .select('date engineer siteName reportType serviceStatus completionTime customerSatisfaction issuesFound partsReplaced')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const formattedReports = reports.map(report => ({
      date: report.date,
      fseName: report.engineer?.name || 'Unknown',
      siteName: report.siteName,
      reportType: report.reportType,
      serviceStatus: report.serviceStatus || 'Completed',
      completionTime: report.completionTime || 0,
      customerSatisfaction: report.customerSatisfaction || 0,
      issuesFound: report.issuesFound || 0,
      partsReplaced: report.partsReplaced || 0
    }));

    res.json(formattedReports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching detailed reports', error: error.message });
  }
});

module.exports = router;


