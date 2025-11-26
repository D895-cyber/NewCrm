/**
 * Transform ServiceReport format to ASCOMPReport format for PDF generation
 * This ensures all reports use the same ASCOMP PDF format regardless of storage format
 */

interface ServiceReportData {
  reportNumber: string;
  siteName?: string;
  siteAddress?: string;
  cinemaName?: string;
  address?: string;
  location?: string;
  date: string;
  projectorSerial?: string;
  projectorModel?: string;
  projectorRunningHours?: string;
  brand?: string;
  reportType?: string;
  inspectionSections?: {
    opticals?: Array<{ description: string; status: string; result: string }>;
    electronics?: Array<{ description: string; status: string; result: string }>;
    mechanical?: Array<{ description: string; status: string; result: string }>;
    serialNumberVerified?: { description: string; status: string; result: string };
    disposableConsumables?: Array<{ description: string; status: string; result: string }>;
    coolant?: { description: string; status: string; result: string };
    lightEngineTestPatterns?: Array<{ color: string; status: string; result: string }>;
  };
  opticals?: any;
  electronics?: any;
  mechanical?: any;
  voltageParameters?: any;
  contentFunctionality?: any;
  lampModel?: string;
  lampRunningHours?: string;
  currentLampHours?: string;
  replacementRequired?: boolean;
  finalStatus?: any;
  notes?: string;
  observations?: Array<{ description: string }>;
  screenInfo?: any;
  imageEvaluation?: any;
  cieColorAccuracy?: any;
  airPollutionLevels?: any;
  engineer?: any;
  siteIncharge?: any;
  [key: string]: any;
}

interface ASCOMPReportData {
  reportNumber: string;
  cinemaName: string;
  address: string;
  contactDetails: string;
  location: string;
  serialNumber: string;
  equipAndEWServiceVisit: string;
  projectorModelSerialAndHours: string;
  replacementRequired: boolean;
  opticals: {
    reflector?: { status: string; yesNoOk?: string };
    uvFilter?: { status: string; yesNoOk?: string };
    integratorRod?: { status: string; yesNoOk?: string };
    coldMirror?: { status: string; yesNoOk?: string };
    foldMirror?: { status: string; yesNoOk?: string };
  };
  electronics: {
    touchPanel?: { status: string; yesNoOk?: string };
    evbAndImcbBoard?: { status: string; yesNoOk?: string };
    pibAndIcpBoard?: { status: string; yesNoOk?: string };
    imb2Board?: { status: string; yesNoOk?: string };
  };
  serialNumberVerified: {
    chassisLabelVsTouchPanel?: { status: string; yesNoOk?: string };
  };
  disposableConsumables: {
    airIntakeLadAndRad?: { status: string; yesNoOk?: string };
  };
  coolant: {
    levelAndColor?: { status: string; yesNoOk?: string };
    white?: { status: string; yesNoOk?: string };
    red?: { status: string; yesNoOk?: string };
  };
  lightEngineTestPattern: {
    green?: { status: string; yesNoOk?: string };
    blue?: { status: string; yesNoOk?: string };
    black?: { status: string; yesNoOk?: string };
  };
  mechanical: {
    acBlowerAndVaneSwitch?: { status: string; yesNoOk?: string };
    extractorVaneSwitch?: { status: string; yesNoOk?: string };
    exhaustCfmValue?: { status: string; yesNoOk?: string };
    lightEngineFansWithLadFan?: { status: string; yesNoOk?: string };
    cardCageTopAndBottomFans?: { status: string; yesNoOk?: string };
    radiatorFanAndPump?: { status: string; yesNoOk?: string };
    connectorAndHoseForPump?: { status: string; yesNoOk?: string };
    securityAndLampHouseLockSwitch?: { status: string; yesNoOk?: string };
  };
  lampLocMechanism: {
    xAndZMovement?: { status: string; yesNoOk?: string };
  };
  projectorPlacementRoomAndEnvironment: string;
  lampInfo: {
    makeAndModel: string;
    numberOfLampsRunning?: number;
    currentLampRunningHours: string;
  };
  voltageParameters: {
    pVsN: string;
    pVsE: string;
    nVsE: string;
  };
  flMeasurements: string;
  contentPlayerModel: string;
  acStatus: string;
  leStatusDuringPM: string;
  remarks: string;
  leSNo: string;
  softwareVersion: any;
  screenInformation: any;
  imageEvaluation: any;
  cieXyzColorAccuracy: any;
  airPollutionLevel: any;
  engineer: any;
  clientSignatureAndStamp?: any;
  engineerSignature?: any;
  [key: string]: any;
}

/**
 * Transform ServiceReport data to ASCOMPReport format for PDF generation
 */
export function transformToASCOMPReportFormat(report: ServiceReportData): ASCOMPReportData {
  // Helper to get array item safely
  const getArrayItem = (arr: any[] | undefined, index: number, defaultValue: any = {}) => {
    return arr && arr[index] ? arr[index] : defaultValue;
  };

  // Map opticals array to object format (PDF export expects nested objects)
  // Check if already in object format or array format
  let opticals: any;
  if (report.opticals && typeof report.opticals === 'object' && !Array.isArray(report.opticals)) {
    // Already in object format - use as is
    opticals = report.opticals;
  } else {
    // Convert from array format
    const opticalsArray: any[] = Array.isArray(report.opticals) 
      ? report.opticals 
      : (Array.isArray(report.inspectionSections?.opticals) ? report.inspectionSections.opticals : []);
    
    opticals = {
      reflector: {
        status: getArrayItem(opticalsArray, 0).status || '',
        yesNoOk: getArrayItem(opticalsArray, 0).result || ''
      },
      uvFilter: {
        status: getArrayItem(opticalsArray, 1).status || '',
        yesNoOk: getArrayItem(opticalsArray, 1).result || ''
      },
      integratorRod: {
        status: getArrayItem(opticalsArray, 2).status || '',
        yesNoOk: getArrayItem(opticalsArray, 2).result || ''
      },
      coldMirror: {
        status: getArrayItem(opticalsArray, 3).status || '',
        yesNoOk: getArrayItem(opticalsArray, 3).result || ''
      },
      foldMirror: {
        status: getArrayItem(opticalsArray, 4).status || '',
        yesNoOk: getArrayItem(opticalsArray, 4).result || ''
      }
    };
  }

  // Map electronics array to object format
  let electronics: any;
  if (report.electronics && typeof report.electronics === 'object' && !Array.isArray(report.electronics)) {
    electronics = report.electronics;
  } else {
    const electronicsArray: any[] = Array.isArray(report.electronics) 
      ? report.electronics 
      : (Array.isArray(report.inspectionSections?.electronics) ? report.inspectionSections.electronics : []);
    
    electronics = {
      touchPanel: {
        status: getArrayItem(electronicsArray, 0).status || '',
        yesNoOk: getArrayItem(electronicsArray, 0).result || ''
      },
      evbAndImcbBoard: {
        status: getArrayItem(electronicsArray, 1).status || getArrayItem(electronicsArray, 2).status || '',
        yesNoOk: getArrayItem(electronicsArray, 1).result || getArrayItem(electronicsArray, 2).result || ''
      },
      pibAndIcpBoard: {
        status: getArrayItem(electronicsArray, 3).status || getArrayItem(electronicsArray, 4).status || '',
        yesNoOk: getArrayItem(electronicsArray, 3).result || getArrayItem(electronicsArray, 4).result || ''
      },
      imb2Board: {
        status: getArrayItem(electronicsArray, 5).status || '',
        yesNoOk: getArrayItem(electronicsArray, 5).result || ''
      }
    };
  }

  // Map mechanical array to object format
  let mechanical: any;
  if (report.mechanical && typeof report.mechanical === 'object' && !Array.isArray(report.mechanical)) {
    mechanical = report.mechanical;
  } else {
    const mechanicalArray: any[] = Array.isArray(report.mechanical) 
      ? report.mechanical 
      : (Array.isArray(report.inspectionSections?.mechanical) ? report.inspectionSections.mechanical : []);
    
    mechanical = {
    acBlowerAndVaneSwitch: {
      status: getArrayItem(mechanicalArray, 0).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 0).result || ''
    },
    extractorVaneSwitch: {
      status: getArrayItem(mechanicalArray, 1).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 1).result || ''
    },
    exhaustCfmValue: {
      status: getArrayItem(mechanicalArray, 2).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 2).result || ''
    },
    lightEngineFansWithLadFan: {
      status: getArrayItem(mechanicalArray, 3).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 3).result || ''
    },
    cardCageTopAndBottomFans: {
      status: getArrayItem(mechanicalArray, 4).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 4).result || ''
    },
    radiatorFanAndPump: {
      status: getArrayItem(mechanicalArray, 5).status || '',
      yesNoOk: getArrayItem(mechanicalArray, 5).result || ''
    },
      connectorAndHoseForPump: {
        status: getArrayItem(mechanicalArray, 6).status || '',
        yesNoOk: getArrayItem(mechanicalArray, 6).result || ''
      },
      securityAndLampHouseLockSwitch: {
        status: getArrayItem(mechanicalArray, 7).status || '',
        yesNoOk: getArrayItem(mechanicalArray, 7).result || ''
      }
    };
  }

  // Lamp LOC Mechanism (from mechanical array index 8)
  let lampLocMechanism: any;
  if (report.lampLocMechanism && typeof report.lampLocMechanism === 'object') {
    lampLocMechanism = report.lampLocMechanism;
  } else {
    const mechanicalArray: any[] = Array.isArray(report.mechanical) 
      ? report.mechanical 
      : (Array.isArray(report.inspectionSections?.mechanical) ? report.inspectionSections.mechanical : []);
    
    lampLocMechanism = {
      xAndZMovement: {
        status: getArrayItem(mechanicalArray, 8).status || '',
        yesNoOk: getArrayItem(mechanicalArray, 8).result || ''
      }
    };
  }

  // Serial Number Verified
  let serialNumberVerified: any;
  if (report.serialNumberVerified && typeof report.serialNumberVerified === 'object' && !Array.isArray(report.serialNumberVerified)) {
    // Check if it's already in the expected format
    if (report.serialNumberVerified.chassisLabelVsTouchPanel) {
      serialNumberVerified = report.serialNumberVerified;
    } else {
      // Transform from flat object format
      const serialData = report.serialNumberVerified;
      serialNumberVerified = {
        chassisLabelVsTouchPanel: {
          status: serialData.status || serialData.chassisLabelVsTouchPanel?.status || '',
          yesNoOk: serialData.result || serialData.chassisLabelVsTouchPanel?.yesNoOk || ''
        }
      };
    }
  } else {
    const serialData = report.inspectionSections?.serialNumberVerified || {};
    serialNumberVerified = {
      chassisLabelVsTouchPanel: {
        status: (serialData as any)?.status || '',
        yesNoOk: (serialData as any)?.result || ''
      }
    };
  }

  // Disposable Consumables
  let disposableConsumables: any;
  if (report.disposableConsumables && typeof report.disposableConsumables === 'object' && !Array.isArray(report.disposableConsumables)) {
    // Already in object format
    if (report.disposableConsumables.airIntakeLadAndRad) {
      disposableConsumables = report.disposableConsumables;
    } else {
      disposableConsumables = {
        airIntakeLadAndRad: report.disposableConsumables
      };
    }
  } else {
    const consumablesArray: any[] = Array.isArray(report.disposableConsumables) 
      ? report.disposableConsumables 
      : (Array.isArray(report.inspectionSections?.disposableConsumables) ? report.inspectionSections.disposableConsumables : []);
    
    disposableConsumables = {
      airIntakeLadAndRad: {
        status: getArrayItem(consumablesArray, 0).status || '',
        yesNoOk: getArrayItem(consumablesArray, 0).result || ''
      }
    };
  }

  // Coolant
  let coolant: any;
  if (report.coolant && typeof report.coolant === 'object' && !Array.isArray(report.coolant)) {
    // Already in object format
    if (report.coolant.levelAndColor) {
      coolant = report.coolant;
    } else {
      coolant = {
        levelAndColor: {
          status: report.coolant.status || '',
          yesNoOk: report.coolant.result || ''
        },
        white: { status: '', yesNoOk: '' },
        red: { status: '', yesNoOk: '' }
      };
    }
  } else {
    const coolantData = report.inspectionSections?.coolant || {};
    coolant = {
      levelAndColor: {
        status: (coolantData as any)?.status || '',
        yesNoOk: (coolantData as any)?.result || ''
      },
      white: { status: '', yesNoOk: '' },
      red: { status: '', yesNoOk: '' }
    };
  }

  // Light Engine Test Patterns
  let lightEngineTestPattern: any;
  if (report.lightEngineTestPattern && typeof report.lightEngineTestPattern === 'object' && !Array.isArray(report.lightEngineTestPattern)) {
    // Already in object format
    lightEngineTestPattern = report.lightEngineTestPattern;
  } else {
    const testPatternsArray: any[] = Array.isArray(report.lightEngineTestPattern) 
      ? report.lightEngineTestPattern 
      : (Array.isArray(report.inspectionSections?.lightEngineTestPatterns) ? report.inspectionSections.lightEngineTestPatterns : []);
    
    lightEngineTestPattern = {
      green: {
        status: testPatternsArray.find((p: any) => p.color === 'Green' || p.color?.toLowerCase() === 'green')?.status || '',
        yesNoOk: testPatternsArray.find((p: any) => p.color === 'Green' || p.color?.toLowerCase() === 'green')?.result || ''
      },
      blue: {
        status: testPatternsArray.find((p: any) => p.color === 'Blue' || p.color?.toLowerCase() === 'blue')?.status || '',
        yesNoOk: testPatternsArray.find((p: any) => p.color === 'Blue' || p.color?.toLowerCase() === 'blue')?.result || ''
      },
      black: {
        status: testPatternsArray.find((p: any) => p.color === 'Black' || p.color?.toLowerCase() === 'black')?.status || '',
        yesNoOk: testPatternsArray.find((p: any) => p.color === 'Black' || p.color?.toLowerCase() === 'black')?.result || ''
      }
    };
  }

  // Build the transformed report
  const transformed: ASCOMPReportData = {
    reportNumber: report.reportNumber || '',
    cinemaName: report.cinemaName || report.siteName || '',
    address: report.address || report.siteAddress || '',
    contactDetails: report.contactDetails || report.siteIncharge?.contact || '',
    location: report.location || report.siteName || '',
    serialNumber: report.projectorSerial || report.serialNumber || '',
    equipAndEWServiceVisit: report.equipAndEWServiceVisit || report.reportType || 'First',
    projectorModelSerialAndHours: report.projectorModelSerialAndHours || 
      `${report.projectorModel || ''} - Serial: ${report.projectorSerial || ''} - Hours: ${report.projectorRunningHours || ''}`,
    replacementRequired: report.replacementRequired || false,
    opticals,
    electronics,
    serialNumberVerified,
    disposableConsumables,
    coolant,
    lightEngineTestPattern,
    mechanical,
    lampLocMechanism,
    projectorPlacementRoomAndEnvironment: report.projectorPlacementRoomAndEnvironment || 
      report.contentFunctionality?.projectorPlacementEnvironment || '',
    lampInfo: report.lampInfo || {
      makeAndModel: report.lampModel || '',
      currentLampRunningHours: report.currentLampHours || report.lampRunningHours || ''
    },
    voltageParameters: report.voltageParameters || {
      pVsN: '',
      pVsE: '',
      nVsE: ''
    },
    flMeasurements: report.flMeasurements || report.contentFunctionality?.lampPowerTestAfter || '',
    contentPlayerModel: report.contentPlayerModel || report.contentFunctionality?.serverContentPlaying || '',
    acStatus: report.acStatus || report.finalStatus?.acStatus || '',
    leStatusDuringPM: report.leStatusDuringPM || report.finalStatus?.leStatusDuringPM || '',
    remarks: report.remarks || report.notes || 
      (report.observations?.map((o: any) => o.description).filter(Boolean).join('\n') || ''),
    leSNo: report.leSNo || report.projectorSerial || '',
    softwareVersion: report.softwareVersion || {},
    screenInformation: report.screenInformation || report.screenInfo || {},
    imageEvaluation: report.imageEvaluation || {},
    cieXyzColorAccuracy: report.cieXyzColorAccuracy || report.cieColorAccuracy || [],
    airPollutionLevel: report.airPollutionLevel || report.airPollutionLevels || {},
    engineer: report.engineer || {},
    clientSignatureAndStamp: report.clientSignature || report.signatures?.customer || null,
    engineerSignature: report.engineerSignature || report.signatures?.engineer || null,
    date: report.date || ''
  };

  return transformed;
}

