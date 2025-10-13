# RMA Import Methods Guide

## 🚀 **Complete RMA Import Solution**

This guide covers all available methods to import your old and current RMA data into the CRM system.

## 📊 **Available Import Methods**

### **1. CSV Import** 📄
- **Best for**: Excel/CSV files with RMA data
- **Features**: Field mapping, validation, duplicate detection
- **File size limit**: 10MB
- **Format**: CSV files with headers

### **2. Bulk JSON Import** 🔧
- **Best for**: API integrations, database exports, large datasets
- **Features**: Direct JSON input, real-time validation, no file limits
- **Format**: JSON array of RMA objects

## 🎯 **Quick Start Guide**

### **Method 1: CSV Import**

#### **Step 1: Access Import**
1. Go to **RMA Management** page
2. Click **"Import RMAs"** dropdown button
3. Select **"CSV Import"**

#### **Step 2: Download Template**
1. Click **"Download Template"** button
2. Open the CSV file in Excel or any spreadsheet editor
3. Fill in your RMA data using the template format

#### **Step 3: Upload and Import**
1. Click **"Select CSV File"** and choose your file
2. Click **"Import RMAs"**
3. Review the import results

### **Method 2: Bulk JSON Import**

#### **Step 1: Access Import**
1. Go to **RMA Management** page
2. Click **"Import RMAs"** dropdown button
3. Select **"Bulk JSON Import"**

#### **Step 2: Prepare JSON Data**
1. Use the sample template as reference
2. Format your RMA data as JSON array
3. Paste the JSON data in the text area

#### **Step 3: Validate and Import**
1. Review validation results
2. Check data preview
3. Click **"Import RMAs"**

## 📋 **Data Format Requirements**

### **CSV Format**
```csv
RMA Number,Site Name,Product Name,Serial Number,Created By,Case Status,Warranty Status,ASCOMP Raised Date,Customer Error Date
RMA-2024-001,Site A,Projector Model X,SN-001,John Doe,Under Review,In Warranty,2024-01-15,2024-01-10
RMA-2024-002,Site B,Projector Model Y,SN-002,Jane Smith,Completed,In Warranty,2024-01-16,2024-01-11
```

### **JSON Format**
```json
[
  {
    "rmaNumber": "RMA-2024-001",
    "siteName": "Site A",
    "productName": "Projector Model X",
    "serialNumber": "SN-001",
    "createdBy": "John Doe",
    "caseStatus": "Under Review",
    "warrantyStatus": "In Warranty",
    "ascompRaisedDate": "2024-01-15",
    "customerErrorDate": "2024-01-10"
  },
  {
    "rmaNumber": "RMA-2024-002",
    "siteName": "Site B",
    "productName": "Projector Model Y",
    "serialNumber": "SN-002",
    "createdBy": "Jane Smith",
    "caseStatus": "Completed",
    "warrantyStatus": "In Warranty",
    "ascompRaisedDate": "2024-01-16",
    "customerErrorDate": "2024-01-11"
  }
]
```

## 🔧 **Field Mapping Guide**

### **Required Fields**
- `rmaNumber` - Unique RMA identifier
- `siteName` - Customer site name
- `productName` - Projector model name
- `serialNumber` - Projector serial number
- `createdBy` - Creator name
- `warrantyStatus` - Warranty status

### **Date Fields**
- `ascompRaisedDate` - When RMA was raised (YYYY-MM-DD)
- `customerErrorDate` - When customer reported issue (YYYY-MM-DD)
- `shippedDate` - When shipped (YYYY-MM-DD)
- `rmaReturnShippedDate` - When return shipped (YYYY-MM-DD)

### **Status Fields**
- `caseStatus` - Under Review, Sent to CDS, CDS Approved, Replacement Shipped, Replacement Received, Installation Complete, Faulty Part Returned, CDS Confirmed Return, Completed, Rejected
- `approvalStatus` - Pending Review, Approved, Rejected, Under Investigation
- `priority` - Low, Medium, High, Critical
- `warrantyStatus` - In Warranty, Extended Warranty, Out of Warranty, Expired

### **Shipping Fields**
- `trackingNumber` - Legacy tracking number
- `shippedThru` - Shipping carrier
- `rmaReturnTrackingNumber` - Return tracking number
- `rmaReturnShippedThru` - Return carrier

### **Enhanced Shipping Fields**
- `shipping.outbound.trackingNumber` - Outbound tracking
- `shipping.outbound.carrier` - Outbound carrier
- `shipping.outbound.status` - pending, picked_up, in_transit, out_for_delivery, delivered, exception, returned
- `shipping.return.trackingNumber` - Return tracking
- `shipping.return.carrier` - Return carrier
- `shipping.return.status` - Return status

## 🛠️ **API Endpoints**

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
      "createdBy": "John Doe",
      "caseStatus": "Under Review",
      "warrantyStatus": "In Warranty"
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
  "error": "Invalid data format"
}
```

## 🔄 **Migration Strategies**

### **For Excel Users**
1. **Export to CSV** from Excel
2. **Use CSV Import** method
3. **Download template** for proper format

### **For Database Users**
1. **Export to CSV** from database
2. **Use CSV Import** method
3. **Map fields** to template format

### **For API Users**
1. **Use Bulk JSON Import** method
2. **Transform data** to JSON format
3. **Paste directly** in the interface

### **For Large Datasets**
1. **Split into smaller chunks** (100-500 records each)
2. **Use Bulk JSON Import** for better performance
3. **Process in batches** to avoid timeouts

## 🚨 **Troubleshooting**

### **Common Issues**

#### **CSV Import Issues**
- **"Invalid date format"** - Use YYYY-MM-DD format
- **"Required field missing"** - Fill all required fields
- **"File too large"** - Split into smaller files
- **"Duplicate RMA found"** - Check for existing data

#### **JSON Import Issues**
- **"Invalid JSON format"** - Check JSON syntax
- **"Validation errors"** - Review field requirements
- **"Array expected"** - Ensure data is in array format
- **"Field validation failed"** - Check field values

### **Debug Steps**
1. **Check data format** - CSV or JSON syntax
2. **Validate required fields** - All mandatory fields present
3. **Review date formats** - Use YYYY-MM-DD
4. **Check status values** - Use valid enum values
5. **Test with sample data** - Start with 5-10 records

## 📞 **Best Practices**

### **Data Preparation**
1. **Use templates** - Download and use provided templates
2. **Validate data** - Check dates, numbers, required fields
3. **Test with samples** - Import small batches first
4. **Backup existing data** - Before large imports
5. **Review results** - Check import summaries

### **Performance Tips**
1. **Batch processing** - Import 100-500 records at a time
2. **Use JSON for large datasets** - Better performance than CSV
3. **Validate before import** - Fix errors before importing
4. **Monitor progress** - Watch for timeouts or errors
5. **Keep original files** - For reference and re-imports

## 🎉 **Success Tips**

1. **Choose the right method** - CSV for files, JSON for APIs
2. **Use templates** - Ensures proper format
3. **Validate data first** - Fix errors before importing
4. **Import in batches** - For large datasets
5. **Review results** - Check for errors and duplicates
6. **Test functionality** - Verify imported data works correctly

---

**🎯 Your RMA import system is now ready! Choose the method that best fits your data source and follow the steps above to migrate your RMA data successfully.**

















