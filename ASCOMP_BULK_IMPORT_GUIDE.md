# ASCOMP Bulk Import Guide

## Overview

The ASCOMP Bulk Import feature allows you to import multiple historical ASCOMP reports at once from a CSV file. The system will:

1. ✅ **Import report data** into the database
2. ✅ **Download original PDFs** from Google Drive links
3. ✅ **Generate new formatted PDFs** in your system's standard format
4. ✅ **Store all data** with proper metadata and tracking

## Features

### What Gets Imported

- **Report Data**: All ASCOMP report fields (cinema info, checklists, technical data)
- **Original PDFs**: Downloaded from Google Drive and stored in Cloudinary
- **Generated PDFs**: New PDFs created in your system's format
- **Metadata**: Creation date, engineer info, status

### PDF Handling

- **Original PDF**: The PDF from Google Drive is preserved as `originalPdfReport`
  - Downloaded from Drive link
  - Uploaded to Cloudinary folder: `ascomp-reports/original/`
  - Accessible via report details

- **Generated PDF**: A new standardized PDF created by the system
  - Generated using Puppeteer backend service
  - Uploaded to Cloudinary folder: `ascomp-reports/generated/`
  - Uses your ASCOMP report template format

## How to Use

### Step 1: Download CSV Template

1. Go to **ASCOMP Reports** page
2. Click **"Bulk Import ASCOMP Reports"** button
3. In the modal, click **"Download Template"**
4. Save the `ascomp_report_template.csv` file

### Step 2: Fill CSV with Your Data

#### Required Fields

```csv
reportNumber,date,cinemaName,engineer_name
ASCOMP-EW-202501-0001,2025-01-15,PVR Cinemas Delhi,Rajesh Kumar
```

**Required columns:**
- `cinemaName` - Cinema/site name
- `engineer_name` - Engineer who performed maintenance
- `date` - Report date (format: YYYY-MM-DD or DD/MM/YYYY)

#### Optional But Recommended

- `reportNumber` - Auto-generated if not provided
- `address` - Cinema address
- `contactDetails` - Contact person and phone
- `location` - City/location
- `driveLink` - **Google Drive link to original PDF**

#### Checklist Columns

For each checklist item, there are TWO columns:

1. `{section}_{item}_status` - Status value (e.g., "OK", "Checked", "Clean")
2. `{section}_{item}_yesNoOk` - Yes/No/OK value

**Example:**
```csv
opticals_reflector_status,opticals_reflector_yesNoOk
OK,Yes
```

**Available sections:**
- `opticals` (5 items: reflector, uvFilter, integratorRod, coldMirror, foldMirror)
- `electronics` (4 items: touchPanel, evbAndImcbBoard, pibAndIcpBoard, imb2Board)
- `serialNumberVerified` (1 item: chassisLabelVsTouchPanel)
- `disposableConsumables` (1 item: airIntakeLadAndRad)
- `coolant` (3 items: levelAndColor, white, red)
- `lightEngineTestPattern` (3 items: green, blue, black)
- `mechanical` (8 items: acBlowerAndVaneSwitch, extractorVaneSwitch, etc.)
- `lampLocMechanism` (1 item: xAndZMovement)

#### Page 2 Technical Data

```csv
lampInfo_makeAndModel,lampInfo_numberOfLampsRunning,lampInfo_currentLampRunningHours
USHIO XENON 6.5KW,2,850
```

Full list includes:
- Lamp information
- Voltage parameters
- Software versions
- Screen information
- Image evaluation
- CIE XYZ color accuracy
- Air pollution levels

### Step 3: Add Google Drive Links

**Important:** Your Google Drive PDFs must be publicly accessible or shared with view permissions.

#### How to Get Drive Link

1. Open your PDF in Google Drive
2. Click **Share** → **Get Link**
3. Set permissions to **"Anyone with the link can view"**
4. Copy the link (format: `https://drive.google.com/file/d/FILE_ID/view`)
5. Paste into `driveLink` column

**Supported link formats:**
```
https://drive.google.com/file/d/ABC123XYZ/view
https://drive.google.com/open?id=ABC123XYZ
https://drive.google.com/uc?id=ABC123XYZ
```

### Step 4: Upload CSV

1. Click **"Upload CSV File"** in the modal
2. Select your filled CSV file
3. File name will show with green checkmark
4. Click **"Start Import"**

### Step 5: Monitor Progress

The system will show:
- Progress bar (0-100%)
- Status messages
- Processing details

**This may take several minutes** depending on:
- Number of rows
- PDF file sizes
- Network speed for Drive downloads

### Step 6: Review Results

After completion, you'll see:

#### Summary
- **Total Rows**: Number of rows processed
- **Successful**: Reports imported successfully
- **Failed**: Rows with errors

#### Success Table
| Row | Report Number | Original PDF | Generated PDF |
|-----|---------------|--------------|---------------|
| 1   | ASCOMP-EW-202501-0001 | ✓ | ✓ |

#### Errors & Warnings
- **Errors**: Rows that failed completely
- **Warnings**: Reports imported but PDF issues (e.g., Drive link failed)

## Example CSV

```csv
reportNumber,date,cinemaName,engineer_name,driveLink,opticals_reflector_status,opticals_reflector_yesNoOk,opticals_uvFilter_status,opticals_uvFilter_yesNoOk
ASCOMP-EW-202501-0001,2025-01-15,PVR Cinemas Delhi,Rajesh Kumar,https://drive.google.com/file/d/ABC123/view,OK,Yes,OK,Yes
ASCOMP-EW-202501-0002,2025-01-16,INOX Mumbai,Sanjay Sharma,https://drive.google.com/file/d/XYZ456/view,Checked,Yes,Clean,Yes
```

## API Endpoints

### Bulk Import
```http
POST /api/ascomp-reports/bulk-import
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: csvFile (File)
```

### Download Template
```http
GET /api/ascomp-reports/csv-template
Authorization: Bearer <token>
```

## Backend Services

### 1. CSV Mapper (`csvToASCOMPMapper.js`)
- Maps CSV columns to ASCOMPReport schema
- Validates required fields
- Handles date parsing and format conversion

### 2. Google Drive Service (`googleDriveService.js`)
- Extracts file ID from Drive URLs
- Downloads files from Drive
- Handles public and shared files
- Detects MIME types

### 3. ASCOMP PDF Generator (`ascompPdfGeneratorService.js`)
- Generates PDFs using Puppeteer
- Creates standardized ASCOMP format
- Includes all report sections
- Professional styling

### 4. Cloudinary Storage
- Original PDFs: `ascomp-reports/original/`
- Generated PDFs: `ascomp-reports/generated/`

## Database Structure

```javascript
{
  // Report data...
  
  originalPdfReport: {
    filename: "original_ASCOMP-EW-202501-0001.pdf",
    cloudUrl: "https://res.cloudinary.com/...",
    publicId: "ascomp-reports/original/original_ASCOMP-EW-202501-0001",
    uploadedAt: ISODate("2025-01-15T10:30:00Z"),
    uploadedBy: ObjectId("..."),
    source: "drive",
    driveLink: "https://drive.google.com/file/d/ABC123/view",
    fileSize: 2456789,
    mimeType: "application/pdf"
  },
  
  generatedPdfReport: {
    filename: "ASCOMP-EW-202501-0001.pdf",
    cloudUrl: "https://res.cloudinary.com/...",
    publicId: "ascomp-reports/generated/generated_ASCOMP-EW-202501-0001",
    generatedAt: ISODate("2025-01-15T10:30:05Z")
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Google Drive PDF download failed"
**Cause:** Drive file not accessible
**Solution:** 
- Ensure file is set to "Anyone with the link can view"
- Check if link is valid
- Large files may need confirmation token (handled automatically)

#### 2. "PDF generation failed"
**Cause:** Puppeteer issue or missing data
**Solution:**
- Report is still created with data
- PDF can be generated manually later
- Check logs for specific error

#### 3. "Validation errors"
**Cause:** Missing required fields
**Solution:**
- Ensure `cinemaName`, `engineer_name`, and `date` are filled
- Check date format (YYYY-MM-DD preferred)

#### 4. CSV parsing errors
**Cause:** Invalid CSV format
**Solution:**
- Use UTF-8 encoding
- Ensure proper column separation (comma)
- Check for extra quotes or special characters

## Permissions

**Required roles:** `admin` or `manager`

FSE users cannot perform bulk imports.

## Performance Considerations

- **Small batches recommended**: 10-50 reports at a time
- **Large files**: Drive downloads may timeout for very large PDFs
- **Processing time**: ~5-10 seconds per report (with PDFs)
- **Cloudinary limits**: Check your plan's upload limits

## Best Practices

1. **Test with 1-2 rows first** before importing large datasets
2. **Organize Drive links** in a spreadsheet before CSV creation
3. **Check Drive permissions** for all PDFs beforehand
4. **Save successful results** - note report IDs for verification
5. **Handle errors incrementally** - fix and re-import failed rows
6. **Backup original data** before import

## Dependencies

### Backend NPM Packages Required
```json
{
  "csv-parser": "^3.0.0",
  "multer": "^1.4.5-lts.1",
  "puppeteer": "^21.0.0",
  "axios": "^1.6.0",
  "cloudinary": "^1.40.0"
}
```

### Installation
```bash
cd backend
npm install csv-parser multer puppeteer axios
```

## Files Created

### Backend
- `backend/server/models/ASCOMPReport.js` (updated)
- `backend/server/utils/csvToASCOMPMapper.js` (new)
- `backend/server/services/googleDriveService.js` (new)
- `backend/server/services/ascompPdfGeneratorService.js` (new)
- `backend/server/routes/ascompReports.js` (updated)

### Frontend
- `frontend/src/components/pages/ASCOMPBulkImport.tsx` (new)
- `frontend/src/components/pages/ASCOMPReportsPage.tsx` (updated)

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for detailed error messages
3. Verify Drive link permissions
4. Test with template file first

---

**Version:** 1.0  
**Last Updated:** November 2025









