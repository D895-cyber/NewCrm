/**
 * Test HTML to PDF Generation
 * Run this to diagnose PDF generation issues
 */

console.log('🔍 Starting HTML to PDF Test...\n');

// Test 1: Check if Puppeteer is installed
console.log('📦 Test 1: Checking Puppeteer installation...');
try {
  const puppeteer = require('puppeteer');
  console.log('✅ Puppeteer is installed');
  
  try {
    const execPath = puppeteer.executablePath();
    console.log('✅ Chrome executable found at:', execPath);
  } catch (err) {
    console.log('⚠️  Chrome executable not found, will download on first run');
  }
} catch (error) {
  console.log('❌ Puppeteer is NOT installed');
  console.log('   Run: npm install puppeteer');
  process.exit(1);
}

// Test 2: Check if Handlebars is installed
console.log('\n📦 Test 2: Checking Handlebars installation...');
try {
  const Handlebars = require('handlebars');
  console.log('✅ Handlebars is installed');
} catch (error) {
  console.log('❌ Handlebars is NOT installed');
  console.log('   Run: npm install handlebars');
  process.exit(1);
}

// Test 3: Check if template file exists
console.log('\n📄 Test 3: Checking template file...');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'server/templates/html/ascomp_complete_report.html');
console.log('   Looking for:', templatePath);

if (!fs.existsSync(templatePath)) {
  console.log('❌ Template file NOT found!');
  console.log('   Expected location:', templatePath);
  
  // Check if html folder exists
  const htmlDir = path.join(__dirname, 'server/templates/html');
  if (fs.existsSync(htmlDir)) {
    console.log('   Files in html folder:');
    fs.readdirSync(htmlDir).forEach(file => {
      console.log('     -', file);
    });
  } else {
    console.log('   ❌ HTML templates folder does not exist!');
  }
  process.exit(1);
} else {
  console.log('✅ Template file found');
  const fileSize = fs.statSync(templatePath).size;
  console.log('   File size:', fileSize, 'bytes');
}

// Test 4: Read and compile template
console.log('\n📝 Test 4: Reading and compiling template...');
try {
  const Handlebars = require('handlebars');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  console.log('✅ Template read successfully');
  console.log('   Template length:', templateContent.length, 'characters');
  
  // Register helpers (same as in HtmlToPdfService)
  Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });
  
  Handlebars.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  });
  
  Handlebars.registerHelper('default', function(value, defaultValue) {
    return value || defaultValue || '';
  });
  
  // Compile template
  const template = Handlebars.compile(templateContent);
  console.log('✅ Template compiled successfully');
  
  // Test with sample data
  const sampleData = {
    cinemaName: 'Test Cinema',
    location: 'Test Location',
    address: 'Test Address',
    date: new Date(),
    screenNumber: '1',
    projectorModelSerialAndHours: 'Test Model - SN123456 - 1000hrs',
    engineer: {
      name: 'Test Engineer',
      phone: '1234567890'
    },
    opticals: {
      reflector: { status: 'OK', replacement: 'No' },
      uvFilter: { status: 'OK', replacement: 'No' }
    }
  };
  
  const html = template(sampleData);
  console.log('✅ Template rendered with sample data');
  console.log('   Rendered HTML length:', html.length, 'characters');
  
} catch (error) {
  console.log('❌ Error compiling template:', error.message);
  process.exit(1);
}

// Test 5: Generate PDF with Puppeteer
console.log('\n📄 Test 5: Generating PDF with Puppeteer...');
(async () => {
  let browser;
  try {
    const puppeteer = require('puppeteer');
    const Handlebars = require('handlebars');
    
    // Register helpers
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-GB');
    });
    
    Handlebars.registerHelper('default', function(value, defaultValue) {
      return value || defaultValue || '';
    });
    
    // Read template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);
    
    // Sample data
    const sampleData = {
      cinemaName: 'Test Cinema',
      location: 'Delhi',
      address: '123 Test Street, New Delhi',
      contactDetails: '9876543210',
      screenNumber: '1',
      date: new Date(),
      projectorModelSerialAndHours: 'Christie CP2220 - SN123456 - 1000 hrs',
      engineer: {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@ascompinc.in'
      },
      opticals: {
        reflector: { status: 'OK', replacement: 'No' },
        uvFilter: { status: 'OK', replacement: 'No' },
        integratorRod: { status: 'OK', replacement: 'No' },
        coldMirror: { status: 'OK', replacement: 'No' },
        foldMirror: { status: 'OK', replacement: 'No' }
      },
      electronics: {
        touchPanel: { status: 'OK', replacement: 'No' },
        evbImcbBoard: { status: 'OK', replacement: 'No' },
        imbSBoard: { status: 'OK', replacement: 'No' }
      },
      mechanical: {
        acBlowerVaneSwitch: { status: 'OK', replacement: 'No' },
        extractorVaneSwitch: { status: 'OK', replacement: 'No' },
        exhaustCFM: { value: '850', replacement: 'No' },
        lightEngine4Fans: { status: 'OK', replacement: 'No' },
        cardCageFans: { status: 'OK', replacement: 'No' },
        radiatorFanPump: { status: 'OK', replacement: 'No' },
        connectorHosePump: { status: 'OK', replacement: 'No' }
      },
      remarks: 'All systems functioning normally. No issues found.',
      imageEvaluation: {
        focusBoresite: 'Yes',
        integratorPosition: 'Yes',
        spotOnScreen: 'No',
        screenCropping: 'Yes',
        convergenceChecked: 'Yes',
        channelsChecked: 'Yes',
        pixelDefects: 'No',
        imageVibration: 'No',
        liteLOC: 'Yes'
      }
    };
    
    const html = template(sampleData);
    
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched');
    
    const page = await browser.newPage();
    console.log('✅ New page created');
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('✅ HTML content set');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    console.log('✅ PDF generated successfully!');
    console.log('   PDF size:', pdfBuffer.length, 'bytes');
    
    // Save test PDF
    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('✅ Test PDF saved to:', outputPath);
    
    await browser.close();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('📄 PDF generation is working correctly!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check if backend server is running (npm start in backend folder)');
    console.log('   2. Check browser console for errors when clicking PDF button');
    console.log('   3. Check backend logs for errors');
    console.log('   4. Open test-output.pdf to see the generated PDF');
    
  } catch (error) {
    console.log('❌ PDF generation failed!');
    console.log('   Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    
    if (error.message.includes('Failed to launch')) {
      console.log('   ❌ Puppeteer cannot launch Chrome');
      console.log('   Fix: Run these commands:');
      console.log('        npm uninstall puppeteer');
      console.log('        npm install puppeteer --force');
      console.log('   Or download Chrome manually:');
      console.log('        npx puppeteer browsers install chrome');
    } else {
      console.log('   Check the error details above');
    }
    
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
})();











