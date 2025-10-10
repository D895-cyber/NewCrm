# Word Template System - Complete Guide

## 🎯 Overview

The Word Template System allows you to upload your ASCOMP report as a **Word document template** and the system will automatically fill it with FSE data. This is much easier than coding PDFs!

---

## 📝 How to Prepare Your Word Template

### Step 1: Open Your Existing Word Document
Open `EW_open_word_v6.3.5docx.docx` (or any Word document)

### Step 2: Replace Data with Placeholders

Replace actual values with placeholders using `{{placeholderName}}` format.

**Example:**

**Before (in your Word doc):**
```
Cinema Name: Jharkhand Bokaro Steel City
Date: 30/09/2025
```

**After (with placeholders):**
```
Cinema Name: {{cinemaName}}
Date: {{date}}
```

---

## 📋 Complete List of Placeholders

### Header Information
```
{{reportNumber}}          - Report number (e.g., ASCOMP-EW-12345)
{{reportType}}            - Report type (EW - Preventive Maintenance Report)
{{date}}                  - Report date (auto-formatted)
```

### Cinema Details
```
{{cinemaName}}            - Cinema name
{{address}}               - Full address
{{contactDetails}}        - Contact information
{{location}}              - Location/region
```

### Serial Information
```
{{serialNumber}}          - Serial number
{{equipAndEWServiceVisit}} - Equipment and EW service visit info
{{projectorModelSerialAndHours}} - Complete projector info
{{replacementRequired}}   - ☑ or ☐
```

### Opticals Checklist
For tables, use:
```
{#opticals}
{{description}} | {{status}} | {{yesNoOk}}
{/opticals}
```

Or individual items:
```
Reflector: {{opticals.reflector.status}} - {{opticals.reflector.yesNoOk}}
UV Filter: {{opticals.uvFilter.status}} - {{opticals.uvFilter.yesNoOk}}
Integrator Rod: {{opticals.integratorRod.status}} - {{opticals.integratorRod.yesNoOk}}
Cold Mirror: {{opticals.coldMirror.status}} - {{opticals.coldMirror.yesNoOk}}
Fold Mirror: {{opticals.foldMirror.status}} - {{opticals.foldMirror.yesNoOk}}
```

### Electronics Checklist
```
Touch Panel: {{electronics.touchPanel.status}} - {{electronics.touchPanel.yesNoOk}}
EVB and IMCB Board: {{electronics.evbAndImcbBoard.status}} - {{electronics.evbAndImcbBoard.yesNoOk}}
PIB and ICP Board: {{electronics.pibAndIcpBoard.status}} - {{electronics.pibAndIcpBoard.yesNoOk}}
IMB-2 Board: {{electronics.imb2Board.status}} - {{electronics.imb2Board.yesNoOk}}
```

### Mechanical Checklist
```
AC Blower and Vane Switch: {{mechanical.acBlowerAndVaneSwitch.status}} - {{mechanical.acBlowerAndVaneSwitch.yesNoOk}}
Extractor Vane Switch: {{mechanical.extractorVaneSwitch.status}} - {{mechanical.extractorVaneSwitch.yesNoOk}}
Exhaust CFM: {{mechanical.exhaustCfmValue.status}} - {{mechanical.exhaustCfmValue.yesNoOk}}
Light Engine Fans: {{mechanical.lightEngineFansWithLadFan.status}} - {{mechanical.lightEngineFansWithLadFan.yesNoOk}}
Card Cage Fans: {{mechanical.cardCageTopAndBottomFans.status}} - {{mechanical.cardCageTopAndBottomFans.yesNoOk}}
Radiator Fan and Pump: {{mechanical.radiatorFanAndPump.status}} - {{mechanical.radiatorFanAndPump.yesNoOk}}
Connector and Hose: {{mechanical.connectorAndHoseForPump.status}} - {{mechanical.connectorAndHoseForPump.yesNoOk}}
Security Lock Switch: {{mechanical.securityAndLampHouseLockSwitch.status}} - {{mechanical.securityAndLampHouseLockSwitch.yesNoOk}}
```

### Lamp Information
```
{{lampMakeModel}}         - Lamp make and model
{{numberOfLamps}}         - Number of lamps running
{{currentLampHours}}      - Current lamp hours
```

### Voltage Parameters
```
{{voltagePN}}             - P vs N voltage
{{voltagePE}}             - P vs E voltage
{{voltageNE}}             - N vs E voltage
```

### Technical Measurements
```
{{flMeasurements}}        - fL measurements
{{contentPlayerModel}}    - Content player model
{{acStatus}}              - AC status
{{leStatusDuringPM}}      - LE status during PM
{{remarks}}               - Remarks
{{leSNo}}                 - LE serial number
```

### Software Version
```
{{softwareW2K}}           - W2K/4K MCGD version
{{softwareW2KFl}}         - W2K/4K fL
{{softwareW2KX}}          - W2K/4K x coordinate
{{softwareW2KY}}          - W2K/4K y coordinate
(Same pattern for R2K and G2K)
```

### Screen Information
```
{{screenScopeHeight}}     - Scope screen height
{{screenScopeWidth}}      - Scope screen width
{{screenScopeGain}}       - Scope screen gain
{{screenFlatHeight}}      - Flat screen height
{{screenFlatWidth}}       - Flat screen width
{{screenFlatGain}}        - Flat screen gain
{{screenMake}}            - Screen manufacturer
{{throwDistance}}         - Throw distance
```

### Image Evaluation
```
{{focusBoresight}}        - Focus/Boresight
{{integratorPosition}}    - Integrator position
{{spotOnScreen}}          - Spot on screen
{{screenCropping}}        - Screen cropping
{{convergenceChecked}}    - Convergence checked
{{channelsChecked}}       - Channels checked
{{pixelDefects}}          - Pixel defects
{{imageVibration}}        - Image vibration
{{liteLoc}}               - LiteLOC
```

### CIE XYZ Color Accuracy
```
{{cieBwStepX}}            - BW Step x coordinate
{{cieBwStepY}}            - BW Step y coordinate
{{cieBwStepFl}}           - BW Step fL
{{cie10_2k4kX}}           - 10 2K/4K x coordinate
{{cie10_2k4kY}}           - 10 2K/4K y coordinate
{{cie10_2k4kFl}}          - 10 2K/4K fL
```

### Air Pollution Level
```
{{hcho}}                  - HCHO level
{{tvoc}}                  - TVOC level
{{pm10}}                  - PM 1.0 level
{{pm25}}                  - PM 2.5 level
{{pm10Full}}              - PM 10 level
{{temperature}}           - Temperature
{{humidity}}              - Humidity percentage
```

### Engineer Information
```
{{engineerName}}          - Engineer name
{{engineerPhone}}         - Engineer phone
{{engineerEmail}}         - Engineer email
```

### Signatures
```
{{clientSignature}}       - Client signature (text)
{{engineerSignature}}     - Engineer signature (text)
```

---

## 🔧 How to Use Placeholders in Word Tables

For repeating rows in tables, use loop syntax:

```
{#opticals}
{{description}} | {{status}} | {{yesNoOk}}
{/opticals}
```

This will automatically create rows for each item in the opticals array.

---

## 💾 How to Upload Your Template

### Method 1: Using Admin Panel (Coming Soon)
1. Log in as **Admin** or **Manager**
2. Go to **Settings** → **Templates**
3. Click **Upload Template**
4. Select your prepared Word file
5. Give it a name (e.g., "ASCOMP_EW_Report")
6. Click **Save**

### Method 2: Using API (For Testing)
```bash
curl -X POST http://localhost:4000/api/word-templates/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "template=@/path/to/your/template.docx" \
  -F "templateName=ASCOMP_EW_Report"
```

---

## 📥 How Reports are Generated

### Workflow:
1. **FSE fills the web form** (same as before - easy, mobile-friendly)
   ↓
2. **System saves data to database**
   ↓
3. **When downloading:**
   - System loads your Word template
   - Replaces all `{{placeholders}}` with actual data
   - Generates perfect Word document
   - Optional: Convert to PDF
   ↓
4. **User gets professional report** in exact format!

---

## 🎨 Template Formatting Tips

### 1. Keep Your Formatting
- ✅ Bold, italic, colors, fonts - everything stays!
- ✅ Tables, borders, spacing - all preserved!
- ✅ Headers, footers, logos - remain intact!

### 2. Tables
For tables, you can either:

**Option A: Static table with placeholders**
```
| Description    | Status        | Result          |
|---------------|---------------|-----------------|
| Reflector     | {{opticals.reflector.status}} | {{opticals.reflector.yesNoOk}} |
| UV Filter     | {{opticals.uvFilter.status}}  | {{opticals.uvFilter.yesNoOk}}  |
```

**Option B: Dynamic table with loops**
```
{#opticals}
| {{description}} | {{status}} | {{yesNoOk}} |
{/opticals}
```

### 3. Conditional Content
Show content only if data exists:
```
{#address}
Address: {{address}}
{/address}
```

---

## 🔄 Updating Your Template

To update the report format:
1. Modify your Word template
2. Upload the new version with the same name
3. Done! All new reports use the new format automatically

No code changes needed! 🎉

---

## 🚀 API Endpoints

### Upload Template
```
POST /api/word-templates/upload
Headers: Authorization: Bearer <token>
Body: FormData
  - template: File (.docx)
  - templateName: String
```

### List Templates
```
GET /api/word-templates
Headers: Authorization: Bearer <token>
```

### Generate Document
```
POST /api/word-templates/generate
Headers: Authorization: Bearer <token>
Body: {
  "templateName": "ASCOMP_EW_Report",
  "reportData": { ...report data... }
}
Returns: Word document file
```

### Generate from Existing Report
```
POST /api/word-templates/generate/:reportId
Headers: Authorization: Bearer <token>
Body: {
  "templateName": "ASCOMP_EW_Report"
}
Returns: Word document file
```

### Delete Template
```
DELETE /api/word-templates/:templateName
Headers: Authorization: Bearer <token>
```

---

## 📄 Example Template Snippet

Here's how a section of your template might look:

```
==============================================
      ASCOMP INC.
      EW - Preventive Maintenance Report
Address: 9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, Delhi 110064
Mobile: 8882375207  Email: bhupesh1@ascompinc.in  www.ascompinc.in
==============================================

CINEMA NAME: {{cinemaName}}                    DATE: {{date}}
Address: {{address}}
Contact Details: {{contactDetails}}

------------------------------------------
SERIAL #: {{serialNumber}}
Equip and EW Service visit: {{equipAndEWServiceVisit}}
LOCATION: {{location}}

Projector Model, Serial No. and Running Hours: {{projectorModelSerialAndHours}}
Replacement Required: {{replacementRequired}}

------------------------------------------
DESCRIPTION                          STATUS              YES/NO-OK
------------------------------------------
OPTICALS
Reflector                           {{opticals.reflector.status}}    {{opticals.reflector.yesNoOk}}
UV filter                           {{opticals.uvFilter.status}}     {{opticals.uvFilter.yesNoOk}}
Integrator Rod                      {{opticals.integratorRod.status}} {{opticals.integratorRod.yesNoOk}}
...
```

---

## 🎯 Benefits

✅ **100% Exact Formatting** - Uses your actual Word document
✅ **Easy Updates** - Just upload new template, no coding
✅ **Professional Output** - Perfect reports every time
✅ **FSE Friendly** - Engineers still use simple web form
✅ **Both Formats** - Generate .docx and optionally PDF
✅ **Fast** - Generate reports in seconds
✅ **Consistent** - Same format for every report

---

## 🔧 Troubleshooting

### Error: "Template not found"
- Make sure template is uploaded
- Check template name matches exactly

### Error: "Template error: unclosed tag"
- Check all placeholders use `{{` and `}}`
- Make sure loop tags are properly closed: `{#name}...{/name}`

### Missing Data in Generated Report
- Check placeholder name matches exactly
- Use `console.log` to verify data structure

### Format Issues
- Word templates preserve all formatting
- Make sure your template looks exactly how you want the final report

---

## 📚 Resources

- **docxtemplater Documentation**: https://docxtemplater.com/
- **Placeholder Syntax**: https://docxtemplater.com/docs/tag-types/

---

## 🎉 Ready to Use!

Your Word template system is now ready! Just:
1. Prepare your Word template with placeholders
2. Upload it via admin panel
3. FSEs fill forms as usual
4. Download perfect Word documents automatically!

No more manual PDF layout coding! 🚀







