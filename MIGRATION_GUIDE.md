# 🔄 Old Reports to ASCOMP Format Migration Guide

## 📋 Overview

This guide will help you safely migrate all your **old service reports** (REPORT-XXXXX) to the **new ASCOMP format** (ASCOMP-EW-XXXXX) so they can be downloaded as professional PDFs in the exact Word document format.

---

## ✅ What This Migration Does

### **Before Migration:**
```
Database:
├── Old Reports (REPORT-XXXXX)
│   ├── Different data structure
│   ├── No PDF download available
│   └── Can only view online
└── New Reports (ASCOMP-XXXXX)
    ├── Exact ASCOMP format
    ├── Professional PDF download
    └── All 33+ fields
```

### **After Migration:**
```
Database:
├── Old Reports (REPORT-XXXXX) [kept for reference]
└── Migrated Reports (ASCOMP-EW-XXXXX)
    ├── Exact ASCOMP format
    ├── Professional PDF download
    ├── All data from old reports
    └── Ready for download! ✨
```

---

## 🛡️ Safety First

### **The migration is SAFE because:**
1. ✅ **Non-destructive**: Old reports are NOT deleted
2. ✅ **Creates new records**: Migrated reports get new IDs
3. ✅ **Backup included**: Automatic backup before migration
4. ✅ **Skip duplicates**: Won't re-migrate already converted reports
5. ✅ **Rollback possible**: Can revert if needed

---

## 📝 Step-by-Step Migration Process

### **Step 1: Backup Your Data** (IMPORTANT!)

```bash
# Navigate to backend directory
cd backend

# Run backup script
node server/scripts/backup-reports.js
```

**Expected Output:**
```
📦 Starting backup of old reports...
✓ Connected to MongoDB
→ Found 75 reports to backup
✓ Backup completed!
📁 Backup saved to: backups/old-reports-backup-2025-10-06T14-30-00.json
💾 Backup size: 156.43 KB
```

**✅ Backup file saved at:** `backups/old-reports-backup-YYYY-MM-DDTHH-MM-SS.json`

---

### **Step 2: Run the Migration Script**

```bash
# Still in backend directory
node server/scripts/migrate-old-reports-to-ascomp.js
```

**Expected Output:**
```
============================================================
  ASCOMP Report Migration Tool
  Converting old reports to exact ASCOMP format
============================================================

ℹ 🚀 Starting migration of old reports to ASCOMP format...

→ Connecting to MongoDB...
✓ Connected to MongoDB

→ Fetching old service reports...
ℹ Found 75 old reports to migrate

→ [1/75] Migrating REPORT-1759247980004...
✓ [1/75] ✓ Migrated to ASCOMP-EW-1759247980004

→ [2/75] Migrating REPORT-1759244952524...
✓ [2/75] ✓ Migrated to ASCOMP-EW-1759244952524

... (continues for all reports) ...

============================================================
ℹ 📊 MIGRATION SUMMARY
============================================================
✓ Successfully migrated: 75
⊘ Skipped (already migrated): 0
✗ Failed: 0
============================================================

ℹ ✅ Migration completed!
ℹ 🎉 All old reports are now available in ASCOMP format with exact PDF export!

Database connection closed.
✓ Migration process completed successfully!
```

---

### **Step 3: Verify the Migration**

1. **Open your application**
2. **Go to ASCOMP Reports page**
3. **Look for reports starting with** `ASCOMP-EW-`
4. **Click "Download PDF"** on any migrated report
5. **PDF should download in exact ASCOMP format!** ✨

---

## 🔍 What Gets Migrated

### **Data Mapping:**

| Old Field | New Field | Status |
|-----------|-----------|--------|
| `siteName` → | `cinemaName` | ✅ Mapped |
| `projectorModel` + `projectorSerial` + `runningHours` → | `projectorModelSerialAndHours` | ✅ Combined |
| `sections.opticals[]` → | `opticals.{reflector, uvFilter, ...}` | ✅ Converted |
| `sections.electronics[]` → | `electronics.{touchPanel, evbBoard, ...}` | ✅ Converted |
| `sections.mechanical[]` → | `mechanical.{acBlower, fans, ...}` | ✅ Converted |
| `imageEvaluation` → | `imageEvaluation` | ✅ Mapped |
| `airPollutionLevel` → | `airPollutionLevel` | ✅ Mapped |
| `engineer` → | `engineer` | ✅ Mapped |

### **New Fields (Added with defaults):**
- ✅ `serialNumberVerified`
- ✅ `disposableConsumables`
- ✅ `coolant` (3 items)
- ✅ `lightEngineTestPattern` (3 items)
- ✅ `lampLocMechanism`
- ✅ `cieXyzColorAccuracy`
- ✅ `softwareVersion` table
- ✅ `screenInformation` table

---

## 📊 Expected Results

### **Report Numbers Change:**
```
REPORT-1759247980004  →  ASCOMP-EW-1759247980004
REPORT-1759244952524  →  ASCOMP-EW-1759244952524
REPORT-1759244688766  →  ASCOMP-EW-1759244688766
```

### **In the UI:**
```
Before Migration:
├── REPORT-1759247980004 ❌ No PDF available
├── REPORT-1759244952524 ❌ No PDF available
└── ASCOMP-1759244688766 ✅ PDF available

After Migration:
├── ASCOMP-EW-1759247980004 ✅ PDF available (migrated)
├── ASCOMP-EW-1759244952524 ✅ PDF available (migrated)
└── ASCOMP-1759244688766 ✅ PDF available (original)
```

---

## 🔄 Re-running the Migration

The migration is **idempotent** - you can run it multiple times safely:

```bash
# If you run migration again
node server/scripts/migrate-old-reports-to-ascomp.js
```

**Output:**
```
→ [1/75] Migrating REPORT-1759247980004...
⚠ [1/75] Already migrated: ASCOMP-EW-1759247980004
```

**Result:** Already migrated reports are **skipped**, not duplicated.

---

## 🛠️ Troubleshooting

### **Issue 1: "Cannot connect to MongoDB"**

**Solution:**
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# Or check your MONGODB_URI in .env file
```

### **Issue 2: "Module not found"**

**Solution:**
```bash
cd backend
npm install
```

### **Issue 3: "Some reports failed to migrate"**

**Check the error log in terminal:**
```
❌ ERRORS:
  - REPORT-12345: Missing required field 'date'
```

**Solution:** The script will show which reports failed and why. You can:
1. Fix the data manually in MongoDB
2. Re-run migration (it will retry failed ones)
3. Or skip problematic reports (they'll still be viewable online)

---

## 🗑️ Cleanup (Optional)

### **Option 1: Keep Old Reports** (Recommended)
- Keep old reports for reference
- No action needed
- Old reports remain accessible

### **Option 2: Archive Old Reports**
After verifying migration worked:

```javascript
// Optional: Mark old reports as archived
// backend/server/scripts/archive-old-reports.js
const ServiceReport = require('../models/ServiceReport');

await ServiceReport.updateMany(
  { reportNumber: { $regex: /^REPORT-/ } },
  { $set: { archived: true } }
);
```

### **Option 3: Delete Old Reports** (Not Recommended)
Only if you're 100% sure migration worked:

```javascript
// DANGEROUS: Only do this if you're certain!
// await ServiceReport.deleteMany({ reportNumber: { $regex: /^REPORT-/ } });
```

---

## 🔙 Rollback (If Needed)

If something goes wrong, you can rollback:

### **Method 1: Delete Migrated Reports**
```javascript
// backend/server/scripts/rollback-migration.js
const ASCOMPReport = require('../models/ASCOMPReport');

await ASCOMPReport.deleteMany({ 
  reportNumber: { $regex: /^ASCOMP-EW-/ } 
});
```

### **Method 2: Restore from Backup**
```bash
# Use the backup file created in Step 1
# Import back into MongoDB using mongoimport or your database tool
```

---

## ✅ Post-Migration Checklist

After migration, verify:

- [ ] All old reports have migrated versions (ASCOMP-EW-XXXXX)
- [ ] Can download PDF from migrated reports
- [ ] PDF matches exact ASCOMP Word document format
- [ ] All checklist items appear in PDF
- [ ] Engineer information is correct
- [ ] Dates and cinema names are correct
- [ ] No errors in application console

---

## 📈 Benefits After Migration

✅ **All reports downloadable** - Even old ones  
✅ **Professional format** - Exact ASCOMP Word document layout  
✅ **Consistent experience** - Same format for all reports  
✅ **Better organization** - All reports in one system  
✅ **PDF generation** - On-demand PDF creation  
✅ **Future-proof** - Ready for new features  

---

## 📞 Support

If you encounter issues:

1. **Check logs** - Terminal output shows detailed errors
2. **Verify backup** - Ensure backup file exists
3. **Test with one report** - Modify script to test on single report first
4. **Contact support** - Provide error messages from terminal

---

## 🎯 Quick Reference

### **Backup Command:**
```bash
cd backend && node server/scripts/backup-reports.js
```

### **Migration Command:**
```bash
cd backend && node server/scripts/migrate-old-reports-to-ascomp.js
```

### **Check Migration Status:**
```javascript
// In MongoDB or backend console
const count = await ASCOMPReport.countDocuments({ 
  reportNumber: { $regex: /^ASCOMP-EW-/ } 
});
console.log(`Migrated reports: ${count}`);
```

---

## 📚 Files Created

1. ✅ `backend/server/scripts/migrate-old-reports-to-ascomp.js` - Main migration script
2. ✅ `backend/server/scripts/backup-reports.js` - Backup script
3. ✅ `backups/old-reports-backup-TIMESTAMP.json` - Backup file
4. ✅ `MIGRATION_GUIDE.md` - This guide

---

**Migration Tool Version:** 1.0.0  
**Date:** October 6, 2025  
**Status:** ✅ Ready to use  
**Safety:** 🛡️ Non-destructive, with backup







