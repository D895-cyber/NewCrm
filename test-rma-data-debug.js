const fetch = require('node-fetch');

async function debugRMAData() {
  try {
    console.log('🔍 Fetching RMA data from API...');
    
    const response = await fetch('http://localhost:4000/api/rma');
    const rmaData = await response.json();
    
    console.log(`📊 Total RMAs found: ${rmaData.length}`);
    
    // Find RMAs with replacement part names that might be symptoms
    const problematicRMAs = rmaData.filter(rma => {
      const replacedName = rma.replacedPartName || '';
      const defectiveName = rma.defectivePartName || '';
      
      // Check if replacement part name looks like a symptom
      const symptomKeywords = [
        'chipped', 'broken', 'faulty', 'defect', 'failure', 'marriage',
        'rod chipped', 'integrator rod', 'prism chipped', 'segmen prism',
        'connection lost', 'power cycle', 'marriage failure', 'imb marriage',
        'cracked', 'damaged', 'malfunction', 'error', 'issue', 'problem'
      ];
      
      return symptomKeywords.some(keyword => 
        replacedName.toLowerCase().includes(keyword.toLowerCase())
      );
    });
    
    console.log(`🚨 Found ${problematicRMAs.length} RMAs with potential symptom names in replacement part field`);
    
    // Show first few problematic RMAs
    problematicRMAs.slice(0, 5).forEach((rma, index) => {
      console.log(`\n--- RMA ${index + 1} ---`);
      console.log(`RMA Number: ${rma.rmaNumber}`);
      console.log(`Defective Part Name: "${rma.defectivePartName}"`);
      console.log(`Replacement Part Name: "${rma.replacedPartName}"`);
      console.log(`Defective Part Number: ${rma.defectivePartNumber}`);
      console.log(`Replacement Part Number: ${rma.replacedPartNumber}`);
      console.log(`Symptoms: "${rma.symptoms}"`);
      console.log(`Case Status: ${rma.caseStatus}`);
    });
    
    // Check if there are any RMAs with "Integrator rod chipped" specifically
    const integratorRodRMAs = rmaData.filter(rma => 
      (rma.replacedPartName || '').toLowerCase().includes('integrator rod chipped')
    );
    
    console.log(`\n🔍 RMAs with "Integrator rod chipped" in replacement part name: ${integratorRodRMAs.length}`);
    
    integratorRodRMAs.forEach((rma, index) => {
      console.log(`\n--- Integrator Rod RMA ${index + 1} ---`);
      console.log(`RMA Number: ${rma.rmaNumber}`);
      console.log(`Defective Part Name: "${rma.defectivePartName}"`);
      console.log(`Replacement Part Name: "${rma.replacedPartName}"`);
      console.log(`Defective Part Number: ${rma.defectivePartNumber}`);
      console.log(`Replacement Part Number: ${rma.replacedPartNumber}`);
      console.log(`Symptoms: "${rma.symptoms}"`);
      console.log(`Case Status: ${rma.caseStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging RMA data:', error);
  }
}

debugRMAData();













