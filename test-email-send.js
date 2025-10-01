// Test Email Sending
// Run this with: node test-email-send.js

const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/server/.env' });

async function testEmailSending() {
  console.log('🧪 Testing Email Sending...\n');

  // Check if credentials exist
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ SMTP credentials not found in environment variables');
    console.log('Please set SMTP_USER and SMTP_PASS in backend/server/.env');
    return;
  }

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

  // Test email
  const testEmail = process.env.SMTP_USER; // Send to yourself
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

  try {
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your inbox for the test email');
  } catch (error) {
    console.log('❌ Failed to send email:');
    console.log('Error:', error.message);
    
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
  }
}

testEmailSending();

