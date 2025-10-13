const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const RMA = require('../models/RMA');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for large datasets
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Excel Column Mapping to RMA Fields - Updated to match user's sheet
const EXCEL_COLUMN_MAPPING = {
  // Support both old and new column header formats
  // Note: 'S. No.' is a row index in spreadsheets; do not map to any DB field
  'RMA/CI/RMA/Lsm': 'rmaType',
  'RMA/CI RMA/Lamps': 'rmaType',
  'Call Log': 'callLogNumber',
  'Call Log #': 'callLogNumber',
  'Call Log Number': 'callLogNumber',
  'RMA': 'rmaNumber',
  'RMA #': 'rmaNumber',
  'RMA Number': 'rmaNumber',
  'RMA Order': 'rmaOrderNumber',
  'RMA Order # SX/S4': 'rmaOrderNumber',
  'RMA Order Number': 'rmaOrderNumber',
  'SX': 'sxNumber', // New field for SX
  'Ascomp Raxise': 'ascompRaisedDate',
  'Ascomp Raised Date': 'ascompRaisedDate',
  'ASCOMP Raised Date': 'ascompRaisedDate',
  'ed Ds': 'customerErrorDate', // Assuming this is "Customer Error Date"
  'Customer Error Ds': 'customerErrorDate',
  'Customer Error Date': 'customerErrorDate',
  'Site Name': 'siteName',
  'Product Nam': 'productPartNumber', // Swapped: Product Name contains projector model, map to productPartNumber
  'Product Name': 'productPartNumber', // Swapped: Product Name contains projector model, map to productPartNumber
  'Product Par': 'productName', // Swapped: Product Part contains projector model, map to productName
  'Product Part #': 'productName', // Swapped: Product Part contains projector model, map to productName
  'Product Part Number': 'productName', // Swapped: Product Part contains projector model, map to productName
  'Serial #': 'productPartNumber', // Swapped: Serial Number contains part number, map to productPartNumber
  'Serial Number': 'productPartNumber', // Swapped: Serial Number contains part number, map to productPartNumber
  'Projector Serial': 'projectorSerial', // Actual projector serial number
  'Projector Serial #': 'projectorSerial', // Actual projector serial number
  'Projector Serial Number': 'projectorSerial', // Actual projector serial number
  'Defective Pa': 'defectivePartName',
  'Defective Part Name': 'defectivePartName',
  'Defecti': 'defectivePartName', // Partial match
  'ive Part Num': 'defectivePartNumber',
  'Defective Part #': 'defectivePartNumber',
  'Defective Part Number': 'defectivePartNumber',
  'Defective Seris': 'defectiveSerialNumber',
  'Defective Serial #': 'defectiveSerialNumber',
  'Defective Serial Number': 'defectiveSerialNumber',
  'Symptom': 'symptoms',
  'Symptoms': 'symptoms',
  'Replaced Par': 'replacedPartName',
  'Replaced Part Name': 'replacedPartName',
  'Replaced Part #': 'replacedPartNumber',
  'Replaced Part Number': 'replacedPartNumber',
  'Replaced Part Seris': 'replacedPartSerialNumber',
  'Replaced Part Serial #': 'replacedPartSerialNumber',
  'Replaced Part Serial Number': 'replacedPartSerialNumber',
  // Common alternative labels using "Replacement"
  'Replacement Part Name': 'replacedPartName',
  'Replacement Part #': 'replacedPartNumber',
  'Replacement Part Number': 'replacedPartNumber',
  'Replacement Serial #': 'replacedPartSerialNumber',
  'Replacement Serial Number': 'replacedPartSerialNumber',
  'Replacement Part Serial #': 'replacedPartSerialNumber',
  'Replacement Part Serial Number': 'replacedPartSerialNumber',
  'Replacement Notes': 'replacementNotes',
  'Shipped da': 'shippedDate',
  'Shipped date': 'shippedDate',
  'Shipped Date': 'shippedDate',
  'Trac': 'trackingNumber', // Partial match
  'king': 'trackingNumber', // Partial match
  'Tracking #': 'trackingNumber',
  'Tracking Number': 'trackingNumber',
  'Shipped Th': 'shippedThru', // Partial match
  'Shipped Thru\'': 'shippedThru',
  'Shipped Through': 'shippedThru',
  'Remarks': 'remarks',
  'Created': 'createdBy', // Partial match
  'Created By': 'createdBy',
  // Common alternative label for call log
  'Call No': 'callLogNumber',
  'Call No.': 'callLogNumber',
  'Case Status': 'caseStatus',
  'Approval Status': 'approvalStatus',
  // Do NOT map bare 'RMA' header to a date to avoid overriding rmaNumber
  'A return Shipped da': 'rmaReturnShippedDate',
  'RMA return Shipped date': 'rmaReturnShippedDate',
  'RMA Return Shipped Date': 'rmaReturnShippedDate',
  'RMA return Tracking': 'rmaReturnTrackingNumber',
  'RMA return Tracking #': 'rmaReturnTrackingNumber',
  'RMA Return Tracking Number': 'rmaReturnTrackingNumber',
  'RMA return Shipped Thru': 'rmaReturnShippedThru',
  'RMA return Shipped Thru\'': 'rmaReturnShippedThru',
  'RMA Return Shipped Through': 'rmaReturnShippedThru',
  // Additional fields from your CSV
  'Days Count Shipped to Site': 'daysCountShippedToSite',
  'Days Count Return to CDS': 'daysCountReturnToCDS',
  'Projector Serial': 'projectorSerial',
  'Brand': 'brand',
  'Projector Model': 'projectorModel',
  'Customer Site': 'customerSite',
  'Priority': 'priority',
  'Warranty Status': 'warrantyStatus',
  'Estimated Cost': 'estimatedCost',
  'Notes': 'notes',
  'Outbound Tracking Number': 'outboundTrackingNumber',
  'Outbound Carrier': 'outboundCarrier',
  'Outbound Carrier Service': 'outboundCarrierService',
  'Outbound Shipped Date': 'outboundShippedDate',
  'Outbound Estimated Delivery': 'outboundEstimatedDelivery',
  'Outbound Actual Delivery': 'outboundActualDelivery',
  'Outbound Status': 'outboundStatus',
  'Outbound Tracking URL': 'outboundTrackingURL',
  'Outbound Weight': 'outboundWeight',
  'Outbound Insurance Value': 'outboundInsuranceValue',
  'Outbound Requires Signature': 'outboundRequiresSignature',
  'Return Tracking Number': 'returnTrackingNumber',
  'Return Carrier': 'returnCarrier',
  'Return Carrier Service': 'returnCarrierService',
  'Return Shipped Date': 'returnShippedDate',
  'Return Estimated Delivery': 'returnEstimatedDelivery',
  'Return Actual Delivery': 'returnActualDelivery',
  'Return Status': 'returnStatus',
  'Return Tracking URL': 'returnTrackingURL',
  'Return Weight': 'returnWeight',
  'Return Insurance Value': 'returnInsuranceValue',
  'Return Requires Signature': 'returnRequiresSignature',
  'Target Delivery Days': 'targetDeliveryDays',
  'Actual Delivery Days': 'actualDeliveryDays',
  'SLA Breached': 'slaBreached',
  'Breach Reason': 'breachReason'
};

// Status mapping from Excel to database - Updated with user's specific status values
const STATUS_MAPPING = {
  // User's CSV exact values (lowercase)
  'closed': 'Completed',  // Map CSV "closed" to "Completed" status
  'Closed': 'Completed',  // Map CSV "Closed" to "Completed" status
  'under review': 'Under Review',
  'Under Review': 'Under Review',
  'faulty in transit to cds': 'Faulty Transit to CDS',
  'Faulty in transit to cds': 'Faulty Transit to CDS',
  'Faulty in transit to CDS': 'Faulty Transit to CDS',  // Exact CSV value
  'Faulty In Transit To CDS': 'Faulty Transit to CDS',
  'FAULTY IN TRANSIT TO CDS': 'Faulty Transit to CDS',
  'Faulty Transit to CDS': 'Faulty Transit to CDS',
  'faulty transit to cds': 'Faulty Transit to CDS',
  'faulty in transit to CDS': 'Faulty Transit to CDS',
  'open': 'Open',
  'Open': 'Open',
  'rma yet to be raised': 'RMA Raised Yet to Deliver',
  'RMA yet to be raised': 'RMA Raised Yet to Deliver',
  'RMA Yet to be Raised': 'RMA Raised Yet to Deliver',
  'RMA Rasied Yet to Diliver': 'RMA Raised Yet to Deliver',
  'RMA Raised Yet to Deliver': 'RMA Raised Yet to Deliver',
  'rma raised yet to deliver': 'RMA Raised Yet to Deliver',  // Exact CSV value (lowercase)
  'RMA raised Yet to Deliver': 'RMA Raised Yet to Deliver',  // Exact CSV value (mixed case)
  'RMA RAISED YET TO DELIVER': 'RMA Raised Yet to Deliver',  // Uppercase variant

  // Legacy status mappings for backward compatibility
  'Sent to CDS': 'Sent to CDS',
  'sent to cds': 'Sent to CDS',
  'CDS Approved': 'CDS Approved',
  'cds approved': 'CDS Approved',
  'Replacement Shipped': 'Replacement Shipped',
  'replacement shipped': 'Replacement Shipped',
  'Replacement Received': 'Replacement Received',
  'replacement received': 'Replacement Received',
  'Installation Complete': 'Installation Complete',
  'installation complete': 'Installation Complete',
  'Faulty Part Returned': 'Faulty Part Returned',
  'faulty part returned': 'Faulty Part Returned',
  'CDS Confirmed Return': 'CDS Confirmed Return',
  'cds confirmed return': 'CDS Confirmed Return',
  'Completed': 'Completed',
  'completed': 'Completed',
  'Rejected': 'Rejected',
  'rejected': 'Rejected',
  'In Progress': 'Under Review',
  'in progress': 'Under Review',
  'Pending': 'Under Review',
  'pending': 'Under Review',
  'Approved': 'CDS Approved',
  'approved': 'CDS Approved',
  'Shipped': 'Replacement Shipped',
  'shipped': 'Replacement Shipped',
  'Delivered': 'Replacement Received',
  'delivered': 'Replacement Received',
  'Returned': 'Faulty Part Returned',
  'returned': 'Faulty Part Returned'
};

// Approval Status mapping - separate from case status
const APPROVAL_STATUS_MAPPING = {
  'DNR': 'Pending Review', // Do Not Review -> Pending Review
  'Pending Review': 'Pending Review',
  'Approved': 'Approved',
  'Rejected': 'Rejected',
  'Under Investigation': 'Under Investigation',
  'Pending': 'Pending Review',
  'Approved': 'Approved',
  'Rejected': 'Rejected'
};

// Priority mapping
const PRIORITY_MAPPING = {
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Critical': 'Critical',
  'Urgent': 'High',
  'Normal': 'Medium'
};

// Parse date from various formats
function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  
  // Handle various date formats
  const formats = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY
    /^\d{1,2}-\d{1,2}-\d{2}$/ // MM-DD-YY
  ];
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    return null;
  }
}

// Clean and validate data
function cleanData(row) {
  const cleaned = {};
  
  for (const [excelCol, dbField] of Object.entries(EXCEL_COLUMN_MAPPING)) {
    const value = row[excelCol];
    
    if (value === undefined || value === null || value === '') {
      cleaned[dbField] = null;
      continue;
    }
    
    const stringValue = String(value).trim();
    
    // Handle different field types
    if (dbField.includes('Date')) {
      cleaned[dbField] = parseDate(stringValue);
    } else if (dbField === 'caseStatus') {
      cleaned[dbField] = STATUS_MAPPING[stringValue] || 'Under Review';
    } else if (dbField === 'priority') {
      cleaned[dbField] = PRIORITY_MAPPING[stringValue] || 'Medium';
    } else if (dbField === 'rmaType') {
      // Map RMA types
      const rmaType = stringValue.toLowerCase();
      if (rmaType.includes('ci') || rmaType.includes('customer')) {
        cleaned[dbField] = 'Customer Issue';
      } else if (rmaType.includes('lamp')) {
        cleaned[dbField] = 'Lamp Replacement';
      } else {
        cleaned[dbField] = 'Standard RMA';
      }
    } else {
      cleaned[dbField] = stringValue;
    }
  }
  
  // Column-based mapping for specific positions (when header mapping fails)
  // NOTE: Index 0 is S.no (row number) - SKIP IT!
  // Based on your CSV headers: S.no, Call Log #, RMA #, RMA Order #, Ascomp Raised Date, Customer Error Date, Site Name, Product Name, Product Part #, Serial #, Defective Part #, Defective Part Name, Defective Serial #, Symptoms, Replaced Part #, Replaced Part Name, Replaced Part Serial #, Shipped Date, Tracking #, Shipped Thru, Remarks, Created By, Case Status, RMA Return Shipped Date, RMA Return Tracking #, RMA Return Shipped Thru
  const columnMapping = {
    0: null,                     // Column A: S.no (IGNORED - row number)
    1: 'callLogNumber',          // Column B: Call Log #
    2: 'rmaNumber',              // Column C: RMA #
    3: 'rmaOrderNumber',         // Column D: RMA Order #
    4: 'ascompRaisedDate',       // Column E: Ascomp Raised Date
    5: 'customerErrorDate',      // Column F: Customer Error Date
    6: 'siteName',               // Column G: Site Name
    7: 'productName',            // Column H: Product Name
    8: 'productPartNumber',      // Column I: Product Part #
    9: 'serialNumber',           // Column J: Serial #
    10: 'defectiveSerialNumber', // Column K: Defective Part # (contains serial like 416128001)
    11: 'defectivePartName',     // Column L: Defective Part Name
    12: 'defectivePartNumber',   // Column M: Defective Serial # (contains part like Assy.IMCB)
    13: 'symptoms',              // Column N: Symptoms
    14: 'replacedPartNumber',    // Column O: Replaced Part #
    15: 'replacedPartName',      // Column P: Replaced Part Name
    16: 'replacedPartSerialNumber', // Column Q: Replaced Part Serial #
    17: 'shippedDate',           // Column R: Shipped Date
    18: 'trackingNumber',        // Column S: Tracking #
    19: 'shippedThru',           // Column T: Shipped Thru
    20: 'remarks',               // Column U: Remarks
    21: 'createdBy',             // Column V: Created By
    22: 'caseStatus',            // Column W: Case Status
    23: 'rmaReturnShippedDate',  // Column X: RMA Return Shipped Date
    24: 'rmaReturnTrackingNumber', // Column Y: RMA Return Tracking #
    25: 'rmaReturnShippedThru'   // Column Z: RMA Return Shipped Thru
  };
  
  // Apply column-based mapping for missing fields
  Object.keys(row).forEach((key, index) => {
    const dbField = columnMapping[index];
    if (dbField && row[key] && row[key].toString().trim() !== '') {
      const stringValue = String(row[key]).trim();
      
      // Only set if the field is currently null/empty
      if (!cleaned[dbField] || cleaned[dbField] === null) {
        // Handle different field types
        if (dbField.includes('Date')) {
          cleaned[dbField] = parseDate(stringValue);
        } else if (dbField === 'caseStatus') {
          cleaned[dbField] = STATUS_MAPPING[stringValue] || 'Under Review';
        } else if (dbField === 'approvalStatus') {
          cleaned[dbField] = APPROVAL_STATUS_MAPPING[stringValue] || 'Pending Review';
        } else if (dbField === 'priority') {
          cleaned[dbField] = PRIORITY_MAPPING[stringValue] || 'Medium';
        } else if (dbField === 'rmaType') {
          const rmaType = stringValue.toLowerCase();
          if (rmaType.includes('ci') || rmaType.includes('customer')) {
            cleaned[dbField] = 'Customer Issue';
          } else if (rmaType.includes('lamp')) {
            cleaned[dbField] = 'Lamp Replacement';
          } else {
            cleaned[dbField] = 'Standard RMA';
          }
        } else {
          cleaned[dbField] = stringValue;
        }
      }
    }
  });
  
  // Set defaults without using today's date: prefer actual provided dates
  // If one of the dates is missing, mirror from the other to satisfy schema
  if (!cleaned.ascompRaisedDate && cleaned.customerErrorDate) {
    cleaned.ascompRaisedDate = cleaned.customerErrorDate;
  }
  if (!cleaned.customerErrorDate && cleaned.ascompRaisedDate) {
    cleaned.customerErrorDate = cleaned.ascompRaisedDate;
  }
  if (!cleaned.createdBy) {
    cleaned.createdBy = 'Excel Import';
  }
  if (!cleaned.warrantyStatus) {
    cleaned.warrantyStatus = 'In Warranty';
  }
  if (!cleaned.approvalStatus) {
    cleaned.approvalStatus = 'Pending Review';
  }
  if (!cleaned.priority) {
    cleaned.priority = 'Medium';
  }
  
  return cleaned;
}

// Thread-safe RMA number generation using atomic operations
async function generateRMANumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  // Create a unique RMA number using timestamp and random component
  // This ensures uniqueness even in parallel processing
  const uniqueId = `${timestamp.toString().slice(-8)}${random}`;
  return `RMA-${year}-${uniqueId}`;
}

// Alternative: Sequential RMA number generation (slower but sequential)
async function generateSequentialRMANumber() {
  const year = new Date().getFullYear();
  
  // Use findOneAndUpdate with upsert for atomic counter increment
  const Counter = require('mongoose').model('Counter') || 
    require('mongoose').model('Counter', new require('mongoose').Schema({
      _id: String,
      seq: { type: Number, default: 0 }
    }));
  
  const counter = await Counter.findByIdAndUpdate(
    `rma_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  return `RMA-${year}-${String(counter.seq).padStart(4, '0')}`;
}

// Import RMA from CSV
router.post('/rma/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    console.log('📊 Starting RMA CSV import...');
    console.log(`📁 File: ${req.file.originalname}`);
    console.log(`📏 Size: ${req.file.size} bytes`);
    
    // Log database connection status
    console.log('🔍 Database connection status:', {
      readyState: require('mongoose').connection.readyState,
      host: require('mongoose').connection.host,
      name: require('mongoose').connection.name
    });

    const results = {
      totalProcessed: 0,
      inserted: 0,
      updated: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: []
    };

    const rmaData = [];
    const errors = [];

    // Read and parse CSV file
    await new Promise((resolve, reject) => {
      console.log(`📄 Starting CSV parsing for file: ${req.file.originalname}`);

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Clean and validate the data
            const cleanedData = cleanData(row);

            // Debug logging for the first few rows
            if (results.totalProcessed < 3) {
              console.log(`🔍 Processing row ${results.totalProcessed + 1}:`, {
                callLogNumber: cleanedData.callLogNumber,
                siteName: cleanedData.siteName,
                productName: cleanedData.productName,
                serialNumber: cleanedData.serialNumber,
                hasRequiredFields: !!(cleanedData.siteName && cleanedData.productName && cleanedData.serialNumber)
              });
            }

            // Skip if all essential fields are missing (at least one should be present)
            if (!cleanedData.siteName && !cleanedData.productName && !cleanedData.serialNumber) {
              errors.push({
                row: results.totalProcessed + 1,
                error: 'Missing all essential fields: siteName, productName, and serialNumber',
                data: row
              });
              results.errors++;
              return;
            }

            // Provide defaults for missing essential fields
            if (!cleanedData.siteName) {
              cleanedData.siteName = 'Unknown Site';
            }
            if (!cleanedData.productName) {
              cleanedData.productName = 'Unknown Product';
            }
            // Do not auto-generate serial numbers. Allow duplicates and blanks as provided.

            rmaData.push(cleanedData);
            results.totalProcessed++;
          } catch (error) {
            console.error(`❌ Error processing row ${results.totalProcessed + 1}:`, error);
            errors.push({
              row: results.totalProcessed + 1,
              error: error.message,
              data: row
            });
            results.errors++;
          }
        })
        .on('end', () => {
          console.log(`✅ CSV parsing completed. Processed ${results.totalProcessed} rows`);
          resolve();
        })
        .on('error', (csvError) => {
          console.error('❌ CSV parsing error:', csvError);
          reject(new Error(`CSV parsing failed: ${csvError.message}`));
        });
    });

    console.log(`📊 Parsed ${rmaData.length} valid records from CSV`);

    // Process records in batches to handle large datasets
    const BATCH_SIZE = 50; // Process 50 records at a time
    const totalBatches = Math.ceil(rmaData.length / BATCH_SIZE);
    
    console.log(`📊 Processing ${rmaData.length} records in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      try {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, rmaData.length);
        const batch = rmaData.slice(startIndex, endIndex);

        console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (records ${startIndex + 1}-${endIndex})`);

        // Process batch in parallel for better performance
        const batchPromises = batch.map(async (data, batchItemIndex) => {
          const globalIndex = startIndex + batchItemIndex;
          
          try {
            // INSERT-ONLY behavior with duplicate handling by rmaNumber
            const inputRmaNumber = (data.rmaNumber || '').trim();
            if (!inputRmaNumber) {
              data.rmaNumber = await generateRMANumber();
            } else {
              const exists = await RMA.findOne({ rmaNumber: inputRmaNumber }).lean();
              if (exists) {
                data.originalRmaNumber = inputRmaNumber;
                data.rmaNumber = await generateRMANumber();
              } else {
                data.rmaNumber = inputRmaNumber;
              }
            }

            // Insert new record (no upsert)
            try {
              const created = await RMA.create({ ...data, createdAt: new Date() });
              results.inserted++;
              if (globalIndex < 3) {
                console.log(`✅ Inserted RMA ${created.rmaNumber} (Row ${globalIndex + 1})`);
              }
            } catch (upsertError) {
              if (upsertError.code === 11000) {
                // Handle rare race on rmaNumber generation: retry once with a new number
                try {
                  const retryNumber = await generateRMANumber();
                  data.rmaNumber = retryNumber;
                  await RMA.create({ ...data, createdAt: new Date() });
                  results.inserted++;
                } catch (retryErr) {
                  results.errors++;
                  errors.push({ row: globalIndex + 1, error: retryErr.message, data });
                }
              } else {
                console.error(`❌ Validation error for RMA ${data.rmaNumber} (Row ${globalIndex + 1}):`, {
                  message: upsertError.message,
                  name: upsertError.name,
                  code: upsertError.code,
                  errors: upsertError.errors,
                  data: data
                });
                throw upsertError;
              }
            }
          } catch (error) {
            console.error(`❌ Detailed error processing RMA ${globalIndex + 1}:`, {
              message: error.message,
              name: error.name,
              code: error.code,
              stack: error.stack,
              data: data
            });

            errors.push({
              row: globalIndex + 1,
              error: error.message,
              data: data
            });
            results.errors++;
          }
        });
      
      // Wait for all records in this batch to complete
      try {
        await Promise.all(batchPromises);
        console.log(`✅ Completed batch ${batchIndex + 1}/${totalBatches}`);
      } catch (batchError) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
        throw new Error(`Batch processing failed: ${batchError.message}`);
      }

      // Add a small delay between batches to prevent overwhelming the database
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (batchLoopError) {
      console.error(`❌ Batch loop error at batch ${batchIndex + 1}:`, batchLoopError);
      throw new Error(`Batch processing loop failed: ${batchLoopError.message}`);
    }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    results.errorDetails = errors;

    console.log('📊 RMA Import Summary:', results);
    
    // Check actual database count after import
    try {
      const actualCount = await RMA.countDocuments();
      console.log(`🔍 ACTUAL DATABASE COUNT AFTER IMPORT: ${actualCount} records`);
      
      if (actualCount !== (results.inserted + results.updated)) {
        console.log(`⚠️ MISMATCH: Expected ${results.inserted + results.updated} records, but database has ${actualCount} records`);
      } else {
        console.log(`✅ COUNT MATCH: Database count matches import results`);
      }
    } catch (countError) {
      console.error('❌ Error checking database count:', countError.message);
    }

    res.json({
      success: true,
      message: 'RMA import completed',
      summary: results
    });

  } catch (error) {
    console.error('❌ RMA import error:', error);

    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Provide more specific error messages
    let errorMessage = 'RMA import failed';
    let statusCode = 500;

    if (error.message && error.message.includes('CSV')) {
      errorMessage = 'CSV file processing failed. Please check file format.';
    } else if (error.message && error.message.includes('Validation')) {
      errorMessage = 'Data validation failed. Please check required fields.';
    } else if (error.message && error.message.includes('Mongo')) {
      errorMessage = 'Database connection failed. Please try again.';
    } else if (error.message && error.message.includes('duplicate')) {
      errorMessage = 'Duplicate data found. Please check for existing records.';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      stack: error.stack
    });
  }
});

// Download CSV template
router.get('/rma/template', (req, res) => {
  try {
    const templateData = [
      {
        'S. No.': '1',
        'RMA/CI RMA/Lamps': 'Standard RMA',
        'Call Log #': 'CL-2024-001',
        'RMA #': 'RMA-2024-001',
        'RMA Order # SX/S4': 'PO-2024-001',
        'Ascomp Raised Date': '01/15/2024',
        'Customer Error Date': '01/14/2024',
        'Site Name': 'Mumbai Office - Screen #1',
        'Product Name': 'CP-2220',
        'Product Part #': 'CP-2220-MAIN',
        'Serial #': 'SN123456789',
        'Defective Part #': 'LAMP-001',
        'Defective Part Name': 'Projector Lamp',
        'Defective Serial #': 'LAMP-SN-001',
        'Symptoms': 'Lamp not working, no image display',
        'Replaced Part #': 'LAMP-001-NEW',
        'Replaced Part Serial #': 'LAMP-SN-002',
        'Shipped date': '01/16/2024',
        'Tracking #': 'TRK123456789',
        'Shipped Thru\'': 'DTDC',
        'Remarks': 'Urgent replacement needed',
        'Created By': 'John Doe',
        'Case Status': 'Under Review',
        'RMA return Shipped date': '01/20/2024',
        'RMA return Tracking #': 'TRK987654321',
        'RMA return Shipped Thru\'': 'DTDC'
      }
    ];

    const csvContent = convertToCSV(templateData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rma-import-template.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Convert array of objects to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Get import status
router.get('/rma/status', async (req, res) => {
  try {
    const totalRMAs = await RMA.countDocuments();
    const recentImports = await RMA.find({
      createdBy: 'Excel Import',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      totalRMAs,
      recentImports: recentImports.map(rma => ({
        rmaNumber: rma.rmaNumber,
        siteName: rma.siteName,
        productName: rma.productName,
        caseStatus: rma.caseStatus,
        createdAt: rma.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error getting import status:', error);
    res.status(500).json({ error: 'Failed to get import status' });
  }
});

// Bulk JSON import
router.post('/rma/bulk', async (req, res) => {
  try {
    const { rmas } = req.body;
    
    if (!Array.isArray(rmas)) {
      return res.status(400).json({ error: 'RMA data must be an array' });
    }

    console.log(`📊 Starting bulk RMA import for ${rmas.length} records...`);

    const results = {
      totalProcessed: rmas.length,
      inserted: 0,
      updated: 0,
      errors: 0,
      errorDetails: []
    };

    for (let i = 0; i < rmas.length; i++) {
      try {
        const data = cleanData(rmas[i]);
        
        // Skip if all essential fields are missing (at least one should be present)
        if (!data.siteName && !data.productName && !data.serialNumber) {
          results.errorDetails.push({
            row: i + 1,
            error: 'Missing all essential fields: siteName, productName, and serialNumber',
            data: rmas[i]
          });
          results.errors++;
          continue;
        }

        // Provide defaults for missing essential fields
        if (!data.siteName) {
          data.siteName = 'Unknown Site';
        }
        if (!data.productName) {
          data.productName = 'Unknown Product';
        }
        // Do not auto-generate serial numbers
        
        // INSERT-ONLY for bulk JSON: ensure unique rmaNumber; store original in originalRmaNumber if needed
        const inputRmaNumber = (data.rmaNumber || '').trim();
        if (!inputRmaNumber) {
          data.rmaNumber = await generateRMANumber();
        } else {
          const exists = await RMA.findOne({ rmaNumber: inputRmaNumber }).lean();
          if (exists) {
            data.originalRmaNumber = inputRmaNumber;
            data.rmaNumber = await generateRMANumber();
          } else {
            data.rmaNumber = inputRmaNumber;
          }
        }

        await RMA.create(data);
        results.inserted++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          index: i,
          error: error.message,
          data: rmas[i]
        });
      }
    }

    console.log('📊 Bulk RMA Import Summary:', results);

    res.json({
      success: true,
      message: 'Bulk RMA import completed',
      summary: results
    });

  } catch (error) {
    console.error('❌ Bulk RMA import error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk RMA import failed',
      details: error.message
    });
  }
});

// Enhanced bulk upload with progress tracking
router.post('/rma/bulk-enhanced', async (req, res) => {
  try {
    const { rmas, batchSize = 50 } = req.body;
    
    if (!Array.isArray(rmas)) {
      return res.status(400).json({ error: 'RMA data must be an array' });
    }

    console.log(`📊 Starting enhanced bulk RMA import for ${rmas.length} records with batch size ${batchSize}...`);

    const results = {
      totalProcessed: rmas.length,
      inserted: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
      batches: Math.ceil(rmas.length / batchSize)
    };

    // Process in configurable batches
    for (let batchIndex = 0; batchIndex < results.batches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, rmas.length);
      const batch = rmas.slice(startIndex, endIndex);
      
      console.log(`🔄 Processing batch ${batchIndex + 1}/${results.batches} (records ${startIndex + 1}-${endIndex})`);
      
      // Process batch with parallel operations
      const batchPromises = batch.map(async (rmaData, batchItemIndex) => {
        const globalIndex = startIndex + batchItemIndex;
        
        try {
          const data = cleanData(rmaData);
          
          // Skip if all essential fields are missing
          if (!data.siteName && !data.productName && !data.serialNumber) {
            results.errorDetails.push({
              row: globalIndex + 1,
              error: 'Missing all essential fields: siteName, productName, and serialNumber',
              data: rmaData
            });
            results.errors++;
            return;
          }

          // Provide defaults for missing essential fields
          if (!data.siteName) {
            data.siteName = 'Unknown Site';
          }
          if (!data.productName) {
            data.productName = 'Unknown Product';
          }
          // Do not auto-generate serial numbers
          
          // INSERT-ONLY with unique rmaNumber
          const inputRmaNumber = (data.rmaNumber || '').trim();
          if (!inputRmaNumber) {
            data.rmaNumber = await generateRMANumber();
          } else {
            const exists = await RMA.findOne({ rmaNumber: inputRmaNumber }).lean();
            if (exists) {
              data.originalRmaNumber = inputRmaNumber;
              data.rmaNumber = await generateRMANumber();
            } else {
              data.rmaNumber = inputRmaNumber;
            }
          }

          await RMA.create(data);
          results.inserted++;
          
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            index: globalIndex,
            error: error.message,
            data: rmaData
          });
        }
      });
      
      // Wait for batch completion
      await Promise.all(batchPromises);
      
      // Progress update
      const progress = Math.round(((batchIndex + 1) / results.batches) * 100);
      console.log(`📊 Progress: ${progress}% (${batchIndex + 1}/${results.batches} batches completed)`);
      
      // Small delay between batches
      if (batchIndex < results.batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('📊 Enhanced Bulk RMA Import Summary:', results);

    res.json({
      success: true,
      message: 'Enhanced bulk RMA import completed',
      summary: results
    });

  } catch (error) {
    console.error('❌ Enhanced bulk RMA import error:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced bulk RMA import failed',
      details: error.message
    });
  }
});

module.exports = router;