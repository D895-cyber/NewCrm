const express = require('express');
const router = express.Router();
const ASCOMPReport = require('../models/ASCOMPReport');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all ASCOMP reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, cinemaName, engineerId, startDate, endDate } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by cinema name
    if (cinemaName) {
      query.cinemaName = { $regex: cinemaName, $options: 'i' };
    }
    
    // Filter by engineer
    if (engineerId) {
      query['engineer.userId'] = engineerId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // If user is FSE, show only their reports
    if (req.user.role === 'fse') {
      query['engineer.userId'] = req.user._id;
    }
    
    const reports = await ASCOMPReport.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('engineer.userId', 'username email')
      .populate('createdBy', 'username email')
      .lean();
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching ASCOMP reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
});

// Get single ASCOMP report by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await ASCOMPReport.findById(req.params.id)
      .populate('engineer.userId', 'username email phone')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has access
    if (req.user.role === 'fse' && 
        report.engineer.userId && 
        report.engineer.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching ASCOMP report:', error);
    res.status(500).json({ 
      message: 'Error fetching report', 
      error: error.message 
    });
  }
});

// Create new ASCOMP report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      createdBy: req.user._id,
      engineer: {
        ...req.body.engineer,
        userId: req.user._id
      }
    };
    
    const report = new ASCOMPReport(reportData);
    await report.save();
    
    const populatedReport = await ASCOMPReport.findById(report._id)
      .populate('engineer.userId', 'username email')
      .populate('createdBy', 'username email');
    
    res.status(201).json({
      message: 'ASCOMP report created successfully',
      report: populatedReport
    });
  } catch (error) {
    console.error('Error creating ASCOMP report:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Report number already exists',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating report', 
      error: error.message 
    });
  }
});

// Update ASCOMP report
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await ASCOMPReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has permission to update
    if (req.user.role === 'fse' && 
        report.engineer.userId && 
        report.engineer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prevent changing status to 'Approved' unless user is admin/manager
    if (req.body.status === 'Approved' && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only managers can approve reports' });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      report[key] = req.body[key];
    });
    
    await report.save();
    
    const updatedReport = await ASCOMPReport.findById(report._id)
      .populate('engineer.userId', 'username email')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email');
    
    res.json({
      message: 'ASCOMP report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating ASCOMP report:', error);
    res.status(500).json({ 
      message: 'Error updating report', 
      error: error.message 
    });
  }
});

// Delete ASCOMP report
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await ASCOMPReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Only creator or admin can delete
    if (req.user.role !== 'admin' && 
        report.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await ASCOMPReport.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'ASCOMP report deleted successfully' });
  } catch (error) {
    console.error('Error deleting ASCOMP report:', error);
    res.status(500).json({ 
      message: 'Error deleting report', 
      error: error.message 
    });
  }
});

// Approve ASCOMP report (Manager/Admin only)
router.post('/:id/approve', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const report = await ASCOMPReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.status = 'Approved';
    report.approvedBy = req.user._id;
    report.approvedAt = new Date();
    
    await report.save();
    
    const approvedReport = await ASCOMPReport.findById(report._id)
      .populate('engineer.userId', 'username email')
      .populate('approvedBy', 'username email');
    
    res.json({
      message: 'ASCOMP report approved successfully',
      report: approvedReport
    });
  } catch (error) {
    console.error('Error approving ASCOMP report:', error);
    res.status(500).json({ 
      message: 'Error approving report', 
      error: error.message 
    });
  }
});

// Get dashboard stats for ASCOMP reports
router.get('/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'fse' 
      ? { 'engineer.userId': req.user._id } 
      : {};
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [totalReports, todayReports, monthlyReports, statusCounts] = await Promise.all([
      ASCOMPReport.countDocuments(query),
      ASCOMPReport.countDocuments({ ...query, createdAt: { $gte: today } }),
      ASCOMPReport.countDocuments({ ...query, createdAt: { $gte: firstDayOfMonth } }),
      ASCOMPReport.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item._id || 'Draft'] = item.count;
    });
    
    res.json({
      totalReports,
      todayReports,
      monthlyReports,
      statusBreakdown: statusMap
    });
  } catch (error) {
    console.error('Error fetching ASCOMP report stats:', error);
    res.status(500).json({ 
      message: 'Error fetching stats', 
      error: error.message 
    });
  }
});

module.exports = router;

