const express = require('express');
const router = express.Router();
const Projector = require('../models/Projector');
const ProjectorMovement = require('../models/ProjectorMovement');
const ProjectorStatus = require('../models/ProjectorStatus');
const Site = require('../models/Site');
const notificationService = require('../services/projectorNotificationService');

// Get all projector movements
router.get('/movements', async (req, res) => {
  try {
    const { page = 1, limit = 50, movementType, siteId, projectorId } = req.query;
    const query = {};

    if (movementType) query.movementType = movementType;
    if (siteId) {
      query.$or = [
        { 'previousLocation.siteId': siteId },
        { 'newLocation.siteId': siteId }
      ];
    }
    if (projectorId) query.projectorId = projectorId;

    const movements = await ProjectorMovement.find(query)
      .populate('projectorId', 'projectorNumber serialNumber model brand')
      .populate('previousLocation.siteId', 'name siteCode')
      .populate('newLocation.siteId', 'name siteCode')
      .populate('swapWithProjector.projectorId', 'projectorNumber serialNumber')
      .sort({ movementDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectorMovement.countDocuments(query);

    res.json({
      movements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching projector movements:', error);
    res.status(500).json({ error: 'Failed to fetch movements', details: error.message });
  }
});

// Get movement history for a specific projector
router.get('/movements/projector/:projectorId', async (req, res) => {
  try {
    const { projectorId } = req.params;
    const { limit = 50 } = req.query;

    const movements = await ProjectorMovement.getProjectorHistory(projectorId, limit);

    res.json(movements);
  } catch (error) {
    console.error('Error fetching projector movement history:', error);
    res.status(500).json({ error: 'Failed to fetch movement history', details: error.message });
  }
});

// Get movements for a specific site
router.get('/movements/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 100 } = req.query;

    const movements = await ProjectorMovement.getSiteMovements(siteId, limit);

    res.json(movements);
  } catch (error) {
    console.error('Error fetching site movements:', error);
    res.status(500).json({ error: 'Failed to fetch site movements', details: error.message });
  }
});

// Create a new projector movement
router.post('/movements', async (req, res) => {
  try {
    const {
      projectorId,
      movementType,
      previousLocation,
      newLocation,
      previousStatus,
      newStatus,
      swapWithProjector,
      reason,
      notes,
      performedBy,
      technician,
      authorizedBy,
      movementCost,
      laborCost,
      transportationCost
    } = req.body;

    // Validate required fields
    if (!projectorId || !movementType || !reason || !performedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get projector details
    const projector = await Projector.findById(projectorId);
    if (!projector) {
      return res.status(404).json({ error: 'Projector not found' });
    }

    // Create movement record
    const movement = new ProjectorMovement({
      projectorId,
      projectorNumber: projector.projectorNumber,
      serialNumber: projector.serialNumber,
      movementType,
      previousLocation: previousLocation || {
        siteId: projector.siteId,
        siteName: projector.siteName,
        siteCode: projector.siteCode,
        auditoriumId: projector.auditoriumId,
        auditoriumName: projector.auditoriumName,
        position: projector.position,
        rackPosition: projector.rackPosition
      },
      newLocation,
      previousStatus: previousStatus || projector.status,
      newStatus,
      swapWithProjector,
      reason,
      notes,
      performedBy,
      technician,
      authorizedBy,
      movementCost: movementCost || 0,
      laborCost: laborCost || 0,
      transportationCost: transportationCost || 0
    });

    await movement.save();

    // Update projector location and status if new location provided
    if (newLocation) {
      projector.siteId = newLocation.siteId;
      projector.siteName = newLocation.siteName;
      projector.siteCode = newLocation.siteCode;
      projector.auditoriumId = newLocation.auditoriumId;
      projector.auditoriumName = newLocation.auditoriumName;
      projector.position = newLocation.position;
      projector.rackPosition = newLocation.rackPosition;
      projector.currentLocation = newLocation;
    }

    if (newStatus) {
      projector.status = newStatus;
    }

    projector.lastMovementDate = new Date();
    projector.totalMovements += 1;

    await projector.save();

    // Handle swap if applicable
    if (movementType === 'Swap' && swapWithProjector?.projectorId) {
      const swapProjector = await Projector.findById(swapWithProjector.projectorId);
      if (swapProjector) {
        // Create reverse movement for the swapped projector
        const reverseMovement = new ProjectorMovement({
          projectorId: swapProjector._id,
          projectorNumber: swapProjector.projectorNumber,
          serialNumber: swapProjector.serialNumber,
          movementType: 'Swap',
          previousLocation: {
            siteId: swapProjector.siteId,
            siteName: swapProjector.siteName,
            siteCode: swapProjector.siteCode,
            auditoriumId: swapProjector.auditoriumId,
            auditoriumName: swapProjector.auditoriumName,
            position: swapProjector.position,
            rackPosition: swapProjector.rackPosition
          },
          newLocation: previousLocation,
          reason: `Swapped with ${projector.projectorNumber}`,
          performedBy,
          technician,
          authorizedBy
        });

        await reverseMovement.save();

        // Update swapped projector location
        swapProjector.siteId = previousLocation.siteId;
        swapProjector.siteName = previousLocation.siteName;
        swapProjector.siteCode = previousLocation.siteCode;
        swapProjector.auditoriumId = previousLocation.auditoriumId;
        swapProjector.auditoriumName = previousLocation.auditoriumName;
        swapProjector.position = previousLocation.position;
        swapProjector.rackPosition = previousLocation.rackPosition;
        swapProjector.currentLocation = previousLocation;
        swapProjector.lastMovementDate = new Date();
        swapProjector.totalMovements += 1;

        await swapProjector.save();
      }
    }

    // Populate the response
    await movement.populate([
      { path: 'projectorId', select: 'projectorNumber serialNumber model brand' },
      { path: 'previousLocation.siteId', select: 'name siteCode' },
      { path: 'newLocation.siteId', select: 'name siteCode' },
      { path: 'swapWithProjector.projectorId', select: 'projectorNumber serialNumber' }
    ]);

    // Send notifications
    if (movementType === 'Swap' && swapWithProjector?.projectorId) {
      // Find the reverse movement for swap notification
      const reverseMovement = await ProjectorMovement.findOne({
        projectorId: swapWithProjector.projectorId,
        movementType: 'Swap',
        movementDate: movement.movementDate
      });
      
      if (reverseMovement) {
        await notificationService.sendProjectorSwapNotification(movement, reverseMovement);
      }
    } else {
      await notificationService.sendMovementNotification(movement);
    }

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creating projector movement:', error);
    res.status(500).json({ error: 'Failed to create movement', details: error.message });
  }
});

// Get all projector statuses
router.get('/statuses', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, condition, siteId } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (condition) query.condition = condition;
    if (siteId) query['currentLocation.siteId'] = siteId;

    const statuses = await ProjectorStatus.find(query)
      .populate('projectorId', 'projectorNumber serialNumber model brand')
      .populate('currentLocation.siteId', 'name siteCode')
      .sort({ statusChangeDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProjectorStatus.countDocuments(query);

    res.json({
      statuses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching projector statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses', details: error.message });
  }
});

// Get current status of a projector
router.get('/statuses/projector/:projectorId/current', async (req, res) => {
  try {
    const { projectorId } = req.params;

    const status = await ProjectorStatus.getCurrentStatus(projectorId);

    if (!status) {
      return res.status(404).json({ error: 'No current status found for this projector' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error fetching current projector status:', error);
    res.status(500).json({ error: 'Failed to fetch current status', details: error.message });
  }
});

// Get status history for a projector
router.get('/statuses/projector/:projectorId/history', async (req, res) => {
  try {
    const { projectorId } = req.params;
    const { limit = 50 } = req.query;

    const statuses = await ProjectorStatus.getStatusHistory(projectorId, limit);

    res.json(statuses);
  } catch (error) {
    console.error('Error fetching projector status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history', details: error.message });
  }
});

// Create a new status change
router.post('/statuses', async (req, res) => {
  try {
    const {
      projectorId,
      status,
      condition,
      currentLocation,
      reason,
      notes,
      changedBy,
      technician,
      authorizedBy,
      expectedDuration,
      serviceDetails,
      performanceMetrics
    } = req.body;

    // Validate required fields
    if (!projectorId || !status || !condition || !reason || !changedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get projector details
    const projector = await Projector.findById(projectorId);
    if (!projector) {
      return res.status(404).json({ error: 'Projector not found' });
    }

    // Get current status
    const currentStatus = await ProjectorStatus.getCurrentStatus(projectorId);

    // Create new status record
    const statusRecord = new ProjectorStatus({
      projectorId,
      projectorNumber: projector.projectorNumber,
      serialNumber: projector.serialNumber,
      status,
      condition,
      currentLocation: currentLocation || {
        siteId: projector.siteId,
        siteName: projector.siteName,
        siteCode: projector.siteCode,
        auditoriumId: projector.auditoriumId,
        auditoriumName: projector.auditoriumName,
        position: projector.position,
        rackPosition: projector.rackPosition
      },
      previousStatus: currentStatus?.status,
      reason,
      notes,
      changedBy,
      technician,
      authorizedBy,
      expectedDuration,
      serviceDetails,
      performanceMetrics: performanceMetrics || {
        hoursUsed: projector.hoursUsed,
        uptime: projector.uptime,
        lastMaintenanceDate: projector.lastService,
        nextMaintenanceDate: projector.nextService
      }
    });

    await statusRecord.save();

    // Update projector status
    projector.status = status;
    projector.condition = condition;

    if (currentLocation) {
      projector.siteId = currentLocation.siteId;
      projector.siteName = currentLocation.siteName;
      projector.siteCode = currentLocation.siteCode;
      projector.auditoriumId = currentLocation.auditoriumId;
      projector.auditoriumName = currentLocation.auditoriumName;
      projector.position = currentLocation.position;
      projector.rackPosition = currentLocation.rackPosition;
      projector.currentLocation = currentLocation;
    }

    await projector.save();

    // Deactivate previous status if exists
    if (currentStatus) {
      await currentStatus.deactivate(changedBy);
    }

    // Populate the response
    await statusRecord.populate([
      { path: 'projectorId', select: 'projectorNumber serialNumber model brand' },
      { path: 'currentLocation.siteId', select: 'name siteCode' }
    ]);

    // Send notification
    await notificationService.sendStatusChangeNotification(statusRecord);

    res.status(201).json(statusRecord);
  } catch (error) {
    console.error('Error creating projector status:', error);
    res.status(500).json({ error: 'Failed to create status', details: error.message });
  }
});

// Resolve a status
router.patch('/statuses/:statusId/resolve', async (req, res) => {
  try {
    const { statusId } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;

    if (!resolvedBy) {
      return res.status(400).json({ error: 'resolvedBy is required' });
    }

    const status = await ProjectorStatus.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }

    await status.resolve(resolvedBy, resolutionNotes);

    res.json({ message: 'Status resolved successfully', status });
  } catch (error) {
    console.error('Error resolving status:', error);
    res.status(500).json({ error: 'Failed to resolve status', details: error.message });
  }
});

// Get tracking dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalProjectors,
      activeProjectors,
      underServiceProjectors,
      inactiveProjectors,
      recentMovements,
      recentStatusChanges,
      projectorsByStatus,
      movementsByType
    ] = await Promise.all([
      Projector.countDocuments(),
      Projector.countDocuments({ status: 'Active' }),
      Projector.countDocuments({ status: 'Under Service' }),
      Projector.countDocuments({ status: 'Inactive' }),
      ProjectorMovement.find()
        .populate('projectorId', 'projectorNumber serialNumber')
        .populate('previousLocation.siteId', 'name')
        .populate('newLocation.siteId', 'name')
        .sort({ movementDate: -1 })
        .limit(10),
      ProjectorStatus.find({ isActive: true })
        .populate('projectorId', 'projectorNumber serialNumber')
        .populate('currentLocation.siteId', 'name')
        .sort({ statusChangeDate: -1 })
        .limit(10),
      Projector.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ProjectorMovement.aggregate([
        { $group: { _id: '$movementType', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      summary: {
        totalProjectors,
        activeProjectors,
        underServiceProjectors,
        inactiveProjectors
      },
      recentMovements,
      recentStatusChanges,
      projectorsByStatus,
      movementsByType
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

// Get projectors available for swap
router.get('/available-for-swap', async (req, res) => {
  try {
    const { excludeProjectorId, siteId, status } = req.query;
    const query = { isTracked: true };

    if (excludeProjectorId) query._id = { $ne: excludeProjectorId };
    if (siteId) query.siteId = siteId;
    if (status) query.status = status;

    const projectors = await Projector.find(query)
      .select('projectorNumber serialNumber model brand siteName auditoriumName status condition')
      .populate('siteId', 'name siteCode')
      .sort({ siteName: 1, auditoriumName: 1 });

    res.json(projectors);
  } catch (error) {
    console.error('Error fetching available projectors:', error);
    res.status(500).json({ error: 'Failed to fetch available projectors', details: error.message });
  }
});

module.exports = router;
