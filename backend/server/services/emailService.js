const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Only create transporter if email credentials are available
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.log('⚠️ Email service disabled: SMTP credentials not configured');
      this.transporter = null;
    }
  }

  async sendUnableToCompleteNotification(serviceVisit, fseName) {
    try {
    if (!this.transporter) {
        console.log('📧 Email service not available - skipping notification');
        return false;
    }

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || 'admin@projectorcare.com',
        cc: process.env.MANAGER_EMAIL || 'manager@projectorcare.com',
        subject: `Service Unable to Complete - ${serviceVisit.visitId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Service Unable to Complete Alert</h2>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #92400e;">Service Visit Details</h3>
          </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Visit ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceVisit.visitId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">FSE Engineer:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${fseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Site:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceVisit.siteName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Projector:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceVisit.projectorSerial}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Visit Type:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceVisit.visitType}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceVisit.unableToCompleteCategory || 'Other'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(serviceVisit.actualDate).toLocaleDateString()}</td>
              </tr>
            </table>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #dc2626;">Reason for Unable to Complete</h3>
              <p style="margin: 8px 0; color: #7f1d1d;">${serviceVisit.unableToCompleteReason}</p>
          </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0369a1;">Recommended Actions</h3>
              <ul style="margin: 8px 0; color: #0c4a6e;">
                <li>Review the reason provided by the FSE engineer</li>
                <li>Check if additional resources or parts are needed</li>
                <li>Consider rescheduling the service visit</li>
                <li>Contact the site for any access or permission issues</li>
                <li>Update the service plan if needed</li>
              </ul>
          </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/service-visits/${serviceVisit._id}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Service Visit Details
            </a>
          </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated notification from the Projector Care Management System.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Unable to complete notification sent for visit ${serviceVisit.visitId}`);
      return true;
    } catch (error) {
      console.error('Error sending unable to complete notification:', error);
      return false;
    }
  }

  async sendBulkUnableToCompleteReport(visits, dateRange) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping bulk report');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || 'admin@projectorcare.com',
        subject: `Weekly Unable to Complete Report - ${dateRange}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Weekly Unable to Complete Service Report</h2>
            <p style="color: #6b7280;">Period: ${dateRange}</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #92400e;">Summary</h3>
              <p style="margin: 8px 0; color: #92400e;">Total Unable to Complete Cases: ${visits.length}</p>
          </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Visit ID</th>
                  <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">FSE</th>
                  <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Site</th>
                  <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Category</th>
                  <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${visits.map(visit => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${visit.visitId}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${visit.fseName}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${visit.siteName}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${visit.unableToCompleteCategory || 'Other'}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">${new Date(visit.actualDate).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analytics/unable-to-complete" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Detailed Analytics
              </a>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Bulk unable to complete report sent for ${visits.length} visits`);
      return true;
    } catch (error) {
      console.error('Error sending bulk unable to complete report:', error);
      return false;
    }
  }
}

module.exports = new EmailService();