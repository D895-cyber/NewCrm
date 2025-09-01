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

// Use the full ServiceReport model from the server
const ServiceReport = require('./models/ServiceReport');

// Sample data for comprehensive reports
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

// Generate comprehensive sample data with full schema
const createFullSampleData = async () => {
  try {
    // Clear existing data
    await ServiceReport.deleteMany({});
    console.log('Cleared existing service reports');

    const sampleReports = [];
    const reportCount = 20; // Create 20 comprehensive reports

    for (let i = 1; i <= reportCount; i++) {
      const fseName = fseNames[Math.floor(Math.random() * fseNames.length)];
      const siteName = sites[Math.floor(Math.random() * sites.length)];
      const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      const date = getRandomDate();
      
      const report = {
        reportNumber: `SR-2024-${String(i).padStart(3, '0')}`,
        reportType,
        date,
        siteName,
        projectorModel: projectorModels[Math.floor(Math.random() * projectorModels.length)],
        brand: 'Christie',
        projectorSerial: `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        softwareVersion: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        projectorRunningHours: Math.floor(Math.random() * 5000) + 1000,
        lampModel: 'LMP-2000',
        lampRunningHours: Math.floor(Math.random() * 2000) + 500,
        currentLampHours: Math.floor(Math.random() * 1000) + 100,
        engineer: {
          name: fseName,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          email: `${fseName.toLowerCase().replace(' ', '.')}@ascompinc.in`
        },
        siteIncharge: {
          name: `Site Manager ${Math.floor(Math.random() * 100)}`,
          contact: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
        },
        sections: {
          opticals: [
            { description: 'Reflector', status: 'Checked', result: 'OK' },
            { description: 'UV filter', status: 'Checked', result: Math.random() > 0.8 ? 'REPLACE' : 'OK' },
            { description: 'Integrator Rod', status: 'Checked', result: 'OK' },
            { description: 'Cold Mirror', status: 'Checked', result: 'OK' },
            { description: 'Fold Mirror', status: 'Checked', result: 'OK' }
          ],
          electronics: [
            { description: 'Touch Panel', status: 'Checked', result: 'OK' },
            { description: 'EVB Board', status: 'Checked', result: 'OK' },
            { description: 'IMCB Board/s', status: 'Checked', result: 'OK' },
            { description: 'PIB Board', status: 'Checked', result: 'OK' },
            { description: 'ICP Board', status: 'Checked', result: 'OK' },
            { description: 'IMB/S Board', status: 'Checked', result: 'OK' }
          ],
          mechanical: [
            { description: 'AC blower and Vane Switch', status: 'Checked', result: 'OK' },
            { description: 'Extractor Vane Switch', status: 'Checked', result: 'OK' },
            { description: 'Exhaust CFM', status: `${(Math.random() * 2 + 6).toFixed(1)} M/S`, result: 'OK' },
            { description: 'Light Engine 4 fans with LAD fan', status: 'Checked', result: 'OK' },
            { description: 'Card Cage Top and Bottom fans', status: 'Checked', result: 'OK' },
            { description: 'Radiator fan and Pump', status: 'Checked', result: 'OK' },
            { description: 'Connector and hose for the Pump', status: 'Checked', result: 'OK' },
            { description: 'Security and lamp house lock switch', status: 'Checked', result: 'OK' },
            { description: 'Lamp LOC Mechanism X, Y and Z movement', status: 'Checked', result: 'OK' }
          ],
          disposableConsumables: [
            { description: 'Air Intake, LAD and RAD', status: 'Replaced', result: 'OK' }
          ],
          coolant: {
            description: 'Level and Color',
            status: 'Checked',
            result: 'OK'
          },
          lightEngineTestPatterns: [
            { description: 'White', status: 'Tested', result: 'OK' },
            { description: 'Red', status: 'Tested', result: 'OK' },
            { description: 'Green', status: 'Tested', result: 'OK' },
            { description: 'Blue', status: 'Tested', result: 'OK' },
            { description: 'Black', status: 'Tested', result: 'OK' }
          ],
          serialNumberVerified: {
            description: 'Chassis label vs Touch Panel',
            status: 'Verified',
            result: 'OK'
          }
        },
        imageEvaluation: {
          focusBoresight: 'Yes',
          integratorPosition: 'Yes',
          spotOnScreen: 'No',
          screenCropping: 'Yes',
          convergenceChecked: 'Yes',
          channelsChecked: 'Yes',
          pixelDefects: 'No',
          imageVibration: 'No',
          liteLoc: 'No'
        },
        voltageParameters: {
          pVsN: `${Math.floor(Math.random() * 10) + 220}`,
          pVsE: `${Math.floor(Math.random() * 10) + 225}`,
          nVsE: `${Math.floor(Math.random() * 5) + 1}`
        },
        contentPlayingServer: 'Dolby IMS3000',
        lampPowerMeasurements: {
          flBeforePM: `${(Math.random() * 3 + 9).toFixed(1)}`,
          flAfterPM: `${(Math.random() * 3 + 12).toFixed(1)}`
        },
        projectorPlacement: 'ok',
        observations: [
          { number: 1, description: 'All optical components in good condition' },
          { number: 2, description: 'Electronics functioning properly' },
          { number: 3, description: 'Mechanical systems operating normally' },
          { number: 4, description: 'Environmental conditions acceptable' },
          { number: 5, description: 'No immediate issues detected' }
        ],
        airPollutionLevel: {
          overall: Math.floor(Math.random() * 20) + 20,
          hcho: (Math.random() * 0.1 + 0.05).toFixed(3),
          tvoc: (Math.random() * 0.5 + 0.3).toFixed(2),
          pm1: Math.floor(Math.random() * 5) + 5,
          pm25: Math.floor(Math.random() * 8) + 8,
          pm10: Math.floor(Math.random() * 10) + 10
        },
        environmentalConditions: {
          temperature: Math.floor(Math.random() * 10) + 20,
          humidity: Math.floor(Math.random() * 20) + 30
        },
        systemStatus: {
          leStatus: 'Removed',
          acStatus: 'Working'
        },
        screenInfo: {
          scope: {
            height: (Math.random() * 2 + 5).toFixed(2),
            width: (Math.random() * 4 + 12).toFixed(2),
            gain: 1.2
          },
          flat: {
            height: (Math.random() * 2 + 5).toFixed(2),
            width: (Math.random() * 4 + 12).toFixed(2),
            gain: 1.2
          },
          screenMake: 'Stewart Filmscreen',
          throwDistance: (Math.random() * 5 + 18).toFixed(1)
        },
        measuredColorCoordinates: [
          { testPattern: 'White 2K', fl: (Math.random() * 2 + 11).toFixed(1), x: '0.3127', y: '0.329' },
          { testPattern: 'White 4K', fl: (Math.random() * 2 + 11).toFixed(1), x: '0.3127', y: '0.329' },
          { testPattern: 'Red 2K', fl: (Math.random() * 2 + 3).toFixed(1), x: '0.64', y: '0.33' },
          { testPattern: 'Red 4K', fl: (Math.random() * 2 + 3).toFixed(1), x: '0.64', y: '0.33' },
          { testPattern: 'Green 2K', fl: (Math.random() * 2 + 4).toFixed(1), x: '0.3', y: '0.6' },
          { testPattern: 'Green 4K', fl: (Math.random() * 2 + 4).toFixed(1), x: '0.3', y: '0.6' },
          { testPattern: 'Blue 2K', fl: (Math.random() * 1 + 1).toFixed(1), x: '0.15', y: '0.06' },
          { testPattern: 'Blue 4K', fl: (Math.random() * 1 + 1).toFixed(1), x: '0.15', y: '0.06' }
        ],
        cieColorAccuracy: [
          { testPattern: 'BW Step-10 2K', x: '0.3127', y: '0.329', fl: (Math.random() * 2 + 11).toFixed(1) },
          { testPattern: 'BW Step-10 4K', x: '0.3127', y: '0.329', fl: (Math.random() * 2 + 11).toFixed(1) }
        ],
        visitId: `VISIT-2024-${String(i).padStart(3, '0')}`,
        completionTime: Math.round((Math.random() * 4 + 2) * 10) / 10,
        customerSatisfaction: Math.round((Math.random() * 2 + 4) * 10) / 10,
        issuesFound: Math.floor(Math.random() * 5),
        partsReplaced: Math.floor(Math.random() * 3),
        serviceStatus: 'Completed'
      };

      sampleReports.push(report);
    }

    // Insert all reports
    await ServiceReport.insertMany(sampleReports);

    console.log(`Created ${reportCount} comprehensive service reports with full schema`);
    console.log('Sample data includes:');
    console.log(`- ${fseNames.length} different FSEs`);
    console.log(`- ${sites.length} different sites`);
    console.log(`- ${reportTypes.length} different service types`);
    console.log('- Complete service checklist sections');
    console.log('- Image evaluation data');
    console.log('- Color measurements');
    console.log('- Environmental data');
    console.log('- All required fields for PDF generation');

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

    console.log('\nFull service reports created successfully!');
    console.log('You can now test the PDF generation with this data.');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(() => {
  createFullSampleData();
});
