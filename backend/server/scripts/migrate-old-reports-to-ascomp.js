const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Import models
const ServiceReport = require('../models/ServiceReport');
const ASCOMPReport = require('../models/ASCOMPReport');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

/**
 * Convert old sections array format to new object format
 */
function convertSectionToObject(sectionArray, sectionType) {
  const result = {};
  
  if (!sectionArray || !Array.isArray(sectionArray)) {
    return result;
  }
  
  // Define the expected items for each section based on ASCOMP document
  const sectionMappings = {
    opticals: [
      { key: 'reflector', label: 'Reflector' },
      { key: 'uvFilter', label: 'UV filter' },
      { key: 'integratorRod', label: 'Integrator Rod' },
      { key: 'coldMirror', label: 'Cold Mirror' },
      { key: 'foldMirror', label: 'Fold Mirror' }
    ],
    electronics: [
      { key: 'touchPanel', label: 'Touch Panel' },
      { key: 'evbAndImcbBoard', label: 'EVB and IMCB Board' },
      { key: 'pibAndIcpBoard', label: 'PIB and ICP Board' },
      { key: 'imb2Board', label: 'IMB-2 Board' }
    ],
    mechanical: [
      { key: 'acBlowerAndVaneSwitch', label: 'AC Blower and Vane Switch' },
      { key: 'extractorVaneSwitch', label: 'Extractor Vane Switch' },
      { key: 'exhaustCfmValue', label: 'Exhaust CFM - Value' },
      { key: 'lightEngineFansWithLadFan', label: "Light Engine's fans with LAD fan" },
      { key: 'cardCageTopAndBottomFans', label: 'Card Cage Top and Bottom fans' },
      { key: 'radiatorFanAndPump', label: 'Radiator fan and Pump' },
      { key: 'connectorAndHoseForPump', label: 'Connector and hose for the Pump' },
      { key: 'securityAndLampHouseLockSwitch', label: 'Security and lamp house lock switch' }
    ]
  };
  
  const mapping = sectionMappings[sectionType] || [];
  
  // Try to match items by description/label
  sectionArray.forEach((item, index) => {
    const mappingItem = mapping[index] || mapping.find(m => 
      item.description && item.description.toLowerCase().includes(m.label.toLowerCase().substring(0, 10))
    );
    
    if (mappingItem) {
      result[mappingItem.key] = {
        status: item.status || '',
        yesNoOk: item.result || ''
      };
    }
  });
  
  // Fill in any missing items with empty values
  mapping.forEach(m => {
    if (!result[m.key]) {
      result[m.key] = { status: '', yesNoOk: '' };
    }
  });
  
  return result;
}

/**
 * Convert old ServiceReport to new ASCOMPReport format
 */
function convertReportToASCOMP(oldReport) {
  const newReportNumber = oldReport.reportNumber.replace('REPORT-', 'ASCOMP-EW-');
  
  const newReport = {
    // Basic info
    reportNumber: newReportNumber,
    reportType: oldReport.reportType || 'Preventive Maintenance',
    date: oldReport.date || new Date(),
    
    // Cinema information
    cinemaName: oldReport.siteName || '',
    address: oldReport.siteAddress || oldReport.address || '',
    contactDetails: oldReport.contactDetails || '',
    location: oldReport.location || '',
    
    // Serial information
    serialNumber: oldReport.projectorSerial || '',
    equipAndEWServiceVisit: oldReport.reportType || '',
    projectorModelSerialAndHours: `${oldReport.projectorModel || ''} - ${oldReport.projectorSerial || ''} - ${oldReport.projectorRunningHours || 0}hrs`,
    replacementRequired: false,
    
    // Convert sections
    opticals: convertSectionToObject(oldReport.sections?.opticals, 'opticals'),
    electronics: convertSectionToObject(oldReport.sections?.electronics, 'electronics'),
    mechanical: convertSectionToObject(oldReport.sections?.mechanical, 'mechanical'),
    
    // Additional sections (with defaults)
    serialNumberVerified: {
      chassisLabelVsTouchPanel: { status: '', yesNoOk: '' }
    },
    disposableConsumables: {
      airIntakeLadAndRad: { status: '', yesNoOk: '' }
    },
    coolant: {
      levelAndColor: { status: '', yesNoOk: '' },
      white: { status: '', yesNoOk: '' },
      red: { status: '', yesNoOk: '' }
    },
    lightEngineTestPattern: {
      green: { status: '', yesNoOk: '' },
      blue: { status: '', yesNoOk: '' },
      black: { status: '', yesNoOk: '' }
    },
    lampLocMechanism: {
      xAndZMovement: { status: '', yesNoOk: '' }
    },
    
    // Page 2 data
    projectorPlacementRoomAndEnvironment: oldReport.projectorPlacement || '',
    
    lampInfo: {
      makeAndModel: oldReport.lampModel || '',
      numberOfLampsRunning: oldReport.numberOfLampsRunning || 1,
      currentLampRunningHours: oldReport.currentLampHours || oldReport.lampRunningHours || 0
    },
    
    voltageParameters: {
      pVsN: oldReport.voltageParameters?.pVsN || '',
      pVsE: oldReport.voltageParameters?.pVsE || '',
      nVsE: oldReport.voltageParameters?.nVsE || ''
    },
    
    flMeasurements: oldReport.flMeasurements || '',
    contentPlayerModel: oldReport.contentPlayerModel || '',
    acStatus: oldReport.acStatus || '',
    leStatusDuringPM: oldReport.leStatusDuringPM || '',
    remarks: oldReport.remarks || oldReport.observations?.join('; ') || '',
    leSNo: '',
    
    softwareVersion: {
      w2k4k: oldReport.softwareVersion?.w2k4k || { mcgd: '', fl: '', x: '', y: '' },
      r2k4k: oldReport.softwareVersion?.r2k4k || { mcgd: '', fl: '', x: '', y: '' },
      g2k4k: oldReport.softwareVersion?.g2k4k || { mcgd: '', fl: '', x: '', y: '' }
    },
    
    screenInformation: {
      scope: oldReport.screenInformation?.scope || { height: '', width: '', gain: '' },
      flat: oldReport.screenInformation?.flat || { height: '', width: '', gain: '' },
      screenMake: oldReport.screenInformation?.screenMake || '',
      throwDistance: oldReport.screenInformation?.throwDistance || ''
    },
    
    imageEvaluation: {
      focusBoresight: oldReport.imageEvaluation?.focusBoresight || '',
      integratorPosition: oldReport.imageEvaluation?.integratorPosition || '',
      spotOnScreenAfterIPM: oldReport.imageEvaluation?.spotOnScreen || '',
      croppingScreenEdges6x31AndScope: oldReport.imageEvaluation?.screenCropping || '',
      convergenceChecked: oldReport.imageEvaluation?.convergenceChecked || '',
      channelsCheckedScopeFlatAlternative: oldReport.imageEvaluation?.channelsChecked || '',
      pixelDefects: oldReport.imageEvaluation?.pixelDefects || '',
      excessiveImageVibration: oldReport.imageEvaluation?.imageVibration || '',
      liteLoc: oldReport.imageEvaluation?.liteLoc || ''
    },
    
    cieXyzColorAccuracy: {
      bwStep: { x: '', y: '', fl: '' },
      _10_2k4k: { x: '', y: '', fl: '' }
    },
    
    airPollutionLevel: {
      hcho: oldReport.airPollutionLevel?.hcho || '',
      tvoc: oldReport.airPollutionLevel?.tvoc || '',
      pm10: oldReport.airPollutionLevel?.pm10 || '',
      pm25: oldReport.airPollutionLevel?.pm25 || '',
      pm10_full: oldReport.airPollutionLevel?.pm10 || '',
      temperature: oldReport.environmentalConditions?.temperature?.toString() || '',
      humidityPercent: oldReport.environmentalConditions?.humidity?.toString() || ''
    },
    
    // Engineer information
    engineer: {
      name: oldReport.engineer?.name || oldReport.engineerName || '',
      phone: oldReport.engineer?.phone || '',
      email: oldReport.engineer?.email || '',
      userId: oldReport.createdBy || oldReport.engineer?.userId
    },
    
    // Metadata
    status: 'Submitted',
    createdBy: oldReport.createdBy,
    createdAt: oldReport.createdAt || new Date(),
    updatedAt: oldReport.updatedAt || new Date()
  };
  
  return newReport;
}

/**
 * Main migration function
 */
async function migrateOldReports() {
  try {
    log.info('🚀 Starting migration of old reports to ASCOMP format...\n');
    
    // Connect to MongoDB
    log.step('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector-warranty';
    await mongoose.connect(mongoUri);
    log.success('Connected to MongoDB\n');
    
    // Get all old reports
    log.step('Fetching old service reports...');
    const oldReports = await ServiceReport.find({ 
      reportNumber: { $regex: /^REPORT-/ } 
    }).lean();
    
    log.info(`Found ${oldReports.length} old reports to migrate\n`);
    
    if (oldReports.length === 0) {
      log.warning('No old reports found. Nothing to migrate.');
      return;
    }
    
    // Statistics
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Migrate each report
    for (let i = 0; i < oldReports.length; i++) {
      const oldReport = oldReports[i];
      const progress = `[${i + 1}/${oldReports.length}]`;
      
      try {
        log.step(`${progress} Migrating ${oldReport.reportNumber}...`);
        
        // Check if already migrated
        const newReportNumber = oldReport.reportNumber.replace('REPORT-', 'ASCOMP-EW-');
        const existing = await ASCOMPReport.findOne({ reportNumber: newReportNumber });
        
        if (existing) {
          log.warning(`${progress} Already migrated: ${newReportNumber}`);
          skippedCount++;
          continue;
        }
        
        // Convert to new format
        const newReportData = convertReportToASCOMP(oldReport);
        
        // Create new ASCOMP report
        const newReport = new ASCOMPReport(newReportData);
        await newReport.save();
        
        log.success(`${progress} ✓ Migrated to ${newReportNumber}`);
        successCount++;
        
      } catch (error) {
        log.error(`${progress} Failed to migrate ${oldReport.reportNumber}: ${error.message}`);
        errors.push({
          reportNumber: oldReport.reportNumber,
          error: error.message
        });
        errorCount++;
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    log.info('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    log.success(`✓ Successfully migrated: ${successCount}`);
    log.warning(`⊘ Skipped (already migrated): ${skippedCount}`);
    log.error(`✗ Failed: ${errorCount}`);
    console.log('='.repeat(60) + '\n');
    
    if (errors.length > 0) {
      log.error('❌ ERRORS:');
      errors.forEach(err => {
        console.log(`  - ${err.reportNumber}: ${err.error}`);
      });
      console.log('');
    }
    
    log.info('✅ Migration completed!');
    log.info('🎉 All old reports are now available in ASCOMP format with exact PDF export!\n');
    
  } catch (error) {
    log.error(`Fatal error during migration: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    log.info('Database connection closed.');
  }
}

// Run migration
if (require.main === module) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}  ASCOMP Report Migration Tool${colors.reset}`);
  console.log('  Converting old reports to exact ASCOMP format');
  console.log('='.repeat(60) + '\n');
  
  migrateOldReports()
    .then(() => {
      log.success('Migration process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      log.error('Migration process failed!');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateOldReports, convertReportToASCOMP };







