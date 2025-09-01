#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of files to fix with their specific issues
const filesToFix = [
  {
    file: 'src/components/pages/FSEPage.tsx',
    fixes: [
      { from: 'import { Upload, Camera, TrendingUp } from "lucide-react";', to: '' },
      { from: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";', to: '' }
    ]
  },
  {
    file: 'src/components/pages/ServiceRecommendationsPage.tsx',
    fixes: [
      { from: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";', to: '' },
      { from: 'import { Badge } from "../ui/badge";', to: '' },
      { from: 'Tool,', to: '' }
    ]
  },
  {
    file: 'src/components/pages/ServiceVisitsPage.tsx',
    fixes: [
      { from: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";', to: '' },
      { from: 'Stop', to: '' }
    ]
  }
];

console.log('🔧 Starting to fix critical TypeScript issues...');

filesToFix.forEach(({ file, fixes }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      fixes.forEach(fix => {
        content = content.replace(fix.from, fix.to);
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.log(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('🎉 Critical fixes completed!');
console.log('📝 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Start the backend server: cd server && npm start');
console.log('3. Test the application with real data'); 