#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Final JSX Fix - Restoring Proper Syntax...\n');

// Fix JSX syntax errors in specific files
function fixJSXFinal() {
  const filesToFix = [
    'src/components/pages/FSEDashboardPage.tsx',
    'src/components/pages/FSEPage.tsx',
    'src/components/pages/ServiceManagementPage.tsx'
  ];
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📝 Fixing ${file}...`);
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix the corrupted JSX patterns systematically
      
      // Pattern 1: Fix icon elements with corrupted syntax
      // Replace patterns like: <Plus <div <div className="w-4 h-4" />
      // With: <Plus className="w-4 h-4" />
      content = content.replace(/<(\w+)\s+<div\s+<div\s+className="([^"]*)"\s*\/>/g, '<$1 className="$2" />');
      
      // Pattern 2: Fix icon elements with single corrupted div
      // Replace patterns like: <Plus <div className="w-4 h-4" />
      // With: <Plus className="w-4 h-4" />
      content = content.replace(/<(\w+)\s+<div\s+className="([^"]*)"\s*\/>/g, '<$1 className="$2" />');
      
      // Pattern 3: Fix standalone corrupted div elements
      // Replace patterns like: <div <div className="w-4 h-4" />
      // With: <div className="w-4 h-4" />
      content = content.replace(/<div\s+<div\s+className="([^"]*)"\s*\/>/g, '<div className="$1" />');
      
      // Pattern 4: Fix any remaining corrupted patterns
      content = content.replace(/<(\w+)\s+<(\w+)\s+className="([^"]*)"\s*\/>/g, '<$1 className="$3" />');
      
      // Pattern 5: Fix specific icon patterns that should be proper icons
      const iconReplacements = [
        { pattern: /<Plus\s+className="([^"]*)"\s*\/>/, replacement: '<Plus className="$1" />' },
        { pattern: /<Users\s+className="([^"]*)"\s*\/>/, replacement: '<Users className="$1" />' },
        { pattern: /<Wrench\s+className="([^"]*)"\s*\/>/, replacement: '<Wrench className="$1" />' },
        { pattern: /<Star\s+className="([^"]*)"\s*\/>/, replacement: '<Star className="$1" />' },
        { pattern: /<Clock\s+className="([^"]*)"\s*\/>/, replacement: '<Clock className="$1" />' },
        { pattern: /<FileText\s+className="([^"]*)"\s*\/>/, replacement: '<FileText className="$1" />' },
        { pattern: /<Search\s+className="([^"]*)"\s*\/>/, replacement: '<Search className="$1" />' },
        { pattern: /<Eye\s+className="([^"]*)"\s*\/>/, replacement: '<Eye className="$1" />' },
        { pattern: /<Edit\s+className="([^"]*)"\s*\/>/, replacement: '<Edit className="$1" />' },
        { pattern: /<Download\s+className="([^"]*)"\s*\/>/, replacement: '<Download className="$1" />' },
        { pattern: /<Loader2\s+className="([^"]*)"\s*\/>/, replacement: '<Loader2 className="$1" />' },
        { pattern: /<X\s+className="([^"]*)"\s*\/>/, replacement: '<X className="$1" />' },
        { pattern: /<Mail\s+className="([^"]*)"\s*\/>/, replacement: '<Mail className="$1" />' },
        { pattern: /<Phone\s+className="([^"]*)"\s*\/>/, replacement: '<Phone className="$1" />' },
        { pattern: /<Briefcase\s+className="([^"]*)"\s*\/>/, replacement: '<Briefcase className="$1" />' },
        { pattern: /<Award\s+className="([^"]*)"\s*\/>/, replacement: '<Award className="$1" />' },
        { pattern: /<Shield\s+className="([^"]*)"\s*\/>/, replacement: '<Shield className="$1" />' },
        { pattern: /<Building\s+className="([^"]*)"\s*\/>/, replacement: '<Building className="$1" />' },
        { pattern: /<Monitor\s+className="([^"]*)"\s*\/>/, replacement: '<Monitor className="$1" />' },
        { pattern: /<Play\s+className="([^"]*)"\s*\/>/, replacement: '<Play className="$1" />' },
        { pattern: /<LogOut\s+className="([^"]*)"\s*\/>/, replacement: '<LogOut className="$1" />' },
        { pattern: /<Wrench\s+className="([^"]*)"\s*\/>/, replacement: '<Wrench className="$1" />' }
      ];
      
      iconReplacements.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
      });
      
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed ${file}`);
    }
  });
}

// Run the fix
try {
  fixJSXFinal();
  console.log('\n✅ Final JSX fix completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. If successful, your app is ready for deployment');
  console.log('3. If there are still errors, we may need to restore from backup');
  
} catch (error) {
  console.error('❌ Error fixing JSX issues:', error.message);
}




