const mongoose = require('mongoose');
const FSE = require('./server/models/FSE');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/projector-warranty', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create sample FSEs
async function createSampleFSEs() {
  try {
    // Clear existing FSEs
    await FSE.deleteMany({});
    console.log('Cleared existing FSEs');

    const sampleFSEs = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@ascompinc.in',
        phone: '+91-9876543210',
        employeeId: 'FSE001',
        designation: 'Senior Field Service Engineer',
        experience: 8,
        status: 'Active',
        location: 'Delhi',
        skills: ['Projector Maintenance', 'Installation', 'Troubleshooting'],
        certifications: ['Christie Certified', 'Epson Certified'],
        availability: 'Available'
      },
      {
        name: 'Amit Singh',
        email: 'amit.singh@ascompinc.in',
        phone: '+91-9876543211',
        employeeId: 'FSE002',
        designation: 'Field Service Engineer',
        experience: 5,
        status: 'Active',
        location: 'Mumbai',
        skills: ['Projector Maintenance', 'Calibration', 'Repair'],
        certifications: ['Panasonic Certified', 'Sony Certified'],
        availability: 'Available'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@ascompinc.in',
        phone: '+91-9876543212',
        employeeId: 'FSE003',
        designation: 'Lead Field Service Engineer',
        experience: 10,
        status: 'Active',
        location: 'Bangalore',
        skills: ['Projector Maintenance', 'Installation', 'Training', 'Management'],
        certifications: ['Christie Certified', 'Epson Certified', 'Panasonic Certified'],
        availability: 'Available'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@ascompinc.in',
        phone: '+91-9876543213',
        employeeId: 'FSE004',
        designation: 'Field Service Engineer',
        experience: 4,
        status: 'Active',
        location: 'Chennai',
        skills: ['Projector Maintenance', 'Installation', 'Customer Service'],
        certifications: ['Epson Certified', 'Sony Certified'],
        availability: 'Available'
      },
      {
        name: 'Suresh Patel',
        email: 'suresh.patel@ascompinc.in',
        phone: '+91-9876543214',
        employeeId: 'FSE005',
        designation: 'Senior Field Service Engineer',
        experience: 7,
        status: 'Active',
        location: 'Ahmedabad',
        skills: ['Projector Maintenance', 'Repair', 'Troubleshooting'],
        certifications: ['Christie Certified', 'Panasonic Certified'],
        availability: 'Available'
      },
      {
        name: 'Deepak Kumar',
        email: 'deepak.kumar@ascompinc.in',
        phone: '+91-9876543215',
        employeeId: 'FSE006',
        designation: 'Field Service Engineer',
        experience: 3,
        status: 'Active',
        location: 'Pune',
        skills: ['Projector Maintenance', 'Installation'],
        certifications: ['Epson Certified'],
        availability: 'Available'
      },
      {
        name: 'Anita Verma',
        email: 'anita.verma@ascompinc.in',
        phone: '+91-9876543216',
        employeeId: 'FSE007',
        designation: 'Field Service Engineer',
        experience: 6,
        status: 'Active',
        location: 'Kolkata',
        skills: ['Projector Maintenance', 'Calibration', 'Customer Service'],
        certifications: ['Sony Certified', 'Panasonic Certified'],
        availability: 'Available'
      },
      {
        name: 'Ravi Kumar',
        email: 'ravi.kumar@ascompinc.in',
        phone: '+91-9876543217',
        employeeId: 'FSE008',
        designation: 'Senior Field Service Engineer',
        experience: 9,
        status: 'Active',
        location: 'Hyderabad',
        skills: ['Projector Maintenance', 'Installation', 'Training', 'Troubleshooting'],
        certifications: ['Christie Certified', 'Epson Certified', 'Sony Certified'],
        availability: 'Available'
      }
    ];

    // Insert sample FSEs
    const createdFSEs = await FSE.insertMany(sampleFSEs);
    console.log(`Created ${createdFSEs.length} sample FSEs`);

    // Display created FSEs
    console.log('\nCreated FSEs:');
    createdFSEs.forEach((fse, index) => {
      console.log(`${index + 1}. ${fse.name} (${fse.employeeId}) - ${fse.designation} - ${fse.location}`);
    });

    console.log('\nFSE creation completed successfully!');
    console.log('You can now assign FSEs when creating service visits.');

  } catch (error) {
    console.error('Error creating sample FSEs:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await createSampleFSEs();
  await mongoose.connection.close();
  console.log('Database connection closed');
}

// Run the script
main().catch(console.error);
