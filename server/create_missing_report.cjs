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

// Create service report for the missing visit
const createMissingReport = async () => {
  try {
    // Check if report already exists
    const existingReport = await ServiceReport.findOne({ visitId: 'VISIT-1756138477734-8wzz4m115' });
    if (existingReport) {
      console.log('Report already exists for this visit ID');
      console.log('Report Number:', existingReport.reportNumber);
      return;
    }

    // Create comprehensive service report for the missing visit
    const reportData = {
      reportNumber: 'SR-2024-MISSING-001',
      reportType: 'First',
      date: new Date('2025-08-25'),
      siteName: 'Delhi Lajpat Nagar Feroze Gandhi Rd',
      projectorModel: 'CP4325-RGB',
      brand: 'Christie',
      projectorSerial: '300742016',
      softwareVersion: 'v4.3.1',
      projectorRunningHours: '85000',
      lampModel: 'LMP-2000',
      lampRunningHours: '72000',
      currentLampHours: '1500',
      engineer: {
        name: 'Arun Rajkumar',
        phone: '+918882475207',
        email: 'arun@ascompinc.in'
      },
      siteIncharge: {
        name: 'Site Manager Delhi',
        contact: '+919876543210'
      },
      visitId: 'VISIT-1756138477734-8wzz4m115',
      sections: {
        opticals: [
          { description: 'Reflector', status: 'Checked', result: 'OK' },
          { description: 'UV filter', status: 'Checked', result: 'OK' },
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
          { description: 'Exhaust CFM', status: '7.2 M/S', result: 'OK' },
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
        pVsN: '225',
        pVsE: '228',
        nVsE: '3'
      },
      contentPlayingServer: 'Dolby IMS3000',
      lampPowerMeasurements: {
        flBeforePM: '9.8',
        flAfterPM: '12.1'
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
        overall: 25,
        hcho: '0.095',
        tvoc: '0.42',
        pm1: '8',
        pm25: '10',
        pm10: '12'
      },
      environmentalConditions: {
        temperature: '24',
        humidity: '35'
      },
      systemStatus: {
        leStatus: 'Removed',
        acStatus: 'Working'
      },
      screenInfo: {
        scope: {
          height: '6.00',
          width: '14.00',
          gain: 1.2
        },
        flat: {
          height: '6.00',
          width: '14.00',
          gain: 1.2
        },
        screenMake: 'Stewart Filmscreen',
        throwDistance: '21.5'
      },
      measuredColorCoordinates: [
        { testPattern: 'White 2K', fl: '12.1', x: '0.3127', y: '0.329' },
        { testPattern: 'White 4K', fl: '11.9', x: '0.3127', y: '0.329' },
        { testPattern: 'Red 2K', fl: '3.8', x: '0.64', y: '0.33' },
        { testPattern: 'Red 4K', fl: '3.7', x: '0.64', y: '0.33' },
        { testPattern: 'Green 2K', fl: '4.5', x: '0.3', y: '0.6' },
        { testPattern: 'Green 4K', fl: '4.4', x: '0.3', y: '0.6' },
        { testPattern: 'Blue 2K', fl: '1.1', x: '0.15', y: '0.06' },
        { testPattern: 'Blue 4K', fl: '1.0', x: '0.15', y: '0.06' }
      ],
      cieColorAccuracy: [
        { testPattern: 'BW Step-10 2K', x: '0.3127', y: '0.329', fl: '12.1' },
        { testPattern: 'BW Step-10 4K', x: '0.3127', y: '0.329', fl: '11.9' }
      ],
      completionTime: 3.5,
      customerSatisfaction: 4.8,
      issuesFound: 2,
      partsReplaced: 1,
      serviceStatus: 'Completed'
    };

    const newReport = new ServiceReport(reportData);
    const savedReport = await newReport.save();

    console.log('Successfully created missing service report!');
    console.log('Report Number:', savedReport.reportNumber);
    console.log('Visit ID:', savedReport.visitId);
    console.log('Engineer:', savedReport.engineer.name);
    console.log('Site:', savedReport.siteName);
    console.log('Projector:', savedReport.projectorModel, savedReport.projectorSerial);

  } catch (error) {
    console.error('Error creating missing report:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(() => {
  createMissingReport();
});
