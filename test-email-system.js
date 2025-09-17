#!/usr/bin/env node

/**
 * Email System Test Script
 * 
 * This script tests the email notification system for the flexible service assignment feature.
 * Run this script to verify that email notifications are working correctly.
 * 
 * Usage: node test-email-system.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

async function testEmailSystem() {
  console.log('🧪 Testing Email Notification System...\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email configuration missing!');
    console.log('Please set up your email credentials in backend/.env file:');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASS=your-app-password\n');
    return;
  }

  // Create transporter
  console.log('🔧 Creating Email Transporter...');
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Test connection
  console.log('🔗 Testing SMTP Connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.log('❌ SMTP connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your email credentials');
    console.log('2. Enable 2-factor authentication on Gmail');
    console.log('3. Generate an app password for Gmail');
    console.log('4. Make sure EMAIL_USER and EMAIL_PASS are correct\n');
    return;
  }

  // Test email sending
  console.log('📧 Testing Email Sending...');
  const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
  
  const mailOptions = {
    from: `"ProjectorCare CRM" <${process.env.EMAIL_USER}>`,
    to: testEmail,
    subject: '🧪 Email System Test - ProjectorCare CRM',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email System Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🧪 Email System Test</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">ProjectorCare CRM System</p>
        </div>

        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #059669;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ Test Successful!</h3>
            <p style="color: #065f46; margin: 0;">Your email notification system is working correctly.</p>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e293b; margin: 0 0 20px 0;">📋 Test Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #374151;">Test Time:</strong><br>
                <span style="color: #6b7280;">${new Date().toLocaleString()}</span>
              </div>
              <div>
                <strong style="color: #374151;">Email Service:</strong><br>
                <span style="color: #6b7280;">Gmail SMTP</span>
              </div>
              <div>
                <strong style="color: #374151;">From:</strong><br>
                <span style="color: #6b7280;">${process.env.EMAIL_USER}</span>
              </div>
              <div>
                <strong style="color: #374151;">To:</strong><br>
                <span style="color: #6b7280;">${testEmail}</span>
              </div>
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">🎯 What This Means</h4>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              Your email notification system is ready! FSEs will now receive professional email notifications 
              when they are assigned new service work, when assignments are updated, and when work is completed.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" 
               style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              🚀 Open CRM System
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              This is a test email from ProjectorCare CRM System.<br>
              Email notifications are now fully functional!
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Sent to: ${testEmail}\n`);
    
    console.log('🎉 Email System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email inbox for the test message');
    console.log('2. Create a service assignment in the CRM system');
    console.log('3. Verify that FSEs receive email notifications');
    console.log('4. Test different email templates and scenarios\n');
    
  } catch (error) {
    console.log('❌ Failed to send test email:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Gmail credentials are correct');
    console.log('3. Make sure app password is valid');
    console.log('4. Check Gmail security settings\n');
  }
}

// Run the test
testEmailSystem().catch(console.error);




