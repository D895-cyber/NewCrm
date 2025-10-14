# RMA Import - Fixed Field Mapping Guide

## 🎯 **Fixed Import Field Mappings**

Based on your data structure where fields are swapped, here are the corrected import mappings:

### **Core Field Mappings (Fixed)**

| **CSV Column Name** | **Database Field** | **Description** | **Example** |
|---------------------|-------------------|-----------------|-------------|
| `Serial Number` | `productPartNumber` | Part number (stored in serialNumber field) | `129-002103-01` |
| `Product Part Number` | `productName` | Projector model (stored in productPartNumber field) | `CP4230` |
| `Product Name` | `productPartNumber` | Projector model (alternative mapping) | `CP4230` |
| `Projector Serial` | `projectorSerial` | Actual projector serial number | `283809010` |
| `Site Name` | `siteName` | Customer site name | `Xpria Mall - Dombivali-Audi 6` |

### **Import Process**

1. **Prepare Your CSV** with these column names:
   - `Serial Number` (contains part numbers like "129-002103-01")
   - `Product Part Number` (contains projector models like "CP4230")
   - `Projector Serial` (contains actual projector serial numbers like "283809010")
   - `Site Name`
   - `RMA Number`
   - `Call Log Number`
   - `ASCOMP Raised Date`
   - `Customer Error Date`

2. **Import via RMA Management**:
   - Go to RMA Management page
   - Click "Import RMAs" button
   - Select your CSV file
   - The system will now map fields correctly

### **Expected Results After Import**

After importing with the fixed mappings, the RMA interface will display:
- **SN field**: `SN: 283809010` (from `projectorSerial` field)
- **Part field**: `129-002103-01` (from `productPartNumber` field)
- **Product Model**: `CP4230` (from `productName` field)

### **CSV Template Format**

```csv
RMA Number,Call Log Number,Site Name,Serial Number,Product Part Number,Projector Serial,ASCOMP Raised Date,Customer Error Date
RMA-2025-001,CL-2025-001,Xpria Mall - Dombivali-Audi 6,129-002103-01,CP4230,283809010,2025-01-15,2025-01-10
RMA-2025-002,CL-2025-002,Pacific Mall Audi#2,127-002103-03,CP2220,283809011,2025-01-16,2025-01-11
```

### **Field Mapping Logic**

The import system now handles the swapped data correctly:

1. **Serial Number** column → `productPartNumber` field (stores part numbers)
2. **Product Part Number** column → `productName` field (stores projector models)
3. **Projector Serial** column → `projectorSerial` field (stores actual projector serials)

### **Validation**

After import, verify that:
- ✅ SN field shows projector serial numbers with "SN:" prefix
- ✅ Part field shows part numbers (like "129-002103-01")
- ✅ Product Model shows projector models (like "CP4230")
- ✅ All data displays correctly in the RMA management interface

### **Troubleshooting**

If data still appears incorrect after import:
1. Check that your CSV column names match exactly
2. Verify that the data in your CSV is in the correct columns
3. Ensure projector serial numbers are in a separate "Projector Serial" column
4. Contact support if you need custom field mapping

## 🚀 **Ready to Import**

The import system is now fixed to handle your swapped data structure correctly. You can proceed with importing your RMA data.

