// Test Email Configuration
// Run this with: node test-email-config.js

require('dotenv').config({ path: './backend/server/.env' });

console.log('🔍 Checking Email Configuration...\n');

// Check environment variables
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT || 587;

console.log('📧 SMTP Configuration:');
console.log(`   SMTP_USER: ${smtpUser ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_PASS: ${smtpPass ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_HOST: ${smtpHost}`);
console.log(`   SMTP_PORT: ${smtpPort}`);

if (!smtpUser || !smtpPass) {
  console.log('\n❌ Email service is DISABLED - SMTP credentials missing');
  console.log('\n📝 To fix this:');
  console.log('1. Create/update backend/server/.env file');
  console.log('2. Add these variables:');
  console.log('   SMTP_USER=your-email@gmail.com');
  console.log('   SMTP_PASS=your-app-password');
  console.log('   SMTP_HOST=smtp.gmail.com');
  console.log('   SMTP_PORT=587');
  console.log('\n🔐 For Gmail, use App Password (not your regular password)');
  console.log('   - Enable 2-factor authentication');
  console.log('   - Generate App Password in Google Account settings');
} else {
  console.log('\n✅ Email service should be ENABLED');
  console.log('\n🧪 To test email functionality:');
  console.log('1. Start your backend server');
  console.log('2. Make a POST request to /api/service-assignments/test-email');
  console.log('3. Include testEmail in the request body');
}

console.log('\n📋 Next steps:');
console.log('1. Check backend/server/.env file exists');
console.log('2. Verify SMTP credentials are correct');
console.log('3. Test email service with test endpoint');
console.log('4. Check FSE email preferences in database');

