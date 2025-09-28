# 📽️ Projector Tracking System Guide

## Overview

The Projector Tracking System is a comprehensive solution for managing projector movements, swaps, and status changes across different sites. This system provides real-time tracking, historical records, and automated notifications to ensure complete visibility of projector lifecycle management.

## 🚀 Features

### 1. Projector Movement Tracking
- **Move Projectors**: Track when projectors are moved between sites and auditoriums
- **Projector Swaps**: Handle swapping of two projectors between locations
- **Installation/Removal**: Track new installations and removals
- **Status Changes**: Monitor status updates (Active, Under Service, Inactive, etc.)

### 2. Location Management
- **Current Location**: Always know where each projector is currently located
- **Historical Locations**: Complete history of all previous locations
- **Site Integration**: Seamless integration with existing site and auditorium data

### 3. Status Management
- **Real-time Status**: Track current status of all projectors
- **Status History**: Complete audit trail of all status changes
- **Condition Tracking**: Monitor projector condition (Excellent, Good, Fair, Poor, etc.)
- **Service Integration**: Link status changes with service activities

### 4. Notification System
- **Email Notifications**: Automated emails for movements and status changes
- **Site Contacts**: Notifications sent to relevant site contacts
- **Admin Alerts**: Management notifications for all activities
- **Daily Summaries**: Automated daily activity reports
- **Weekly Reminders**: Maintenance reminders for projectors needing attention
- **Monthly Reports**: Comprehensive health check reports

## 📋 Database Models

### ProjectorMovement Model
Tracks all projector movements with detailed information:
- Movement type (Move, Swap, Status Change, Installation, Removal)
- Previous and new locations
- Personnel involved (performed by, technician, authorized by)
- Cost tracking (movement, labor, transportation costs)
- Documentation and approval status
- Notification history

### ProjectorStatus Model
Manages projector status changes:
- Current status and condition
- Status change history
- Service details and priority
- Performance metrics at time of change
- Resolution tracking
- Documentation and notifications

### Enhanced Projector Model
Updated with tracking fields:
- `isTracked`: Whether the projector is being tracked
- `lastMovementDate`: Date of last movement
- `totalMovements`: Count of total movements
- `currentLocation`: Current location details

## 🔧 API Endpoints

### Movements
- `GET /api/projector-tracking/movements` - Get all movements with pagination
- `GET /api/projector-tracking/movements/projector/:projectorId` - Get movement history for a projector
- `GET /api/projector-tracking/movements/site/:siteId` - Get movements for a site
- `POST /api/projector-tracking/movements` - Create a new movement

### Status Changes
- `GET /api/projector-tracking/statuses` - Get all status changes
- `GET /api/projector-tracking/statuses/projector/:projectorId/current` - Get current status
- `GET /api/projector-tracking/statuses/projector/:projectorId/history` - Get status history
- `POST /api/projector-tracking/statuses` - Create a new status change
- `PATCH /api/projector-tracking/statuses/:statusId/resolve` - Resolve a status

### Dashboard & Analytics
- `GET /api/projector-tracking/dashboard` - Get dashboard summary data
- `GET /api/projector-tracking/available-for-swap` - Get projectors available for swapping

## 🎯 Frontend Interface

### Dashboard Tab
- **Summary Cards**: Total projectors, active, under service, inactive counts
- **Recent Activity**: Latest movements and status changes
- **Quick Stats**: Projector distribution and movement types

### Movements Tab
- **Movement List**: Complete list of all movements with filtering
- **Search & Filter**: Search by projector, filter by movement type
- **Movement Details**: Detailed view of each movement with approval status

### Status Changes Tab
- **Status List**: All status changes with current status
- **Filtering**: Filter by status, condition, site
- **Status Details**: Complete information about each status change

### Move Projector Tab
- **Projector Selection**: Choose projector to move
- **Location Selection**: Select new site and auditorium
- **Movement Details**: Reason, notes, personnel information
- **Swap Support**: Option to swap with another projector

## 📧 Notification System

### Email Templates
- **Movement Notifications**: Professional HTML emails for projector movements
- **Status Change Alerts**: Detailed alerts for status changes
- **Swap Notifications**: Special notifications for projector swaps
- **Daily Summaries**: Automated daily activity reports
- **Weekly Reminders**: Maintenance reminders
- **Monthly Reports**: Comprehensive health check reports

### Recipients
- **Site Contacts**: Automatic notifications to site contact persons
- **Admin Users**: Management notifications for all activities
- **Technicians**: Relevant notifications based on involvement

## ⚙️ Configuration

### Environment Variables
```env
# Email Configuration (required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin1@company.com,admin2@company.com
```

### Scheduled Jobs
- **Daily Summary**: 6:00 PM IST - Sends daily activity summary
- **Weekly Maintenance**: Monday 9:00 AM IST - Sends maintenance reminders
- **Monthly Health Check**: 1st of month 10:00 AM IST - Sends health check report

## 🚀 Getting Started

### 1. Backend Setup
The tracking system is automatically integrated into your existing CRM. No additional setup required.

### 2. Frontend Access
Navigate to **Operations > Projector Tracking** in the main dashboard.

### 3. First Movement
1. Go to the "Move Projector" tab
2. Select a projector to move
3. Choose the new location
4. Fill in the reason and personnel details
5. Submit the movement

### 4. Status Changes
1. Go to the "Status Changes" tab
2. Create a new status change
3. Select projector and new status
4. Provide reason and details
5. Submit the status change

## 📊 Usage Examples

### Moving a Projector
```javascript
// API call to move a projector
const movement = await apiClient.post('/api/projector-tracking/movements', {
  projectorId: 'projector_id',
  movementType: 'Move',
  newLocation: {
    siteId: 'new_site_id',
    auditoriumId: 'new_auditorium_id',
    position: 'Front Center',
    rackPosition: 'Rack 1, Slot 2'
  },
  reason: 'Maintenance upgrade',
  performedBy: 'John Doe',
  technician: 'Tech Name',
  authorizedBy: 'Manager Name'
});
```

### Swapping Projectors
```javascript
// API call to swap two projectors
const swapMovement = await apiClient.post('/api/projector-tracking/movements', {
  projectorId: 'projector_1_id',
  movementType: 'Swap',
  swapWithProjector: {
    projectorId: 'projector_2_id'
  },
  reason: 'Performance optimization',
  performedBy: 'John Doe'
});
```

### Status Change
```javascript
// API call to change projector status
const statusChange = await apiClient.post('/api/projector-tracking/statuses', {
  projectorId: 'projector_id',
  status: 'Under Service',
  condition: 'Needs Repair',
  reason: 'Lamp replacement required',
  changedBy: 'Service Technician',
  serviceDetails: {
    serviceType: 'Repair',
    priority: 'High',
    estimatedCost: 5000
  }
});
```

## 🔍 Monitoring & Analytics

### Dashboard Metrics
- Total projectors in system
- Active vs inactive projectors
- Recent movements and status changes
- Projector distribution by status
- Movement types breakdown

### Historical Tracking
- Complete movement history for each projector
- Status change timeline
- Cost tracking for movements
- Personnel accountability

### Automated Reports
- Daily activity summaries
- Weekly maintenance reminders
- Monthly health check reports
- Custom date range reports

## 🛠️ Maintenance

### Database Cleanup
The system automatically maintains data integrity. Old notifications and resolved statuses are marked as inactive but preserved for historical reference.

### Performance Optimization
- Indexed database queries for fast searches
- Pagination for large datasets
- Efficient notification batching
- Cached dashboard data

### Troubleshooting
- Check email configuration for notifications
- Verify site contact information
- Monitor scheduled job execution
- Review error logs for failed operations

## 🔐 Security & Permissions

### Access Control
- Integrated with existing user authentication
- Role-based access to tracking features
- Audit trail for all changes
- Secure API endpoints

### Data Protection
- Encrypted email notifications
- Secure database connections
- Input validation and sanitization
- Error handling and logging

## 📈 Future Enhancements

### Planned Features
- Mobile app integration
- QR code scanning for quick movements
- GPS location tracking
- Advanced analytics and reporting
- Integration with external maintenance systems
- Barcode scanning support
- Photo documentation for movements

### Customization Options
- Custom notification templates
- Configurable scheduled jobs
- Custom status types
- Flexible approval workflows
- Integration with external systems

## 📞 Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Note**: This system is designed to work seamlessly with your existing CRM infrastructure. All data is stored in your MongoDB database and integrates with your current site and projector management systems.


