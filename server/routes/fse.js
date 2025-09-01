const express = require('express');
const router = express.Router();
const FSE = require('../models/FSE');

// Get all FSEs
router.get('/', async (req, res) => {
  try {
    const fses = await FSE.find().sort({ createdAt: -1 });
    res.json(fses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get FSE by ID
router.get('/:id', async (req, res) => {
  try {
    const fse = await FSE.findById(req.params.id);
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    res.json(fse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new FSE
router.post('/', async (req, res) => {
  try {
    const fse = new FSE(req.body);
    const newFSE = await fse.save();
    res.status(201).json(newFSE);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update FSE
router.put('/:id', async (req, res) => {
  try {
    const fse = await FSE.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    res.json(fse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete FSE
router.delete('/:id', async (req, res) => {
  try {
    const fse = await FSE.findByIdAndDelete(req.params.id);
    if (!fse) {
      return res.status(404).json({ message: 'FSE not found' });
    }
    res.json({ message: 'FSE deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get FSEs by status
router.get('/status/:status', async (req, res) => {
  try {
    const fses = await FSE.find({ status: req.params.status });
    res.json(fses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get FSEs by territory
router.get('/territory/:territory', async (req, res) => {
  try {
    const fses = await FSE.find({ assignedTerritory: req.params.territory });
    res.json(fses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search FSEs
router.get('/search/:query', async (req, res) => {
  try {
    const fses = await FSE.find({
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { email: { $regex: req.params.query, $options: 'i' } },
        { employeeId: { $regex: req.params.query, $options: 'i' } }
      ]
    });
    res.json(fses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get FSE statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalFSEs = await FSE.countDocuments();
    const activeFSEs = await FSE.countDocuments({ status: 'Active' });
    const onDutyFSEs = await FSE.countDocuments({ status: 'On Duty' });
    const onLeaveFSEs = await FSE.countDocuments({ status: 'On Leave' });

    res.json({
      totalFSEs,
      activeFSEs,
      onDutyFSEs,
      onLeaveFSEs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 