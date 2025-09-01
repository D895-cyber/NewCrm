#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files with unused imports to fix
const filesToClean = [
  {
    file: 'src/components/pages/PurchaseOrdersPage.tsx',
    removeImports: [
      'Card, CardContent, CardDescription, CardHeader, CardTitle',
      'Button',
      'Filter',
      'FileText',
      'User',
      'Phone',
      'Mail',
      'Building',
      'RefreshCw'
    ]
  },
  {
    file: 'src/components/pages/RMAPage.tsx',
    removeImports: [
      'Card, CardContent, CardDescription, CardHeader, CardTitle',
      'Filter',
      'Calendar',
      'User',
      'Truck',
      'ClipboardCheck'
    ]
  },
  {
    file: 'src/components/pages/ServicePlanningPage.tsx',
    removeImports: [
      'Filter',
      'CheckCircle',
      'Clock',
      'AlertTriangle',
      'XCircle',
      'Package',
      'Truck',
      'ClipboardCheck',
      'CalendarDays',
      'RefreshCw'
    ]
  },
  {
    file: 'src/components/pages/ServiceRecommendationsPage.tsx',
    removeImports: [
      'Filter',
      'Trash2',
      'RotateCcw',
      'CheckCircle',
      'Clock',
      'Box',
      'MapPin',
      'RefreshCw',
      'Wrench',
      'FileText',
      'Star',
      'Shield',
      'Settings',
      'Square'
    ]
  },
  {
    file: 'src/components/pages/ReportsPage.tsx',
    removeImports: [
      'Globe',
      'Zap',
      'AreaChart',
      'Area',
      'BarChart',
      'Bar'
    ]
  },
  {
    file: 'src/components/pages/ServiceReportsAnalysisPage.tsx',
    removeImports: [
      'Search',
      'Filter',
      'TrendingUp',
      'FilterIcon',
      'Settings',
      'FileSpreadsheet',
      'Printer',
      'Tabs, TabsContent, TabsList, TabsTrigger'
    ]
  },
  {
    file: 'src/components/pages/SitesPage.tsx',
    removeImports: [
      'Card, CardContent, CardDescription, CardHeader, CardTitle',
      'Button',
      'Badge',
      'Filter',
      'Calendar',
      'FileText',
      'ExternalLink'
    ]
  },
  {
    file: 'src/components/pages/SparePartsPage.tsx',
    removeImports: [
      'Card, CardContent, CardDescription, CardHeader, CardTitle',
      'Button',
      'Badge',
      'Filter',
      'User'
    ]
  },
  {
    file: 'src/components/pages/UserManagementPage.tsx',
    removeImports: [
      'Edit',
      'Shield',
      'Mail',
      'Phone',
      'Wrench',
      'CheckCircle',
      'AlertTriangle'
    ]
  },
  {
    file: 'src/components/pages/SentimentPage.tsx',
    removeImports: [
      'Card, CardContent, CardDescription, CardHeader, CardTitle',
      'Badge',
      'Button'
    ]
  },
  {
    file: 'src/components/pages/SettingsPage.tsx',
    removeImports: [
      'Users',
      'FileText',
      'Calendar',
      'Upload'
    ]
  },
  {
    file: 'src/components/SmartPOForm.tsx',
    removeImports: [
      'CheckCircle',
      'Clock',
      'Calendar',
      'User',
      'Phone',
      'Mail'
    ]
  },
  {
    file: 'src/components/TopPerformingPrompts.tsx',
    removeImports: [
      'Progress',
      'Button'
    ]
  }
];

console.log('🧹 Starting comprehensive import cleanup...');

filesToClean.forEach(({ file, removeImports }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    removeImports.forEach(importToRemove => {
      const importRegex = new RegExp(`\\b${importToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      if (content.includes(importToRemove)) {
        content = content.replace(importRegex, '');
        modified = true;
        console.log(`✅ Removed: ${importToRemove} from ${file}`);
      }
    });

    // Clean up empty import lines and trailing commas
    content = content
      .replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n?/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/{\s*,/g, '{')
      .replace(/{\s*}/g, '');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('🎉 Import cleanup completed!');
