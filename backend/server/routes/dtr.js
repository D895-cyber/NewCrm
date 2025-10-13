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
    
    const total = await DTR.countDocuments(filter);
    
    res.json({
      dtrs,
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
    res.json(dtr);
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
      openedBy,
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
      caseSeverity: caseSeverity || 'Medium',
      siteName: site.name,
      siteCode: site.name, // Using site name as code
      region: site.address.state
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
      remarks
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
    
    if (closedBy !== undefined) updateData.closedBy = closedBy;
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
      site: {
        name: site.name,
        code: site.name,
        region: site.address.state,
        address: site.address
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

          if (!dtrData.siteName) {
            results.errors.push(`Row ${i + 1}: Site name is required`);
            results.failed++;
            continue;
          }

          // Check if projector exists (skip check for placeholder serial numbers)
          const Projector = require('../models/Projector');
          let projector = null;
          
          if (!dtrData.serialNumber.startsWith('IMPORT-')) {
            projector = await Projector.findOne({ serialNumber: dtrData.serialNumber });
            
            if (!projector) {
              results.errors.push(`Row ${i + 1}: Projector with serial number ${dtrData.serialNumber} not found`);
              results.failed++;
              continue;
            }
          }

          // Check if site exists (skip check for placeholder serial numbers)
          const Site = require('../models/Site');
          let site = null;
          
          if (projector && projector.siteId) {
            site = await Site.findById(projector.siteId);
            
            if (!site) {
              results.errors.push(`Row ${i + 1}: Site not found for projector ${dtrData.serialNumber}`);
              results.failed++;
              continue;
            }
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
            priority: dtrData.priority || 'Medium',
            assignedTo: dtrData.assignedTo,
            estimatedResolutionTime: dtrData.estimatedResolutionTime || '24 hours',
            notes: dtrData.notes || '',
            errorDate: dtrData.errorDate || new Date(),
            unitModel: dtrData.unitModel || (projector ? projector.model : 'Unknown'),
            problemName: dtrData.problemName || dtrData.complaintDescription,
            actionTaken: dtrData.actionTaken || '',
            remarks: dtrData.remarks || '',
            callStatus: (() => {
              const status = dtrData.callStatus || 'Open';
              // Map Excel values to valid enum values
              const statusMap = {
                'Observation': 'Open',
                'closed': 'Closed',
                'Waiting_Cust_Responses': 'In Progress',
                'RMA Part return to CDS': 'Escalated'
              };
              return statusMap[status] || status;
            })(),
            caseSeverity: (() => {
              const severity = dtrData.caseSeverity || 'Medium';
              // Map Excel values to valid enum values
              const severityMap = {
                'Major': 'High',
                'Minor': 'Low',
                'Information': 'Low'
              };
              return severityMap[severity] || severity;
            })(),
            siteName: dtrData.siteName,
            siteCode: dtrData.siteCode || dtrData.siteName || 'UNKNOWN',
            region: dtrData.region || (site ? site.address?.state : 'Unknown') || 'Unknown',
            status: dtrData.status || 'Open',
            closedBy: dtrData.closedBy,
            closedDate: dtrData.closedBy ? (dtrData.closedBy.closedDate || new Date()) : null
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
