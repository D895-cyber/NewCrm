const express = require('express');
const router = express.Router();
const WorkflowService = require('../services/WorkflowService');
const CommunicationService = require('../services/CommunicationService');
const RMA = require('../models/RMA');

// Auto-assign RMA
router.post('/assign/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const rma = await WorkflowService.autoAssignRMA(rmaId);
    
    if (rma) {
      res.json({
        success: true,
        message: 'RMA assigned successfully',
        data: rma
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'RMA not found or assignment failed'
      });
    }
  } catch (error) {
    console.error('Error auto-assigning RMA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign RMA',
      error: error.message
    });
  }
});

// Check SLA breaches
router.get('/sla-breaches', async (req, res) => {
  try {
    const breaches = await WorkflowService.checkSLABreaches();
    res.json({
      success: true,
      data: breaches,
      count: breaches.length
    });
  } catch (error) {
    console.error('Error checking SLA breaches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check SLA breaches',
      error: error.message
    });
  }
});

// Auto-escalate RMAs
router.post('/escalate', async (req, res) => {
  try {
    const escalated = await WorkflowService.autoEscalateRMAs();
    res.json({
      success: true,
      message: `${escalated.length} RMAs escalated`,
      data: escalated
    });
  } catch (error) {
    console.error('Error auto-escalating RMAs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate RMAs',
      error: error.message
    });
  }
});

// Process workflow action
router.post('/process/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const { action, data } = req.body;
    
    const result = await WorkflowService.processWorkflow(rmaId, action, data);
    
    if (result) {
      res.json({
        success: true,
        message: 'Workflow processed successfully',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'RMA not found or workflow processing failed'
      });
    }
  } catch (error) {
    console.error('Error processing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process workflow',
      error: error.message
    });
  }
});

// Add comment to RMA
router.post('/comments/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const { comment, author, type } = req.body;
    
    const newComment = await CommunicationService.addComment(rmaId, comment, author, type);
    
    if (newComment) {
      res.json({
        success: true,
        message: 'Comment added successfully',
        data: newComment
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'RMA not found or comment addition failed'
      });
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Get RMA comments
router.get('/comments/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const { includeInternal } = req.query;
    
    const comments = await CommunicationService.getComments(rmaId, includeInternal === 'true');
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message
    });
  }
});

// Send status update notification
router.post('/notify/status-update/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const { oldStatus, newStatus, updatedBy, comments } = req.body;
    
    const success = await CommunicationService.sendStatusUpdate(
      rmaId, 
      oldStatus, 
      newStatus, 
      updatedBy, 
      comments
    );
    
    if (success) {
      res.json({
        success: true,
        message: 'Status update notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send status update notification'
      });
    }
  } catch (error) {
    console.error('Error sending status update notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send assignment notification
router.post('/notify/assignment/:rmaId', async (req, res) => {
  try {
    const { rmaId } = req.params;
    const { assignee } = req.body;
    
    const success = await CommunicationService.sendAssignmentNotification(rmaId, assignee);
    
    if (success) {
      res.json({
        success: true,
        message: 'Assignment notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send assignment notification'
      });
    }
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send bulk notification
router.post('/notify/bulk', async (req, res) => {
  try {
    const { recipients, subject, message, rmaData } = req.body;
    
    const success = await CommunicationService.sendBulkNotification(
      recipients, 
      subject, 
      message, 
      rmaData
    );
    
    if (success) {
      res.json({
        success: true,
        message: 'Bulk notification sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notification'
      });
    }
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Get workflow rules
router.get('/rules', async (req, res) => {
  try {
    const rules = {
      assignment: WorkflowService.workflowRules.assignment,
      sla: WorkflowService.workflowRules.sla,
      escalation: WorkflowService.workflowRules.escalation
    };
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting workflow rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow rules',
      error: error.message
    });
  }
});

// Update workflow rules
router.put('/rules', async (req, res) => {
  try {
    const { assignment, sla, escalation } = req.body;
    
    if (assignment) {
      WorkflowService.workflowRules.assignment = { ...WorkflowService.workflowRules.assignment, ...assignment };
    }
    if (sla) {
      WorkflowService.workflowRules.sla = { ...WorkflowService.workflowRules.sla, ...sla };
    }
    if (escalation) {
      WorkflowService.workflowRules.escalation = { ...WorkflowService.workflowRules.escalation, ...escalation };
    }
    
    res.json({
      success: true,
      message: 'Workflow rules updated successfully',
      data: WorkflowService.workflowRules
    });
  } catch (error) {
    console.error('Error updating workflow rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow rules',
      error: error.message
    });
  }
});

module.exports = router;
































