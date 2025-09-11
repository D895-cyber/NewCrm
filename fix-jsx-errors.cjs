#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing JSX Syntax Errors...\n');

// Fix JSX syntax errors in specific files
function fixJSXErrors() {
  const filesToFix = [
    'src/components/pages/FSEDashboardPage.tsx',
    'src/components/pages/FSEPage.tsx',
    'src/components/pages/ServiceManagementPage.tsx'
  ];
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📝 Fixing ${file}...`);
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix the corrupted JSX syntax
      // Replace <className= with className=
      content = content.replace(/<className=/g, 'className=');
      
      // Fix any remaining JSX issues
      content = content.replace(/<(\w+)\s+className=/g, '<$1 className=');
      
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed ${file}`);
    }
  });
}

// Run the fix
try {
  fixJSXErrors();
  console.log('\n✅ JSX syntax errors fixed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. If successful, your app is ready for deployment');
  
} catch (error) {
  console.error('❌ Error fixing JSX issues:', error.message);
}





