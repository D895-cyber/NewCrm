// Comprehensive Email Issue Diagnosis
// Run this with: node diagnose-email-issue.js

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

// Try to load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', 'server', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Comprehensive Email Issue Diagnosis\n');

// 1. Check Environment Variables
console.log('1️⃣ Environment Variables Check:');
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);

// 2. Test Email Service Initialization
console.log('\n2️⃣ Email Service Initialization Test:');

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('❌ Email service will be DISABLED - missing SMTP credentials');
  console.log('📝 Create backend/server/.env with your email configuration');
} else {
  console.log('✅ SMTP credentials found');
  
  // Test SMTP connection
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
    } else {
      console.log('✅ SMTP connection successful');
    }
  });
}

// 3. Check FSE Email Preferences
console.log('\n3️⃣ FSE Email Preferences Check:');

if (process.env.MONGODB_URI) {
  // FSE Schema
  const fseSchema = new mongoose.Schema({
    name: String,
    email: String,
    emailPreferences: {
      assignmentNotifications: { type: Boolean, default: true },
      updateNotifications: { type: Boolean, default: true },
      completionNotifications: { type: Boolean, default: true },
      dailyReminders: { type: Boolean, default: true }
    }
  });

  const FSE = mongoose.model('FSE', fseSchema);

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB');
      
      const fses = await FSE.find({});
      console.log(`📊 Found ${fses.length} FSEs in database`);

      if (fses.length === 0) {
        console.log('❌ No FSEs found in database');
        return;
      }

      // Check each FSE
      let fsesWithEmail = 0;
      let fsesWithAssignmentNotifications = 0;

      fses.forEach((fse, index) => {
        console.log(`\n👤 FSE ${index + 1}: ${fse.name}`);
        console.log(`   Email: ${fse.email || '❌ No email'}`);
        console.log(`   Assignment Notifications: ${fse.emailPreferences?.assignmentNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (fse.email) fsesWithEmail++;
        if (fse.email && fse.emailPreferences?.assignmentNotifications !== false) {
          fsesWithAssignmentNotifications++;
        }
      });

      console.log(`\n📋 Summary:`);
      console.log(`   Total FSEs: ${fses.length}`);
      console.log(`   FSEs with email: ${fsesWithEmail}`);
      console.log(`   FSEs with assignment notifications: ${fsesWithAssignmentNotifications}`);

      if (fsesWithAssignmentNotifications === 0) {
        console.log('\n❌ No FSEs have assignment notifications enabled!');
        console.log('This is why emails are not being sent.');
      }

      await mongoose.disconnect();
    })
    .catch(error => {
      console.log('❌ MongoDB connection failed:', error.message);
    });
} else {
  console.log('❌ MONGODB_URI not found, cannot check FSE preferences');
}

// 4. Test Email Sending
console.log('\n4️⃣ Email Sending Test:');

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const testEmail = process.env.SMTP_USER;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: testEmail,
    subject: '🧪 Email Test - Projector Care System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Email Test Successful!</h2>
        <p>This is a test email from the Projector Care Management System.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || 587}</p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Failed to send test email:', error.message);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📬 Check your inbox for the test email');
    }
  });
} else {
  console.log('❌ Cannot test email sending - SMTP credentials missing');
}

console.log('\n📋 Diagnosis Complete!');
console.log('\n🔧 Common Solutions:');
console.log('1. Create backend/server/.env with SMTP credentials');
console.log('2. For Gmail: Use App Password, not regular password');
console.log('3. Enable 2-factor authentication for Gmail');
console.log('4. Check FSE email preferences in database');
console.log('5. Restart backend server after making changes');

