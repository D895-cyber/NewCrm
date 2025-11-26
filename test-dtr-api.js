const fetch = require('node-fetch');

// Test DTR API endpoints
const BASE_URL = 'http://localhost:3000/api';

// Sample DTR data
const sampleDTRs = [
  {
    serialNumber: 'EP2024001',
    siteName: 'TechCorp Mumbai Office',
    siteCode: 'MUM001',
    region: 'Maharashtra',
    complaintDescription: 'No display output, lamp indicator shows error',
    errorDate: '2024-01-10',
    unitModel: 'Epson EB-X41',
    problemName: 'Display Failure',
    actionTaken: 'Lamp assembly replacement required',
    remarks: 'Lamp hours exceeded, needs replacement',
    callStatus: 'Open',
    caseSeverity: 'High',
    openedBy: {
      name: 'Rajesh Kumar',
      designation: 'IT Manager',
      contact: '+91-9876543210'
    },
    priority: 'High',
    estimatedResolutionTime: '2 days',
    notes: 'Critical issue affecting presentations'
  },
  {
    serialNumber: 'EP2024004',
    siteName: 'EduTech Bangalore Campus',
    siteCode: 'BLR001',
    region: 'Karnataka',
    complaintDescription: 'Dim display, flickering image, lamp hours exceeded',
    errorDate: '2024-01-11',
    unitModel: 'Epson EB-X06',
    problemName: 'Dim Display',
    actionTaken: 'Lamp replacement in progress',
    remarks: 'Lamp replacement scheduled',
    callStatus: 'In Progress',
    caseSeverity: 'Medium',
    openedBy: {
      name: 'Priya Sharma',
      designation: 'IT Coordinator',
      contact: '+91-9876543211'
    },
    priority: 'Medium',
    estimatedResolutionTime: '1 day',
    notes: 'Educational content affected'
  },
  {
    serialNumber: 'BQ2024001',
    siteName: 'MediCare Delhi Hospital',
    siteCode: 'DEL001',
    region: 'Delhi',
    complaintDescription: 'Power issues, intermittent shutdowns, overheating',
    errorDate: '2024-01-12',
    unitModel: 'BenQ MW632ST',
    problemName: 'Power Issues',
    actionTaken: 'Power supply unit replacement completed',
    remarks: 'Critical medical equipment affected',
    callStatus: 'Closed',
    caseSeverity: 'Critical',
    openedBy: {
      name: 'Dr. Amit Patel',
      designation: 'Medical Director',
      contact: '+91-9876543212'
    },
    priority: 'Critical',
    estimatedResolutionTime: '4 hours',
    actualResolutionTime: '3 hours',
    notes: 'Medical presentation system - high priority',
    status: 'Closed',
    closedBy: {
      name: 'Technical Support',
      designation: 'Senior Technician',
      contact: '+91-9876543213',
      closedDate: '2024-01-12'
    },
    closedReason: 'Resolved'
  }
];

async function testDTRAPI() {
  try {
    console.log('🚀 Testing DTR API...\n');

    // Test 1: Check if DTR endpoint is accessible
    console.log('1️⃣ Testing DTR endpoint accessibility...');
    try {
      const response = await fetch(`${BASE_URL}/dtr/test-data`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ DTR endpoint accessible. Current DTRs: ${data.totalDTRs}`);
      } else {
        console.log(`❌ DTR endpoint error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ DTR endpoint not accessible: ${error.message}`);
    }

    // Test 2: Create DTRs
    console.log('\n2️⃣ Creating sample DTRs...');
    let createdCount = 0;
    
    for (const dtrData of sampleDTRs) {
      try {
        const response = await fetch(`${BASE_URL}/dtr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dtrData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created DTR: ${result.caseId || 'Unknown'}`);
          createdCount++;
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create DTR: ${response.status} ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating DTR: ${error.message}`);
      }
    }

    console.log(`\n📊 Created ${createdCount} out of ${sampleDTRs.length} DTRs`);

    // Test 3: Verify DTRs were created
    console.log('\n3️⃣ Verifying DTRs...');
    try {
      const response = await fetch(`${BASE_URL}/dtr/test-data`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Total DTRs in database: ${data.totalDTRs}`);
        if (data.sampleData && data.sampleData.length > 0) {
          console.log('📋 Sample DTR data:');
          data.sampleData.forEach((dtr, index) => {
            console.log(`   ${index + 1}. ${dtr.caseId} - ${dtr.errorDate || dtr.complaintDate}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Error verifying DTRs: ${error.message}`);
    }

    console.log('\n🎉 DTR API testing completed!');
    console.log('🌐 You can now test the DTR page at: http://localhost:3000/#dtr');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDTRAPI();

















