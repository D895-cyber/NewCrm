const fs = require('fs');
const csv = require('csv-parser');

// Comprehensive RMA CSV Analysis Script
async function analyzeRMACSV(filePath) {
  console.log('🔍 Analyzing RMA CSV File...\n');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ CSV file not found:', filePath);
    return;
  }
  
  const records = [];
  const issues = [];
  const rmaNumbers = new Set();
  let rowCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        const record = { ...row, rowNumber: rowCount };
        records.push(record);
        
        // Check for duplicate RMA numbers
        const rmaNumber = row['RMA #'] || row['RMA Number'] || row['RMA'];
        if (rmaNumber && rmaNumber.trim() !== '') {
          if (rmaNumbers.has(rmaNumber)) {
            issues.push({
              row: rowCount,
              type: 'Duplicate RMA Number',
              value: rmaNumber,
              severity: 'HIGH'
            });
          } else {
            rmaNumbers.add(rmaNumber);
          }
        }
        
        // Check required fields
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
            row: rowCount,
            type: 'Missing Required Fields',
            fields: missingFields,
            severity: 'HIGH'
          });
        }
        
        // Check date formats
        const dateFields = ['Ascomp Raised Date', 'Customer Error Date'];
        dateFields.forEach(field => {
          const dateValue = row[field];
          if (dateValue && dateValue.trim() !== '') {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              issues.push({
                row: rowCount,
                type: 'Invalid Date Format',
                field: field,
                value: dateValue,
                severity: 'MEDIUM'
              });
            }
          }
        });
        
        // Check RMA Type values
        const rmaType = row['RMA/CI RMA / Lamps'] || row['RMA/CI RMA/Lamps'];
        if (rmaType && rmaType.trim() !== '' && !['RMA', 'RMA CL'].includes(rmaType.trim())) {
          issues.push({
            row: rowCount,
            type: 'Invalid RMA Type',
            value: rmaType,
            expected: 'RMA or RMA CL',
            severity: 'MEDIUM'
          });
        }
        
        // Check Call Log Number format
        const callLogNumber = row['Call Log #'] || row['Call Log Number'];
        if (callLogNumber && callLogNumber.trim() !== '') {
          if (!/^\d+$/.test(callLogNumber.trim())) {
            issues.push({
              row: rowCount,
              type: 'Invalid Call Log Number',
              value: callLogNumber,
              expected: 'Numeric value',
              severity: 'LOW'
            });
          }
        }
        
        // Check field name mismatches
        const fieldMismatches = [
          'replacedpartname',
          'casestatus', 
          'approvalstatus',
          'rmaReturnshippedDate',
          'rmaReturnshippedThru'
        ];
        
        fieldMismatches.forEach(field => {
          if (row[field] !== undefined) {
            issues.push({
              row: rowCount,
              type: 'Field Name Mismatch',
              field: field,
              severity: 'MEDIUM'
            });
          }
        });
        
        // Check field value issues
        if (row['Tracking #'] && row['Tracking #'].toLowerCase().includes('hand')) {
          issues.push({
            row: rowCount,
            type: 'Field Value Issue',
            field: 'Tracking #',
            value: row['Tracking #'],
            issue: 'Should be in Shipped Thru field',
            severity: 'MEDIUM'
          });
        }
        
        // Check for empty rows
        const hasAnyData = Object.values(row).some(value => 
          value && value.toString().trim() !== ''
        );
        
        if (!hasAnyData) {
          issues.push({
            row: rowCount,
            type: 'Empty Row',
            severity: 'LOW'
          });
        }
      })
      .on('end', () => {
        console.log(`📊 Analysis Complete`);
        console.log(`📈 Total records analyzed: ${records.length}`);
        console.log(`❌ Issues found: ${issues.length}\n`);
        
        if (issues.length > 0) {
          // Group issues by type and severity
          const issuesByType = {};
          const issuesBySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0 };
          
          issues.forEach(issue => {
            if (!issuesByType[issue.type]) {
              issuesByType[issue.type] = [];
            }
            issuesByType[issue.type].push(issue);
            issuesBySeverity[issue.severity]++;
          });
          
          console.log('🚨 Issues Summary by Severity:');
          console.log(`   🔴 HIGH: ${issuesBySeverity.HIGH} issues`);
          console.log(`   🟡 MEDIUM: ${issuesBySeverity.MEDIUM} issues`);
          console.log(`   🟢 LOW: ${issuesBySeverity.LOW} issues\n`);
          
          console.log('📋 Detailed Issues by Type:\n');
          
          Object.entries(issuesByType).forEach(([type, typeIssues]) => {
            console.log(`🔍 ${type} (${typeIssues.length} occurrences):`);
            typeIssues.slice(0, 10).forEach(issue => { // Show first 10 examples
              console.log(`   Row ${issue.row}: ${issue.value || issue.fields?.join(', ') || issue.field || 'See details'}`);
            });
            if (typeIssues.length > 10) {
              console.log(`   ... and ${typeIssues.length - 10} more`);
            }
            console.log('');
          });
          
          // Show sample of problematic records
          console.log('📄 Sample of problematic records:');
          const problematicRows = [...new Set(issues.slice(0, 5).map(i => i.row))];
          problematicRows.forEach(rowNum => {
            const record = records.find(r => r.rowNumber === rowNum);
            if (record) {
              console.log(`\nRow ${rowNum}:`);
              console.log(`  RMA #: ${record['RMA #'] || record['RMA Number'] || 'N/A'}`);
              console.log(`  Site Name: ${record['Site Name'] || 'N/A'}`);
              console.log(`  Product Name: ${record['Product Name'] || 'N/A'}`);
              console.log(`  Serial #: ${record['Serial #'] || 'N/A'}`);
              console.log(`  Ascomp Raised Date: ${record['Ascomp Raised Date'] || 'N/A'}`);
              console.log(`  Customer Error Date: ${record['Customer Error Date'] || 'N/A'}`);
            }
          });
          
        } else {
          console.log('✅ No issues found! Your CSV file looks good for import.');
        }
        
        console.log('\n🛠️  Recommendations:');
        if (issuesBySeverity.HIGH > 0) {
          console.log('1. 🔴 Fix HIGH severity issues first (missing required fields, duplicates)');
        }
        if (issuesBySeverity.MEDIUM > 0) {
          console.log('2. 🟡 Fix MEDIUM severity issues (field mismatches, invalid formats)');
        }
        if (issuesBySeverity.LOW > 0) {
          console.log('3. 🟢 Review LOW severity issues (formatting, empty rows)');
        }
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Review the issues identified above');
        console.log('2. Fix the problematic records in your CSV');
        console.log('3. Re-run this analysis to verify fixes');
        console.log('4. Proceed with import once all HIGH and MEDIUM issues are resolved');
        
        resolve({ records, issues, summary: { total: records.length, issues: issues.length, bySeverity: issuesBySeverity } });
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Usage
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log('📁 Please provide the CSV file path as an argument');
  console.log('Usage: node analyze-rma-csv.js "path/to/your/file.csv"');
  process.exit(1);
}

console.log(`🔍 Analyzing RMA CSV file: ${csvFilePath}\n`);

analyzeRMACSV(csvFilePath)
  .then((result) => {
    console.log('\n🎯 Analysis complete!');
    console.log(`📊 Summary: ${result.summary.total} records, ${result.summary.issues} issues found`);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
  });



