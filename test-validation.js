// Test validation functions
const { validateServiceReport } = require('./src/utils/validation/reportValidation.ts');

// Test data with the correct structure
const testReport = {
  reportNumber: "SR001",
  siteName: "Test Site",
  projectorSerial: "TEST123",
  projectorModel: "Test Model",
  brand: "Test Brand",
  
  // Environmental conditions in nested structure
  environmentalConditions: {
    temperature: "45", // This should trigger a warning (too high)
    humidity: "85"     // This should trigger a warning (too high)
  },
  
  // Air pollution in nested structure
  airPollutionLevel: {
    hcho: "0.8",       // This should trigger a critical warning
    tvoc: "2.0",       // This should trigger a critical warning
    pm1: "150",        // This should trigger a warning
    pm25: "200",       // This should trigger a warning
    pm10: "400"        // This should trigger a warning
  },
  
  // Voltage parameters in nested structure
  voltageParameters: {
    voltagePN: "180",  // This should trigger a critical error (too low)
    voltagePE: "190",  // This should trigger a critical error (too low)
    voltageNE: "15"    // This should trigger a critical error (too high)
  },
  
  // Running hours
  projectorRunningHours: "48000", // This should trigger a critical warning
  lampRunningHours: "18000"       // This should trigger a critical error
};

console.log('🧪 Testing validation with sample data...');
console.log('📊 Test data structure:', JSON.stringify(testReport, null, 2));

try {
  const validationResult = validateServiceReport(testReport);
  console.log('\n✅ Validation completed successfully!');
  console.log('📋 Validation summary:');
  console.log(`   - Is Valid: ${validationResult.isValid}`);
  console.log(`   - Errors: ${validationResult.errors.length}`);
  console.log(`   - Warnings: ${validationResult.warnings.length}`);
  console.log(`   - Suggestions: ${validationResult.suggestions.length}`);
  
  if (validationResult.errors.length > 0) {
    console.log('\n❌ Errors:');
    validationResult.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.field}: ${error.message}`);
    });
  }
  
  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    validationResult.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning.field}: ${warning.message}`);
    });
  }
  
  if (validationResult.suggestions.length > 0) {
    console.log('\nℹ️ Suggestions:');
    validationResult.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.field}: ${suggestion.message}`);
    });
  }
  
} catch (error) {
  console.error('❌ Validation failed with error:', error);
}

