const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find().sort({ dateRaised: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get purchase order by ID
router.get('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({ id: req.params.id });
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Create new purchase order
router.post('/', async (req, res) => {
  try {
    const purchaseOrderData = {
      ...req.body,
      dateRaised: req.body.dateRaised ? new Date(req.body.dateRaised) : new Date(),
      expectedService: req.body.expectedService ? new Date(req.body.expectedService) : null
    };

    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();
    
    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const updates = {
      ...req.body,
      dateRaised: req.body.dateRaised ? new Date(req.body.dateRaised) : undefined,
      expectedService: req.body.expectedService ? new Date(req.body.expectedService) : undefined
    };

    const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// Delete purchase order
router.delete('/:id', async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOneAndDelete({ id: req.params.id });
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// Get purchase orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ status: req.params.status }).sort({ dateRaised: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get purchase orders by priority
router.get('/priority/:priority', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ priority: req.params.priority }).sort({ dateRaised: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders by priority:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Search purchase orders
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const purchaseOrders = await PurchaseOrder.find({
      $or: [
        { id: { $regex: query, $options: 'i' } },
        { customer: { $regex: query, $options: 'i' } },
        { site: { $regex: query, $options: 'i' } }
      ]
    }).sort({ dateRaised: -1 });
    
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error searching purchase orders:', error);
    res.status(500).json({ error: 'Failed to search purchase orders' });
  }
});

// Get purchase order statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          draft: {
            $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get overdue count
    const overdueCount = await PurchaseOrder.countDocuments({
      status: 'Approved',
      expectedDelivery: { $lt: new Date() }
    });

    const result = stats[0] || {
      total: 0,
      totalAmount: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      overdue: overdueCount
    };

    result.overdue = overdueCount;

    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase order stats:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order statistics' });
  }
});

module.exports = router; 