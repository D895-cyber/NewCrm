# RMA Field Mapping Guide

## 🎯 **Correct Field Mappings**

Based on user requirements and database structure, here are the correct field mappings for all RMA interfaces:

### **Core Display Fields**

| **UI Field** | **Backend Field Priority** | **Description** | **Example** |
|--------------|---------------------------|-----------------|-------------|
| **Serial Number** | `projectorSerial` → `defectiveSerialNumber` | Projector serial number with SN: prefix | `SN: 283809010` |
| **Part Number** | `serialNumber` → `productPartNumber` → `defectivePartNumber` | Part number of the component | `129-002103-01` |
| **Part Name** | `productPartNumber` → `productName` → `projectorModel` | Projector model name | `CP2220` |
| **Brand & Model** | `brand` + `productName` | Combined brand and model | `Epson CP2220` |
| **Site Name** | `siteName` → `customerSite` | Customer site name | `Xpria Mall - Dombivali-Audi 6` |

### **Status & Workflow Fields**

| **UI Field** | **Backend Field Priority** | **Description** |
|--------------|---------------------------|-----------------|
| **Status** | `caseStatus` → `status` | Current RMA status |
| **Priority** | `priority` | RMA priority level |
| **Approval Status** | `approvalStatus` | Approval workflow status |
| **Warranty Status** | `warrantyStatus` | Warranty coverage status |

### **Date Fields**

| **UI Field** | **Backend Field Priority** | **Description** |
|--------------|---------------------------|-----------------|
| **RMA Date** | `ascompRaisedDate` → `issueDate` | When RMA was raised |
| **Customer Error Date** | `customerErrorDate` | When customer reported issue |
| **Expected Resolution** | `expectedResolution` | Expected completion date |

### **Defective Part Details**

| **UI Field** | **Backend Field Priority** | **Description** |
|--------------|---------------------------|-----------------|
| **Defective Part Number** | `defectivePartNumber` | Number of defective part |
| **Defective Part Name** | `defectivePartName` | Name of defective component |
| **Defective Serial Number** | `defectiveSerialNumber` | Serial of defective part |
| **Symptoms** | `symptoms` → `failureDescription` → `reason` | Issue description |

### **Replacement Part Details**

| **UI Field** | **Backend Field Priority** | **Description** |
|--------------|---------------------------|-----------------|
| **Replaced Part Number** | `replacedPartNumber` | Replacement part number |
| **Replaced Part Name** | `replacedPartName` | Replacement part name |
| **Replaced Part Serial** | `replacedPartSerialNumber` | Replacement part serial |

## 🔧 **Implementation Strategy**

### **1. Frontend Mapping Functions**
Each RMA interface should have a standardized mapping function:

```typescript
const mapBackendDataToFrontend = (backendRMA: any) => {
  return {
    // Core fields with correct priority
    serialNumber: backendRMA.projectorSerial || backendRMA.serialNumber || 'N/A',
    productPartNumber: backendRMA.productPartNumber || backendRMA.defectivePartNumber || 'N/A',
    productName: backendRMA.productName || backendRMA.projectorModel || 'N/A',
    siteName: backendRMA.siteName || backendRMA.customerSite || 'N/A',
    brand: backendRMA.brand || 'N/A',
    
    // Status fields
    caseStatus: backendRMA.caseStatus || backendRMA.status || 'Under Review',
    priority: backendRMA.priority || 'Medium',
    approvalStatus: backendRMA.approvalStatus || 'Pending Review',
    warrantyStatus: backendRMA.warrantyStatus || 'In Warranty',
    
    // Date fields
    ascompRaisedDate: backendRMA.ascompRaisedDate ? 
      new Date(backendRMA.ascompRaisedDate).toLocaleDateString() : 
      backendRMA.issueDate ? new Date(backendRMA.issueDate).toLocaleDateString() : 'N/A',
    customerErrorDate: backendRMA.customerErrorDate ? 
      new Date(backendRMA.customerErrorDate).toLocaleDateString() : 'N/A',
    
    // Defective part fields
    defectivePartNumber: backendRMA.defectivePartNumber || 'N/A',
    defectivePartName: backendRMA.defectivePartName || 'Projector Component',
    defectiveSerialNumber: backendRMA.defectiveSerialNumber || 'N/A',
    symptoms: backendRMA.symptoms || backendRMA.failureDescription || backendRMA.reason || 'N/A',
    
    // Replacement part fields
    replacedPartNumber: backendRMA.replacedPartNumber || 'N/A',
    replacedPartName: backendRMA.replacedPartName || 'N/A',
    replacedPartSerialNumber: backendRMA.replacedPartSerialNumber || 'N/A',
    
    // Other fields
    rmaNumber: backendRMA.rmaNumber || 'N/A',
    callLogNumber: backendRMA.callLogNumber || 'N/A',
    rmaOrderNumber: backendRMA.rmaOrderNumber || 'N/A',
    createdBy: backendRMA.createdBy || 'System',
    notes: backendRMA.notes || 'N/A'
  };
};
```

### **2. Display Formatting**
- **Serial Number**: Always prefix with "SN: " in display
- **Brand & Model**: Combine as "Brand Model" (e.g., "Epson CP2220")
- **Dates**: Format as readable dates (MM/DD/YYYY)

### **3. Interfaces to Update**
1. **RMAPage.tsx** - Main RMA management interface
2. **RMADashboardPage.tsx** - Dashboard view (needs mapping function)
3. **RMATrackingPage.tsx** - Tracking interface
4. **RMAWorkflowManagement.tsx** - Workflow management
5. **WorkflowManagement.tsx** - General workflow

## 🚨 **Current Issues Identified**

1. **RMADashboardPage.tsx** - No mapping function, uses raw backend data
2. **Serial Number** - Some interfaces show part number instead of projector serial
3. **Part Number** - Inconsistent field mapping across interfaces
4. **Part Name** - Some interfaces show empty or wrong data
5. **Brand & Model** - Not consistently combined across interfaces

## ✅ **Fix Priority Order**

1. **High Priority**: Serial Number, Part Number, Part Name (core display fields)
2. **Medium Priority**: Brand & Model, Site Name (identification fields)
3. **Low Priority**: Status fields, Date fields (workflow fields)

## 📋 **Testing Checklist**

After implementing fixes:
- [ ] Serial Number shows projector serial with "SN:" prefix
- [ ] Part Number shows actual part number (e.g., "129-002103-01")
- [ ] Part Name shows projector model (e.g., "CP2220")
- [ ] Brand & Model shows combined format (e.g., "Epson CP2220")
- [ ] All interfaces show consistent data
- [ ] No empty or "N/A" values for core fields
- [ ] Date fields display correctly
- [ ] Status fields show proper values
