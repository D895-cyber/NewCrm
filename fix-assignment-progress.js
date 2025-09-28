const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Service Assignment Schema (copy from the model)
const serviceAssignmentSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  fseId: String,
  fseName: String,
  fsePhone: String,
  fseEmail: String,
  siteId: String,
  siteName: String,
  siteAddress: String,
  projectors: [{
    projectorId: String,
    projectorSerial: String,
    projectorModel: String,
    auditorium: String,
    serviceType: String,
    priority: String,
    estimatedDuration: Number,
    notes: String,
    status: { type: String, default: 'Scheduled' },
    completedAt: Date
  }],
  schedulingType: String,
  schedulingOptions: {
    totalDays: Number,
    projectorsPerDay: Number,
    preferredDays: [String],
    timeSlots: [{
      startTime: String,
      endTime: String,
      day: String
    }]
  },
  generatedSchedule: [{
    day: Number,
    date: Date,
    projectors: [{
      projectorId: String,
      projectorSerial: String,
      projectorModel: String,
      auditorium: String,
      serviceType: String,
      priority: String,
      estimatedDuration: Number,
      notes: String,
      status: { type: String, default: 'Scheduled' },
      completedAt: Date,
      timeSlot: {
        start: String,
        end: String
      }
    }],
    totalEstimatedHours: Number,
    status: { type: String, default: 'Scheduled' },
    completedAt: Date
  }],
  status: String,
  startDate: Date,
  endDate: Date,
  unableToCompleteReason: String,
  completedDate: Date,
  progress: {
    totalProjectors: { type: Number, default: 0 },
    completedProjectors: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    completedDays: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  amcContractId: mongoose.Schema.Types.ObjectId,
  amcServiceInterval: String,
  estimatedCost: Number,
  actualCost: Number,
  travelDistance: Number,
  travelTime: Number,
  travelCost: Number,
  adminNotes: String,
  fseNotes: String,
  history: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    changes: mongoose.Schema.Types.Mixed
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ServiceAssignment = mongoose.model('ServiceAssignment', serviceAssignmentSchema);

// Function to recalculate progress for an assignment
const recalculateProgress = (assignment) => {
  if (!assignment.projectors || !assignment.generatedSchedule) {
    return {
      totalProjectors: 0,
      completedProjectors: 0,
      totalDays: 0,
      completedDays: 0,
      percentage: 0
    };
  }

  const totalProjectors = assignment.projectors.length;
  const totalDays = assignment.generatedSchedule.length;
  
  let completedProjectors = 0;
  let completedDays = 0;
  
  assignment.generatedSchedule.forEach(day => {
    // Count completed projectors from ALL days, not just completed days
    const dayCompletedProjectors = day.projectors.filter(p => p.status === 'Completed').length;
    completedProjectors += dayCompletedProjectors;
    
    // Count completed days (days where all projectors are completed)
    if (day.status === 'Completed' || (day.projectors.length > 0 && day.projectors.every(p => p.status === 'Completed'))) {
      completedDays++;
    }
  });
  
  const percentage = totalProjectors > 0 
    ? Math.round((completedProjectors / totalProjectors) * 100)
    : 0;

  return {
    totalProjectors,
    completedProjectors,
    totalDays,
    completedDays,
    percentage
  };
};

// Main function to fix all assignments
const fixAssignmentProgress = async () => {
  try {
    console.log('Starting assignment progress fix...');
    
    // Get all assignments
    const assignments = await ServiceAssignment.find({});
    console.log(`Found ${assignments.length} assignments to process`);
    
    let updatedCount = 0;
    
    for (const assignment of assignments) {
      console.log(`\nProcessing assignment: ${assignment.assignmentId}`);
      console.log(`Current progress: ${assignment.progress.percentage}%`);
      
      // Recalculate progress
      const newProgress = recalculateProgress(assignment);
      console.log(`New progress: ${newProgress.percentage}%`);
      
      // Update assignment if progress changed
      if (JSON.stringify(assignment.progress) !== JSON.stringify(newProgress)) {
        assignment.progress = newProgress;
        assignment.updatedAt = new Date();
        
        await assignment.save();
        updatedCount++;
        console.log(`✅ Updated assignment ${assignment.assignmentId}`);
      } else {
        console.log(`⏭️  No changes needed for assignment ${assignment.assignmentId}`);
      }
    }
    
    console.log(`\n🎉 Progress fix completed! Updated ${updatedCount} assignments.`);
    
  } catch (error) {
    console.error('Error fixing assignment progress:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the fix
connectDB().then(() => {
  fixAssignmentProgress();
});
