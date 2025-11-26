/**
 * CSV to ASCOMP Report Data Mapper
 * Maps CSV row data to ASCOMPReport schema format
 */

/**
 * Maps a CSV row to ASCOMPReport format
 * @param {Object} row - CSV row object with headers as keys
 * @returns {Object} - ASCOMPReport data object
 */
function mapCSVRowToASCOMPReport(row) {
  // Helper function to create checklist item
  const createChecklistItem = (status, yesNoOk) => ({
    status: status || '',
    yesNoOk: yesNoOk || ''
  });

  // Parse date - handle multiple formats
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    
    // Try ISO format first
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    
    // Try DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      date = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(date.getTime())) return date;
    }
    
    return new Date();
  };

  const mappedData = {
    // Header Information
    reportNumber: row.reportNumber || '',
    reportType: row.reportType || 'EW - Preventive Maintenance Report',
    date: parseDate(row.date),
    
    // Cinema Details
    cinemaName: row.cinemaName || '',
    address: row.address || '',
    contactDetails: row.contactDetails || '',
    location: row.location || '',
    
    // Serial Information
    serialNumber: row.serialNumber || '',
    equipAndEWServiceVisit: row.equipAndEWServiceVisit || '',
    projectorModelSerialAndHours: row.projectorModelSerialAndHours || '',
    replacementRequired: row.replacementRequired === 'true' || row.replacementRequired === 'Yes' || row.replacementRequired === '1',
    
    // OPTICALS Section
    opticals: {
      reflector: createChecklistItem(row.opticals_reflector_status, row.opticals_reflector_yesNoOk),
      uvFilter: createChecklistItem(row.opticals_uvFilter_status, row.opticals_uvFilter_yesNoOk),
      integratorRod: createChecklistItem(row.opticals_integratorRod_status, row.opticals_integratorRod_yesNoOk),
      coldMirror: createChecklistItem(row.opticals_coldMirror_status, row.opticals_coldMirror_yesNoOk),
      foldMirror: createChecklistItem(row.opticals_foldMirror_status, row.opticals_foldMirror_yesNoOk)
    },
    
    // ELECTRONICS Section
    electronics: {
      touchPanel: createChecklistItem(row.electronics_touchPanel_status, row.electronics_touchPanel_yesNoOk),
      evbAndImcbBoard: createChecklistItem(row.electronics_evbAndImcbBoard_status, row.electronics_evbAndImcbBoard_yesNoOk),
      pibAndIcpBoard: createChecklistItem(row.electronics_pibAndIcpBoard_status, row.electronics_pibAndIcpBoard_yesNoOk),
      imb2Board: createChecklistItem(row.electronics_imb2Board_status, row.electronics_imb2Board_yesNoOk)
    },
    
    // Serial Number Verified
    serialNumberVerified: {
      chassisLabelVsTouchPanel: createChecklistItem(row.serialNumberVerified_chassisLabelVsTouchPanel_status, row.serialNumberVerified_chassisLabelVsTouchPanel_yesNoOk)
    },
    
    // Disposable Consumables
    disposableConsumables: {
      airIntakeLadAndRad: createChecklistItem(row.disposableConsumables_airIntakeLadAndRad_status, row.disposableConsumables_airIntakeLadAndRad_yesNoOk)
    },
    
    // Coolant Section
    coolant: {
      levelAndColor: createChecklistItem(row.coolant_levelAndColor_status, row.coolant_levelAndColor_yesNoOk),
      white: createChecklistItem(row.coolant_white_status, row.coolant_white_yesNoOk),
      red: createChecklistItem(row.coolant_red_status, row.coolant_red_yesNoOk)
    },
    
    // Light Engine Test Pattern
    lightEngineTestPattern: {
      green: createChecklistItem(row.lightEngineTestPattern_green_status, row.lightEngineTestPattern_green_yesNoOk),
      blue: createChecklistItem(row.lightEngineTestPattern_blue_status, row.lightEngineTestPattern_blue_yesNoOk),
      black: createChecklistItem(row.lightEngineTestPattern_black_status, row.lightEngineTestPattern_black_yesNoOk)
    },
    
    // MECHANICAL Section
    mechanical: {
      acBlowerAndVaneSwitch: createChecklistItem(row.mechanical_acBlowerAndVaneSwitch_status, row.mechanical_acBlowerAndVaneSwitch_yesNoOk),
      extractorVaneSwitch: createChecklistItem(row.mechanical_extractorVaneSwitch_status, row.mechanical_extractorVaneSwitch_yesNoOk),
      exhaustCfmValue: createChecklistItem(row.mechanical_exhaustCfmValue_status, row.mechanical_exhaustCfmValue_yesNoOk),
      lightEngineFansWithLadFan: createChecklistItem(row.mechanical_lightEngineFansWithLadFan_status, row.mechanical_lightEngineFansWithLadFan_yesNoOk),
      cardCageTopAndBottomFans: createChecklistItem(row.mechanical_cardCageTopAndBottomFans_status, row.mechanical_cardCageTopAndBottomFans_yesNoOk),
      radiatorFanAndPump: createChecklistItem(row.mechanical_radiatorFanAndPump_status, row.mechanical_radiatorFanAndPump_yesNoOk),
      connectorAndHoseForPump: createChecklistItem(row.mechanical_connectorAndHoseForPump_status, row.mechanical_connectorAndHoseForPump_yesNoOk),
      securityAndLampHouseLockSwitch: createChecklistItem(row.mechanical_securityAndLampHouseLockSwitch_status, row.mechanical_securityAndLampHouseLockSwitch_yesNoOk)
    },
    
    // Lamp LOC Mechanism
    lampLocMechanism: {
      xAndZMovement: createChecklistItem(row.lampLocMechanism_xAndZMovement_status, row.lampLocMechanism_xAndZMovement_yesNoOk)
    },
    
    // PAGE 2: DETAILED INFORMATION
    
    // Projector Placement
    projectorPlacementRoomAndEnvironment: row.projectorPlacementRoomAndEnvironment || '',
    
    // Lamp Information
    lampInfo: {
      makeAndModel: row.lampInfo_makeAndModel || '',
      numberOfLampsRunning: parseInt(row.lampInfo_numberOfLampsRunning) || 0,
      currentLampRunningHours: parseInt(row.lampInfo_currentLampRunningHours) || 0
    },
    
    // Voltage Parameters
    voltageParameters: {
      pVsN: row.voltageParameters_pVsN || '',
      pVsE: row.voltageParameters_pVsE || '',
      nVsE: row.voltageParameters_nVsE || ''
    },
    
    // fL measurements
    flMeasurements: row.flMeasurements || '',
    
    // Content Player Model
    contentPlayerModel: row.contentPlayerModel || '',
    
    // AC Status
    acStatus: row.acStatus || '',
    
    // LE Status during PM
    leStatusDuringPM: row.leStatusDuringPM || '',
    
    // Remarks and LE S. No.
    remarks: row.remarks || '',
    leSNo: row.leSNo || '',
    
    // Software Version Table
    softwareVersion: {
      w2k4k: {
        mcgd: row.softwareVersion_w2k4k_mcgd || '',
        fl: row.softwareVersion_w2k4k_fl || '',
        x: row.softwareVersion_w2k4k_x || '',
        y: row.softwareVersion_w2k4k_y || ''
      },
      r2k4k: {
        mcgd: row.softwareVersion_r2k4k_mcgd || '',
        fl: row.softwareVersion_r2k4k_fl || '',
        x: row.softwareVersion_r2k4k_x || '',
        y: row.softwareVersion_r2k4k_y || ''
      },
      g2k4k: {
        mcgd: row.softwareVersion_g2k4k_mcgd || '',
        fl: row.softwareVersion_g2k4k_fl || '',
        x: row.softwareVersion_g2k4k_x || '',
        y: row.softwareVersion_g2k4k_y || ''
      }
    },
    
    // Screen Information in metres
    screenInformation: {
      scope: {
        height: row.screenInformation_scope_height || '',
        width: row.screenInformation_scope_width || '',
        gain: row.screenInformation_scope_gain || ''
      },
      flat: {
        height: row.screenInformation_flat_height || '',
        width: row.screenInformation_flat_width || '',
        gain: row.screenInformation_flat_gain || ''
      },
      screenMake: row.screenInformation_screenMake || '',
      throwDistance: row.screenInformation_throwDistance || ''
    },
    
    // Image Evaluation (OK - Yes/No column)
    imageEvaluation: {
      focusBoresight: row.imageEvaluation_focusBoresight || '',
      integratorPosition: row.imageEvaluation_integratorPosition || '',
      spotOnScreenAfterIPM: row.imageEvaluation_spotOnScreenAfterIPM || '',
      croppingScreenEdges6x31AndScope: row.imageEvaluation_croppingScreenEdges6x31AndScope || '',
      convergenceChecked: row.imageEvaluation_convergenceChecked || '',
      channelsCheckedScopeFlatAlternative: row.imageEvaluation_channelsCheckedScopeFlatAlternative || '',
      pixelDefects: row.imageEvaluation_pixelDefects || '',
      excessiveImageVibration: row.imageEvaluation_excessiveImageVibration || '',
      liteLoc: row.imageEvaluation_liteLoc || ''
    },
    
    // CIE XYZ Color Accuracy Test Pattern
    cieXyzColorAccuracy: {
      bwStep: {
        x: row.cieXyzColorAccuracy_bwStep_x || '',
        y: row.cieXyzColorAccuracy_bwStep_y || '',
        fl: row.cieXyzColorAccuracy_bwStep_fl || ''
      },
      _10_2k4k: {
        x: row.cieXyzColorAccuracy_10_2k4k_x || '',
        y: row.cieXyzColorAccuracy_10_2k4k_y || '',
        fl: row.cieXyzColorAccuracy_10_2k4k_fl || ''
      }
    },
    
    // Air Pollution Level
    airPollutionLevel: {
      hcho: row.airPollutionLevel_hcho || '',
      tvoc: row.airPollutionLevel_tvoc || '',
      pm10: row.airPollutionLevel_pm10 || '',
      pm25: row.airPollutionLevel_pm25 || '',
      pm10_full: row.airPollutionLevel_pm10_full || '',
      temperature: row.airPollutionLevel_temperature || '',
      humidityPercent: row.airPollutionLevel_humidityPercent || ''
    },
    
    // Engineer/FSE Information
    engineer: {
      name: row.engineer_name || '',
      phone: row.engineer_phone || '',
      email: row.engineer_email || ''
    },
    
    // Status
    status: row.status || 'Submitted'
  };

  return mappedData;
}

/**
 * Validates required fields in CSV row
 * @param {Object} row - CSV row object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateCSVRow(row, rowIndex) {
  const errors = [];
  
  if (!row.cinemaName || row.cinemaName.trim() === '') {
    errors.push(`Row ${rowIndex}: Cinema Name is required`);
  }
  
  if (!row.engineer_name || row.engineer_name.trim() === '') {
    errors.push(`Row ${rowIndex}: Engineer Name is required`);
  }
  
  if (!row.date || row.date.trim() === '') {
    errors.push(`Row ${rowIndex}: Date is required`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate CSV template headers
 * @returns {string} - CSV header row
 */
function generateCSVTemplate() {
  const headers = [
    // Required fields
    'reportNumber',
    'reportType',
    'date',
    'cinemaName',
    'address',
    'contactDetails',
    'location',
    
    // Serial info
    'serialNumber',
    'equipAndEWServiceVisit',
    'projectorModelSerialAndHours',
    'replacementRequired',
    
    // Drive link for PDF
    'driveLink',
    
    // Engineer info
    'engineer_name',
    'engineer_phone',
    'engineer_email',
    
    // OPTICALS (5 items x 2 columns = 10)
    'opticals_reflector_status',
    'opticals_reflector_yesNoOk',
    'opticals_uvFilter_status',
    'opticals_uvFilter_yesNoOk',
    'opticals_integratorRod_status',
    'opticals_integratorRod_yesNoOk',
    'opticals_coldMirror_status',
    'opticals_coldMirror_yesNoOk',
    'opticals_foldMirror_status',
    'opticals_foldMirror_yesNoOk',
    
    // ELECTRONICS (4 items x 2 columns = 8)
    'electronics_touchPanel_status',
    'electronics_touchPanel_yesNoOk',
    'electronics_evbAndImcbBoard_status',
    'electronics_evbAndImcbBoard_yesNoOk',
    'electronics_pibAndIcpBoard_status',
    'electronics_pibAndIcpBoard_yesNoOk',
    'electronics_imb2Board_status',
    'electronics_imb2Board_yesNoOk',
    
    // Serial Number Verified (1 item x 2 columns = 2)
    'serialNumberVerified_chassisLabelVsTouchPanel_status',
    'serialNumberVerified_chassisLabelVsTouchPanel_yesNoOk',
    
    // Disposable Consumables (1 item x 2 columns = 2)
    'disposableConsumables_airIntakeLadAndRad_status',
    'disposableConsumables_airIntakeLadAndRad_yesNoOk',
    
    // Coolant (3 items x 2 columns = 6)
    'coolant_levelAndColor_status',
    'coolant_levelAndColor_yesNoOk',
    'coolant_white_status',
    'coolant_white_yesNoOk',
    'coolant_red_status',
    'coolant_red_yesNoOk',
    
    // Light Engine Test Pattern (3 items x 2 columns = 6)
    'lightEngineTestPattern_green_status',
    'lightEngineTestPattern_green_yesNoOk',
    'lightEngineTestPattern_blue_status',
    'lightEngineTestPattern_blue_yesNoOk',
    'lightEngineTestPattern_black_status',
    'lightEngineTestPattern_black_yesNoOk',
    
    // MECHANICAL (8 items x 2 columns = 16)
    'mechanical_acBlowerAndVaneSwitch_status',
    'mechanical_acBlowerAndVaneSwitch_yesNoOk',
    'mechanical_extractorVaneSwitch_status',
    'mechanical_extractorVaneSwitch_yesNoOk',
    'mechanical_exhaustCfmValue_status',
    'mechanical_exhaustCfmValue_yesNoOk',
    'mechanical_lightEngineFansWithLadFan_status',
    'mechanical_lightEngineFansWithLadFan_yesNoOk',
    'mechanical_cardCageTopAndBottomFans_status',
    'mechanical_cardCageTopAndBottomFans_yesNoOk',
    'mechanical_radiatorFanAndPump_status',
    'mechanical_radiatorFanAndPump_yesNoOk',
    'mechanical_connectorAndHoseForPump_status',
    'mechanical_connectorAndHoseForPump_yesNoOk',
    'mechanical_securityAndLampHouseLockSwitch_status',
    'mechanical_securityAndLampHouseLockSwitch_yesNoOk',
    
    // Lamp LOC Mechanism (1 item x 2 columns = 2)
    'lampLocMechanism_xAndZMovement_status',
    'lampLocMechanism_xAndZMovement_yesNoOk',
    
    // PAGE 2 fields
    'projectorPlacementRoomAndEnvironment',
    'lampInfo_makeAndModel',
    'lampInfo_numberOfLampsRunning',
    'lampInfo_currentLampRunningHours',
    'voltageParameters_pVsN',
    'voltageParameters_pVsE',
    'voltageParameters_nVsE',
    'flMeasurements',
    'contentPlayerModel',
    'acStatus',
    'leStatusDuringPM',
    'remarks',
    'leSNo',
    
    // Software Version (3 x 4 = 12)
    'softwareVersion_w2k4k_mcgd',
    'softwareVersion_w2k4k_fl',
    'softwareVersion_w2k4k_x',
    'softwareVersion_w2k4k_y',
    'softwareVersion_r2k4k_mcgd',
    'softwareVersion_r2k4k_fl',
    'softwareVersion_r2k4k_x',
    'softwareVersion_r2k4k_y',
    'softwareVersion_g2k4k_mcgd',
    'softwareVersion_g2k4k_fl',
    'softwareVersion_g2k4k_x',
    'softwareVersion_g2k4k_y',
    
    // Screen Information (7 fields)
    'screenInformation_scope_height',
    'screenInformation_scope_width',
    'screenInformation_scope_gain',
    'screenInformation_flat_height',
    'screenInformation_flat_width',
    'screenInformation_flat_gain',
    'screenInformation_screenMake',
    'screenInformation_throwDistance',
    
    // Image Evaluation (9 fields)
    'imageEvaluation_focusBoresight',
    'imageEvaluation_integratorPosition',
    'imageEvaluation_spotOnScreenAfterIPM',
    'imageEvaluation_croppingScreenEdges6x31AndScope',
    'imageEvaluation_convergenceChecked',
    'imageEvaluation_channelsCheckedScopeFlatAlternative',
    'imageEvaluation_pixelDefects',
    'imageEvaluation_excessiveImageVibration',
    'imageEvaluation_liteLoc',
    
    // CIE XYZ Color Accuracy (6 fields)
    'cieXyzColorAccuracy_bwStep_x',
    'cieXyzColorAccuracy_bwStep_y',
    'cieXyzColorAccuracy_bwStep_fl',
    'cieXyzColorAccuracy_10_2k4k_x',
    'cieXyzColorAccuracy_10_2k4k_y',
    'cieXyzColorAccuracy_10_2k4k_fl',
    
    // Air Pollution Level (7 fields)
    'airPollutionLevel_hcho',
    'airPollutionLevel_tvoc',
    'airPollutionLevel_pm10',
    'airPollutionLevel_pm25',
    'airPollutionLevel_pm10_full',
    'airPollutionLevel_temperature',
    'airPollutionLevel_humidityPercent',
    
    'status'
  ];
  
  return headers.join(',');
}

module.exports = {
  mapCSVRowToASCOMPReport,
  validateCSVRow,
  generateCSVTemplate
};









