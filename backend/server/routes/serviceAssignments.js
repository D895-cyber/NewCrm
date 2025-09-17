const express = require('express');
const router = express.Router();
const ServiceAssignment = require('../models/ServiceAssignment');
const FSE = require('../models/FSE');
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const ServiceVisit = require('../models/ServiceVisit');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Get all service assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, fseId, siteId, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (fseId) filter.fseId = fseId;
    if (siteId) filter.siteId = siteId;
    
    const assignments = await ServiceAssignment.find(filter)
      .populate('fseId', 'name email phone')
      .populate('siteId', 'name address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ServiceAssignment.countDocuments(filter);
    
    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single service assignment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await ServiceAssignment.findById(req.params.id)
      .populate('fseId', 'name email phone')
      .populate('siteId', 'name address')
      .populate('projectors.projectorId', 'serialNumber model auditorium');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new service assignment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      fseId,
      siteId,
      projectors,
      schedulingType,
      schedulingOptions,
      startDate,
      amcContractId,
      amcServiceInterval,
      adminNotes
    } = req.body;
    
    // Validate FSE
    const fse = await FSE.findById(fseId);
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    
    // Validate Site
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    
    // Validate Projectors
    const projectorIds = projectors.map(p => p.projectorId);
    const existingProjectors = await Projector.find({ _id: { $in: projectorIds } });
    
    if (existingProjectors.length !== projectorIds.length) {
      return res.status(400).json({ message: 'One or more projectors not found' });
    }
    
    // Create assignment
    const assignment = new ServiceAssignment({
      title,
      description,
      fseId,
      fseName: fse.name,
      fsePhone: fse.phone,
      fseEmail: fse.email,
      siteId,
      siteName: site.name,
      siteAddress: site.address,
      projectors: projectors.map(p => ({
        ...p,
        projectorSerial: existingProjectors.find(ep => ep._id.toString() === p.projectorId)?.serialNumber
      })),
      schedulingType,
      schedulingOptions,
      startDate: new Date(startDate),
      amcContractId: amcContractId === '' ? null : amcContractId,
      amcServiceInterval,
      adminNotes,
      history: [{
        action: 'Assignment Created',
        performedBy: req.user.name || req.user.email,
        notes: `Created assignment for ${fse.name} at ${site.name}`
      }]
    });
    
    // Generate schedule
    assignment.generateSchedule();
    
    await assignment.save();
    
    // Create individual service visits for each projector
    await createServiceVisitsFromAssignment(assignment);
    
    // Send email notification to FSE
    try {
      if (fse.email && fse.emailPreferences?.assignmentNotifications !== false) {
        await emailService.sendAssignmentNotification(fse.email, fse.name, assignment);
        console.log(`Assignment notification email sent to FSE: ${fse.name} (${fse.email})`);
      }
    } catch (emailError) {
      console.error('Failed to send assignment notification email:', emailError);
      // Don't fail the assignment creation if email fails
    }
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service assignment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    const updates = req.body;
    const oldData = { ...assignment.toObject() };
    
    // Update assignment
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        assignment[key] = updates[key];
      }
    });
    
    // Add to history
    assignment.history.push({
      action: 'Assignment Updated',
      performedBy: req.user.name || req.user.email,
      notes: 'Assignment details updated',
      changes: { old: oldData, new: updates }
    });
    
    await assignment.save();
    
    // Send email notification to FSE about updates
    try {
      const fse = await FSE.findById(assignment.fseId);
      if (fse && fse.email && fse.emailPreferences?.updateNotifications !== false) {
        await emailService.sendAssignmentUpdate(fse.email, fse.name, assignment, updates);
        console.log(`Assignment update email sent to FSE: ${fse.name} (${fse.email})`);
      }
    } catch (emailError) {
      console.error('Failed to send assignment update email:', emailError);
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign FSE to assignment
router.patch('/:id/assign-fse', authenticateToken, async (req, res) => {
  try {
    const { fseId } = req.body;
    
    const fse = await FSE.findById(fseId);
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    // Update FSE assignment
    assignment.fseId = fseId;
    assignment.fseName = fse.name;
    assignment.fsePhone = fse.phone;
    assignment.fseEmail = fse.email;
    assignment.status = 'Assigned';
    
    assignment.history.push({
      action: 'FSE Assigned',
      performedBy: req.user.name || req.user.email,
      notes: `Assigned to ${fse.name}`
    });
    
    await assignment.save();
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start assignment (FSE begins work)
router.patch('/:id/start', authenticateToken, async (req, res) => {
  try {
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    assignment.status = 'In Progress';
    assignment.history.push({
      action: 'Assignment Started',
      performedBy: req.user.name || req.user.email,
      notes: 'FSE started working on assignment'
    });
    
    await assignment.save();
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete a projector in the assignment
router.patch('/:id/complete-projector', authenticateToken, async (req, res) => {
  try {
    const { projectorId, dayNumber, notes } = req.body;
    
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    const success = assignment.markProjectorCompleted(projectorId, dayNumber);
    if (!success) {
      return res.status(400).json({ message: 'Projector not found in schedule' });
    }
    
    assignment.history.push({
      action: 'Projector Completed',
      performedBy: req.user.name || req.user.email,
      notes: notes || `Completed projector ${projectorId} on day ${dayNumber}`
    });
    
    await assignment.save();
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete entire assignment
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    assignment.status = 'Completed';
    assignment.completedDate = new Date();
    assignment.history.push({
      action: 'Assignment Completed',
      performedBy: req.user.name || req.user.email,
      notes: notes || 'Assignment completed successfully'
    });
    
    await assignment.save();
    
    // Send completion email notification to FSE
    try {
      const fse = await FSE.findById(assignment.fseId);
      if (fse && fse.email && fse.emailPreferences?.completionNotifications !== false) {
        await emailService.sendAssignmentCompleted(fse.email, fse.name, assignment);
        console.log(`Assignment completion email sent to FSE: ${fse.name} (${fse.email})`);
      }
    } catch (emailError) {
      console.error('Failed to send assignment completion email:', emailError);
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel assignment
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    assignment.status = 'Cancelled';
    assignment.history.push({
      action: 'Assignment Cancelled',
      performedBy: req.user.name || req.user.email,
      notes: reason || 'Assignment cancelled'
    });
    
    await assignment.save();
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark assignment as unable to complete (FSE unable to complete)
router.patch('/:id/unable-to-complete', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason is required when marking assignment as unable to complete' });
    }
    
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Service assignment not found' });
    }
    
    assignment.status = 'Unable to Complete';
    assignment.unableToCompleteReason = reason.trim();
    assignment.history.push({
      action: 'Assignment Unable to Complete',
      performedBy: req.user.name || req.user.email,
      notes: `FSE unable to complete assignment. Reason: ${reason.trim()}`
    });
    
    await assignment.save();
    
    // Send notification email to admin about unable to complete
    try {
      const fse = await FSE.findById(assignment.fseId);
      if (fse && fse.email) {
        await emailService.sendUnableToCompleteNotification(fse.email, fse.name, assignment, reason);
        console.log(`Unable to complete notification sent for assignment: ${assignment.assignmentId}`);
      }
    } catch (emailError) {
      console.error('Failed to send unable to complete notification email:', emailError);
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get FSE's assignments
router.get('/fse/:fseId', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { fseId: req.params.fseId };
    if (status) filter.status = status;
    
    const assignments = await ServiceAssignment.find(filter)
      .populate('siteId', 'name address')
      .sort({ startDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ServiceAssignment.countDocuments(filter);
    
    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get today's work for FSE
router.get('/fse/:fseId/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const assignments = await ServiceAssignment.find({
      fseId: req.params.fseId,
      status: { $in: ['Assigned', 'In Progress'] },
      'generatedSchedule.date': {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('siteId', 'name address');
    
    const todaysWork = assignments.map(assignment => {
      const todaySchedule = assignment.generatedSchedule.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      
      return {
        assignmentId: assignment._id,
        title: assignment.title,
        siteName: assignment.siteName,
        siteAddress: assignment.siteAddress,
        projectors: todaySchedule ? todaySchedule.projectors : [],
        totalEstimatedHours: todaySchedule ? todaySchedule.totalEstimatedHours : 0,
        status: todaySchedule ? todaySchedule.status : 'Scheduled'
      };
    });
    
    res.json(todaysWork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to create service visits from assignment
async function createServiceVisitsFromAssignment(assignment) {
  const serviceVisits = [];
  
  for (const scheduleDay of assignment.generatedSchedule) {
    for (const projector of scheduleDay.projectors) {
      const serviceVisit = new ServiceVisit({
        visitId: `VISIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fseId: assignment.fseId,
        fseName: assignment.fseName,
        siteId: assignment.siteId,
        siteName: assignment.siteName,
        projectorSerial: projector.projectorSerial,
        visitType: projector.serviceType,
        scheduledDate: scheduleDay.date,
        priority: projector.priority,
        description: projector.notes || `Service for ${projector.projectorModel}`,
        status: 'Scheduled',
        amcContractId: assignment.amcContractId,
        amcServiceInterval: assignment.amcServiceInterval
      });
      
      serviceVisits.push(serviceVisit);
    }
  }
  
  await ServiceVisit.insertMany(serviceVisits);
  return serviceVisits;
}

// Send daily reminders to FSEs
router.post('/send-daily-reminders', authenticateToken, async (req, res) => {
  try {
    const fses = await FSE.find({ 
      status: 'Active',
      'emailPreferences.dailyReminders': true 
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const fse of fses) {
      try {
        // Get today's work for this FSE
        const todaysWork = await getTodaysWorkForFSE(fse._id);
        
        if (todaysWork.length > 0) {
          await emailService.sendDailyReminder(fse.email, fse.name, todaysWork);
          emailsSent++;
          console.log(`Daily reminder sent to FSE: ${fse.name} (${fse.email})`);
        }
      } catch (error) {
        emailsFailed++;
        console.error(`Failed to send daily reminder to ${fse.name}:`, error);
      }
    }

    res.json({
      message: 'Daily reminders processed',
      emailsSent,
      emailsFailed,
      totalFSEs: fses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test email service
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ message: 'Test email address is required' });
    }

    const success = await emailService.testEmailService(testEmail);
    
    if (success) {
      res.json({ 
        message: 'Test email sent successfully',
        testEmail 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send test email',
        testEmail 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to get today's work for FSE
async function getTodaysWorkForFSE(fseId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const assignments = await ServiceAssignment.find({
    fseId: fseId,
    status: { $in: ['Assigned', 'In Progress'] },
    'generatedSchedule.date': {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  }).populate('siteId', 'name address');

  return assignments.map(assignment => {
    const todaySchedule = assignment.generatedSchedule.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    return {
      assignmentId: assignment._id,
      title: assignment.title,
      siteName: assignment.siteName,
      siteAddress: assignment.siteAddress,
      projectors: todaySchedule ? todaySchedule.projectors : [],
      totalEstimatedHours: todaySchedule ? todaySchedule.totalEstimatedHours : 0,
      status: todaySchedule ? todaySchedule.status : 'Scheduled'
    };
  });
}

module.exports = router;
