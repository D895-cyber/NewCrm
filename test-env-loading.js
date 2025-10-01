// Test Environment Loading
// Run this with: node test-env-loading.js

const path = require('path');

console.log('🔍 Testing Environment Variable Loading\n');

// Test different .env file locations
const envPaths = [
  path.join(__dirname, 'backend', 'server', '.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), 'backend', 'server', '.env'),
  path.join(process.cwd(), '.env')
];

console.log('📁 Checking .env file locations:');
envPaths.forEach((envPath, index) => {
  const fs = require('fs');
  if (fs.existsSync(envPath)) {
    console.log(`✅ Found .env at: ${envPath}`);
  } else {
    console.log(`❌ Not found: ${envPath}`);
  }
});

console.log('\n🔧 Testing environment loading:');

// Try loading from each location
envPaths.forEach((envPath, index) => {
  try {
    require('dotenv').config({ path: envPath });
    if (process.env.SMTP_USER) {
      console.log(`✅ Environment loaded from: ${envPath}`);
      console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
      console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'Set' : 'Not set'}`);
      console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
      console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Failed to load from: ${envPath}`);
  }
});

console.log('\n📋 Current environment variables:');
console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'Not set'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'Set' : 'Not set'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);

console.log('\n💡 If environment variables are not loaded:');
console.log('1. Make sure .env file exists in backend/server/ directory');
console.log('2. Check that .env file has correct format (KEY=VALUE)');
console.log('3. Restart your backend server after making changes');

