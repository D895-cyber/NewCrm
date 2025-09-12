#!/usr/bin/env node

const mongoose = require('mongoose');
const ServiceVisit = require('./server/models/ServiceVisit');

async function fixVisitStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    const visitId = 'VISIT-1757252633970-7y0npc';
    console.log(`\nLooking for visit: ${visitId}`);
    
    const visit = await ServiceVisit.findOne({ visitId });
    if (!visit) {
      console.log('Visit not found');
      return;
    }
    
    console.log('\n=== CURRENT VISIT STATUS ===');
    console.log('Visit ID:', visit.visitId);
    console.log('Status:', visit.status);
    console.log('Workflow Status:', JSON.stringify(visit.workflowStatus, null, 2));
    console.log('Photos count:', visit.photos ? visit.photos.length : 0);
    
    // Update the visit status to Completed
    console.log('\n=== UPDATING VISIT STATUS ===');
    visit.status = 'Completed';
    visit.actualDate = new Date().toISOString().split('T')[0];
    visit.endTime = new Date().toTimeString().slice(0, 5);
    
    // Update workflow status
    if (!visit.workflowStatus) {
      visit.workflowStatus = {};
    }
    visit.workflowStatus.photosCaptured = true;
    visit.workflowStatus.serviceCompleted = true;
    visit.workflowStatus.reportGenerated = true;
    visit.workflowStatus.signatureCaptured = true;
    visit.workflowStatus.completed = true;
    visit.workflowStatus.lastUpdated = new Date();
    
    await visit.save();
    
    console.log('✅ Visit status updated successfully!');
    console.log('New Status:', visit.status);
    console.log('New Workflow Status:', JSON.stringify(visit.workflowStatus, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

fixVisitStatus();
