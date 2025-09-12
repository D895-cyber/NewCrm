const express = require('express');
const router = express.Router();
const ServiceTicket = require('../models/ServiceTicket');
const AMCContract = require('../models/AMCContract');
const ServiceReport = require('../models/ServiceReport');
const FSE = require('../models/FSE');
const { authenticateToken } = require('../middleware/auth');

// Get all service tickets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      fseId, 
      amcContractId, 
      dateFrom, 
      dateTo,
      priority,
      serviceType 
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (fseId) query['assignedFSE.fseId'] = fseId;
    if (amcContractId) query.amcContractId = amcContractId;
    if (priority) query.priority = priority;
    if (serviceType) query.serviceType = serviceType;
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledDate.$lte = new Date(dateTo);
    }
    
    const serviceTickets = await ServiceTicket.find(query)
      .populate('amcContractId', 'contractNumber customerName siteName')
      .populate('assignedFSE.fseId', 'name phone email')
      .populate('serviceReportId', 'reportNumber reportTitle')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledDate: 1 })
      .exec();
    
    const count = await ServiceTicket.countDocuments(query);
    
    res.json({
      serviceTickets,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service ticket by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceTicket = await ServiceTicket.findById(req.params.id)
      .populate('amcContractId', 'contractNumber customerName siteName projectorSerial projectorModel projectorBrand')
      .populate('assignedFSE.fseId', 'name phone email')
      .populate('serviceReportId', 'reportNumber reportTitle date');
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new service ticket
router.post('/', authenticateToken, async (req, res) => {
  try {
    const serviceTicket = new ServiceTicket(req.body);
    
    // Add to history
    serviceTicket.history.push({
      action: 'Created',
      performedBy: req.user.name || req.user.email,
      notes: 'Service ticket created'
    });
    
    const savedServiceTicket = await serviceTicket.save();
    
    // Update AMC contract service schedule if this is a scheduled service
    if (savedServiceTicket.amcContractId && savedServiceTicket.serviceSchedule) {
      const amcContract = await AMCContract.findById(savedServiceTicket.amcContractId);
      if (amcContract) {
        if (savedServiceTicket.serviceSchedule === 'First Service') {
          amcContract.serviceSchedule.firstService.status = 'Scheduled';
          amcContract.serviceSchedule.firstService.serviceVisitId = savedServiceTicket._id;
        } else if (savedServiceTicket.serviceSchedule === 'Second Service') {
          amcContract.serviceSchedule.secondService.status = 'Scheduled';
          amcContract.serviceSchedule.secondService.serviceVisitId = savedServiceTicket._id;
        }
        await amcContract.save();
      }
    }
    
    res.status(201).json(savedServiceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Auto-create service tickets from AMC contract
router.post('/auto-create-from-amc/:amcContractId', authenticateToken, async (req, res) => {
  try {
    const amcContract = await AMCContract.findById(req.params.amcContractId);
    if (!amcContract) {
      return res.status(404).json({ message: 'AMC Contract not found' });
    }
    
    const { fseId, scheduledDate, notes } = req.body;
    
    // Check if service tickets already exist
    const existingTickets = await ServiceTicket.find({
      amcContractId: amcContract._id,
      serviceSchedule: { $in: ['First Service', 'Second Service'] }
    });
    
    if (existingTickets.length > 0) {
      return res.status(400).json({ message: 'Service tickets already exist for this contract' });
    }
    
    const tickets = [];
    
    // Create first service ticket (6 months)
    if (amcContract.serviceSchedule.firstService.scheduledDate) {
      const firstServiceTicket = new ServiceTicket({
        amcContractId: amcContract._id,
        contractNumber: amcContract.contractNumber,
        clientName: amcContract.customerName,
        siteName: amcContract.siteName,
        siteAddress: amcContract.site?.address,
        projectorSerial: amcContract.projectorSerial,
        projectorModel: amcContract.projectorModel,
        projectorBrand: amcContract.projectorBrand,
        serviceType: 'Preventive Maintenance',
        serviceSchedule: 'First Service',
        scheduledDate: amcContract.serviceSchedule.firstService.scheduledDate,
        assignedFSE: {
          fseId: fseId || amcContract.assignedFSE?.fseId,
          fseName: amcContract.assignedFSE?.fseName
        },
        priority: 'Medium',
        specialInstructions: notes || 'First scheduled service as per AMC contract',
        history: [{
          action: 'Created',
          performedBy: req.user.name || req.user.email,
          notes: 'Auto-created from AMC contract'
        }]
      });
      
      tickets.push(firstServiceTicket);
    }
    
    // Create second service ticket (12 months)
    if (amcContract.serviceSchedule.secondService.scheduledDate) {
      const secondServiceTicket = new ServiceTicket({
        amcContractId: amcContract._id,
        contractNumber: amcContract.contractNumber,
        clientName: amcContract.customerName,
        siteName: amcContract.siteName,
        siteAddress: amcContract.site?.address,
        projectorSerial: amcContract.projectorSerial,
        projectorModel: amcContract.projectorModel,
        projectorBrand: amcContract.projectorBrand,
        serviceType: 'Preventive Maintenance',
        serviceSchedule: 'Second Service',
        scheduledDate: amcContract.serviceSchedule.secondService.scheduledDate,
        assignedFSE: {
          fseId: fseId || amcContract.assignedFSE?.fseId,
          fseName: amcContract.assignedFSE?.fseName
        },
        priority: 'Medium',
        specialInstructions: notes || 'Second scheduled service as per AMC contract',
        history: [{
          action: 'Created',
          performedBy: req.user.name || req.user.email,
          notes: 'Auto-created from AMC contract'
        }]
      });
      
      tickets.push(secondServiceTicket);
    }
    
    const savedTickets = await ServiceTicket.insertMany(tickets);
    
    // Update AMC contract service schedule
    for (const ticket of savedTickets) {
      if (ticket.serviceSchedule === 'First Service') {
        amcContract.serviceSchedule.firstService.status = 'Scheduled';
        amcContract.serviceSchedule.firstService.serviceVisitId = ticket._id;
      } else if (ticket.serviceSchedule === 'Second Service') {
        amcContract.serviceSchedule.secondService.status = 'Scheduled';
        amcContract.serviceSchedule.secondService.serviceVisitId = ticket._id;
      }
    }
    await amcContract.save();
    
    res.status(201).json({
      message: `${savedTickets.length} service tickets created successfully`,
      tickets: savedTickets
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service ticket
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add to history
    updateData.history = {
      action: 'Updated',
      performedBy: req.user.name || req.user.email,
      notes: req.body.updateNotes || 'Service ticket updated'
    };
    
    const serviceTicket = await ServiceTicket.findByIdAndUpdate(
      id,
      { $push: { history: updateData.history }, ...updateData },
      { new: true, runValidators: true }
    );
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update ticket status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const serviceTicket = await ServiceTicket.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          history: {
            action: `Status changed to ${status}`,
            performedBy: req.user.name || req.user.email,
            notes: notes || `Status updated to ${status}`
          }
        }
      },
      { new: true }
    );
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    // Update AMC contract service schedule status
    if (serviceTicket.amcContractId && serviceTicket.serviceSchedule) {
      const amcContract = await AMCContract.findById(serviceTicket.amcContractId);
      if (amcContract) {
        if (serviceTicket.serviceSchedule === 'First Service') {
          amcContract.serviceSchedule.firstService.status = status === 'Completed' ? 'Completed' : 'In Progress';
          amcContract.serviceSchedule.firstService.actualDate = status === 'Completed' ? new Date() : undefined;
        } else if (serviceTicket.serviceSchedule === 'Second Service') {
          amcContract.serviceSchedule.secondService.status = status === 'Completed' ? 'Completed' : 'In Progress';
          amcContract.serviceSchedule.secondService.actualDate = status === 'Completed' ? new Date() : undefined;
        }
        await amcContract.save();
      }
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign FSE to ticket
router.patch('/:id/assign-fse', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fseId } = req.body;
    
    const fse = await FSE.findById(fseId);
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    
    const serviceTicket = await ServiceTicket.findByIdAndUpdate(
      id,
      {
        'assignedFSE.fseId': fseId,
        'assignedFSE.fseName': fse.name,
        'assignedFSE.fsePhone': fse.phone,
        'assignedFSE.fseEmail': fse.email,
        status: 'Assigned',
        $push: {
          history: {
            action: 'FSE Assigned',
            performedBy: req.user.name || req.user.email,
            notes: `Assigned to ${fse.name}`
          }
        }
      },
      { new: true }
    );
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start service
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime } = req.body;
    
    const serviceTicket = await ServiceTicket.findByIdAndUpdate(
      id,
      {
        status: 'In Progress',
        actualStartTime: startTime || new Date(),
        $push: {
          history: {
            action: 'Service Started',
            performedBy: req.user.name || req.user.email,
            notes: 'Service work started'
          }
        }
      },
      { new: true }
    );
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete service
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime, completionNotes, sparePartsUsed, sparePartsRequired } = req.body;
    
    const updateData = {
      status: 'Completed',
      actualEndTime: endTime || new Date(),
      completionNotes,
      $push: {
        history: {
          action: 'Service Completed',
          performedBy: req.user.name || req.user.email,
          notes: 'Service work completed'
        }
      }
    };
    
    if (sparePartsUsed) {
      updateData.sparePartsUsed = sparePartsUsed;
    }
    
    if (sparePartsRequired) {
      updateData.sparePartsRequired = sparePartsRequired;
    }
    
    // Calculate actual duration
    const ticket = await ServiceTicket.findById(id);
    if (ticket.actualStartTime) {
      const start = new Date(ticket.actualStartTime);
      const end = new Date(updateData.actualEndTime);
      updateData.actualDuration = Math.round((end - start) / (1000 * 60 * 60) * 100) / 100; // hours
    }
    
    const serviceTicket = await ServiceTicket.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    // Update AMC contract service schedule
    if (serviceTicket.amcContractId && serviceTicket.serviceSchedule) {
      const amcContract = await AMCContract.findById(serviceTicket.amcContractId);
      if (amcContract) {
        if (serviceTicket.serviceSchedule === 'First Service') {
          amcContract.serviceSchedule.firstService.status = 'Completed';
          amcContract.serviceSchedule.firstService.actualDate = new Date();
        } else if (serviceTicket.serviceSchedule === 'Second Service') {
          amcContract.serviceSchedule.secondService.status = 'Completed';
          amcContract.serviceSchedule.secondService.actualDate = new Date();
        }
        await amcContract.save();
      }
    }
    
    res.json(serviceTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete service ticket
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceTicket = await ServiceTicket.findById(req.params.id);
    
    if (!serviceTicket) {
      return res.status(404).json({ message: 'Service Ticket not found' });
    }
    
    // Remove service visit reference from AMC contract
    if (serviceTicket.amcContractId && serviceTicket.serviceSchedule) {
      const amcContract = await AMCContract.findById(serviceTicket.amcContractId);
      if (amcContract) {
        if (serviceTicket.serviceSchedule === 'First Service') {
          amcContract.serviceSchedule.firstService.serviceVisitId = null;
          amcContract.serviceSchedule.firstService.status = 'Scheduled';
        } else if (serviceTicket.serviceSchedule === 'Second Service') {
          amcContract.serviceSchedule.secondService.serviceVisitId = null;
          amcContract.serviceSchedule.secondService.status = 'Scheduled';
        }
        await amcContract.save();
      }
    }
    
    await ServiceTicket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ticket statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await ServiceTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalCount = await ServiceTicket.countDocuments();
    const overdueCount = await ServiceTicket.countDocuments({
      status: { $in: ['Scheduled', 'Assigned'] },
      scheduledDate: { $lt: new Date() }
    });
    
    const todayCount = await ServiceTicket.countDocuments({
      scheduledDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    const thisWeekCount = await ServiceTicket.countDocuments({
      scheduledDate: {
        $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
        $lt: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7))
      }
    });
    
    res.json({
      statusBreakdown: stats,
      totalCount,
      overdueCount,
      todayCount,
      thisWeekCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get FSE dashboard data
router.get('/fse/:fseId/dashboard', authenticateToken, async (req, res) => {
  try {
    const { fseId } = req.params;
    
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const [todayTickets, weekTickets, pendingTickets, completedTickets] = await Promise.all([
      ServiceTicket.countDocuments({
        'assignedFSE.fseId': fseId,
        scheduledDate: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }),
      ServiceTicket.countDocuments({
        'assignedFSE.fseId': fseId,
        scheduledDate: { $gte: startOfWeek, $lt: endOfWeek }
      }),
      ServiceTicket.countDocuments({
        'assignedFSE.fseId': fseId,
        status: { $in: ['Scheduled', 'Assigned'] }
      }),
      ServiceTicket.countDocuments({
        'assignedFSE.fseId': fseId,
        status: 'Completed',
        scheduledDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
      })
    ]);
    
    res.json({
      todayTickets,
      weekTickets,
      pendingTickets,
      completedTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
