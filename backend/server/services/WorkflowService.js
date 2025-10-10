const nodemailer = require('nodemailer');
const RMA = require('../models/RMA');
const Projector = require('../models/Projector');

class WorkflowService {
  constructor() {
    this.emailTransporter = this.initializeEmail();
    this.workflowRules = this.initializeWorkflowRules();
  }

  initializeEmail() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    return null;
  }

  initializeWorkflowRules() {
    return {
      // Auto-assignment rules
      assignment: {
        'High Priority': 'senior-technician@company.com',
        'Critical': 'manager@company.com',
        'Under Review': 'review-team@company.com',
        'Replacement Approved': 'logistics@company.com'
      },
      
      // SLA rules (in hours)
      sla: {
        'High': 24,
        'Critical': 4,
        'Medium': 72,
        'Low': 168
      },
      
      // Escalation rules
      escalation: {
        'Under Review': 48, // Escalate after 48 hours
        'Replacement Approved': 24, // Escalate after 24 hours
        'In Progress': 72 // Escalate after 72 hours
      }
    };
  }

  // Auto-assign RMA based on priority and rules
  async autoAssignRMA(rmaId) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return null;

      const assignment = this.workflowRules.assignment[rma.priority] || 
                        this.workflowRules.assignment[rma.caseStatus] ||
                        'default-technician@company.com';

      rma.assignedTo = assignment;
      rma.assignmentDate = new Date();
      await rma.save();

      // Send assignment notification
      await this.sendAssignmentNotification(rma, assignment);

      return rma;
    } catch (error) {
      console.error('Error auto-assigning RMA:', error);
      return null;
    }
  }

  // Check SLA breaches and send alerts
  async checkSLABreaches() {
    try {
      const rmas = await RMA.find({
        caseStatus: { $nin: ['Completed', 'Rejected'] }
      });

      const breaches = [];
      const now = new Date();

      for (const rma of rmas) {
        const slaHours = this.workflowRules.sla[rma.priority] || 72;
        const createdDate = new Date(rma.ascompRaisedDate);
        const hoursElapsed = (now - createdDate) / (1000 * 60 * 60);

        if (hoursElapsed > slaHours) {
          breaches.push({
            rma,
            hoursElapsed,
            slaHours,
            severity: hoursElapsed > slaHours * 2 ? 'Critical' : 'Warning'
          });
        }
      }

      // Send breach notifications
      if (breaches.length > 0) {
        await this.sendSLABreachNotification(breaches);
      }

      return breaches;
    } catch (error) {
      console.error('Error checking SLA breaches:', error);
      return [];
    }
  }

  // Send assignment notification
  async sendAssignmentNotification(rma, assignee) {
    // If email is not configured, log the notification and return
    if (!this.emailTransporter) {
      console.log(`📧 Email not configured - Assignment notification for RMA ${rma.rmaNumber} to ${assignee}`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: assignee,
      subject: `New RMA Assigned: ${rma.rmaNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New RMA Assignment</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>RMA Details:</h3>
            <p><strong>RMA Number:</strong> ${rma.rmaNumber}</p>
            <p><strong>Site:</strong> ${rma.siteName}</p>
            <p><strong>Product:</strong> ${rma.productName}</p>
            <p><strong>Serial Number:</strong> ${rma.serialNumber}</p>
            <p><strong>Priority:</strong> <span style="color: ${rma.priority === 'High' ? '#dc2626' : rma.priority === 'Critical' ? '#991b1b' : '#059669'}">${rma.priority}</span></p>
            <p><strong>Status:</strong> ${rma.caseStatus}</p>
            <p><strong>Issue:</strong> ${rma.symptoms || 'No description provided'}</p>
          </div>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p><strong>Action Required:</strong> Please review and take appropriate action on this RMA.</p>
            <p><strong>Assigned Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Assignment notification sent to ${assignee}`);
    } catch (error) {
      console.error('Error sending assignment notification:', error);
    }
  }

  // Send SLA breach notification
  async sendSLABreachNotification(breaches) {
    // If email is not configured, log the notification and return
    if (!this.emailTransporter) {
      console.log(`📧 Email not configured - SLA breach notification for ${breaches.length} breaches`);
      return;
    }

    const criticalBreaches = breaches.filter(b => b.severity === 'Critical');
    const warningBreaches = breaches.filter(b => b.severity === 'Warning');

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'manager@company.com,senior-technician@company.com',
      subject: `SLA Breach Alert: ${criticalBreaches.length} Critical, ${warningBreaches.length} Warnings`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #dc2626;">SLA Breach Alert</h2>
          
          ${criticalBreaches.length > 0 ? `
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #dc2626;">🚨 Critical Breaches (${criticalBreaches.length})</h3>
              ${criticalBreaches.map(breach => `
                <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #fecaca;">
                  <p><strong>RMA:</strong> ${breach.rma.rmaNumber} | <strong>Priority:</strong> ${breach.rma.priority} | <strong>Hours Overdue:</strong> ${Math.round(breach.hoursElapsed - breach.slaHours)}</p>
                  <p><strong>Site:</strong> ${breach.rma.siteName} | <strong>Status:</strong> ${breach.rma.caseStatus}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${warningBreaches.length > 0 ? `
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #f59e0b;">⚠️ Warning Breaches (${warningBreaches.length})</h3>
              ${warningBreaches.map(breach => `
                <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #fed7aa;">
                  <p><strong>RMA:</strong> ${breach.rma.rmaNumber} | <strong>Priority:</strong> ${breach.rma.priority} | <strong>Hours Overdue:</strong> ${Math.round(breach.hoursElapsed - breach.slaHours)}</p>
                  <p><strong>Site:</strong> ${breach.rma.siteName} | <strong>Status:</strong> ${breach.rma.caseStatus}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Total Breaches:</strong> ${breaches.length}</p>
            <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Action Required:</strong> Please review and take immediate action on critical breaches.</p>
          </div>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`SLA breach notification sent for ${breaches.length} breaches`);
    } catch (error) {
      console.error('Error sending SLA breach notification:', error);
    }
  }

  // Auto-escalate RMAs based on rules
  async autoEscalateRMAs() {
    try {
      const rmas = await RMA.find({
        caseStatus: { $nin: ['Completed', 'Rejected'] }
      });

      const escalated = [];
      const now = new Date();

      for (const rma of rmas) {
        const escalationHours = this.workflowRules.escalation[rma.caseStatus];
        if (!escalationHours) continue;

        const statusDate = new Date(rma.updatedAt || rma.createdAt);
        const hoursElapsed = (now - statusDate) / (1000 * 60 * 60);

        if (hoursElapsed > escalationHours) {
          // Escalate the RMA
          const oldStatus = rma.caseStatus;
          rma.caseStatus = this.getEscalatedStatus(rma.caseStatus);
          rma.escalationDate = new Date();
          rma.escalationReason = `Auto-escalated after ${Math.round(hoursElapsed)} hours in ${oldStatus} status`;
          await rma.save();

          escalated.push({ rma, oldStatus, newStatus: rma.caseStatus });
        }
      }

      // Send escalation notifications
      if (escalated.length > 0) {
        await this.sendEscalationNotification(escalated);
      }

      return escalated;
    } catch (error) {
      console.error('Error auto-escalating RMAs:', error);
      return [];
    }
  }

  getEscalatedStatus(currentStatus) {
    const escalationMap = {
      'Under Review': 'Sent to CDS',
      'Sent to CDS': 'CDS Approved',
      'CDS Approved': 'Replacement Shipped',
      'Replacement Shipped': 'Replacement Received',
      'Replacement Received': 'Installation Complete',
      'Installation Complete': 'Faulty Part Returned',
      'Faulty Part Returned': 'CDS Confirmed Return',
      'CDS Confirmed Return': 'Completed'
    };
    return escalationMap[currentStatus] || 'Under Investigation';
  }

  // Send escalation notification
  async sendEscalationNotification(escalated) {
    if (!this.emailTransporter) return;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'manager@company.com,senior-technician@company.com',
      subject: `RMA Escalation Alert: ${escalated.length} RMAs Escalated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #dc2626;">RMA Escalation Alert</h2>
          <p>The following RMAs have been automatically escalated due to extended processing time:</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${escalated.map(esc => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #fecaca;">
                <p><strong>RMA:</strong> ${esc.rma.rmaNumber}</p>
                <p><strong>Site:</strong> ${esc.rma.siteName}</p>
                <p><strong>Status Change:</strong> ${esc.oldStatus} → ${esc.newStatus}</p>
                <p><strong>Reason:</strong> ${esc.rma.escalationReason}</p>
                <p><strong>Escalated At:</strong> ${new Date(esc.rma.escalationDate).toLocaleString()}</p>
              </div>
            `).join('')}
          </div>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Total Escalated:</strong> ${escalated.length}</p>
            <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Action Required:</strong> Please review escalated RMAs and take appropriate action.</p>
          </div>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Escalation notification sent for ${escalated.length} RMAs`);
    } catch (error) {
      console.error('Error sending escalation notification:', error);
    }
  }

  // Process workflow for a specific RMA
  async processWorkflow(rmaId, action, data = {}) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return null;

      switch (action) {
        case 'assign':
          return await this.autoAssignRMA(rmaId);
        
        case 'escalate':
          rma.caseStatus = this.getEscalatedStatus(rma.caseStatus);
          rma.escalationDate = new Date();
          rma.escalationReason = data.reason || 'Manual escalation';
          await rma.save();
          return rma;
        
        case 'update_status':
          rma.caseStatus = data.status;
          rma.updatedAt = new Date();
          await rma.save();
          
          // Check if this triggers any workflow rules
          if (data.status === 'Replacement Approved') {
            await this.autoAssignRMA(rmaId);
          }
          
          return rma;
        
        default:
          return rma;
      }
    } catch (error) {
      console.error('Error processing workflow:', error);
      return null;
    }
  }
}

module.exports = new WorkflowService();
