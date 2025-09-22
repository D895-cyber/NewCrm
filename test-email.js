const emailService = require('./backend/server/services/emailService');

async function testEmail() {
  console.log('🧪 Testing email service...');
  
  try {
    // Test email service
    const testEmail = 'chiraggulati416@gmail.com'; // Use the same email as SMTP_USER
    const success = await emailService.testEmailService(testEmail);
    
    if (success) {
      console.log('✅ Email test successful! Check your inbox.');
    } else {
      console.log('❌ Email test failed. Check the logs above for details.');
    }
  } catch (error) {
    console.error('❌ Error testing email:', error.message);
  }
}

testEmail();
