// Check Email Issue with Correct Configuration
// Run this with: node check-email-issue.js

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', 'server', '.env') });

console.log('🔍 Checking Email Issue with Correct Configuration\n');

// 1. Verify Environment Variables
console.log('1️⃣ Environment Variables Check:');
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);

// 2. Test SMTP Connection
console.log('\n2️⃣ SMTP Connection Test:');

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

  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ SMTP connection failed:', error.message);
      console.log('   Error code:', error.code);
      
      if (error.code === 'EAUTH') {
        console.log('\n🔐 Authentication failed. Possible issues:');
        console.log('1. App Password might be incorrect');
        console.log('2. 2-factor authentication might be disabled');
        console.log('3. "Less secure app access" might be disabled');
      }
    } else {
      console.log('✅ SMTP connection successful!');
      console.log('📧 Email service is ready');
    }
  });
} else {
  console.log('❌ SMTP credentials missing');
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
      let fsesWithoutEmail = [];

      console.log('\n👥 FSE Details:');
      fses.forEach((fse, index) => {
        console.log(`\n   FSE ${index + 1}: ${fse.name}`);
        console.log(`   Email: ${fse.email || '❌ No email'}`);
        console.log(`   Assignment Notifications: ${fse.emailPreferences?.assignmentNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (fse.email) {
          fsesWithEmail++;
          if (fse.emailPreferences?.assignmentNotifications !== false) {
            fsesWithAssignmentNotifications++;
          }
        } else {
          fsesWithoutEmail.push(fse.name);
        }
      });

      console.log(`\n📋 Summary:`);
      console.log(`   Total FSEs: ${fses.length}`);
      console.log(`   FSEs with email: ${fsesWithEmail}`);
      console.log(`   FSEs with assignment notifications: ${fsesWithAssignmentNotifications}`);

      if (fsesWithoutEmail.length > 0) {
        console.log(`\n❌ FSEs without email addresses:`);
        fsesWithoutEmail.forEach(name => console.log(`   - ${name}`));
      }

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
  console.log('❌ MONGODB_URI not found');
}

// 4. Test Email Sending
console.log('\n4️⃣ Test Email Sending:');

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
}

console.log('\n📋 Next Steps:');
console.log('1. Check if FSEs have valid email addresses');
console.log('2. Check if FSEs have assignment notifications enabled');
console.log('3. Test email sending with the test above');
console.log('4. Check server logs when assigning services');
