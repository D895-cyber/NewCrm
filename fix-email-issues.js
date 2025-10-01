// Fix Email Issues
// Run this with: node fix-email-issues.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/server/.env' });

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

async function fixEmailIssues() {
  try {
    console.log('🔧 Fixing Email Issues...\n');

    // 1. Check if .env file exists
    const envPath = path.join(__dirname, 'backend', 'server', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found at backend/server/.env');
      console.log('📝 Creating .env file with email configuration...');
      
      const envContent = `# Email Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com

# Other environment variables...
MONGODB_URI=${process.env.MONGODB_URI || 'mongodb://localhost:27017/projector_care'}
JWT_SECRET=${process.env.JWT_SECRET || 'your-jwt-secret'}
PORT=${process.env.PORT || 4000}
`;

      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file');
      console.log('📝 Please update the email credentials in backend/server/.env');
    } else {
      console.log('✅ .env file exists');
    }

    // 2. Connect to MongoDB and fix FSE email preferences
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      // Update all FSEs to have email notifications enabled
      const result = await FSE.updateMany(
        {},
        {
          $set: {
            'emailPreferences.assignmentNotifications': true,
            'emailPreferences.updateNotifications': true,
            'emailPreferences.completionNotifications': true,
            'emailPreferences.dailyReminders': true
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} FSEs with email preferences`);

      // Check FSEs without email
      const fsesWithoutEmail = await FSE.find({ email: { $exists: false } });
      if (fsesWithoutEmail.length > 0) {
        console.log(`⚠️ Found ${fsesWithoutEmail.length} FSEs without email addresses:`);
        fsesWithoutEmail.forEach(fse => {
          console.log(`   - ${fse.name} (ID: ${fse._id})`);
        });
        console.log('📝 Please add email addresses to these FSEs');
      }

      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } else {
      console.log('⚠️ MONGODB_URI not found, skipping database fixes');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Update email credentials in backend/server/.env');
    console.log('2. For Gmail: Use App Password (not regular password)');
    console.log('3. Restart your backend server');
    console.log('4. Test email functionality');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixEmailIssues();

