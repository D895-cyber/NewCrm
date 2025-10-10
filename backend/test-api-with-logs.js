const http = require('http');

function testAPIWithLogs() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testing API to see logs...');
    
    const req = http.get('http://localhost:4000/api/rma', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const records = JSON.parse(data);
          console.log(`✅ API returned ${records.length} records`);
          console.log('📊 Sample records:');
          records.slice(0, 3).forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.rmaNumber}: ${record.siteName} - ${record.productName} (${record.caseStatus})`);
          });
          resolve(records.length);
        } catch (error) {
          console.error('❌ Error parsing API response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error testing API:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ API request timed out');
      reject(new Error('Request timeout'));
    });
  });
}

testAPIWithLogs().catch(console.error);




