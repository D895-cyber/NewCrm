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
const requiredFiles = [
  'manifest.json',
  'pwa.js',
  'sw.js',
  'christie.svg',
  'index.html'
];

console.log('🔍 Verifying build output...');
console.log('📁 Dist path:', distPath);

let allFilesExist = true;
const missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is MISSING`);
    missingFiles.push(file);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ Build verification failed!');
  console.error('Missing files:', missingFiles.join(', '));
  console.error('\nTrying to copy files from public folder...');
  
  // Try to copy missing files from public folder
  const publicPath = path.join(__dirname, '../public');
  
  for (const file of missingFiles) {
    const sourcePath = path.join(publicPath, file);
    const destPath = path.join(distPath, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file} from public to dist`);
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
      }
    } else {
      console.error(`❌ Source file ${file} not found in public folder`);
    }
  }
  
  // Verify again after copying
  console.log('\n🔍 Re-verifying after copy...');
  let stillMissing = [];
  for (const file of missingFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} now exists`);
    } else {
      stillMissing.push(file);
    }
  }
  
  if (stillMissing.length > 0) {
    console.error('\n❌ Some files are still missing:', stillMissing.join(', '));
    process.exit(1);
  } else {
    console.log('\n✅ All files are now present!');
  }
} else {
  console.log('\n✅ Build verification passed! All required files are present.');
}

