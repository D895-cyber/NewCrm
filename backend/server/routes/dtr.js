const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DTR = require('../models/DTR');
const Projector = require('../models/Projector');
const Site = require('../models/Site');
const RMA = require('../models/RMA');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/dtr-attachments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow images and zip files
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and ZIP files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to fix malformed dates
function fixMalformedDate(dateValue) {
  if (!dateValue) return dateValue;
  
  const dateStr = dateValue.toString();
  
  // Fix malformed date strings with pattern +XXXXXX-12-31T18:30:00.000Z
  const malformedPattern = /^\+(\d{6})-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  const match = dateStr.match(malformedPattern);
  
  if (match) {
    const serialNumber = parseInt(match[1]);
    console.log('🔧 Backend fixing malformed date:', dateStr);
    console.log('🔧 Converting serial number:', serialNumber);
    
    // Convert as Excel serial number
    const excelEpoch = new Date(1900, 0, 1);
    const daysSinceEpoch = serialNumber - 2;
    const fixedDate = new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
    console.log('🔧 Backend fixed date:', fixedDate);
    return fixedDate;
  }
  
  return dateValue;
}

// Get all DTRs with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, siteName, serialNumber, startDate, endDate, callStatus, caseSeverity } = req.query;
    
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (siteName) filter.siteName = { $regex: siteName, $options: 'i' };
    if (serialNumber) filter.serialNumber = { $regex: serialNumber, $options: 'i' };
    // New filters
    if (callStatus) filter.callStatus = callStatus;
    if (caseSeverity) filter.caseSeverity = caseSeverity;
    
    if (startDate || endDate) {
      filter.complaintDate = {};
      if (startDate) filter.complaintDate.$gte = new Date(startDate);
      if (endDate) filter.complaintDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const dtrs = await DTR.find(filter)
      .sort({ complaintDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('rmaCaseNumber', 'rmaNumber status');
    
    // Fix malformed dates in the response
    const fixedDtrs = dtrs.map(dtr => {
      const fixedDtr = { ...dtr.toObject() };
      
      // Fix errorDate
      if (fixedDtr.errorDate) {
        fixedDtr.errorDate = fixMalformedDate(fixedDtr.errorDate);
      }
      
      // Fix complaintDate
      if (fixedDtr.complaintDate) {
        fixedDtr.complaintDate = fixMalformedDate(fixedDtr.complaintDate);
      }
      
      // Fix closedBy.closedDate
      if (fixedDtr.closedBy && fixedDtr.closedBy.closedDate) {
        fixedDtr.closedBy.closedDate = fixMalformedDate(fixedDtr.closedBy.closedDate);
      }
      
      return fixedDtr;
    });
    
    const total = await DTR.countDocuments(filter);
    
    res.json({
      dtrs: fixedDtrs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DTRs', error: error.message });
  }
});

// Get DTR by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const dtr = await DTR.findById(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Fix malformed dates in the response
    const fixedDtr = { ...dtr.toObject() };
    
    // Fix errorDate
    if (fixedDtr.errorDate) {
      fixedDtr.errorDate = fixMalformedDate(fixedDtr.errorDate);
    }
    
    // Fix complaintDate
    if (fixedDtr.complaintDate) {
      fixedDtr.complaintDate = fixMalformedDate(fixedDtr.complaintDate);
    }
    
    // Fix closedBy.closedDate
    if (fixedDtr.closedBy && fixedDtr.closedBy.closedDate) {
      fixedDtr.closedBy.closedDate = fixMalformedDate(fixedDtr.closedBy.closedDate);
    }
    
    res.json(fixedDtr);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DTR', error: error.message });
  }
});

// Create new DTR
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission to create DTR (only admin and rma_manager)
    if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      return res.status(403).json({ 
        message: 'Insufficient permissions. Only RMA Managers can create DTRs.' 
      });
    }

    const {
      serialNumber,
      complaintDescription,
      openedBy,
      priority,
      assignedTo,
      estimatedResolutionTime,
      notes,
      // New fields
      errorDate,
      unitModel,
      problemName,
      actionTaken,
      remarks,
      callStatus,
      caseSeverity
    } = req.body;
    
    // Validate required fields
    if (!serialNumber || !complaintDescription || !openedBy) {
      return res.status(400).json({ message: 'Serial number, complaint description, and opened by are required' });
    }
    
    // Check if projector exists
    const projector = await Projector.findOne({ serialNumber });
    if (!projector) {
      return res.status(400).json({ message: 'Projector with this serial number not found' });
    }
    
    // Get site details
    const site = await Site.findById(projector.siteId);
    if (!site) {
      return res.status(400).json({ message: 'Site not found for this projector' });
    }
    
    const dtrData = {
      serialNumber,
      complaintDescription,
      openedBy: {
        ...openedBy,
        userId: req.user.userId // Track the actual user who created the DTR
      },
      priority,
      assignedTo: assignedTo ? (typeof assignedTo === 'string' ? {
        name: assignedTo,
        role: 'technician',
        assignedDate: new Date()
      } : assignedTo) : null,
      estimatedResolutionTime,
      notes,
      // New fields
      errorDate: errorDate || new Date(),
      unitModel: unitModel || projector.model,
      problemName: problemName || complaintDescription,
      actionTaken,
      remarks,
      callStatus: callStatus || 'Open',
      caseSeverity: caseSeverity || 'Minor',
      siteName: site.name,
      siteCode: site.siteCode || site.name,
      region: site.region || site.address?.state,
      auditorium: (() => {
        console.log('🔍 Debugging auditorium for projector:', projector.serialNumber);
        console.log('🔍 Projector auditoriumId:', projector.auditoriumId);
        console.log('🔍 Site auditoriums:', site.auditoriums);
        
        if (projector.auditoriumId && site.auditoriums) {
          const auditorium = site.auditoriums.find(aud => aud._id.toString() === projector.auditoriumId.toString());
          console.log('🔍 Found auditorium:', auditorium);
          return auditorium ? auditorium.name : null;
        }
        console.log('🔍 No auditorium data available');
        return null;
      })()
    };
    
    const dtr = new DTR(dtrData);
    await dtr.save();
    
    res.status(201).json(dtr);
  } catch (error) {
    res.status(500).json({ message: 'Error creating DTR', error: error.message });
  }
});

// Update DTR
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update DTR request:', { id: req.params.id, body: req.body });
    
    const {
      status,
      closedReason,
      closedBy,
      assignedTo,
      priority,
      estimatedResolutionTime,
      actualResolutionTime,
      notes,
      attachments,
      // New fields
      callStatus,
      caseSeverity,
      actionTaken,
      remarks,
      closedRemarks
    } = req.body;
    
    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    
    // Handle closedReason based on status
    if (status === 'Shifted to RMA') {
      updateData.closedReason = 'Shifted to RMA';
    } else if (closedReason !== undefined && closedReason !== '') {
      // Only set closedReason if it's not empty and is a valid enum value
      updateData.closedReason = closedReason;
    }
    
    if (closedBy !== undefined) {
      updateData.closedBy = {
        ...closedBy,
        userId: req.user.userId, // Track the actual user who closed the DTR
        closedDate: status === 'Closed' ? new Date() : closedBy.closedDate
      };
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = typeof assignedTo === 'string' ? {
        name: assignedTo,
        role: 'technician',
        assignedDate: new Date()
      } : assignedTo;
    }
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedResolutionTime !== undefined) updateData.estimatedResolutionTime = estimatedResolutionTime;
    if (actualResolutionTime !== undefined) updateData.actualResolutionTime = actualResolutionTime;
    if (notes !== undefined) updateData.notes = notes;
    if (attachments !== undefined) updateData.attachments = attachments;
    // New fields
    if (callStatus !== undefined) updateData.callStatus = callStatus;
    if (caseSeverity !== undefined) updateData.caseSeverity = caseSeverity;
    if (actionTaken !== undefined) updateData.actionTaken = actionTaken;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (closedRemarks !== undefined) updateData.closedRemarks = closedRemarks;
    
    console.log('Update data prepared:', updateData);
    
    // If closing the DTR, set closed date
    if (status === 'Closed' && closedBy && updateData.closedBy && !updateData.closedBy.closedDate) {
      updateData.closedBy.closedDate = new Date();
    }
    
    console.log('Updating DTR in database with ID:', req.params.id);
    const dtr = await DTR.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!dtr) {
      console.log('DTR not found with ID:', req.params.id);
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Create RMA if status is "Shifted to RMA" and no RMA exists yet
    if (dtr.status === 'Shifted to RMA' && !dtr.rmaCaseNumber) {
      try {
        console.log('Creating RMA for DTR:', dtr.caseId);
        const rma = new RMA({
          // Core RMA Information
          rmaNumber: undefined, // Let pre-save hook generate this
          callLogNumber: `DTR-${dtr.caseId}`,
          rmaOrderNumber: `ORDER-${dtr.caseId}`,
          
          // Date Fields
          ascompRaisedDate: new Date(),
          customerErrorDate: dtr.errorDate || new Date(),
          
          // Site and Product Information
          siteName: dtr.siteName,
          productName: dtr.projectorDetails?.model || 'Unknown',
          productPartNumber: dtr.projectorDetails?.partNumber || 'N/A',
          serialNumber: dtr.serialNumber,
          
          // Defective Part Details
          defectivePartNumber: dtr.projectorDetails?.partNumber || 'N/A',
          defectivePartName: dtr.projectorDetails?.partName || 'Projector Component',
          defectiveSerialNumber: dtr.serialNumber,
          symptoms: dtr.complaintDescription,
          
          // Legacy fields for backward compatibility
          projectorSerial: dtr.serialNumber,
          brand: dtr.projectorDetails?.brand || 'Unknown',
          projectorModel: dtr.projectorDetails?.model || 'Unknown',
          customerSite: dtr.siteName,
          
          // Status and Workflow
          caseStatus: 'Under Review',
          status: 'Under Review', // Keep both for compatibility
          
          // Additional Information
          createdBy: dtr.assignedTo || 'System',
          technician: dtr.assignedTo || 'Unassigned',
          assignedTo: dtr.assignedTo || 'Unassigned',
          
          priority: dtr.priority === 'Critical' ? 'High' : dtr.priority,
          warrantyStatus: dtr.projectorDetails?.warrantyEnd && dtr.projectorDetails.warrantyEnd > new Date() ? 'In Warranty' : 'Out of Warranty',
          estimatedCost: 0,
          notes: `Auto-generated from DTR: ${dtr.caseId}. Complaint: ${dtr.complaintDescription}`,
          
          // Map old fields for compatibility
          issueDate: new Date(),
          reason: dtr.complaintDescription,
          expectedResolution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        
        const savedRMA = await rma.save();
        console.log('RMA created successfully:', savedRMA.rmaNumber);
        
        // Update DTR with RMA case number
        await DTR.findByIdAndUpdate(dtr._id, {
          rmaCaseNumber: savedRMA.rmaNumber
        });
        
        // Update the response to include the RMA case number
        dtr.rmaCaseNumber = savedRMA.rmaNumber;
      } catch (error) {
        console.error('Error creating RMA from DTR:', error);
        // Don't fail the DTR update if RMA creation fails
      }
    }
    
    console.log('DTR updated successfully:', dtr);
    res.json(dtr);
  } catch (error) {
    res.status(500).json({ message: 'Error updating DTR', error: error.message });
  }
});

// Bulk delete DTRs
router.delete('/bulk-delete', auth, async (req, res) => {
  try {
    // Debug logging
    console.log('🔍 Bulk delete request received');
    console.log('📦 Request body:', req.body);
    console.log('📋 Request headers:', req.headers);
    
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      return res.status(403).json({ message: 'Insufficient permissions for bulk delete' });
    }

    const { dtrIds } = req.body.data || req.body;
    
    console.log('🎯 Extracted dtrIds:', dtrIds);
    console.log('📊 Is dtrIds an array?', Array.isArray(dtrIds));
    console.log('📏 dtrIds length:', dtrIds ? dtrIds.length : 'N/A');
    
    if (!dtrIds || !Array.isArray(dtrIds) || dtrIds.length === 0) {
      console.log('❌ Validation failed: dtrIds is missing, not array, or empty');
      return res.status(400).json({ message: 'DTR IDs array is required' });
    }

    if (dtrIds.length > 1000) {
      console.log('❌ Validation failed: too many DTRs');
      return res.status(400).json({ message: 'Maximum 1000 DTRs can be deleted at once' });
    }

    console.log(`🗑️ Bulk deleting ${dtrIds.length} DTRs`);
    console.log('🔍 DTR IDs to delete:', dtrIds);

    // Delete DTRs
    const result = await DTR.deleteMany({ _id: { $in: dtrIds } });
    
    console.log(`✅ MongoDB deleteMany result:`, result);
    console.log(`✅ Successfully deleted ${result.deletedCount} DTRs`);
    
    // Verify deletion by checking if any of the DTRs still exist
    const remainingDTRs = await DTR.find({ _id: { $in: dtrIds } });
    console.log(`🔍 Remaining DTRs after deletion:`, remainingDTRs.length);
    
    res.json({
      message: `Successfully deleted ${result.deletedCount} DTRs`,
      deletedCount: result.deletedCount,
      requestedCount: dtrIds.length
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ 
      message: 'Bulk delete failed', 
      error: error.message
    });
  }
});

// Delete DTR
router.delete('/:id', auth, async (req, res) => {
  try {
    const dtr = await DTR.findByIdAndDelete(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    res.json({ message: 'DTR deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting DTR', error: error.message });
  }
});

// Get projector details by serial number
router.get('/lookup/projector/:serialNumber', auth, async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    const projector = await Projector.findOne({ serialNumber });
    if (!projector) {
      return res.status(404).json({ message: 'Projector not found' });
    }
    
    const site = await Site.findById(projector.siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Get service reports for this projector to calculate hours and service count
    const ServiceReport = require('../models/ServiceReport');
    const projectorReports = await ServiceReport.find({ 
      projectorSerial: serialNumber 
    }).sort({ date: -1 });
    
    // Calculate total hours from service reports
    let totalHours = 0;
    let totalServices = 0;
    let lastServiceDate = null;
    
    if (projectorReports.length > 0) {
      totalServices = projectorReports.length;
      lastServiceDate = new Date(Math.max(...projectorReports.map(r => new Date(r.date).getTime())));
      
      // Sum up hours from all reports
      projectorReports.forEach(report => {
        if (report.projectorRunningHours && !isNaN(Number(report.projectorRunningHours))) {
          totalHours += Number(report.projectorRunningHours);
        }
      });
    }
    
    // Calculate life percentage based on expected life
    const lifePercentage = projector.expectedLife ? Math.round((totalHours / projector.expectedLife) * 100) : 0;
    
    // Calculate next service date (estimate based on last service + typical interval)
    const nextServiceDate = lastServiceDate 
      ? new Date(lastServiceDate.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 days default
      : null;
    
    const projectorInfo = {
      serialNumber: projector.serialNumber,
      model: projector.model,
      brand: projector.brand,
      installDate: projector.installDate,
      warrantyEnd: projector.warrantyEnd,
      lastService: lastServiceDate,
      nextService: nextServiceDate,
      totalServices,
      hoursUsed: totalHours,
      lifePercentage,
      condition: projector.condition,
      primaryTechnician: projector.primaryTechnician,
      auditoriumId: projector.auditoriumId,
      site: {
        name: site.name,
        code: site.siteCode || site.name,
        region: site.region || site.address?.state,
        address: site.address,
        auditoriums: site.auditoriums || []
      }
    };
    
    res.json(projectorInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error looking up projector', error: error.message });
  }
});

// Get DTR statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalDTRs = await DTR.countDocuments();
    const openDTRs = await DTR.countDocuments({ status: 'Open' });
    const inProgressDTRs = await DTR.countDocuments({ status: 'In Progress' });
    const closedDTRs = await DTR.countDocuments({ status: 'Closed' });
    const shiftedToRMA = await DTR.countDocuments({ status: 'Shifted to RMA' });
    
    // Priority breakdown
    const priorityStats = await DTR.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await DTR.aggregate([
      { $match: { complaintDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$complaintDate' },
            month: { $month: '$complaintDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      total: totalDTRs,
      open: openDTRs,
      inProgress: inProgressDTRs,
      closed: closedDTRs,
      shiftedToRMA,
      priorityBreakdown: priorityStats,
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DTR statistics', error: error.message });
  }
});

// Get DTRs by site
router.get('/site/:siteName', auth, async (req, res) => {
  try {
    const { siteName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const dtrs = await DTR.find({ siteName: { $regex: siteName, $options: 'i' } })
      .sort({ complaintDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DTR.countDocuments({ siteName: { $regex: siteName, $options: 'i' } });
    
    res.json({
      dtrs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DTRs by site', error: error.message });
  }
});

// Add troubleshooting step to DTR
router.post('/:id/troubleshooting', auth, async (req, res) => {
  try {
    const { description, outcome, attachments } = req.body;
    
    if (!description || !outcome) {
      return res.status(400).json({ message: 'Description and outcome are required' });
    }
    
    const dtr = await DTR.findById(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Check if user has permission (technician, engineer, or admin)
    // Technicians can only add troubleshooting to their assigned DTRs
    if (req.user.role === 'technician' || req.user.role === 'engineer') {
      if (dtr.assignedTo?.userId !== req.user.userId && dtr.assignedTo?.userId !== req.user._id) {
        return res.status(403).json({ 
          message: 'You can only add troubleshooting steps to DTRs assigned to you' 
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions to add troubleshooting steps' });
    }
    
    const step = {
      step: (dtr.troubleshootingSteps?.length || 0) + 1,
      description,
      outcome,
      performedBy: req.user.username || req.user.email,
      performedAt: new Date(),
      attachments: attachments || []
    };
    
    if (!dtr.troubleshootingSteps) {
      dtr.troubleshootingSteps = [];
    }
    dtr.troubleshootingSteps.push(step);
    
    // Add to workflow history
    if (!dtr.workflowHistory) {
      dtr.workflowHistory = [];
    }
    dtr.workflowHistory.push({
      action: 'troubleshooting_added',
      performedBy: {
        name: req.user.username || req.user.email,
        role: req.user.role
      },
      timestamp: new Date(),
      details: `Added troubleshooting step ${step.step}`
    });
    
    await dtr.save();
    
    res.json(dtr);
  } catch (error) {
    res.status(500).json({ message: 'Error adding troubleshooting step', error: error.message });
  }
});

// Mark DTR as ready for RMA conversion
router.post('/:id/mark-for-conversion', auth, async (req, res) => {
  try {
    const { conversionReason } = req.body;
    
    if (!conversionReason) {
      return res.status(400).json({ message: 'Conversion reason is required' });
    }
    
    const dtr = await DTR.findById(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Check if user has permission (technician/engineer can only mark their assigned DTRs)
    if (req.user.role === 'technician' || req.user.role === 'engineer') {
      if (dtr.assignedTo?.userId !== req.user.userId && dtr.assignedTo?.userId !== req.user._id) {
        return res.status(403).json({ 
          message: 'You can only mark DTRs assigned to you for conversion' 
        });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      return res.status(403).json({ message: 'Insufficient permissions to mark for conversion' });
    }
    
    // Update conversion tracking
    dtr.conversionToRMA = {
      canConvert: true,
      conversionReason,
      convertedBy: req.user.username || req.user.email,
      convertedDate: null // Will be set when actually converted
    };
    
    // Add to workflow history
    if (!dtr.workflowHistory) {
      dtr.workflowHistory = [];
    }
    dtr.workflowHistory.push({
      action: 'escalated',
      performedBy: {
        name: req.user.username || req.user.email,
        role: req.user.role
      },
      timestamp: new Date(),
      details: `Marked for RMA conversion: ${conversionReason}`
    });
    
    await dtr.save();
    
    res.json(dtr);
  } catch (error) {
    res.status(500).json({ message: 'Error marking DTR for conversion', error: error.message });
  }
});

// Convert DTR to RMA (Enhanced version)
router.post('/:id/convert-to-rma', auth, async (req, res) => {
  try {
    const { rmaManagerId, rmaManagerName, rmaManagerEmail, additionalNotes } = req.body;
    
    const dtr = await DTR.findById(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Check if already converted
    if (dtr.status === 'Shifted to RMA' && dtr.rmaCaseNumber) {
      return res.status(400).json({ message: 'DTR already converted to RMA', rmaNumber: dtr.rmaCaseNumber });
    }
    
    // Check if user has permission (technician/engineer can only convert their assigned DTRs)
    if (req.user.role === 'technician' || req.user.role === 'engineer') {
      if (dtr.assignedTo?.userId !== req.user.userId && dtr.assignedTo?.userId !== req.user._id) {
        return res.status(403).json({ 
          message: 'You can only convert DTRs assigned to you to RMA' 
        });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      return res.status(403).json({ message: 'Insufficient permissions to convert DTR to RMA' });
    }
    
    // Get projector details for RMA
    const projector = await Projector.findOne({ serialNumber: dtr.serialNumber });
    
    // Compile troubleshooting history for RMA notes
    let troubleshootingHistory = '';
    if (dtr.troubleshootingSteps && dtr.troubleshootingSteps.length > 0) {
      troubleshootingHistory = '\n\nTroubleshooting History:\n';
      dtr.troubleshootingSteps.forEach(step => {
        troubleshootingHistory += `\nStep ${step.step}: ${step.description}\nOutcome: ${step.outcome}\nPerformed by: ${step.performedBy} on ${new Date(step.performedAt).toLocaleDateString()}\n`;
      });
    }
    
    // Create RMA
    const rma = new RMA({
      // Core RMA Information
      callLogNumber: `DTR-${dtr.caseId}`,
      rmaOrderNumber: `ORDER-${dtr.caseId}`,
      
      // Date Fields
      ascompRaisedDate: new Date(),
      customerErrorDate: dtr.errorDate || dtr.complaintDate || new Date(),
      
      // Site and Product Information
      siteName: dtr.siteName,
      productName: dtr.unitModel || dtr.projectorDetails?.model || 'Unknown',
      productPartNumber: projector?.partNumber || 'N/A',
      serialNumber: dtr.serialNumber,
      
      // Defective Part Details
      defectivePartNumber: projector?.partNumber || 'N/A',
      defectivePartName: dtr.problemName || 'Projector Component',
      defectiveSerialNumber: dtr.serialNumber,
      symptoms: dtr.complaintDescription,
      
      // Legacy fields for backward compatibility
      projectorSerial: dtr.serialNumber,
      brand: projector?.brand || dtr.projectorDetails?.brand || 'Unknown',
      projectorModel: dtr.unitModel || dtr.projectorDetails?.model || 'Unknown',
      customerSite: dtr.siteName,
      
      // DTR Integration
      originatedFromDTR: {
        dtrId: dtr._id,
        dtrCaseId: dtr.caseId,
        conversionDate: new Date(),
        conversionReason: dtr.conversionToRMA?.conversionReason || 'Issue unresolved after troubleshooting',
        technician: {
          name: req.user.username || req.user.email,
          userId: req.user.userId || req.user._id
        }
      },
      
      // RMA Manager Assignment
      rmaManager: rmaManagerId ? {
        userId: rmaManagerId,
        name: rmaManagerName,
        email: rmaManagerEmail,
        assignedDate: new Date()
      } : undefined,
      
      // Status and Workflow
      caseStatus: 'Under Review',
      approvalStatus: 'Pending Review',
      
      // Additional Information
      createdBy: req.user.username || req.user.email,
      
      priority: dtr.priority === 'Critical' ? 'High' : dtr.priority,
      warrantyStatus: projector?.warrantyEnd && new Date(projector.warrantyEnd) > new Date() ? 'In Warranty' : 'Out of Warranty',
      estimatedCost: 0,
      notes: `Auto-generated from DTR: ${dtr.caseId}\n\nOriginal Complaint: ${dtr.complaintDescription}\n\nAction Taken: ${dtr.actionTaken || 'N/A'}\n\nRemarks: ${dtr.remarks || 'N/A'}${troubleshootingHistory}\n\n${additionalNotes || ''}`
    });
    
    const savedRMA = await rma.save();
    
    // Update DTR
    dtr.status = 'Shifted to RMA';
    dtr.closedReason = 'Shifted to RMA';
    dtr.rmaCaseNumber = savedRMA.rmaNumber;
    
    if (dtr.conversionToRMA) {
      dtr.conversionToRMA.convertedDate = new Date();
      if (rmaManagerId) {
        dtr.conversionToRMA.rmaManagerAssigned = {
          userId: rmaManagerId,
          name: rmaManagerName,
          email: rmaManagerEmail
        };
      }
    }
    
    // Add to workflow history
    if (!dtr.workflowHistory) {
      dtr.workflowHistory = [];
    }
    dtr.workflowHistory.push({
      action: 'converted_to_rma',
      performedBy: {
        name: req.user.username || req.user.email,
        role: req.user.role
      },
      timestamp: new Date(),
      details: `Converted to RMA ${savedRMA.rmaNumber}`,
      newValue: savedRMA.rmaNumber
    });
    
    await dtr.save();
    
    res.status(201).json({
      message: 'DTR successfully converted to RMA',
      dtr,
      rma: savedRMA
    });
  } catch (error) {
    console.error('Error converting DTR to RMA:', error);
    res.status(500).json({ message: 'Error converting DTR to RMA', error: error.message });
  }
});

// Assign technician to DTR
router.post('/:id/assign-technician', auth, async (req, res) => {
  try {
    const { technicianId, technicianName, technicianEmail, role } = req.body;
    
    if (!technicianId || !technicianName) {
      return res.status(400).json({ message: 'Technician ID and name are required' });
    }
    
    const dtr = await DTR.findById(req.params.id);
    if (!dtr) {
      return res.status(404).json({ message: 'DTR not found' });
    }
    
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      return res.status(403).json({ message: 'Insufficient permissions to assign technician' });
    }
    
    const previousAssignee = dtr.assignedTo?.name || 'Unassigned';
    
    dtr.assignedTo = {
      userId: technicianId,
      name: technicianName,
      email: technicianEmail,
      role: role || 'technician',
      assignedDate: new Date()
    };
    
    // Update status if it's Open
    if (dtr.status === 'Open') {
      dtr.status = 'In Progress';
    }
    
    // Add to workflow history
    if (!dtr.workflowHistory) {
      dtr.workflowHistory = [];
    }
    dtr.workflowHistory.push({
      action: 'assigned',
      performedBy: {
        name: req.user.username || req.user.email,
        role: req.user.role
      },
      timestamp: new Date(),
      details: `Assigned to ${technicianName}`,
      previousValue: previousAssignee,
      newValue: technicianName
    });
    
    await dtr.save();
    
    res.json(dtr);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning technician', error: error.message });
  }
});

// Bulk import DTRs
router.post('/bulk-import', auth, async (req, res) => {
  const startTime = Date.now();
  console.log(`🚀 Bulk import started at ${new Date().toISOString()}`);
  
  // Set a timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.log('⏰ Bulk import timeout after 5 minutes');
    if (!res.headersSent) {
      res.status(408).json({ 
        message: 'Import timeout - process took too long',
        error: 'Request timeout after 5 minutes'
      });
    }
  }, 5 * 60 * 1000); // 5 minutes timeout
  
  try {
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'rma_manager') {
      console.log('❌ Insufficient permissions for bulk import');
      return res.status(403).json({ message: 'Insufficient permissions for bulk import' });
    }

    const { dtrs } = req.body;
    
    if (!dtrs || !Array.isArray(dtrs)) {
      console.log('❌ DTRs array is required');
      return res.status(400).json({ message: 'DTRs array is required' });
    }

    if (dtrs.length === 0) {
      console.log('❌ At least one DTR is required');
      return res.status(400).json({ message: 'At least one DTR is required' });
    }

    if (dtrs.length > 1000) {
      console.log('❌ Maximum 1000 DTRs can be imported at once');
      return res.status(400).json({ message: 'Maximum 1000 DTRs can be imported at once' });
    }

    console.log(`📊 Processing ${dtrs.length} DTRs for import`);

    const results = {
      imported: 0,
      failed: 0,
      errors: []
    };

    // Process DTRs in batches to avoid overwhelming the database
    const batchSize = 50;
    console.log(`Processing in batches of ${batchSize}`);
    
    for (let i = 0; i < dtrs.length; i += batchSize) {
      const batch = dtrs.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(dtrs.length/batchSize)} (${batch.length} items)`);
      
      for (let j = 0; j < batch.length; j++) {
        const dtrData = batch[j];
        const rowIndex = i + j + 1;
        console.log(`🔄 Processing row ${rowIndex}/${dtrs.length}: ${dtrData.serialNumber || 'No serial'}`);
        
        try {
          // Handle missing serial number with placeholder
          if (!dtrData.serialNumber || dtrData.serialNumber.toString().trim() === '') {
            dtrData.serialNumber = `IMPORT-${Date.now()}-${i + 1}`; // Generate placeholder serial number
          }

          if (!dtrData.complaintDescription) {
            results.errors.push(`Row ${i + 1}: Complaint description is required`);
            results.failed++;
            continue;
          }

          // Site name validation is now optional - it will be auto-populated from projector
          // Check if projector exists and populate site information
          const Projector = require('../models/Projector');
          let projector = null;
          
          if (!dtrData.serialNumber.startsWith('IMPORT-')) {
            projector = await Projector.findOne({ serialNumber: dtrData.serialNumber });
            
            if (!projector) {
              // Skip validation for missing projectors - they can be added later
              console.log(`⚠️  Projector with serial number ${dtrData.serialNumber} not found - skipping validation`);
              // Use placeholder values for missing projectors
              dtrData.siteName = dtrData.siteName || 'Unknown Site';
              dtrData.siteCode = dtrData.siteCode || 'UNKNOWN';
              dtrData.region = dtrData.region || 'Unknown';
              dtrData.unitModel = dtrData.unitModel || 'Unknown Model';
            } else {
              // Get site details from projector and auto-populate
              const Site = require('../models/Site');
              const site = await Site.findById(projector.siteId);
              
              if (!site) {
                console.log(`⚠️  Site not found for projector ${dtrData.serialNumber} - using defaults`);
                dtrData.siteName = dtrData.siteName || 'Unknown Site';
                dtrData.siteCode = dtrData.siteCode || 'UNKNOWN';
                dtrData.region = dtrData.region || 'Unknown';
                dtrData.unitModel = projector.model || 'Unknown Model';
              } else {
                // Auto-populate site information
                dtrData.siteName = site.name;
                dtrData.siteCode = site.siteCode || site.name;
                dtrData.region = site.region || site.address?.state || 'Unknown';
                dtrData.unitModel = projector.model;
                
                // Auto-populate auditorium information
                if (projector.auditoriumId && site.auditoriums) {
                  const auditorium = site.auditoriums.find(aud => aud._id.toString() === projector.auditoriumId.toString());
                  dtrData.auditorium = auditorium ? auditorium.name : null;
                } else {
                  dtrData.auditorium = null;
                }
              }
            }
          } else {
            // For placeholder serial numbers, use default values
            dtrData.siteName = dtrData.siteName || 'Unknown Site';
            dtrData.siteCode = dtrData.siteCode || 'UNKNOWN';
            dtrData.region = dtrData.region || 'Unknown';
            dtrData.unitModel = dtrData.unitModel || 'Unknown Model';
          }

          // Check if case ID already exists (only if provided and not empty)
          if (dtrData.caseId && dtrData.caseId.toString().trim() !== '') {
            const existingDTR = await DTR.findOne({ caseId: dtrData.caseId });
            if (existingDTR) {
              results.errors.push(`Row ${i + 1}: Case ID ${dtrData.caseId} already exists`);
              results.failed++;
              continue;
            }
          }

          // Create DTR
          const dtr = new DTR({
            caseId: (dtrData.caseId && dtrData.caseId.toString().trim() !== '') ? dtrData.caseId : undefined, // Let pre-save hook generate if not provided
            serialNumber: dtrData.serialNumber,
            complaintDescription: dtrData.complaintDescription,
            openedBy: dtrData.openedBy || {
              name: 'Bulk Import',
              designation: 'System',
              contact: 'system@import.com'
            },
            priority: (() => {
              const priority = dtrData.priority || 'Medium';
              // Map Excel values to valid enum values
              const priorityMap = {
                'Low': 'Low',
                'Medium': 'Medium', 
                'High': 'High',
                'Critical': 'Critical',
                'Major': 'High', // Map Major to High
                'Minor': 'Low', // Map Minor to Low
                'Information': 'Low' // Map Information to Low
              };
              return priorityMap[priority] || priority;
            })(),
            assignedTo: dtrData.assignedTo,
            estimatedResolutionTime: dtrData.estimatedResolutionTime || '24 hours',
            notes: dtrData.notes || '',
            complaintDate: (() => {
              if (!dtrData.errorDate) return new Date();
              
              const errorDateStr = dtrData.errorDate.toString().trim();
              
              // Try DD-MM-YYYY format first
              const ddmmyyyyMatch = errorDateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (ddmmyyyyMatch) {
                const [, day, month, year] = ddmmyyyyMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              
              // Handle DDMMYY format (6 digits) - like "250623"
              if (/^\d{6}$/.test(errorDateStr)) {
                const day = parseInt(errorDateStr.substring(0, 2));
                const month = parseInt(errorDateStr.substring(2, 4));
                const year = parseInt(errorDateStr.substring(4, 6));
                
                // Convert 2-digit year to 4-digit year
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                
                // Validate the parts
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
                  return new Date(fullYear, month - 1, day);
                }
              }
              
              // Handle Excel serial numbers (larger numbers)
              if (/^\d+$/.test(errorDateStr)) {
                const serialNumber = parseInt(errorDateStr);
                if (!isNaN(serialNumber) && serialNumber > 100000) {
                  // Proper Excel serial number conversion
                  const excelEpoch = new Date(1900, 0, 1);
                  const daysSinceEpoch = serialNumber - 2; // Excel leap year bug correction
                  return new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
                }
              }
              
              // Try regular date parsing
              const parsedDate = new Date(errorDateStr);
              return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
            })(),
            errorDate: (() => {
              if (!dtrData.errorDate) return new Date();
              
              const errorDateStr = dtrData.errorDate.toString().trim();
              
              // Try DD-MM-YYYY format first
              const ddmmyyyyMatch = errorDateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (ddmmyyyyMatch) {
                const [, day, month, year] = ddmmyyyyMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              
              // Handle DDMMYY format (6 digits) - like "250623"
              if (/^\d{6}$/.test(errorDateStr)) {
                const day = parseInt(errorDateStr.substring(0, 2));
                const month = parseInt(errorDateStr.substring(2, 4));
                const year = parseInt(errorDateStr.substring(4, 6));
                
                // Convert 2-digit year to 4-digit year
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                
                // Validate the parts
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
                  return new Date(fullYear, month - 1, day);
                }
              }
              
              // Handle Excel serial numbers (larger numbers)
              if (/^\d+$/.test(errorDateStr)) {
                const serialNumber = parseInt(errorDateStr);
                if (!isNaN(serialNumber) && serialNumber > 100000) {
                  // Proper Excel serial number conversion
                  const excelEpoch = new Date(1900, 0, 1);
                  const daysSinceEpoch = serialNumber - 2; // Excel leap year bug correction
                  return new Date(excelEpoch.getTime() + (daysSinceEpoch * 24 * 60 * 60 * 1000));
                }
              }
              
              // Try regular date parsing
              const parsedDate = new Date(errorDateStr);
              return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
            })(),
            unitModel: dtrData.unitModel || (projector ? projector.model : 'Unknown'),
            problemName: dtrData.problemName || dtrData.complaintDescription,
            actionTaken: dtrData.actionTaken || '',
            remarks: dtrData.remarks || '',
            callStatus: (() => {
              const status = dtrData.callStatus || 'Open';
              // Map Excel values to valid enum values
              const statusMap = {
                'Observation': 'Observation',
                'closed': 'Closed',
                'Closed': 'Closed',
                'Waiting_Cust_Responses': 'Waiting_Cust_Responses',
                'RMA Part return to CDS': 'RMA Part return to CDS',
                'In Progress': 'Open', // Map In Progress to Open
                'blank': 'blank'
              };
              return statusMap[status] || status;
            })(),
            caseSeverity: (() => {
              const severity = dtrData.caseSeverity || 'Minor';
              // Map Excel values to valid enum values
              const severityMap = {
                'Critical': 'Critical',
                'Information': 'Information',
                'Major': 'Major',
                'Minor': 'Minor',
                'Low': 'Low',
                'High': 'Major', // Map High to Major
                'Medium': 'Minor', // Map Medium to Minor
                'blank': 'blank'
              };
              return severityMap[severity] || severity;
            })(),
            siteName: dtrData.siteName,
            siteCode: dtrData.siteCode || dtrData.siteName || 'UNKNOWN',
            region: dtrData.region || (site ? site.address?.state : 'Unknown') || 'Unknown',
            auditorium: dtrData.auditorium || 'Unknown Auditorium',
            status: dtrData.status || 'Open',
            closedBy: dtrData.closedBy,
            closedDate: (() => {
              if (!dtrData.closedBy || !dtrData.closedBy.closedDate) return null;
              
              const closedDateStr = dtrData.closedBy.closedDate.toString().trim();
              
              // Try DD-MM-YYYY format first
              const ddmmyyyyMatch = closedDateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (ddmmyyyyMatch) {
                const [, day, month, year] = ddmmyyyyMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              
              // Handle DDMMYY format (6 digits) - like "250623"
              if (/^\d{6}$/.test(closedDateStr)) {
                const day = parseInt(closedDateStr.substring(0, 2));
                const month = parseInt(closedDateStr.substring(2, 4));
                const year = parseInt(closedDateStr.substring(4, 6));
                
                // Convert 2-digit year to 4-digit year
                const fullYear = year < 50 ? 2000 + year : 1900 + year;
                
                // Validate the parts
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
                  return new Date(fullYear, month - 1, day);
                }
              }
              
              // Handle Excel serial numbers (larger numbers)
              if (/^\d+$/.test(closedDateStr)) {
                const serialNumber = parseInt(closedDateStr);
                if (!isNaN(serialNumber) && serialNumber > 100000) {
                  return new Date(serialNumber * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
                }
              }
              
              // Try regular date parsing
              const parsedDate = new Date(closedDateStr);
              return isNaN(parsedDate.getTime()) ? null : parsedDate;
            })(),
            closedRemarks: dtrData.closedRemarks || ''
          });

          await dtr.save();
          results.imported++;
          console.log(`✅ Successfully imported row ${rowIndex}: Case ID ${dtr.caseId}, Serial ${dtr.serialNumber}`);

        } catch (error) {
          console.error(`❌ Error processing row ${rowIndex}:`, error.message);
          console.error(`   Data:`, JSON.stringify(dtrData, null, 2));
          results.errors.push(`Row ${rowIndex}: ${error.message}`);
          results.failed++;
        }
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Bulk import completed in ${duration}s. ${results.imported} DTRs imported, ${results.failed} failed.`);
    console.log(`📊 Import Summary: ${results.imported}/${dtrs.length} successful (${Math.round((results.imported/dtrs.length)*100)}%)`);
    
    if (results.errors.length > 0) {
      console.log(`❌ First 5 errors:`);
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Clear the timeout since we're done
    clearTimeout(timeout);
    
    res.json({
      message: `Bulk import completed. ${results.imported} DTRs imported, ${results.failed} failed.`,
      imported: results.imported,
      failed: results.failed,
      errors: results.errors.slice(0, 50), // Limit error messages to first 50
      duration: `${duration}s`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    clearTimeout(timeout);
    res.status(500).json({ 
      message: 'Bulk import failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all technicians (users with technician role)
router.get('/users/technicians', auth, async (req, res) => {
  try {
    const technicians = await User.find({
      role: { $in: ['technician', 'engineer'] },
      isActive: true
    }).select('userId username email profile role');
    
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching technicians', error: error.message });
  }
});

// Get all RMA managers
router.get('/users/rma-managers', auth, async (req, res) => {
  try {
    const rmaManagers = await User.find({
      role: 'rma_manager',
      isActive: true
    }).select('userId username email profile role');
    
    res.json(rmaManagers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching RMA managers', error: error.message });
  }
});

// Get all technical heads
router.get('/users/technical-heads', auth, async (req, res) => {
  try {
    const technicalHeads = await User.find({
      role: 'technical_head',
      isActive: true
    }).select('userId username email profile role');
    
    res.json(technicalHeads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching technical heads', error: error.message });
  }
});

// Get RMA handlers for assignment
router.get('/users/rma-handlers', auth, async (req, res) => {
  try {
    const rmaHandlers = await User.find({
      role: 'rma_handler',
      isActive: true
    }).select('userId username email profile role');

    res.json(rmaHandlers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching RMA handlers', error: error.message });
  }
});

// Assign DTR to technical head
router.post('/:id/assign-technical-head', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { technicalHeadId, technicalHeadName, technicalHeadEmail, assignedBy } = req.body;

    // Verify the user has permission to assign DTRs
    if (!['admin', 'rma_handler'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admins and RMA handlers can assign DTRs to technical heads.' 
      });
    }

    // Find the DTR
    const dtr = await DTR.findById(id);
    if (!dtr) {
      return res.status(404).json({ 
        success: false, 
        message: 'DTR not found' 
      });
    }

    // Verify the technical head exists
    const technicalHead = await User.findOne({ 
      userId: technicalHeadId, 
      role: 'technical_head',
      isActive: true 
    });
    
    if (!technicalHead) {
      return res.status(404).json({ 
        success: false, 
        message: 'Technical head not found or inactive' 
      });
    }

    // Update the DTR
    dtr.assignedTo = technicalHeadId;
    dtr.assignedBy = req.user.userId;
    dtr.status = 'In Progress'; // Use valid status from enum
    dtr.assignedDate = new Date();
    dtr.assignedToDetails = {
      name: technicalHeadName,
      email: technicalHeadEmail,
      role: 'technical_head',
      assignedDate: new Date()
    };

    await dtr.save();

    res.json({
      success: true,
      message: 'DTR successfully assigned to technical head',
      data: {
        dtrId: dtr._id,
        caseId: dtr.caseId,
        assignedTo: technicalHeadId,
        assignedToName: technicalHeadName,
        assignedBy: req.user.userId,
        assignedDate: dtr.assignedDate
      }
    });

  } catch (error) {
    console.error('Error assigning DTR to technical head:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error assigning DTR to technical head', 
      error: error.message 
    });
  }
});

// Technical Head finalizes DTR and assigns back to RMA Handler
router.post('/:id/finalize-by-technical-head', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, notes, rmaHandlerId, rmaHandlerName, rmaHandlerEmail } = req.body;

    // Verify the user has permission to finalize DTRs
    if (!['admin', 'technical_head'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admins and technical heads can finalize DTRs.' 
      });
    }

    // Find the DTR
    const dtr = await DTR.findById(id);
    if (!dtr) {
      return res.status(404).json({ 
        success: false, 
        message: 'DTR not found' 
      });
    }

    // Verify the RMA handler exists
    const rmaHandler = await User.findOne({ 
      userId: rmaHandlerId, 
      role: 'rma_handler',
      isActive: true 
    });
    
    if (!rmaHandler) {
      return res.status(404).json({ 
        success: false, 
        message: 'RMA handler not found or inactive' 
      });
    }

    // Update the DTR
    dtr.status = 'Ready for RMA';
    dtr.resolution = resolution;
    dtr.notes = notes || dtr.notes;
    dtr.finalizedBy = req.user.userId;
    dtr.finalizedDate = new Date();
    dtr.assignedTo = rmaHandlerId; // Assign back to RMA handler
    dtr.assignedBy = req.user.userId;
    dtr.assignedDate = new Date();
    dtr.assignedToDetails = {
      name: rmaHandlerName,
      email: rmaHandlerEmail,
      role: 'rma_handler',
      assignedDate: new Date()
    };

    await dtr.save();

    res.json({
      success: true,
      message: 'DTR successfully finalized and assigned back to RMA handler',
      data: {
        dtrId: dtr._id,
        caseId: dtr.caseId,
        status: dtr.status,
        assignedTo: rmaHandlerId,
        assignedToName: rmaHandlerName,
        finalizedBy: req.user.userId,
        finalizedDate: dtr.finalizedDate
      }
    });

  } catch (error) {
    console.error('Error finalizing DTR by technical head:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error finalizing DTR', 
      error: error.message 
    });
  }
});

// Upload files for DTR assignment
router.post('/:id/upload-files', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the user has permission to upload files
    if (!['admin', 'rma_handler', 'technical_head'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admins, RMA handlers, and technical heads can upload files.' 
      });
    }

    // Find the DTR
    const dtr = await DTR.findById(id);
    if (!dtr) {
      return res.status(404).json({ 
        success: false, 
        message: 'DTR not found' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedBy: req.user.userId,
      uploadedAt: new Date()
    }));

    // Add files to DTR attachments
    if (!dtr.attachments) {
      dtr.attachments = [];
    }
    dtr.attachments.push(...uploadedFiles);

    await dtr.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        dtrId: dtr._id,
        caseId: dtr.caseId,
        uploadedFiles: uploadedFiles.map(file => ({
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: file.uploadedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading files', 
      error: error.message 
    });
  }
});

// Update auditorium data for existing DTRs
router.post('/update-auditoriums', auth, async (req, res) => {
  try {
    console.log('🔧 Starting auditorium data update for existing DTRs...');
    
    // Find all DTRs that don't have auditorium data
    const dtrsWithoutAuditorium = await DTR.find({
      $or: [
        { auditorium: { $exists: false } },
        { auditorium: null },
        { auditorium: '' },
        { auditorium: 'Unknown Auditorium' }
      ]
    }).limit(10); // Process in batches
    
    console.log(`📊 Found ${dtrsWithoutAuditorium.length} DTRs without auditorium data`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const dtr of dtrsWithoutAuditorium) {
      try {
        console.log(`🔍 Processing DTR ${dtr.caseId} (Serial: ${dtr.serialNumber})`);
        
        // Find projector
        const projector = await Projector.findOne({ serialNumber: dtr.serialNumber });
        if (!projector) {
          console.log(`⚠️  Projector not found for serial ${dtr.serialNumber}`);
          continue;
        }
        
        // Find site
        const site = await Site.findById(projector.siteId);
        if (!site) {
          console.log(`⚠️  Site not found for projector ${dtr.serialNumber}`);
          continue;
        }
        
        // Find auditorium
        let auditoriumName = null;
        if (projector.auditoriumId && site.auditoriums) {
          const auditorium = site.auditoriums.find(aud => aud._id.toString() === projector.auditoriumId.toString());
          if (auditorium) {
            auditoriumName = auditorium.name;
            console.log(`✅ Found auditorium: ${auditoriumName}`);
          }
        }
        
        // Update DTR with auditorium data
        if (auditoriumName) {
          await DTR.findByIdAndUpdate(dtr._id, { auditorium: auditoriumName });
          updatedCount++;
          console.log(`✅ Updated DTR ${dtr.caseId} with auditorium: ${auditoriumName}`);
        } else {
          console.log(`⚠️  No auditorium data available for DTR ${dtr.caseId}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing DTR ${dtr.caseId}:`, error.message);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} DTRs with auditorium data`,
      updated: updatedCount,
      errors: errorCount,
      processed: dtrsWithoutAuditorium.length
    });
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    res.status(500).json({ message: 'Error updating auditorium data', error: error.message });
  }
});

// Debug endpoint to check auditorium data
router.get('/debug-auditorium/:serialNumber', auth, async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    // Find projector
    const projector = await Projector.findOne({ serialNumber });
    if (!projector) {
      return res.status(404).json({ message: 'Projector not found' });
    }
    
    // Find site
    const site = await Site.findById(projector.siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Check auditorium data
    let auditoriumData = null;
    if (projector.auditoriumId && site.auditoriums) {
      const auditorium = site.auditoriums.find(aud => aud._id.toString() === projector.auditoriumId.toString());
      auditoriumData = auditorium;
    }
    
    res.json({
      projector: {
        serialNumber: projector.serialNumber,
        auditoriumId: projector.auditoriumId,
        siteId: projector.siteId
      },
      site: {
        name: site.name,
        auditoriums: site.auditoriums,
        auditoriumsCount: site.auditoriums ? site.auditoriums.length : 0
      },
      auditoriumData: auditoriumData,
      auditoriumName: auditoriumData ? auditoriumData.name : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking auditorium data', error: error.message });
  }
});

// DTR Reports - Analytics Endpoint
router.get('/reports/analytics', auth, async (req, res) => {
  try {
    console.log('📊 Generating DTR analytics report...');
    
    const { 
      serialNumber, 
      startDate, 
      endDate, 
      status, 
      priority, 
      callStatus, 
      siteName,
      caseSeverity
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (serialNumber) {
      filter.serialNumber = { $regex: serialNumber, $options: 'i' };
    }
    
    if (siteName) {
      filter.siteName = { $regex: siteName, $options: 'i' };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (callStatus && callStatus !== 'all') {
      filter.callStatus = callStatus;
    }
    
    if (caseSeverity && caseSeverity !== 'all') {
      filter.caseSeverity = caseSeverity;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.errorDate = {};
      if (startDate) filter.errorDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.errorDate.$lte = end;
      }
    }
    
    console.log('Filter applied:', filter);
    
    // Get filtered DTR records
    const dtrRecords = await DTR.find(filter).sort({ errorDate: -1 });
    
    const totalCases = dtrRecords.length;
    
    // If no DTRs found, return empty analytics
    if (totalCases === 0) {
      console.log('No DTR records found with current filters');
      const emptyAnalytics = {
        summary: {
          totalCases: 0,
          openCases: 0,
          inProgressCases: 0,
          resolvedCases: 0,
          closedCases: 0,
          shiftedToRMA: 0,
          avgResolutionTimeHours: 0
        },
        statusDistribution: {},
        priorityDistribution: {},
        severityDistribution: {},
        callStatusDistribution: {},
        timeBasedTrends: [],
        serialNumberAnalysis: [],
        siteAnalysis: [],
        topProblems: [],
        dtrRecords: [],
        filters: {
          serialNumber: serialNumber || 'all',
          startDate: startDate || 'all',
          endDate: endDate || 'all',
          status: status || 'all',
          priority: priority || 'all',
          callStatus: callStatus || 'all',
          siteName: siteName || 'all',
          caseSeverity: caseSeverity || 'all'
        },
        generatedAt: new Date()
      };
      return res.json(emptyAnalytics);
    }
    
    // Status distribution
    const statusDistribution = {};
    dtrRecords.forEach(dtr => {
      const s = dtr.status || 'Open';
      statusDistribution[s] = (statusDistribution[s] || 0) + 1;
    });
    
    // Priority distribution
    const priorityDistribution = {};
    dtrRecords.forEach(dtr => {
      const p = dtr.priority || 'Medium';
      priorityDistribution[p] = (priorityDistribution[p] || 0) + 1;
    });
    
    // Severity distribution
    const severityDistribution = {};
    dtrRecords.forEach(dtr => {
      const sev = dtr.caseSeverity || 'Medium';
      severityDistribution[sev] = (severityDistribution[sev] || 0) + 1;
    });
    
    // Call status distribution
    const callStatusDistribution = {};
    dtrRecords.forEach(dtr => {
      const cs = dtr.callStatus || 'Open';
      callStatusDistribution[cs] = (callStatusDistribution[cs] || 0) + 1;
    });
    
    // Time-based trends (group by date)
    const timeBasedTrends = [];
    const dateMap = {};
    dtrRecords.forEach(dtr => {
      const date = dtr.errorDate ? new Date(dtr.errorDate).toISOString().split('T')[0] : 'Unknown';
      dateMap[date] = (dateMap[date] || 0) + 1;
    });
    Object.keys(dateMap).sort().forEach(date => {
      timeBasedTrends.push({ date, count: dateMap[date] });
    });
    
    // Serial number analysis
    const serialMap = {};
    dtrRecords.forEach(dtr => {
      const sn = dtr.serialNumber || 'Unknown';
      if (!serialMap[sn]) {
        serialMap[sn] = {
          serialNumber: sn,
          siteName: dtr.siteName,
          unitModel: dtr.unitModel || dtr.projectorDetails?.model,
          count: 0,
          cases: []
        };
      }
      serialMap[sn].count++;
      serialMap[sn].cases.push({
        caseId: dtr.caseId,
        problemName: dtr.problemName,
        errorDate: dtr.errorDate,
        status: dtr.status
      });
    });
    const serialNumberAnalysis = Object.values(serialMap).sort((a, b) => b.count - a.count);
    
    // Site analysis
    const siteMap = {};
    dtrRecords.forEach(dtr => {
      const site = dtr.siteName || 'Unknown';
      siteMap[site] = (siteMap[site] || 0) + 1;
    });
    const siteAnalysis = Object.keys(siteMap).map(site => ({
      siteName: site,
      count: siteMap[site]
    })).sort((a, b) => b.count - a.count);
    
    // Calculate average resolution time (for resolved cases)
    const resolvedCases = dtrRecords.filter(dtr => 
      dtr.status === 'Closed' || dtr.status === 'Completed by Technical Head'
    );
    
    let avgResolutionTime = 0;
    if (resolvedCases.length > 0) {
      const totalHours = resolvedCases.reduce((sum, dtr) => {
        if (dtr.createdAt && dtr.updatedAt) {
          const hours = (new Date(dtr.updatedAt) - new Date(dtr.createdAt)) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);
      avgResolutionTime = (totalHours / resolvedCases.length).toFixed(2);
    }
    
    // Problem category analysis
    const problemMap = {};
    dtrRecords.forEach(dtr => {
      const problem = dtr.problemName || 'Unspecified';
      problemMap[problem] = (problemMap[problem] || 0) + 1;
    });
    const topProblems = Object.keys(problemMap).map(problem => ({
      problemName: problem,
      count: problemMap[problem]
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    
    const analytics = {
      summary: {
        totalCases,
        openCases: statusDistribution['Open'] || 0,
        inProgressCases: statusDistribution['In Progress'] || 0,
        resolvedCases: resolvedCases.length,
        closedCases: statusDistribution['Closed'] || 0,
        shiftedToRMA: statusDistribution['Shifted to RMA'] || 0,
        avgResolutionTimeHours: parseFloat(avgResolutionTime)
      },
      statusDistribution,
      priorityDistribution,
      severityDistribution,
      callStatusDistribution,
      timeBasedTrends,
      serialNumberAnalysis: serialNumberAnalysis.slice(0, 20), // Top 20
      siteAnalysis: siteAnalysis.slice(0, 20), // Top 20
      topProblems,
      dtrRecords: dtrRecords.slice(0, 100), // Limit to 100 for performance
      filters: {
        serialNumber: serialNumber || 'all',
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        status: status || 'all',
        priority: priority || 'all',
        callStatus: callStatus || 'all',
        siteName: siteName || 'all',
        caseSeverity: caseSeverity || 'all'
      },
      generatedAt: new Date()
    };
    
    console.log(`✅ DTR Analytics generated: ${totalCases} cases found`);
    res.json(analytics);
    
  } catch (error) {
    console.error('❌ Error generating DTR analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating DTR analytics', 
      error: error.message 
    });
  }
});

// DTR Reports - Export Data Endpoint
router.get('/reports/export-data', auth, async (req, res) => {
  try {
    console.log('📄 Generating DTR export data...');
    
    const { 
      serialNumber, 
      startDate, 
      endDate, 
      status, 
      priority, 
      callStatus, 
      siteName,
      caseSeverity
    } = req.query;
    
    // Build filter query (same as analytics)
    const filter = {};
    
    if (serialNumber) {
      filter.serialNumber = { $regex: serialNumber, $options: 'i' };
    }
    
    if (siteName) {
      filter.siteName = { $regex: siteName, $options: 'i' };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (callStatus && callStatus !== 'all') {
      filter.callStatus = callStatus;
    }
    
    if (caseSeverity && caseSeverity !== 'all') {
      filter.caseSeverity = caseSeverity;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.errorDate = {};
      if (startDate) filter.errorDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.errorDate.$lte = end;
      }
    }
    
    // Get all DTR records for export
    const dtrRecords = await DTR.find(filter).sort({ errorDate: -1 });
    
    // Format for export
    const exportData = dtrRecords.map(dtr => ({
      caseId: dtr.caseId,
      serialNumber: dtr.serialNumber,
      siteName: dtr.siteName,
      siteCode: dtr.siteCode,
      region: dtr.region,
      unitModel: dtr.unitModel || dtr.projectorDetails?.model || 'N/A',
      brand: dtr.projectorDetails?.brand || 'N/A',
      problemName: dtr.problemName || 'N/A',
      complaintDescription: dtr.complaintDescription,
      actionTaken: dtr.actionTaken || 'Not specified',
      remarks: dtr.remarks || '',
      status: dtr.status,
      callStatus: dtr.callStatus,
      caseSeverity: dtr.caseSeverity,
      priority: dtr.priority,
      errorDate: dtr.errorDate,
      complaintDate: dtr.complaintDate,
      openedBy: dtr.openedBy?.name || 'N/A',
      assignedTo: typeof dtr.assignedTo === 'string' ? dtr.assignedTo : 
                  typeof dtr.assignedTo === 'object' && dtr.assignedTo?.name ? dtr.assignedTo.name : 
                  'Unassigned',
      rmaCaseNumber: dtr.rmaCaseNumber || '',
      createdAt: dtr.createdAt,
      updatedAt: dtr.updatedAt
    }));
    
    res.json({
      success: true,
      data: exportData,
      totalRecords: exportData.length,
      filters: {
        serialNumber: serialNumber || 'all',
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        status: status || 'all',
        priority: priority || 'all',
        callStatus: callStatus || 'all',
        siteName: siteName || 'all',
        caseSeverity: caseSeverity || 'all'
      },
      exportedAt: new Date()
    });
    
    console.log(`✅ DTR Export data generated: ${exportData.length} records`);
    
  } catch (error) {
    console.error('❌ Error generating DTR export data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating DTR export data', 
      error: error.message 
    });
  }
});

// Get DTR attachments
router.get('/:id/attachments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const dtr = await DTR.findById(id).select('attachments caseId');
    if (!dtr) {
      return res.status(404).json({ 
        success: false, 
        message: 'DTR not found' 
      });
    }

    res.json({
      success: true,
      data: {
        dtrId: dtr._id,
        caseId: dtr.caseId,
        attachments: dtr.attachments || []
      }
    });

  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attachments', 
      error: error.message 
    });
  }
});

// Download DTR attachment
router.get('/:id/attachments/:filename', auth, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    const dtr = await DTR.findById(id);
    if (!dtr) {
      return res.status(404).json({ 
        success: false, 
        message: 'DTR not found' 
      });
    }

    const attachment = dtr.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attachment not found' 
      });
    }

    const filePath = path.join(process.cwd(), attachment.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }

    res.download(filePath, attachment.originalName);

  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading attachment', 
      error: error.message 
    });
  }
});

module.exports = router;
