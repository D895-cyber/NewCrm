const mongoose = require('mongoose');
require('dotenv').config();

// Import the DTR model
const DTR = require('./server/models/DTR');

// Function to parse DDMMYY format dates
function parseDDMMYYDate(dateStr) {
  if (!dateStr) return null;
  
  const trimmedDate = dateStr.toString().trim();
  
  // Handle DDMMYY format (6 digits) - like "250623"
  if (/^\d{6}$/.test(trimmedDate)) {
    const day = parseInt(trimmedDate.substring(0, 2));
    const month = parseInt(trimmedDate.substring(2, 4));
    const year = parseInt(trimmedDate.substring(4, 6));
    
    // Convert 2-digit year to 4-digit year
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    
    // Validate the parts
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
      return new Date(fullYear, month - 1, day);
    }
  }
  
  return null;
}

// Function to fix DTR dates
async function fixDTRDates() {
  try {
    console.log('🔧 Starting DTR date fix migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Find all DTRs
    const dtrs = await DTR.find({});
    console.log(`📊 Found ${dtrs.length} DTRs to check`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const dtr of dtrs) {
      try {
        let needsUpdate = false;
        const updateData = {};
        
        // Check errorDate
        if (dtr.errorDate) {
          const errorDateStr = dtr.errorDate.toString();
          
          // If it's a string that looks like YYMMDD, fix it
          if (typeof dtr.errorDate === 'string' && /^\d{6}$/.test(errorDateStr)) {
            const fixedDate = parseDDMMYYDate(errorDateStr);
            if (fixedDate) {
              updateData.errorDate = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed errorDate for ${dtr.caseId}: ${errorDateStr} → ${fixedDate.toISOString()}`);
            }
          }
          // If it's a Date object but invalid (like Excel serial number conversion)
          else if (dtr.errorDate instanceof Date && isNaN(dtr.errorDate.getTime())) {
            const fixedDate = parseDDMMYYDate(errorDateStr);
            if (fixedDate) {
              updateData.errorDate = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed invalid errorDate for ${dtr.caseId}: ${errorDateStr} → ${fixedDate.toISOString()}`);
            }
          }
        }
        
        // Check complaintDate
        if (dtr.complaintDate) {
          const complaintDateStr = dtr.complaintDate.toString();
          
          // If it's a string that looks like YYMMDD, fix it
          if (typeof dtr.complaintDate === 'string' && /^\d{6}$/.test(complaintDateStr)) {
            const fixedDate = parseYYMMDDDate(complaintDateStr);
            if (fixedDate) {
              updateData.complaintDate = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed complaintDate for ${dtr.caseId}: ${complaintDateStr} → ${fixedDate.toISOString()}`);
            }
          }
          // If it's a Date object but invalid (like Excel serial number conversion)
          else if (dtr.complaintDate instanceof Date && isNaN(dtr.complaintDate.getTime())) {
            const fixedDate = parseYYMMDDDate(complaintDateStr);
            if (fixedDate) {
              updateData.complaintDate = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed invalid complaintDate for ${dtr.caseId}: ${complaintDateStr} → ${fixedDate.toISOString()}`);
            }
          }
        }
        
        // Check closedBy.closedDate
        if (dtr.closedBy && dtr.closedBy.closedDate) {
          const closedDateStr = dtr.closedBy.closedDate.toString();
          
          // If it's a string that looks like YYMMDD, fix it
          if (typeof dtr.closedBy.closedDate === 'string' && /^\d{6}$/.test(closedDateStr)) {
            const fixedDate = parseYYMMDDDate(closedDateStr);
            if (fixedDate) {
              updateData['closedBy.closedDate'] = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed closedDate for ${dtr.caseId}: ${closedDateStr} → ${fixedDate.toISOString()}`);
            }
          }
          // If it's a Date object but invalid (like Excel serial number conversion)
          else if (dtr.closedBy.closedDate instanceof Date && isNaN(dtr.closedBy.closedDate.getTime())) {
            const fixedDate = parseYYMMDDDate(closedDateStr);
            if (fixedDate) {
              updateData['closedBy.closedDate'] = fixedDate;
              needsUpdate = true;
              console.log(`🔧 Fixed invalid closedDate for ${dtr.caseId}: ${closedDateStr} → ${fixedDate.toISOString()}`);
            }
          }
        }
        
        // Update the DTR if needed
        if (needsUpdate) {
          await DTR.findByIdAndUpdate(dtr._id, updateData);
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing DTR ${dtr.caseId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Fixed: ${fixedCount} DTRs`);
    console.log(`❌ Errors: ${errorCount} DTRs`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
fixDTRDates();
