// Export utility functions
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string): void => {
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

export const downloadPDF = (pdfContent: string, filename: string): void => {
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePDF = async (data: any, type: string): Promise<string> => {
  // Simple PDF generation using jsPDF
  // In a real app, you'd use a proper PDF library
  const pdfContent = `
    PDF Content for ${type}
    Generated on: ${new Date().toLocaleDateString()}
    Data: ${JSON.stringify(data, null, 2)}
  `;
  return pdfContent;
};

export const generateLabel = (data: any, type: 'part' | 'rma'): string => {
  const labelContent = `
    ${type.toUpperCase()} LABEL
    ID: ${data.id || data.serialNumber || data.rmaNumber}
    Date: ${new Date().toLocaleDateString()}
    ${type === 'part' ? `Part: ${data.partName}` : `RMA: ${data.rmaNumber}`}
  `;
  return labelContent;
};

export const printLabel = (labelContent: string): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .label { border: 2px solid #000; padding: 10px; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="label">
            <pre>${labelContent}</pre>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

// Generic helper to open a print window with provided HTML body
export const printHtml = (title: string, bodyHtml: string): void => {
  try {
    // Try to open a new window
    const w = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (!w) {
      // Fallback: try to create a new tab
      const link = document.createElement('a');
      link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: Arial, Helvetica, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #000; 
                background: white;
                font-size: 12px;
                line-height: 1.4;
              }
              .page { 
                width: 210mm; 
                min-height: 297mm; 
                margin: 0 auto; 
                background: white;
                padding: 15mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                margin-bottom: 15px;
                border-bottom: 2px solid #0066cc;
                padding-bottom: 10px;
              }
              .company-logo {
                color: #0066cc;
                font-weight: bold;
                font-size: 24px;
                margin-bottom: 5px;
                text-align: center;
                width: 40px;
                height: 40px;
                line-height: 40px;
                border: 2px solid #0066cc;
                border-radius: 50%;
                display: inline-block;
              }
              .company-name {
                color: #0066cc;
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 5px;
              }
              .company-info { 
                font-size: 10px; 
                line-height: 1.3;
                color: #333;
              }
              .website {
                text-decoration: underline;
                font-weight: bold;
                color: #0066cc;
              }
              .report-title { 
                font-size: 28px; 
                font-weight: bold;
                text-align: center;
                margin: 15px 0;
                color: #0066cc;
                font-family: 'Times New Roman', serif;
                letter-spacing: 2px;
              }
              .subtitle {
                font-size: 14px;
                text-align: center;
                margin-bottom: 20px;
                color: #333;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 15px;
                font-size: 11px;
              }
              th, td { 
                border: 1px solid #000; 
                padding: 6px 8px; 
                text-align: left;
                vertical-align: top;
              }
              th { 
                background: #f0f0f0; 
                font-weight: bold;
                text-align: center;
              }
              .section-title { 
                font-weight: bold; 
                margin: 15px 0 8px 0; 
                font-size: 13px;
                color: #0066cc;
                border-bottom: 1px  solid #0066cc;
                padding-bottom: 3px;
                text-transform: uppercase;
              }
              .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px;
                margin-bottom: 15px;
              }
              .info-box {
                border: 1px solid #ccc;
                padding: 10px;
                background: #f9f9f9;
              }
              .indent {
                margin-left: 15px;
                margin-bottom: 3px;
              }
              .small { font-size: 10px; }
              .right { text-align: right; }
              .center { text-align: center; }
              .muted { color: #666; }
              .bold { font-weight: bold; }
              .highlight { background: #fff3cd; }
              .status-ok { color: #28a745; font-weight: bold; }
              .status-replace { color: #dc3545; font-weight: bold; }
              .measurement { font-family: 'Courier New', monospace; }
              .main-table { margin-bottom: 20px; }
              .compact-table { margin-bottom: 15px; }
              .section-cell { 
                background: #f0f0f0; 
                font-weight: bold; 
                text-align: center;
                vertical-align: middle;
              }
              .status-footer {
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #ccc;
                background: #f9f9f9;
              }
              .status-item {
                margin-bottom: 8px;
              }
              .note {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
                font-style: italic;
              }
              .link {
                color: #0066cc;
                text-decoration: underline;
                cursor: pointer;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .page { 
                  width: 210mm; 
                  height: 297mm; 
                  margin: 0; 
                  padding: 15mm;
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">${bodyHtml}</div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      link.download = `${title}.html`;
      link.click();
      return;
    }

    // Write content to the new window
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #000; 
              background: white;
              font-size: 12px;
              line-height: 1.4;
            }
            .page { 
              width: 210mm; 
              min-height: 297mm; 
              margin: 0 auto; 
              background: white;
              padding: 15mm;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 15px;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 10px;
            }
            .company-logo {
              color: #0066cc;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 5px;
              text-align: center;
              width: 40px;
              height: 40px;
              line-height: 40px;
              border: 2px solid #0066cc;
              border-radius: 50%;
              display: inline-block;
            }
            .company-name {
              color: #0066cc;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .company-info { 
              font-size: 10px; 
              line-height: 1.3;
              color: #333;
            }
            .website {
              text-decoration: underline;
              font-weight: bold;
              color: #0066cc;
            }
            .report-title { 
              font-size: 28px; 
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
              color: #0066cc;
              font-family: 'Times New Roman', serif;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 14px;
              text-align: center;
              margin-bottom: 20px;
              color: #333;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 6px 8px; 
              text-align: left;
              vertical-align: top;
            }
            th { 
              background: #f0f0f0; 
              font-weight: bold;
              text-align: center;
            }
            .section-title { 
              font-weight: bold; 
              margin: 15px 0 8px 0; 
              font-size: 13px;
              color: #0066cc;
              border-bottom: 1px solid #0066cc;
              padding-bottom: 3px;
              text-transform: uppercase;
            }
            .grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px;
              margin-bottom: 15px;
            }
            .info-box {
              border: 1px solid #ccc;
              padding: 10px;
              background: #f9f9f9;
            }
            .indent {
              margin-left: 15px;
              margin-bottom: 3px;
            }
            .small { font-size: 10px; }
            .right { text-align: right; }
            .center { text-align: center; }
            .muted { color: #666; }
            .bold { font-weight: bold; }
            .highlight { background: #fff3cd; }
            .status-ok { color: #28a745; font-weight: bold; }
            .status-replace { color: #dc3545; font-weight: bold; }
            .measurement { font-family: 'Courier New', monospace; }
            .main-table { margin-bottom: 20px; }
            .compact-table { margin-bottom: 15px; }
            .section-cell { 
              background: #f0f0f0; 
              font-weight: bold; 
              text-align: center;
              vertical-align: middle;
            }
            .status-footer {
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #ccc;
              background: #f9f9f9;
            }
            .status-item {
              margin-bottom: 8px;
            }
            .note {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              font-style: italic;
            }
            .link {
              color: #0066cc;
              text-decoration: underline;
              cursor: pointer;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .page { 
                width: 210mm; 
                height: 297mm; 
                margin: 0; 
                padding: 15mm;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">${bodyHtml}</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    w.document.close();
  } catch (error) {
    console.error('Error in printHtml:', error);
    // Fallback: create a downloadable HTML file
    const blob = new Blob([`
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

// Build a PDF-like printable HTML for the ASCOMP service report
export const exportServiceReportToPDF = (report: any): void => {
  // Add comprehensive error handling and debugging
  console.log('exportServiceReportToPDF called with report:', report);
  
  if (!report) {
    console.error('exportServiceReportToPDF: Report is undefined or null');
    alert('Error: No report data available for PDF generation');
    return;
  }

  // Validate report structure
  if (typeof report !== 'object') {
    console.error('exportServiceReportToPDF: Report is not an object:', report);
    alert('Error: Invalid report data format');
    return;
  }

  // Log the structure of the report for debugging
  console.log('Report structure:', {
    hasEngineer: !!report.engineer,
    engineerKeys: report.engineer ? Object.keys(report.engineer) : 'No engineer object',
    hasSiteIncharge: !!report.siteIncharge,
    siteInchargeKeys: report.siteIncharge ? Object.keys(report.siteIncharge) : 'No siteIncharge object',
    hasSections: !!report.sections,
    sectionsKeys: report.sections ? Object.keys(report.sections) : 'No sections object',
    reportKeys: Object.keys(report)
  });

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

  // Safely get engineer name with multiple fallback paths
  const getEngineerName = (report: any): string => {
    try {
      console.log('Getting engineer name from report:', {
        engineer: report.engineer,
        engineerName: report.engineerName,
        technician: report.technician,
        technicianName: report.technicianName,
        fse: report.fse,
        fseName: report.fseName
      });
      
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
      console.log('Getting site incharge name from report:', {
        siteIncharge: report.siteIncharge,
        siteInchargeName: report.siteInchargeName,
        contactPerson: report.contactPerson,
        contactName: report.contactName
      });
      
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

  console.log('Generated helper values:', {
    engineerName: getEngineerName(report),
    siteInchargeName: getSiteInchargeName(report),
    siteInchargePhone: getSiteInchargePhone(report)
  });

  const mcgd = (safeAccess(report, ['measuredColorCoordinates']) || []).map((m: any) => `
    <tr>
      <td>${safe(m?.testPattern)}</td>
      <td class="right">${safe(m?.fl)}</td>
      <td class="right">${safe(m?.x)}</td>
      <td class="right">${safe(m?.y)}</td>
    </tr>
  `).join('');

  const cie = (safeAccess(report, ['cieColorAccuracy']) || []).map((m: any) => `
    <tr>
      <td>${safe(m?.testPattern)}</td>
      <td class="right">${safe(m?.x)}</td>
      <td class="right">${safe(m?.y)}</td>
      <td class="right">${safe(m?.fl)}</td>
    </tr>
  `).join('');

  const observations = (safeAccess(report, ['observations']) || []).map((o: any) => `<tr><td class="small center">${safe(o?.number)}</td><td>${safe(o?.description)}</td></tr>`).join('');

  console.log('Generated HTML components:', { mcgd, cie, observations });

  const body = `
    <div class="header">
      <div class="company-info">
        <div class="company-logo">A</div>
        <div class="company-name">ASCOMP INC.</div>
        <div>9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064</div>
        <div>Desk: 011-45501226</div>
        <div>Mobile: 8882475207</div>
        <div class="website">WWW.ASCOMPINC.IN</div>
        <div>Email: helpdesk@ascompinc.in</div>
      </div>
      <div class="right small">
        <div><strong>Report:</strong> ${safe(safeAccess(report, ['reportNumber']))}</div>
        <div><strong>Type:</strong> ${safe(safeAccess(report, ['reportType']))}</div>
        <div><strong>Date:</strong> ${fmtDate(safeAccess(report, ['date']))}</div>
      </div>
    </div>
    
    <div class="report-title">CHRISTIE</div>
    <div class="subtitle">Projector Service Report - ${safe(safeAccess(report, ['reportType']))} done on Date - ${fmtDate(safeAccess(report, ['date']))}</div>
    
    <div class="grid">
      <div class="info-box">
        <div><strong>Site:</strong> ${safe(safeAccess(report, ['siteName']))}</div>
        <div><strong>Personnel:</strong></div>
        <div class="indent">Site In-charge: Mr. ${getSiteInchargeName(report)} - ${getSiteInchargePhone(report)}</div>
        <div class="indent">Ascomp Engineer: ${getEngineerName(report)}</div>
      </div>
      <div class="info-box">
        <div><strong>Projector Information:</strong></div>
        <div class="indent">Model: ${safe(safeAccess(report, ['projectorModel']))}</div>
        <div class="indent">Serial Number: ${safe(safeAccess(report, ['projectorSerial']))}</div>
        <div class="indent">Software Version: ${safe(safeAccess(report, ['softwareVersion']))}</div>
        <div class="indent">Projector running hours: ${safe(safeAccess(report, ['projectorRunningHours']))}</div>
        <div><strong>Lamp Information:</strong></div>
        <div class="indent">Lamp Model: ${safe(safeAccess(report, ['lampModel']))}</div>
        <div class="indent">Lamp running hours: ${safe(safeAccess(report, ['lampRunningHours']))}</div>
        <div class="indent">Current Lamp Hours: ${safe(safeAccess(report, ['currentLampHours']))}</div>
        <div class="indent">Replacement Required: ${safeAccess(report, ['replacementRequired']) ? 'Yes' : 'No'}</div>
      </div>
    </div>

    <div class="section-title">SECTIONS</div>
    <table class="main-table">
      <thead>
        <tr>
          <th>SECTIONS</th>
          <th>DESCRIPTION</th>
          <th>STATUS</th>
          <th class="center">YES/NO - OK</th>
        </tr>
      </thead>
      <tbody>
        ${(safeAccess(report, ['sections', 'opticals']) || []).map((item: any, index: number) => `
          <tr>
            ${index === 0 ? `<td rowspan="${(safeAccess(report, ['sections', 'opticals']) || []).length}" class="section-cell">OPTICALS</td>` : ''}
            <td>${safe(item?.description)}</td>
            <td>${safe(item?.status)}</td>
            <td class="center status-ok">OK</td>
          </tr>
        `).join('')}
        ${(safeAccess(report, ['sections', 'electronics']) || []).map((item: any, index: number) => `
          <tr>
            ${index === 0 ? `<td rowspan="${(safeAccess(report, ['sections', 'electronics']) || []).length}" class="section-cell">ELECTRONICS</td>` : ''}
            <td>${safe(item?.description)}</td>
            <td>${safe(item?.status)}</td>
            <td class="center status-ok">OK</td>
          </tr>
        `).join('')}
        ${safeAccess(report, ['sections', 'serialNumberVerified']) ? `
          <tr>
            <td class="section-cell">Serial Number verified</td>
            <td>${safe(safeAccess(report, ['sections', 'serialNumberVerified', 'description']))}</td>
            <td>${safe(safeAccess(report, ['sections', 'serialNumberVerified', 'status']))}</td>
            <td class="center status-ok">OK</td>
          </tr>
        ` : ''}
        ${(safeAccess(report, ['sections', 'disposableConsumables']) || []).map((item: any) => `
          <tr>
            <td class="section-cell">Disposable Consumables</td>
            <td>${safe(item?.description)}</td>
            <td>${safe(item?.status)}</td>
            <td class="center status-ok">OK</td>
          </tr>
        `).join('')}
        ${safeAccess(report, ['sections', 'coolant']) ? `
          <tr>
            <td class="section-cell">Coolant</td>
            <td>${safe(safeAccess(report, ['sections', 'coolant', 'description']))}</td>
            <td>${safe(safeAccess(report, ['sections', 'coolant', 'status']))}</td>
            <td class="center status-ok">OK</td>
          </tr>
        ` : ''}
        ${(safeAccess(report, ['sections', 'lightEngineTestPatterns']) || []).map((item: any, index: number) => `
          <tr>
            ${index === 0 ? `<td rowspan="${(safeAccess(report, ['sections', 'lightEngineTestPatterns']) || []).length}" class="section-cell">Light Engine Test Pattern</td>` : ''}
            <td>${safe(item?.description)}</td>
            <td>${safe(item?.status)}</td>
            <td class="center status-ok">OK</td>
          </tr>
        `).join('')}
        ${(safeAccess(report, ['sections', 'mechanical']) || []).map((item: any, index: number) => `
          <tr>
            ${index === 0 ? `<td rowspan="${(safeAccess(report, ['sections', 'mechanical']) || []).length}" class="section-cell">MECHANICAL</td>` : ''}
            <td>${safe(item?.description)}</td>
            <td>${safe(item?.status)}</td>
            <td class="center status-ok">OK</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="grid">
      <div>
        <div class="section-title">Voltage parameters</div>
        <table class="compact-table">
          <tbody>
            <tr><td>P vs N</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'pVsN']))}</td></tr>
            <tr><td>P vs E</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'pVsE']))}</td></tr>
            <tr><td>N vs E</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'nVsE']))}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">Content Playing Server</div>
        <table class="compact-table"><tbody><tr><td>${safe(safeAccess(report, ['contentPlayingServer']))}</td></tr></tbody></table>
        
        <div class="section-title">fL on 100% lamp power before and after</div>
        <table class="compact-table">
          <tbody>
            <tr><td>Before</td><td class="right measurement">${safe(safeAccess(report, ['lampPowerMeasurements', 'flBeforePM']))}</td></tr>
            <tr><td>After</td><td class="right measurement">${safe(safeAccess(report, ['lampPowerMeasurements', 'flAfterPM']))}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">Projector placement, room, environment</div>
        <table class="compact-table"><tbody><tr><td>${safe(safeAccess(report, ['environmentStatus', 'projectorPlacement']), 'ok')}</td></tr></tbody></table>
        
        <div class="section-title">Observations and Remarks</div>
        <table class="compact-table">
          <thead><tr><th class="small">#</th><th>Observation</th></tr></thead>
          <tbody>${observations}</tbody>
        </table>
      </div>
      
      <div>
        <div class="section-title">Image Evaluation</div>
        <table class="compact-table">
          <thead><tr><th>Image Evaluation</th><th class="center">OK - Yes/No</th></tr></thead>
          <tbody>
            <tr><td>Focus/boresight</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'focusBoresight']), 'Yes')}</td></tr>
            <tr><td>Integrator Position</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'integratorPosition']), 'Yes')}</td></tr>
            <tr><td>Any Spot on the Screen after PPM</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'spotOnScreen']), 'No')}</td></tr>
            <tr><td>Check Screen Cropping - FLAT and SCOPE</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'screenCropping']), 'Yes')}</td></tr>
            <tr><td>Convergence Checked</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'convergenceChecked']), 'Yes')}</td></tr>
            <tr><td>Channels Checked - Scope, Flat, Alternative</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'channelsChecked']), 'Yes')}</td></tr>
            <tr><td>Pixel defects</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'pixelDefects']), 'No')}</td></tr>
            <tr><td>Excessive image vibration</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'imageVibration']), 'No')}</td></tr>
            <tr><td>LiteLOC</td><td class="center">${safe(safeAccess(report, ['imageEvaluation', 'liteLoc']), 'No')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">Recommended Parts to Change</div>
        <table class="compact-table">
          <thead><tr><th class="small">S. No.</th><th>Part Name</th><th>Part Number</th><th class="small">Qty</th><th>Notes</th></tr></thead>
          <tbody>
            ${(safeAccess(report, ['sections', 'recommendedParts']) || new Array(6).fill({})).slice(0,6).map((r:any,idx:number)=>
              `<tr><td class="small center">${idx+1}</td><td>${safe(r?.partName)}</td><td>${safe(r?.partNumber)}</td><td class="small center">${safe(r?.quantity, '1')}</td><td>${safe(r?.notes)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      
      <div>
        <div class="section-title">Measured color coordinates (MCGD)</div>
        <table class="compact-table">
          <thead><tr><th>Test Pattern</th><th class="right">fL</th><th class="right">x</th><th class="right">y</th></tr></thead>
          <tbody>${mcgd}</tbody>
        </table>

        <div class="section-title">CIE XYZ Color Accuracy</div>
        <table class="compact-table">
          <thead><tr><th>Test Pattern</th><th class="right">x</th><th class="right">y</th><th class="right">fL</th></tr></thead>
          <tbody>${cie}</tbody>
        </table>

        <div class="section-title">Screen Information in metres</div>
        <table class="compact-table">
          <thead><tr><th></th><th>Height</th><th>Width</th><th>Gain</th></tr></thead>
          <tbody>
            <tr><td>SCOPE</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'height']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'width']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'gain']))}</td></tr>
            <tr><td>FLAT</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'height']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'width']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'gain']))}</td></tr>
            <tr><td>Screen Make</td><td colspan="2">${safe(safeAccess(report, ['screenInfo', 'screenMake']))}</td><td class="right">Throw Distance ${safe(safeAccess(report, ['screenInfo', 'throwDistance']))}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-title">Air Pollution Level</div>
    <table class="compact-table">
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
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'overall']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'hcho']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'tvoc']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'pm1']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'pm25']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'pm10']))}</td>
          <td class="right">${safe(safeAccess(report, ['environmentalConditions', 'temperature']))}</td>
          <td class="right">${safe(safeAccess(report, ['airPollutionLevel', 'humidity']))}</td>
        </tr>
      </tbody>
    </table>

    <div class="status-footer">
      <div class="status-item">
        <strong>LE Status During PM:</strong> ${safe(safeAccess(report, ['systemStatus', 'leStatus']))}
      </div>
      <div class="status-item">
        <strong>AC Status:</strong> ${safe(safeAccess(report, ['systemStatus', 'acStatus']))}
      </div>
      <div class="status-item">
        <strong>Review Photos:</strong> <span class="link">Click Here.</span>
      </div>
      <div class="note">
        <strong>Note:</strong> The ODD file number is BEFORE and EVEN file number is AFTER, PM
      </div>
    </div>
  `;

  console.log('Generated HTML body length:', body.length);

  try {
    printHtml('Service Report', body);
    console.log('PDF generation completed successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again or contact support.');
  }
};

export const exportToExcel = (data: any[], filename: string): void => {
  // Convert to CSV for now (Excel can open CSV files)
  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, filename.replace('.xlsx', '.csv'));
}; 