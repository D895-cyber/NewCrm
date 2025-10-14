const express = require('express');
const router = express.Router();

// Mock data for testing when database is not available
const mockRMAs = [
  {
    _id: 'mock-rma-001',
    rmaNumber: 'RMA-2024-001',
    callLogNumber: 'CL-2024-001',
    rmaOrderNumber: 'PO-2024-001',
    ascompRaisedDate: new Date('2024-01-15'),
    customerErrorDate: new Date('2024-01-10'),
    siteName: 'Corporate Office Mumbai',
    productName: 'Epson PowerLite 1781W',
    productPartNumber: 'PART-001',
    serialNumber: 'PROJ-001-2024',
    defectivePartNumber: 'DEFECT-001',
    defectivePartName: 'Lamp Assembly',
    defectiveSerialNumber: 'LAMP-001',
    symptoms: 'No display output, lamp indicator blinking',
    replacedPartNumber: 'REPLACE-001',
    replacedPartName: 'New Lamp Assembly',
    replacedPartSerialNumber: 'LAMP-002',
    replacementNotes: 'Replaced under warranty - lamp life exceeded',
    shippedDate: new Date('2024-01-20'),
    trackingNumber: 'TRK-001',
    shippedThru: 'Blue Dart',
    remarks: 'Urgent replacement needed for conference room',
    createdBy: 'John Doe',
    caseStatus: 'Under Review',
    approvalStatus: 'Pending Review',
    priority: 'High',
    warrantyStatus: 'In Warranty',
    estimatedCost: 5000,
    notes: 'Lamp assembly replacement for conference room projector',
    projectorSerial: 'PROJ-001-2024',
    brand: 'Epson',
    projectorModel: 'PowerLite 1781W',
    customerSite: 'Corporate Office Mumbai',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    shipping: {
      outbound: {
        trackingNumber: 'TRK-001',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-01-23'),
        actualDelivery: new Date('2024-01-22'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/TRK-001',
        lastUpdated: new Date(),
        weight: 2.5,
        insuranceValue: 5000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false
    }
  },
  {
    _id: 'mock-rma-002',
    rmaNumber: 'RMA-2024-002',
    callLogNumber: 'CL-2024-002',
    rmaOrderNumber: 'PO-2024-002',
    ascompRaisedDate: new Date('2024-01-16'),
    customerErrorDate: new Date('2024-01-11'),
    siteName: 'Tech Hub Bangalore',
    productName: 'BenQ MW632ST',
    productPartNumber: 'PART-002',
    serialNumber: 'PROJ-002-2024',
    defectivePartNumber: 'DEFECT-002',
    defectivePartName: 'Power Supply Unit',
    defectiveSerialNumber: 'PSU-001',
    symptoms: 'Power issues, intermittent shutdowns',
    replacedPartNumber: 'REPLACE-002',
    replacedPartName: 'New Power Supply Unit',
    replacedPartSerialNumber: 'PSU-002',
    replacementNotes: 'Power supply replacement due to voltage fluctuations',
    shippedDate: new Date('2024-01-25'),
    trackingNumber: 'TRK-003',
    shippedThru: 'DTDC',
    remarks: 'Power supply replacement for training room',
    createdBy: 'Jane Smith',
    caseStatus: 'Replacement Shipped',
    approvalStatus: 'Approved',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 7500,
    notes: 'Power supply unit replacement',
    projectorSerial: 'PROJ-002-2024',
    brand: 'BenQ',
    projectorModel: 'MW632ST',
    customerSite: 'Tech Hub Bangalore',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-25'),
    shipping: {
      outbound: {
        trackingNumber: 'TRK-003',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-01-25'),
        estimatedDelivery: new Date('2024-01-28'),
        actualDelivery: new Date('2024-01-27'),
        status: 'delivered',
        trackingUrl: 'https://dtdc.com/track/TRK-003',
        lastUpdated: new Date(),
        weight: 3.0,
        insuranceValue: 7500,
        requiresSignature: false
      },
      return: {
        trackingNumber: 'TRK-004',
        carrier: 'DTDC',
        carrierService: 'STANDARD',
        shippedDate: new Date('2024-02-05'),
        estimatedDelivery: new Date('2024-02-08'),
        status: 'in_transit',
        trackingUrl: 'https://dtdc.com/track/TRK-004',
        lastUpdated: new Date(),
        weight: 3.0,
        insuranceValue: 7500,
        requiresSignature: false
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 1,
      slaBreached: false
    }
  },
  {
    _id: 'mock-rma-003',
    rmaNumber: 'RMA-2024-003',
    callLogNumber: 'CL-2024-003',
    rmaOrderNumber: 'PO-2024-003',
    ascompRaisedDate: new Date('2024-02-01'),
    customerErrorDate: new Date('2024-01-28'),
    siteName: 'Educational Institute Delhi',
    productName: 'Sony VPL-FHZ75',
    productPartNumber: 'PART-003',
    serialNumber: 'PROJ-003-2024',
    defectivePartNumber: 'DEFECT-003',
    defectivePartName: 'Color Wheel',
    defectiveSerialNumber: 'CW-001',
    symptoms: 'Color distortion, rainbow effect',
    replacedPartNumber: 'REPLACE-003',
    replacedPartName: 'New Color Wheel',
    replacedPartSerialNumber: 'CW-002',
    replacementNotes: 'Color wheel replacement due to mechanical failure',
    shippedDate: new Date('2024-02-05'),
    trackingNumber: 'TRK-005',
    shippedThru: 'Blue Dart',
    remarks: 'Color wheel replacement for lecture hall',
    createdBy: 'Mike Johnson',
    caseStatus: 'Completed',
    approvalStatus: 'Approved',
    priority: 'Critical',
    warrantyStatus: 'In Warranty',
    estimatedCost: 12000,
    notes: 'Color wheel assembly replacement',
    projectorSerial: 'PROJ-003-2024',
    brand: 'Sony',
    projectorModel: 'VPL-FHZ75',
    customerSite: 'Educational Institute Delhi',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    shipping: {
      outbound: {
        trackingNumber: 'TRK-005',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-05'),
        estimatedDelivery: new Date('2024-02-08'),
        actualDelivery: new Date('2024-02-07'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/TRK-005',
        lastUpdated: new Date(),
        weight: 4.0,
        insuranceValue: 12000,
        requiresSignature: true
      },
      return: {
        trackingNumber: 'TRK-006',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-15'),
        estimatedDelivery: new Date('2024-02-18'),
        actualDelivery: new Date('2024-02-17'),
        status: 'delivered',
        trackingUrl: 'https://bluedart.com/track/TRK-006',
        lastUpdated: new Date(),
        weight: 4.0,
        insuranceValue: 12000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 3,
      actualDeliveryDays: 2,
      slaBreached: false
    }
  },
  {
    _id: 'mock-rma-004',
    rmaNumber: 'RMA-2024-004',
    callLogNumber: 'CL-2024-004',
    rmaOrderNumber: 'PO-2024-004',
    ascompRaisedDate: new Date('2024-02-10'),
    customerErrorDate: new Date('2024-02-05'),
    siteName: 'Healthcare Center Chennai',
    productName: 'Panasonic PT-MZ16K',
    productPartNumber: 'PART-004',
    serialNumber: 'PROJ-004-2024',
    defectivePartNumber: 'DEFECT-004',
    defectivePartName: 'Lens Assembly',
    defectiveSerialNumber: 'LENS-001',
    symptoms: 'Blurry image, focus issues',
    replacedPartNumber: 'REPLACE-004',
    replacedPartName: 'New Lens Assembly',
    replacedPartSerialNumber: 'LENS-002',
    replacementNotes: 'Lens assembly replacement for surgical precision',
    shippedDate: new Date('2024-02-12'),
    trackingNumber: 'TRK-007',
    shippedThru: 'Blue Dart',
    remarks: 'Critical replacement for operating theater',
    createdBy: 'Sarah Wilson',
    caseStatus: 'RMA Raised Yet to Deliver',
    approvalStatus: 'Under Investigation',
    priority: 'Critical',
    warrantyStatus: 'In Warranty',
    estimatedCost: 15000,
    notes: 'Lens assembly replacement for medical equipment',
    projectorSerial: 'PROJ-004-2024',
    brand: 'Panasonic',
    projectorModel: 'PT-MZ16K',
    customerSite: 'Healthcare Center Chennai',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-12'),
    shipping: {
      outbound: {
        trackingNumber: 'TRK-007',
        carrier: 'BLUE_DART',
        carrierService: 'EXPRESS',
        shippedDate: new Date('2024-02-12'),
        estimatedDelivery: new Date('2024-02-15'),
        status: 'in_transit',
        trackingUrl: 'https://bluedart.com/track/TRK-007',
        lastUpdated: new Date(),
        weight: 5.0,
        insuranceValue: 15000,
        requiresSignature: true
      }
    },
    sla: {
      targetDeliveryDays: 2,
      actualDeliveryDays: 0,
      slaBreached: false
    }
  },
  {
    _id: 'mock-rma-005',
    rmaNumber: 'RMA-2024-005',
    callLogNumber: 'CL-2024-005',
    rmaOrderNumber: 'PO-2024-005',
    ascompRaisedDate: new Date('2024-02-15'),
    customerErrorDate: new Date('2024-02-10'),
    siteName: 'Manufacturing Plant Pune',
    productName: 'Optoma EH412',
    productPartNumber: 'PART-005',
    serialNumber: 'PROJ-005-2024',
    defectivePartNumber: 'DEFECT-005',
    defectivePartName: 'Cooling Fan',
    defectiveSerialNumber: 'FAN-001',
    symptoms: 'Overheating, automatic shutdown',
    replacedPartNumber: 'REPLACE-005',
    replacedPartName: 'New Cooling Fan',
    replacedPartSerialNumber: 'FAN-002',
    replacementNotes: 'Cooling fan replacement to prevent overheating',
    shippedDate: new Date('2024-02-18'),
    trackingNumber: 'TRK-008',
    shippedThru: 'DTDC',
    remarks: 'Cooling fan replacement for control room',
    createdBy: 'David Brown',
    caseStatus: 'Awaiting Parts',
    approvalStatus: 'Approved',
    priority: 'Medium',
    warrantyStatus: 'In Warranty',
    estimatedCost: 3000,
    notes: 'Cooling fan assembly replacement',
    projectorSerial: 'PROJ-005-2024',
    brand: 'Optoma',
    projectorModel: 'EH412',
    customerSite: 'Manufacturing Plant Pune',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-18'),
    sla: {
      targetDeliveryDays: 5,
      actualDeliveryDays: 0,
      slaBreached: false
    }
  }
];

const mockDTRs = [
  {
    _id: 'mock-dtr-001',
    dtrNumber: 'DTR-2024-001',
    siteName: 'Corporate Office Mumbai',
    projectorSerial: 'PROJ-001-2024',
    issueDate: new Date('2024-01-10'),
    reportedBy: 'Rajesh Kumar',
    issueDescription: 'Projector not displaying any image, lamp indicator blinking red',
    priority: 'High',
    status: 'Converted to RMA',
    resolution: 'Converted to RMA-2024-001',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: 'mock-dtr-002',
    dtrNumber: 'DTR-2024-002',
    siteName: 'Tech Hub Bangalore',
    projectorSerial: 'PROJ-002-2024',
    issueDate: new Date('2024-01-11'),
    reportedBy: 'Priya Sharma',
    issueDescription: 'Projector experiencing intermittent power issues and shutdowns',
    priority: 'Medium',
    status: 'Converted to RMA',
    resolution: 'Converted to RMA-2024-002',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-16')
  },
  {
    _id: 'mock-dtr-003',
    dtrNumber: 'DTR-2024-003',
    siteName: 'Educational Institute Delhi',
    projectorSerial: 'PROJ-003-2024',
    issueDate: new Date('2024-01-28'),
    reportedBy: 'Dr. Amit Singh',
    issueDescription: 'Color distortion and rainbow effect on projected image',
    priority: 'Critical',
    status: 'Converted to RMA',
    resolution: 'Converted to RMA-2024-003',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-01')
  }
];

const mockSites = [
  {
    _id: 'mock-site-001',
    name: 'Corporate Office Mumbai',
    address: '123 Business Park, Andheri East, Mumbai 400069',
    contactPerson: 'Rajesh Kumar',
    contactPhone: '+91-9876543210',
    contactEmail: 'rajesh@corporate.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    type: 'Corporate',
    status: 'Active'
  },
  {
    _id: 'mock-site-002',
    name: 'Tech Hub Bangalore',
    address: '456 IT Park, Electronic City, Bangalore 560100',
    contactPerson: 'Priya Sharma',
    contactPhone: '+91-9876543211',
    contactEmail: 'priya@techhub.com',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    type: 'Tech Center',
    status: 'Active'
  },
  {
    _id: 'mock-site-003',
    name: 'Educational Institute Delhi',
    address: '789 University Road, Delhi 110001',
    contactPerson: 'Dr. Amit Singh',
    contactPhone: '+91-9876543212',
    contactEmail: 'amit@eduinst.com',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    type: 'Educational',
    status: 'Active'
  },
  {
    _id: 'mock-site-004',
    name: 'Healthcare Center Chennai',
    address: '321 Medical Complex, Chennai 600001',
    contactPerson: 'Dr. Lakshmi Nair',
    contactPhone: '+91-9876543213',
    contactEmail: 'lakshmi@healthcare.com',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    type: 'Healthcare',
    status: 'Active'
  },
  {
    _id: 'mock-site-005',
    name: 'Manufacturing Plant Pune',
    address: '654 Industrial Area, Pune 411001',
    contactPerson: 'Vikram Joshi',
    contactPhone: '+91-9876543214',
    contactEmail: 'vikram@manufacturing.com',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    type: 'Manufacturing',
    status: 'Active'
  }
];

const mockProjectors = [
  {
    _id: 'mock-projector-001',
    serialNumber: 'PROJ-001-2024',
    model: 'Epson PowerLite 1781W',
    brand: 'Epson',
    siteName: 'Corporate Office Mumbai',
    installationDate: new Date('2023-06-15'),
    warrantyExpiry: new Date('2025-06-15'),
    status: 'Active',
    location: 'Conference Room A',
    lastMaintenanceDate: new Date('2024-01-15'),
    totalUsageHours: 1250
  },
  {
    _id: 'mock-projector-002',
    serialNumber: 'PROJ-002-2024',
    model: 'BenQ MW632ST',
    brand: 'BenQ',
    siteName: 'Tech Hub Bangalore',
    installationDate: new Date('2023-08-20'),
    warrantyExpiry: new Date('2025-08-20'),
    status: 'Active',
    location: 'Training Room 1',
    lastMaintenanceDate: new Date('2024-02-10'),
    totalUsageHours: 980
  },
  {
    _id: 'mock-projector-003',
    serialNumber: 'PROJ-003-2024',
    model: 'Sony VPL-FHZ75',
    brand: 'Sony',
    siteName: 'Educational Institute Delhi',
    installationDate: new Date('2023-09-10'),
    warrantyExpiry: new Date('2025-09-10'),
    status: 'Under Maintenance',
    location: 'Lecture Hall 2',
    lastMaintenanceDate: new Date('2024-03-05'),
    totalUsageHours: 2100
  },
  {
    _id: 'mock-projector-004',
    serialNumber: 'PROJ-004-2024',
    model: 'Panasonic PT-MZ16K',
    brand: 'Panasonic',
    siteName: 'Healthcare Center Chennai',
    installationDate: new Date('2023-11-05'),
    warrantyExpiry: new Date('2025-11-05'),
    status: 'Active',
    location: 'Operating Theater 1',
    lastMaintenanceDate: new Date('2024-01-20'),
    totalUsageHours: 750
  },
  {
    _id: 'mock-projector-005',
    serialNumber: 'PROJ-005-2024',
    model: 'Optoma EH412',
    brand: 'Optoma',
    siteName: 'Manufacturing Plant Pune',
    installationDate: new Date('2023-12-01'),
    warrantyExpiry: new Date('2025-12-01'),
    status: 'Active',
    location: 'Control Room',
    lastMaintenanceDate: new Date('2024-02-28'),
    totalUsageHours: 450
  }
];

// Mock data endpoints
router.get('/rmas', (req, res) => {
  res.json(mockRMAs);
});

router.get('/dtrs', (req, res) => {
  res.json(mockDTRs);
});

router.get('/sites', (req, res) => {
  res.json(mockSites);
});

router.get('/projectors', (req, res) => {
  res.json(mockProjectors);
});

module.exports = router;








