const nodemailer = require('nodemailer');
const Projector = require('../models/Projector');
const ProjectorMovement = require('../models/ProjectorMovement');
const ProjectorStatus = require('../models/ProjectorStatus');
const Site = require('../models/Site');

class ProjectorNotificationService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Use existing email configuration from your system
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

  async sendMovementNotification(movement) {
    try {
      const projector = await Projector.findById(movement.projectorId);
      if (!projector) return;

      const site = await Site.findById(movement.newLocation.siteId);
      const previousSite = await Site.findById(movement.previousLocation.siteId);

      const subject = `Projector Movement: ${projector.projectorNumber}`;
      const html = this.generateMovementEmailHTML(movement, projector, site, previousSite);

      // Send to site contacts
      const recipients = [];
      
      if (site && site.contactPerson && site.contactPerson.email) {
        recipients.push(site.contactPerson.email);
      }
      
      if (previousSite && previousSite.contactPerson && previousSite.contactPerson.email) {
        recipients.push(previousSite.contactPerson.email);
      }

      // Add admin emails
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      recipients.push(...adminEmails);

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      for (const email of uniqueRecipients) {
        await this.sendEmail(email, subject, html);
      }

      // Update movement record with notification status
      movement.notificationsSent.push({
        type: 'Email',
        recipient: uniqueRecipients.join(', '),
        status: 'Sent'
      });
      await movement.save();

    } catch (error) {
      console.error('Error sending movement notification:', error);
    }
  }

  async sendStatusChangeNotification(statusChange) {
    try {
      const projector = await Projector.findById(statusChange.projectorId);
      if (!projector) return;

      const site = await Site.findById(statusChange.currentLocation.siteId);

      const subject = `Projector Status Change: ${projector.projectorNumber}`;
      const html = this.generateStatusChangeEmailHTML(statusChange, projector, site);

      // Send to site contacts
      const recipients = [];
      
      if (site && site.contactPerson && site.contactPerson.email) {
        recipients.push(site.contactPerson.email);
      }

      // Add admin emails
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      recipients.push(...adminEmails);

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      for (const email of uniqueRecipients) {
        await this.sendEmail(email, subject, html);
      }

      // Update status record with notification status
      statusChange.notificationsSent.push({
        type: 'Email',
        recipient: uniqueRecipients.join(', '),
        status: 'Sent'
      });
      await statusChange.save();

    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  async sendProjectorSwapNotification(movement1, movement2) {
    try {
      const projector1 = await Projector.findById(movement1.projectorId);
      const projector2 = await Projector.findById(movement2.projectorId);
      
      if (!projector1 || !projector2) return;

      const subject = `Projector Swap: ${projector1.projectorNumber} ↔ ${projector2.projectorNumber}`;
      const html = this.generateSwapEmailHTML(movement1, movement2, projector1, projector2);

      // Get all unique sites involved
      const siteIds = [
        movement1.previousLocation.siteId,
        movement1.newLocation.siteId,
        movement2.previousLocation.siteId,
        movement2.newLocation.siteId
      ].filter(Boolean);

      const sites = await Site.find({ _id: { $in: siteIds } });
      const recipients = [];

      // Add site contacts
      sites.forEach(site => {
        if (site.contactPerson && site.contactPerson.email) {
          recipients.push(site.contactPerson.email);
        }
      });

      // Add admin emails
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      recipients.push(...adminEmails);

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipients)];

      for (const email of uniqueRecipients) {
        await this.sendEmail(email, subject, html);
      }

      // Update both movement records
      const notificationData = {
        type: 'Email',
        recipient: uniqueRecipients.join(', '),
        status: 'Sent'
      };

      movement1.notificationsSent.push(notificationData);
      movement2.notificationsSent.push(notificationData);
      
      await Promise.all([movement1.save(), movement2.save()]);

    } catch (error) {
      console.error('Error sending swap notification:', error);
    }
  }

  generateMovementEmailHTML(movement, projector, site, previousSite) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
          .projector-info { background: #f0f9ff; border-left-color: #0ea5e9; }
          .movement-info { background: #f0fdf4; border-left-color: #22c55e; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📽️ Projector Movement Notification</h1>
            <p>Projector ${projector.projectorNumber} has been moved</p>
          </div>
          
          <div class="content">
            <div class="info-box projector-info">
              <h3>Projector Details</h3>
              <p><strong>Projector Number:</strong> ${projector.projectorNumber}</p>
              <p><strong>Serial Number:</strong> ${projector.serialNumber}</p>
              <p><strong>Model:</strong> ${projector.model}</p>
              <p><strong>Brand:</strong> ${projector.brand}</p>
            </div>

            <div class="info-box movement-info">
              <h3>Movement Details</h3>
              <p><strong>Movement Type:</strong> ${movement.movementType}</p>
              <p><strong>From:</strong> ${previousSite?.name || 'Unknown'} - ${movement.previousLocation.auditoriumName}</p>
              <p><strong>To:</strong> ${site?.name || 'Unknown'} - ${movement.newLocation.auditoriumName}</p>
              <p><strong>Reason:</strong> ${movement.reason}</p>
              <p><strong>Performed By:</strong> ${movement.performedBy}</p>
              <p><strong>Date:</strong> ${new Date(movement.movementDate).toLocaleString()}</p>
              ${movement.notes ? `<p><strong>Notes:</strong> ${movement.notes}</p>` : ''}
            </div>

            ${movement.movementCost > 0 ? `
            <div class="info-box">
              <h3>Cost Information</h3>
              <p><strong>Movement Cost:</strong> ₹${movement.movementCost}</p>
              ${movement.laborCost > 0 ? `<p><strong>Labor Cost:</strong> ₹${movement.laborCost}</p>` : ''}
              ${movement.transportationCost > 0 ? `<p><strong>Transportation Cost:</strong> ₹${movement.transportationCost}</p>` : ''}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This is an automated notification from ProjectorCare CRM System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateStatusChangeEmailHTML(statusChange, projector, site) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #dc2626; }
          .projector-info { background: #f0f9ff; border-left-color: #0ea5e9; }
          .status-info { background: #fef2f2; border-left-color: #dc2626; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Projector Status Change Alert</h1>
            <p>Projector ${projector.projectorNumber} status has been updated</p>
          </div>
          
          <div class="content">
            <div class="info-box projector-info">
              <h3>Projector Details</h3>
              <p><strong>Projector Number:</strong> ${projector.projectorNumber}</p>
              <p><strong>Serial Number:</strong> ${projector.serialNumber}</p>
              <p><strong>Model:</strong> ${projector.model}</p>
              <p><strong>Brand:</strong> ${projector.brand}</p>
            </div>

            <div class="info-box status-info">
              <h3>Status Change Details</h3>
              <p><strong>Previous Status:</strong> ${statusChange.previousStatus || 'Unknown'}</p>
              <p><strong>New Status:</strong> <span style="color: #dc2626; font-weight: bold;">${statusChange.status}</span></p>
              <p><strong>Condition:</strong> ${statusChange.condition}</p>
              <p><strong>Location:</strong> ${site?.name || 'Unknown'} - ${statusChange.currentLocation.auditoriumName}</p>
              <p><strong>Reason:</strong> ${statusChange.reason}</p>
              <p><strong>Changed By:</strong> ${statusChange.changedBy}</p>
              <p><strong>Date:</strong> ${new Date(statusChange.statusChangeDate).toLocaleString()}</p>
              ${statusChange.notes ? `<p><strong>Notes:</strong> ${statusChange.notes}</p>` : ''}
            </div>

            ${statusChange.serviceDetails ? `
            <div class="info-box">
              <h3>Service Details</h3>
              <p><strong>Service Type:</strong> ${statusChange.serviceDetails.serviceType}</p>
              <p><strong>Priority:</strong> ${statusChange.serviceDetails.priority}</p>
              ${statusChange.serviceDetails.estimatedCost > 0 ? `<p><strong>Estimated Cost:</strong> ₹${statusChange.serviceDetails.estimatedCost}</p>` : ''}
              ${statusChange.serviceDetails.serviceProvider ? `<p><strong>Service Provider:</strong> ${statusChange.serviceDetails.serviceProvider}</p>` : ''}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This is an automated notification from ProjectorCare CRM System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateSwapEmailHTML(movement1, movement2, projector1, projector2) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #7c3aed; }
          .projector-info { background: #f0f9ff; border-left-color: #0ea5e9; }
          .swap-info { background: #faf5ff; border-left-color: #7c3aed; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Projector Swap Notification</h1>
            <p>Two projectors have been swapped between locations</p>
          </div>
          
          <div class="content">
            <div class="info-box projector-info">
              <h3>Projector 1: ${projector1.projectorNumber}</h3>
              <p><strong>Serial Number:</strong> ${projector1.serialNumber}</p>
              <p><strong>Model:</strong> ${projector1.model}</p>
              <p><strong>Brand:</strong> ${projector1.brand}</p>
              <p><strong>Moved From:</strong> ${movement1.previousLocation.siteName} - ${movement1.previousLocation.auditoriumName}</p>
              <p><strong>Moved To:</strong> ${movement1.newLocation.siteName} - ${movement1.newLocation.auditoriumName}</p>
            </div>

            <div class="info-box projector-info">
              <h3>Projector 2: ${projector2.projectorNumber}</h3>
              <p><strong>Serial Number:</strong> ${projector2.serialNumber}</p>
              <p><strong>Model:</strong> ${projector2.model}</p>
              <p><strong>Brand:</strong> ${projector2.brand}</p>
              <p><strong>Moved From:</strong> ${movement2.previousLocation.siteName} - ${movement2.previousLocation.auditoriumName}</p>
              <p><strong>Moved To:</strong> ${movement2.newLocation.siteName} - ${movement2.newLocation.auditoriumName}</p>
            </div>

            <div class="info-box swap-info">
              <h3>Swap Details</h3>
              <p><strong>Reason:</strong> ${movement1.reason}</p>
              <p><strong>Performed By:</strong> ${movement1.performedBy}</p>
              <p><strong>Date:</strong> ${new Date(movement1.movementDate).toLocaleString()}</p>
              ${movement1.notes ? `<p><strong>Notes:</strong> ${movement1.notes}</p>` : ''}
            </div>
          </div>

          <div class="footer">
            <p>This is an automated notification from ProjectorCare CRM System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html
      });
      console.log(`Notification sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
    }
  }

  // Method to send daily summary of projector activities
  async sendDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [movements, statusChanges] = await Promise.all([
        ProjectorMovement.find({
          movementDate: { $gte: today, $lt: tomorrow }
        }).populate('projectorId', 'projectorNumber serialNumber model brand'),
        
        ProjectorStatus.find({
          statusChangeDate: { $gte: today, $lt: tomorrow },
          isActive: true
        }).populate('projectorId', 'projectorNumber serialNumber model brand')
      ]);

      if (movements.length === 0 && statusChanges.length === 0) {
        return; // No activities today
      }

      const subject = `Daily Projector Activity Summary - ${today.toLocaleDateString()}`;
      const html = this.generateDailySummaryHTML(movements, statusChanges, today);

      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      
      for (const email of adminEmails) {
        await this.sendEmail(email, subject, html);
      }

    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  generateDailySummaryHTML(movements, statusChanges, date) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .summary-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .movement-item, .status-item { padding: 10px; margin: 5px 0; background: #f1f5f9; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Projector Activity Summary</h1>
            <p>${date.toLocaleDateString()} - ${movements.length} movements, ${statusChanges.length} status changes</p>
          </div>
          
          <div class="content">
            ${movements.length > 0 ? `
            <div class="summary-box">
              <h3>📦 Projector Movements (${movements.length})</h3>
              ${movements.map(movement => `
                <div class="movement-item">
                  <strong>${movement.projectorId.projectorNumber}</strong> - ${movement.movementType}<br>
                  ${movement.previousLocation.siteName} → ${movement.newLocation.siteName}<br>
                  <small>By: ${movement.performedBy} at ${new Date(movement.movementDate).toLocaleTimeString()}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${statusChanges.length > 0 ? `
            <div class="summary-box">
              <h3>⚠️ Status Changes (${statusChanges.length})</h3>
              ${statusChanges.map(status => `
                <div class="status-item">
                  <strong>${status.projectorId.projectorNumber}</strong> - ${status.status} (${status.condition})<br>
                  <small>By: ${status.changedBy} at ${new Date(status.statusChangeDate).toLocaleTimeString()}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This is an automated daily summary from ProjectorCare CRM System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new ProjectorNotificationService();
