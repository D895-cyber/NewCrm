const fs = require('fs');
const csv = require('csv-parser');

// Script to validate CSV file and identify potential issues
async function validateCSVFile(filePath) {
  console.log('🔍 Validating CSV file for RMA import...\n');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ CSV file not found:', filePath);
    return;
  }
  
  const issues = [];
  let rowCount = 0;
  const rmaNumbers = new Set();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        const rowNumber = rowCount + 1; // +1 for header row
        
        // Check for missing required fields
        const requiredFields = [
          'Site Name',
          'Product Name', 
          'Ascomp Raised Date',
          'Customer Error Date'
        ];
        
        const missingFields = requiredFields.filter(field => {
          const value = row[field];
          return !value || value.trim() === '' || value.trim() === 'N/A';
        });
        
        if (missingFields.length > 0) {
          issues.push({
            row: rowNumber,
            type: 'Missing Required Fields',
            fields: missingFields,
            data: row
          });
        }
        
        // Check for duplicate RMA numbers
        const rmaNumber = row['RMA #'];
        if (rmaNumber && rmaNumber.trim() !== '') {
          if (rmaNumbers.has(rmaNumber)) {
            issues.push({
              row: rowNumber,
              type: 'Duplicate RMA Number',
              value: rmaNumber,
              data: row
            });
          } else {
            rmaNumbers.add(rmaNumber);
          }
        }
        
        // Check date formats
        const dateFields = ['Ascomp Raised Date', 'Customer Error Date'];
        dateFields.forEach(field => {
          const dateValue = row[field];
          if (dateValue && dateValue.trim() !== '') {
            // Check if it's a valid date format
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              issues.push({
                row: rowNumber,
                type: 'Invalid Date Format',
                field: field,
                value: dateValue,
                data: row
              });
            }
          }
        });
        
        // Check RMA Type values
        const rmaType = row['RMA/CI RMA / Lamps'];
        if (rmaType && rmaType.trim() !== '' && !['RMA', 'RMA CL'].includes(rmaType.trim())) {
          issues.push({
            row: rowNumber,
            type: 'Invalid RMA Type',
            value: rmaType,
            expected: 'RMA or RMA CL',
            data: row
          });
        }
        
        // Check Call Log Number format
        const callLogNumber = row['Call Log #'];
        if (callLogNumber && callLogNumber.trim() !== '') {
          if (!/^\d+$/.test(callLogNumber.trim())) {
            issues.push({
              row: rowNumber,
              type: 'Invalid Call Log Number',
              value: callLogNumber,
              expected: 'Numeric value',
              data: row
            });
          }
        }
        
        // Check for empty rows
        const hasAnyData = Object.values(row).some(value => 
          value && value.trim() !== ''
        );
        
        if (!hasAnyData) {
          issues.push({
            row: rowNumber,
            type: 'Empty Row',
            data: row
          });
        }
      })
      .on('end', () => {
        console.log(`📊 CSV Validation Complete`);
        console.log(`📈 Total rows processed: ${rowCount}`);
        console.log(`❌ Issues found: ${issues.length}\n`);
        
        if (issues.length > 0) {
          console.log('🚨 Issues identified:\n');
          
          // Group issues by type
          const issuesByType = {};
          issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
              issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
          });
          
          Object.entries(issuesByType).forEach(([type, typeIssues]) => {
            console.log(`📋 ${type} (${typeIssues.length} occurrences):`);
            typeIssues.forEach(issue => {
              console.log(`   Row ${issue.row}: ${issue.value || issue.fields?.join(', ') || 'See details'}`);
            });
            console.log('');
          });
          
          console.log('🛠️  Recommendations:');
          console.log('1. Fix the issues identified above');
          console.log('2. Re-import the corrected CSV file');
          console.log('3. Verify all records are uploaded successfully');
          
        } else {
          console.log('✅ No issues found! Your CSV file looks good.');
        }
        
        resolve(issues);
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Usage example
const csvFilePath = process.argv[2] || 'rma-import-template-corrected.csv';

console.log(`🔍 Validating CSV file: ${csvFilePath}\n`);

validateCSVFile(csvFilePath)
  .then((issues) => {
    console.log('\n🎯 Validation complete!');
    if (issues.length > 0) {
      console.log(`Found ${issues.length} issues that need to be fixed.`);
    } else {
      console.log('CSV file is ready for import!');
    }
  })
  .catch((error) => {
    console.error('❌ Validation failed:', error);
  });



