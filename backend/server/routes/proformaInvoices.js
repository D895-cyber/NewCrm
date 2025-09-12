const express = require('express');
const router = express.Router();
const ProformaInvoice = require('../models/ProformaInvoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const { authenticateToken } = require('../middleware/auth');

// Get all proforma invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientName, dateFrom, dateTo } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (clientName) query.clientName = { $regex: clientName, $options: 'i' };
    if (dateFrom || dateTo) {
      query.issueDate = {};
      if (dateFrom) query.issueDate.$gte = new Date(dateFrom);
      if (dateTo) query.issueDate.$lte = new Date(dateTo);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { issueDate: -1 }
    };
    
    const proformaInvoices = await ProformaInvoice.find(query)
      .populate('purchaseOrderId', 'poNumber customer customerSite')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ issueDate: -1 })
      .exec();
    
    const count = await ProformaInvoice.countDocuments(query);
    
    res.json({
      proformaInvoices,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get proforma invoice by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const proformaInvoice = await ProformaInvoice.findById(req.params.id)
      .populate('purchaseOrderId', 'poNumber customer customerSite lineItems totalAmount');
    
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    
    res.json(proformaInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new proforma invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const proformaInvoice = new ProformaInvoice(req.body);
    
    // Add to history
    proformaInvoice.history.push({
      action: 'Created',
      performedBy: req.user.name || req.user.email,
      notes: 'Proforma Invoice created'
    });
    
    const savedProformaInvoice = await proformaInvoice.save();
    
    // Update PO with PI reference
    if (savedProformaInvoice.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(
        savedProformaInvoice.purchaseOrderId,
        {
          'proformaInvoice.piId': savedProformaInvoice._id,
          'proformaInvoice.piNumber': savedProformaInvoice.piNumber,
          'proformaInvoice.status': 'Generated',
          $push: {
            history: {
              action: 'PI Generated',
              performedBy: req.user.name || req.user.email,
              notes: `PI ${savedProformaInvoice.piNumber} generated`
            }
          }
        }
      );
    }
    
    res.status(201).json(savedProformaInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate PI from PO
router.post('/generate-from-po/:poId', authenticateToken, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.poId);
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    // Check if PI already exists
    if (po.proformaInvoice.piId) {
      return res.status(400).json({ message: 'PI already exists for this PO' });
    }
    
    // Create PI from PO data
    const piData = {
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      clientName: po.customer,
      clientSite: po.customerSite,
      clientAddress: po.customerAddress,
      clientContact: po.customerContact,
      lineItems: po.lineItems,
      subtotal: po.subtotal,
      taxRate: po.taxRate,
      discount: po.discount,
      paymentTerms: 'Net 30',
      currency: 'INR',
      notes: req.body.notes || '',
      termsAndConditions: req.body.termsAndConditions || ''
    };
    
    const proformaInvoice = new ProformaInvoice(piData);
    
    // Add to history
    proformaInvoice.history.push({
      action: 'Created',
      performedBy: req.user.name || req.user.email,
      notes: `PI generated from PO ${po.poNumber}`
    });
    
    const savedProformaInvoice = await proformaInvoice.save();
    
    // Update PO with PI reference
    await PurchaseOrder.findByIdAndUpdate(
      po._id,
      {
        'proformaInvoice.piId': savedProformaInvoice._id,
        'proformaInvoice.piNumber': savedProformaInvoice.piNumber,
        'proformaInvoice.status': 'Generated',
        $push: {
          history: {
            action: 'PI Generated',
            performedBy: req.user.name || req.user.email,
            notes: `PI ${savedProformaInvoice.piNumber} generated`
          }
        }
      }
    );
    
    res.status(201).json(savedProformaInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update proforma invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add to history
    updateData.history = {
      action: 'Updated',
      performedBy: req.user.name || req.user.email,
      notes: req.body.updateNotes || 'Proforma Invoice updated'
    };
    
    const proformaInvoice = await ProformaInvoice.findByIdAndUpdate(
      id,
      { $push: { history: updateData.history }, ...updateData },
      { new: true, runValidators: true }
    );
    
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    
    res.json(proformaInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update PI status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const proformaInvoice = await ProformaInvoice.findByIdAndUpdate(
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
    
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    
    // Update PO PI status if status is changed
    if (proformaInvoice.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(
        proformaInvoice.purchaseOrderId,
        {
          'proformaInvoice.status': status
        }
      );
    }
    
    res.json(proformaInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send PI to customer
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sendMethod, recipientEmail, notes } = req.body;
    
    const proformaInvoice = await ProformaInvoice.findByIdAndUpdate(
      id,
      {
        status: 'Sent',
        $push: {
          history: {
            action: 'Sent',
            performedBy: req.user.name || req.user.email,
            notes: `PI sent via ${sendMethod}${notes ? `: ${notes}` : ''}`
          }
        }
      },
      { new: true }
    );
    
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    
    // Update PO PI status
    if (proformaInvoice.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(
        proformaInvoice.purchaseOrderId,
        {
          'proformaInvoice.status': 'Sent'
        }
      );
    }
    
    // TODO: Implement actual sending logic (email, etc.)
    
    res.json(proformaInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete proforma invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const proformaInvoice = await ProformaInvoice.findById(req.params.id);
    
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    
    // Remove PI reference from PO
    if (proformaInvoice.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(
        proformaInvoice.purchaseOrderId,
        {
          'proformaInvoice.piId': null,
          'proformaInvoice.piNumber': null,
          'proformaInvoice.status': 'Not Generated'
        }
      );
    }
    
    await ProformaInvoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Proforma Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get PI statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await ProformaInvoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalCount = await ProformaInvoice.countDocuments();
    const totalAmount = await ProformaInvoice.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const overdueCount = await ProformaInvoice.countDocuments({
      status: 'Sent',
      dueDate: { $lt: new Date() }
    });
    
    res.json({
      statusBreakdown: stats,
      totalCount,
      totalAmount: totalAmount[0]?.total || 0,
      overdueCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
