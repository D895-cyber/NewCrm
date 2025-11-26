const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables from multiple possible locations
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', 'server', '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    require('dotenv').config({ path: envPath });
    if (process.env.SMTP_USER) {
      console.log(`✅ Environment loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.log('⚠️ Could not load environment variables from any location');
  console.log('   Tried paths:', envPaths);
}

class EmailService {
  constructor() {
    // Debug logging
    console.log('🔍 Email Service Initialization:');
    console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
    
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
      console.log('✅ Email service enabled and ready');
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
        to: process.env.ADMIN_EMAIL || 'helpdesk@ascompinc.in',
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

  // Send assignment notification to FSE
  async sendAssignmentNotification(fseEmail, fseName, assignment) {
    try {
      console.log(`📧 Attempting to send assignment notification to: ${fseEmail}`);
      console.log(`   FSE Name: ${fseName}`);
      console.log(`   Assignment: ${assignment.title}`);
      
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping assignment notification');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: fseEmail,
        subject: `🎯 New Service Assignment - ${assignment.siteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">New Service Assignment</h2>
            <p style="color: #6b7280;">Hello ${fseName}!</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #1e40af;">Assignment Details</h3>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Assignment:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignment.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Site:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignment.siteName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Address:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignment.siteAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Start Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(assignment.startDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Projectors:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignment.projectors.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Status:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignment.status}</td>
              </tr>
            </table>

            ${assignment.description ? `
              <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; margin: 16px 0;">
                <h3 style="margin: 0; color: #374151;">Description</h3>
                <p style="margin: 8px 0; color: #4b5563;">${assignment.description}</p>
              </div>
            ` : ''}

            ${assignment.adminNotes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
                <h3 style="margin: 0; color: #92400e;">Admin Notes</h3>
                <p style="margin: 8px 0; color: #92400e;">${assignment.adminNotes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mobile/assignments" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Assignment Details
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
      console.log(`Assignment notification sent to FSE: ${fseName} (${fseEmail})`);
      return true;
    } catch (error) {
      console.error('Error sending assignment notification:', error);
      return false;
    }
  }

  // Send assignment update notification to FSE
  async sendAssignmentUpdate(fseEmail, fseName, assignment, updates) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping assignment update');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: fseEmail,
        subject: `📝 Assignment Updated - ${assignment.siteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Assignment Updated</h2>
            <p style="color: #6b7280;">Hello ${fseName}!</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #92400e;">Assignment: ${assignment.title}</h3>
              <p style="margin: 8px 0; color: #92400e;">Site: ${assignment.siteName}</p>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0369a1;">Changes Made</h3>
              <ul style="margin: 8px 0; color: #0c4a6e;">
                ${Object.keys(updates).map(key => `<li><strong>${key}:</strong> ${updates[key]}</li>`).join('')}
              </ul>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mobile/assignments" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Updated Assignment
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
      console.log(`Assignment update sent to FSE: ${fseName} (${fseEmail})`);
      return true;
    } catch (error) {
      console.error('Error sending assignment update:', error);
      return false;
    }
  }

  // Send assignment completion notification to FSE
  async sendAssignmentCompleted(fseEmail, fseName, assignment) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping completion notification');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: fseEmail,
        subject: `✅ Assignment Completed - ${assignment.siteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Assignment Completed Successfully!</h2>
            <p style="color: #6b7280;">Hello ${fseName}!</p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #047857;">Assignment: ${assignment.title}</h3>
              <p style="margin: 8px 0; color: #047857;">Site: ${assignment.siteName}</p>
              <p style="margin: 8px 0; color: #047857;">Completed on: ${new Date(assignment.completedDate).toLocaleDateString()}</p>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0369a1;">Great Work!</h3>
              <p style="margin: 8px 0; color: #0c4a6e;">Thank you for completing this assignment. Your work has been recorded and the client has been notified.</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mobile/assignments" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Assignment History
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
      console.log(`Assignment completion notification sent to FSE: ${fseName} (${fseEmail})`);
      return true;
    } catch (error) {
      console.error('Error sending assignment completion notification:', error);
      return false;
    }
  }

  // Send daily reminder to FSE
  async sendDailyReminder(fseEmail, fseName, todaysWork) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping daily reminder');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: fseEmail,
        subject: `🌅 Daily Work Reminder - ${new Date().toLocaleDateString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Good Morning, ${fseName}!</h2>
            <p style="color: #6b7280;">Here's your work schedule for today:</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #1e40af;">Today's Work (${todaysWork.length} items)</h3>
            </div>

            ${todaysWork.map((work, index) => `
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0;">
                <h4 style="margin: 0; color: #374151;">${work.title || 'Service Visit'}</h4>
                <p style="margin: 8px 0; color: #6b7280;">Site: ${work.siteName}</p>
                <p style="margin: 8px 0; color: #6b7280;">Time: ${work.scheduledTime || 'All day'}</p>
                ${work.description ? `<p style="margin: 8px 0; color: #4b5563;">${work.description}</p>` : ''}
              </div>
            `).join('')}

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mobile/assignments" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Schedule
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated daily reminder from the Projector Care Management System.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Daily reminder sent to FSE: ${fseName} (${fseEmail})`);
      return true;
    } catch (error) {
      console.error('Error sending daily reminder:', error);
      return false;
    }
  }

  // Test email service
  async testEmailService(testEmail) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - cannot send test email');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: testEmail,
        subject: '🧪 Email Service Test - Projector Care System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Email Service Test Successful!</h2>
            <p style="color: #6b7280;">This is a test email from the Projector Care Management System.</p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #047857;">Email Configuration</h3>
              <p style="margin: 8px 0; color: #047857;">SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
              <p style="margin: 8px 0; color: #047857;">SMTP Port: ${process.env.SMTP_PORT || 587}</p>
              <p style="margin: 8px 0; color: #047857;">From: ${process.env.SMTP_USER}</p>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0369a1;">Available Notifications</h3>
              <ul style="margin: 8px 0; color: #0c4a6e;">
                <li>Assignment Notifications</li>
                <li>Assignment Updates</li>
                <li>Assignment Completions</li>
                <li>Daily Reminders</li>
                <li>Unable to Complete Alerts</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is a test email from the Projector Care Management System.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Test email sent to: ${testEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();