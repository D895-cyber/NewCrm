const express = require('express');
const router = express.Router();
const AMCContract = require('../models/AMCContract');
const ServiceVisit = require('../models/ServiceVisit');
const { authenticateToken } = require('./auth');

// Get all AMC contracts
router.get('/', async (req, res) => {
  try {
    const contracts = await AMCContract.find()
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .populate('assignedFSE.fseId', 'fseId fseName')
      .sort({ contractStartDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contract by ID
router.get('/:id', async (req, res) => {
  try {
    const contract = await AMCContract.findById(req.params.id)
      .populate('projector', 'serialNumber model brand site installDate warrantyEnd')
      .populate('site', 'name code address contactPerson phone email')
      .populate('assignedFSE.fseId', 'fseId fseName phone email')
      .populate('serviceSchedule.firstService.serviceVisitId')
      .populate('serviceSchedule.secondService.serviceVisitId');
    
    if (!contract) {
      return res.status(404).json({ message: 'AMC contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new AMC contract
router.post('/', authenticateToken, async (req, res) => {
  try {
    const contractData = req.body;
    
    // Validate required references
    if (!contractData.projector || !contractData.site) {
      return res.status(400).json({ 
        message: 'Projector and Site references are required' 
      });
    }
    
    // Populate projector and site details automatically
    try {
      const Projector = require('../models/Projector');
      const Site = require('../models/Site');
      
      const projector = await Projector.findById(contractData.projector);
      const site = await Site.findById(contractData.site);
      
      if (!projector) {
        return res.status(400).json({ message: 'Projector not found' });
      }
      
      if (!site) {
        return res.status(400).json({ message: 'Site not found' });
      }
      
      // Auto-populate projector details
      contractData.projectorSerial = projector.serialNumber;
      contractData.projectorModel = projector.model;
      contractData.projectorBrand = projector.brand;
      
      // Auto-populate site details
      contractData.siteName = site.name;
      contractData.siteCode = site.code || site.name;
      
    } catch (error) {
      console.error('Error populating projector/site details:', error);
      return res.status(500).json({ 
        message: 'Error linking to projector or site' 
      });
    }
    
    const contract = new AMCContract(contractData);
    
    // Add contract history entry
    contract.contractHistory.push({
      action: 'Created',
      performedBy: req.user.username || 'System',
      notes: 'Contract created'
    });
    
    const newContract = await contract.save();
    
    // Populate the created contract with full details
    const populatedContract = await AMCContract.findById(newContract._id)
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .populate('assignedFSE.fseId', 'fseId fseName');
    
    res.status(201).json(populatedContract);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update AMC contract
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const contract = await AMCContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'AMC contract not found' });
    }
    
    // Add contract history entry for updates
    if (req.body.status && req.body.status !== contract.status) {
      contract.contractHistory.push({
        action: req.body.status === 'Active' ? 'Activated' : 'Suspended',
        performedBy: req.user.username || 'System',
        notes: `Status changed to ${req.body.status}`
      });
    }
    
    const updatedContract = await AMCContract.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedContract);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete AMC contract
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contract = await AMCContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'AMC contract not found' });
    }
    
    // Add termination to history
    contract.contractHistory.push({
      action: 'Terminated',
      performedBy: req.user.username || 'System',
      notes: 'Contract terminated'
    });
    
    contract.status = 'Terminated';
    await contract.save();
    
    res.json({ message: 'AMC contract terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by status
router.get('/status/:status', async (req, res) => {
  try {
    const contracts = await AMCContract.find({ status: req.params.status })
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .sort({ contractStartDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by FSE
router.get('/fse/:fseId', async (req, res) => {
  try {
    const contracts = await AMCContract.find({ 'assignedFSE.fseId': req.params.fseId })
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .sort({ contractStartDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by projector
router.get('/projector/:serialNumber', async (req, res) => {
  try {
    const contracts = await AMCContract.find({ projectorSerial: req.params.serialNumber })
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .populate('assignedFSE.fseId', 'fseId fseName')
      .sort({ contractStartDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts expiring soon
router.get('/expiring/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const contracts = await AMCContract.find({
      contractEndDate: { $lte: expiryDate },
      status: 'Active'
    }).populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address');
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overdue services
router.get('/overdue/services', async (req, res) => {
  try {
    const now = new Date();
    const overdueContracts = await AMCContract.find({
      status: 'Active',
      $or: [
        {
          'serviceSchedule.firstService.status': 'Scheduled',
          'serviceSchedule.firstService.scheduledDate': { $lt: now }
        },
        {
          'serviceSchedule.secondService.status': 'Scheduled',
          'serviceSchedule.secondService.scheduledDate': { $lt: now }
        }
      ]
    }).populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address');
    
    res.json(overdueContracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update service status
router.put('/:id/service/:serviceType/status', authenticateToken, async (req, res) => {
  try {
    const { id, serviceType } = req.params;
    const { status, actualDate, serviceVisitId } = req.body;
    
    const contract = await AMCContract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'AMC contract not found' });
    }
    
    if (serviceType === 'first') {
      contract.serviceSchedule.firstService.status = status;
      if (actualDate) contract.serviceSchedule.firstService.actualDate = actualDate;
      if (serviceVisitId) contract.serviceSchedule.firstService.serviceVisitId = serviceVisitId;
    } else if (serviceType === 'second') {
      contract.serviceSchedule.secondService.status = status;
      if (actualDate) contract.serviceSchedule.secondService.actualDate = actualDate;
      if (serviceVisitId) contract.serviceSchedule.secondService.serviceVisitId = serviceVisitId;
    } else {
      return res.status(400).json({ message: 'Invalid service type. Use "first" or "second"' });
    }
    
    // Add to contract history
    contract.contractHistory.push({
      action: 'Service Completed',
      performedBy: req.user.username || 'System',
      notes: `${serviceType === 'first' ? 'First' : 'Second'} service ${status.toLowerCase()}`
    });
    
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get AMC dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const totalContracts = await AMCContract.countDocuments();
    const activeContracts = await AMCContract.countDocuments({ status: 'Active' });
    const expiredContracts = await AMCContract.countDocuments({ status: 'Expired' });
    const suspendedContracts = await AMCContract.countDocuments({ status: 'Suspended' });
    
    // Contracts expiring soon
    const expiringSoon = await AMCContract.countDocuments({
      contractEndDate: { $lte: thirtyDaysFromNow },
      status: 'Active'
    });
    
    // Overdue services
    const overdueServices = await AMCContract.countDocuments({
      status: 'Active',
      $or: [
        {
          'serviceSchedule.firstService.status': 'Scheduled',
          'serviceSchedule.firstService.scheduledDate': { $lt: now }
        },
        {
          'serviceSchedule.secondService.status': 'Scheduled',
          'serviceSchedule.secondService.scheduledDate': { $lt: now }
        }
      ]
    });
    
    // Upcoming services (next 30 days)
    const upcomingServices = await AMCContract.countDocuments({
      status: 'Active',
      $or: [
        {
          'serviceSchedule.firstService.status': 'Scheduled',
          'serviceSchedule.firstService.scheduledDate': { $gte: now, $lte: thirtyDaysFromNow }
        },
        {
          'serviceSchedule.secondService.status': 'Scheduled',
          'serviceSchedule.secondService.scheduledDate': { $gte: now, $lte: thirtyDaysFromNow }
        }
      ]
    });
    
    // Revenue statistics
    const revenueStats = await AMCContract.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$contractValue' },
          averageValue: { $avg: '$contractValue' },
          paidValue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$contractValue', 0]
            }
          },
          pendingValue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$contractValue', 0]
            }
          }
        }
      }
    ]);
    
    const stats = {
      totalContracts,
      activeContracts,
      expiredContracts,
      suspendedContracts,
      expiringSoon,
      overdueServices,
      upcomingServices,
      revenue: revenueStats[0] || {
        totalValue: 0,
        averageValue: 0,
        paidValue: 0,
        pendingValue: 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by date range
router.get('/date-range/:startDate/:endDate', async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    const endDate = new Date(req.params.endDate);
    
    const contracts = await AMCContract.find({
      contractStartDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address');
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by site
router.get('/site/:siteId', async (req, res) => {
  try {
    const contracts = await AMCContract.find({ site: req.params.siteId })
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .populate('assignedFSE.fseId', 'fseId fseName')
      .sort({ contractStartDate: -1 });
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AMC contracts by projector ID
router.get('/projector-id/:projectorId', async (req, res) => {
  try {
    const contracts = await AMCContract.find({ projector: req.params.projectorId })
      .populate('projector', 'serialNumber model brand site')
      .populate('site', 'name code address')
      .populate('assignedFSE.fseId', 'fseId fseName')
      .sort({ contractStartDate: -1 });
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Renew AMC contract
router.post('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const contract = await AMCContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'AMC contract not found' });
    }
    
    const { renewalPeriod = 12 } = req.body;
    
    // Calculate new dates
    const newStartDate = new Date(contract.contractEndDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + renewalPeriod);
    
    // Create new contract
    const newContract = new AMCContract({
      ...contract.toObject(),
      _id: undefined,
      contractStartDate: newStartDate,
      contractEndDate: newEndDate,
      contractDuration: renewalPeriod,
      serviceSchedule: {
        firstService: {
          scheduledDate: new Date(newStartDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)),
          status: 'Scheduled'
        },
        secondService: {
          scheduledDate: new Date(newStartDate.getTime() + (12 * 30 * 24 * 60 * 60 * 1000)),
          status: 'Scheduled'
        }
      },
      contractHistory: [{
        action: 'Renewed',
        performedBy: req.user.username || 'System',
        notes: `Contract renewed for ${renewalPeriod} months`
      }]
    });
    
    // Update old contract status
    contract.status = 'Expired';
    contract.contractHistory.push({
      action: 'Renewed',
      performedBy: req.user.username || 'System',
      notes: 'Contract renewed'
    });
    await contract.save();
    
    const savedNewContract = await newContract.save();
    res.json(savedNewContract);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get AMC contracts statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await AMCContract.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
          },
          suspended: {
            $sum: { $cond: [{ $eq: ['$status', 'Suspended'] }, 1, 0] }
          },
          terminated: {
            $sum: { $cond: [{ $eq: ['$status', 'Terminated'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get contracts expiring soon (within 30 days)
    const expiringSoon = await AMCContract.countDocuments({
      status: 'Active',
      contractEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Get contracts with pending services
    const pendingServices = await AMCContract.countDocuments({
      status: 'Active',
      $or: [
        { 'serviceSchedule.firstService.status': 'Scheduled' },
        { 'serviceSchedule.secondService.status': 'Scheduled' }
      ]
    });

    const result = stats[0] || {
      total: 0,
      active: 0,
      expired: 0,
      suspended: 0,
      terminated: 0,
      expiringSoon,
      pendingServices
    };

    result.expiringSoon = expiringSoon;
    result.pendingServices = pendingServices;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
