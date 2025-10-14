# RMA Data Import Guide

## 🚀 **Complete RMA Import Solution**

This guide will help you import your old and current RMA data into the CRM system using multiple methods.

## 📊 **Import Methods Available**

### **1. CSV Import (Recommended)**
- **Best for**: Excel/CSV files with RMA data
- **Features**: Field mapping, validation, duplicate detection
- **File size limit**: 10MB

### **2. Bulk JSON Import**
- **Best for**: API integrations or database exports
- **Features**: Direct JSON data import
- **No file size limit**

### **3. Database Migration**
- **Best for**: Direct database-to-database migration
- **Features**: Automated field mapping and data transformation

## 🎯 **Quick Start - CSV Import**

### **Step 1: Access Import Feature**
1. Go to **RMA Management** page
2. Click **"Import RMAs"** button (green button)
3. Download the CSV template

### **Step 2: Prepare Your Data**
1. Open the downloaded template
2. Fill in your RMA data using the template format
3. Save as CSV file

### **Step 3: Import Data**
1. Click **"Import RMAs"** button
2. Select your CSV file
3. Click **"Import RMAs"**
4. Review the import results

## 📋 **CSV Template Fields**

### **Core RMA Information**
- `RMA Number` - Unique RMA identifier
- `Call Log Number` - Associated call log
- `RMA Order Number` - Purchase order number

### **Date Fields**
- `ASCOMP Raised Date` - When RMA was raised (YYYY-MM-DD)
- `Customer Error Date` - When customer reported issue (YYYY-MM-DD)

### **Site and Product Information**
- `Site Name` - Customer site name
- `Product Name` - Projector model name
- `Product Part Number` - Part number
- `Serial Number` - Projector serial number

### **Defective Part Details**
- `Defective Part Number` - Defective part number
- `Defective Part Name` - Defective part name
- `Defective Serial Number` - Defective part serial
- `Symptoms` - Issue description

### **Replacement Part Details**
- `Replaced Part Number` - Replacement part number
- `Replaced Part Name` - Replacement part name
- `Replaced Part Serial Number` - Replacement serial
- `Replacement Notes` - Replacement notes

### **Legacy Shipping Information**
- `Shipped Date` - When shipped (YYYY-MM-DD)
- `Tracking Number` - Legacy tracking number
- `Shipped Through` - Shipping carrier

### **Status and Workflow**
- `Case Status` - Current RMA status
- `Approval Status` - Approval status
- `Priority` - Low/Medium/High/Critical
- `Warranty Status` - In Warranty/Extended/Out of Warranty/Expired

### **Enhanced Shipping - Outbound**
- `Outbound Tracking Number` - Outbound tracking
- `Outbound Carrier` - Outbound carrier
- `Outbound Status` - pending/picked_up/in_transit/out_for_delivery/delivered/exception/returned
- `Outbound Shipped Date` - When outbound shipped
- `Outbound Actual Delivery` - When outbound delivered

### **Enhanced Shipping - Return**
- `Return Tracking Number` - Return tracking
- `Return Carrier` - Return carrier
- `Return Status` - Return status
- `Return Shipped Date` - When return shipped
- `Return Actual Delivery` - When return delivered

## 🔧 **API Endpoints**

### **CSV Import**
```http
POST /api/import/rma/csv
Content-Type: multipart/form-data

Form data:
- csvFile: CSV file
```

### **Bulk JSON Import**
```http
POST /api/import/rma/bulk
Content-Type: application/json

{
  "rmas": [
    {
      "rmaNumber": "RMA-2024-001",
      "siteName": "Site A",
      "productName": "Projector Model X",
      "serialNumber": "SN-001",
      "caseStatus": "Under Review",
      // ... other fields
    }
  ]
}
```

### **Download Template**
```http
GET /api/import/rma/template
```

### **Import Status**
```http
GET /api/import/rma/status
```

## 📝 **Data Format Examples**

### **Date Formats Supported**
- `YYYY-MM-DD` (2024-01-15)
- `MM/DD/YYYY` (01/15/2024)
- `MM-DD-YYYY` (01-15-2024)
- `M/D/YYYY` (1/15/2024)

### **Status Values**
- **Case Status**: Under Review, Sent to CDS, CDS Approved, Replacement Shipped, Replacement Received, Installation Complete, Faulty Part Returned, CDS Confirmed Return, Completed, Rejected
- **Approval Status**: Pending Review, Approved, Rejected, Under Investigation
- **Priority**: Low, Medium, High, Critical
- **Warranty Status**: In Warranty, Extended Warranty, Out of Warranty, Expired
- **Shipping Status**: pending, picked_up, in_transit, out_for_delivery, delivered, exception, returned

### **Boolean Values**
- `true`, `yes`, `1`, `y` for true
- `false`, `no`, `0`, `n` for false

## 🛠️ **Advanced Import Options**

### **Field Mapping**
The system automatically maps CSV columns to RMA fields. If your CSV has different column names, you can:

1. **Rename columns** to match the template
2. **Use the field mapping** in the import route
3. **Contact support** for custom mapping

### **Data Validation**
- **Required fields** are validated
- **Date formats** are automatically parsed
- **Duplicate detection** prevents duplicate RMAs
- **Data type conversion** handles numbers, booleans, dates

### **Error Handling**
- **Row-level errors** are reported
- **Field-level validation** shows specific issues
- **Import summary** shows success/failure counts
- **Detailed error logs** help fix issues

## 📊 **Import Results**

### **Success Response**
```json
{
  "success": true,
  "message": "RMA import completed",
  "summary": {
    "totalProcessed": 100,
    "inserted": 95,
    "duplicates": 3,
    "errors": 2
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "RMA import failed",
  "error": "Invalid date format in row 5"
}
```

## 🔄 **Migration Strategies**

### **For Excel Users**
1. **Export to CSV** from Excel
2. **Use the template** to ensure proper format
3. **Import via web interface**

### **For Database Users**
1. **Export to CSV** from your database
2. **Map fields** to the template format
3. **Import via web interface**

### **For API Users**
1. **Use bulk JSON import** endpoint
2. **Transform data** to match RMA schema
3. **Send POST request** with RMA array

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Invalid date format"**
- Use supported date formats (YYYY-MM-DD recommended)
- Check for empty date cells

#### **"Duplicate RMA found"**
- RMA numbers must be unique
- Serial numbers must be unique
- Check for existing data

#### **"Required field missing"**
- Ensure all required fields are filled
- Check for empty cells in required columns

#### **"File too large"**
- Split large files into smaller chunks
- Use bulk JSON import for very large datasets

### **Debug Steps**
1. **Check CSV format** - ensure proper comma separation
2. **Validate data types** - dates, numbers, booleans
3. **Check required fields** - siteName, productName, serialNumber, createdBy
4. **Review error logs** - detailed error messages
5. **Test with small sample** - import 5-10 records first

## 📞 **Support**

### **Getting Help**
1. **Check error messages** in import results
2. **Review this guide** for common issues
3. **Use the sample CSV** as a reference
4. **Contact system administrator** for complex issues

### **Best Practices**
1. **Always download template** first
2. **Test with small sample** before full import
3. **Backup existing data** before importing
4. **Review import results** carefully
5. **Keep original files** for reference

## 🎉 **Success Tips**

1. **Use the template** - ensures proper format
2. **Validate data first** - check dates, numbers, required fields
3. **Import in batches** - for large datasets
4. **Review results** - check for errors and duplicates
5. **Test functionality** - verify imported data works correctly

---

**🎯 Your RMA data import is now ready! Follow the steps above to migrate your old and current RMA data into the CRM system.**



















