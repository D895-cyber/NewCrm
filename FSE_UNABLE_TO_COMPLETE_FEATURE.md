# FSE "Unable to Complete" Assignment Feature

## Overview
This feature allows FSEs (Field Service Engineers) to mark assignments as "Unable to Complete" when they encounter issues that prevent them from finishing their work. The system captures the reason and displays it in the admin panel for review.

## Features Implemented

### 1. Database Schema Updates
- **File**: `backend/server/models/ServiceAssignment.js`
- **Changes**:
  - Added `'Unable to Complete'` to the status enum
  - Added `unableToCompleteReason` field with conditional validation
  - Field is required when status is 'Unable to Complete'

### 2. Backend API Updates
- **File**: `backend/server/routes/serviceAssignments.js`
- **New Endpoint**: `PATCH /service-assignments/:id/unable-to-complete`
- **Features**:
  - Validates that a reason is provided
  - Updates assignment status and reason
  - Adds entry to assignment history
  - Sends email notification to admin

### 3. FSE Portal UI Updates
- **File**: `frontend/src/components/mobile/AssignmentWorkflow.tsx`
- **Features**:
  - Added "Unable to Complete" button for in-progress assignments
  - Modal dialog for entering reason
  - Form validation to ensure reason is provided
  - Updated status color coding (orange for "Unable to Complete")

### 4. Admin Panel Updates
- **File**: `frontend/src/components/pages/ServiceAssignmentPage.tsx`
- **Features**:
  - Displays "Unable to Complete" status with orange badge
  - Shows reason in assignment details modal
  - Visual indicator (warning icon) for unable to complete assignments
  - Dedicated section highlighting the reason

### 5. Email Notifications
- **File**: `backend/server/services/emailService.js`
- **New Function**: `sendUnableToCompleteNotification()`
- **Features**:
  - Professional HTML email template
  - Includes assignment details and reason
  - Notifies admin team of the situation
  - Provides next steps information

## User Workflow

### For FSEs:
1. **Start Assignment**: FSE begins work on an assigned service
2. **Encounter Issue**: FSE faces a problem that prevents completion
3. **Mark Unable to Complete**: FSE clicks "Unable to Complete" button
4. **Provide Reason**: FSE enters detailed reason in modal dialog
5. **Submit**: System updates assignment and notifies admin

### For Admins:
1. **Receive Notification**: Email notification sent about unable to complete
2. **View in Admin Panel**: Assignment shows with orange "Unable to Complete" status
3. **Review Reason**: Click "View Details" to see the specific reason
4. **Take Action**: Admin can contact FSE, reschedule, or reassign

## Technical Implementation Details

### Database Schema
```javascript
// New status option
status: {
  type: String,
  enum: ['Draft', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Unable to Complete'],
  default: 'Draft'
},

// New reason field
unableToCompleteReason: {
  type: String,
  required: function() {
    return this.status === 'Unable to Complete';
  }
}
```

### API Endpoint
```javascript
PATCH /service-assignments/:id/unable-to-complete
Body: { reason: "Detailed reason for unable to complete" }
```

### UI Components
- **Modal Dialog**: Uses shadcn/ui Dialog component
- **Form Validation**: Ensures reason is not empty
- **Status Indicators**: Color-coded badges and icons
- **Responsive Design**: Works on mobile and desktop

## Benefits

1. **Transparency**: Clear communication between FSEs and admin
2. **Accountability**: Reasons are recorded and tracked
3. **Process Improvement**: Admin can identify common issues
4. **Customer Service**: Better handling of service delays
5. **Documentation**: Complete audit trail of assignment status

## Testing

Run the test script to verify functionality:
```bash
node test-unable-to-complete.js
```

## Future Enhancements

1. **Reason Categories**: Predefined categories (Equipment, Access, Safety, etc.)
2. **Photo Attachments**: Allow FSEs to attach photos as evidence
3. **Escalation Rules**: Automatic escalation based on reason type
4. **Analytics Dashboard**: Track unable to complete patterns
5. **Customer Notifications**: Notify customers of service delays

## Files Modified

1. `backend/server/models/ServiceAssignment.js` - Database schema
2. `backend/server/routes/serviceAssignments.js` - API routes
3. `backend/server/services/emailService.js` - Email notifications
4. `frontend/src/components/mobile/AssignmentWorkflow.tsx` - FSE UI
5. `frontend/src/components/pages/ServiceAssignmentPage.tsx` - Admin UI

## Deployment Notes

- No database migration required (new fields are optional)
- Backward compatible with existing assignments
- Email service requires proper SMTP configuration
- Frontend components use existing UI library (shadcn/ui)

## Support

For questions or issues with this feature, please refer to the technical documentation or contact the development team.
