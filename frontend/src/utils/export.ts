// Import PDF generation libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Export utility functions
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => csvHeaders.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return csvContent;
};


// Print HTML version
const printHtml = (title: string, htmlContent: string): void => {
  console.log('🖨️ Opening HTML print version...');
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Unable to open print window. Please allow popups and try again.');
      return;
    }

  printWindow.document.write(`
    <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; }
        .header { margin-bottom: 20px; }
        .company-info { }
        .company-logo { font-size: 24px; font-weight: bold; color: #87CEEB; display: inline-block; margin-right: 5px; }
        .company-name { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 5px; display: inline-block; }
        .website { font-weight: bold; color: #000; text-decoration: underline; }
        .right { text-align: right; }
        .small { font-size: 10px; }
        .report-title { font-size: 32px; font-weight: bold; text-align: left; margin: 15px 0; color: #000; font-family: Arial, sans-serif; }
        .subtitle { font-size: 14px; text-align: left; margin-bottom: 20px; color: #333; }
        .personnel-info { margin-bottom: 15px; }
        .replacement-status { margin-left: 20px; }
        
        /* Main Service Checklist Table */
        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        .main-table th, .main-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .main-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .replacement-header { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .section-cell { background: #e9e9e9; font-weight: bold; text-align: center; }
        
        /* Additional Info Tables */
        .additional-info { margin-top: 20px; display: flex; gap: 30px; }
        .info-left { flex: 1; }
        .info-right { flex: 1; }
        .info-item { margin: 3px 0; font-size: 11px; line-height: 1.2; }
        .table-section { margin-bottom: 20px; }
        .table-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #000; text-decoration: underline; }
        
        /* Evaluation Table */
        .evaluation-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
        .evaluation-table th, .evaluation-table td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
        .evaluation-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 9px; }
        
        /* Parts Table */
        .parts-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        .parts-table th, .parts-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .parts-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        
        /* Color Tables */
        .color-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        .color-table th, .color-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .color-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        
        /* Screen Table */
        .screen-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        .screen-table th, .screen-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .screen-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .throw-distance { margin-top: 10px; font-size: 12px; }
        
        /* Pollution Table */
        .pollution-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        .pollution-table th, .pollution-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .pollution-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        
        /* Observations */
        .observations-section { margin-bottom: 20px; }
        .observations { margin-bottom: 15px; }
        .observation-item { margin: 5px 0; font-size: 12px; }
        
        /* Parts Section */
        .parts-section { margin-bottom: 20px; }
        
        /* Technical Tables */
        .technical-tables { display: flex; gap: 15px; margin-bottom: 20px; }
        .color-coordinates { flex: 1; }
        .color-accuracy { flex: 1; }
        .screen-info { flex: 1; }
        
        /* Pollution Section */
        .pollution-section { margin-bottom: 20px; }
        
        /* Status Section */
        .status-section { margin-top: 20px; padding: 15px; background: #f0f0f0; border: 1px solid #ccc; }
        .status-item { margin: 5px 0; font-size: 11px; }
        .note { margin-top: 10px; font-size: 10px; font-style: italic; color: #666; }
        
        /* Footer */
        .footer { margin-top: 30px; text-align: right; }
        .version { font-size: 10px; color: #666; }
        
        /* Site and Projector Info */
        .site-info { margin-bottom: 15px; }
        .site-info div { margin: 2px 0; font-size: 12px; }
        .projector-info { margin-bottom: 20px; }
        .projector-info div { margin: 2px 0; font-size: 12px; }
        
        /* Grid Layout */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .info-box { border: 1px solid #ccc; padding: 10px; background: #f9f9f9; margin-bottom: 10px; }
        .indent { margin-left: 20px; }
        .text-center { text-align: center; }
        .section-title { font-weight: bold; margin: 20px 0 10px 0; font-size: 14px; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        
        @media print { body { margin: 0; padding: 15px; } }
          </style>
        </head>
        <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
        </body>
      </html>
    `);
  
  printWindow.document.close();
};

// Generate comprehensive HTML for the report
const generateReportHTML = (report: any): string => {
  const safe = (v: any, fallback: string = '-') => (v == null || v === '' ? fallback : String(v));
  const fmtDate = (d: any) => {
    try { return new Date(d || Date.now()).toLocaleDateString(); } catch { return safe(d); }
  };

  // Safely access nested properties with fallbacks
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

  // Safely get array for mapping operations
  const safeArray = (value: any, fallback: any[] = []) => {
    if (Array.isArray(value)) {
      return value;
    }
    return fallback;
  };

  // Safely get engineer name with multiple fallback paths
  const getEngineerName = (report: any): string => {
    try {
      return safeAccess(report, ['engineer', 'name']) || 
             safeAccess(report, ['engineerName']) || 
             safeAccess(report, ['technician', 'name']) || 
             safeAccess(report, ['technicianName']) || 
             safeAccess(report, ['fse', 'name']) || 
             safeAccess(report, ['fseName']) || 
             'Engineer Name Not Available';
    } catch (error) {
      console.error('Error getting engineer name:', error);
      return 'Engineer Name Not Available';
    }
  };

  // Safely get site incharge name with fallbacks
  const getSiteInchargeName = (report: any): string => {
    try {
      return safeAccess(report, ['siteIncharge', 'name']) || 
             safeAccess(report, ['siteInchargeName']) || 
             safeAccess(report, ['contactPerson', 'name']) || 
             safeAccess(report, ['contactName']) || 
             'Site Contact Not Available';
    } catch (error) {
      console.error('Error getting site incharge name:', error);
      return 'Site Contact Not Available';
    }
  };

  // Safely get site incharge phone with fallbacks
  const getSiteInchargePhone = (report: any): string => {
    try {
      return safeAccess(report, ['siteIncharge', 'phone']) || 
             safeAccess(report, ['siteInchargePhone']) || 
             safeAccess(report, ['contactPerson', 'phone']) || 
             safeAccess(report, ['contactPhone']) || 
             'Phone Not Available';
    } catch (error) {
      console.error('Error getting site incharge phone:', error);
      return 'Phone Not Available';
    }
  };

  // Generate sections table rows
  const generateSectionRows = (sections: any[], sectionName: string) => {
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      // Return default section if no data
      return `
        <tr>
          <td class="section-cell">${sectionName}</td>
          <td>No data available</td>
          <td class="text-center">-</td>
          <td class="text-center">OK</td>
        </tr>
      `;
    }
    
    return sections.map((item, index) => `
      <tr>
        <td class="section-cell">${index === 0 ? sectionName : ''}</td>
        <td>${safe(item.description || item.color || item.partName || '')}</td>
        <td class="text-center">${safe(item.status || '-')}</td>
        <td class="text-center">${safe(item.result || 'OK')}</td>
      </tr>
    `).join('');
  };

  // Generate single section row
  const generateSingleSectionRow = (item: any, sectionName: string) => {
    if (!item) {
      // Return default row if no data
      return `
        <tr>
          <td class="section-cell">${sectionName}</td>
          <td>No data available</td>
          <td class="text-center">-</td>
          <td class="text-center">OK</td>
        </tr>
      `;
    }
    
    return `
      <tr>
        <td class="section-cell">${sectionName}</td>
        <td>${safe(item.description || '')}</td>
        <td class="text-center">${safe(item.status || '-')}</td>
        <td class="text-center">${safe(item.result || 'OK')}</td>
      </tr>
    `;
  };

  return `
    <div class="header">
      <div class="company-info">
        <div class="company-logo">A</div>
        <div class="company-name">ASCOMP INC.</div>
        <div>Address: 9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064</div>
        <div>Desk: 011-45501226 Mobile: 8882475207 - <span class="website">WWW.ASCOMPINC.IN</span></div>
        <div>Email - helpdesk@ascompinc.in</div>
      </div>
    </div>
    
    <div class="report-title">CHRISTIE<sup>®</sup></div>
    <div class="subtitle">Projector Service Report - ${safe(safeAccess(report, ['reportType']))} done on Date – ${fmtDate(safeAccess(report, ['date']))}</div>
    
    <div class="site-info">
      <div><strong>Site -</strong> ${safe(safeAccess(report, ['siteName']))}</div>
    </div>
    
    <div class="personnel-info">
      <div>In presence of Site In-charge - Mr. ${getSiteInchargeName(report)} - <strong>${getSiteInchargePhone(report)}</strong>, Ascomp Engineer - ${getEngineerName(report)}</div>
    </div>
    
    <div class="projector-info">
      <div><strong>Projector Model</strong> ${safe(safeAccess(report, ['projectorModel']))} <strong>with Serial Number</strong> <strong>${safe(safeAccess(report, ['projectorSerial']))}</strong> <strong>and Software Version -</strong> ${safe(safeAccess(report, ['softwareVersion']))}</div>
      <div><strong>Projector running hours -</strong> <strong>${safe(safeAccess(report, ['projectorRunningHours']))}</strong> <strong>Lamp Model and running hours -</strong> ${safe(safeAccess(report, ['lampModel']))} - <strong>${safe(safeAccess(report, ['lampRunningHours']))}</strong> <strong>Current Lamp Hours -</strong> <strong>${safe(safeAccess(report, ['currentLampHours']))}</strong></div>
      <div class="replacement-status"><strong>Replacement Required</strong></div>
    </div>

    <!-- Main Service Checklist Table -->
    <table class="main-table">
      <thead>
        <tr>
          <th>SECTIONS</th>
          <th>DESCRIPTION</th>
          <th>STATUS</th>
          <th>YES/NO - OK</th>
        </tr>
      </thead>
      <tbody>
        ${generateSectionRows(safeAccess(report, ['sections', 'opticals']) || [
          { description: 'Reflector', status: '-', result: 'OK' },
          { description: 'UV filter', status: '-', result: 'OK' },
          { description: 'Integrator Rod', status: '-', result: 'OK' },
          { description: 'Cold Mirror', status: '-', result: 'OK' },
          { description: 'Fold Mirror', status: '-', result: 'OK' }
        ], 'OPTICALS')}
        ${generateSectionRows(safeAccess(report, ['sections', 'electronics']) || [
          { description: 'Touch Panel', status: '-', result: 'OK' },
          { description: 'EVB Board', status: '-', result: 'OK' },
          { description: 'IMCB Board/s', status: '-', result: 'OK' },
          { description: 'PIB Board', status: '-', result: 'OK' },
          { description: 'ICP Board', status: '-', result: 'OK' },
          { description: 'IMB/S Board', status: '-', result: 'OK' }
        ], 'ELECTRONICS')}
        ${generateSingleSectionRow(safeAccess(report, ['sections', 'serialNumberVerified']) || {
          description: 'Chassis label vs Touch Panel',
          status: '-',
          result: 'OK'
        }, 'Serial Number verified')}
        ${generateSectionRows(safeAccess(report, ['sections', 'disposableConsumables']) || [
          { description: 'Air Intake, LAD and RAD', status: 'replaced', result: 'OK' }
        ], 'Disposable Consumables')}
        ${generateSingleSectionRow(safeAccess(report, ['sections', 'coolant']) || {
          description: 'Level and Color',
          status: '-',
          result: 'OK'
        }, 'Coolant')}
        ${generateSectionRows(safeAccess(report, ['sections', 'lightEngineTestPatterns']) || [
          { color: 'White', status: '-', result: 'OK' },
          { color: 'Red', status: '-', result: 'OK' },
          { color: 'Green', status: '-', result: 'OK' },
          { color: 'Blue', status: '-', result: 'OK' },
          { color: 'Black', status: '-', result: 'OK' }
        ], 'Light Engine Test Pattern')}
        ${generateSectionRows(safeAccess(report, ['sections', 'mechanical']) || [
          { description: 'AC blower and Vane Switch', status: '-', result: 'OK' },
          { description: 'Extractor Vane Switch', status: '-', result: 'OK' },
          { description: 'Exhaust CFM', status: '-', result: 'OK' },
          { description: 'Light Engine 4 fans with LAD fan', status: '-', result: 'OK' },
          { description: 'Card Cage Top and Bottom fans', status: '-', result: 'OK' },
          { description: 'Radiator fan and Pump', status: '-', result: 'OK' },
          { description: 'Connector and hose for the Pump', status: '-', result: 'OK' },
          { description: 'Security and lamp house lock switch', status: '-', result: 'OK' },
          { description: 'Lamp LOC Mechanism X, Y and Z movement', status: '-', result: 'OK' }
        ], 'MECHANICAL')}
      </tbody>
    </table>

    <!-- Observations and Recommended Parts Section -->
    <div class="observations-section">
      <h3>Observations and Remarks</h3>
      <div class="observations">
        ${safeArray(safeAccess(report, ['observations']), [
          { description: 'Service completed successfully' },
          { description: 'All systems functioning normally' },
          { description: '-' },
          { description: '-' },
          { description: '-' },
          { description: '-' }
        ]).map((obs: any, index: number) => 
          `<div class="observation-item">${index + 1}. ${safe(obs.description || obs || '-')}</div>`
        ).join('')}
      </div>
    </div>

    <!-- Recommended Parts Section -->
    <div class="parts-section">
      <h3>Recommended Parts to Change</h3>
      <table class="parts-table">
        <thead>
          <tr>
            <th>S. No.</th>
            <th>Part Name</th>
            <th>Part Number</th>
          </tr>
        </thead>
        <tbody>
          ${safeArray(safeAccess(report, ['recommendedParts']), [
            { partName: '-', partNumber: '-' },
            { partName: '-', partNumber: '-' },
            { partName: '-', partNumber: '-' },
            { partName: '-', partNumber: '-' },
            { partName: '-', partNumber: '-' },
            { partName: '-', partNumber: '-' }
          ]).map((part: any, index: number) => 
            `<tr>
              <td>${index + 1}.</td>
              <td>${safe(part.partName || '-')}</td>
              <td>${safe(part.partNumber || '-')}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>

    <!-- Image Evaluation Section -->
    <div class="evaluation-section">
      <table class="evaluation-table">
        <thead>
          <tr>
            <th>Image Evaluation</th>
            <th>OK - Yes/No</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Focus/boresight</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'focusBoresight']) || 'Yes')}</td></tr>
          <tr><td>Integrator Position</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'integratorPosition']) || 'Yes')}</td></tr>
          <tr><td>Any Spot on the Screen after PPM</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'spotOnScreen']) || 'No')}</td></tr>
          <tr><td>Check Screen Cropping - FLAT and SCOPE</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'screenCropping']) || 'Yes')}</td></tr>
          <tr><td>Convergence Checked</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'convergenceChecked']) || 'Yes')}</td></tr>
          <tr><td>Channels Checked - Scope, Flat, Alternative</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'channelsChecked']) || 'Yes')}</td></tr>
          <tr><td>Pixel defects</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'pixelDefects']) || 'No')}</td></tr>
          <tr><td>Excessive image vibration</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'imageVibration']) || 'Yes')}</td></tr>
          <tr><td>LiteLOC</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'liteLoc']) || 'No')}</td></tr>
        </tbody>
      </table>
    </div>


    <!-- Technical Data Tables -->
    <div class="technical-tables">
      <div class="color-coordinates">
        <h3>Measured color coordinates (MCGD)</h3>
        <table class="color-table">
          <thead>
            <tr>
              <th>fL</th>
              <th>x</th>
              <th>y</th>
            </tr>
          </thead>
          <tbody>
            ${safeArray(safeAccess(report, ['measuredColorCoordinates']), []).map((item: any) => 
              `<tr><td>${safe(item.testPattern)}</td><td class="text-center">${safe(item.fl || '-')}</td><td class="text-center">${safe(item.x || '-')}</td><td class="text-center">${safe(item.y || '-')}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>

      <div class="color-accuracy">
        <h3>CIE XYZ Color Accuracy</h3>
        <table class="color-table">
          <thead>
            <tr>
              <th>Test Pattern</th>
              <th>x</th>
              <th>y</th>
              <th>fL</th>
            </tr>
          </thead>
          <tbody>
            ${safeArray(safeAccess(report, ['cieColorAccuracy']), []).map((item: any) => 
              `<tr><td>${safe(item.testPattern)}</td><td class="text-center">${safe(item.x || '-')}</td><td class="text-center">${safe(item.y || '-')}</td><td class="text-center">${safe(item.fl || '-')}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>

      <div class="screen-info">
        <h3>Screen Information in metres</h3>
        <table class="screen-table">
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
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'scope', 'height']) || '6.81')}</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'scope', 'width']) || '16.27')}</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'scope', 'gain']) || '-')}</td>
            </tr>
            <tr>
              <td>FLAT</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'flat', 'height']) || '-')}</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'flat', 'width']) || '-')}</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'flat', 'gain']) || '-')}</td>
            </tr>
            <tr>
              <td>Screen: Make,</td>
              <td class="text-center">${safe(safeAccess(report, ['screenInfo', 'screenMake']) || '-')}</td>
              <td class="text-center"></td>
              <td class="text-center"></td>
            </tr>
          </tbody>
        </table>
        <div class="throw-distance">
          <strong>Throw Distance</strong> ${safe(safeAccess(report, ['screenInfo', 'throwDistance']) || '21.1')}
        </div>
      </div>
    </div>

    <!-- Air Pollution Level -->
    <div class="pollution-section">
      <h3>Air Pollution Level</h3>
      <table class="pollution-table">
        <thead>
          <tr>
            <th>Air Pollution Level</th>
            <th>HCHO</th>
            <th>TVOC</th>
            <th>PM 1.0</th>
            <th>PM2.5</th>
            <th>PM10</th>
            <th>Temperature C</th>
            <th>Humidity %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'overall']) || '28')}</td>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'hcho']) || '0.098')}</td>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'tvoc']) || '0.424')}</td>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'pm1']) || '12')}</td>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'pm25']) || '16')}</td>
            <td class="text-center">${safe(safeAccess(report, ['airPollutionLevel', 'pm10']) || '18')}</td>
            <td class="text-center">${safe(safeAccess(report, ['environmentalConditions', 'temperature']) || '25')}</td>
            <td class="text-center">${safe(safeAccess(report, ['environmentalConditions', 'humidity']) || '34%')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- System Status -->
    <div class="status-section">
      <div class="status-item">LE Status During PM: <strong>${safe(safeAccess(report, ['systemStatus', 'leStatus']) || 'Removed')}</strong></div>
      <div class="status-item">AC Status: <strong>${safe(safeAccess(report, ['systemStatus', 'acStatus']) || 'Working')}</strong></div>
      <div class="status-item">Review Photos <strong class="underline">Click Here.</strong></div>
      <div class="status-item underline">Note: The ODD file number is BEFORE and EVEN file number is AFTER, PM</div>
    </div>

    <div class="footer">
      <div class="version">PM version 6.3</div>
    </div>
  `;
};

// Main PDF export function
export const exportServiceReportToPDF = async (report: any): Promise<void> => {
  console.log('exportServiceReportToPDF called with report:', report);
  
  if (!report) {
    console.error('exportServiceReportToPDF: Report is undefined or null');
    alert('Error: No report data available for PDF generation');
    return;
  }

  if (typeof report !== 'object') {
    console.error('exportServiceReportToPDF: Report is not an object:', report);
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
    console.log('🔄 Attempting PDF export...');
    await generateAndDownloadPDF(report);
    console.log('✅ PDF export completed successfully');
  } catch (error: any) {
    console.error('❌ PDF export failed with error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Show user-friendly error message with options
    const userChoice = confirm(`PDF generation failed: ${error?.message || 'Unknown error'}.\n\nWould you like to open a print-friendly HTML version instead?\n\nClick OK for HTML version, Cancel to try again.`);
    
    if (userChoice) {
      // Fallback to HTML print version
      console.log('🔄 Opening HTML print version as fallback...');
      const htmlContent = generateReportHTML(report);
      printHtml('ASCOMP Service Report', htmlContent);
    } else {
      throw error; // Re-throw to let calling code handle it
    }
  }
};

const generateAndDownloadPDF = async (report: any): Promise<void> => {
  console.log('🔄 Starting PDF generation...');

  // Generate HTML content with proper styling
  const htmlContent = generateReportHTML(report);
  console.log('Generated HTML content length:', htmlContent.length);

  // Create a complete HTML document with inline styles
  const fullHtmlDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>ASCOMP Service Report</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .company-info { flex: 1; }
          .company-logo { font-size: 24px; font-weight: bold; color: #000; }
          .company-name { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 5px; }
          .website { font-weight: bold; color: #000; text-decoration: underline; }
          .right { text-align: right; }
          .small { font-size: 10px; }
          .report-title { font-size: 24px; font-weight: bold; text-align: center; margin: 15px 0; color: #000; font-family: 'Times New Roman', serif; letter-spacing: 2px; }
          .subtitle { font-size: 14px; text-align: center; margin-bottom: 20px; color: #333; }
          
          /* Main Service Checklist Table */
          .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .main-table th, .main-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
          .main-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          .replacement-header { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          .section-cell { background: #e9e9e9; font-weight: bold; text-align: center; }
          
          /* Additional Info Tables */
          .additional-info { margin-top: 20px; display: flex; gap: 30px; }
          .info-left { flex: 1; }
          .info-right { flex: 1; }
          .info-item { margin: 3px 0; font-size: 11px; line-height: 1.2; }
          .table-section { margin-bottom: 20px; }
          .table-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #000; text-decoration: underline; }
          
          /* Evaluation Table */
          .evaluation-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
          .evaluation-table th, .evaluation-table td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
          .evaluation-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 9px; }
          
          /* Parts Table */
          .parts-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          .parts-table th, .parts-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
          .parts-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          
          /* Color Tables */
          .color-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          .color-table th, .color-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
          .color-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          
          /* Screen Table */
          .screen-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          .screen-table th, .screen-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
          .screen-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          
          /* Pollution Table */
          .pollution-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          .pollution-table th, .pollution-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
          .pollution-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
          
          /* Observations Section */
          .observations-section { margin-bottom: 20px; }
          .observations { margin-top: 10px; }
          .observation-item { margin: 5px 0; font-size: 12px; }
          
          /* Parts Section */
          .parts-section { margin-bottom: 20px; }
          
          /* Technical Tables */
          .technical-tables { display: flex; gap: 15px; margin-bottom: 20px; }
          .color-coordinates { flex: 1; }
          .color-accuracy { flex: 1; }
          .screen-info { flex: 1; }
          
          /* Pollution Section */
          .pollution-section { margin-bottom: 20px; }
          
          /* Status Section */
          .status-section { margin-bottom: 20px; }
          .status-item { margin: 5px 0; font-size: 12px; }
          
          /* Footer */
          .footer { margin-top: 30px; text-align: right; }
          .version { font-size: 10px; color: #666; }
          
          /* Site and Projector Info */
          .site-info { margin-bottom: 15px; }
          .site-info div { margin: 2px 0; font-size: 12px; }
          .projector-info { margin-bottom: 20px; }
          .projector-info div { margin: 2px 0; font-size: 12px; }
          
          /* Grid Layout */
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .info-box { border: 1px solid #ccc; padding: 10px; background: #f9f9f9; margin-bottom: 10px; }
          .indent { margin-left: 20px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .underline { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Create a temporary container for the HTML content
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '800px';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.fontSize = '12px';
  tempContainer.style.lineHeight = '1.4';
  tempContainer.style.padding = '20px';
  tempContainer.style.color = '#000';
  
  // Use the full HTML document instead of just the content
  tempContainer.innerHTML = fullHtmlDocument;
  document.body.appendChild(tempContainer);

  try {
    // Generate canvas from HTML
    console.log('🔄 Generating canvas from HTML...');
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
    console.log('🔄 Creating PDF...');
    const imgData = canvas.toDataURL('image/png');
    console.log('Image data length:', imgData.length);
    
    if (!imgData || imgData.length < 100) {
      throw new Error('Failed to generate image data from HTML content');
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
    const reportNumber = report?.reportNumber || 'Unknown';
    const filename = `ASCOMP_Report_${reportNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    console.log('🔄 Downloading PDF with filename:', filename);
    
    try {
      pdf.save(filename);
      console.log('✅ PDF generation and download completed successfully');
    } catch (downloadError: any) {
      console.error('❌ PDF download failed:', downloadError);
      throw new Error(`Failed to download PDF: ${downloadError?.message || 'Unknown download error'}`);
    }
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    // Fallback to HTML print version
    console.log('🔄 Falling back to HTML print version...');
    printHtml(`ASCOMP Service Report - ${report?.reportNumber || 'Unknown'}`, htmlContent);
  }
};

// Helper function for safe access (moved to top of file to avoid duplication)

// Download CSV function
export const downloadCSV = (data: any[], filename: string = 'export.csv', headers?: string[]): void => {
  const csvContent = convertToCSV(data, headers);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate PDF function
export const generatePDF = async (data: any, _filename: string = 'export.pdf'): Promise<void> => {
  try {
    await exportServiceReportToPDF(data);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// Download PDF function
export const downloadPDF = async (data: any, _filename: string = 'export.pdf'): Promise<void> => {
  try {
    await exportServiceReportToPDF(data);
  } catch (error) {
    console.error('PDF download failed:', error);
    throw error;
  }
};

// Generate label function
export const generateLabel = (data: any): string => {
  // Simple label generation - can be enhanced based on requirements
  const safe = (v: any, fallback: string = '-') => (v == null || v === '' ? fallback : String(v));
  
  return `
Label Information:
- ID: ${safe(data.id)}
- Name: ${safe(data.name)}
- Type: ${safe(data.type)}
- Date: ${new Date().toLocaleDateString()}
  `.trim();
};

// Print label function
export const printLabel = (data: any): void => {
  const labelContent = generateLabel(data);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Unable to open print window. Please allow popups and try again.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Label Print</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000; 
          }
          .label { 
            border: 2px solid #000; 
            padding: 10px; 
            margin: 10px 0; 
            background: white;
          }
          @media print { 
            body { margin: 0; padding: 10px; } 
            .label { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <pre>${labelContent}</pre>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};