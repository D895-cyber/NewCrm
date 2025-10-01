const mongoose = require('mongoose');

const serviceAssignmentSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ASSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Assignment Details
  title: {
    type: String,
    required: true,
    default: function() {
      return `Service Assignment - ${this.siteName}`;
    }
  },
  description: {
    type: String
  },
  
  // FSE Assignment
  fseId: {
    type: String,
    required: true,
    ref: 'FSE'
  },
  fseName: {
    type: String,
    required: true
  },
  fsePhone: {
    type: String
  },
  fseEmail: {
    type: String
  },
  
  // Site Information
  siteId: {
    type: String,
    required: true,
    ref: 'Site'
  },
  siteName: {
    type: String,
    required: true
  },
  siteAddress: {
    type: String
  },
  
  // Projectors to be serviced
  projectors: [{
    projectorId: {
      type: String,
      required: true,
      ref: 'Projector'
    },
    projectorSerial: {
      type: String,
      required: true
    },
    projectorModel: {
      type: String
    },
    auditorium: {
      type: String
    },
    serviceType: {
      type: String,
      enum: ['Scheduled Maintenance', 'Emergency Repair', 'Installation', 'Calibration', 'Inspection', 'Training', 'AMC Service 1', 'AMC Service 2'],
      default: 'Scheduled Maintenance'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    estimatedDuration: {
      type: Number, // in hours
      default: 2
    },
    notes: {
      type: String
    }
  }],
  
  // Scheduling Options
  schedulingType: {
    type: String,
    enum: ['flexible', 'fixed', 'spread'],
    default: 'flexible'
  },
  
  // Flexible Scheduling (Admin can choose how to distribute)
  schedulingOptions: {
    totalDays: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    projectorsPerDay: {
      type: Number,
      min: 1
    },
    preferredDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    timeSlots: [{
      startTime: String, // "09:00"
      endTime: String,   // "17:00"
      day: String
    }]
  },
  
  // Generated Schedule (Auto-calculated based on options)
  generatedSchedule: [{
    day: {
      type: Number, // 1, 2, 3, etc.
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    projectors: [{
      projectorId: String,
      projectorSerial: String,
      projectorModel: String,
      auditorium: String,
      serviceType: String,
      priority: String,
      estimatedDuration: Number,
      notes: String,
      timeSlot: {
        start: String,
        end: String
      }
    }],
    totalEstimatedHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    }
  }],
  
  // Assignment Status
  status: {
    type: String,
    enum: ['Draft', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Unable to Complete'],
    default: 'Draft'
  },
  
  // Reason for unable to complete (when status is 'Unable to Complete')
  unableToCompleteReason: {
    type: String,
    required: function() {
      return this.status === 'Unable to Complete';
    }
  },
  
  // Dates
  assignedDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  
  // Progress Tracking
  progress: {
    totalProjectors: {
      type: Number,
      default: 0
    },
    completedProjectors: {
      type: Number,
      default: 0
    },
    totalDays: {
      type: Number,
      default: 0
    },
    completedDays: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // AMC Contract (if applicable)
  amcContractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AMCContract',
    default: null
  },
  amcServiceInterval: {
    type: String,
    enum: ['First Service', 'Second Service', 'Outside AMC'],
    default: 'Outside AMC'
  },
  
  // Cost Estimation
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  
  // Travel Information
  travelDistance: {
    type: Number // in km
  },
  travelTime: {
    type: Number // in minutes
  },
  travelCost: {
    type: Number
  },
  
  // Notes and Comments
  adminNotes: {
    type: String
  },
  fseNotes: {
    type: String
  },
  
  // History and Audit
  history: [{
    action: String,
    performedBy: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    changes: mongoose.Schema.Types.Mixed
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
serviceAssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Handle empty strings for ObjectId fields
  if (this.amcContractId === '' || this.amcContractId === undefined) {
    this.amcContractId = null;
  }
  
  // Calculate progress
  if (this.projectors && this.generatedSchedule) {
    this.progress.totalProjectors = this.projectors.length;
    this.progress.totalDays = this.generatedSchedule.length;
    
    // Count completed projectors and days
    let completedProjectors = 0;
    let completedDays = 0;
    
    this.generatedSchedule.forEach(day => {
      // Count completed projectors from ALL days, not just completed days
      const dayCompletedProjectors = day.projectors.filter(p => p.status === 'Completed').length;
      completedProjectors += dayCompletedProjectors;
      
      // Count completed days (days where all projectors are completed)
      if (day.status === 'Completed' || (day.projectors.length > 0 && day.projectors.every(p => p.status === 'Completed'))) {
        completedDays++;
      }
    });
    
    this.progress.completedProjectors = completedProjectors;
    this.progress.completedDays = completedDays;
    this.progress.percentage = this.progress.totalProjectors > 0 
      ? Math.round((completedProjectors / this.progress.totalProjectors) * 100)
      : 0;
  }
  
  // Auto-generate schedule if not exists
  if (this.schedulingOptions && this.projectors && this.generatedSchedule.length === 0) {
    this.generateSchedule();
  }
  
  next();
});

// Method to generate schedule based on options
serviceAssignmentSchema.methods.generateSchedule = function() {
  const { totalDays, projectorsPerDay, preferredDays, timeSlots } = this.schedulingOptions;
  const projectors = [...this.projectors];
  
  this.generatedSchedule = [];
  
  // Calculate projectors per day
  const actualProjectorsPerDay = projectorsPerDay || Math.ceil(projectors.length / totalDays);
  
  // Generate dates starting from startDate
  let currentDate = new Date(this.startDate);
  
  for (let day = 1; day <= totalDays; day++) {
    const dayProjectors = projectors.splice(0, actualProjectorsPerDay);
    
    if (dayProjectors.length > 0) {
      const scheduleDay = {
        day: day,
        date: new Date(currentDate),
        projectors: dayProjectors.map(projector => ({
          ...projector.toObject(),
          timeSlot: timeSlots && timeSlots[0] ? {
            start: timeSlots[0].startTime,
            end: timeSlots[0].endTime
          } : {
            start: "09:00",
            end: "17:00"
          }
        })),
        totalEstimatedHours: dayProjectors.reduce((sum, p) => sum + (p.estimatedDuration || 2), 0),
        status: 'Scheduled'
      };
      
      this.generatedSchedule.push(scheduleDay);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Update end date based on generated schedule
  if (this.generatedSchedule.length > 0) {
    const lastDay = this.generatedSchedule[this.generatedSchedule.length - 1];
    this.endDate = lastDay.date;
  }
};

// Method to get current day's projectors
serviceAssignmentSchema.methods.getTodaysProjectors = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySchedule = this.generatedSchedule.find(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate.getTime() === today.getTime();
  });
  
  return todaySchedule ? todaySchedule.projectors : [];
};

// Method to mark projector as completed
serviceAssignmentSchema.methods.markProjectorCompleted = function(projectorId, dayNumber) {
  const scheduleDay = this.generatedSchedule.find(day => day.day === dayNumber);
  if (scheduleDay) {
    const projector = scheduleDay.projectors.find(p => p.projectorId === projectorId);
    if (projector) {
      projector.status = 'Completed';
      projector.completedAt = new Date();
      
      // Check if all projectors for the day are completed
      const allCompleted = scheduleDay.projectors.every(p => p.status === 'Completed');
      if (allCompleted) {
        scheduleDay.status = 'Completed';
        scheduleDay.completedAt = new Date();
      }
      
      // Trigger progress recalculation by marking the document as modified
      this.markModified('generatedSchedule');
      this.markModified('progress');
      
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('ServiceAssignment', serviceAssignmentSchema);

