const RMA = require('../models/RMA');
const nodemailer = require('nodemailer');

class CommunicationService {
  constructor() {
    this.emailTransporter = this.initializeEmail();
    this.notificationTemplates = this.initializeTemplates();
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

  initializeTemplates() {
    return {
      statusUpdate: {
        subject: 'RMA Status Update: {rmaNumber}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">RMA Status Update</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>RMA Details:</h3>
              <p><strong>RMA Number:</strong> {rmaNumber}</p>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Product:</strong> {productName}</p>
              <p><strong>Previous Status:</strong> {oldStatus}</p>
              <p><strong>New Status:</strong> <span style="color: {statusColor};">{newStatus}</span></p>
              <p><strong>Updated By:</strong> {updatedBy}</p>
              <p><strong>Update Time:</strong> {updateTime}</p>
              {comments}
            </div>
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p><strong>Next Steps:</strong> {nextSteps}</p>
            </div>
          </div>
        `
      },
      assignment: {
        subject: 'New RMA Assignment: {rmaNumber}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New RMA Assignment</h2>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>RMA Details:</h3>
              <p><strong>RMA Number:</strong> {rmaNumber}</p>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Product:</strong> {productName}</p>
              <p><strong>Serial Number:</strong> {serialNumber}</p>
              <p><strong>Priority:</strong> <span style="color: {priorityColor};">{priority}</span></p>
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Issue Description:</strong> {issueDescription}</p>
            </div>
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p><strong>Action Required:</strong> Please review and take appropriate action on this RMA.</p>
              <p><strong>Assigned Date:</strong> {assignedDate}</p>
            </div>
          </div>
        `
      },
      escalation: {
        subject: 'RMA Escalation Alert: {rmaNumber}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">RMA Escalation Alert</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3>Escalated RMA:</h3>
              <p><strong>RMA Number:</strong> {rmaNumber}</p>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Previous Status:</strong> {oldStatus}</p>
              <p><strong>New Status:</strong> {newStatus}</p>
              <p><strong>Escalation Reason:</strong> {escalationReason}</p>
              <p><strong>Time in Previous Status:</strong> {timeInStatus}</p>
            </div>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
              <p><strong>Action Required:</strong> This RMA requires immediate attention due to extended processing time.</p>
            </div>
          </div>
        `
      },
      slaBreach: {
        subject: 'SLA Breach Alert: {rmaNumber}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">SLA Breach Alert</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3>Breached RMA:</h3>
              <p><strong>RMA Number:</strong> {rmaNumber}</p>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Priority:</strong> {priority}</p>
              <p><strong>Current Status:</strong> {status}</p>
              <p><strong>SLA Hours:</strong> {slaHours}</p>
              <p><strong>Hours Elapsed:</strong> {hoursElapsed}</p>
              <p><strong>Hours Overdue:</strong> {hoursOverdue}</p>
            </div>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
              <p><strong>Action Required:</strong> This RMA has exceeded its SLA and requires immediate attention.</p>
            </div>
          </div>
        `
      }
    };
  }

  // Send status update notification
  async sendStatusUpdate(rmaId, oldStatus, newStatus, updatedBy, comments = '') {
    try {
      console.log(`🔍 Sending status update notification for RMA ID: ${rmaId}`);
      
      // If email is not configured, log the notification and return true
      if (!this.emailTransporter) {
        console.log(`📧 Email not configured - Status update notification: ${oldStatus} → ${newStatus}`);
        return true;
      }

      // Create a simple notification without database lookup
      const statusColors = {
        'Under Review': '#f59e0b',
        'Replacement Approved': '#059669',
        'In Progress': '#2563eb',
        'Completed': '#059669',
        'Rejected': '#dc2626'
      };

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">RMA Status Update</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>RMA Details:</h3>
            <p><strong>RMA ID:</strong> ${rmaId}</p>
            <p><strong>Status Change:</strong> <span style="color: ${statusColors[newStatus] || '#6b7280'}">${oldStatus} → ${newStatus}</span></p>
            <p><strong>Updated By:</strong> ${updatedBy}</p>
            <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || 'admin@projectorcare.com',
        subject: `RMA Status Update: ${rmaId}`,
        html: html
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`📧 Status update notification sent for RMA ID: ${rmaId}`);
      return true;
    } catch (error) {
      console.error('Error sending status update notification:', error);
      return false;
    }
  }

  // Send assignment notification
  async sendAssignmentNotification(rmaId, assignee) {
    try {
      console.log(`🔍 Sending assignment notification for RMA ID: ${rmaId} to ${assignee}`);
      
      // If email is not configured, log the notification and return true
      if (!this.emailTransporter) {
        console.log(`📧 Email not configured - Assignment notification for RMA ID: ${rmaId} to ${assignee}`);
        return true;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">RMA Assignment Notification</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>RMA Details:</h3>
            <p><strong>RMA ID:</strong> ${rmaId}</p>
            <p><strong>Assigned To:</strong> ${assignee}</p>
            <p><strong>Assignment Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Action Required:</strong> Please review and take appropriate action on this RMA.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: assignee,
        subject: `RMA Assignment: ${rmaId}`,
        html: html
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`📧 Assignment notification sent for RMA ID: ${rmaId} to ${assignee}`);
      return true;
    } catch (error) {
      console.error('Error sending assignment notification:', error);
      return false;
    }
  }

  // Send escalation notification
  async sendEscalationNotification(rmaId, oldStatus, newStatus, escalationReason) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma || !this.emailTransporter) return false;

      const template = this.notificationTemplates.escalation;
      const timeInStatus = this.calculateTimeInStatus(rma, oldStatus);

      const html = template.html
        .replace(/{rmaNumber}/g, rma.rmaNumber)
        .replace(/{siteName}/g, rma.siteName)
        .replace(/{oldStatus}/g, oldStatus)
        .replace(/{newStatus}/g, newStatus)
        .replace(/{escalationReason}/g, escalationReason)
        .replace(/{timeInStatus}/g, timeInStatus);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: this.getEscalationRecipients(),
        subject: template.subject.replace(/{rmaNumber}/g, rma.rmaNumber),
        html: html
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Escalation notification sent for RMA ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending escalation notification:', error);
      return false;
    }
  }

  // Send SLA breach notification
  async sendSLABreachNotification(rmaId, slaHours, hoursElapsed) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return false;
      
      // If email is not configured, log the notification and return true
      if (!this.emailTransporter) {
        console.log(`📧 Email not configured - SLA breach notification for RMA ${rma.rmaNumber} (${hoursElapsed}h elapsed, ${slaHours}h SLA)`);
        return true;
      }

      const template = this.notificationTemplates.slaBreach;
      const hoursOverdue = Math.max(0, hoursElapsed - slaHours);

      const html = template.html
        .replace(/{rmaNumber}/g, rma.rmaNumber)
        .replace(/{siteName}/g, rma.siteName)
        .replace(/{priority}/g, rma.priority)
        .replace(/{status}/g, rma.caseStatus)
        .replace(/{slaHours}/g, slaHours)
        .replace(/{hoursElapsed}/g, Math.round(hoursElapsed))
        .replace(/{hoursOverdue}/g, Math.round(hoursOverdue));

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: this.getEscalationRecipients(),
        subject: template.subject.replace(/{rmaNumber}/g, rma.rmaNumber),
        html: html
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`SLA breach notification sent for RMA ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending SLA breach notification:', error);
      return false;
    }
  }

  // Add comment to RMA
  async addComment(rmaId, comment, author, type = 'general') {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return null;

      if (!rma.comments) {
        rma.comments = [];
      }

      const newComment = {
        id: Date.now().toString(),
        comment: comment,
        author: author,
        type: type, // 'general', 'status', 'technical', 'customer'
        timestamp: new Date(),
        isInternal: type === 'technical' || type === 'status'
      };

      rma.comments.push(newComment);
      await rma.save();

      // Send notification if it's a customer-facing comment
      if (!newComment.isInternal) {
        await this.sendCommentNotification(rmaId, newComment);
      }

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  // Get RMA comments
  async getComments(rmaId, includeInternal = false) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma || !rma.comments) return [];

      return rma.comments.filter(comment => 
        includeInternal || !comment.isInternal
      ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Send comment notification
  async sendCommentNotification(rmaId, comment) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) return false;
      
      // If email is not configured, log the notification and return true
      if (!this.emailTransporter) {
        console.log(`📧 Email not configured - Comment notification for RMA ${rma.rmaNumber} by ${comment.author}`);
        return true;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: this.getNotificationRecipients(rma),
        subject: `New Comment on RMA ${rma.rmaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Comment Added</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>RMA Details:</h3>
              <p><strong>RMA Number:</strong> ${rma.rmaNumber}</p>
              <p><strong>Site:</strong> ${rma.siteName}</p>
              <p><strong>Product:</strong> ${rma.productName}</p>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3>Comment:</h3>
              <p><strong>Author:</strong> ${comment.author}</p>
              <p><strong>Type:</strong> ${comment.type}</p>
              <p><strong>Time:</strong> ${comment.timestamp.toLocaleString()}</p>
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p>${comment.comment}</p>
              </div>
            </div>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Comment notification sent for RMA ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending comment notification:', error);
      return false;
    }
  }

  // Get notification recipients for an RMA
  getNotificationRecipients(rma) {
    const recipients = [];
    
    // Add assigned technician
    if (rma.assignedTo) {
      recipients.push(rma.assignedTo);
    }
    
    // Add creator
    if (rma.createdBy) {
      recipients.push(rma.createdBy);
    }
    
    // Add site-specific contacts (you can extend this)
    const siteContacts = this.getSiteContacts(rma.siteName);
    recipients.push(...siteContacts);
    
    // Remove duplicates
    return [...new Set(recipients)];
  }

  // Get escalation recipients
  getEscalationRecipients() {
    return [
      'manager@company.com',
      'senior-technician@company.com',
      'operations@company.com'
    ].join(',');
  }

  // Get site-specific contacts
  getSiteContacts(siteName) {
    // You can extend this to fetch from a sites collection
    const siteContacts = {
      'Head Office': ['head-office@company.com'],
      'Branch Office A': ['branch-a@company.com'],
      'Branch Office B': ['branch-b@company.com']
    };
    
    return siteContacts[siteName] || [];
  }

  // Get next steps based on status
  getNextSteps(status) {
    const nextSteps = {
      'Under Review': 'Review the RMA details and approve or request more information.',
      'Replacement Approved': 'Prepare and ship the replacement part.',
      'In Progress': 'Continue working on the RMA and update progress regularly.',
      'Completed': 'RMA has been successfully completed.',
      'Rejected': 'RMA has been rejected. Review rejection reason and take appropriate action.'
    };
    
    return nextSteps[status] || 'Please review the RMA and take appropriate action.';
  }

  // Calculate time in previous status
  calculateTimeInStatus(rma, oldStatus) {
    const now = new Date();
    const statusDate = rma.updatedAt || rma.createdAt;
    const hours = (now - statusDate) / (1000 * 60 * 60);
    
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days} days ${remainingHours} hours`;
    }
  }

  // Send bulk notifications
  async sendBulkNotification(recipients, subject, message, rmaData = null) {
    // If email is not configured, log the notification and return true
    if (!this.emailTransporter) {
      console.log(`📧 Email not configured - Bulk notification to ${recipients.length} recipients: ${subject}`);
      return true;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipients.join(','),
        subject: subject,
        html: message
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Bulk notification sent to ${recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return false;
    }
  }
}

module.exports = new CommunicationService();
