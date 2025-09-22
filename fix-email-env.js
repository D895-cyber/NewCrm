// Fix Email Environment Loading
// Run this with: node fix-email-env.js

const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing Email Environment Loading\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'backend', 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at backend/server/.env');
  console.log('📝 Please create the .env file with your email configuration');
  process.exit(1);
}

console.log('✅ .env file found at backend/server/.env');

// Load environment variables
require('dotenv').config({ path: envPath });

// Check if SMTP variables are loaded
console.log('\n📧 Checking SMTP configuration:');
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n❌ SMTP credentials are missing from .env file');
  console.log('📝 Please add these lines to your .env file:');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-app-password');
  process.exit(1);
}

console.log('\n✅ SMTP credentials are properly configured');

// Test email service initialization
console.log('\n🧪 Testing email service initialization...');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP connection failed:', error.message);
    console.log('\n🔐 Common issues:');
    console.log('1. Wrong email or password');
    console.log('2. For Gmail: Use App Password, not regular password');
    console.log('3. Enable 2-factor authentication first');
  } else {
    console.log('✅ SMTP connection successful!');
    console.log('📧 Email service is ready to send emails');
    
    console.log('\n🎉 Email configuration is working correctly!');
    console.log('📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Assign a service to an engineer');
    console.log('3. Check server logs for email sending confirmation');
  }
});
