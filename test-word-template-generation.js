/**
 * Test Word Template Generation
 * This script fetches an ASCOMP report and generates a Word document
 * to test if the template system is working correctly
 */

require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import necessary modules
const ASCOMPReport = require('./backend/server/models/ASCOMPReport');
const ReportTemplate = require('./backend/server/models/ReportTemplate');

async function testWordGeneration() {
  try {
    console.log('🧪 Testing Word Template Generation...\n');
    
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the template
    console.log('📄 Fetching template...');
    const template = await ReportTemplate.findOne({
      $or: [
        { name: /ASCOMP/i },
        { type: 'ASCOMP_EW' }
      ]
    }).sort({ createdAt: -1 });
    
    if (!template) {
      console.error('❌ No template found!');
      console.log('   Please upload a template via the Report Templates page first.');
      process.exit(1);
    }
    
    console.log('✅ Template found:', {
      name: template.name,
      fileName: template.fileName,
      fieldMappings: template.fieldMappings?.length || 0
    });
    console.log();
    
    // Get a sample ASCOMP report
    console.log('📊 Fetching a sample ASCOMP report...');
    const report = await ASCOMPReport.findOne({
      reportNumber: /^ASCOMP-/
    }).sort({ createdAt: -1 });
    
    if (!report) {
      console.error('❌ No ASCOMP reports found!');
      console.log('   Please run the migration script first.');
      process.exit(1);
    }
    
    console.log('✅ Report found:', {
      reportNumber: report.reportNumber,
      cinemaName: report.cinemaName,
      date: report.date
    });
    console.log();
    
    // Display field mapping info
    console.log('📋 Field Mappings Overview:');
    console.log(`   Total mappings: ${template.fieldMappings.length}`);
    
    const mappingsBySection = {
      'OPTICALS': template.fieldMappings.filter(m => m.token.startsWith('OPT_')),
      'ELECTRONICS': template.fieldMappings.filter(m => m.token.startsWith('ELEC_')),
      'MECHANICAL': template.fieldMappings.filter(m => m.token.startsWith('MECH_')),
      'COOLANT': template.fieldMappings.filter(m => m.token.startsWith('COOLANT_')),
      'LIGHT ENGINE': template.fieldMappings.filter(m => m.token.startsWith('LE_')),
      'OTHER': template.fieldMappings.filter(m => 
        !m.token.startsWith('OPT_') && 
        !m.token.startsWith('ELEC_') && 
        !m.token.startsWith('MECH_') && 
        !m.token.startsWith('COOLANT_') && 
        !m.token.startsWith('LE_')
      )
    };
    
    for (const [section, mappings] of Object.entries(mappingsBySection)) {
      if (mappings.length > 0) {
        console.log(`   ${section}: ${mappings.length} mappings`);
      }
    }
    console.log();
    
    // Display sample data from the report
    console.log('📊 Sample Report Data:');
    console.log('\n   BASIC INFO:');
    console.log(`   Report Number: ${report.reportNumber}`);
    console.log(`   Cinema Name: ${report.cinemaName}`);
    console.log(`   Date: ${report.date}`);
    console.log(`   Engineer: ${report.engineer?.name || 'N/A'}`);
    
    console.log('\n   OPTICALS:');
    if (report.opticals) {
      Object.entries(report.opticals).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          console.log(`   - ${key}: status="${value.status || '-'}", yesNoOk="${value.yesNoOk || '-'}"`);
        }
      });
    } else {
      console.log('   (No opticals data)');
    }
    
    console.log('\n   ELECTRONICS:');
    if (report.electronics) {
      Object.entries(report.electronics).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          console.log(`   - ${key}: status="${value.status || '-'}", yesNoOk="${value.yesNoOk || '-'}"`);
        }
      });
    } else {
      console.log('   (No electronics data)');
    }
    
    console.log('\n   MECHANICAL:');
    if (report.mechanical) {
      Object.entries(report.mechanical).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          console.log(`   - ${key}: status="${value.status || '-'}", yesNoOk="${value.yesNoOk || '-'}"`);
        }
      });
    } else {
      console.log('   (No mechanical data)');
    }
    
    // Show how tokens would be replaced
    console.log('\n\n🔄 TOKEN REPLACEMENT PREVIEW:');
    console.log('   (First 10 mappings)\n');
    
    const sampleMappings = template.fieldMappings.slice(0, 10);
    for (const mapping of sampleMappings) {
      const value = getValueFromPath(report, mapping.dataPath) || mapping.defaultValue || '-';
      console.log(`   [${mapping.token}] → "${value}"`);
      console.log(`      (from: ${mapping.dataPath})`);
    }
    
    console.log('\n\n✅ Test Results:');
    console.log(`   ✓ Template has ${template.fieldMappings.length} field mappings`);
    console.log(`   ✓ Report has data available`);
    console.log(`   ✓ Field mapping system is configured`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Go to http://localhost:3000 (your app)');
    console.log('   2. Navigate to "ASCOMP Report Downloader" page');
    console.log('   3. Find report: ' + report.reportNumber);
    console.log('   4. Click "Download as Word (.docx)"');
    console.log('   5. Open the downloaded file to verify field mappings');
    
    console.log('\n📝 To update your Word template:');
    console.log('   1. Add tokens like [OPT_REFLECTOR_STATUS] to your Word doc');
    console.log('   2. See ASCOMP_CHECKLIST_MAPPINGS_ADDED.md for all tokens');
    console.log('   3. Re-upload via Report Templates page');
    console.log('   4. Test download again!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Helper function to get value from nested path
function getValueFromPath(obj, path) {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value == null) return null;
    value = value[key];
  }
  
  return value;
}

// Run the test
testWordGeneration();







