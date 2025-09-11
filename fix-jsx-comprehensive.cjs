#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Comprehensive JSX Fix...\n');

// Fix JSX syntax errors in specific files
function fixJSXComprehensive() {
  const filesToFix = [
    'src/components/pages/FSEDashboardPage.tsx',
    'src/components/pages/FSEPage.tsx',
    'src/components/pages/ServiceManagementPage.tsx'
  ];
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📝 Fixing ${file}...`);
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix the corrupted JSX syntax patterns
      
      // Pattern 1: Fix standalone className attributes
      content = content.replace(/className="([^"]*)" \/>/g, '<div className="$1" />');
      
      // Pattern 2: Fix className attributes that should be part of elements
      content = content.replace(/>\s*className="([^"]*)" \/>/g, ' className="$1" />');
      
      // Pattern 3: Fix any remaining standalone className
      content = content.replace(/\s+className="([^"]*)" \/>/g, ' className="$1" />');
      
      // Pattern 4: Fix specific icon patterns
      content = content.replace(/className="w-4 h-4" \/>/g, '<div className="w-4 h-4" />');
      content = content.replace(/className="w-6 h-6 text-blue-600" \/>/g, '<div className="w-6 h-6 text-blue-600" />');
      content = content.replace(/className="w-6 h-6 text-green-600" \/>/g, '<div className="w-6 h-6 text-green-600" />');
      content = content.replace(/className="w-5 h-5" \/>/g, '<div className="w-5 h-5" />');
      content = content.replace(/className="w-4 h-4 mr-1" \/>/g, '<div className="w-4 h-4 mr-1" />');
      content = content.replace(/className="h-4 w-4" \/>/g, '<div className="h-4 w-4" />');
      content = content.replace(/className="h-5 w-5" \/>/g, '<div className="h-5 w-5" />');
      content = content.replace(/className="h-4 w-4 text-purple-400" \/>/g, '<div className="h-4 w-4 text-purple-400" />');
      content = content.replace(/className="w-6 h-6 text-blue-400" \/>/g, '<div className="w-6 h-6 text-blue-400" />');
      
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed ${file}`);
    }
  });
}

// Run the fix
try {
  fixJSXComprehensive();
  console.log('\n✅ Comprehensive JSX fix completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. If successful, your app is ready for deployment');
  
} catch (error) {
  console.error('❌ Error fixing JSX issues:', error.message);
}





