const express = require('express');
const router = express.Router();
const RMA = require('../models/RMA');

// Get all RMA records
router.get('/', async (req, res) => {
  try {
    const rmaRecords = await RMA.find().sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA records by projector serial
router.get('/projector/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    const rmaRecords = await RMA.find({ projectorSerial: serial }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records for projector:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA by ID
router.get('/:id', async (req, res) => {
  try {
    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    res.json(rma);
  } catch (error) {
    console.error('Error fetching RMA record:', error);
    res.status(500).json({ error: 'Failed to fetch RMA record', details: error.message });
  }
});

// Create new RMA
router.post('/', async (req, res) => {
  try {
    const rma = new RMA(req.body);
    await rma.save();
    res.status(201).json(rma);
  } catch (error) {
    console.error('Error creating RMA:', error);
    res.status(500).json({ error: 'Failed to create RMA', details: error.message });
  }
});

// Update RMA
router.put('/:id', async (req, res) => {
  try {
    const rma = await RMA.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    res.json(rma);
  } catch (error) {
    console.error('Error updating RMA:', error);
    res.status(500).json({ error: 'Failed to update RMA', details: error.message });
  }
});

// Delete RMA
router.delete('/:id', async (req, res) => {
  try {
    const rma = await RMA.findByIdAndDelete(req.params.id);
    
    if (!rma) {
      return res.status(404).json({ error: 'RMA record not found' });
    }
    
    res.json({ message: 'RMA record deleted successfully' });
  } catch (error) {
    console.error('Error deleting RMA:', error);
    res.status(500).json({ error: 'Failed to delete RMA', details: error.message });
  }
});

// Get RMA records by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const rmaRecords = await RMA.find({ status }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by status:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA records by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const rmaRecords = await RMA.find({ priority }).sort({ issueDate: -1 });
    res.json(rmaRecords);
  } catch (error) {
    console.error('Error fetching RMA records by priority:', error);
    res.status(500).json({ error: 'Failed to fetch RMA records', details: error.message });
  }
});

// Get RMA statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await RMA.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          underReview: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Under Review'] }, 1, 0] }
          },
          sentToCDS: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Sent to CDS'] }, 1, 0] }
          },
          cdsApproved: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'CDS Approved'] }, 1, 0] }
          },
          replacementShipped: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Shipped'] }, 1, 0] }
          },
          replacementReceived: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Replacement Received'] }, 1, 0] }
          },
          installationComplete: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Installation Complete'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$caseStatus', 'Rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      underReview: 0,
      sentToCDS: 0,
      cdsApproved: 0,
      replacementShipped: 0,
      replacementReceived: 0,
      installationComplete: 0,
      completed: 0,
      rejected: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching RMA stats:', error);
    res.status(500).json({ error: 'Failed to fetch RMA statistics' });
  }
});

module.exports = router;