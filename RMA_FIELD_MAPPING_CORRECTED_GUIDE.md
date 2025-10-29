# RMA Field Mapping - CORRECTED Implementation Guide

## 🎯 **Fixed Field Mappings According to User Specifications**

This guide documents the corrected RMA import field mappings that have been implemented to match your exact 25-field specification.

## 📊 **Corrected Field Mappings**

### **Field-by-Field Specification**

| **Field #** | **CSV Column Name** | **Database Field** | **Description** | **Example Values** | **Validation Rules** |
|-------------|---------------------|-------------------|-----------------|-------------------|---------------------|
| 1 | `RMA/CI RMA / Lamps` | `rmaType` | Only two values: RMA or RMA CL | `RMA`, `RMA CL` | Must be one of these two values |
| 2 | `Call Log #` | `callLogNumber` | Number like 694176 | `694176` | Numeric string |
| 3 | `RMA #` | `rmaNumber` | Number like 176020 or blank | `176020`, `""` | Can be empty |
| 4 | `RMA Order # SX/S4` | `rmaOrderNumber` | Number like 299811 or empty | `299811`, `""` | Can be empty |
| 5 | `Ascomp Raised Date` | `ascompRaisedDate` | RMA raised date | `2024-01-15` | Required date field |
| 6 | `Customer Error Date` | `customerErrorDate` | Date customer reported error | `2024-01-10` | Required date field |
| 7 | `Site Name` | `siteName` | Comes from Serial# field | `Site from Serial: 12345` | Derived from serial number |
| 8 | `Product Name` | `productName` | Model number from Serial# field | `Model from Serial: 12345` | Derived from serial number |
| 9 | `Product Part #` | `productPartNumber` | Part number like 163-015107-01 | `163-015107-01` | Part number format |
| 10 | `Serial #` | `serialNumber` | Projector serial number (most important) | `283809010` | Required for derivation |
| 11 | `Defective Part #` | `defectivePartNumber` | Part number like 000-001195-01 | `000-001195-01` | Part number format |
| 12 | `Defective Part Name` | `defectivePartName` | Name like "Assy. Ballast" | `Assy. Ballast` | Descriptive text |
| 13 | `Defective Serial #` | `defectiveSerialNumber` | Serial like 10026145FA028 or blank | `10026145FA028`, `""` | Can be empty |
| 14 | `Symptoms` | `symptoms` | Description like "Ballast communication failed" | `Ballast communication failed` | Descriptive text |
| 15 | `Replaced Part #` | `replacedPartNumber` | Replacement part like 004-001195-01 or blank | `004-001195-01`, `""` | Can be empty |
| 16 | `Replaced Part Serial #` | `replacedPartSerialNumber` | Serial like 10039624FA023 or NA or empty | `10039624FA023`, `NA`, `""` | Can be empty |
| 17 | `Shipped date` | `shippedDate` | Date replacement part shipped | `2024-01-20` | Date format |
| 18 | `Tracking #` | `trackingNumber` | Docket number of replacement part | `DTDC123456` | Tracking number |
| 19 | `Shipped Thru'` | `shippedThru` | Delivery provider like "by hand" or "DTDC" | `by hand`, `DTDC` | Delivery provider |
| 20 | `Remarks` | `remarks` | Delivery status like "delivered" or "in transit" | `delivered`, `in transit` | Delivery status only |
| 21 | `Created By` | `createdBy` | Real user (currently Pankaj) | `Pankaj` | User name |
| 22 | `Case Status` | `caseStatus` | Already defined status | `Under Review` | Predefined status |
| 23 | `RMA return Shipped date` | `rmaReturnShippedDate` | Date defective part shipped from site | `2024-01-25` | Date format |
| 24 | `RMA return Tracking #` | `rmaReturnTrackingNumber` | Tracking details or docket number | `DTDC789012` | Tracking number |
| 25 | `Shipped Thru'` | `rmaReturnShippedThru` | Provider of shipping defective part | `DTDC`, `by hand` | Delivery provider |
| 26 | `Brand` | `brand` | Projector brand (default: Christie) | `Christie` | Default value set |

## 🔧 **Key Corrections Made**

### **1. Field Mapping Corrections**
- **RMA Type**: Now correctly maps to only `RMA` or `RMA CL` values
- **Serial Number**: Properly mapped as the most important field for derivation
- **Site Name & Product Name**: Now derived from Serial Number field
- **Created By**: Set to real user "Pankaj" instead of generic "Excel Import"

### **2. Column Position Mapping**
- Updated column mapping to match exact 25-field specification
- Corrected field order to match your CSV structure
- Added proper validation for each field type

### **3. Data Validation Rules**
- **RMA Type**: Validates against only two allowed values
- **Dates**: Proper date parsing and validation
- **Serial Numbers**: Enhanced validation for projector serial numbers
- **Part Numbers**: Format validation for part number patterns

## 📋 **CSV Template Format**

Your CSV should have these exact column headers in this order:

```csv
S.no,RMA/CI RMA / Lamps,Call Log #,RMA #,RMA Order # SX/S4,Ascomp Raised Date,Customer Error Date,Site Name,Product Name,Product Part #,Serial #,Defective Part #,Defective Part Name,Defective Serial #,Symptoms,Replaced Part #,Replaced Part Serial #,Shipped date,Tracking #,Shipped Thru',Remarks,Created By,Case Status,RMA return Shipped date,RMA return Tracking #,Shipped Thru',Brand
1,RMA,694176,176020,299811,2024-01-15,2024-01-10,Site A,CP4230,163-015107-01,283809010,000-001195-01,Assy. Ballast,10026145FA028,Ballast communication failed,004-001195-01,10039624FA023,2024-01-20,DTDC123456,DTDC,delivered,Pankaj,Under Review,2024-01-25,DTDC789012,DTDC,Christie
```

## 🚀 **Import Process**

### **Step 1: Prepare Your Data**
1. Ensure your CSV has the exact 25 columns listed above
2. Use the correct data formats for each field
3. Save as CSV file

### **Step 2: Import via RMA Management**
1. Go to **RMA Management** page
2. Click **"Import RMAs"** button
3. Select your corrected CSV file
4. Review the import results

### **Step 3: Verify Data**
After import, verify that:
- **RMA Type** shows only "RMA" or "RMA CL"
- **Site Name** and **Product Name** are derived from Serial Number
- **Created By** shows "Pankaj"
- All 25 fields are properly populated

## ✅ **Expected Results**

After importing with the corrected mappings:

- **Field 1**: `RMA Type: RMA` or `RMA Type: RMA CL`
- **Field 2**: `Call Log: 694176`
- **Field 3**: `RMA Number: 176020`
- **Field 7**: `Site Name: Site from Serial: 283809010` (derived)
- **Field 8**: `Product Name: Model from Serial: 283809010` (derived)
- **Field 10**: `Serial Number: 283809010` (most important field)
- **Field 21**: `Created By: Pankaj`

## 🔍 **Troubleshooting**

### **Common Issues Fixed**
1. **Field Swapping**: Product Name and Product Part Number are now correctly mapped
2. **Serial Number Derivation**: Site Name and Product Name now derive from Serial Number
3. **RMA Type Validation**: Only accepts "RMA" or "RMA CL" values
4. **User Assignment**: Created By field now shows real user "Pankaj"

### **Data Validation**
- All 25 fields are properly validated
- Date fields use proper date parsing
- Part numbers follow correct format validation
- Serial numbers are treated as the primary identifier

## 📞 **Support**

If you encounter any issues with the corrected import:
1. Check that your CSV has exactly 25 columns
2. Verify column headers match exactly
3. Ensure data formats are correct
4. Contact support if field mapping issues persist

The corrected implementation ensures all 25 fields are properly mapped according to your exact specifications.
