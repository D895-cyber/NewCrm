# ASCOMP EW Report - Exact Format Implementation Plan

## Document Analysis

Based on the screenshots of `EW_open_word_v6.3.5docx.docx`, here's the exact structure:

### Page 1 Structure
```
┌─────────────────────────────────────────────────────────────┐
│ ASCOMP INC. Logo                                            │
│ EW - Preventive Maintenance Report                          │
│ Address: 9, Community Centre, 2nd Floor, Phase I            │
│ Mayapuri, New Delhi 110064                                  │
│ Mobile: 8882375207  Email: bhupesh1@ascompinc.in           │
├─────────────────────────────────────────────────────────────┤
│ CINEMA NAME: [___________]              DATE: [___________] │
│ Address: [____________________________________________]      │
│ Contact Details: [____________________________________]      │
├─────────────────────────────────────────────────────────────┤
│ SERIAL #: [_____]  Equip and EW Service visit: [_______]   │
│                                           LOCATION: [_____]  │
│ Projector Model, Serial No.              Replacement        │
│ and Running Hours: [_____]                Required: [  ]    │
├─────────────────────────────────────────────────────────────┤
│ SECTIONS      │ DESCRIPTION              │ STATUS │YES/NO-OK│
├───────────────┼─────────────────────────┼────────┼─────────┤
│ OPTICALS      │ Reflector                │        │         │
│               │ UV filter                │        │         │
│               │ Integrator Rod           │        │         │
│               │ Cold Mirror              │        │         │
│               │ Fold Mirror              │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│ ELECTRONICS   │ Touch Panel              │        │         │
│               │ EVB and IMCB Board       │        │         │
│               │ PIB and ICP Board        │        │         │
│               │ IMB-2 Board              │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│Serial Number  │Chassis label vs Touch    │        │         │
│verified       │Panel                     │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│Disposable     │Air intake, LAD and RAD   │        │         │
│Consumables    │                          │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│ Coolant       │ Level and Color          │        │         │
│               │ White                    │        │         │
│               │ Red                      │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│Light Engine   │ Green                    │        │         │
│Test Pattern   │ Blue                     │        │         │
│               │ Black                    │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│ MECHANICAL    │AC Blower and Vane Switch │        │         │
│               │Extractor Vane Switch     │        │         │
│               │Exhaust CFM - Value       │        │         │
│               │Light Engine's fans with  │        │         │
│               │LAD fan                   │        │         │
│               │Card Cage Top and Bottom  │        │         │
│               │fans                      │        │         │
│               │Radiator fan and Pump     │        │         │
│               │Connector and hose for    │        │         │
│               │the Pump                  │        │         │
│               │Security and lamp house   │        │         │
│               │lock switch               │        │         │
├───────────────┼─────────────────────────┼────────┼─────────┤
│Lamp LOC       │                          │        │         │
│Mechanism X    │                          │        │         │
│and Z movement │                          │        │         │
└───────────────┴─────────────────────────┴────────┴─────────┘
```

### Page 2 Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Projector placement, room and environment                    │
├─────────────────────────────────────────────────────────────┤
│ Lamp Make and Model: [___________]                          │
│ Number of lamps running: [___] Current lamp running hours:[_]│
│ Voltage parameters: P vs N[__] P vs E[__] N vs E[__]       │
│ fL measurements: [___]                                       │
│ Content Player Model: [___________]                          │
│ AC Status: Working – Not Working – Not Available            │
│ LE Status during PM:                                         │
│   Removed – Not removed, Good fL – Not removed, DE bonded   │
│ Remarks: [___________________]  LE S. No. [_____]           │
├─────────────────────────────────────────────────────────────┤
│ Software Version │      │ MCGD │ fL │ x │ y │              │
│                  │ W2K/4K│      │    │   │   │              │
│                  │ R2K/4K│      │    │   │   │              │
│                  │ G2K/4K│      │    │   │   │              │
├─────────────────────────────────────────────────────────────┤
│ Screen Information in metres │ Height │ Width │ Gain │      │
│ SCOPE                        │        │       │      │      │
│ FLAT                         │        │       │      │      │
│ Screen Make [_____]          │                              │
│ Throw Distance [_____]       │                              │
├─────────────────────────────────────────────────────────────┤
│ Image Evaluation                               │ OK-Yes/No  │
│ Focus/boresight                                │            │
│ Integrator Position                            │            │
│ Any Spot on the Screen after IPM               │            │
│ Cropping, Screen Edges 6X31 and SCOPE          │            │
│ Convergence Checked                            │            │
│ Channels Checked - Scope, Flat, Alternative    │            │
│ Pixel defects                                  │            │
│ Excessive image vibration                      │            │
│ LiteLOC                                        │            │
├─────────────────────────────────────────────────────────────┤
│ CIE XYZ Color Accuracy Test Pattern │ x │ y │ fL │         │
│ BW Step-                             │   │   │    │         │
│ 10 2K/4K                            │   │   │    │         │
├─────────────────────────────────────────────────────────────┤
│ Air Pollution Level                                          │
│ Level│HCHO│TVOC│PM1.0│PM2.5│PM10│Temperature│Humidity %│   │
│      │    │    │     │     │    │           │          │   │
├─────────────────────────────────────────────────────────────┤
│ Client's Signature & Stamp        Engineer's Signature      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Enhanced Data Model
File: `backend/server/models/ASCOMPServiceReport.js`

```javascript
const mongoose = require('mongoose');

const ascompServiceReportSchema = new mongoose.Schema({
  // Header Information
  reportNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  cinemaName: { type: String, required: true },
  address: { type: String, required: true },
  contactDetails: { type: String },
  location: { type: String },
  
  // Serial Information
  serialNumber: { type: String },
  equipAndEWServiceVisit: { type: String },
  projectorModelSerialAndHours: { type: String },
  replacementRequired: { type: Boolean, default: false },
  
  // PAGE 1: Main Checklist Table
  opticals: {
    reflector: { status: String, yesNoOk: String },
    uvFilter: { status: String, yesNoOk: String },
    integratorRod: { status: String, yesNoOk: String },
    coldMirror: { status: String, yesNoOk: String },
    foldMirror: { status: String, yesNoOk: String }
  },
  
  electronics: {
    touchPanel: { status: String, yesNoOk: String },
    evbAndImcbBoard: { status: String, yesNoOk: String },
    pibAndIcpBoard: { status: String, yesNoOk: String },
    imb2Board: { status: String, yesNoOk: String }
  },
  
  serialNumberVerified: {
    chassisLabelVsTouchPanel: { status: String, yesNoOk: String }
  },
  
  disposableConsumables: {
    airIntakeLadAndRad: { status: String, yesNoOk: String }
  },
  
  coolant: {
    levelAndColor: { status: String, yesNoOk: String },
    white: { status: String, yesNoOk: String },
    red: { status: String, yesNoOk: String }
  },
  
  lightEngineTestPattern: {
    green: { status: String, yesNoOk: String },
    blue: { status: String, yesNoOk: String },
    black: { status: String, yesNoOk: String }
  },
  
  mechanical: {
    acBlowerAndVaneSwitch: { status: String, yesNoOk: String },
    extractorVaneSwitch: { status: String, yesNoOk: String },
    exhaustCfmValue: { status: String, yesNoOk: String },
    lightEngineFansWithLadFan: { status: String, yesNoOk: String },
    cardCageTopAndBottomFans: { status: String, yesNoOk: String },
    radiatorFanAndPump: { status: String, yesNoOk: String },
    connectorAndHoseForPump: { status: String, yesNoOk: String },
    securityAndLampHouseLockSwitch: { status: String, yesNoOk: String }
  },
  
  lampLocMechanism: {
    xAndZMovement: { status: String, yesNoOk: String }
  },
  
  // PAGE 2: Detailed Information
  projectorPlacement: { type: String },
  
  lampInfo: {
    makeAndModel: { type: String },
    numberOfLampsRunning: { type: Number },
    currentLampRunningHours: { type: Number }
  },
  
  voltageParameters: {
    pVsN: { type: String },
    pVsE: { type: String },
    nVsE: { type: String }
  },
  
  flMeasurements: { type: String },
  contentPlayerModel: { type: String },
  acStatus: { 
    type: String, 
    enum: ['Working', 'Not Working', 'Not Available'] 
  },
  leStatusDuringPM: { 
    type: String,
    enum: ['Removed', 'Not removed - Good fL', 'Not removed - DE bonded']
  },
  remarks: { type: String },
  leSNo: { type: String },
  
  // Software Version
  softwareVersion: {
    w2k4k: { mcgd: String, fl: String, x: String, y: String },
    r2k4k: { mcgd: String, fl: String, x: String, y: String },
    g2k4k: { mcgd: String, fl: String, x: String, y: String }
  },
  
  // Screen Information
  screenInformation: {
    scope: { height: String, width: String, gain: String },
    flat: { height: String, width: String, gain: String },
    screenMake: { type: String },
    throwDistance: { type: String }
  },
  
  // Image Evaluation
  imageEvaluation: {
    focusBoresight: { type: String },
    integratorPosition: { type: String },
    spotOnScreenAfterIPM: { type: String },
    croppingScreenEdges: { type: String },
    convergenceChecked: { type: String },
    channelsChecked: { type: String },
    pixelDefects: { type: String },
    excessiveImageVibration: { type: String },
    liteLoc: { type: String }
  },
  
  // CIE XYZ Color Accuracy
  cieXyzColorAccuracy: {
    bwStep: { x: String, y: String, fl: String },
    _10_2k4k: { x: String, y: String, fl: String }
  },
  
  // Air Pollution Level
  airPollutionLevel: {
    hcho: { type: String },
    tvoc: { type: String },
    pm10: { type: String },
    pm25: { type: String },
    pm10_2: { type: String },
    temperature: { type: String },
    humidity: { type: String }
  },
  
  // Signatures
  clientSignature: {
    imageUrl: { type: String },
    stamp: { type: String }
  },
  engineerSignature: {
    imageUrl: { type: String },
    name: { type: String }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  engineer: {
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ASCOMPServiceReport', ascompServiceReportSchema);
```

### Step 2: Create Form Component
File: `frontend/src/components/ASCOMPExactFormatForm.tsx`

This will be a multi-page form matching the exact document structure.

### Step 3: Create PDF Export
File: `frontend/src/utils/ascomp-pdf-export.ts`

This will generate a PDF matching the exact layout of the Word document.

### Step 4: Update Routes
Add routes for the new ASCOMP exact format reports.

## Field Mapping

### Current vs Required Fields

| Current Field | Required Field | Status |
|--------------|----------------|--------|
| ❌ Not present | Cinema Name | **MISSING** |
| ❌ Not present | Address | **MISSING** |
| ❌ Not present | Contact Details | **MISSING** |
| ❌ Not present | Serial # | **MISSING** |
| ❌ Not present | Equip and EW Service visit | **MISSING** |
| ❌ Not present | Replacement Required checkbox | **MISSING** |
| ✅ Partial | Opticals (5 items exact) | **NEEDS UPDATE** |
| ✅ Partial | Electronics (4 items exact) | **NEEDS UPDATE** |
| ❌ Not present | Serial Number verified | **MISSING** |
| ❌ Not present | Disposable Consumables | **MISSING** |
| ❌ Not present | Coolant (Level, White, Red) | **MISSING** |
| ❌ Not present | Light Engine Test Pattern | **MISSING** |
| ✅ Partial | Mechanical (8 items exact) | **NEEDS UPDATE** |
| ❌ Not present | Lamp LOC Mechanism | **MISSING** |
| ❌ Not present | Projector placement | **MISSING** |
| ✅ Present | Lamp info | **OK** |
| ✅ Present | Voltage parameters | **OK** |
| ❌ Not present | fL measurements | **MISSING** |
| ❌ Not present | Content Player Model | **MISSING** |
| ❌ Not present | AC Status | **MISSING** |
| ❌ Not present | LE Status during PM | **MISSING** |
| ❌ Not present | Software Version table | **MISSING** |
| ❌ Not present | Screen Information table | **MISSING** |
| ✅ Partial | Image Evaluation | **NEEDS UPDATE** |
| ❌ Not present | CIE XYZ Color Accuracy | **MISSING** |
| ✅ Present | Air Pollution Level | **PARTIAL** |
| ❌ Not present | Client Signature & Stamp | **MISSING** |
| ✅ Present | Engineer Signature | **OK** |

## Next Steps

1. ✅ Create complete data model
2. ⏳ Build exact format form (Page 1 & 2)
3. ⏳ Implement PDF export matching exact layout
4. ⏳ Add signature capture for client & engineer
5. ⏳ Test with sample data

Shall I proceed with creating these files?







