// ASCOMP INC. Style Service Report Generator
// This generates reports in the exact same style as the ASCOMP INC. projector service reports

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function for safe access
const safeAccess = (obj: any, path: string[], fallback: any = '-') => {
  try {
    let current = obj;
    for (const key of path) {
      if (current == null || typeof current !== 'object') {
        return fallback;
      }
      current = current[key];
    }
    return current != null ? current : fallback;
  } catch {
    return fallback;
  }
};

// Helper function to format dates
const formatDate = (date: any) => {
  try {
    if (!date) return new Date().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  } catch {
    return new Date().toLocaleDateString();
  }
};

// Helper function to format time
const formatTime = (date: any) => {
  try {
    if (!date) return new Date().toLocaleTimeString();
    return new Date(date).toLocaleTimeString();
  } catch {
    return new Date().toLocaleTimeString();
  }
};

// Generate the complete ASCOMP style report HTML
const generateASCOMPReportHTML = (report: any): string => {
  const reportNumber = safeAccess(report, ['reportNumber'], 'REPORT-' + Date.now());
  const reportDate = formatDate(report.date || report.createdAt);
  const reportTime = formatTime(report.date || report.createdAt);
  const reportType = safeAccess(report, ['reportType'], 'First');
  
  const siteName = safeAccess(report, ['siteName'], 'Site Name Not Available');
  const siteAddress = safeAccess(report, ['siteAddress'], '');
  const siteInchargeName = safeAccess(report, ['siteIncharge', 'name'], 'Mr. - -');
  const siteInchargePhone = safeAccess(report, ['siteIncharge', 'contact'], '');
  const engineerName = safeAccess(report, ['engineer', 'name'], 'Engineer Name');
  const engineerPhone = safeAccess(report, ['engineer', 'phone'], '');
  const engineerEmail = safeAccess(report, ['engineer', 'email'], '');
  
  const projectorModel = safeAccess(report, ['projectorModel'], 'Model Not Available');
  const projectorSerial = safeAccess(report, ['projectorSerial'], 'Serial Not Available');
  const brand = safeAccess(report, ['brand'], 'Brand Not Available');
  const softwareVersion = safeAccess(report, ['softwareVersion'], 'Version Not Available');
  const projectorHours = safeAccess(report, ['projectorRunningHours'], '0');
  
  const lampModel = safeAccess(report, ['lampModel'], 'Lamp Model Not Available');
  const lampHours = safeAccess(report, ['lampRunningHours'], '0');
  const currentLampHours = safeAccess(report, ['currentLampHours'], '0');
  const lampReplacementRequired = safeAccess(report, ['replacementRequired'], false) ? 'Yes' : 'No';

  // Extract technical data from report using the correct form structure
  const voltageParameters = safeAccess(report, ['voltageParameters'], {});
  const contentFunctionality = safeAccess(report, ['contentFunctionality'], {});
  const observations = safeAccess(report, ['observations'], []);
  const recommendedParts = safeAccess(report, ['recommendedParts'], []);
  const measuredColorCoordinates = safeAccess(report, ['measuredColorCoordinates'], []);
  const cieColorAccuracy = safeAccess(report, ['cieColorAccuracy'], []);
  const screenInfo = safeAccess(report, ['screenInfo'], {});
  const airPollutionLevels = safeAccess(report, ['airPollutionLevels'], {});
  const finalStatus = safeAccess(report, ['finalStatus'], {});
  const imageEvaluation = safeAccess(report, ['imageEvaluation'], {});
  
  // Extract signature data - support multiple possible locations
  // Signatures can be stored as base64 data URIs or URLs
  let clientSignature = safeAccess(report, ['clientSignature'], 
    safeAccess(report, ['signatures', 'customer'], 
      safeAccess(report, ['clientSignatureAndStamp', 'signatureData'], null)));
  let engineerSignature = safeAccess(report, ['engineerSignature'], 
    safeAccess(report, ['signatures', 'engineer'], 
      safeAccess(report, ['engineerSignature', 'signatureData'], null)));
  
  // Ensure signatures are valid base64 data URIs or URLs
  // If it's already a data URI, use it as is; otherwise try to construct one
  if (clientSignature && typeof clientSignature === 'string') {
    if (!clientSignature.startsWith('data:') && !clientSignature.startsWith('http')) {
      // Assume it's base64 without prefix, add data URI prefix
      clientSignature = `data:image/png;base64,${clientSignature}`;
    }
  }
  
  if (engineerSignature && typeof engineerSignature === 'string') {
    if (!engineerSignature.startsWith('data:') && !engineerSignature.startsWith('http')) {
      // Assume it's base64 without prefix, add data URI prefix
      engineerSignature = `data:image/png;base64,${engineerSignature}`;
    }
  }
  
  console.log('🔍 Signature data check:', {
    hasClientSignature: !!clientSignature,
    hasEngineerSignature: !!engineerSignature,
    clientSignatureType: clientSignature ? (clientSignature.substring(0, 30)) : null,
    engineerSignatureType: engineerSignature ? (engineerSignature.substring(0, 30)) : null
  });

  // Extract inspection sections data using the correct form structure
  // Support both direct access and nested inspectionSections structure
  const inspectionSections = safeAccess(report, ['inspectionSections'], safeAccess(report, ['sections'], {}));
  const opticals = safeAccess(inspectionSections, ['opticals'], []);
  const electronics = safeAccess(inspectionSections, ['electronics'], []);
  const mechanical = safeAccess(inspectionSections, ['mechanical'], []);
  const lightEngineTestPatterns = safeAccess(inspectionSections, ['lightEngineTestPatterns'], []);
  const serialNumberVerified = safeAccess(inspectionSections, ['serialNumberVerified'], {});
  const disposableConsumables = safeAccess(inspectionSections, ['disposableConsumables'], []);
  const coolant = safeAccess(inspectionSections, ['coolant'], {});
  
  // Debug logging to verify data structure
  console.log('🔍 PDF Generator - Inspection Sections Data:', {
    hasInspectionSections: !!inspectionSections,
    hasOpticals: !!opticals,
    opticalsLength: opticals?.length || 0,
    firstOptical: opticals?.[0] || null,
    sampleOpticalData: opticals?.[0] ? {
      description: opticals[0].description,
      status: opticals[0].status,
      result: opticals[0].result
    } : null
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ASCOMP Service Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 15px;
          font-size: 11px;
          line-height: 1.2;
          color: #000;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }
        
        .date-time {
          font-size: 11px;
          color: #333;
        }
        
        .report-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .report-details {
          text-align: right;
          font-size: 11px;
        }
        
        .company-section {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ccc;
          background: #f9f9f9;
        }
        
        .logo-section {
          margin-bottom: 15px;
        }
        
        .ascomp-logo-container {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .ascomp-logo-img {
          width: 85px;
          height: auto;
          margin-right: 18px;
          flex-shrink: 0;
          object-fit: contain;
        }
        
        .ascomp-logo-svg {
          width: 85px;
          height: auto;
          margin-right: 18px;
          flex-shrink: 0;
        }
        
        .company-info {
          flex: 1;
          padding-top: 3px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 6px;
          color: #000;
        }
        
        .company-address {
          font-size: 11px;
          margin-bottom: 6px;
          color: #000;
        }
        
        .company-contact {
          font-size: 11px;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .christie-logo-section {
          margin: 12px 0 10px 0;
          padding-left: 0;
        }
        
        .christie-logo-container {
          display: block;
          margin-bottom: 8px;
        }
        
        .christie-logo-svg {
          height: 40px;
          width: auto;
        }
        
        .brand-title {
          display: none; /* Hide old text version, using SVG logo instead */
        }
        
        .subtitle {
          text-align: left;
          font-size: 12px;
          margin-bottom: 12px;
          margin-top: 3px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 12px;
        }
        
        .info-box {
          border: 2px solid #000;
          padding: 10px;
          background: #f8f8f8;
          margin-bottom: 10px;
        }
        
        .info-box h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: bold;
          text-decoration: underline;
          color: #000;
        }
        
        .info-item {
          margin: 3px 0;
          font-size: 12px;
        }
        
        .sections-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11px;
          border: 2px solid #000;
        }
        
        .sections-table th,
        .sections-table td {
          border: 1px solid #000;
          padding: 6px 5px;
          text-align: left;
          vertical-align: middle;
        }
        
        .sections-table th {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
          font-size: 11px;
          border: 1px solid #000;
        }
        
        .section-header {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
          font-size: 11px;
          border: 1px solid #000;
        }
        
        .status-ok {
          text-align: center;
          font-weight: bold;
          color: #006600;
          font-size: 11px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin: 10px 0 5px 0;
          color: #0066cc;
          text-decoration: underline;
        }
        
        .technical-tables {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 12px;
        }
        
        .technical-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .technical-table th,
        .technical-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .technical-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .observations-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .observations-table th,
        .observations-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .observations-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .parts-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .parts-table th,
        .parts-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .parts-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .color-coordinates-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .color-coordinates-table th,
        .color-coordinates-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .color-coordinates-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .screen-info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .screen-info-table th,
        .screen-info-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .screen-info-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .pollution-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        .pollution-table th,
        .pollution-table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        .pollution-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .status-section {
          margin: 12px 0;
        }
        
        .status-item {
          margin: 3px 0;
          font-size: 11px;
        }
        
        .footer-note {
          margin-top: 15px;
          text-align: center;
          font-size: 11px;
          font-weight: bold;
        }
        
        .page-number {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 10px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          padding: 12px 0;
          border-top: 2px solid #000;
        }
        
        .signature-box {
          flex: 1;
          text-align: center;
          padding: 10px;
          border: 1px solid #ccc;
          background: #f9f9f9;
          margin: 0 8px;
        }
        
        .signature-box h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: bold;
          color: #000;
        }
        
        .signature-img {
          max-width: 200px;
          max-height: 80px;
          margin: 10px auto;
          display: block;
          border: 1px solid #ddd;
          background: white;
        }
        
        .signature-placeholder {
          color: #999;
          font-style: italic;
          font-size: 11px;
          padding: 20px;
          border: 1px dashed #ccc;
          margin: 10px 0;
        }
        
        .signature-name {
          margin-top: 10px;
          font-size: 11px;
          font-weight: bold;
          color: #000;
        }
        
        .signature-date {
          margin-top: 5px;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <!-- Page 1: Header and Main Sections -->
      <div class="header">
        <div class="date-time">${reportTime}</div>
        <div class="report-title">Service Report</div>
        <div class="report-details">
          <div><strong>Report:</strong> ${reportNumber}</div>
          <div><strong>Type:</strong> ${reportType}</div>
          <div><strong>Date:</strong> ${reportDate}</div>
        </div>
      </div>
      
      <!-- ASCOMP Logo and Company Information -->
      <div class="logo-section">
        <div class="ascomp-logo-container">
          <img src="https://www.ascompinc.in/assets/img/logo/logo.png" alt="ASCOMP INC." class="ascomp-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <svg class="ascomp-logo-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="display:none;">
            <!-- Fallback SVG logo if image fails to load -->
            <path d="M 35 95 Q 35 85 40 75 Q 45 25 50 20 Q 55 25 60 75 Q 65 85 65 95 M 42 72 Q 50 68 58 72" 
                  stroke="#00B0F0" 
                  stroke-width="7" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  fill="none"/>
            <path d="M 58 72 Q 60 70 62 68" 
                  stroke="#00B0F0" 
                  stroke-width="5" 
                  stroke-linecap="round" 
                  fill="none"/>
            <text x="60" y="110" 
                  font-family="Arial, sans-serif" 
                  font-size="12" 
                  font-weight="bold" 
                  fill="#000" 
                  text-anchor="middle">ASCOMP INC.</text>
          </svg>
          <div class="company-info">
            <div class="company-name">ASCOMP INC.</div>
            <div class="company-address">9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064</div>
            <div class="company-contact">
              <div class="contact-item">
                <strong>Desk:</strong> 011-45501226
              </div>
              <div class="contact-item">
                <strong>Mobile:</strong> 8882475207
              </div>
              <div class="contact-item">
                <strong>Website:</strong> <a href="http://www.ascompinc.in" style="color: #0066cc; text-decoration: underline;">WWW.ASCOMPINC.IN</a>
              </div>
              <div class="contact-item">
                <strong>Email:</strong> <a href="mailto:helpdesk@ascompinc.in" style="color: #0066cc; text-decoration: underline;">helpdesk@ascompinc.in</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Christie Logo and Report Title -->
      <div class="christie-logo-section">
        <div class="christie-logo-container">
          <svg class="christie-logo-svg" viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg">
            <!-- CHRISTIE text with italicized I and registered symbol -->
            <text x="0" y="45" 
                  font-family="Arial, sans-serif" 
                  font-size="48" 
                  font-weight="bold" 
                  fill="#000" 
                  letter-spacing="2">
              <tspan>CHR</tspan>
              <tspan font-style="italic">I</tspan>
              <tspan>ST</tspan>
              <tspan>K</tspan>
              <tspan font-style="italic">I</tspan>
              <tspan>E</tspan>
              <tspan font-size="28" baseline-shift="super" font-style="normal">®</tspan>
            </text>
          </svg>
        </div>
        <div class="subtitle">Projector Service Report - ${reportType} done on Date - ${reportDate}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <h3>Site & Personnel</h3>
          <div class="info-item"><strong>Site:</strong> ${siteName}</div>
          <div class="info-item"><strong>Address:</strong> ${siteAddress}</div>
          <div class="info-item"><strong>Site In-charge:</strong> ${siteInchargeName} ${siteInchargePhone ? `(Contact: ${siteInchargePhone})` : ''}</div>
          <div class="info-item"><strong>Ascomp Engineer:</strong> ${engineerName}</div>
          <div class="info-item"><strong>Engineer Phone:</strong> ${engineerPhone}</div>
          <div class="info-item"><strong>Engineer Email:</strong> ${engineerEmail}</div>
        </div>
        
        <div class="info-box">
          <h3>Projector & Lamp Information</h3>
          <div class="info-item"><strong>Brand:</strong> ${brand}</div>
          <div class="info-item"><strong>Model:</strong> ${projectorModel}</div>
          <div class="info-item"><strong>Serial Number:</strong> ${projectorSerial}</div>
          <div class="info-item"><strong>Software Version:</strong> ${softwareVersion}</div>
          <div class="info-item"><strong>Projector running hours:</strong> ${projectorHours}</div>
          <div class="info-item"><strong>Lamp Model:</strong> ${lampModel}</div>
          <div class="info-item"><strong>Lamp running hours:</strong> ${lampHours}</div>
          <div class="info-item"><strong>Current Lamp Hours:</strong> ${currentLampHours}</div>
          <div class="info-item"><strong>Replacement Required:</strong> ${lampReplacementRequired}</div>
        </div>
      </div>
      
      <div class="section-title">SECTIONS</div>
      <table class="sections-table">
        <thead>
          <tr>
            <th>SECTIONS</th>
            <th>DESCRIPTION</th>
            <th>STATUS</th>
            <th>YES/NO - OK</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            let rows = '';
            
            // OPTICALS Section - Use actual form data
            if (opticals && opticals.length > 0) {
              opticals.forEach((item, index) => {
                const description = safeAccess(item, ['description'], '');
                const status = safeAccess(item, ['status'], '');
                const result = safeAccess(item, ['result'], '');
                // Only show default 'OK' if result is truly empty (not just whitespace)
                const displayResult = result && result.trim() !== '' ? result : 'OK';
                
                rows += `
                  <tr>
                    ${index === 0 ? `<td class="section-header" rowspan="${opticals.length}">OPTICALS</td>` : ''}
                    <td>${description || ''}</td>
                    <td>${status || ''}</td>
                    <td class="status-ok">${displayResult}</td>
                  </tr>
                `;
              });
            } else {
              // Fallback: Show empty rows if no opticals data
              console.warn('⚠️ No opticals data found in report');
            }
            
            // ELECTRONICS Section - Use actual form data
            if (electronics && electronics.length > 0) {
              electronics.forEach((item, index) => {
                const description = safeAccess(item, ['description'], '');
                const status = safeAccess(item, ['status'], '');
                const result = safeAccess(item, ['result'], '');
                const displayResult = result && result.trim() !== '' ? result : 'OK';
                
                rows += `
                  <tr>
                    ${index === 0 ? `<td class="section-header" rowspan="${electronics.length}">ELECTRONICS</td>` : ''}
                    <td>${description || ''}</td>
                    <td>${status || ''}</td>
                    <td class="status-ok">${displayResult}</td>
                  </tr>
                `;
              });
            } else {
              console.warn('⚠️ No electronics data found in report');
            }
            
            // Serial Number verified
            const serialDesc = safeAccess(serialNumberVerified, ['description'], 'Chassis label vs Touch Panel');
            const serialStatus = safeAccess(serialNumberVerified, ['status'], '');
            const serialResult = safeAccess(serialNumberVerified, ['result'], '');
            const displaySerialResult = serialResult && serialResult.trim() !== '' ? serialResult : 'OK';
            
            rows += `
              <tr>
                <td class="section-header" rowspan="1">Serial Number verified</td>
                <td>${serialDesc}</td>
                <td>${serialStatus || ''}</td>
                <td class="status-ok">${displaySerialResult}</td>
              </tr>
            `;
            
            // Disposable Consumables
            if (disposableConsumables && disposableConsumables.length > 0) {
              disposableConsumables.forEach((item, index) => {
                const desc = safeAccess(item, ['description'], 'Air Intake, LAD and RAD');
                const status = safeAccess(item, ['status'], '');
                const result = safeAccess(item, ['result'], '');
                const displayResult = result && result.trim() !== '' ? result : 'OK';
                
                rows += `
                  <tr>
                    ${index === 0 ? `<td class="section-header" rowspan="${disposableConsumables.length}">Disposable Consumables</td>` : ''}
                    <td>${desc}</td>
                    <td>${status || ''}</td>
                    <td class="status-ok">${displayResult}</td>
                  </tr>
                `;
              });
            }
            
            // Coolant
            const coolantDesc = safeAccess(coolant, ['description'], 'Level and Color');
            const coolantStatus = safeAccess(coolant, ['status'], '');
            const coolantResult = safeAccess(coolant, ['result'], '');
            const displayCoolantResult = coolantResult && coolantResult.trim() !== '' ? coolantResult : 'OK';
            
            rows += `
              <tr>
                <td class="section-header" rowspan="1">Coolant</td>
                <td>${coolantDesc}</td>
                <td>${coolantStatus || ''}</td>
                <td class="status-ok">${displayCoolantResult}</td>
              </tr>
            `;
            
            // Light Engine Test Pattern
            if (lightEngineTestPatterns && lightEngineTestPatterns.length > 0) {
              lightEngineTestPatterns.forEach((item, index) => {
                const color = safeAccess(item, ['color'], '');
                const status = safeAccess(item, ['status'], '');
                const result = safeAccess(item, ['result'], '');
                const displayResult = result && result.trim() !== '' ? result : 'OK';
                
                rows += `
                  <tr>
                    ${index === 0 ? `<td class="section-header" rowspan="${lightEngineTestPatterns.length}">Light Engine Test Pattern</td>` : ''}
                    <td>${color || ''}</td>
                    <td>${status || ''}</td>
                    <td class="status-ok">${displayResult}</td>
                  </tr>
                `;
              });
            }
            
            // MECHANICAL Section - Use actual form data
            if (mechanical && mechanical.length > 0) {
              mechanical.forEach((item, index) => {
                const description = safeAccess(item, ['description'], '');
                const status = safeAccess(item, ['status'], '');
                const result = safeAccess(item, ['result'], '');
                const displayResult = result && result.trim() !== '' ? result : 'OK';
                
                rows += `
                  <tr>
                    ${index === 0 ? `<td class="section-header" rowspan="${mechanical.length}">MECHANICAL</td>` : ''}
                    <td>${description || ''}</td>
                    <td>${status || ''}</td>
                    <td class="status-ok">${displayResult}</td>
                  </tr>
                `;
              });
            } else {
              console.warn('⚠️ No mechanical data found in report');
            }
            
            return rows;
          })()}
        </tbody>
      </table>
      
      <div class="page-number">1/3</div>
      
      <!-- Page 2: Technical Sections -->
      <div class="page-break">
        <div class="header">
          <div class="date-time">${reportTime}</div>
          <div class="report-title">Service Report</div>
          <div class="report-details">
            <div><strong>Report:</strong> ${reportNumber}</div>
            <div><strong>Type:</strong> ${reportType}</div>
            <div><strong>Date:</strong> ${reportDate}</div>
          </div>
        </div>
        
        <div class="technical-tables">
          <!-- Left Column -->
          <div>
            <div class="section-title">VOLTAGE PARAMETERS</div>
            <table class="technical-table">
              <thead>
                <tr>
                  <th>VOLTAGE PARAMETERS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>P vs N</td>
                  <td>${safeAccess(voltageParameters, ['pVsN'], '-')}</td>
                </tr>
                <tr>
                  <td>P vs E</td>
                  <td>${safeAccess(voltageParameters, ['pVsE'], '-')}</td>
                </tr>
                <tr>
                  <td>N vs E</td>
                  <td>${safeAccess(voltageParameters, ['nVsE'], '-')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">CONTENT PLAYING SERVER</div>
            <div style="margin-bottom: 8px; font-size: 11px;">${safeAccess(contentFunctionality, ['serverContentPlaying'], '-')}</div>
            
            <div class="section-title" style="margin-top: 8px;">FL ON 100% LAMP POWER BEFORE AND AFTER</div>
            <table class="technical-table" style="width: 100%; margin-bottom: 8px;">
              <tbody>
                <tr>
                  <td>Before</td>
                  <td>${safeAccess(contentFunctionality, ['lampPowerTestBefore'], '-')}</td>
                </tr>
                <tr>
                  <td>After</td>
                  <td>${safeAccess(contentFunctionality, ['lampPowerTestAfter'], '-')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">PROJECTOR PLACEMENT, ROOM, ENVIRONMENT</div>
            <div style="margin-bottom: 8px; font-size: 11px;">${safeAccess(contentFunctionality, ['projectorPlacementEnvironment'], 'ok')}</div>
            
            <div class="section-title" style="margin-top: 8px;">OBSERVATIONS AND REMARKS</div>
            <table class="observations-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                ${observations && observations.length > 0 ? observations.map((obs, i) => {
                  const desc = safeAccess(obs, ['description'], '');
                  // Only show row if description exists or it's one of the first 2 rows
                  if (desc && desc.trim() !== '' && desc !== '-') {
                    return `
                      <tr>
                        <td>${safeAccess(obs, ['number'], i + 1)}</td>
                        <td>${desc}</td>
                      </tr>
                    `;
                  } else if (i < 2) {
                    return `
                      <tr>
                        <td>${i + 1}</td>
                        <td>${desc || '-'}</td>
                      </tr>
                    `;
                  }
                  return '';
                }).filter(Boolean).join('') : Array.from({ length: 2 }, (_, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>-</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">RECOMMENDED PARTS TO CHANGE</div>
            <table class="parts-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Part Name</th>
                  <th>Part Number</th>
                  <th>Qty</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${recommendedParts && recommendedParts.length > 0 ? recommendedParts.map((part, i) => {
                  const partName = safeAccess(part, ['partName'], '');
                  // Only show rows with actual data or first 2 empty rows
                  if (partName && partName.trim() !== '' && partName !== '-') {
                    return `
                      <tr>
                        <td>${i + 1}</td>
                        <td>${partName}</td>
                        <td>${safeAccess(part, ['partNumber'], '-')}</td>
                        <td>${safeAccess(part, ['quantity'], '-')}</td>
                        <td>${safeAccess(part, ['notes'], '-')}</td>
                      </tr>
                    `;
                  } else if (i < 2) {
                    return `
                      <tr>
                        <td>${i + 1}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    `;
                  }
                  return '';
                }).filter(Boolean).join('') : Array.from({ length: 2 }, (_, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">MEASURED COLOR COORDINATES (MCGD)</div>
            <table class="color-coordinates-table">
              <thead>
                <tr>
                  <th>Test Pattern</th>
                  <th>fL</th>
                  <th>x</th>
                  <th>y</th>
                </tr>
              </thead>
              <tbody>
                ${measuredColorCoordinates && measuredColorCoordinates.length > 0 ? measuredColorCoordinates.filter((coord) => {
                  const fl = safeAccess(coord, ['fl'], '');
                  const x = safeAccess(coord, ['x'], '');
                  const y = safeAccess(coord, ['y'], '');
                  return (fl && fl.trim() !== '' && fl !== '-') || (x && x.trim() !== '' && x !== '-') || (y && y.trim() !== '' && y !== '-');
                }).map((coord) => `
                  <tr>
                    <td>${safeAccess(coord, ['testPattern'], '-')}</td>
                    <td>${safeAccess(coord, ['fl'], '-')}</td>
                    <td>${safeAccess(coord, ['x'], '-')}</td>
                    <td>${safeAccess(coord, ['y'], '-')}</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
          </div>
          
          <!-- Right Column -->
          <div>
            <div class="section-title">IMAGE EVALUATION</div>
            <table class="technical-table">
              <thead>
                <tr>
                  <th>Image Evaluation</th>
                  <th>OK - Yes/No</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Focus/boresight</td>
                  <td>${safeAccess(imageEvaluation, ['focusBoresight'], 'Yes')}</td>
                </tr>
                <tr>
                  <td>Integrator Position</td>
                  <td>${safeAccess(imageEvaluation, ['integratorPosition'], 'Yes')}</td>
                </tr>
                <tr>
                  <td>Any Spot on the Screen after PPM</td>
                  <td>${safeAccess(imageEvaluation, ['spotOnScreen'], 'No')}</td>
                </tr>
                <tr>
                  <td>Check Screen Cropping - FLAT and SCOPE</td>
                  <td>${safeAccess(imageEvaluation, ['screenCropping'], 'Yes')}</td>
                </tr>
                <tr>
                  <td>Convergence Checked</td>
                  <td>${safeAccess(imageEvaluation, ['convergenceChecked'], 'Yes')}</td>
                </tr>
                <tr>
                  <td>Channels Checked - Scope, Flat, Alternative</td>
                  <td>${safeAccess(imageEvaluation, ['channelsChecked'], 'Yes')}</td>
                </tr>
                <tr>
                  <td>Pixel defects</td>
                  <td>${safeAccess(imageEvaluation, ['pixelDefects'], 'No')}</td>
                </tr>
                <tr>
                  <td>Excessive image vibration</td>
                  <td>${safeAccess(imageEvaluation, ['imageVibration'], 'No')}</td>
                </tr>
                <tr>
                  <td>LiteLOC</td>
                  <td>${safeAccess(imageEvaluation, ['liteLOC'], 'No')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">CIE XYZ COLOR ACCURACY</div>
            <table class="color-coordinates-table">
              <thead>
                <tr>
                  <th>Test Pattern</th>
                  <th>x</th>
                  <th>y</th>
                  <th>fL</th>
                </tr>
              </thead>
              <tbody>
                ${cieColorAccuracy && cieColorAccuracy.length > 0 ? cieColorAccuracy.filter((coord) => {
                  const fl = safeAccess(coord, ['fl'], '');
                  const x = safeAccess(coord, ['x'], '');
                  const y = safeAccess(coord, ['y'], '');
                  return (fl && fl.trim() !== '' && fl !== '-') || (x && x.trim() !== '' && x !== '-') || (y && y.trim() !== '' && y !== '-');
                }).map((coord) => `
                  <tr>
                    <td>${safeAccess(coord, ['testPattern'], '-')}</td>
                    <td>${safeAccess(coord, ['x'], '-')}</td>
                    <td>${safeAccess(coord, ['y'], '-')}</td>
                    <td>${safeAccess(coord, ['fl'], '-')}</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 8px;">SCREEN INFORMATION IN METRES</div>
            <table class="screen-info-table">
              <thead>
                <tr>
                  <th>Height</th>
                  <th>Width</th>
                  <th>Gain</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SCOPE</td>
                  <td>${safeAccess(screenInfo, ['scope', 'height'], '-')}</td>
                  <td>${safeAccess(screenInfo, ['scope', 'width'], '-')}</td>
                  <td>${safeAccess(screenInfo, ['scope', 'gain'], '-')}</td>
                </tr>
                <tr>
                  <td>FLAT</td>
                  <td>${safeAccess(screenInfo, ['flat', 'height'], '-')}</td>
                  <td>${safeAccess(screenInfo, ['flat', 'width'], '-')}</td>
                  <td>${safeAccess(screenInfo, ['flat', 'gain'], '-')}</td>
                </tr>
                <tr>
                  <td>Screen Make</td>
                  <td>${safeAccess(screenInfo, ['screenMake'], '-')}</td>
                  <td>${safeAccess(screenInfo, ['throwDistance'], '-')}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="technical-tables" style="margin-top: 8px;">
          <div>
            <div class="section-title">AIR POLLUTION LEVEL</div>
            <table class="pollution-table">
              <thead>
                <tr>
                  <th>Air Pollution Level</th>
                  <th>HCHO</th>
                  <th>TVOC</th>
                  <th>PM 1.0</th>
                  <th>PM 2.5</th>
                  <th>PM 10</th>
                  <th>Temperature C</th>
                  <th>Humidity %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${safeAccess(airPollutionLevels, ['overall'], '4')}</td>
                  <td>${safeAccess(airPollutionLevels, ['hcho'], '32')}</td>
                  <td>${safeAccess(airPollutionLevels, ['tvoc'], '3')}</td>
                  <td>${safeAccess(airPollutionLevels, ['pm1'], '3')}</td>
                  <td>${safeAccess(airPollutionLevels, ['pm25'], '4')}</td>
                  <td>${safeAccess(airPollutionLevels, ['pm10'], '3')}</td>
                  <td>${safeAccess(airPollutionLevels, ['temperature'], '-')}</td>
                  <td>${safeAccess(airPollutionLevels, ['humidity'], '-')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="status-section">
          <div class="status-item">LE Status During PM: ${safeAccess(finalStatus, ['leStatusDuringPM'], '-')}</div>
          <div class="status-item">AC Status: ${safeAccess(finalStatus, ['acStatus'], '-')}</div>
          <div class="status-item">Photos Before: ${safeAccess(finalStatus, ['photosBefore'], '-')}</div>
          <div class="status-item">Photos After: ${safeAccess(finalStatus, ['photosAfter'], '-')}</div>
          <div class="status-item">Review Photos: <a href="#" style="color: #0066cc; text-decoration: underline;">Click Here.</a></div>
        </div>
        
        <div class="footer-note" style="margin-top: 10px;">
          Note: The ODD file number is BEFORE and EVEN file number is AFTER, PM
        </div>
        
        <div style="text-align: right; margin-top: 5px; font-size: 10px;">PM version 6.3</div>
        
        <div class="page-number">2/3</div>
      </div>
      
      <!-- Page 3: Final Sections -->
      <div class="page-break">
        <div class="header">
          <div class="date-time">${reportTime}</div>
          <div class="report-title">Service Report</div>
          <div class="report-details">
            <div><strong>Report:</strong> ${reportNumber}</div>
            <div><strong>Type:</strong> ${reportType}</div>
            <div><strong>Date:</strong> ${reportDate}</div>
          </div>
        </div>
        
        <!-- Signatures Section -->
        <div class="signature-section">
          <div class="signature-box">
            <h4>Client's Signature & Stamp</h4>
            ${clientSignature ? `
              <img src="${clientSignature}" alt="Client Signature" class="signature-img" />
              <div class="signature-name">${siteInchargeName}</div>
              <div class="signature-date">Date: ${reportDate}</div>
            ` : `
              <div class="signature-placeholder">No signature provided</div>
            `}
          </div>
          
          <div class="signature-box">
            <h4>Engineer's Signature</h4>
            ${engineerSignature ? `
              <img src="${engineerSignature}" alt="Engineer Signature" class="signature-img" />
              <div class="signature-name">${engineerName}</div>
              <div class="signature-date">Date: ${reportDate}</div>
            ` : `
              <div class="signature-placeholder">No signature provided</div>
            `}
            ${engineerPhone ? `<div class="signature-date" style="margin-top: 10px;">Phone: ${engineerPhone}</div>` : ''}
          </div>
        </div>
        
        <div class="footer-note">
          Note: The ODD file number is BEFORE and EVEN file number is AFTER, PM
        </div>
        
        <div class="page-number">3/3</div>
      </div>
    </body>
    </html>
  `;
};

// Main export function for ASCOMP style reports
export const exportASCOMPStyleReport = async (report: any): Promise<void> => {
  console.log('📄 exportASCOMPStyleReport called with report:', report);
  console.log('🔍 Report structure check:', {
    hasReport: !!report,
    reportType: typeof report,
    hasInspectionSections: !!report?.inspectionSections,
    hasSections: !!report?.sections,
    inspectionSectionsKeys: report?.inspectionSections ? Object.keys(report.inspectionSections) : [],
    sectionsKeys: report?.sections ? Object.keys(report.sections) : [],
    sampleOptical: report?.inspectionSections?.opticals?.[0] || report?.sections?.opticals?.[0] || null
  });
  
  if (!report) {
    console.error('exportASCOMPStyleReport: Report is undefined or null');
    alert('Error: No report data available for PDF generation');
    return;
  }

  if (typeof report !== 'object') {
    console.error('exportASCOMPStyleReport: Report is not an object:', report);
    alert('Error: Invalid report data format');
    return;
  }

  // Check if required libraries are available
  if (typeof jsPDF === 'undefined' || typeof html2canvas === 'undefined') {
    console.error('❌ PDF libraries not available. jsPDF:', typeof jsPDF, 'html2canvas:', typeof html2canvas);
    alert('PDF generation libraries not loaded. Please refresh the page and try again.');
    return;
  }

  try {
    console.log('🔄 Generating ASCOMP style report...');
    await generateASCOMPPDF(report);
    console.log('✅ ASCOMP style report generated successfully');
  } catch (error: any) {
    console.error('❌ ASCOMP style report generation failed:', error);
    alert(`Report generation failed: ${error?.message || 'Unknown error'}`);
  }
};

const generateASCOMPPDF = async (report: any): Promise<void> => {
  console.log('🔄 Starting ASCOMP PDF generation...');

  // Generate HTML content
  const htmlContent = generateASCOMPReportHTML(report);
  console.log('Generated ASCOMP HTML content length:', htmlContent.length);

  // Create a complete HTML document
  const fullHtmlDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>ASCOMP Service Report</title>
        <style>
          body { margin: 0; padding: 15px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.2; color: #000; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .date-time { font-size: 11px; color: #333; }
          .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
          .report-details { text-align: right; font-size: 11px; }
          .logo-section { margin-bottom: 15px; }
          .ascomp-logo-container { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .ascomp-logo-img { width: 85px; height: auto; margin-right: 18px; flex-shrink: 0; object-fit: contain; }
          .ascomp-logo-svg { width: 85px; height: auto; margin-right: 18px; flex-shrink: 0; }
          .company-info { flex: 1; padding-top: 3px; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 6px; color: #000; }
          .company-address { font-size: 11px; margin-bottom: 6px; color: #000; }
          .company-contact { font-size: 11px; display: flex; gap: 20px; flex-wrap: wrap; }
          .contact-item { display: flex; align-items: center; gap: 5px; }
          .christie-logo-section { margin: 12px 0 10px 0; padding-left: 0; }
          .christie-logo-container { display: block; margin-bottom: 8px; }
          .christie-logo-svg { height: 40px; width: auto; }
          .brand-title { display: none; }
          .subtitle { text-align: left; font-size: 12px; margin-bottom: 12px; margin-top: 3px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px; }
          .info-box { border: 2px solid #000; padding: 10px; background: #f8f8f8; margin-bottom: 10px; }
          .info-box h3 { margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-decoration: underline; color: #000; }
          .info-item { margin: 3px 0; font-size: 12px; }
          .sections-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; border: 2px solid #000; }
          .sections-table th, .sections-table td { border: 1px solid #000; padding: 6px 5px; text-align: left; vertical-align: middle; }
          .sections-table th { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 11px; border: 1px solid #000; }
          .section-header { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 11px; border: 1px solid #000; }
          .status-ok { text-align: center; font-weight: bold; color: #006600; font-size: 11px; }
          .page-break { page-break-before: always; }
          .section-title { font-size: 12px; font-weight: bold; margin: 10px 0 5px 0; color: #0066cc; text-decoration: underline; }
          .technical-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px; }
          .technical-table { width: 100%; border-collapse: collapse; font-size: 10px; }
          .technical-table th, .technical-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .technical-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .observations-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .observations-table th, .observations-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .observations-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .parts-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .parts-table th, .parts-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .parts-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .color-coordinates-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .color-coordinates-table th, .color-coordinates-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .color-coordinates-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .screen-info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .screen-info-table th, .screen-info-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .screen-info-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .pollution-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
          .pollution-table th, .pollution-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .pollution-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .status-section { margin: 12px 0; }
          .status-item { margin: 3px 0; font-size: 11px; }
          .footer-note { margin-top: 15px; text-align: center; font-size: 11px; font-weight: bold; }
          .page-number { position: absolute; bottom: 20px; right: 20px; font-size: 10px; }
          .signature-section { display: flex; justify-content: space-between; margin: 15px 0; padding: 12px 0; border-top: 2px solid #000; }
          .signature-box { flex: 1; text-align: center; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; margin: 0 8px; }
          .signature-box h4 { margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #000; }
          .signature-img { max-width: 200px; max-height: 80px; margin: 10px auto; display: block; border: 1px solid #ddd; background: white; }
          .signature-placeholder { color: #999; font-style: italic; font-size: 11px; padding: 20px; border: 1px dashed #ccc; margin: 10px 0; }
          .signature-name { margin-top: 10px; font-size: 11px; font-weight: bold; color: #000; }
          .signature-date { margin-top: 5px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = fullHtmlDocument;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm';
  tempContainer.style.backgroundColor = '#ffffff';

  document.body.appendChild(tempContainer);

  try {
    // Generate canvas from HTML
    console.log('🔄 Generating canvas from ASCOMP HTML...');
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    console.log('Canvas created:', canvas.width, 'x', canvas.height);

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    console.log('🔄 Creating ASCOMP PDF...');
    const imgData = canvas.toDataURL('image/png');
    console.log('Image data length:', imgData.length);
    
    if (!imgData || imgData.length < 100) {
      throw new Error('Failed to generate image data from ASCOMP HTML content');
    }
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    console.log('PDF object created');
    
    if (!pdf || typeof pdf.addImage !== 'function') {
      throw new Error('Failed to create PDF object - jsPDF library may not be properly loaded');
    }
    
    // Calculate dimensions to fit the page
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const reportNumber = safeAccess(report, ['reportNumber'], 'Unknown');
    const filename = `ASCOMP_Service_Report_${reportNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    console.log('🔄 Downloading ASCOMP PDF with filename:', filename);
    
    try {
      pdf.save(filename);
      console.log('✅ ASCOMP PDF generation and download completed successfully');
    } catch (downloadError: any) {
      console.error('❌ ASCOMP PDF download failed:', downloadError);
      throw new Error(`Failed to download ASCOMP PDF: ${downloadError?.message || 'Unknown download error'}`);
    }
  } catch (error) {
    console.error('❌ Error generating ASCOMP PDF:', error);
    throw error;
  }
};
