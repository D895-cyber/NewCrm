/**
 * Test PDF Generation from HTML Template
 * Run this to debug the HTML to PDF issue
 */

const HtmlToPdfService = require('./backend/server/services/HtmlToPdfService');
const path = require('path');
const fs = require('fs');

async function testPdfGeneration() {
  console.log('🧪 Testing HTML to PDF Generation...\n');

  try {
    // Test 1: Check if template exists
    console.log('📁 Step 1: Checking template file...');
    const templatePath = path.join(__dirname, 'backend/server/templates/html/ascomp_complete_report.html');
    
    if (fs.existsSync(templatePath)) {
      console.log('✅ Template found:', templatePath);
      const size = fs.statSync(templatePath).size;
      console.log(`   File size: ${size} bytes\n`);
    } else {
      console.log('❌ Template NOT found at:', templatePath);
      return;
    }

    // Test 2: Check Puppeteer
    console.log('🔧 Step 2: Testing Puppeteer...');
    try {
      const puppeteer = require('puppeteer');
      console.log('✅ Puppeteer module loaded successfully\n');
    } catch (err) {
      console.log('❌ Puppeteer error:', err.message);
      return;
    }

    // Test 3: Generate test PDF
    console.log('📄 Step 3: Generating test PDF...');
    
    const testData = {
      reportNumber: 'TEST-001',
      cinemaName: 'Test Cinema',
      location: 'Test Location',
      address: 'Test Address',
      contactDetails: 'Test Contact',
      screenNumber: '1',
      date: new Date(),
      projectorModelSerialAndHours: 'Test Projector Model XYZ, S/N: 12345, Hours: 1000',
      opticals: {
        reflector: { status: 'OK', replacement: 'None' },
        uvFilter: { status: 'OK', replacement: 'None' }
      },
      engineer: {
        name: 'Test Engineer',
        phone: '1234567890',
        email: 'test@test.com'
      }
    };

    console.log('   Test data prepared');
    console.log('   Generating PDF (this may take 10-30 seconds)...\n');

    const pdfBuffer = await HtmlToPdfService.generatePdfFromTemplate(
      'ascomp_complete_report',
      testData,
      { format: 'A4' }
    );

    // Save test PDF
    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log('✅ SUCCESS! PDF generated successfully!');
    console.log(`📦 PDF saved to: ${outputPath}`);
    console.log(`📏 PDF size: ${pdfBuffer.length} bytes\n`);

    console.log('🎉 HTML to PDF system is working correctly!\n');
    console.log('💡 If you still get errors in the browser:');
    console.log('   1. Make sure backend server is running: cd backend && npm start');
    console.log('   2. Check browser console for errors (F12)');
    console.log('   3. Verify you are logged in with valid token');
    console.log('   4. Check that report ID exists in database\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('   Error Type:', error.name);
    console.error('   Error Message:', error.message);
    console.error('   Full Error:', error.stack);
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    
    if (error.message.includes('Could not find Chrome')) {
      console.log('   Issue: Chromium not downloaded for Puppeteer');
      console.log('   Fix: Run in backend folder:');
      console.log('        cd backend');
      console.log('        npm uninstall puppeteer');
      console.log('        npm install puppeteer');
    } else if (error.message.includes('Template not found')) {
      console.log('   Issue: Template file missing or wrong name');
      console.log('   Fix: Check template exists at:');
      console.log('        backend/server/templates/html/ascomp_complete_report.html');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   Issue: Backend server not running');
      console.log('   Fix: Start backend server:');
      console.log('        cd backend && npm start');
    } else {
      console.log('   Check the error message above for clues');
      console.log('   Make sure all dependencies are installed');
      console.log('   Try: cd backend && npm install');
    }
    
    console.log('\n');
  }
}

// Run the test
testPdfGeneration();







