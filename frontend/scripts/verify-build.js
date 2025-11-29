#!/usr/bin/env node
/**
 * Post-build verification script
 * Ensures all required PWA files are present in the dist folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist');
const publicPath = path.join(__dirname, '../public');

// Critical files that must exist
const criticalFiles = ['index.html'];

// PWA files that should exist but won't fail build if missing
const pwaFiles = ['manifest.json', 'pwa.js', 'sw.js', 'christie.svg'];

console.log('🔍 Verifying build output...');
console.log('📁 Dist path:', distPath);
console.log('📁 Public path:', publicPath);

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder does not exist! Build may have failed.');
  process.exit(1);
}

let hasErrors = false;
const missingCritical = [];
const missingPWA = [];

// Check critical files
for (const file of criticalFiles) {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Critical file missing: ${file}`);
    missingCritical.push(file);
    hasErrors = true;
  } else {
    console.log(`✅ ${file} exists`);
  }
}

// Check PWA files
for (const file of pwaFiles) {
  const filePath = path.join(distPath, file);
  const publicFilePath = path.join(publicPath, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists in dist`);
  } else if (fs.existsSync(publicFilePath)) {
    // Try to copy from public
    try {
      // Ensure dist directory exists
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      fs.copyFileSync(publicFilePath, filePath);
      console.log(`✅ Copied ${file} from public to dist`);
    } catch (error) {
      console.warn(`⚠️  Could not copy ${file}: ${error.message}`);
      missingPWA.push(file);
    }
  } else {
    console.warn(`⚠️  ${file} not found in dist or public (optional)`);
    missingPWA.push(file);
  }
}

// Only fail if critical files are missing
if (hasErrors) {
  console.error('\n❌ Build verification failed! Critical files missing:', missingCritical.join(', '));
  process.exit(1);
}

if (missingPWA.length > 0) {
  console.warn(`\n⚠️  Some PWA files are missing (non-critical): ${missingPWA.join(', ')}`);
  console.warn('   These files are optional and won\'t prevent the app from running.');
} else {
  console.log('\n✅ Build verification passed! All files are present.');
}

