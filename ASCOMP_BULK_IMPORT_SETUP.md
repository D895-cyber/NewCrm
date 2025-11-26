# ASCOMP Bulk Import - Installation & Setup Guide

## Quick Start

This guide will help you set up and use the ASCOMP bulk import feature that allows you to:
- Import old ASCOMP reports from CSV
- Download and store original PDFs from Google Drive
- Auto-generate new formatted PDFs

## Installation Steps

### 1. Install Backend Dependencies

Navigate to your backend directory and install required packages:

```bash
cd backend
npm install csv-parser multer axios
```

**Note:** `puppeteer` and `cloudinary` should already be installed. If not:
```bash
npm install puppeteer cloudinary
```

### 2. Verify File Structure

Ensure these files exist:

#### Backend Files (New/Updated)
```
backend/server/
├── models/
│   └── ASCOMPReport.js (✓ Updated with PDF fields)
├── utils/
│   └── csvToASCOMPMapper.js (✓ New)
├── services/
│   ├── googleDriveService.js (✓ New)
│   └── ascompPdfGeneratorService.js (✓ New)
└── routes/
    └── ascompReports.js (✓ Updated with bulk import routes)
```

#### Frontend Files (New/Updated)
```
frontend/src/components/pages/
├── ASCOMPBulkImport.tsx (✓ New)
└── ASCOMPReportsPage.tsx (✓ Updated with import button)
```

### 3. Create Temp Directory (Backend)

The bulk import uses a temporary directory for file processing:

```bash
# Linux/Mac
mkdir -p backend/tmp

# Windows PowerShell
New-Item -ItemType Directory -Path backend\tmp -Force
```

Or the code will auto-create it on first run.

### 4. Restart Backend Server

```bash
cd backend
npm run dev
# or
node server.js
```

### 5. Verify Frontend Build

```bash
cd frontend
npm run build
# or for development
npm run dev
```

## Environment Variables

Make sure your `.env` file has Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Testing the Feature

### 1. Access ASCOMP Reports Page

1. Log in as **Admin** or **Manager** (required for bulk import)
2. Navigate to **ASCOMP Reports** section
3. You should see the **"Bulk Import ASCOMP Reports"** button

### 2. Download CSV Template

1. Click **"Bulk Import ASCOMP Reports"**
2. In the modal, click **"Download Template"**
3. Open the CSV in Excel or text editor

### 3. Test with Sample Data

Create a test CSV with minimal data:

```csv
reportNumber,date,cinemaName,engineer_name,address,driveLink
ASCOMP-TEST-001,2025-01-15,Test Cinema,Test Engineer,123 Test St,
```

**Note:** Leave `driveLink` empty for initial test (PDF generation only).

### 4. Upload and Import

1. Upload your test CSV
2. Click **"Start Import"**
3. Watch the progress bar
4. Review results

Expected output:
- ✅ 1 report created
- ✅ Generated PDF created
- ⚠️ No original PDF (no Drive link provided)

### 5. Test with Google Drive Link

#### Prepare Test PDF:
1. Upload a test PDF to Google Drive
2. Right-click → Share → Get link
3. Set to **"Anyone with the link can view"**
4. Copy the link

#### Update CSV:
```csv
reportNumber,date,cinemaName,engineer_name,driveLink
ASCOMP-TEST-002,2025-01-16,Test Cinema 2,Test Engineer,https://drive.google.com/file/d/YOUR_FILE_ID/view
```

#### Import again and verify:
- ✅ Report created
- ✅ Original PDF downloaded from Drive
- ✅ Generated PDF created

## API Endpoints Reference

### 1. Bulk Import
```http
POST /api/ascomp-reports/bulk-import
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: { csvFile: <File> }
```

**Response:**
```json
{
  "message": "Bulk import completed",
  "results": {
    "total": 10,
    "success": 9,
    "failed": 1,
    "reports": [...],
    "errors": [...]
  }
}
```

### 2. Download CSV Template
```http
GET /api/ascomp-reports/csv-template
Authorization: Bearer <token>
```

**Response:** CSV file download

## Troubleshooting

### Issue: "Only CSV files are allowed"
**Solution:** Ensure file has `.csv` extension and `text/csv` MIME type.

### Issue: "Failed to download from Google Drive"
**Causes:**
- Drive link not publicly accessible
- Invalid file ID
- Large file requiring confirmation

**Solutions:**
1. Check Drive sharing settings: "Anyone with the link can view"
2. Verify link format: `https://drive.google.com/file/d/FILE_ID/view`
3. For large files (>100MB), the system handles confirmation automatically

### Issue: "PDF generation failed"
**Causes:**
- Puppeteer not installed
- Missing system dependencies (Linux)
- Insufficient memory

**Solutions:**
```bash
# Reinstall Puppeteer
npm install puppeteer

# Linux: Install Chrome dependencies
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils
```

### Issue: "Unauthorized" or "Permission denied"
**Solution:** Only Admin and Manager roles can bulk import. Check user role.

### Issue: CSV parsing errors
**Solutions:**
- Save CSV with UTF-8 encoding
- Use comma (`,`) as delimiter
- Escape special characters with quotes
- Remove extra whitespace

### Issue: Cloudinary upload fails
**Check:**
- Cloudinary credentials in `.env`
- Account upload limits
- File size limits (default: 10MB for raw files)

## Performance Tips

### For Large Imports (100+ reports)

1. **Split into batches**: Import 50 reports at a time
2. **Off-peak hours**: Large imports during low-traffic times
3. **Monitor server resources**: Check CPU/memory usage
4. **Cloudinary limits**: Be aware of API rate limits

### Optimizing Drive Downloads

1. **Pre-check links**: Verify all Drive links before import
2. **Organize files**: Create a Drive folder structure
3. **Network**: Stable internet connection for downloads
4. **File sizes**: Compress PDFs if possible (without quality loss)

## Database Considerations

### Index Optimization

The ASCOMPReport model has indexes on:
- `reportNumber` (unique)
- `cinemaName`
- `date`
- `engineer.userId`
- `status`

### Storage

Each report with PDFs uses approximately:
- **Database**: 5-10 KB (JSON data)
- **Cloudinary**: 
  - Original PDF: Variable (your Drive file size)
  - Generated PDF: ~100-500 KB

**Example:** 1000 reports ≈ 10 MB database + 150-500 MB Cloudinary

## Security Notes

### Google Drive Access

The system downloads files from **public Drive links only**. It does NOT:
- Access your Google account
- Use OAuth authentication
- Store Google credentials
- Access private files

### File Validation

- Only CSV files accepted
- File size limit: 10 MB
- PDF MIME type validation
- Cloudinary handles malicious file detection

### User Permissions

- Bulk import: Admin, Manager only
- CSV template download: All authenticated users
- Report viewing: Role-based as per existing permissions

## Monitoring & Logs

### Backend Logs

Watch for these log messages:

```
✅ Success indicators:
📁 Starting bulk import from CSV...
📊 Parsed X rows from CSV
✅ Created report 1/X: ASCOMP-...
📥 Downloading PDF from Drive for ASCOMP-...
✅ Original PDF uploaded to Cloudinary for ASCOMP-...
📄 Generating formatted PDF for ASCOMP-...
✅ Generated PDF uploaded to Cloudinary for ASCOMP-...
✅ Bulk import completed: X success, Y failed

⚠️ Warning indicators:
⚠️ Failed to download/upload original PDF for ASCOMP-...: [reason]
⚠️ Failed to generate PDF for ASCOMP-...: [reason]

❌ Error indicators:
❌ Error processing row X: [error]
❌ Bulk import error: [error]
```

### Frontend Console

Check browser console for:
- Upload progress
- API responses
- Error details

## Next Steps

1. ✅ Complete installation
2. ✅ Test with sample data
3. ✅ Verify PDF generation
4. ✅ Test Drive link integration
5. 📝 Prepare your CSV data
6. 📤 Import historical reports
7. ✓ Verify imported reports in database
8. 📊 Check generated PDFs

## Support

### Common Commands

```bash
# Backend logs
cd backend && npm run dev

# Check Puppeteer
node -e "const puppeteer = require('puppeteer'); console.log('Puppeteer OK')"

# Check Cloudinary
node -e "const cloudinary = require('cloudinary').v2; console.log('Cloudinary OK')"

# Test CSV parser
node -e "const csv = require('csv-parser'); console.log('CSV Parser OK')"
```

### Useful Queries

Check imported reports:
```javascript
// MongoDB shell or Compass
db.ascompreports.find({
  "originalPdfReport.source": "drive"
}).count()

// Reports with both PDFs
db.ascompreports.find({
  "originalPdfReport.cloudUrl": { $exists: true },
  "generatedPdfReport.cloudUrl": { $exists: true }
}).count()
```

---

## Contact & Documentation

- **User Guide:** `ASCOMP_BULK_IMPORT_GUIDE.md`
- **API Documentation:** `/api/docs` (if Swagger enabled)
- **Data Structure:** `ASCOMP_REPORT_DATA_STRUCTURE.md`

## Version History

- **v1.0** - Initial release
  - CSV bulk import
  - Google Drive PDF download
  - Auto PDF generation
  - Dual PDF storage (original + generated)

---

**Ready to import?** Follow the guide and start with a small test batch!









