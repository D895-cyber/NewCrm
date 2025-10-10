const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const ServiceReport = require('../models/ServiceReport');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function backupReports() {
  try {
    console.log(`${colors.blue}📦 Starting backup of old reports...${colors.reset}\n`);
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projector-warranty';
    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);
    
    // Fetch all old reports
    const reports = await ServiceReport.find({}).lean();
    console.log(`${colors.cyan}→ Found ${reports.length} reports to backup${colors.reset}\n`);
    
    // Create backup directory
    const backupDir = path.join(__dirname, '../../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create backup file
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `old-reports-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(reports, null, 2));
    
    console.log(`${colors.green}✓ Backup completed!${colors.reset}`);
    console.log(`${colors.cyan}📁 Backup saved to: ${backupFile}${colors.reset}`);
    console.log(`${colors.cyan}💾 Backup size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB${colors.reset}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error(`${colors.reset}❌ Backup failed:`, error);
    process.exit(1);
  }
}

backupReports();







