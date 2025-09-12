#!/usr/bin/env node

const mongoose = require('mongoose');

// Define the ServiceReport schema directly
const ServiceReportSchema = new mongoose.Schema({
  reportNumber: { type: String, trim: true, required: true },
  reportTitle: { type: String, trim: true, default: 'Projector Service Report' },
  reportType: { type: String, enum: ['First', 'Second', 'Third', 'Fourth', 'Emergency', 'Installation'], default: 'First' },
  date: { type: Date, default: Date.now },
  siteName: { type: String, trim: true, required: true },
  projectorSerial: { type: String, index: true, required: true },
  projectorModel: { type: String, trim: true, required: true },
  brand: { type: String, trim: true, required: true },
  engineer: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  }
});

const ServiceReport = mongoose.model('ServiceReport', ServiceReportSchema);

async function testServiceReportCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    // Test data with all required fields
    const testReportData = {
      reportNumber: `TEST-${Date.now()}`,
      reportTitle: 'Test Service Report',
      reportType: 'First',
      siteName: 'Test Site',
      projectorSerial: 'TEST-SERIAL-001',
      projectorModel: 'Test Model CP2220',
      brand: 'Christie',
      engineer: {
        name: 'Test Engineer',
        phone: '123-456-7890',
        email: 'test@example.com'
      }
    };
    
    console.log('\\nCreating test service report with data:', testReportData);
    
    const newReport = new ServiceReport(testReportData);
    const savedReport = await newReport.save();
    
    console.log('\\n✅ Service report created successfully!');
    console.log('Report ID:', savedReport._id);
    console.log('Report Number:', savedReport.reportNumber);
    console.log('Projector Model:', savedReport.projectorModel);
    console.log('Brand:', savedReport.brand);
    
    // Clean up - delete the test report
    await ServiceReport.findByIdAndDelete(savedReport._id);
    console.log('\\n🧹 Test report cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('\\n❌ Error:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
}

testServiceReportCreation();
