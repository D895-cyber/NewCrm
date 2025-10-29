/**
 * ASCOMP Data Transformation Mapper
 * 
 * This mapper transforms the form data structure to match the HTML template expectations.
 * The form uses nested arrays and different field names, while the template expects
 * flat objects with specific naming conventions.
 */

export interface FormData {
  // General Information
  reportNumber: string;
  reportType: string;
  date: string;
  siteName: string;
  siteAddress: string;
  siteIncharge: {
    name: string;
    contact: string;
  };
  engineer: {
    name: string;
    phone: string;
    email: string;
  };

  // Projector Information
  projectorModel: string;
  projectorSerial: string;
  brand: string;
  softwareVersion: string;
  projectorRunningHours: string;

  // Lamp Information
  lampModel: string;
  lampRunningHours: string;
  currentLampHours: string;
  replacementRequired: boolean;

  // Inspection Sections
  inspectionSections: {
    opticals: Array<{ description: string; status: string; result: string }>;
    electronics: Array<{ description: string; status: string; result: string }>;
    mechanical: Array<{ description: string; status: string; result: string }>;
    serialNumberVerified: { description: string; status: string; result: string };
    disposableConsumables: Array<{ description: string; status: string; result: string }>;
    coolant: { description: string; status: string; result: string };
    lightEngineTestPatterns: Array<{ color: string; status: string; result: string }>;
  };

  // Other fields
  voltageParameters: {
    pVsN: string;
    pVsE: string;
    nVsE: string;
  };
  contentFunctionality: {
    serverContentPlaying: string;
    lampPowerTestBefore: string;
    lampPowerTestAfter: string;
    projectorPlacementEnvironment: string;
    roomStatus: string;
    environmentStatus: string;
  };
  observations: Array<{ number: string; description: string }>;
  imageEvaluation: any;
  recommendedParts: Array<any>;
  measuredColorCoordinates: Array<any>;
  cieColorAccuracy: Array<any>;
  screenInfo: any;
  airPollutionLevels: any;
  finalStatus: any;
  photos: Array<any>;
  notes: string;
  companyName: string;
  companyAddress: string;
  companyContact: {
    desk: string;
    mobile: string;
  };
  [key: string]: any;
}

export interface TemplateData {
  // Basic information
  cinemaName: string;
  location: string;
  address: string;
  contactDetails: string;
  screenNumber: string;
  date: string;
  projectorModelSerialAndHours: string;

  // Opticals
  opticals: {
    reflector: { status: string; replacement: string };
    uvFilter: { status: string; replacement: string };
    integratorRod: { status: string; replacement: string };
    coldMirror: { status: string; replacement: string };
    foldMirror: { status: string; replacement: string };
  };

  // Electronics
  electronics: {
    touchPanel: { status: string; replacement: string };
    evbImcbBoard: { status: string; replacement: string };
    imbSBoard: { status: string; replacement: string };
  };

  // Serial Number Verification
  serialNumberVerified: {
    chassisLabel: { status: string; replacement: string };
  };

  // Disposable Consumables
  disposableConsumables: {
    airIntake: { status: string; replacement: string };
  };

  // Coolant
  coolant: {
    level: { status: string; replacement: string };
  };

  // Mechanical
  mechanical: {
    acBlowerVaneSwitch: { status: string; replacement: string };
    extractorVaneSwitch: { status: string; replacement: string };
    exhaustCFM: { value: string; replacement: string };
    lightEngine4Fans: { status: string; replacement: string };
    cardCageFans: { status: string; replacement: string };
    radiatorFanPump: { status: string; replacement: string };
    connectorHosePump: { status: string; replacement: string };
  };

  // Lamp LOC Mechanism
  lampLOCMechanism: {
    xMovement: { status: string; replacement: string };
  };

  // Light Engine Test Pattern
  lightEngineTestPattern: {
    overall: { status: string; replacement: string };
  };

  // Lamp Information
  lampInfo: {
    makeAndModel: string;
    currentRunningHours: string;
  };

  // fL Measurements
  fLMeasurements: {
    value: string;
  };

  // Other fields
  contentPlayerModel: string;
  acStatus: string;
  leStatusDuringPM: string;
  remarks: string;

  // CIE XYZ Color Accuracy
  cieXYZColorAccuracy: {
    white: { fL: string; x: string; y: string };
    red: { fL: string; x: string; y: string };
    green: { fL: string; x: string; y: string };
    blue: { fL: string; x: string; y: string };
  };

  // Screen Information
  screenInformation: {
    scope: { height: string; width: string };
    flat: { height: string; width: string };
  };

  // Image Evaluation
  imageEvaluation: {
    focusBoresite: string;
    integratorPosition: string;
    spotOnScreen: string;
    screenCropping: string;
    convergenceChecked: string;
    channelsChecked: string;
    pixelDefects: string;
    imageVibration: string;
    liteLOC: string;
  };

  // Engineer Information
  engineer: {
    name: string;
    phone: string;
  };

  // Signatures
  clientSignature: string | null;
  engineerSignature: string | null;

  [key: string]: any;
}

/**
 * Transform form data to match HTML template structure
 */
export function transformFormDataToTemplate(formData: FormData): TemplateData {
  console.log('🔄 Starting data transformation...');
  console.log('📥 Input form data:', formData);

  // Helper function to safely get array item
  const getArrayItem = (arr: any[] | undefined, index: number, defaultValue: any = {}) => {
    return arr && arr[index] ? arr[index] : defaultValue;
  };

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string, defaultValue: string = 'N/A'): string => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    return value !== null && value !== undefined && value !== '' ? String(value) : defaultValue;
  };

  const transformed: TemplateData = {
    // Basic Information
    cinemaName: formData.siteName || 'N/A',
    location: formData.siteAddress || 'N/A',
    address: formData.siteAddress || 'N/A',
    contactDetails: formData.siteIncharge?.contact || 'N/A',
    screenNumber: formData.screenNumber || 'N/A',
    date: formData.date || new Date().toISOString().split('T')[0],
    
    // Projector Information (combined field)
    projectorModelSerialAndHours: `${formData.projectorModel || 'N/A'} - Serial: ${formData.projectorSerial || 'N/A'} - Hours: ${formData.projectorRunningHours || 'N/A'}`,
    
    // Opticals Section - Transform array to object structure
    opticals: {
      reflector: {
        status: getArrayItem(formData.inspectionSections?.opticals, 0).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.opticals, 0).result || 'N/A'
      },
      uvFilter: {
        status: getArrayItem(formData.inspectionSections?.opticals, 1).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.opticals, 1).result || 'N/A'
      },
      integratorRod: {
        status: getArrayItem(formData.inspectionSections?.opticals, 2).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.opticals, 2).result || 'N/A'
      },
      coldMirror: {
        status: getArrayItem(formData.inspectionSections?.opticals, 3).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.opticals, 3).result || 'N/A'
      },
      foldMirror: {
        status: getArrayItem(formData.inspectionSections?.opticals, 4).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.opticals, 4).result || 'N/A'
      }
    },
    
    // Electronics Section - Transform array to object structure
    electronics: {
      touchPanel: {
        status: getArrayItem(formData.inspectionSections?.electronics, 0).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.electronics, 0).result || 'N/A'
      },
      evbImcbBoard: {
        status: getArrayItem(formData.inspectionSections?.electronics, 1).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.electronics, 1).result || 'N/A'
      },
      imbSBoard: {
        status: getArrayItem(formData.inspectionSections?.electronics, 5).status || 
                 getArrayItem(formData.inspectionSections?.electronics, 2).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.electronics, 5).result || 
                     getArrayItem(formData.inspectionSections?.electronics, 2).result || 'N/A'
      }
    },
    
    // Serial Number Verification
    serialNumberVerified: {
      chassisLabel: {
        status: formData.inspectionSections?.serialNumberVerified?.status || 'N/A',
        replacement: formData.inspectionSections?.serialNumberVerified?.result || 'N/A'
      }
    },
    
    // Disposable Consumables
    disposableConsumables: {
      airIntake: {
        status: getArrayItem(formData.inspectionSections?.disposableConsumables, 0).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.disposableConsumables, 0).result || 'N/A'
      }
    },
    
    // Coolant
    coolant: {
      level: {
        status: formData.inspectionSections?.coolant?.status || 'N/A',
        replacement: formData.inspectionSections?.coolant?.result || 'N/A'
      }
    },
    
    // Mechanical Section - Transform array to object structure
    mechanical: {
      acBlowerVaneSwitch: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 0).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 0).result || 'N/A'
      },
      extractorVaneSwitch: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 1).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 1).result || 'N/A'
      },
      exhaustCFM: {
        value: getArrayItem(formData.inspectionSections?.mechanical, 2).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 2).result || 'N/A'
      },
      lightEngine4Fans: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 3).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 3).result || 'N/A'
      },
      cardCageFans: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 4).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 4).result || 'N/A'
      },
      radiatorFanPump: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 5).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 5).result || 'N/A'
      },
      connectorHosePump: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 6).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 6).result || 'N/A'
      }
    },
    
    // Lamp LOC Mechanism (from mechanical array index 8)
    lampLOCMechanism: {
      xMovement: {
        status: getArrayItem(formData.inspectionSections?.mechanical, 8).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.mechanical, 8).result || 'N/A'
      }
    },
    
    // Light Engine Test Pattern (overall status from first pattern)
    lightEngineTestPattern: {
      overall: {
        status: getArrayItem(formData.inspectionSections?.lightEngineTestPatterns, 0).status || 'N/A',
        replacement: getArrayItem(formData.inspectionSections?.lightEngineTestPatterns, 0).result || 'N/A'
      }
    },
    
    // Lamp Information
    lampInfo: {
      makeAndModel: formData.lampModel || 'N/A',
      currentRunningHours: formData.currentLampHours || formData.lampRunningHours || 'N/A'
    },
    
    // fL Measurements
    fLMeasurements: {
      value: formData.contentFunctionality?.lampPowerTestAfter || 'N/A'
    },
    
    // Content Player
    contentPlayerModel: formData.contentFunctionality?.serverContentPlaying || 'N/A',
    
    // Status Fields
    acStatus: formData.finalStatus?.acStatus || 'N/A',
    leStatusDuringPM: formData.finalStatus?.leStatusDuringPM || 'N/A',
    
    // Remarks
    remarks: formData.notes || formData.observations?.map(obs => obs.description).filter(Boolean).join('\n') || 'N/A',
    
    // CIE XYZ Color Accuracy - Transform array to object structure
    cieXYZColorAccuracy: {
      white: {
        fL: getArrayItem(formData.cieColorAccuracy, 0).fl || 'N/A',
        x: getArrayItem(formData.cieColorAccuracy, 0).x || 'N/A',
        y: getArrayItem(formData.cieColorAccuracy, 0).y || 'N/A'
      },
      red: {
        fL: getArrayItem(formData.cieColorAccuracy, 1).fl || 'N/A',
        x: getArrayItem(formData.cieColorAccuracy, 1).x || 'N/A',
        y: getArrayItem(formData.cieColorAccuracy, 1).y || 'N/A'
      },
      green: {
        fL: getArrayItem(formData.cieColorAccuracy, 2).fl || 'N/A',
        x: getArrayItem(formData.cieColorAccuracy, 2).x || 'N/A',
        y: getArrayItem(formData.cieColorAccuracy, 2).y || 'N/A'
      },
      blue: {
        fL: getArrayItem(formData.cieColorAccuracy, 3).fl || 'N/A',
        x: getArrayItem(formData.cieColorAccuracy, 3).x || 'N/A',
        y: getArrayItem(formData.cieColorAccuracy, 3).y || 'N/A'
      }
    },
    
    // Screen Information
    screenInformation: {
      scope: {
        height: formData.screenInfo?.scope?.height || 'N/A',
        width: formData.screenInfo?.scope?.width || 'N/A'
      },
      flat: {
        height: formData.screenInfo?.flat?.height || 'N/A',
        width: formData.screenInfo?.flat?.width || 'N/A'
      }
    },
    
    // Image Evaluation (fix typo: focusBoresight -> focusBoresite in template)
    imageEvaluation: {
      focusBoresite: formData.imageEvaluation?.focusBoresight || 'N/A',
      integratorPosition: formData.imageEvaluation?.integratorPosition || 'N/A',
      spotOnScreen: formData.imageEvaluation?.spotOnScreen || 'N/A',
      screenCropping: formData.imageEvaluation?.screenCropping || 'N/A',
      convergenceChecked: formData.imageEvaluation?.convergenceChecked || 'N/A',
      channelsChecked: formData.imageEvaluation?.channelsChecked || 'N/A',
      pixelDefects: formData.imageEvaluation?.pixelDefects || 'N/A',
      imageVibration: formData.imageEvaluation?.imageVibration || 'N/A',
      liteLOC: formData.imageEvaluation?.liteLOC || 'N/A'
    },
    
    // Engineer Information
    engineer: {
      name: formData.engineer?.name || 'N/A',
      phone: formData.engineer?.phone || 'N/A'
    },
    
    // Signatures
    clientSignature: formData.clientSignature || null,
    engineerSignature: formData.engineerSignature || null
  };

  console.log('✅ Transformation complete');
  console.log('📤 Output template data:', transformed);

  return transformed;
}

/**
 * Validate transformed data to ensure all required fields are present
 */
export function validateTransformedData(data: TemplateData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required basic fields
  if (data.cinemaName === 'N/A' || !data.cinemaName) {
    errors.push('Cinema name is required');
  }
  if (data.engineer.name === 'N/A' || !data.engineer.name) {
    errors.push('Engineer name is required');
  }
  if (!data.date) {
    errors.push('Report date is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}









