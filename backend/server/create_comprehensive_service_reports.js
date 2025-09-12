const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projector-warranty');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Service Report Schema (simplified for sample data)
const serviceReportSchema = new mongoose.Schema({
  reportNumber: { type: String, required: true, unique: true },
  reportType: { type: String, required: true },
  date: { type: Date, default: Date.now },
  siteName: { type: String, required: true },
  projectorModel: { type: String, required: true },
  projectorSerial: { type: String, required: true },
  softwareVersion: String,
  projectorRunningHours: Number,
  lampModel: String,
  lampRunningHours: Number,
  currentLampHours: Number,
  engineer: {
    name: { type: String, required: true },
    phone: String,
    email: String
  },
  completionTime: { type: Number, default: 0 },
  customerSatisfaction: { type: Number, default: 0 },
  issuesFound: { type: Number, default: 0 },
  partsReplaced: { type: Number, default: 0 },
  serviceStatus: { type: String, default: 'Completed' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ServiceReport = mongoose.model('ServiceReport', serviceReportSchema);

// Sample data
const fseNames = [
  'Rajesh Kumar',
  'Amit Singh', 
  'Priya Sharma',
  'Vikram Patel',
  'Neha Gupta',
  'Rahul Verma',
  'Sneha Reddy'
];

const sites = [
  'Cinema Palace',
  'Multiplex Central',
  'Entertainment Hub',
  'Movie World',
  'Cinema Express',
  'Film Center',
  'Theater Zone',
  'Cineplex Mall',
  'Entertainment Center',
  'Movie Palace'
];

const projectorModels = [
  'Barco DP4K-32B',
  'Barco DP4K-23B',
  'Barco DP2K-32B',
  'Barco DP2K-23B',
  'Christie CP4325-RGB',
  'Christie CP4325-RGB',
  'Christie CP4325-RGB'
];

const reportTypes = ['First', 'Second', 'Third', 'Emergency', 'Installation'];

// Generate random date within last 30 days
const getRandomDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
};

// Generate comprehensive sample data
const createComprehensiveSampleData = async () => {
  try {
    // Clear existing data
    await ServiceReport.deleteMany({});
    console.log('Cleared existing service reports');

    const sampleReports = [];
    const reportCount = 50; // Create 50 reports for better analytics

    for (let i = 1; i <= reportCount; i++) {
      const fseName = fseNames[Math.floor(Math.random() * fseNames.length)];
      const siteName = sites[Math.floor(Math.random() * sites.length)];
      const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      const date = getRandomDate();
      
      // Generate realistic metrics based on report type
      let completionTime, customerSatisfaction, issuesFound, partsReplaced;
      
      switch (reportType) {
        case 'Emergency':
          completionTime = 3.5 + Math.random() * 2; // 3.5-5.5 hours
          customerSatisfaction = 4.0 + Math.random() * 1; // 4.0-5.0
          issuesFound = Math.floor(Math.random() * 5) + 3; // 3-7 issues
          partsReplaced = Math.floor(Math.random() * 3) + 1; // 1-3 parts
          break;
        case 'First':
          completionTime = 2.0 + Math.random() * 1.5; // 2.0-3.5 hours
          customerSatisfaction = 4.5 + Math.random() * 0.5; // 4.5-5.0
          issuesFound = Math.floor(Math.random() * 3) + 1; // 1-3 issues
          partsReplaced = Math.floor(Math.random() * 2); // 0-1 parts
          break;
        case 'Second':
          completionTime = 2.5 + Math.random() * 1.5; // 2.5-4.0 hours
          customerSatisfaction = 4.3 + Math.random() * 0.7; // 4.3-5.0
          issuesFound = Math.floor(Math.random() * 4) + 1; // 1-4 issues
          partsReplaced = Math.floor(Math.random() * 2) + 1; // 1-2 parts
          break;
        case 'Third':
          completionTime = 3.0 + Math.random() * 1.5; // 3.0-4.5 hours
          customerSatisfaction = 4.2 + Math.random() * 0.8; // 4.2-5.0
          issuesFound = Math.floor(Math.random() * 5) + 2; // 2-6 issues
          partsReplaced = Math.floor(Math.random() * 3) + 1; // 1-3 parts
          break;
        case 'Installation':
          completionTime = 4.0 + Math.random() * 2; // 4.0-6.0 hours
          customerSatisfaction = 4.8 + Math.random() * 0.2; // 4.8-5.0
          issuesFound = Math.floor(Math.random() * 2); // 0-1 issues
          partsReplaced = Math.floor(Math.random() * 2); // 0-1 parts
          break;
        default:
          completionTime = 2.5 + Math.random() * 1.5;
          customerSatisfaction = 4.5 + Math.random() * 0.5;
          issuesFound = Math.floor(Math.random() * 3) + 1;
          partsReplaced = Math.floor(Math.random() * 2);
      }

      const report = {
        reportNumber: `SR-2024-${String(i).padStart(3, '0')}`,
        reportType,
        date,
        siteName,
        projectorModel: projectorModels[Math.floor(Math.random() * projectorModels.length)],
        projectorSerial: `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        softwareVersion: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        projectorRunningHours: Math.floor(Math.random() * 5000) + 1000,
        lampModel: 'LMP-2000',
        lampRunningHours: Math.floor(Math.random() * 2000) + 500,
        currentLampHours: Math.floor(Math.random() * 1000) + 100,
        engineer: {
          name: fseName,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          email: `${fseName.toLowerCase().replace(' ', '.')}@company.com`
        },
        completionTime: Math.round(completionTime * 10) / 10,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
        issuesFound,
        partsReplaced,
        serviceStatus: 'Completed'
      };

      sampleReports.push(report);
    }

    // Insert all reports
    await ServiceReport.insertMany(sampleReports);

    console.log(`Created ${reportCount} comprehensive sample service reports`);
    console.log('Sample data includes:');
    console.log(`- ${fseNames.length} different FSEs`);
    console.log(`- ${sites.length} different sites`);
    console.log(`- ${reportTypes.length} different service types`);
    console.log('- Realistic completion times, satisfaction scores, and issue counts');
    console.log('- Data spread over the last 30 days');

    // Show some statistics
    const stats = await ServiceReport.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          avgCompletionTime: { $avg: '$completionTime' },
          avgSatisfaction: { $avg: '$customerSatisfaction' },
          totalIssues: { $sum: '$issuesFound' }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log('\nGenerated Data Statistics:');
      console.log(`- Total Reports: ${stats[0].totalReports}`);
      console.log(`- Average Completion Time: ${Math.round(stats[0].avgCompletionTime * 10) / 10} hours`);
      console.log(`- Average Customer Satisfaction: ${Math.round(stats[0].avgSatisfaction * 10) / 10}/5`);
      console.log(`- Total Issues Found: ${stats[0].totalIssues}`);
    }

    console.log('\nComprehensive sample service reports created successfully!');
    console.log('You can now test the FSE analytics dashboard with this data.');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(() => {
  createComprehensiveSampleData();
});

