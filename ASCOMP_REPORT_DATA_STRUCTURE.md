# ASCOMP Service Report Data Structure

This document explains how the FSE form data should be structured to populate the ASCOMP style service report.

## Important Note: Dynamic Descriptions

**All descriptions in the report are now dynamic and based on FSE input.** The image you showed was just an example where the FSE entered "damage" and "solrized" in the OPTICALS section. The FSE can enter any descriptions they want for each item in each section.

### Key Points:
- **Descriptions**: FSE enters whatever they want (e.g., "damage", "solrized", "UV filter", "Reflector", etc.)
- **Status**: FSE enters the actual condition/measurement
- **Result**: FSE enters "OK", "Yes", or "No" for evaluation
- **Empty Fields**: Use empty strings `""` for fields not filled by FSE

## Report Data Structure

```javascript
const reportData = {
  // Basic Report Information
  reportNumber: "REPORT-1756288377724-5111t8kdk",
  reportType: "First", // "First", "Second", "Third", etc.
  date: "2025-05-12",
  
  // Site Information
  siteName: "PVR INOX Cinema City Mall Yamuna Nagar - Auditorium 3",
  siteIncharge: {
    name: "Mr. Sanjeev Kumar",
    phone: "8398986112"
  },
  engineer: {
    name: "Manoj Kumar"
  },
  
  // Projector Information
  projectorModel: "CP2230",
  projectorSerial: "268075014",
  softwareVersion: "4.8.1",
  projectorHours: "82801",
  
  // Lamp Information
  lampModel: "OSRAM - 4.5KW - 67685",
  lampHours: "0", // Total lamp hours
  currentLampHours: "1061",
  lampReplacementRequired: "Replacement Required",
  
  // OPTICALS Section - Dynamic descriptions from FSE input
  opticals: {
    item1: {
      description: "damage", // FSE enters this description
      status: "",
      result: "OK"
    },
    item2: {
      description: "solrized", // FSE enters this description
      status: "",
      result: "OK"
    },
    item3: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item4: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item5: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    }
  },
  
  // ELECTRONICS Section - Dynamic descriptions from FSE input
  electronics: {
    item1: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item2: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item3: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item4: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item5: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item6: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    }
  },
  
  // Serial Number Verification
  serialVerified: {
    description: "Chassis label vs Touch Panel", // FSE can modify this description
    status: "",
    result: "OK"
  },
  
  // Disposable Consumables
  consumables: {
    description: "Air Intake, LAD and RAD", // FSE can modify this description
    status: "replaced",
    result: "OK"
  },
  
  // Coolant
  coolant: {
    description: "Level and Color", // FSE can modify this description
    status: "",
    result: "OK"
  },
  
  // Light Engine Test Pattern
  lightEngineTest: {
    item1: {
      description: "", // FSE can enter any description (e.g., "White", "Red", etc.)
      status: "",
      result: "OK"
    },
    item2: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item3: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item4: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item5: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    }
  },
  
  // MECHANICAL Section
  mechanical: {
    item1: {
      description: "", // FSE can enter any description (e.g., "AC blower and Vane Switch")
      status: "",
      result: "OK"
    },
    item2: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item3: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item4: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item5: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item6: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item7: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item8: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    },
    item9: {
      description: "", // FSE can enter any description
      status: "",
      result: "OK"
    }
  },
  
  // Voltage Parameters
  voltageParameters: {
    pVsN: "230",
    pVsE: "229",
    nVsE: "1"
  },
  
  // Image Evaluation
  imageEvaluation: {
    focusBoresight: "Yes",
    integratorPosition: "Yes",
    spotOnScreen: "No",
    screenCropping: "Yes",
    convergenceChecked: "Yes",
    channelsChecked: "Yes",
    pixelDefects: "No",
    imageVibration: "Yes", // Note: "Yes" means vibration found
    liteLOC: "No"
  },
  
  // Content Server
  contentServer: "Dolby IMS3000",
  
  // Lamp Power Measurements
  lampPowerMeasurements: {
    flBeforePM: "9.6",
    flAfterPM: "14.1"
  },
  
  // Environment Status
  environmentStatus: {
    projectorPlacement: "OK"
  },
  
  // Observations and Remarks
  observations: [
    {
      description: "Service done working successfully ok"
    },
    {
      description: "Convergence and vibration issue found before service same has been informed to site person"
    },
    {
      description: ""
    },
    {
      description: ""
    },
    {
      description: ""
    },
    {
      description: ""
    }
  ],
  
  // Recommended Parts to Change
  recommendedParts: [
    {
      serialNumber: "1",
      partName: "12\" Glass Reflector",
      partNumber: "03-240115-51P",
      quantity: "",
      notes: ""
    },
    {
      serialNumber: "2",
      partName: "Duct Plastic Blower Fixed",
      partNumber: "003-006243-01",
      quantity: "",
      notes: ""
    },
    {
      serialNumber: "",
      partName: "",
      partNumber: "",
      quantity: "",
      notes: ""
    },
    {
      serialNumber: "",
      partName: "",
      partNumber: "",
      quantity: "",
      notes: ""
    },
    {
      serialNumber: "",
      partName: "",
      partNumber: "",
      quantity: "",
      notes: ""
    },
    {
      serialNumber: "",
      partName: "",
      partNumber: "",
      quantity: "",
      notes: ""
    }
  ],
  
  // Measured Color Coordinates (MCGD)
  colorCoordinates: {
    white2k: { fL: "", x: "", y: "" },
    white4k: { fL: "", x: "", y: "" },
    red2k: { fL: "", x: "", y: "" },
    red4k: { fL: "", x: "", y: "" },
    green2k: { fL: "", x: "", y: "" },
    green4k: { fL: "", x: "", y: "" },
    blue2k: { fL: "", x: "", y: "" },
    blue4k: { fL: "", x: "", y: "" }
  },
  
  // CIE XYZ Color Accuracy
  colorAccuracy: {
    blue4k: { x: "", y: "", fL: "" },
    bwStep10_2k: { x: "", y: "", fL: "" },
    bwStep10_4k: { x: "", y: "", fL: "" }
  },
  
  // Screen Information
  screenInfo: {
    scope: {
      height: "6.81",
      width: "16.27",
      gain: ""
    },
    flat: {
      height: "",
      width: "",
      gain: ""
    },
    make: "",
    throwDistance: "21.1"
  },
  
  // Air Pollution Level
  airPollution: {
    level: "28",
    hcho: "0.098",
    tvoc: "0.424",
    pm1: "12",
    pm25: "16",
    pm10: "18",
    temperature: "25",
    humidity: "34"
  },
  
  // Final Status
  leStatus: "Removed",
  acStatus: "Working"
};
```

## Key Points

1. **Status vs Result**: 
   - `status` field contains the actual condition/measurement
   - `result` field contains "OK", "Yes", or "No" for evaluation

2. **Empty Fields**: Use empty strings `""` for fields not filled

3. **Arrays**: Use arrays for observations and recommended parts (up to 6 items each)

4. **Nested Objects**: Use nested objects for complex data like color coordinates

5. **Default Values**: The report generator provides sensible defaults if data is missing

## Integration with FSE Form

The FSE form should collect data in this structure and pass it to the report generator:

```javascript
// In your FSE form submission
const reportData = {
  // Collect all form data in the structure above
  reportNumber: generateReportNumber(),
  reportType: formData.reportType,
  siteName: formData.siteName,
  // ... all other fields
};

// Generate the report
await exportASCOMPStyleReport(reportData);
```

This structure ensures that all the data entered by the FSE will be properly displayed in the ASCOMP style report with the exact same format as shown in the images.
