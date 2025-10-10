/**
 * Script to automatically add all ASCOMP checklist field mappings
 * This adds mappings for all OK/Not OK dropdown fields in the report template
 * 
 * Usage: node backend/server/scripts/add-ascomp-checklist-mappings.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

// Define ReportTemplate schema inline
const fieldMappingSchema = new mongoose.Schema({
  token: { type: String, required: true },
  dataPath: { type: String, required: true },
  defaultValue: { type: String, default: '' },
  description: { type: String }
});

const reportTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: String,
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: Number,
  version: { type: String, default: '1.0' },
  isDefault: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fieldMappings: [fieldMappingSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ReportTemplate = mongoose.model('ReportTemplate', reportTemplateSchema);

// Define all checklist field mappings
const checklistMappings = [
  // ========== OPTICALS SECTION (5 items) ==========
  {
    token: 'OPT_REFLECTOR_STATUS',
    dataPath: 'opticals.reflector.status',
    defaultValue: '-',
    description: 'Reflector - Status (Cleaned/Replaced/etc.)'
  },
  {
    token: 'OPT_REFLECTOR_OK',
    dataPath: 'opticals.reflector.yesNoOk',
    defaultValue: 'OK',
    description: 'Reflector - Yes/No/OK result'
  },
  {
    token: 'OPT_UVFILTER_STATUS',
    dataPath: 'opticals.uvFilter.status',
    defaultValue: '-',
    description: 'UV Filter - Status'
  },
  {
    token: 'OPT_UVFILTER_OK',
    dataPath: 'opticals.uvFilter.yesNoOk',
    defaultValue: 'OK',
    description: 'UV Filter - Yes/No/OK result'
  },
  {
    token: 'OPT_INTROD_STATUS',
    dataPath: 'opticals.integratorRod.status',
    defaultValue: '-',
    description: 'Integrator Rod - Status'
  },
  {
    token: 'OPT_INTROD_OK',
    dataPath: 'opticals.integratorRod.yesNoOk',
    defaultValue: 'OK',
    description: 'Integrator Rod - Yes/No/OK result'
  },
  {
    token: 'OPT_COLDMIRROR_STATUS',
    dataPath: 'opticals.coldMirror.status',
    defaultValue: '-',
    description: 'Cold Mirror - Status'
  },
  {
    token: 'OPT_COLDMIRROR_OK',
    dataPath: 'opticals.coldMirror.yesNoOk',
    defaultValue: 'OK',
    description: 'Cold Mirror - Yes/No/OK result'
  },
  {
    token: 'OPT_FOLDMIRROR_STATUS',
    dataPath: 'opticals.foldMirror.status',
    defaultValue: '-',
    description: 'Fold Mirror - Status'
  },
  {
    token: 'OPT_FOLDMIRROR_OK',
    dataPath: 'opticals.foldMirror.yesNoOk',
    defaultValue: 'OK',
    description: 'Fold Mirror - Yes/No/OK result'
  },

  // ========== ELECTRONICS SECTION (4 items) ==========
  {
    token: 'ELEC_TOUCHPANEL_STATUS',
    dataPath: 'electronics.touchPanel.status',
    defaultValue: '-',
    description: 'Touch Panel - Status'
  },
  {
    token: 'ELEC_TOUCHPANEL_OK',
    dataPath: 'electronics.touchPanel.yesNoOk',
    defaultValue: 'OK',
    description: 'Touch Panel - Yes/No/OK result'
  },
  {
    token: 'ELEC_EVBIMCB_STATUS',
    dataPath: 'electronics.evbAndImcbBoard.status',
    defaultValue: '-',
    description: 'EVB and IMCB Board - Status'
  },
  {
    token: 'ELEC_EVBIMCB_OK',
    dataPath: 'electronics.evbAndImcbBoard.yesNoOk',
    defaultValue: 'OK',
    description: 'EVB and IMCB Board - Yes/No/OK result'
  },
  {
    token: 'ELEC_PIBICP_STATUS',
    dataPath: 'electronics.pibAndIcpBoard.status',
    defaultValue: '-',
    description: 'PIB and ICP Board - Status'
  },
  {
    token: 'ELEC_PIBICP_OK',
    dataPath: 'electronics.pibAndIcpBoard.yesNoOk',
    defaultValue: 'OK',
    description: 'PIB and ICP Board - Yes/No/OK result'
  },
  {
    token: 'ELEC_IMB2_STATUS',
    dataPath: 'electronics.imb2Board.status',
    defaultValue: '-',
    description: 'IMB-2 Board - Status'
  },
  {
    token: 'ELEC_IMB2_OK',
    dataPath: 'electronics.imb2Board.yesNoOk',
    defaultValue: 'OK',
    description: 'IMB-2 Board - Yes/No/OK result'
  },

  // ========== MECHANICAL SECTION (8 items) ==========
  {
    token: 'MECH_ACBLOWER_STATUS',
    dataPath: 'mechanical.acBlowerAndVaneSwitch.status',
    defaultValue: '-',
    description: 'AC Blower and Vane Switch - Status'
  },
  {
    token: 'MECH_ACBLOWER_OK',
    dataPath: 'mechanical.acBlowerAndVaneSwitch.yesNoOk',
    defaultValue: 'OK',
    description: 'AC Blower and Vane Switch - Yes/No/OK result'
  },
  {
    token: 'MECH_EXTRACTOR_STATUS',
    dataPath: 'mechanical.extractorVaneSwitch.status',
    defaultValue: '-',
    description: 'Extractor Vane Switch - Status'
  },
  {
    token: 'MECH_EXTRACTOR_OK',
    dataPath: 'mechanical.extractorVaneSwitch.yesNoOk',
    defaultValue: 'OK',
    description: 'Extractor Vane Switch - Yes/No/OK result'
  },
  {
    token: 'MECH_EXHAUSTCFM_STATUS',
    dataPath: 'mechanical.exhaustCfmValue.status',
    defaultValue: '-',
    description: 'Exhaust CFM Value - Status'
  },
  {
    token: 'MECH_EXHAUSTCFM_OK',
    dataPath: 'mechanical.exhaustCfmValue.yesNoOk',
    defaultValue: 'OK',
    description: 'Exhaust CFM Value - Yes/No/OK result'
  },
  {
    token: 'MECH_LEFANS_STATUS',
    dataPath: 'mechanical.lightEngineFansWithLadFan.status',
    defaultValue: '-',
    description: 'Light Engine Fans with LAD Fan - Status'
  },
  {
    token: 'MECH_LEFANS_OK',
    dataPath: 'mechanical.lightEngineFansWithLadFan.yesNoOk',
    defaultValue: 'OK',
    description: 'Light Engine Fans with LAD Fan - Yes/No/OK result'
  },
  {
    token: 'MECH_CARDCAGE_STATUS',
    dataPath: 'mechanical.cardCageTopAndBottomFans.status',
    defaultValue: '-',
    description: 'Card Cage Top and Bottom Fans - Status'
  },
  {
    token: 'MECH_CARDCAGE_OK',
    dataPath: 'mechanical.cardCageTopAndBottomFans.yesNoOk',
    defaultValue: 'OK',
    description: 'Card Cage Top and Bottom Fans - Yes/No/OK result'
  },
  {
    token: 'MECH_RADIATOR_STATUS',
    dataPath: 'mechanical.radiatorFanAndPump.status',
    defaultValue: '-',
    description: 'Radiator Fan and Pump - Status'
  },
  {
    token: 'MECH_RADIATOR_OK',
    dataPath: 'mechanical.radiatorFanAndPump.yesNoOk',
    defaultValue: 'OK',
    description: 'Radiator Fan and Pump - Yes/No/OK result'
  },
  {
    token: 'MECH_CONNECTOR_STATUS',
    dataPath: 'mechanical.connectorAndHoseForPump.status',
    defaultValue: '-',
    description: 'Connector and Hose for Pump - Status'
  },
  {
    token: 'MECH_CONNECTOR_OK',
    dataPath: 'mechanical.connectorAndHoseForPump.yesNoOk',
    defaultValue: 'OK',
    description: 'Connector and Hose for Pump - Yes/No/OK result'
  },
  {
    token: 'MECH_SECURITY_STATUS',
    dataPath: 'mechanical.securityAndLampHouseLockSwitch.status',
    defaultValue: '-',
    description: 'Security and Lamp House Lock Switch - Status'
  },
  {
    token: 'MECH_SECURITY_OK',
    dataPath: 'mechanical.securityAndLampHouseLockSwitch.yesNoOk',
    defaultValue: 'OK',
    description: 'Security and Lamp House Lock Switch - Yes/No/OK result'
  },

  // ========== SERIAL NUMBER VERIFIED ==========
  {
    token: 'SERIAL_VERIFIED_STATUS',
    dataPath: 'serialNumberVerified.chassisLabelVsTouchPanel.status',
    defaultValue: '-',
    description: 'Serial Number Verified (Chassis vs Touch Panel) - Status'
  },
  {
    token: 'SERIAL_VERIFIED_OK',
    dataPath: 'serialNumberVerified.chassisLabelVsTouchPanel.yesNoOk',
    defaultValue: 'OK',
    description: 'Serial Number Verified - Yes/No/OK result'
  },

  // ========== DISPOSABLE CONSUMABLES ==========
  {
    token: 'DISPOSABLE_STATUS',
    dataPath: 'disposableConsumables.airIntakeLadAndRad.status',
    defaultValue: '-',
    description: 'Disposable Consumables (Air Intake LAD & RAD) - Status'
  },
  {
    token: 'DISPOSABLE_OK',
    dataPath: 'disposableConsumables.airIntakeLadAndRad.yesNoOk',
    defaultValue: 'OK',
    description: 'Disposable Consumables - Yes/No/OK result'
  },

  // ========== COOLANT (3 items) ==========
  {
    token: 'COOLANT_LEVEL_STATUS',
    dataPath: 'coolant.levelAndColor.status',
    defaultValue: '-',
    description: 'Coolant Level and Color - Status'
  },
  {
    token: 'COOLANT_LEVEL_OK',
    dataPath: 'coolant.levelAndColor.yesNoOk',
    defaultValue: 'OK',
    description: 'Coolant Level and Color - Yes/No/OK result'
  },
  {
    token: 'COOLANT_WHITE_STATUS',
    dataPath: 'coolant.white.status',
    defaultValue: '-',
    description: 'Coolant White - Status'
  },
  {
    token: 'COOLANT_WHITE_OK',
    dataPath: 'coolant.white.yesNoOk',
    defaultValue: 'OK',
    description: 'Coolant White - Yes/No/OK result'
  },
  {
    token: 'COOLANT_RED_STATUS',
    dataPath: 'coolant.red.status',
    defaultValue: '-',
    description: 'Coolant Red - Status'
  },
  {
    token: 'COOLANT_RED_OK',
    dataPath: 'coolant.red.yesNoOk',
    defaultValue: 'OK',
    description: 'Coolant Red - Yes/No/OK result'
  },

  // ========== LIGHT ENGINE TEST PATTERN (3 items) ==========
  {
    token: 'LE_GREEN_STATUS',
    dataPath: 'lightEngineTestPattern.green.status',
    defaultValue: '-',
    description: 'Light Engine Test Pattern Green - Status'
  },
  {
    token: 'LE_GREEN_OK',
    dataPath: 'lightEngineTestPattern.green.yesNoOk',
    defaultValue: 'OK',
    description: 'Light Engine Green - Yes/No/OK result'
  },
  {
    token: 'LE_BLUE_STATUS',
    dataPath: 'lightEngineTestPattern.blue.status',
    defaultValue: '-',
    description: 'Light Engine Test Pattern Blue - Status'
  },
  {
    token: 'LE_BLUE_OK',
    dataPath: 'lightEngineTestPattern.blue.yesNoOk',
    defaultValue: 'OK',
    description: 'Light Engine Blue - Yes/No/OK result'
  },
  {
    token: 'LE_BLACK_STATUS',
    dataPath: 'lightEngineTestPattern.black.status',
    defaultValue: '-',
    description: 'Light Engine Test Pattern Black - Status'
  },
  {
    token: 'LE_BLACK_OK',
    dataPath: 'lightEngineTestPattern.black.yesNoOk',
    defaultValue: 'OK',
    description: 'Light Engine Black - Yes/No/OK result'
  },

  // ========== LAMP LOC MECHANISM ==========
  {
    token: 'LAMP_LOC_STATUS',
    dataPath: 'lampLocMechanism.xAndZMovement.status',
    defaultValue: '-',
    description: 'Lamp LOC Mechanism (X & Z Movement) - Status'
  },
  {
    token: 'LAMP_LOC_OK',
    dataPath: 'lampLocMechanism.xAndZMovement.yesNoOk',
    defaultValue: 'OK',
    description: 'Lamp LOC Mechanism - Yes/No/OK result'
  }
];

async function addChecklistMappings() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the ASCOMP template
    // You can modify this to find by name or use a specific ID
    const template = await ReportTemplate.findOne({ 
      $or: [
        { name: /ASCOMP/i },
        { type: 'ASCOMP_EW' }
      ]
    }).sort({ createdAt: -1 });

    if (!template) {
      console.error('❌ No ASCOMP template found!');
      console.log('   Please upload a template first via the Report Templates page.');
      process.exit(1);
    }

    console.log('📄 Found template:', {
      name: template.name,
      type: template.type,
      fileName: template.fileName,
      existingMappings: template.fieldMappings?.length || 0
    });
    console.log();

    // Get existing mapping tokens to avoid duplicates
    const existingTokens = new Set(
      (template.fieldMappings || []).map(m => m.token)
    );

    // Filter out mappings that already exist
    const newMappings = checklistMappings.filter(m => !existingTokens.has(m.token));

    if (newMappings.length === 0) {
      console.log('✅ All checklist mappings already exist!');
      console.log(`   Total mappings: ${template.fieldMappings.length}`);
      process.exit(0);
    }

    console.log(`📝 Adding ${newMappings.length} new checklist field mappings...\n`);

    // Group by section for better logging
    const sections = {
      'OPTICALS': newMappings.filter(m => m.token.startsWith('OPT_')),
      'ELECTRONICS': newMappings.filter(m => m.token.startsWith('ELEC_')),
      'MECHANICAL': newMappings.filter(m => m.token.startsWith('MECH_')),
      'SERIAL VERIFIED': newMappings.filter(m => m.token.startsWith('SERIAL_')),
      'DISPOSABLE': newMappings.filter(m => m.token.startsWith('DISPOSABLE_')),
      'COOLANT': newMappings.filter(m => m.token.startsWith('COOLANT_')),
      'LIGHT ENGINE': newMappings.filter(m => m.token.startsWith('LE_')),
      'LAMP LOC': newMappings.filter(m => m.token.startsWith('LAMP_'))
    };

    // Log what will be added
    for (const [section, mappings] of Object.entries(sections)) {
      if (mappings.length > 0) {
        console.log(`   ${section}: ${mappings.length} mappings`);
      }
    }
    console.log();

    // Add the new mappings
    template.fieldMappings = template.fieldMappings || [];
    template.fieldMappings.push(...newMappings);
    template.updatedAt = new Date();

    // Set default values for required fields if missing
    if (!template.fileName) template.fileName = `${template.name}.docx`;
    if (!template.filePath) template.filePath = `./templates/${template.name}.docx`;
    if (!template.type) template.type = 'ASCOMP_EW';

    await template.save();

    console.log('✅ Successfully added all checklist field mappings!\n');
    console.log('📊 Summary:');
    console.log(`   Total mappings now: ${template.fieldMappings.length}`);
    console.log(`   New mappings added: ${newMappings.length}`);
    console.log();
    console.log('📄 Detailed breakdown:');
    
    // Show detailed breakdown
    for (const [section, mappings] of Object.entries(sections)) {
      if (mappings.length > 0) {
        console.log(`\n   ${section} (${mappings.length} mappings):`);
        mappings.forEach(m => {
          console.log(`      ✓ ${m.token} → ${m.dataPath}`);
        });
      }
    }

    console.log('\n✨ All done! You can now use these tokens in your Word template:');
    console.log('   Example: [OPT_REFLECTOR_STATUS]  [OPT_REFLECTOR_OK]');
    console.log('\n💡 Tip: Refresh the Report Templates page to see the updated field mappings.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
addChecklistMappings();

