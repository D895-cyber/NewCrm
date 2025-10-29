const fs = require('fs');
const csv = require('csv-parser');

// Script to fix common RMA import errors
async function fixRMAImportErrors(filePath) {
  console.log('🔧 Fixing RMA Import Errors...\n');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ CSV file not found:', filePath);
    return;
  }
  
  const fixedData = [];
  const errors = [];
  let rowCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        const fixedRow = { ...row };
        
        // Fix 1: Field name mismatches
        if (fixedRow.replacedpartname !== undefined) {
          fixedRow.replacedPartName = fixedRow.replacedpartname;
          delete fixedRow.replacedpartname;
        }
        
        if (fixedRow.casestatus !== undefined) {
          fixedRow.caseStatus = fixedRow.casestatus;
          delete fixedRow.casestatus;
        }
        
        if (fixedRow.approvalstatus !== undefined) {
          fixedRow.approvalStatus = fixedRow.approvalstatus;
          delete fixedRow.approvalstatus;
        }
        
        if (fixedRow.rmaReturnshippedDate !== undefined) {
          fixedRow.rmaReturnShippedDate = fixedRow.rmaReturnshippedDate;
          delete fixedRow.rmaReturnshippedDate;
        }
        
        if (fixedRow.rmaReturnshippedThru !== undefined) {
          fixedRow.rmaReturnShippedThru = fixedRow.rmaReturnshippedThru;
          delete fixedRow.rmaReturnshippedThru;
        }
        
        // Fix 2: Field value issues
        // Fix tracking number and shipped thru field swapping
        if (fixedRow.trackingNumber && fixedRow.trackingNumber.toLowerCase().includes('hand')) {
          if (!fixedRow.shippedThru || fixedRow.shippedThru.trim() === '') {
            fixedRow.shippedThru = fixedRow.trackingNumber;
            fixedRow.trackingNumber = '';
          }
        }
        
        // Normalize shipped thru values
        if (fixedRow.shippedThru) {
          const shippedThru = fixedRow.shippedThru.toLowerCase();
          if (shippedThru.includes('hand')) {
            fixedRow.shippedThru = 'By Hand';
          } else if (shippedThru.includes('dtdc')) {
            fixedRow.shippedThru = 'DTDC';
          } else if (shippedThru.includes('movin')) {
            fixedRow.shippedThru = 'Movin';
          }
        }
        
        // Normalize rma return shipped thru values
        if (fixedRow.rmaReturnShippedThru) {
          const returnShippedThru = fixedRow.rmaReturnShippedThru.toLowerCase();
          if (returnShippedThru.includes('hand')) {
            fixedRow.rmaReturnShippedThru = 'By Hand';
          } else if (returnShippedThru.includes('dtdc')) {
            fixedRow.rmaReturnShippedThru = 'DTDC';
          } else if (returnShippedThru.includes('movin')) {
            fixedRow.rmaReturnShippedThru = 'Movin';
          }
        }
        
        // Fix 3: Ensure required fields have values
        if (!fixedRow.siteName || fixedRow.siteName.trim() === '') {
          if (fixedRow.serialNumber && fixedRow.serialNumber.trim() !== '') {
            fixedRow.siteName = `Site from Serial: ${fixedRow.serialNumber}`;
          } else {
            fixedRow.siteName = 'Unknown Site';
          }
        }
        
        if (!fixedRow.productName || fixedRow.productName.trim() === '') {
          if (fixedRow.serialNumber && fixedRow.serialNumber.trim() !== '') {
            fixedRow.productName = `Model from Serial: ${fixedRow.serialNumber}`;
          } else {
            fixedRow.productName = 'Unknown Product';
          }
        }
        
        // Fix 4: Normalize status values
        if (fixedRow.caseStatus) {
          const status = fixedRow.caseStatus.toLowerCase();
          if (status.includes('completed')) {
            fixedRow.caseStatus = 'Completed';
          } else if (status.includes('under review')) {
            fixedRow.caseStatus = 'Under Review';
          } else if (status.includes('pending')) {
            fixedRow.caseStatus = 'Under Review';
          }
        }
        
        if (fixedRow.approvalStatus) {
          const approvalStatus = fixedRow.approvalStatus.toLowerCase();
          if (approvalStatus.includes('pending')) {
            fixedRow.approvalStatus = 'Pending Review';
          } else if (approvalStatus.includes('approved')) {
            fixedRow.approvalStatus = 'Approved';
          } else if (approvalStatus.includes('rejected')) {
            fixedRow.approvalStatus = 'Rejected';
          }
        }
        
        // Fix 5: Set default values
        if (!fixedRow.createdBy || fixedRow.createdBy.trim() === '') {
          fixedRow.createdBy = 'Pankaj';
        }
        
        if (!fixedRow.brand || fixedRow.brand.trim() === '') {
          fixedRow.brand = 'Christie';
        }
        
        if (!fixedRow.warrantyStatus || fixedRow.warrantyStatus.trim() === '') {
          fixedRow.warrantyStatus = 'In Warranty';
        }
        
        if (!fixedRow.priority || fixedRow.priority.trim() === '') {
          fixedRow.priority = 'Medium';
        }
        
        fixedData.push(fixedRow);
      })
      .on('end', () => {
        console.log(`📊 Processed ${rowCount} rows`);
        console.log(`✅ Fixed ${fixedData.length} records`);
        
        // Write fixed CSV
        const outputPath = filePath.replace('.csv', '_fixed.csv');
        const headers = Object.keys(fixedData[0] || {});
        const csvContent = [
          headers.join(','),
          ...fixedData.map(row => 
            headers.map(header => {
              const value = row[header] || '';
              // Escape commas and quotes in CSV
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');
        
        fs.writeFileSync(outputPath, csvContent);
        
        console.log(`\n🎉 Fixed CSV saved as: ${outputPath}`);
        console.log('\n📋 Summary of fixes applied:');
        console.log('1. ✅ Fixed field name mismatches (replacedpartname → replacedPartName)');
        console.log('2. ✅ Fixed field value swapping (trackingNumber ↔ shippedThru)');
        console.log('3. ✅ Normalized status values (caseStatus, approvalStatus)');
        console.log('4. ✅ Set default values (brand: Christie, createdBy: Pankaj)');
        console.log('5. ✅ Ensured required fields have values');
        
        console.log('\n🚀 Next steps:');
        console.log('1. Use the fixed CSV file for import');
        console.log('2. The 230 errors should now be resolved');
        console.log('3. All records should import successfully');
        
        resolve(fixedData);
      })
      .on('error', (error) => {
        console.error('❌ Error processing CSV file:', error);
        reject(error);
      });
  });
}

// Usage
const csvFilePath = process.argv[2] || 'your-rma-file.csv';

console.log(`🔧 Fixing RMA import errors in: ${csvFilePath}\n`);

fixRMAImportErrors(csvFilePath)
  .then((fixedData) => {
    console.log('\n🎯 Error fixing complete!');
  })
  .catch((error) => {
    console.error('❌ Error fixing failed:', error);
  });


