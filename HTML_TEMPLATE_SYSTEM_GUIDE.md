# 🎨 HTML Template to PDF System - Complete Guide

## ✨ **What This System Does**

You can create **beautiful HTML reports** with placeholders, and the system will:
1. ✅ Replace placeholders with real data
2. ✅ Generate professional PDF files
3. ✅ Maintain exact formatting you designed

---

## 📋 **How Placeholders Work**

### **Basic Syntax:**
```html
<!-- Simple placeholder -->
{{fieldName}}

<!-- With default value -->
{{default fieldName 'N/A'}}

<!-- Conditional display -->
{{#if fieldName}}
  Show this when fieldName exists
{{else}}
  Show this when fieldName is empty
{{/if}}

<!-- Conditional equals -->
{{#ifEquals status 'OK'}}
  <span class="green">OK</span>
{{/ifEquals}}

<!-- Date formatting -->
{{formatDate date}}
```

---

## 🎯 **Available Data Fields**

### **Basic Report Info:**
```html
{{reportNumber}}           <!-- ASCOMP-EW-12345 -->
{{cinemaName}}            <!-- Cinema name -->
{{date}}                  <!-- Raw date -->
{{formattedDate}}         <!-- Formatted: 06/10/2025 -->
{{address}}               <!-- Full address -->
{{contactDetails}}        <!-- Contact info -->
{{location}}              <!-- Location -->
{{screenNumber}}          <!-- Screen number -->
{{equipAndEWServiceVisit}} <!-- Service visit type -->
{{projectorModelSerialAndHours}} <!-- Projector info -->
{{replacementRequired}}   <!-- Replacement notes -->
```

### **Opticals Section:**
```html
{{opticals.reflector.status}}      <!-- OK/FAIL/REPLACE -->
{{opticals.reflector.result}}      <!-- YES/NO -->
{{opticals.uvFilter.status}}
{{opticals.uvFilter.result}}
{{opticals.integratorRod.status}}
{{opticals.integratorRod.result}}
{{opticals.coldMirror.status}}
{{opticals.coldMirror.result}}
{{opticals.foldMirror.status}}
{{opticals.foldMirror.result}}
```

### **Electronics Section:**
```html
{{electronics.touchPanel.status}}
{{electronics.touchPanel.result}}
{{electronics.evbImcbBoard.status}}
{{electronics.evbImcbBoard.result}}
{{electronics.pibIcpBoard.status}}
{{electronics.pibIcpBoard.result}}
{{electronics.imbSBoard.status}}
{{electronics.imbSBoard.result}}
```

### **Mechanical Section:**
```html
{{mechanical.acBlowerVaneSwitch.status}}
{{mechanical.acBlowerVaneSwitch.result}}
{{mechanical.extractorVaneSwitch.status}}
{{mechanical.extractorVaneSwitch.result}}
{{mechanical.exhaustCFM.status}}
{{mechanical.exhaustCFM.value}}
{{mechanical.lightEngine4Fans.status}}
{{mechanical.lightEngine4Fans.result}}
{{mechanical.cardCageFans.status}}
{{mechanical.cardCageFans.result}}
{{mechanical.radiatorFanPump.status}}
{{mechanical.radiatorFanPump.result}}
{{mechanical.connectorHosePump.status}}
{{mechanical.connectorHosePump.result}}
{{mechanical.securityLampHouseLock.status}}
{{mechanical.securityLampHouseLock.result}}
```

### **Lamp LOC Mechanism:**
```html
{{lampLOCMechanism.xMovement.status}}
{{lampLOCMechanism.xMovement.result}}
{{lampLOCMechanism.yMovement.status}}
{{lampLOCMechanism.yMovement.result}}
{{lampLOCMechanism.zMovement.status}}
{{lampLOCMechanism.zMovement.result}}
```

### **Serial Number Verified:**
```html
{{serialNumberVerified.chassisLabel.status}}
{{serialNumberVerified.chassisLabel.result}}
```

### **Coolant:**
```html
{{coolant.level.status}}
{{coolant.level.result}}
{{coolant.color.status}}
{{coolant.color.result}}
```

### **Light Engine Test Pattern:**
```html
{{lightEngineTestPattern.white.status}}
{{lightEngineTestPattern.white.result}}
{{lightEngineTestPattern.red.status}}
{{lightEngineTestPattern.red.result}}
{{lightEngineTestPattern.green.status}}
{{lightEngineTestPattern.green.result}}
{{lightEngineTestPattern.blue.status}}
{{lightEngineTestPattern.blue.result}}
{{lightEngineTestPattern.black.status}}
{{lightEngineTestPattern.black.result}}
```

### **Air Pollution Level:**
```html
{{airPollutionLevel.hcho}}
{{airPollutionLevel.tvoc}}
{{airPollutionLevel.pm10}}
{{airPollutionLevel.pm25}}
{{airPollutionLevel.pm100}}
{{airPollutionLevel.temperature}}
{{airPollutionLevel.humidity}}
```

### **Engineer Info:**
```html
{{engineer.name}}
{{engineer.phone}}
{{engineer.email}}
```

### **Signatures:**
```html
{{clientSignature}}        <!-- Base64 image data -->
{{engineerSignature}}      <!-- Base64 image data -->
```

---

## 🚀 **How to Use**

### **Step 1: Create Your HTML Template**

Create an HTML file with your exact design:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Your custom CSS here */
        .header {
            background: #333;
            color: white;
            padding: 20px;
        }
        .status-ok { color: green; }
        .status-fail { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{cinemaName}}</h1>
        <p>Report: {{reportNumber}} | Date: {{formattedDate}}</p>
    </div>
    
    <table>
        <tr>
            <td>Reflector:</td>
            <td class="{{#ifEquals opticals.reflector.status 'OK'}}status-ok{{/ifEquals}}">
                {{opticals.reflector.status}}
            </td>
        </tr>
    </table>
    
    {{#if engineerSignature}}
    <img src="{{engineerSignature}}" alt="Signature">
    {{/if}}
</body>
</html>
```

### **Step 2: Upload Template via API**

**Method 1 - Using Postman/API:**
```
POST /api/html-to-pdf/upload-template
Headers: Authorization: Bearer YOUR_TOKEN
Body (JSON):
{
  "templateName": "ascomp_report",
  "htmlContent": "<html>YOUR HTML HERE</html>"
}
```

**Method 2 - Save Directly:**
Save your HTML file to:
```
backend/server/templates/html/your_template_name.html
```

### **Step 3: Generate PDF**

**API Call:**
```
POST /api/html-to-pdf/generate/{reportId}
Headers: Authorization: Bearer YOUR_TOKEN
Body (JSON):
{
  "templateName": "ascomp_report",
  "pdfOptions": {
    "format": "A4",
    "margin": {
      "top": "10mm",
      "right": "10mm",
      "bottom": "10mm",
      "left": "10mm"
    }
  }
}
```

**Response:** PDF file download

### **Step 4: Preview Before PDF**

To see how it looks with real data:
```
POST /api/html-to-pdf/preview/{reportId}
Body: { "templateName": "ascomp_report" }
```

**Response:** HTML with data filled in

---

## 🎨 **Example Templates**

### **Simple Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; }
        table { width: 100%; border-collapse: collapse; }
        td { border: 1px solid #000; padding: 8px; }
    </style>
</head>
<body>
    <h1>{{cinemaName}} - Service Report</h1>
    <p>Date: {{formattedDate}}</p>
    
    <table>
        <tr>
            <td>Projector:</td>
            <td>{{projectorModelSerialAndHours}}</td>
        </tr>
        <tr>
            <td>Engineer:</td>
            <td>{{engineer.name}} ({{engineer.phone}})</td>
        </tr>
    </table>
</body>
</html>
```

### **Advanced Template with Conditional Styling:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .checklist-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .status-ok { background: #d4edda; color: #155724; }
        .status-fail { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>Checklist</h2>
    
    {{#if opticals}}
    <div class="checklist-item {{#ifEquals opticals.reflector.status 'OK'}}status-ok{{/ifEquals}}{{#ifEquals opticals.reflector.status 'FAIL'}}status-fail{{/ifEquals}}">
        <span>Reflector</span>
        <span>{{default opticals.reflector.status 'Not Checked'}}</span>
    </div>
    {{/if}}
</body>
</html>
```

---

## 🔧 **API Endpoints Reference**

### **1. Upload Template (Admin Only)**
```
POST /api/html-to-pdf/upload-template
Auth: Required (Admin/Manager)
Body: { templateName, htmlContent }
```

### **2. List Templates**
```
GET /api/html-to-pdf/templates
Auth: Required
Response: { templates: [...] }
```

### **3. Get Template**
```
GET /api/html-to-pdf/template/:templateName
Auth: Required
Response: { templateName, content }
```

### **4. Delete Template (Admin Only)**
```
DELETE /api/html-to-pdf/template/:templateName
Auth: Required (Admin/Manager)
```

### **5. Generate PDF**
```
POST /api/html-to-pdf/generate/:reportId
Auth: Required
Body: { templateName, pdfOptions }
Response: PDF file
```

### **6. Preview HTML**
```
POST /api/html-to-pdf/preview/:reportId
Auth: Required
Body: { templateName }
Response: HTML string
```

---

## 💡 **Pro Tips**

### **1. Use CSS for Exact Layout:**
```html
<style>
    @page {
        size: A4;
        margin: 10mm;
    }
    
    .page-break {
        page-break-after: always;
    }
    
    table {
        page-break-inside: avoid;
    }
</style>
```

### **2. Handle Missing Data:**
```html
<!-- Always show something -->
{{default fieldName 'N/A'}}

<!-- Conditional display -->
{{#if fieldName}}
  <p>{{fieldName}}</p>
{{else}}
  <p style="color: gray;">Not provided</p>
{{/if}}
```

### **3. Add Images/Logos:**
```html
<!-- External image -->
<img src="https://yoursite.com/logo.png" alt="Logo">

<!-- Base64 signature -->
{{#if engineerSignature}}
<img src="{{engineerSignature}}" style="max-width: 200px;">
{{/if}}
```

### **4. Multi-Page Reports:**
```html
<!-- Page 1 -->
<div class="page">
    <!-- Content -->
</div>

<div class="page-break"></div>

<!-- Page 2 -->
<div class="page">
    <!-- Content -->
</div>
```

---

## 🎯 **Next Steps**

1. **Create your HTML template** with exact design
2. **Add placeholders** using `{{fieldName}}` syntax
3. **Upload template** via API or save to templates folder
4. **Test with preview** endpoint first
5. **Generate PDF** when satisfied

---

## ✅ **System is Ready!**

The backend is fully configured and ready to use. Just create your HTML template and start generating PDFs!

**Sample template location:**
`backend/server/templates/html/ascomp_report_sample.html`

**Want to test it now?**
1. Upload your HTML template
2. Call `/api/html-to-pdf/generate/:reportId` with your template name
3. Download perfect PDF! 🎉







