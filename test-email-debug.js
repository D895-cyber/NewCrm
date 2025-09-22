// Comprehensive Email Debug Test
// Run this with: node test-email-debug.js

const nodemailer = require('nodemailer');
const path = require('path');

// Try multiple .env file locations
const envPaths = [
  path.join(__dirname, 'backend', 'server', '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, 'backend', '.env')
];

console.log('🔍 Comprehensive Email Debug Test\n');

// Load environment variables from multiple locations
let envLoaded = false;
for (const envPath of envPaths) {
  try {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  } catch (error) {
    console.log(`❌ Could not load from: ${envPath}`);
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found in any location');
  console.log('📝 Please create backend/server/.env with your email configuration');
}

// Check environment variables
console.log('\n📧 Environment Variables Check:');
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);

// Test email service initialization
console.log('\n🧪 Testing Email Service Initialization:');

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('❌ Email service will be DISABLED - missing SMTP credentials');
  console.log('\n📝 To fix this, create backend/server/.env with:');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-app-password');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
} else {
  console.log('✅ SMTP credentials found, testing email service...');
  
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ SMTP connection failed:');
      console.log('   Error:', error.message);
      
      if (error.code === 'EAUTH') {
        console.log('\n🔐 Authentication failed. Common issues:');
        console.log('1. Wrong email or password');
        console.log('2. For Gmail: Use App Password, not regular password');
        console.log('3. Enable 2-factor authentication first');
        console.log('4. Check if "Less secure app access" is enabled');
      } else if (error.code === 'ECONNECTION') {
        console.log('\n🌐 Connection failed. Check:');
        console.log('1. Internet connection');
        console.log('2. SMTP host and port settings');
        console.log('3. Firewall settings');
      }
    } else {
      console.log('✅ SMTP connection successful!');
      console.log('📧 Email service is ready to send emails');
      
      // Test sending an email
      console.log('\n📤 Testing email sending...');
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
  });
}

console.log('\n📋 Next Steps:');
console.log('1. If SMTP credentials are missing, create backend/server/.env');
console.log('2. If authentication fails, check your email/password');
console.log('3. For Gmail, use App Password instead of regular password');
console.log('4. Restart your backend server after making changes');
console.log('5. Test service assignment to see if emails are sent');
