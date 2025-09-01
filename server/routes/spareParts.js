const express = require('express');
const router = express.Router();
const SparePart = require('../models/SparePart');

// Get all spare parts
router.get('/', async (req, res) => {
  try {
    const spareParts = await SparePart.find().sort({ createdAt: -1 });
    res.json(spareParts);
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts', details: error.message });
  }
});

// Get spare part by ID
router.get('/:id', async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.json(sparePart);
  } catch (error) {
    console.error('Error fetching spare part:', error);
    res.status(500).json({ error: 'Failed to fetch spare part', details: error.message });
  }
});

// Create new spare part
router.post('/', async (req, res) => {
  try {
    const sparePart = new SparePart(req.body);
    await sparePart.save();
    res.status(201).json(sparePart);
  } catch (error) {
    console.error('Error creating spare part:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Spare part with this part number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create spare part', details: error.message });
    }
  }
});

// Update spare part
router.put('/:id', async (req, res) => {
  try {
    const sparePart = await SparePart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!sparePart) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json(sparePart);
  } catch (error) {
    console.error('Error updating spare part:', error);
    res.status(500).json({ error: 'Failed to update spare part', details: error.message });
  }
});

// Delete spare part
router.delete('/:id', async (req, res) => {
  try {
    const sparePart = await SparePart.findByIdAndDelete(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error('Error deleting spare part:', error);
    res.status(500).json({ error: 'Failed to delete spare part', details: error.message });
  }
});

// Get spare parts by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const spareParts = await SparePart.find({ category }).sort({ createdAt: -1 });
    res.json(spareParts);
  } catch (error) {
    console.error('Error fetching spare parts by category:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts', details: error.message });
  }
});

// Get spare parts by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const spareParts = await SparePart.find({ status }).sort({ createdAt: -1 });
    res.json(spareParts);
  } catch (error) {
    console.error('Error fetching spare parts by status:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts', details: error.message });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockParts = await SparePart.find({
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    }).sort({ stockQuantity: 1 });
    
    res.json(lowStockParts);
  } catch (error) {
    console.error('Error fetching low stock parts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock parts', details: error.message });
  }
});

// Search spare parts
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const spareParts = await SparePart.find({
      $or: [
        { partNumber: { $regex: query, $options: 'i' } },
        { partName: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { projectorModel: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(spareParts);
  } catch (error) {
    console.error('Error searching spare parts:', error);
    res.status(500).json({ error: 'Failed to search spare parts', details: error.message });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    
    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
      return res.status(400).json({ error: 'Invalid stock quantity' });
    }
    
    const sparePart = await SparePart.findByIdAndUpdate(
      req.params.id,
      { stockQuantity },
      { new: true, runValidators: true }
    );
    
    if (!sparePart) {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    
    res.json(sparePart);
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    res.status(500).json({ error: 'Failed to update stock quantity', details: error.message });
  }
});

// Get spare parts statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await SparePart.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          inStock: {
            $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] }
          },
          rmaPending: {
            $sum: { $cond: [{ $eq: ['$status', 'RMA Pending'] }, 1, 0] }
          },
          rmaApproved: {
            $sum: { $cond: [{ $eq: ['$status', 'RMA Approved'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      rmaPending: 0,
      rmaApproved: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching spare parts stats:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts statistics' });
  }
});

module.exports = router;