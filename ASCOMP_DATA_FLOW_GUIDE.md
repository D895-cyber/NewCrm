# ASCOMP Report Data Flow - Complete Guide

## 📋 **How Data Flows from Form to Downloadable PDF**

This guide explains exactly how an FSE fills data and it becomes a downloadable PDF in the exact ASCOMP format.

---

## 🔄 **Complete Workflow**

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: FSE Opens Form → STEP 2: Fills Data → STEP 3: Submit  │
│         ↓                         ↓                      ↓       │
│  STEP 4: Saved to MongoDB → STEP 5: View Report → STEP 6: PDF   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 **STEP 1: FSE Opens the Form**

**Where**: Navigate to **ASCOMP Reports** page  
**Action**: Click **"Create New Report"** button

### What FSE Sees:
```
┌──────────────────────────────────────────────────────┐
│  ASCOMP Inc. - EW Preventive Maintenance Report      │
│  Complete all sections accurately - Page 1 of 2      │
├──────────────────────────────────────────────────────┤
│  [Page 1: Checklist]  [Page 2: Details & Measurements]│
├──────────────────────────────────────────────────────┤
│  Cinema Information                                   │
│  ├── CINEMA NAME: [_______________]  DATE: [_______] │
│  ├── Address: [__________________________________]   │
│  └── Contact Details: [__________________________]   │
│                                                       │
│  Serial & Equipment Information                       │
│  ├── SERIAL #: [_________]                          │
│  └── Projector Model: [________________________]    │
│                                                       │
│  Service Checklist                                    │
│  ┌────────────────┬─────────┬──────────┐           │
│  │ DESCRIPTION    │ STATUS  │ YES/NO-OK│           │
│  ├────────────────┼─────────┼──────────┤           │
│  │ OPTICALS                              │           │
│  │ Reflector      │ [____]  │ [_____]  │           │
│  │ UV filter      │ [____]  │ [_____]  │           │
│  │ ...            │         │          │           │
│  └────────────────┴─────────┴──────────┘           │
└──────────────────────────────────────────────────────┘
```

---

## ✍️ **STEP 2: FSE Fills the Data**

### **Page 1: Checklist** (All 33 items)

**Example: FSE fills Opticals section:**

| Field | What FSE Enters | How It Appears in PDF |
|-------|----------------|----------------------|
| **Cinema Name** | "PVR Cinemas - Phoenix Mall" | "CINEMA NAME: PVR Cinemas - Phoenix Mall" |
| **Date** | "2025-10-06" | "DATE: 10/06/2025" |
| **Reflector - Status** | "Good" | Shows in STATUS column |
| **Reflector - YES/NO-OK** | Selects "OK" | Shows in YES/NO-OK column |
| **UV filter - Status** | "Cleaned" | Shows in STATUS column |
| **UV filter - YES/NO-OK** | Selects "YES" | Shows in YES/NO-OK column |

**Form View** (what FSE sees):
```
┌────────────────────────────────────────────────┐
│ OPTICALS                                       │
├─────────────────┬──────────┬─────────────────┤
│ Reflector       │ [Good]   │ [OK ▼]          │
│ UV filter       │ [Cleaned]│ [YES ▼]         │
│ Integrator Rod  │ [Clean]  │ [OK ▼]          │
│ Cold Mirror     │ [Good]   │ [OK ▼]          │
│ Fold Mirror     │ [Perfect]│ [YES ▼]         │
└─────────────────┴──────────┴─────────────────┘
```

**PDF Output** (how it appears in downloaded PDF):
```
┌────────────────────────────────────────────────┐
│ OPTICALS                                       │
├─────────────────┬──────────┬─────────────────┤
│ Reflector       │ Good     │ OK              │
│ UV filter       │ Cleaned  │ YES             │
│ Integrator Rod  │ Clean    │ OK              │
│ Cold Mirror     │ Good     │ OK              │
│ Fold Mirror     │ Perfect  │ YES             │
└─────────────────┴──────────┴─────────────────┘
```

### **Page 2: Technical Details**

**Example: FSE fills lamp and voltage data:**

| Field | What FSE Enters | How It Appears in PDF |
|-------|----------------|----------------------|
| **Lamp Make & Model** | "Ushio NSH 3000W" | "Lamp Make and Model: Ushio NSH 3000W" |
| **Running Hours** | "1250" | "Current lamp running hours: 1250" |
| **P vs N** | "235V" | "Voltage parameters: P vs N: 235V" |
| **P vs E** | "5V" | "P vs E: 5V" |
| **N vs E** | "230V" | "N vs E: 230V" |

**Software Version Table** (what FSE fills):
```
┌─────────┬──────┬────┬───────┬───────┐
│ Version │ MCGD │ fL │   x   │   y   │
├─────────┼──────┼────┼───────┼───────┤
│ W2K/4K  │ [6.1]│[14]│[0.312]│[0.329]│
│ R2K/4K  │ [6.1]│[14]│[0.640]│[0.330]│
│ G2K/4K  │ [6.1]│[14]│[0.300]│[0.600]│
└─────────┴──────┴────┴───────┴───────┘
```

**PDF Output** (exact same table in PDF):
```
┌─────────┬──────┬────┬───────┬───────┐
│ Version │ MCGD │ fL │   x   │   y   │
├─────────┼──────┼────┼───────┼───────┤
│ W2K/4K  │  6.1 │ 14 │ 0.312 │ 0.329 │
│ R2K/4K  │  6.1 │ 14 │ 0.640 │ 0.330 │
│ G2K/4K  │  6.1 │ 14 │ 0.300 │ 0.600 │
└─────────┴──────┴────┴───────┴───────┘
```

**Signatures** (Digital capture):
```
┌──────────────────────────────────────────────┐
│ Client's Signature & Stamp                   │
│ ┌──────────────────────────────────────┐    │
│ │  [FSE draws signature with mouse/touch] │    │
│ └──────────────────────────────────────┘    │
│ [Clear Signature] button                     │
└──────────────────────────────────────────────┘
```

---

## 💾 **STEP 3: Data Submission**

**What happens when FSE clicks "Submit Report":**

1. **Frontend collects all form data** into JSON structure:
```json
{
  "date": "2025-10-06",
  "cinemaName": "PVR Cinemas - Phoenix Mall",
  "address": "Phoenix Marketcity, Mumbai",
  "contactDetails": "Mr. Sharma - 9876543210",
  "location": "Mumbai",
  "serialNumber": "SN-12345",
  "equipAndEWServiceVisit": "Second Service",
  "projectorModelSerialAndHours": "Christie CP4325 - SN12345 - 1250hrs",
  "replacementRequired": false,
  
  "opticals": {
    "reflector": { "status": "Good", "yesNoOk": "OK" },
    "uvFilter": { "status": "Cleaned", "yesNoOk": "YES" },
    "integratorRod": { "status": "Clean", "yesNoOk": "OK" },
    "coldMirror": { "status": "Good", "yesNoOk": "OK" },
    "foldMirror": { "status": "Perfect", "yesNoOk": "YES" }
  },
  
  "lampInfo": {
    "makeAndModel": "Ushio NSH 3000W",
    "numberOfLampsRunning": 1,
    "currentLampRunningHours": 1250
  },
  
  "voltageParameters": {
    "pVsN": "235V",
    "pVsE": "5V",
    "nVsE": "230V"
  },
  
  "softwareVersion": {
    "w2k4k": { "mcgd": "6.1", "fl": "14", "x": "0.312", "y": "0.329" },
    "r2k4k": { "mcgd": "6.1", "fl": "14", "x": "0.640", "y": "0.330" },
    "g2k4k": { "mcgd": "6.1", "fl": "14", "x": "0.300", "y": "0.600" }
  },
  
  "engineer": {
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "email": "rajesh@company.com"
  },
  
  "clientSignatureAndStamp": {
    "signatureData": "data:image/png;base64,iVBOR..." // Captured signature
  },
  
  "engineerSignature": {
    "signatureData": "data:image/png;base64,iVBOR..." // Captured signature
  }
}
```

2. **Sent to Backend API**: `POST /api/ascomp-reports`

3. **Backend processes**:
   - Validates data
   - Generates unique report number: `ASCOMP-EW-202510-0001`
   - Saves to MongoDB
   - Returns success with report ID

4. **Success message shown**: "Report created successfully!"

---

## 🗄️ **STEP 4: Data Saved in MongoDB**

**Database Structure** (MongoDB document):
```javascript
{
  _id: ObjectId("..."),
  reportNumber: "ASCOMP-EW-202510-0001",
  date: ISODate("2025-10-06T00:00:00.000Z"),
  cinemaName: "PVR Cinemas - Phoenix Mall",
  address: "Phoenix Marketcity, Mumbai",
  // ... all form fields stored exactly as entered ...
  status: "Submitted",
  createdBy: ObjectId("user_id"),
  createdAt: ISODate("2025-10-06T14:30:00.000Z"),
  updatedAt: ISODate("2025-10-06T14:30:00.000Z")
}
```

---

## 👁️ **STEP 5: View Report**

**Reports List** (what everyone sees):
```
┌───────────────────────────────────────────────────────────────┐
│  ASCOMP EW Reports                                             │
│  [+ Create New Report]                     [🔍 Search] [Filter]│
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 📄 ASCOMP-EW-202510-0001     [Submitted]  10/06/2025   │  │
│  │ 🏢 PVR Cinemas - Phoenix Mall                           │  │
│  │ 👤 Rajesh Kumar              📍 Mumbai                  │  │
│  │                                                          │  │
│  │ [👁️ View] [📥 Download PDF] [✓ Approve] [🗑️ Delete]   │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 📥 **STEP 6: Download as PDF**

**When user clicks "Download PDF" button:**

### Process Flow:
```
1. User clicks [Download PDF]
   ↓
2. Frontend fetches complete report data from API
   GET /api/ascomp-reports/:id
   ↓
3. PDF generator (ascomp-pdf-export.ts) processes data:
   - Creates jsPDF document
   - Adds ASCOMP header and logo text
   - Renders Page 1 checklist table
   - Adds Page 2 with all technical details
   - Embeds signature images
   - Adds footer with report number
   ↓
4. PDF file is generated and downloaded
   Filename: ASCOMP_ASCOMP-EW-202510-0001_PVR_Cinemas_Phoenix_Mall.pdf
   ↓
5. Success message: "PDF Downloaded successfully!"
```

### PDF Output Structure:

**PAGE 1 of PDF:**
```
╔══════════════════════════════════════════════════════════╗
║           ASCOMP INC.                                    ║
║     EW - Preventive Maintenance Report                  ║
║  Address: 9, Community Centre, 2nd Floor, Phase I        ║
║  Mayapuri, New Delhi, Delhi 110064                       ║
║  Mobile: 8882375207  Email: bhupesh1@ascompinc.in       ║
╠══════════════════════════════════════════════════════════╣
║  CINEMA NAME: PVR Cinemas - Phoenix Mall  DATE: 10/06/25║
║  Address: Phoenix Marketcity, Mumbai                     ║
║  Contact Details: Mr. Sharma - 9876543210               ║
╠══════════════════════════════════════════════════════════╣
║  SERIAL #: SN-12345  Equip: Second Service  LOC: Mumbai ║
║  Projector: Christie CP4325 - SN12345 - 1250hrs         ║
║  Replacement Required: ☐                                 ║
╠══════════════════════════════════════════════════════════╣
║  ┌────────────────────────┬──────────┬──────────────┐   ║
║  │ DESCRIPTION            │ STATUS   │ YES/NO-OK    │   ║
║  ├────────────────────────┼──────────┼──────────────┤   ║
║  │ OPTICALS                                          │   ║
║  │ Reflector              │ Good     │ OK           │   ║
║  │ UV filter              │ Cleaned  │ YES          │   ║
║  │ Integrator Rod         │ Clean    │ OK           │   ║
║  │ Cold Mirror            │ Good     │ OK           │   ║
║  │ Fold Mirror            │ Perfect  │ YES          │   ║
║  ├────────────────────────┴──────────┴──────────────┤   ║
║  │ ELECTRONICS                                       │   ║
║  │ Touch Panel            │ Working  │ OK           │   ║
║  │ EVB and IMCB Board     │ Good     │ YES          │   ║
║  │ ... (all sections)                               │   ║
║  └──────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════╝
```

**PAGE 2 of PDF:**
```
╔══════════════════════════════════════════════════════════╗
║  Projector placement, room and environment               ║
║  Well-ventilated projection room, AC maintained at 22°C  ║
╠══════════════════════════════════════════════════════════╣
║  Lamp Make and Model: Ushio NSH 3000W                   ║
║  Number of lamps running: 1                              ║
║  Current lamp running hours: 1250                        ║
║  Voltage: P vs N: 235V  P vs E: 5V  N vs E: 230V       ║
╠══════════════════════════════════════════════════════════╣
║  Software Version                                         ║
║  ┌─────────┬──────┬────┬───────┬───────┐               ║
║  │ Version │ MCGD │ fL │   x   │   y   │               ║
║  ├─────────┼──────┼────┼───────┼───────┤               ║
║  │ W2K/4K  │  6.1 │ 14 │ 0.312 │ 0.329 │               ║
║  │ R2K/4K  │  6.1 │ 14 │ 0.640 │ 0.330 │               ║
║  │ G2K/4K  │  6.1 │ 14 │ 0.300 │ 0.600 │               ║
║  └─────────┴──────┴────┴───────┴───────┘               ║
╠══════════════════════════════════════════════════════════╣
║  Image Evaluation                                         ║
║  Focus/boresight: OK                                     ║
║  Convergence Checked: YES                                ║
║  Pixel defects: None                                     ║
╠══════════════════════════════════════════════════════════╣
║  Air Pollution Level                                      ║
║  HCHO: 0.05  TVOC: 0.3  PM2.5: 35  Temp: 22°C          ║
╠══════════════════════════════════════════════════════════╣
║  Client's Signature & Stamp    Engineer's Signature     ║
║  [Signature Image]             [Signature Image]         ║
║                                Rajesh Kumar              ║
╠══════════════════════════════════════════════════════════╣
║  Report Number: ASCOMP-EW-202510-0001                   ║
║  Generated: 10/06/2025 2:30 PM                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## 📊 **Data Mapping Summary**

| Form Input | Database Field | PDF Output Location |
|-----------|---------------|-------------------|
| Cinema Name field | `cinemaName` | Page 1 Header: "CINEMA NAME:" |
| Date picker | `date` | Page 1 Header: "DATE:" |
| Reflector Status input | `opticals.reflector.status` | Page 1 Table: STATUS column |
| Reflector YES/NO dropdown | `opticals.reflector.yesNoOk` | Page 1 Table: YES/NO-OK column |
| Lamp hours input | `lampInfo.currentLampRunningHours` | Page 2: "Current lamp running hours:" |
| W2K/4K MCGD input | `softwareVersion.w2k4k.mcgd` | Page 2: Software Version Table |
| Client signature canvas | `clientSignatureAndStamp.signatureData` | Page 2: Left signature area |
| Engineer signature canvas | `engineerSignature.signatureData` | Page 2: Right signature area |

---

## ✅ **Complete Example Flow**

### **Scenario: FSE Rajesh submits a report**

1. **10:00 AM** - Rajesh logs into system as FSE
2. **10:05 AM** - Opens "Create New Report" form
3. **10:10 AM** - Fills Page 1 checklist (33 items)
4. **10:20 AM** - Fills Page 2 technical details
5. **10:25 AM** - Captures client signature on iPad
6. **10:26 AM** - Captures his own signature
7. **10:27 AM** - Clicks "Submit Report"
8. **10:27 AM** - Backend saves → Report # ASCOMP-EW-202510-0001 created
9. **10:28 AM** - Manager views report in dashboard
10. **10:30 AM** - Manager clicks "Download PDF"
11. **10:30 AM** - Perfect PDF downloaded matching Word document format!

**Downloaded File:**
- Name: `ASCOMP_ASCOMP-EW-202510-0001_PVR_Cinemas_Phoenix_Mall.pdf`
- Size: ~200KB
- Pages: 2
- Format: Exactly matches original Word document layout
- Ready to: Print, email, archive

---

## 🎯 **Key Benefits**

✅ **Exact Format**: PDF matches Word document pixel-perfect  
✅ **Easy Data Entry**: Simple form fields, dropdowns  
✅ **Digital Signatures**: No need for printing and scanning  
✅ **Instant Download**: Generate PDF in 2 seconds  
✅ **Professional Output**: Ready for clients immediately  
✅ **Searchable**: All data stored in database for reports  
✅ **Traceable**: Every report has unique number  
✅ **Status Tracking**: Draft → Submitted → Approved workflow  

---

## 📞 **Support**

For questions about data flow:
- Check `ASCOMP_EW_REPORT_IMPLEMENTATION.md` for technical details
- Review `ASCOMP_EXACT_FORMAT_IMPLEMENTATION.md` for field mapping
- Contact system administrator

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025  
**Status**: ✅ Complete Implementation







