const express = require('express');
const router = express.Router();
const ASCOMPReport = require('../models/ASCOMPReport');
const ServiceReport = require('../models/ServiceReport');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all ASCOMP reports (from both ASCOMPReport and ServiceReport collections)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, cinemaName, engineerId, startDate, endDate } = req.query;
    
    // Query for ASCOMPReport collection
    const ascompQuery = {};
    
    // Filter by status
    if (status && status !== 'all') {
      ascompQuery.status = status;
    }
    
    // Filter by cinema name
    if (cinemaName) {
      ascompQuery.cinemaName = { $regex: cinemaName, $options: 'i' };
    }
    
    // Filter by engineer
    if (engineerId) {
      ascompQuery['engineer.userId'] = engineerId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      ascompQuery.date = {};
      if (startDate) ascompQuery.date.$gte = new Date(startDate);
      if (endDate) ascompQuery.date.$lte = new Date(endDate);
    }
    
    // If user is FSE, show only their reports
    if (req.user.role === 'fse') {
      ascompQuery['engineer.userId'] = req.user._id;
    }
    
    // Query for ServiceReport collection (reports with ASCOMP- prefix)
    const serviceReportQuery = {
      reportNumber: { $regex: '^ASCOMP-', $options: 'i' }
    };
    
    // Apply filters to ServiceReport query
    if (status && status !== 'all') {
      serviceReportQuery.status = status;
    }
    
    if (cinemaName) {
      serviceReportQuery.siteName = { $regex: cinemaName, $options: 'i' };
    }
    
    if (engineerId) {
      serviceReportQuery['engineer.userId'] = engineerId;
    } else if (req.user.role === 'fse') {
      // Filter by engineer name for FSE users
      serviceReportQuery['engineer.name'] = req.user.name || req.user.username;
    }
    
    if (startDate || endDate) {
      serviceReportQuery.date = {};
      if (startDate) serviceReportQuery.date.$gte = new Date(startDate);
      if (endDate) serviceReportQuery.date.$lte = new Date(endDate);
    }
    
    // Fetch reports from both collections
    const [ascompReports, serviceReports] = await Promise.all([
      ASCOMPReport.find(ascompQuery)
        .sort({ date: -1, createdAt: -1 })
        .populate('engineer.userId', 'username email')
        .populate('createdBy', 'username email')
        .lean(),
      ServiceReport.find(serviceReportQuery)
        .sort({ date: -1, createdAt: -1 })
        .lean()
    ]);
    
    // Transform ServiceReport documents to match ASCOMPReport format
    const transformedServiceReports = serviceReports.map(report => ({
      ...report,
      _id: report._id,
      reportNumber: report.reportNumber,
      date: report.date || report.createdAt,
      cinemaName: report.siteName,
      address: report.siteAddress || '',
      location: report.siteName || '',
      engineer: {
        name: report.engineer?.name || '',
        phone: report.engineer?.phone || '',
        email: report.engineer?.email || '',
        userId: report.engineer?.userId || report.createdBy
      },
      status: report.status || 'Submitted',
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));
    
    // Combine and sort all reports
    const allReports = [...ascompReports, ...transformedServiceReports].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
    
    console.log(`📊 Found ${ascompReports.length} ASCOMPReport and ${serviceReports.length} ServiceReport with ASCOMP- prefix`);
    
    res.json(allReports);
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
    // Try ASCOMPReport first
    let report = await ASCOMPReport.findById(req.params.id)
      .populate('engineer.userId', 'username email phone')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email')
      .lean();
    
    // If not found, try ServiceReport (for reports with ASCOMP- prefix)
    if (!report) {
      const serviceReport = await ServiceReport.findById(req.params.id).lean();
      if (serviceReport && serviceReport.reportNumber?.startsWith('ASCOMP-')) {
        // Transform ServiceReport to match ASCOMPReport format
        report = {
          ...serviceReport,
          cinemaName: serviceReport.siteName,
          address: serviceReport.siteAddress || '',
          location: serviceReport.siteName || '',
          engineer: {
            name: serviceReport.engineer?.name || '',
            phone: serviceReport.engineer?.phone || '',
            email: serviceReport.engineer?.email || '',
            userId: serviceReport.engineer?.userId || serviceReport.createdBy
          },
          status: serviceReport.status || 'Submitted',
          date: serviceReport.date || serviceReport.createdAt
        };
      }
    }
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has access
    if (req.user.role === 'fse') {
      const engineerUserId = report.engineer?.userId?._id?.toString() || report.engineer?.userId?.toString();
      if (engineerUserId && engineerUserId !== req.user._id.toString()) {
        // Also check by engineer name if userId doesn't match
        const engineerName = report.engineer?.name || '';
        const userName = req.user.name || req.user.username || '';
        if (engineerName !== userName) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
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

// Bulk import ASCOMP reports from CSV with Drive links
router.post('/bulk-import', authenticateToken, authorizeRoles(['admin', 'manager']), async (req, res) => {
  const multer = require('multer');
  const csvParser = require('csv-parser');
  const { Readable } = require('stream');
  const cloudinary = require('cloudinary').v2;
  const path = require('path');
  const fs = require('fs');
  
  const { mapCSVRowToASCOMPReport, validateCSVRow } = require('../utils/csvToASCOMPMapper');
  const GoogleDriveService = require('../services/googleDriveService');
  const ASCOMPPdfGeneratorService = require('../services/ascompPdfGeneratorService');
  
  // Configure multer for CSV upload
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    }
  });
  
  // Use multer middleware
  upload.single('csvFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }
    
    try {
      console.log('📁 Starting bulk import from CSV...');
      
      const results = {
        total: 0,
        success: 0,
        failed: 0,
        reports: [],
        errors: []
      };
      
      // Parse CSV
      const rows = [];
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      
      console.log(`📊 Parsed ${rows.length} rows from CSV`);
      results.total = rows.length;
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 1;
        
        try {
          // Validate row
          const validation = validateCSVRow(row, rowIndex);
          if (!validation.valid) {
            results.failed++;
            results.errors.push({
              row: rowIndex,
              errors: validation.errors
            });
            continue;
          }
          
          // Map CSV to ASCOMP report data
          const reportData = mapCSVRowToASCOMPReport(row);
          
          // Add metadata
          reportData.createdBy = req.user._id;
          reportData.status = reportData.status || 'Submitted';
          
          // Create report in database
          const newReport = await ASCOMPReport.create(reportData);
          console.log(`✅ Created report ${rowIndex}/${rows.length}: ${newReport.reportNumber}`);
          
          // Process original PDF from Drive link (if provided)
          if (row.driveLink && GoogleDriveService.isGoogleDriveUrl(row.driveLink)) {
            try {
              console.log(`📥 Downloading PDF from Drive for ${newReport.reportNumber}...`);
              
              const { buffer, metadata } = await GoogleDriveService.downloadFileWithMetadata(row.driveLink);
              
              // Upload to Cloudinary
              const tempPath = path.join(__dirname, '../../tmp', `original_${newReport._id}.pdf`);
              fs.writeFileSync(tempPath, buffer);
              
              const cloudinaryResult = await cloudinary.uploader.upload(tempPath, {
                folder: 'ascomp-reports/original',
                resource_type: 'raw',
                public_id: `original_${newReport.reportNumber}`
              });
              
              // Clean up temp file
              fs.unlinkSync(tempPath);
              
              // Update report with original PDF info
              newReport.originalPdfReport = {
                filename: `original_${newReport.reportNumber}.pdf`,
                originalName: `${newReport.reportNumber}_original.pdf`,
                cloudUrl: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
                uploadedAt: new Date(),
                uploadedBy: req.user._id,
                source: 'drive',
                driveLink: row.driveLink,
                fileSize: metadata.size,
                mimeType: metadata.mimeType
              };
              
              console.log(`✅ Original PDF uploaded to Cloudinary for ${newReport.reportNumber}`);
            } catch (pdfError) {
              console.warn(`⚠️ Failed to download/upload original PDF for ${newReport.reportNumber}:`, pdfError.message);
              results.errors.push({
                row: rowIndex,
                reportNumber: newReport.reportNumber,
                warning: `Original PDF upload failed: ${pdfError.message}`
              });
            }
          }
          
          // Generate new formatted PDF
          try {
            console.log(`📄 Generating formatted PDF for ${newReport.reportNumber}...`);
            
            const pdfBuffer = await ASCOMPPdfGeneratorService.generatePDF(newReport.toObject());
            
            // Upload generated PDF to Cloudinary
            const tempPath = path.join(__dirname, '../../tmp', `generated_${newReport._id}.pdf`);
            fs.writeFileSync(tempPath, pdfBuffer);
            
            const cloudinaryResult = await cloudinary.uploader.upload(tempPath, {
              folder: 'ascomp-reports/generated',
              resource_type: 'raw',
              public_id: `generated_${newReport.reportNumber}`
            });
            
            // Clean up temp file
            fs.unlinkSync(tempPath);
            
            // Update report with generated PDF info
            newReport.generatedPdfReport = {
              filename: `${newReport.reportNumber}.pdf`,
              cloudUrl: cloudinaryResult.secure_url,
              publicId: cloudinaryResult.public_id,
              generatedAt: new Date()
            };
            
            console.log(`✅ Generated PDF uploaded to Cloudinary for ${newReport.reportNumber}`);
          } catch (pdfError) {
            console.warn(`⚠️ Failed to generate PDF for ${newReport.reportNumber}:`, pdfError.message);
            results.errors.push({
              row: rowIndex,
              reportNumber: newReport.reportNumber,
              warning: `PDF generation failed: ${pdfError.message}`
            });
          }
          
          // Save report with PDF info
          await newReport.save();
          
          results.success++;
          results.reports.push({
            row: rowIndex,
            reportNumber: newReport.reportNumber,
            reportId: newReport._id,
            hasOriginalPdf: !!newReport.originalPdfReport?.cloudUrl,
            hasGeneratedPdf: !!newReport.generatedPdfReport?.cloudUrl
          });
          
        } catch (rowError) {
          console.error(`❌ Error processing row ${rowIndex}:`, rowError);
          results.failed++;
          results.errors.push({
            row: rowIndex,
            error: rowError.message
          });
        }
      }
      
      console.log(`✅ Bulk import completed: ${results.success} success, ${results.failed} failed`);
      
      res.status(200).json({
        message: 'Bulk import completed',
        results
      });
      
    } catch (error) {
      console.error('❌ Bulk import error:', error);
      res.status(500).json({ 
        message: 'Error during bulk import', 
        error: error.message 
      });
    }
  });
});

// Download CSV template for bulk import (NO AUTH REQUIRED - PUBLIC ENDPOINT)
router.get('/csv-template', (req, res) => {
  try {
    console.log('🎯🎯🎯 NEW CODE: CSV template download requested - NO AUTH REQUIRED 🎯🎯🎯');
    
    const { generateCSVTemplate } = require('../utils/csvToASCOMPMapper');
    const csvContent = generateCSVTemplate();
    
    console.log('✅ CSV template generated successfully, length:', csvContent.length);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ascomp_report_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Custom-Header', 'ASCOMP-CSV-Template-v2');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('❌ Error generating CSV template:', error);
    res.status(500).json({ 
      message: 'Error generating CSV template', 
      error: error.message 
    });
  }
});

module.exports = router;

