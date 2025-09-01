const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Projector = require('../models/Projector');

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ date: -1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
});

// Get services by projector serial
router.get('/projector/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    const services = await Service.find({ projectorSerial: serial }).sort({ date: -1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services for projector:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service', details: error.message });
  }
});

// Create new service
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();

    // Update projector's service information
    if (service.status === 'Completed') {
      await Projector.findOneAndUpdate(
        { serialNumber: service.projectorSerial },
        {
          $inc: { totalServices: 1 },
          lastService: service.date
        }
      );
    }

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service', details: error.message });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Update projector information if service is completed
    if (service.status === 'Completed' && req.body.status === 'Completed') {
      await Projector.findOneAndUpdate(
        { serialNumber: service.projectorSerial },
        {
          lastService: service.date
        }
      );
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service', details: error.message });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Update projector's total services count
    if (service.status === 'Completed') {
      await Projector.findOneAndUpdate(
        { serialNumber: service.projectorSerial },
        { $inc: { totalServices: -1 } }
      );
    }
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service', details: error.message });
  }
});

// Get services by date range
router.get('/date-range/:start/:end', async (req, res) => {
  try {
    const { start, end } = req.params;
    const services = await Service.find({
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    }).sort({ date: -1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by date range:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
});

// Get services by technician
router.get('/technician/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const services = await Service.find({ 
      technician: { $regex: name, $options: 'i' } 
    }).sort({ date: -1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by technician:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
});

module.exports = router;