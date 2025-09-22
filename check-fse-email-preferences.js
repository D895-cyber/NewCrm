// Check FSE Email Preferences
// Run this with: node check-fse-email-preferences.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/server/.env' });

// FSE Schema (simplified)
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

async function checkFSEEmailPreferences() {
  try {
    console.log('🔍 Checking FSE Email Preferences...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all FSEs
    const fses = await FSE.find({});
    console.log(`📊 Found ${fses.length} FSEs in database\n`);

    if (fses.length === 0) {
      console.log('❌ No FSEs found in database');
      return;
    }

    // Check each FSE
    fses.forEach((fse, index) => {
      console.log(`👤 FSE ${index + 1}: ${fse.name}`);
      console.log(`   Email: ${fse.email || '❌ No email'}`);
      console.log(`   Assignment Notifications: ${fse.emailPreferences?.assignmentNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Update Notifications: ${fse.emailPreferences?.updateNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Completion Notifications: ${fse.emailPreferences?.completionNotifications !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Daily Reminders: ${fse.emailPreferences?.dailyReminders !== false ? '✅ Enabled' : '❌ Disabled'}`);
      console.log('');
    });

    // Summary
    const fsesWithEmail = fses.filter(fse => fse.email);
    const fsesWithAssignmentNotifications = fses.filter(fse => 
      fse.email && fse.emailPreferences?.assignmentNotifications !== false
    );

    console.log('📋 Summary:');
    console.log(`   Total FSEs: ${fses.length}`);
    console.log(`   FSEs with email: ${fsesWithEmail.length}`);
    console.log(`   FSEs with assignment notifications enabled: ${fsesWithAssignmentNotifications.length}`);

    if (fsesWithAssignmentNotifications.length === 0) {
      console.log('\n❌ No FSEs have assignment notifications enabled!');
      console.log('This is why emails are not being sent.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkFSEEmailPreferences();
