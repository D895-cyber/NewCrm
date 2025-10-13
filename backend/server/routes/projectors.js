const express = require('express');
const router = express.Router();
const Projector = require('../models/Projector');
const Service = require('../models/Service');
const RMA = require('../models/RMA');
const SparePart = require('../models/SparePart');

// Get all projectors
router.get('/', async (req, res) => {
  try {
    const projectors = await Projector.find().sort({ createdAt: -1 });
    res.json(projectors);
  } catch (error) {
    console.error('Error fetching projectors:', error);
    res.status(500).json({ error: 'Failed to fetch projectors', details: error.message });
  }
});

// Get projector by serial number with full details
router.get('/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    
    // Get projector
    const projector = await Projector.findOne({ serialNumber: serial });
    if (!projector) {
      return res.status(404).json({ error: 'Projector not found' });
    }

    // Get service history
    const services = await Service.find({ projectorSerial: serial })
      .sort({ date: -1 });

    // Get RMA history (case-insensitive search)
    const rmaRecords = await RMA.find({ 
      $or: [
        { projectorSerial: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { defectiveSerialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } },
        { serialNumber: { $regex: new RegExp(`^${serial}$`, 'i') } }
      ]
    }).sort({ issueDate: -1 });

    // Get AMC contract details
    const AMCContract = require('../models/AMCContract');
    const amcContract = await AMCContract.findOne({ projectorSerial: serial })
      .sort({ contractStartDate: -1 });

    // Get service reports for this projector to calculate hours and service count
    const ServiceReport = require('../models/ServiceReport');
    const projectorReports = await ServiceReport.find({ 
      projectorSerial: serial 
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

    // Get associated spare parts (parts used in services)
    const partNumbers = new Set();
    services.forEach(service => {
      if (service.spareParts && Array.isArray(service.spareParts)) {
        service.spareParts.forEach(partNumber => partNumbers.add(partNumber));
      }
    });

    const spareParts = await SparePart.find({
      partNumber: { $in: Array.from(partNumbers) }
    });

    // Combine all data
    const result = {
      ...projector.toObject(),
      serviceHistory: projectorReports, // Use service reports instead of services
      rmaHistory: rmaRecords,
      spareParts: spareParts,
      amcContract: amcContract,
      totalServices,
      hoursUsed: totalHours,
      lifePercentage,
      nextService: nextServiceDate
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching projector details:', error);
    res.status(500).json({ error: 'Failed to fetch projector details', details: error.message });
  }
});

// Create new projector
router.post('/', async (req, res) => {
  try {
    const projector = new Projector(req.body);
    await projector.save();
    res.status(201).json(projector);
  } catch (error) {
    console.error('Error creating projector:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Projector with this serial number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create projector', details: error.message });
    }
  }
});

// Update projector
router.put('/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    const projector = await Projector.findOneAndUpdate(
      { serialNumber: serial },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!projector) {
      return res.status(404).json({ error: 'Projector not found' });
    }
    
    res.json(projector);
  } catch (error) {
    console.error('Error updating projector:', error);
    res.status(500).json({ error: 'Failed to update projector', details: error.message });
  }
});

// Delete projector
router.delete('/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    const projector = await Projector.findOneAndDelete({ serialNumber: serial });
    
    if (!projector) {
      return res.status(404).json({ error: 'Projector not found' });
    }
    
    // Also delete related services and RMA records
    await Promise.all([
      Service.deleteMany({ projectorSerial: serial }),
      RMA.deleteMany({ projectorSerial: serial })
    ]);
    
    res.json({ message: 'Projector and related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting projector:', error);
    res.status(500).json({ error: 'Failed to delete projector', details: error.message });
  }
});

// Advanced search projectors with partial matching
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    // Return empty if query is too short (less than 2 characters)
    if (query.trim().length < 2) {
      return res.json([]);
    }

    const projectors = await Projector.find({
      $or: [
        { serialNumber: { $regex: query, $options: 'i' } },
        { projectorNumber: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { siteName: { $regex: query, $options: 'i' } },
        { siteCode: { $regex: query, $options: 'i' } },
        { auditoriumName: { $regex: query, $options: 'i' } },
        { customer: { $regex: query, $options: 'i' } }
      ]
    }).sort({ 
      // Prioritize exact matches and recent updates
      updatedAt: -1 
    }).limit(50); // Limit results to prevent overwhelming the frontend
    
    // Enhance each projector with service report data
    const ServiceReport = require('../models/ServiceReport');
    const enhancedProjectors = await Promise.all(projectors.map(async (projector) => {
      try {
        const projectorReports = await ServiceReport.find({ 
          projectorSerial: projector.serialNumber 
        }).sort({ date: -1 });

        let totalHours = 0;
        let totalServices = 0;
        let lastServiceDate = null;
        
        if (projectorReports.length > 0) {
          totalServices = projectorReports.length;
          lastServiceDate = new Date(Math.max(...projectorReports.map(r => new Date(r.date).getTime())));
          
          projectorReports.forEach(report => {
            if (report.projectorRunningHours && !isNaN(Number(report.projectorRunningHours))) {
              totalHours += Number(report.projectorRunningHours);
            }
          });
        }

        const lifePercentage = projector.expectedLife ? Math.round((totalHours / projector.expectedLife) * 100) : 0;
        const nextServiceDate = lastServiceDate 
          ? new Date(lastServiceDate.getTime() + (90 * 24 * 60 * 60 * 1000))
          : null;

        return {
          ...projector.toObject(),
          totalServices,
          hoursUsed: totalHours,
          lifePercentage,
          lastService: lastServiceDate,
          nextService: nextServiceDate,
          serviceHistory: projectorReports
        };
      } catch (err) {
        console.error('Error enhancing projector:', err);
        return projector.toObject();
      }
    }));
    
    res.json(enhancedProjectors);
  } catch (error) {
    console.error('Error searching projectors:', error);
    res.status(500).json({ error: 'Failed to search projectors', details: error.message });
  }
});

module.exports = router;