const express = require('express');
const router = express.Router();
const DTR = require('../models/DTR');
const Projector = require('../models/Projector');
const Site = require('../models/Site');
const RMA = require('../models/RMA');
const { authenticateToken: auth } = require('../middleware/auth');

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
      assignedTo,
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
    } else if (closedReason !== undefined) {
      updateData.closedReason = closedReason;
    }
    
    if (closedBy !== undefined) updateData.closedBy = closedBy;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
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
    
    const projectorInfo = {
      serialNumber: projector.serialNumber,
      model: projector.model,
      brand: projector.brand,
      installDate: projector.installDate,
      warrantyEnd: projector.warrantyEnd,
      lastService: projector.lastService,
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

module.exports = router;
