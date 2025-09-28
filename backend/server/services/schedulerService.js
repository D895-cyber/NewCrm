const cron = require('node-cron');
const notificationService = require('./projectorNotificationService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  start() {
    console.log('Starting scheduler service...');

    // Daily summary at 6 PM
    const dailySummaryJob = cron.schedule('0 18 * * *', async () => {
      console.log('Running daily projector activity summary...');
      try {
        await notificationService.sendDailySummary();
        console.log('Daily summary sent successfully');
      } catch (error) {
        console.error('Error sending daily summary:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('dailySummary', dailySummaryJob);
    dailySummaryJob.start();

    // Weekly maintenance reminder (every Monday at 9 AM)
    const weeklyMaintenanceJob = cron.schedule('0 9 * * 1', async () => {
      console.log('Running weekly maintenance reminder...');
      try {
        await this.sendWeeklyMaintenanceReminder();
        console.log('Weekly maintenance reminder sent successfully');
      } catch (error) {
        console.error('Error sending weekly maintenance reminder:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('weeklyMaintenance', weeklyMaintenanceJob);
    weeklyMaintenanceJob.start();

    // Monthly projector health check (1st of every month at 10 AM)
    const monthlyHealthCheckJob = cron.schedule('0 10 1 * *', async () => {
      console.log('Running monthly projector health check...');
      try {
        await this.sendMonthlyHealthCheck();
        console.log('Monthly health check sent successfully');
      } catch (error) {
        console.error('Error sending monthly health check:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('monthlyHealthCheck', monthlyHealthCheckJob);
    monthlyHealthCheckJob.start();

    console.log('Scheduler service started successfully');
  }

  stop() {
    console.log('Stopping scheduler service...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    console.log('Scheduler service stopped');
  }

  async sendWeeklyMaintenanceReminder() {
    const Projector = require('../models/Projector');
    const Site = require('../models/Site');

    try {
      // Find projectors that need maintenance
      const projectorsNeedingMaintenance = await Projector.find({
        $or: [
          { nextService: { $lte: new Date() } },
          { status: 'Needs Repair' },
          { condition: 'Needs Repair' }
        ]
      }).populate('siteId', 'name contactPerson');

      if (projectorsNeedingMaintenance.length === 0) {
        return;
      }

      const subject = 'Weekly Maintenance Reminder - Projectors Requiring Attention';
      const html = this.generateMaintenanceReminderHTML(projectorsNeedingMaintenance);

      // Get admin emails
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      
      for (const email of adminEmails) {
        await notificationService.sendEmail(email, subject, html);
      }

    } catch (error) {
      console.error('Error sending weekly maintenance reminder:', error);
    }
  }

  async sendMonthlyHealthCheck() {
    const Projector = require('../models/Projector');
    const ProjectorStatus = require('../models/ProjectorStatus');

    try {
      // Get projector statistics
      const totalProjectors = await Projector.countDocuments();
      const activeProjectors = await Projector.countDocuments({ status: 'Active' });
      const underServiceProjectors = await Projector.countDocuments({ status: 'Under Service' });
      const needsRepairProjectors = await Projector.countDocuments({ status: 'Needs Repair' });
      const inactiveProjectors = await Projector.countDocuments({ status: 'Inactive' });

      // Get recent status changes
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStatusChanges = await ProjectorStatus.find({
        statusChangeDate: { $gte: thirtyDaysAgo }
      }).populate('projectorId', 'projectorNumber serialNumber model brand');

      const subject = 'Monthly Projector Health Check Report';
      const html = this.generateMonthlyHealthCheckHTML({
        totalProjectors,
        activeProjectors,
        underServiceProjectors,
        needsRepairProjectors,
        inactiveProjectors,
        recentStatusChanges
      });

      // Get admin emails
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      
      for (const email of adminEmails) {
        await notificationService.sendEmail(email, subject, html);
      }

    } catch (error) {
      console.error('Error sending monthly health check:', error);
    }
  }

  generateMaintenanceReminderHTML(projectors) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .projector-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
          .urgent { border-left-color: #dc2626; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Weekly Maintenance Reminder</h1>
            <p>${projectors.length} projectors require attention</p>
          </div>
          
          <div class="content">
            ${projectors.map(projector => `
              <div class="projector-item ${projector.status === 'Needs Repair' ? 'urgent' : ''}">
                <h3>${projector.projectorNumber} - ${projector.serialNumber}</h3>
                <p><strong>Location:</strong> ${projector.siteId?.name || 'Unknown'} - ${projector.auditoriumName}</p>
                <p><strong>Status:</strong> ${projector.status}</p>
                <p><strong>Condition:</strong> ${projector.condition}</p>
                <p><strong>Model:</strong> ${projector.model} (${projector.brand})</p>
                ${projector.nextService ? `<p><strong>Next Service Due:</strong> ${new Date(projector.nextService).toLocaleDateString()}</p>` : ''}
                ${projector.hoursUsed ? `<p><strong>Hours Used:</strong> ${projector.hoursUsed}</p>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>This is an automated weekly reminder from ProjectorCare CRM System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateMonthlyHealthCheckHTML(data) {
    const { totalProjectors, activeProjectors, underServiceProjectors, needsRepairProjectors, inactiveProjectors, recentStatusChanges } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
          .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
          .stat-label { color: #64748b; font-size: 0.9em; }
          .status-item { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Monthly Projector Health Check Report</h1>
            <p>${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div class="content">
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number" style="color: #1e40af;">${totalProjectors}</div>
                <div class="stat-label">Total Projectors</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #22c55e;">${activeProjectors}</div>
                <div class="stat-label">Active</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #f59e0b;">${underServiceProjectors}</div>
                <div class="stat-label">Under Service</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #dc2626;">${needsRepairProjectors}</div>
                <div class="stat-label">Needs Repair</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #64748b;">${inactiveProjectors}</div>
                <div class="stat-label">Inactive</div>
              </div>
            </div>

            <h3>Recent Status Changes (Last 30 Days)</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              ${recentStatusChanges.slice(0, 20).map(status => `
                <div class="status-item">
                  <strong>${status.projectorId.projectorNumber}</strong> - ${status.status} (${status.condition})<br>
                  <small>Changed by: ${status.changedBy} on ${new Date(status.statusChangeDate).toLocaleDateString()}</small>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>This is an automated monthly report from ProjectorCare CRM System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new SchedulerService();


