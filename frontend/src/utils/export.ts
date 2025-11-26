// Import ASCOMP style report generator
import { exportASCOMPStyleReport } from './ascomp-report-generator';


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
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; background: white; }
        
        /* ASCOMP Header Styles */
        .ascomp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header-left { flex: 1; }
        .header-right { text-align: right; }
        .date-time { font-size: 12px; margin-bottom: 10px; }
        .ascomp-logo-section { display: flex; align-items: flex-start; }
        .ascomp-logo { width: 40px; height: 40px; background: #0066CC; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-right: 15px; }
        .ascomp-company { flex: 1; }
        .company-name { font-size: 18px; font-weight: bold; color: #0066CC; margin-bottom: 5px; }
        .company-address { font-size: 12px; margin-bottom: 5px; }
        .company-contact { font-size: 12px; margin-bottom: 5px; }
        .company-contact span { margin-right: 15px; }
        .website { font-weight: bold; color: #0066CC; text-decoration: underline; }
        .company-email { font-size: 12px; }
        .service-report-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .report-details { font-size: 12px; }
        .report-details div { margin: 2px 0; }
        
        /* Report Title */
        .report-title { font-size: 36px; font-weight: bold; text-align: center; margin: 20px 0; color: #0066CC; font-family: 'Times New Roman', serif; letter-spacing: 3px; }
        .subtitle { font-size: 14px; text-align: center; margin-bottom: 30px; color: #333; }
        
        /* Site and Personnel Info */
        .site-personnel-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .site-info { flex: 1; margin-right: 30px; }
        .projector-info { flex: 1; }
        .site-info div, .projector-info div { margin: 5px 0; font-size: 12px; }
        .personnel-details { margin-left: 20px; }
        .lamp-info { margin-top: 15px; }
        
        /* Sections Header */
        .sections-header h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #0066CC; text-decoration: underline; }
        
        /* Main Service Checklist Table */
        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        .main-table th, .main-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .main-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .replacement-header { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .section-cell { background: #e9e9e9; font-weight: bold; text-align: center; }
        
        /* Technical Sections */
        .technical-sections { margin-bottom: 20px; }
        .voltage-section, .evaluation-section, .content-server-section, .lamp-power-section, .placement-section { margin-bottom: 15px; }
        .voltage-section h3, .content-server-section h3, .lamp-power-section h3, .placement-section h3 { font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #000; }
        
        /* Voltage Table */
        .voltage-table { width: 200px; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
        .voltage-table td { border: 1px solid #000; padding: 4px 8px; }
        
        /* Content Server Field */
        .content-server-field { border: 1px solid #000; padding: 4px 8px; width: 200px; min-height: 20px; }
        
        /* Lamp Power Table */
        .lamp-power-table { width: 200px; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
        .lamp-power-table td { border: 1px solid #000; padding: 4px 8px; }
        
        /* Placement Field */
        .placement-field { border: 1px solid #000; padding: 4px 8px; width: 200px; min-height: 20px; }
        
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
        
        /* Color Coordinates and CIE Sections */
        .color-coordinates-section, .cie-color-section { margin-bottom: 20px; }
        .color-coordinates-section h3, .cie-color-section h3 { font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #000; }
        
        /* Screen Info Section */
        .screen-info-section { margin-bottom: 20px; }
        .screen-info-section h3 { font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #000; }
        
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

// Generate comprehensive HTML for the report - ASCOMP Format
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
    <!-- ASCOMP Service Report Header -->
    <div class="ascomp-header">
      <div class="header-left">
        <div class="date-time">${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
        <div class="ascomp-logo-section">
          <div class="ascomp-logo">A</div>
          <div class="ascomp-company">
            <div class="company-name">ASCOMP INC.</div>
            <div class="company-address">9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064</div>
            <div class="company-contact">
              <span>Desk: 011-45501226</span>
              <span>Mobile: 8882475207</span>
              <span class="website">WWW.ASCOMPINC.IN</span>
            </div>
            <div class="company-email">Email - helpdesk@ascompinc.in</div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="service-report-title">Service Report</div>
        <div class="report-details">
          <div>Report: ${safe(safeAccess(report, ['reportNumber']))}</div>
          <div>Type: ${safe(safeAccess(report, ['reportType']))}</div>
          <div>Date: ${fmtDate(safeAccess(report, ['date']))}</div>
        </div>
      </div>
    </div>
    
    <div class="report-title">CHRISTIE<sup>®</sup></div>
    <div class="subtitle">Projector Service Report - ${safe(safeAccess(report, ['reportType']))} done on Date – ${fmtDate(safeAccess(report, ['date']))}</div>
    
    <div class="site-personnel-info">
      <div class="site-info">
        <div><strong>Site:</strong> ${safe(safeAccess(report, ['siteName']))}</div>
        <div><strong>Personnel:</strong></div>
        <div class="personnel-details">
          <div>Site In-charge: Mr. ${getSiteInchargeName(report)} - <strong>${getSiteInchargePhone(report)}</strong></div>
          <div>Ascomp Engineer: ${getEngineerName(report)}</div>
        </div>
      </div>
      
      <div class="projector-info">
        <div><strong>Projector Information:</strong></div>
        <div>Model: ${safe(safeAccess(report, ['projectorModel']))}</div>
        <div>Serial Number: ${safe(safeAccess(report, ['projectorSerial']))}</div>
        <div>Software Version: ${safe(safeAccess(report, ['softwareVersion']))}</div>
        <div>Projector running hours: ${safe(safeAccess(report, ['projectorRunningHours']))}</div>
        
        <div class="lamp-info">
          <div><strong>Lamp Information:</strong></div>
          <div>Lamp Model: ${safe(safeAccess(report, ['lampModel']))}</div>
          <div>Lamp running hours: ${safe(safeAccess(report, ['lampRunningHours']))}</div>
          <div>Current Lamp Hours: ${safe(safeAccess(report, ['currentLampHours']))}</div>
          <div>Replacement Required: ${safe(safeAccess(report, ['replacementRequired'])) === 'true' ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>

    <!-- Main Service Checklist Table -->
    <div class="sections-header">
      <h3>SECTIONS</h3>
    </div>
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
          { description: 'Reflector', status: 'damage', result: 'OK' },
          { description: 'UV filter', status: 'solrized', result: 'OK' },
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
          { description: 'Air Intake, LAD and RAD', status: 'Replaced', result: 'OK' }
        ], 'Disposable Consumables')}
        ${generateSingleSectionRow(safeAccess(report, ['sections', 'coolant']) || {
          description: 'Level and Color',
          status: '-',
          result: 'OK'
        }, 'Coolant')}
        ${generateSectionRows(safeAccess(report, ['sections', 'lightEngineTestPatterns']) || [
          { description: '', status: '-', result: 'OK' },
          { description: '', status: '-', result: 'OK' },
          { description: '', status: '-', result: 'OK' },
          { description: '', status: '-', result: 'OK' },
          { description: '', status: '-', result: 'OK' }
        ], 'Light Engine Test Pattern')}
        ${generateSectionRows(safeAccess(report, ['sections', 'mechanical']) || [
          { description: 'AC blower and Vane Switch', status: '-', result: 'OK' },
          { description: 'Extractor Vane Switch', status: '-', result: 'OK' },
          { description: 'Exhaust CFM', status: '7.5 M/S', result: 'OK' },
          { description: 'Light Engine 4 fans with LAD fan', status: '-', result: 'OK' },
          { description: 'Card Cage Top and Bottom fans', status: '-', result: 'OK' },
          { description: 'Radiator fan and Pump', status: '-', result: 'OK' },
          { description: 'Connector and hose for the Pump', status: '-', result: 'OK' },
          { description: 'Security and lamp house lock switch', status: '-', result: 'OK' },
          { description: 'Lamp LOC Mechanism X, Y and Z movement', status: '-', result: 'OK' }
        ], 'MECHANICAL')}
      </tbody>
    </table>

    <!-- Additional Technical Sections -->
    <div class="technical-sections">
      <!-- Voltage Parameters -->
      <div class="voltage-section">
        <h3>Voltage Parameters</h3>
        <table class="voltage-table">
          <tbody>
            <tr><td>P vs N</td><td class="text-center">-</td></tr>
            <tr><td>P vs E</td><td class="text-center">-</td></tr>
            <tr><td>N vs E</td><td class="text-center">-</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Image Evaluation -->
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
            <tr><td>Excessive image vibration</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'imageVibration']) || 'No')}</td></tr>
            <tr><td>LiteLOC</td><td class="text-center">${safe(safeAccess(report, ['imageEvaluation', 'liteLoc']) || 'No')}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Content Playing Server -->
      <div class="content-server-section">
        <h3>Content Playing Server</h3>
        <div class="content-server-field">-</div>
      </div>

      <!-- FL ON 100% LAMP POWER BEFORE AND AFTER -->
      <div class="lamp-power-section">
        <h3>FL ON 100% LAMP POWER BEFORE AND AFTER</h3>
        <table class="lamp-power-table">
          <tbody>
            <tr><td>Before</td><td class="text-center">-</td></tr>
            <tr><td>After</td><td class="text-center">-</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Projector Placement, Room, Environment -->
      <div class="placement-section">
        <h3>Projector Placement, Room, Environment</h3>
        <div class="placement-field">${safe(safeAccess(report, ['projectorPlacement']) || 'ok')}</div>
      </div>
    </div>

    <!-- Observations and Recommended Parts Section -->
    <div class="observations-section">
      <h3>Observations and Remarks</h3>
      <table class="observations-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Observation</th>
          </tr>
        </thead>
        <tbody>
          ${safeArray(safeAccess(report, ['observations']), [
            { description: 'ok' },
            { description: '-' },
            { description: '-' },
            { description: '-' },
            { description: '-' },
            { description: '-' }
          ]).map((obs: any, index: number) => 
            `<tr><td>${index + 1}</td><td>${safe(obs.description || obs || '-')}</td></tr>`
          ).join('')}
        </tbody>
      </table>
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
            <th>Qty</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${safeArray(safeAccess(report, ['recommendedParts']), [
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' },
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' },
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' },
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' },
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' },
            { partName: '-', partNumber: '-', quantity: '-', notes: '-' }
          ]).map((part: any, index: number) => 
            `<tr>
              <td>${index + 1}.</td>
              <td>${safe(part.partName || '-')}</td>
              <td>${safe(part.partNumber || '-')}</td>
              <td>${safe(part.quantity || '-')}</td>
              <td>${safe(part.notes || '-')}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>

    <!-- Measured Color Coordinates Section -->
    <div class="color-coordinates-section">
      <h3>Measured Color Coordinates (MCGD)</h3>
      <table class="color-table">
        <thead>
          <tr>
            <th>Test Pattern</th>
            <th>fL</th>
            <th>x</th>
            <th>y</th>
          </tr>
        </thead>
        <tbody>
          ${safeArray(safeAccess(report, ['measuredColorCoordinates']), [
            { testPattern: 'White 2K', fl: '-', x: '-', y: '-' },
            { testPattern: 'White 4K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Red 2K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Red 4K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Green 2K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Green 4K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Blue 2K', fl: '-', x: '-', y: '-' },
            { testPattern: 'Blue 4K', fl: '-', x: '-', y: '-' }
          ]).map((item: any) => 
            `<tr>
              <td>${safe(item.testPattern)}</td>
              <td class="text-center">${safe(item.fl || '-')}</td>
              <td class="text-center">${safe(item.x || '-')}</td>
              <td class="text-center">${safe(item.y || '-')}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>

    <!-- CIE XYZ Color Accuracy Section -->
    <div class="cie-color-section">
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
          ${safeArray(safeAccess(report, ['cieColorAccuracy']), [
            { testPattern: 'BW Step-10 2K', x: '-', y: '-', fl: '-' },
            { testPattern: 'BW Step-10 4K', x: '-', y: '-', fl: '-' }
          ]).map((item: any) => 
            `<tr>
              <td>${safe(item.testPattern)}</td>
              <td class="text-center">${safe(item.x || '-')}</td>
              <td class="text-center">${safe(item.y || '-')}</td>
              <td class="text-center">${safe(item.fl || '-')}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>


    <!-- Screen Information Section -->
    <div class="screen-info-section">
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
            <td class="text-center">-</td>
            <td class="text-center">-</td>
            <td class="text-center">-</td>
          </tr>
          <tr>
            <td>FLAT</td>
            <td class="text-center">-</td>
            <td class="text-center">-</td>
            <td class="text-center">-</td>
          </tr>
          <tr>
            <td>Screen Make</td>
            <td class="text-center">-</td>
            <td class="text-center">Throw Distance -</td>
            <td class="text-center"></td>
          </tr>
        </tbody>
      </table>
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
            <th>PM 2.5</th>
            <th>PM 10</th>
            <th>Temperature C</th>
            <th>Humidity %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center">4</td>
            <td class="text-center">32</td>
            <td class="text-center">3</td>
            <td class="text-center">3</td>
            <td class="text-center">4</td>
            <td class="text-center">3</td>
            <td class="text-center">-</td>
            <td class="text-center">-</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- System Status -->
    <div class="status-section">
      <div class="status-item">LE Status During PM: <strong>-</strong></div>
      <div class="status-item">AC Status: <strong>-</strong></div>
      <div class="status-item">Review Photos: <strong class="underline">Click Here.</strong></div>
      <div class="status-item underline">Note: The ODD file number is BEFORE and EVEN file number is AFTER, PM</div>
    </div>

    <div class="footer">
      <div class="version">PM version 6.3</div>
    </div>
  `;
};

// Main PDF export function - Now uses ASCOMP style
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

  // Normalize report data structure to ensure inspectionSections is properly formatted
  const normalizedReport = {
    ...report,
    // Ensure inspectionSections exists and has the correct structure
    inspectionSections: report.inspectionSections || report.sections || {
      opticals: [],
      electronics: [],
      mechanical: [],
      serialNumberVerified: {},
      disposableConsumables: [],
      coolant: {},
      lightEngineTestPatterns: []
    },
    // Ensure signatures are accessible from multiple possible locations
    clientSignature: report.clientSignature || report.signatures?.customer || report.clientSignatureAndStamp?.signatureData || null,
    engineerSignature: report.engineerSignature || report.signatures?.engineer || report.engineerSignature?.signatureData || null,
    // Keep original signatures object for backward compatibility
    signatures: report.signatures || {
      customer: report.clientSignature || report.clientSignatureAndStamp?.signatureData || null,
      engineer: report.engineerSignature || report.engineerSignature?.signatureData || null
    }
  };

  // Log the normalized structure for debugging
  console.log('📊 Normalized report structure:', {
    hasInspectionSections: !!normalizedReport.inspectionSections,
    hasOpticals: !!normalizedReport.inspectionSections?.opticals,
    opticalsLength: normalizedReport.inspectionSections?.opticals?.length || 0,
    firstOptical: normalizedReport.inspectionSections?.opticals?.[0] || null,
    sampleOpticalData: normalizedReport.inspectionSections?.opticals?.[0] ? {
      description: normalizedReport.inspectionSections.opticals[0].description,
      status: normalizedReport.inspectionSections.opticals[0].status,
      result: normalizedReport.inspectionSections.opticals[0].result
    } : null,
    hasClientSignature: !!normalizedReport.clientSignature,
    hasEngineerSignature: !!normalizedReport.engineerSignature,
    clientSignatureType: normalizedReport.clientSignature ? normalizedReport.clientSignature.substring(0, 30) : null,
    engineerSignatureType: normalizedReport.engineerSignature ? normalizedReport.engineerSignature.substring(0, 30) : null
  });

  try {
    console.log('🔄 Generating ASCOMP style report...');
    await exportASCOMPStyleReport(normalizedReport);
    console.log('✅ ASCOMP style report generated successfully');
  } catch (error: any) {
    console.error('❌ ASCOMP style report generation failed:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Show user-friendly error message with options
    const userChoice = confirm(`ASCOMP style report generation failed: ${error?.message || 'Unknown error'}.\n\nWould you like to open a print-friendly HTML version instead?\n\nClick OK for HTML version, Cancel to try again.`);
    
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