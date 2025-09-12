#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual fixes for specific files
const manualFixes = [
  {
    file: 'src/components/pages/ReportsPage.tsx',
    fix: (content) => {
      return content
        .replace(/import \{ [^}]*Globe[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*Zap[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*AreaChart[^}]* \} from "recharts";/g, '')
        .replace(/import \{ [^}]*Area[^}]* \} from "recharts";/g, '')
        .replace(/import \{ [^}]*BarChart[^}]* \} from "recharts";/g, '')
        .replace(/import \{ [^}]*Bar[^}]* \} from "recharts";/g, '')
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/{\s*,/g, '{') // Remove leading commas
        .replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n?/g, ''); // Remove empty imports
    }
  },
  {
    file: 'src/components/pages/ServiceReportsAnalysisPage.tsx',
    fix: (content) => {
      return content
        .replace(/import \{ [^}]*Search[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*Filter[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*TrendingUp[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*Settings[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*FileSpreadsheet[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*Printer[^}]* \} from "lucide-react";/g, '')
        .replace(/import \{ [^}]*Tabs[^}]* \} from "\.\.\/ui\/tabs";/g, '')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*}/g, '}')
        .replace(/{\s*,/g, '{')
        .replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n?/g, '');
    }
  }
];

console.log('🔧 Starting safe import fixes...');

manualFixes.forEach(({ file, fix }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = fix(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('🎉 Safe import fixes completed!');
