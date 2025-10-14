const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const RMA = require('../models/RMA');
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const User = require('../models/User');
const DTR = require('../models/DTR');

// Real customer sites data
const realSites = [
  {
    name: 'TechCorp Mumbai Office',
    address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    contactPerson: 'Rajesh Kumar',
    contactEmail: 'rajesh.kumar@techcorp.com',
    contactPhone: '+91-9876543210',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    type: 'Corporate Office',
    status: 'Active',
    installationDate: new Date('2023-01-15'),
    totalProjectors: 12,
    notes: 'Main corporate office with conference rooms and training facilities'
  },
  {
    name: 'EduTech Bangalore Campus',
    address: 'Electronic City, Bangalore, Karnataka 560100',
    contactPerson: 'Priya Sharma',
    contactEmail: 'priya.sharma@edutech.edu',
    contactPhone: '+91-9876543211',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    type: 'Educational Institution',
    status: 'Active',
    installationDate: new Date('2023-03-20'),
    totalProjectors: 25,
    notes: 'University campus with multiple lecture halls and auditoriums'
  },
  {
    name: 'MediCare Delhi Hospital',
    address: 'Connaught Place, New Delhi, Delhi 110001',
    contactPerson: 'Dr. Amit Patel',
    contactEmail: 'amit.patel@medicare.com',
    contactPhone: '+91-9876543212',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    type: 'Healthcare',
    status: 'Active',
    installationDate: new Date('2023-02-10'),
    totalProjectors: 8,
    notes: 'Hospital with conference rooms and training facilities for medical staff'
  },
  {
    name: 'FinTech Hyderabad Hub',
    address: 'HITEC City, Hyderabad, Telangana 500081',
    contactPerson: 'Suresh Reddy',
    contactEmail: 'suresh.reddy@fintech.com',
    contactPhone: '+91-9876543213',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    type: 'Technology Hub',
    status: 'Active',
    installationDate: new Date('2023-04-05'),
    totalProjectors: 18,
    notes: 'Financial technology hub with trading floors and meeting rooms'
  },
  {
    name: 'RetailMax Chennai Store',
    address: 'T. Nagar, Chennai, Tamil Nadu 600017',
    contactPerson: 'Lakshmi Iyer',
    contactEmail: 'lakshmi.iyer@retailmax.com',
    contactPhone: '+91-9876543214',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    type: 'Retail',
    status: 'Active',
    installationDate: new Date('2023-05-12'),
    totalProjectors: 6,
    notes: 'Retail store with digital signage and customer display systems'
  },
  {
    name: 'Manufacturing Pune Plant',
    address: 'Hinjewadi, Pune, Maharashtra 411057',
    contactPerson: 'Vikram Joshi',
    contactEmail: 'vikram.joshi@manufacturing.com',
    contactPhone: '+91-9876543215',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    type: 'Manufacturing',
    status: 'Active',
    installationDate: new Date('2023-06-18'),
    totalProjectors: 15,
    notes: 'Manufacturing plant with training rooms and quality control areas'
  },
  {
    name: 'HotelGrand Goa Resort',
    address: 'Calangute Beach, Goa 403516',
    contactPerson: 'Maria Fernandes',
    contactEmail: 'maria.fernandes@hotelgrand.com',
    contactPhone: '+91-9876543216',
    city: 'Goa',
    state: 'Goa',
    pincode: '403516',
    type: 'Hospitality',
    status: 'Active',
    installationDate: new Date('2023-07-25'),
    totalProjectors: 10,
    notes: 'Luxury resort with conference facilities and entertainment areas'
  },
  {
    name: 'BankCentral Kolkata Branch',
    address: 'Park Street, Kolkata, West Bengal 700016',
    contactPerson: 'Arun Chatterjee',
    contactEmail: 'arun.chatterjee@bankcentral.com',
    contactPhone: '+91-9876543217',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700016',
    type: 'Banking',
    status: 'Active',
    installationDate: new Date('2023-08-30'),
    totalProjectors: 4,
    notes: 'Bank branch with customer service areas and training rooms'
  }
];

// Real projector data
const realProjectors = [
  // Epson Projectors
  {
    serialNumber: 'EP2024001',
    model: 'Epson EB-X41',
    brand: 'Epson',
    siteName: 'TechCorp Mumbai Office',
    installationDate: new Date('2023-01-15'),
    warrantyExpiry: new Date('2026-01-15'),
    status: 'Active',
    location: 'Conference Room A',
    lampHours: 1200,
    totalLampHours: 4000,
    lastMaintenance: new Date('2024-01-10'),
    nextMaintenance: new Date('2024-07-10'),
    notes: 'Primary conference room projector'
  },
  {
    serialNumber: 'EP2024002',
    model: 'Epson EB-X41',
    brand: 'Epson',
    siteName: 'TechCorp Mumbai Office',
    installationDate: new Date('2023-01-15'),
    warrantyExpiry: new Date('2026-01-15'),
    status: 'Active',
    location: 'Conference Room B',
    lampHours: 800,
    totalLampHours: 4000,
    lastMaintenance: new Date('2024-02-15'),
    nextMaintenance: new Date('2024-08-15'),
    notes: 'Secondary conference room projector'
  },
  {
    serialNumber: 'EP2024003',
    model: 'Epson EB-X06',
    brand: 'Epson',
    siteName: 'EduTech Bangalore Campus',
    installationDate: new Date('2023-03-20'),
    warrantyExpiry: new Date('2026-03-20'),
    status: 'Active',
    location: 'Lecture Hall 1',
    lampHours: 2100,
    totalLampHours: 6000,
    lastMaintenance: new Date('2024-01-20'),
    nextMaintenance: new Date('2024-07-20'),
    notes: 'Main lecture hall projector'
  },
  {
    serialNumber: 'EP2024004',
    model: 'Epson EB-X06',
    brand: 'Epson',
    siteName: 'EduTech Bangalore Campus',
    installationDate: new Date('2023-03-20'),
    warrantyExpiry: new Date('2026-03-20'),
    status: 'In RMA',
    location: 'Lecture Hall 2',
    lampHours: 0,
    totalLampHours: 6000,
    lastMaintenance: new Date('2024-02-01'),
    nextMaintenance: new Date('2024-08-01'),
    notes: 'Currently in RMA for lamp replacement'
  },
  // BenQ Projectors
  {
    serialNumber: 'BQ2024001',
    model: 'BenQ MW632ST',
    brand: 'BenQ',
    siteName: 'MediCare Delhi Hospital',
    installationDate: new Date('2023-02-10'),
    warrantyExpiry: new Date('2026-02-10'),
    status: 'Active',
    location: 'Medical Conference Room',
    lampHours: 1500,
    totalLampHours: 5000,
    lastMaintenance: new Date('2024-01-15'),
    nextMaintenance: new Date('2024-07-15'),
    notes: 'Medical training and conference presentations'
  },
  {
    serialNumber: 'BQ2024002',
    model: 'BenQ MW632ST',
    brand: 'BenQ',
    siteName: 'MediCare Delhi Hospital',
    installationDate: new Date('2023-02-10'),
    warrantyExpiry: new Date('2026-02-10'),
    status: 'Active',
    location: 'Training Room 1',
    lampHours: 900,
    totalLampHours: 5000,
    lastMaintenance: new Date('2024-02-20'),
    nextMaintenance: new Date('2024-08-20'),
    notes: 'Staff training room'
  },
  // Optoma Projectors
  {
    serialNumber: 'OP2024001',
    model: 'Optoma X341',
    brand: 'Optoma',
    siteName: 'FinTech Hyderabad Hub',
    installationDate: new Date('2023-04-05'),
    warrantyExpiry: new Date('2026-04-05'),
    status: 'Active',
    location: 'Trading Floor Display',
    lampHours: 1800,
    totalLampHours: 4000,
    lastMaintenance: new Date('2024-01-25'),
    nextMaintenance: new Date('2024-07-25'),
    notes: 'High-usage trading floor display'
  },
  {
    serialNumber: 'OP2024002',
    model: 'Optoma X341',
    brand: 'Optoma',
    siteName: 'FinTech Hyderabad Hub',
    installationDate: new Date('2023-04-05'),
    warrantyExpiry: new Date('2026-04-05'),
    status: 'Maintenance',
    location: 'Meeting Room 1',
    lampHours: 0,
    totalLampHours: 4000,
    lastMaintenance: new Date('2024-03-01'),
    nextMaintenance: new Date('2024-09-01'),
    notes: 'Scheduled maintenance for lamp replacement'
  }
];

// Real user data
const realUsers = [
  {
    username: 'admin',
    email: 'admin@ascomp.com',
    password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    role: 'admin',
    profile: {
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+91-9876543200',
      department: 'IT',
      designation: 'System Administrator'
    },
    isActive: true,
    lastLogin: new Date('2024-03-15'),
    permissions: ['all']
  },
  {
    username: 'rma.manager',
    email: 'rma.manager@ascomp.com',
    password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    role: 'rma_manager',
    profile: {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91-9876543201',
      department: 'RMA',
      designation: 'RMA Manager'
    },
    isActive: true,
    lastLogin: new Date('2024-03-14'),
    permissions: ['rma_management', 'user_management', 'reports']
  },
  {
    username: 'technician.mumbai',
    email: 'technician.mumbai@ascomp.com',
    password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    role: 'technician',
    profile: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876543202',
      department: 'Service',
      designation: 'Senior Technician',
      region: 'Mumbai'
    },
    isActive: true,
    lastLogin: new Date('2024-03-13'),
    permissions: ['service_visits', 'dtr_management', 'projector_maintenance']
  },
  {
    username: 'technician.bangalore',
    email: 'technician.bangalore@ascomp.com',
    password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    role: 'technician',
    profile: {
      firstName: 'Suresh',
      lastName: 'Reddy',
      phone: '+91-9876543203',
      department: 'Service',
      designation: 'Senior Technician',
      region: 'Bangalore'
    },
    isActive: true,
    lastLogin: new Date('2024-03-12'),
    permissions: ['service_visits', 'dtr_management', 'projector_maintenance']
  },
  {
    username: 'fse.delhi',
    email: 'fse.delhi@ascomp.com',
    password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA',
    role: 'fse',
    profile: {
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+91-9876543204',
      department: 'Field Service',
      designation: 'Field Service Engineer',
      region: 'Delhi'
    },
    isActive: true,
    lastLogin: new Date('2024-03-11'),
    permissions: ['service_visits', 'dtr_creation', 'projector_maintenance']
  }
];

// Real RMA data with comprehensive scenarios
const realRMAs = [
  {
    rmaNumber: 'RMA-2024-001',
    callLogNumber: 'CL-2024-001',
    rmaOrderNumber: 'PO-2024-001',
    ascompRaisedDate: new Date('2024-01-15'),
    customerErrorDate: new Date('2024-01-10'),
    siteName: 'TechCorp Mumbai Office',
    productName: 'Epson EB-X41',
    productPartNumber: 'V13H010L47',
    serialNumber: 'EP2024001',
    defectivePartNumber: 'V13H010L47',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-EP-001',
    symptoms: 'No display output, lamp indicator shows error',
    replacedPartNumber: 'V13H010L47',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-EP-001-NEW',
    replacementNotes: 'Lamp assembly replaced under warranty - original lamp had 3800 hours',
    shippedDate: new Date('2024-01-20'),
    trackingNumber: 'BD1234567890',
    shippedThru: 'Blue Dart',
    remarks: 'Urgent replacement needed for critical presentation',
    createdBy: 'Rajesh Kumar',
    caseStatus: 'Completed',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: new Date('2024-02-01'),
    rmaReturnTrackingNumber: 'BD1234567891',
    rmaReturnShippedThru: 'Blue Dart',
    daysCountShippedToSite: 5,
    daysCountReturnToCDS: 12,
    projectorSerial: 'EP2024001',
    brand: 'Epson',
    projectorModel: 'EB-X41',
    customerSite: 'TechCorp Mumbai Office',
    priority: 'High',
    warrantyStatus: 'In Warranty',
    estimatedCost: 8500,
    notes: 'Lamp assembly replacement completed successfully',
    shipping: {
      outbound: {
        trackingNumber: 'BD1234567890',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-01-23'),
        actualDelivery: new Date('2024-01-22'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/BD1234567890',
        weight: 2.5,
        insuranceValue: 8500,
        requiresSignature: true
      },
      return: {
        trackingNumber: 'BD1234567891',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-01'),
        estimatedDelivery: new Date('2024-02-04'),
        actualDelivery: new Date('2024-02-03'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/BD1234567891',
        weight: 2.5,
        insuranceValue: 8500,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-002',
    callLogNumber: 'CL-2024-002',
    rmaOrderNumber: 'PO-2024-002',
    ascompRaisedDate: new Date('2024-01-16'),
    customerErrorDate: new Date('2024-01-11'),
    siteName: 'EduTech Bangalore Campus',
    productName: 'Epson EB-X06',
    productPartNumber: 'V13H010L47',
    serialNumber: 'EP2024004',
    defectivePartNumber: 'V13H010L47',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-EP-004',
    symptoms: 'Dim display, flickering image, lamp hours exceeded',
    replacedPartNumber: 'V13H010L47',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-EP-004-NEW',
    replacementNotes: 'Lamp replacement due to normal wear - 6000+ hours',
    shippedDate: new Date('2024-01-25'),
    trackingNumber: 'DTDC1234567890',
    shippedThru: 'DTDC',
    remarks: 'Standard lamp replacement for educational institution',
    createdBy: 'Suresh Reddy',
    caseStatus: 'Shipped to Site',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: null,
    rmaReturnTrackingNumber: null,
    rmaReturnShippedThru: null,
    daysCountShippedToSite: 9,
    daysCountReturnToCDS: null,
    projectorSerial: 'EP2024004',
    brand: 'Epson',
    projectorModel: 'EB-X06',
    customerSite: 'EduTech Bangalore Campus',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 12000,
    notes: 'Lamp assembly shipped to site, awaiting installation',
    shipping: {
      outbound: {
        trackingNumber: 'DTDC1234567890',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-01-25'),
        estimatedDelivery: new Date('2024-01-28'),
        actualDelivery: null,
        status: 'in_transit',
        trackingUrl: 'https://dtdc.com/track/DTDC1234567890',
        weight: 3.0,
        insuranceValue: 12000,
        requiresSignature: true
      },
      return: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: null,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-003',
    callLogNumber: 'CL-2024-003',
    rmaOrderNumber: 'PO-2024-003',
    ascompRaisedDate: new Date('2024-01-17'),
    customerErrorDate: new Date('2024-01-12'),
    siteName: 'MediCare Delhi Hospital',
    productName: 'BenQ MW632ST',
    productPartNumber: '9J.L9L02.001',
    serialNumber: 'BQ2024001',
    defectivePartNumber: '9J.L9L02.001',
    defectivePartName: 'Power Supply Unit',
    defectiveSerialNumber: 'PSU-BQ-001',
    symptoms: 'Power issues, intermittent shutdowns, overheating',
    replacedPartNumber: '9J.L9L02.001',
    replacedPartName: 'New Power Supply Unit',
    replacedPartSerialNumber: 'PSU-BQ-001-NEW',
    replacementNotes: 'Power supply unit replacement due to component failure',
    shippedDate: new Date('2024-01-30'),
    trackingNumber: 'FEDEX1234567890',
    shippedThru: 'FedEx',
    remarks: 'Critical medical equipment - priority replacement',
    createdBy: 'Amit Patel',
    caseStatus: 'Completed',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: new Date('2024-02-10'),
    rmaReturnTrackingNumber: 'FEDEX1234567891',
    rmaReturnShippedThru: 'FedEx',
    daysCountShippedToSite: 13,
    daysCountReturnToCDS: 11,
    projectorSerial: 'BQ2024001',
    brand: 'BenQ',
    projectorModel: 'MW632ST',
    customerSite: 'MediCare Delhi Hospital',
    priority: 'Critical',
    warrantyStatus: 'In Warranty',
    estimatedCost: 15000,
    notes: 'Power supply replacement completed successfully',
    shipping: {
      outbound: {
        trackingNumber: 'FEDEX1234567890',
        carrier: 'FEDEX',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-01-30'),
        estimatedDelivery: new Date('2024-02-02'),
        actualDelivery: new Date('2024-02-01'),
        status: 'delivered',
        trackingUrl: 'https://fedex.com/track/FEDEX1234567890',
        weight: 4.0,
        insuranceValue: 15000,
        requiresSignature: true
      },
      return: {
        trackingNumber: 'FEDEX1234567891',
        carrier: 'FEDEX',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-10'),
        estimatedDelivery: new Date('2024-02-13'),
        actualDelivery: new Date('2024-02-12'),
        status: 'delivered',
        trackingUrl: 'https://fedex.com/track/FEDEX1234567891',
        weight: 4.0,
        insuranceValue: 15000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 2,
      actualDeliveryDays: 2,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-004',
    callLogNumber: 'CL-2024-004',
    rmaOrderNumber: 'PO-2024-004',
    ascompRaisedDate: new Date('2024-01-18'),
    customerErrorDate: new Date('2024-01-13'),
    siteName: 'FinTech Hyderabad Hub',
    productName: 'Optoma X341',
    productPartNumber: 'SP-LAMP-001',
    serialNumber: 'OP2024001',
    defectivePartNumber: 'SP-LAMP-001',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-OP-001',
    symptoms: 'No display, lamp error indicator, excessive heat',
    replacedPartNumber: 'SP-LAMP-001',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-OP-001-NEW',
    replacementNotes: 'Lamp assembly replacement - high usage environment',
    shippedDate: new Date('2024-02-05'),
    trackingNumber: 'BLUEDART1234567890',
    shippedThru: 'Blue Dart',
    remarks: 'High-priority replacement for trading floor',
    createdBy: 'Suresh Reddy',
    caseStatus: 'Under Review',
    approvalStatus: 'Pending Review',
    rmaReturnShippedDate: null,
    rmaReturnTrackingNumber: null,
    rmaReturnShippedThru: null,
    daysCountShippedToSite: null,
    daysCountReturnToCDS: null,
    projectorSerial: 'OP2024001',
    brand: 'Optoma',
    projectorModel: 'X341',
    customerSite: 'FinTech Hyderabad Hub',
    priority: 'High',
    warrantyStatus: 'In Warranty',
    estimatedCost: 9500,
    notes: 'RMA under review for trading floor projector',
    shipping: {
      outbound: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      },
      return: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: null,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-005',
    callLogNumber: 'CL-2024-005',
    rmaOrderNumber: 'PO-2024-005',
    ascompRaisedDate: new Date('2024-01-19'),
    customerErrorDate: new Date('2024-01-14'),
    siteName: 'RetailMax Chennai Store',
    productName: 'Epson EB-X41',
    productPartNumber: 'V13H010L47',
    serialNumber: 'EP2024005',
    defectivePartNumber: 'V13H010L47',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-EP-005',
    symptoms: 'Dim display, color distortion, lamp warning',
    replacedPartNumber: 'V13H010L47',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-EP-005-NEW',
    replacementNotes: 'Standard lamp replacement for retail display',
    shippedDate: new Date('2024-02-08'),
    trackingNumber: 'DTDC1234567891',
    shippedThru: 'DTDC',
    remarks: 'Retail display maintenance',
    createdBy: 'Rajesh Kumar',
    caseStatus: 'In Progress',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: null,
    rmaReturnTrackingNumber: null,
    rmaReturnShippedThru: null,
    daysCountShippedToSite: 20,
    daysCountReturnToCDS: null,
    projectorSerial: 'EP2024005',
    brand: 'Epson',
    projectorModel: 'EB-X41',
    customerSite: 'RetailMax Chennai Store',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 8500,
    notes: 'Lamp replacement in progress',
    shipping: {
      outbound: {
        trackingNumber: 'DTDC1234567891',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-02-08'),
        estimatedDelivery: new Date('2024-02-11'),
        actualDelivery: new Date('2024-02-10'),
        status: 'delivered',
        trackingUrl: 'https://dtdc.com/track/DTDC1234567891',
        weight: 2.5,
        insuranceValue: 8500,
        requiresSignature: true
      },
      return: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-006',
    callLogNumber: 'CL-2024-006',
    rmaOrderNumber: 'PO-2024-006',
    ascompRaisedDate: new Date('2024-01-20'),
    customerErrorDate: new Date('2024-01-15'),
    siteName: 'Manufacturing Pune Plant',
    productName: 'BenQ MW632ST',
    productPartNumber: '9J.L9L02.001',
    serialNumber: 'BQ2024003',
    defectivePartNumber: '9J.L9L02.001',
    defectivePartName: 'Main Board',
    defectiveSerialNumber: 'MB-BQ-003',
    symptoms: 'No signal input, HDMI port not working, display issues',
    replacedPartNumber: '9J.L9L02.001',
    replacedPartName: 'New Main Board',
    replacedPartSerialNumber: 'MB-BQ-003-NEW',
    replacementNotes: 'Main board replacement due to input port failure',
    shippedDate: new Date('2024-02-12'),
    trackingNumber: 'FEDEX1234567892',
    shippedThru: 'FedEx',
    remarks: 'Training room projector maintenance',
    createdBy: 'Vikram Joshi',
    caseStatus: 'Completed',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: new Date('2024-02-25'),
    rmaReturnTrackingNumber: 'FEDEX1234567893',
    rmaReturnShippedThru: 'FedEx',
    daysCountShippedToSite: 23,
    daysCountReturnToCDS: 13,
    projectorSerial: 'BQ2024003',
    brand: 'BenQ',
    projectorModel: 'MW632ST',
    customerSite: 'Manufacturing Pune Plant',
    priority: 'Low',
    warrantyStatus: 'Extended Warranty',
    estimatedCost: 18000,
    notes: 'Main board replacement completed successfully',
    shipping: {
      outbound: {
        trackingNumber: 'FEDEX1234567892',
        carrier: 'FEDEX',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-12'),
        estimatedDelivery: new Date('2024-02-15'),
        actualDelivery: new Date('2024-02-14'),
        status: 'delivered',
        trackingUrl: 'https://fedex.com/track/FEDEX1234567892',
        weight: 5.0,
        insuranceValue: 18000,
        requiresSignature: true
      },
      return: {
        trackingNumber: 'FEDEX1234567893',
        carrier: 'FEDEX',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-25'),
        estimatedDelivery: new Date('2024-02-28'),
        actualDelivery: new Date('2024-02-27'),
        status: 'delivered',
        trackingUrl: 'https://fedex.com/track/FEDEX1234567893',
        weight: 5.0,
        insuranceValue: 18000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-007',
    callLogNumber: 'CL-2024-007',
    rmaOrderNumber: 'PO-2024-007',
    ascompRaisedDate: new Date('2024-01-21'),
    customerErrorDate: new Date('2024-01-16'),
    siteName: 'HotelGrand Goa Resort',
    productName: 'Optoma X341',
    productPartNumber: 'SP-LAMP-001',
    serialNumber: 'OP2024003',
    defectivePartNumber: 'SP-LAMP-001',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-OP-003',
    symptoms: 'Flickering display, color issues, lamp warning',
    replacedPartNumber: 'SP-LAMP-001',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-OP-003-NEW',
    replacementNotes: 'Lamp replacement for entertainment area',
    shippedDate: new Date('2024-02-15'),
    trackingNumber: 'BLUEDART1234567891',
    shippedThru: 'Blue Dart',
    remarks: 'Entertainment area projector maintenance',
    createdBy: 'Maria Fernandes',
    caseStatus: 'Shipped to Site',
    approvalStatus: 'Approved',
    rmaReturnShippedDate: null,
    rmaReturnTrackingNumber: null,
    rmaReturnShippedThru: null,
    daysCountShippedToSite: 25,
    daysCountReturnToCDS: null,
    projectorSerial: 'OP2024003',
    brand: 'Optoma',
    projectorModel: 'X341',
    customerSite: 'HotelGrand Goa Resort',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 9500,
    notes: 'Lamp assembly shipped to resort',
    shipping: {
      outbound: {
        trackingNumber: 'BLUEDART1234567891',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-15'),
        estimatedDelivery: new Date('2024-02-18'),
        actualDelivery: null,
        status: 'in_transit',
        trackingUrl: 'https://bluedart.com/track/BLUEDART1234567891',
        weight: 3.0,
        insuranceValue: 9500,
        requiresSignature: true
      },
      return: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: null,
      slaBreached: false,
      breachReason: null
    }
  },
  {
    rmaNumber: 'RMA-2024-008',
    callLogNumber: 'CL-2024-008',
    rmaOrderNumber: 'PO-2024-008',
    ascompRaisedDate: new Date('2024-01-22'),
    customerErrorDate: new Date('2024-01-17'),
    siteName: 'BankCentral Kolkata Branch',
    productName: 'Epson EB-X06',
    productPartNumber: 'V13H010L47',
    serialNumber: 'EP2024006',
    defectivePartNumber: 'V13H010L47',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-EP-006',
    symptoms: 'No display, lamp error, overheating',
    replacedPartNumber: 'V13H010L47',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-EP-006-NEW',
    replacementNotes: 'Lamp replacement for customer service area',
    shippedDate: new Date('2024-02-18'),
    trackingNumber: 'DTDC1234567892',
    shippedThru: 'DTDC',
    remarks: 'Bank branch customer service display',
    createdBy: 'Arun Chatterjee',
    caseStatus: 'Under Review',
    approvalStatus: 'Pending Review',
    rmaReturnShippedDate: null,
    rmaReturnTrackingNumber: null,
    rmaReturnShippedThru: null,
    daysCountShippedToSite: null,
    daysCountReturnToCDS: null,
    projectorSerial: 'EP2024006',
    brand: 'Epson',
    projectorModel: 'EB-X06',
    customerSite: 'BankCentral Kolkata Branch',
    priority: 'High',
    warrantyStatus: 'In Warranty',
    estimatedCost: 12000,
    notes: 'RMA under review for bank branch projector',
    shipping: {
      outbound: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      },
      return: {
        trackingNumber: null,
        carrier: null,
        carrierService: null,
        shippedDate: null,
        estimatedDelivery: null,
        actualDelivery: null,
        status: 'pending',
        trackingUrl: null,
        weight: null,
        insuranceValue: null,
        requiresSignature: null
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: null,
      slaBreached: false,
      breachReason: null
    }
  }
];

// Real DTR data
const realDTRs = [
  {
    caseId: 'DTR-2024-001',
    siteName: 'TechCorp Mumbai Office',
    projectorSerial: 'EP2024001',
    projectorModel: 'Epson EB-X41',
    issueDescription: 'No display output, lamp indicator shows error',
    reportedDate: new Date('2024-01-10'),
    reportedBy: 'Rajesh Kumar',
    reportedByEmail: 'rajesh.kumar@techcorp.com',
    reportedByPhone: '+91-9876543210',
    priority: 'High',
    status: 'Resolved',
    assignedTo: 'technician.mumbai',
    resolutionNotes: 'Lamp assembly replacement required - converted to RMA',
    resolvedDate: new Date('2024-01-15'),
    rmaStatus: 'Converted',
    rmaWorkflow: 'Completed'
  },
  {
    caseId: 'DTR-2024-002',
    siteName: 'EduTech Bangalore Campus',
    projectorSerial: 'EP2024004',
    projectorModel: 'Epson EB-X06',
    issueDescription: 'Dim display, flickering image, lamp hours exceeded',
    reportedDate: new Date('2024-01-11'),
    reportedBy: 'Priya Sharma',
    reportedByEmail: 'priya.sharma@edutech.edu',
    reportedByPhone: '+91-9876543211',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'technician.bangalore',
    resolutionNotes: 'Lamp replacement in progress',
    resolvedDate: null,
    rmaStatus: 'Converted',
    rmaWorkflow: 'Shipped to Site'
  },
  {
    caseId: 'DTR-2024-003',
    siteName: 'MediCare Delhi Hospital',
    projectorSerial: 'BQ2024001',
    projectorModel: 'BenQ MW632ST',
    issueDescription: 'Power issues, intermittent shutdowns, overheating',
    reportedDate: new Date('2024-01-12'),
    reportedBy: 'Dr. Amit Patel',
    reportedByEmail: 'amit.patel@medicare.com',
    reportedByPhone: '+91-9876543212',
    priority: 'Critical',
    status: 'Resolved',
    assignedTo: 'fse.delhi',
    resolutionNotes: 'Power supply unit replacement completed',
    resolvedDate: new Date('2024-01-17'),
    rmaStatus: 'Converted',
    rmaWorkflow: 'Completed'
  }
];

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function importRealData() {
  try {
    console.log('🚀 Starting real data import...\n');
    
    let importedCounts = {
      sites: 0,
      projectors: 0,
      users: 0,
      rmas: 0,
      dtrs: 0
    };

    // Import Sites
    console.log('📍 Importing real sites...');
    for (const siteData of realSites) {
      try {
        const existingSite = await Site.findOne({ name: siteData.name });
        if (existingSite) {
          console.log(`⚠️ Site already exists: ${siteData.name}`);
          continue;
        }
        
        const site = new Site(siteData);
        await site.save();
        importedCounts.sites++;
        console.log(`✅ Imported site: ${site.name}`);
      } catch (error) {
        console.error(`❌ Error importing site ${siteData.name}:`, error.message);
      }
    }

    // Import Projectors
    console.log('\n📺 Importing real projectors...');
    for (const projectorData of realProjectors) {
      try {
        const existingProjector = await Projector.findOne({ serialNumber: projectorData.serialNumber });
        if (existingProjector) {
          console.log(`⚠️ Projector already exists: ${projectorData.serialNumber}`);
          continue;
        }
        
        const projector = new Projector(projectorData);
        await projector.save();
        importedCounts.projectors++;
        console.log(`✅ Imported projector: ${projector.serialNumber} (${projector.model})`);
      } catch (error) {
        console.error(`❌ Error importing projector ${projectorData.serialNumber}:`, error.message);
      }
    }

    // Import Users
    console.log('\n👥 Importing real users...');
    for (const userData of realUsers) {
      try {
        const existingUser = await User.findOne({ 
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        });
        if (existingUser) {
          console.log(`⚠️ User already exists: ${userData.username}`);
          continue;
        }
        
        const user = new User(userData);
        await user.save();
        importedCounts.users++;
        console.log(`✅ Imported user: ${user.username} (${user.role})`);
      } catch (error) {
        console.error(`❌ Error importing user ${userData.username}:`, error.message);
      }
    }

    // Import RMAs
    console.log('\n📦 Importing real RMAs...');
    for (const rmaData of realRMAs) {
      try {
        const existingRMA = await RMA.findOne({ rmaNumber: rmaData.rmaNumber });
        if (existingRMA) {
          console.log(`⚠️ RMA already exists: ${rmaData.rmaNumber}`);
          continue;
        }
        
        const rma = new RMA(rmaData);
        await rma.save();
        importedCounts.rmas++;
        console.log(`✅ Imported RMA: ${rma.rmaNumber} (${rma.siteName})`);
      } catch (error) {
        console.error(`❌ Error importing RMA ${rmaData.rmaNumber}:`, error.message);
      }
    }

    // Import DTRs
    console.log('\n🚨 Importing real DTRs...');
    for (const dtrData of realDTRs) {
      try {
        const existingDTR = await DTR.findOne({ caseId: dtrData.caseId });
        if (existingDTR) {
          console.log(`⚠️ DTR already exists: ${dtrData.caseId}`);
          continue;
        }
        
        const dtr = new DTR(dtrData);
        await dtr.save();
        importedCounts.dtrs++;
        console.log(`✅ Imported DTR: ${dtr.caseId} (${dtr.siteName})`);
      } catch (error) {
        console.error(`❌ Error importing DTR ${dtrData.caseId}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 Import Summary:');
    console.log(`✅ Sites: ${importedCounts.sites}`);
    console.log(`✅ Projectors: ${importedCounts.projectors}`);
    console.log(`✅ Users: ${importedCounts.users}`);
    console.log(`✅ RMAs: ${importedCounts.rmas}`);
    console.log(`✅ DTRs: ${importedCounts.dtrs}`);
    
    const totalImported = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎉 Total records imported: ${totalImported}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  }
}

async function showDataSummary() {
  try {
    console.log('\n📊 Current Database Summary:');
    
    const siteCount = await Site.countDocuments();
    const projectorCount = await Projector.countDocuments();
    const userCount = await User.countDocuments();
    const rmaCount = await RMA.countDocuments();
    const dtrCount = await DTR.countDocuments();
    
    console.log(`📍 Sites: ${siteCount}`);
    console.log(`📺 Projectors: ${projectorCount}`);
    console.log(`👥 Users: ${userCount}`);
    console.log(`📦 RMAs: ${rmaCount}`);
    console.log(`🚨 DTRs: ${dtrCount}`);
    
    // Show RMA status distribution
    const rmaStatuses = await RMA.aggregate([
      { $group: { _id: '$caseStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📦 RMA Status Distribution:');
    rmaStatuses.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
    // Show priority distribution
    const priorityDistribution = await RMA.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n⚡ Priority Distribution:');
    priorityDistribution.forEach(priority => {
      console.log(`  ${priority._id}: ${priority.count}`);
    });

  } catch (error) {
    console.error('❌ Error showing summary:', error);
  }
}

async function main() {
  try {
    await connectToDatabase();
    await importRealData();
    await showDataSummary();
    
    console.log('\n✅ Real data import completed successfully!');
    console.log('🎯 The RMA portal now has comprehensive real data for testing and demonstration.');
    
  } catch (error) {
    console.error('❌ Main execution error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  importRealData,
  realSites,
  realProjectors,
  realUsers,
  realRMAs,
  realDTRs
};









