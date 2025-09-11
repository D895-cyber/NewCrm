#!/usr/bin/env node

const mongoose = require('mongoose');

// Define the schema directly to avoid import issues
const serviceVisitSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  fseId: String,
  fseName: String,
  siteId: String,
  siteName: String,
  projectorSerial: String,
  visitType: String,
  scheduledDate: Date,
  actualDate: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: 'Scheduled' },
  priority: String,
  description: String,
  workPerformed: String,
  totalCost: { type: Number, default: 0 },
  partsUsed: [Object],
  photos: [Object],
  issuesFound: [Object],
  recommendations: [Object],
  workflowStatus: {
    photosCaptured: { type: Boolean, default: false },
    serviceCompleted: { type: Boolean, default: false },
    reportGenerated: { type: Boolean, default: false },
    signatureCaptured: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ServiceVisit = mongoose.model('ServiceVisit', serviceVisitSchema);

async function fixVisitStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
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
    visit.workflowStatus.photosCaptured = true;
    visit.workflowStatus.serviceCompleted = true;
    visit.workflowStatus.reportGenerated = true;
    visit.workflowStatus.signatureCaptured = true;
    visit.workflowStatus.completed = true;
    visit.workflowStatus.lastUpdated = new Date();
    
    visit.updatedAt = new Date();
    
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

fixVisitStatus();
