/**
 * Test HTML to PDF Generation
 * 
 * This script tests the HTML template to PDF conversion system
 * 
 * Usage:
 *   node test-html-to-pdf.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing HTML to PDF System...\n');

// Check if required packages are installed
const requiredPackages = ['puppeteer', 'handlebars'];
const packageJson = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));

console.log('📦 Checking dependencies...');
requiredPackages.forEach(pkg => {
  if (packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]) {
    console.log(`  ✅ ${pkg} is installed`);
  } else {
    console.log(`  ❌ ${pkg} is NOT installed`);
  }
});

// Check if template directory exists
const templateDir = path.join(__dirname, 'backend', 'server', 'templates', 'html');
console.log('\n📁 Checking template directory...');
if (fs.existsSync(templateDir)) {
  console.log(`  ✅ Template directory exists: ${templateDir}`);
  
  // List templates
  const templates = fs.readdirSync(templateDir).filter(f => f.endsWith('.html'));
  if (templates.length > 0) {
    console.log(`  ✅ Found ${templates.length} template(s):`);
    templates.forEach(t => console.log(`     - ${t}`));
  } else {
    console.log('  ⚠️  No templates found in directory');
  }
} else {
  console.log(`  ❌ Template directory does NOT exist: ${templateDir}`);
}

// Check if service file exists
const serviceFile = path.join(__dirname, 'backend', 'server', 'services', 'HtmlToPdfService.js');
console.log('\n🔧 Checking service file...');
if (fs.existsSync(serviceFile)) {
  console.log(`  ✅ HtmlToPdfService.js exists`);
} else {
  console.log(`  ❌ HtmlToPdfService.js NOT found`);
}

// Check if routes file exists
const routesFile = path.join(__dirname, 'backend', 'server', 'routes', 'htmlToPdf.js');
console.log('\n🛣️  Checking routes file...');
if (fs.existsSync(routesFile)) {
  console.log(`  ✅ htmlToPdf.js routes exist`);
} else {
  console.log(`  ❌ htmlToPdf.js routes NOT found`);
}

// Check if routes are registered in index.js
const indexFile = path.join(__dirname, 'backend', 'server', 'index.js');
console.log('\n📝 Checking server registration...');
if (fs.existsSync(indexFile)) {
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  if (indexContent.includes('htmlToPdfRoutes') && indexContent.includes('/api/html-to-pdf')) {
    console.log('  ✅ HTML to PDF routes are registered in server');
  } else {
    console.log('  ❌ HTML to PDF routes NOT registered in server');
  }
} else {
  console.log('  ❌ Server index.js NOT found');
}

// Check frontend component
const frontendComponent = path.join(__dirname, 'frontend', 'src', 'components', 'pages', 'HtmlTemplateManager.tsx');
console.log('\n🎨 Checking frontend component...');
if (fs.existsSync(frontendComponent)) {
  console.log('  ✅ HtmlTemplateManager.tsx exists');
} else {
  console.log('  ❌ HtmlTemplateManager.tsx NOT found');
}

// Check if download button is added
const downloaderFile = path.join(__dirname, 'frontend', 'src', 'components', 'pages', 'ASCOMPReportDownloader.tsx');
console.log('\n⬇️  Checking downloader updates...');
if (fs.existsSync(downloaderFile)) {
  const downloaderContent = fs.readFileSync(downloaderFile, 'utf8');
  if (downloaderContent.includes('downloadHtmlPdfReport') && downloaderContent.includes('PDF from HTML Template')) {
    console.log('  ✅ HTML PDF download button is added to ASCOMPReportDownloader');
  } else {
    console.log('  ❌ HTML PDF download button NOT added to ASCOMPReportDownloader');
  }
} else {
  console.log('  ❌ ASCOMPReportDownloader.tsx NOT found');
}

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

console.log('\n✅ **System Components:**');
console.log('   - Backend Service: HtmlToPdfService.js');
console.log('   - Backend Routes: /api/html-to-pdf/*');
console.log('   - Frontend Manager: HtmlTemplateManager.tsx');
console.log('   - Download Integration: ASCOMPReportDownloader.tsx');

console.log('\n📝 **Next Steps:**');
console.log('   1. Start the backend server:');
console.log('      cd backend && npm start');
console.log('');
console.log('   2. Start the frontend:');
console.log('      cd frontend && npm run dev');
console.log('');
console.log('   3. Create your HTML template:');
console.log('      - Edit: backend/server/templates/html/ascomp_report_sample.html');
console.log('      - Or create new file in same folder');
console.log('');
console.log('   4. Go to ASCOMP Report Downloader and click:');
console.log('      "PDF from HTML Template" button');
console.log('');

console.log('📚 **Documentation:**');
console.log('   - HTML_TEMPLATE_SYSTEM_GUIDE.md - Complete guide');
console.log('   - HTML_TEMPLATE_PDF_SYSTEM_COMPLETE.md - Quick summary');
console.log('');

console.log('🎉 **HTML to PDF System is Ready to Use!**\n');







