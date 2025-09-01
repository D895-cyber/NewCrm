# 🚀 Schema Upgrade Guide

## Overview
This guide explains the major schema upgrades implemented for the Projector Warranty Management System, including the new RMA schema with 28 fields, enhanced DTR tracking, and new Call Log functionality.

## 📦 **RMA Schema Updates**

### New Fields Added:
- **Core Information**: `callLogNumber`, `rmaOrderNumber`
- **Date Fields**: `ascompRaisedDate`, `customerErrorDate`
- **Product Details**: `productName`, `productPartNumber`, `defectivePartNumber`, `defectivePartName`
- **Shipping**: `shippedDate`, `trackingNumber`, `shippedThru`
- **Return Shipping**: `rmaReturnShippedDate`, `rmaReturnTrackingNumber`, `rmaReturnShippedThru`
- **Time Tracking**: `daysCountShippedToSite`, `daysCountReturnToCDS`
- **Workflow**: Enhanced `cdsWorkflow` tracking

### Key Improvements:
- ✅ **28-field structure** matching your requirements
- ✅ **Better indexing** for improved performance
- ✅ **Automatic day calculations** based on dates
- ✅ **Enhanced CDS workflow** tracking
- ✅ **Backward compatibility** with legacy fields

## 📋 **DTR Schema Updates**

### New Fields Added:
- **RMA Integration**: `rmaStatus`, `rmaWorkflow`
- **Problem Categorization**: `problemCategory`
- **SLA Tracking**: `slaTarget`, `slaBreached`
- **Escalation**: `escalationLevel`, `escalatedTo`
- **Performance**: `resolutionTime`, `customerSatisfaction`

### Key Improvements:
- ✅ **Better RMA integration** tracking
- ✅ **SLA monitoring** and breach detection
- ✅ **Escalation workflow** support
- ✅ **Performance metrics** tracking

## 📞 **New Call Log Schema**

### Features:
- **Customer Management**: Contact details, site information
- **Issue Tracking**: Description, priority, status
- **RMA Integration**: Links to RMA workflow
- **SLA Management**: Target times and breach detection
- **Escalation Support**: Multi-level escalation tracking
- **Customer Feedback**: Satisfaction ratings and comments

## 📺 **Projector Schema Updates**

### New Fields Added:
- **RMA Tracking**: `lastRMA`, `totalRMAs`
- **Performance**: `uptime`, `maintenanceHistory`
- **Location**: `building`, `floor`, `room`, `rackPosition`
- **Maintenance**: `lastMaintenance`, `nextMaintenance`

### Key Improvements:
- ✅ **Better RMA relationship** tracking
- ✅ **Performance monitoring** capabilities
- ✅ **Detailed location** tracking
- ✅ **Maintenance scheduling** support

## 🔄 **Migration Process**

### 1. Run Migration Script
```bash
cd server
npm run migrate
```

### 2. Verify Data
- Check that existing RMAs have new fields populated
- Verify DTRs have new tracking fields
- Confirm Projectors have enhanced information

### 3. Test Functionality
- Create new RMAs with the new schema
- Test DTR to RMA workflow
- Verify Call Log creation and linking

## 📊 **Database Indexes**

### RMA Indexes:
- `callLogNumber`, `rmaOrderNumber`
- `ascompRaisedDate`, `customerErrorDate`
- `siteName`, `productName`, `caseStatus`
- `defectivePartNumber`, `replacedPartNumber`

### DTR Indexes:
- `rmaStatus`, `problemCategory`
- `escalationLevel`, `slaBreached`

### Call Log Indexes:
- `callLogNumber`, `siteName`, `customerName`
- `status`, `priority`, `category`
- `rmaGenerated`, `assignedTo`

## 🚨 **Important Notes**

### Backward Compatibility:
- ✅ **Legacy fields preserved** for existing data
- ✅ **Automatic field mapping** during migration
- ✅ **Gradual transition** to new structure

### Data Validation:
- ✅ **Required fields** properly enforced
- ✅ **Enum values** validated
- ✅ **Date calculations** automated

### Performance:
- ✅ **Optimized indexes** for common queries
- ✅ **Efficient lookups** for related data
- ✅ **Scalable structure** for future growth

## 🔧 **Usage Examples**

### Creating New RMA:
```javascript
const newRMA = new RMA({
  callLogNumber: 'CL-2025-001',
  rmaOrderNumber: 'RO-2025-001',
  ascompRaisedDate: new Date(),
  customerErrorDate: new Date('2025-01-10'),
  siteName: 'TechCorp HQ',
  productName: 'Epson Projector EP-01',
  serialNumber: 'SN-EP01-001',
  defectivePartNumber: 'DP-001',
  defectivePartName: 'Lamp Assembly',
  symptoms: 'No power, lamp not lighting',
  createdBy: 'John Smith',
  caseStatus: 'Under Review'
});
```

### Creating Call Log:
```javascript
const newCallLog = new CallLog({
  siteName: 'TechCorp HQ',
  customerName: 'TechCorp Solutions',
  contactPerson: {
    name: 'John Smith',
    phone: '+1-555-0123',
    email: 'john.smith@techcorp.com'
  },
  issueDescription: 'Projector not powering on',
  priority: 'High',
  category: 'Hardware',
  slaTarget: 24
});
```

## 🎯 **Next Steps**

1. **Test Migration**: Run the migration script on a test database
2. **Update Frontend**: Modify frontend forms to use new field names
3. **API Updates**: Update API endpoints to handle new schema
4. **Workflow Testing**: Test the complete DTR → Call Log → RMA workflow
5. **Performance Monitoring**: Monitor database performance with new indexes

## 📞 **Support**

If you encounter any issues during the migration:
1. Check the migration logs for errors
2. Verify MongoDB connection and permissions
3. Ensure all required models are properly imported
4. Test with a small dataset first

---

**🎉 Congratulations!** Your system now has a much more robust and scalable schema structure that will support advanced workflows and better data management.

