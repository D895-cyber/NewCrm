// Import PDF generation libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
              margin: 20px 0 10px 0; 
              font-size: 14px;
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
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
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px 10px; 
              text-align: left;
              vertical-align: top;
            }
            th { 
              background: #f5f5f5; 
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            .section-title { 
              font-weight: bold; 
              margin: 20px 0 10px 0; 
              font-size: 14px;
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
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
export const exportServiceReportToPDF = async (report: any): Promise<void> => {
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

  // Check if required libraries are available
  if (typeof jsPDF === 'undefined' || typeof html2canvas === 'undefined') {
    console.error('❌ PDF libraries not available. jsPDF:', typeof jsPDF, 'html2canvas:', typeof html2canvas);
    alert('PDF generation libraries not loaded. Please refresh the page and try again.');
    return;
  }

  // Try PDF generation
  try {
    console.log('🔄 Attempting PDF export...');
    await generateAndDownloadPDF(report);
    console.log('✅ PDF export completed successfully');
  } catch (error) {
    console.error('❌ PDF export failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Show user-friendly error message with options
    const userChoice = confirm(`PDF generation failed: ${error.message || 'Unknown error'}.\n\nWould you like to open a print-friendly HTML version instead?\n\nClick OK for HTML version, Cancel to try again.`);
    
    if (userChoice) {
      // Fallback to HTML print version
      console.log('🔄 Opening HTML print version as fallback...');
      printHtml('ASCOMP Service Report', generateReportHTML(report));
    } else {
      throw error; // Re-throw to let calling code handle it
    }
  }
};

const generateAndDownloadPDF = async (report: any): Promise<void> => {
  console.log('🔄 Starting PDF generation...');

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

  // Generate comprehensive sections HTML
  const generateSectionsHTML = () => {
    const sections = [];
    
    // OPTICALS Section
    const opticals = safeAccess(report, ['sections', 'opticals']) || [];
    if (opticals.length > 0) {
      sections.push(...opticals.map((item: any, index: number) => `
        <tr>
          ${index === 0 ? `<td rowspan="${opticals.length}" class="section-cell">OPTICALS</td>` : ''}
          <td>${safe(item?.description)}</td>
          <td>${safe(item?.status)}</td>
          <td class="center status-ok">${safe(item?.result, 'OK')}</td>
        </tr>
      `));
    }
    
    // ELECTRONICS Section
    const electronics = safeAccess(report, ['sections', 'electronics']) || [];
    if (electronics.length > 0) {
      sections.push(...electronics.map((item: any, index: number) => `
        <tr>
          ${index === 0 ? `<td rowspan="${electronics.length}" class="section-cell">ELECTRONICS</td>` : ''}
          <td>${safe(item?.description)}</td>
          <td>${safe(item?.status)}</td>
          <td class="center status-ok">${safe(item?.result, 'OK')}</td>
        </tr>
      `));
    }
    
    // MECHANICAL Section
    const mechanical = safeAccess(report, ['sections', 'mechanical']) || [];
    if (mechanical.length > 0) {
      sections.push(...mechanical.map((item: any, index: number) => `
        <tr>
          ${index === 0 ? `<td rowspan="${mechanical.length}" class="section-cell">MECHANICAL</td>` : ''}
          <td>${safe(item?.description)}</td>
          <td>${safe(item?.status)}</td>
          <td class="center status-ok">${safe(item?.result, 'OK')}</td>
        </tr>
      `));
    }
    
    // Serial Number Verification
    const serialVerified = safeAccess(report, ['sections', 'serialNumberVerified']);
    if (serialVerified) {
      sections.push(`
        <tr>
          <td class="section-cell">Serial Number verified</td>
          <td>${safe(serialVerified.description, 'Chassis label vs Touch Panel')}</td>
          <td>${safe(serialVerified.status)}</td>
          <td class="center status-ok">${safe(serialVerified.result, 'OK')}</td>
        </tr>
      `);
    }
    
    // Disposable Consumables
    const disposableConsumables = safeAccess(report, ['sections', 'disposableConsumables']) || [];
    if (disposableConsumables.length > 0) {
      sections.push(...disposableConsumables.map((item: any) => `
        <tr>
          <td class="section-cell">Disposable Consumables</td>
          <td>${safe(item?.description)}</td>
          <td>${safe(item?.status)}</td>
          <td class="center status-ok">${safe(item?.result, 'OK')}</td>
        </tr>
      `));
    }
    
    // Coolant
    const coolant = safeAccess(report, ['sections', 'coolant']);
    if (coolant) {
      sections.push(`
        <tr>
          <td class="section-cell">Coolant</td>
          <td>${safe(coolant.description, 'Level and Color')}</td>
          <td>${safe(coolant.status)}</td>
          <td class="center status-ok">${safe(coolant.result, 'OK')}</td>
        </tr>
      `);
    }
    
    // Light Engine Test Patterns
    const lightEnginePatterns = safeAccess(report, ['sections', 'lightEngineTestPatterns']) || [];
    if (lightEnginePatterns.length > 0) {
      sections.push(...lightEnginePatterns.map((item: any, index: number) => `
        <tr>
          ${index === 0 ? `<td rowspan="${lightEnginePatterns.length}" class="section-cell">Light Engine Test Pattern</td>` : ''}
          <td>${safe(item?.color || item?.description)}</td>
          <td>${safe(item?.status)}</td>
          <td class="center status-ok">${safe(item?.result, 'OK')}</td>
        </tr>
      `));
    }
    
    return sections.join('');
  };

  console.log('Generated HTML components:', { mcgd, cie, observations });

  return generateReportHTML(report, mcgd, cie, observations, generateSectionsHTML);
};

const generateReportHTML = (report: any, mcgd: string, cie: string, observations: string, generateSectionsHTML: () => string) => {
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

  const body = generateReportHTML(report, mcgd, cie, observations, generateSectionsHTML);

  console.log('Generated HTML body length:', body.length);

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
  
  const htmlContent = `
    <style>
      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; }
      .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
      .company-info { flex: 1; }
      .company-logo { font-size: 24px; font-weight: bold; color: #0066cc; }
      .company-name { font-size: 18px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
      .website { font-weight: bold; color: #0066cc; }
      .right { text-align: right; }
      .small { font-size: 10px; }
      .report-title { 
        font-size: 24px; 
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
        margin-bottom: 20px; 
        font-size: 12px; 
      }
      th, td { 
        border: 1px solid #000; 
        padding: 8px 10px; 
        text-align: left; 
        vertical-align: top; 
      }
      th { 
        background: #f5f5f5; 
        font-weight: bold; 
        text-align: center; 
        font-size: 11px; 
      }
      .section-title { 
        font-weight: bold; 
        margin: 20px 0 10px 0; 
        font-size: 14px; 
        color: #000; 
        border-bottom: 2px solid #000; 
        padding-bottom: 5px; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
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
        margin-bottom: 10px; 
      }
      .compact-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 15px; 
        font-size: 11px; 
      }
      .compact-table th, .compact-table td { 
        border: 1px solid #000; 
        padding: 6px 8px; 
        text-align: left; 
        vertical-align: top; 
      }
      .compact-table th { 
        background: #f5f5f5; 
        font-weight: bold; 
        text-align: center; 
        font-size: 10px; 
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .indent { margin-left: 20px; }
      .status-ok { color: #008000; font-weight: bold; }
      .muted { color: #666; font-style: italic; }
      .status-footer { 
        margin-top: 30px; 
        padding: 15px; 
        background: #f0f0f0; 
        border: 1px solid #ccc; 
      }
      .status-item { 
        margin: 5px 0; 
        font-size: 11px; 
      }
      .note { 
        margin-top: 10px; 
        font-size: 10px; 
        font-style: italic; 
        color: #666; 
      }
      .small { font-size: 10px; }
      .section-cell { 
        background: #e9e9e9; 
        font-weight: bold; 
        text-align: center; 
      }
    </style>
    ${body}
  `;
  
  tempContainer.innerHTML = htmlContent;
  document.body.appendChild(tempContainer);
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
        ${generateSectionsHTML()}
      </tbody>
    </table>

    <div class="grid">
      <div>
        <div class="section-title">VOLTAGE PARAMETERS</div>
        <table class="compact-table">
          <tbody>
            <tr><td>P vs N</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'pVsN']))}</td></tr>
            <tr><td>P vs E</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'pVsE']))}</td></tr>
            <tr><td>N vs E</td><td class="right measurement">${safe(safeAccess(report, ['voltageParameters', 'nVsE']))}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">CONTENT PLAYING SERVER</div>
        <table class="compact-table"><tbody><tr><td>${safe(safeAccess(report, ['contentPlayingServer']))}</td></tr></tbody></table>
        
        <div class="section-title">FL ON 100% LAMP POWER BEFORE AND AFTER</div>
        <table class="compact-table">
          <tbody>
            <tr><td>Before</td><td class="right measurement">${safe(safeAccess(report, ['lampPowerMeasurements', 'flBeforePM']))}</td></tr>
            <tr><td>After</td><td class="right measurement">${safe(safeAccess(report, ['lampPowerMeasurements', 'flAfterPM']))}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">PROJECTOR PLACEMENT, ROOM, ENVIRONMENT</div>
        <table class="compact-table"><tbody><tr><td>${safe(safeAccess(report, ['environmentStatus', 'projectorPlacement']), 'ok')}</td></tr></tbody></table>
        
        <div class="section-title">OBSERVATIONS AND REMARKS</div>
        <table class="compact-table">
          <thead><tr><th class="small">#</th><th>Observation</th></tr></thead>
          <tbody>${observations}</tbody>
        </table>
      </div>
      
      <div>
        <div class="section-title">IMAGE EVALUATION</div>
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
        <div class="section-title">WORK PERFORMED</div>
        <table class="compact-table">
          <tbody>
            <tr><td>${safe(safeAccess(report, ['workPerformed']), 'Standard maintenance performed')}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">ISSUES FOUND</div>
        <table class="compact-table">
          <tbody>
            ${(safeAccess(report, ['issuesFound']) || ['No issues found']).map((issue: any) => 
              `<tr><td>${typeof issue === 'string' ? issue : safe(issue?.description)}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        
        <div class="section-title">PARTS USED</div>
        <table class="compact-table">
          <tbody>
            ${(safeAccess(report, ['partsUsed']) || ['No parts used']).map((part: any) => 
              `<tr><td>${typeof part === 'string' ? part : safe(part?.partName)}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        
        <div class="section-title">RECOMMENDATIONS</div>
        <table class="compact-table">
          <tbody>
            <tr><td>${safe(safeAccess(report, ['recommendations']), 'No specific recommendations')}</td></tr>
          </tbody>
        </table>
      </div>
      
      <div>
        <div class="section-title">MEASURED COLOR COORDINATES (MCGD)</div>
        <table class="compact-table">
          <thead><tr><th>Test Pattern</th><th class="right">fL</th><th class="right">x</th><th class="right">y</th></tr></thead>
          <tbody>${mcgd || '<tr><td colspan="4" class="center muted">No color measurements recorded</td></tr>'}</tbody>
        </table>

        <div class="section-title">CIE XYZ COLOR ACCURACY</div>
        <table class="compact-table">
          <thead><tr><th>Test Pattern</th><th class="right">x</th><th class="right">y</th><th class="right">fL</th></tr></thead>
          <tbody>${cie || '<tr><td colspan="4" class="center muted">No CIE measurements recorded</td></tr>'}</tbody>
        </table>

        <div class="section-title">SCREEN INFORMATION IN METRES</div>
        <table class="compact-table">
          <thead><tr><th></th><th>Height</th><th>Width</th><th>Gain</th></tr></thead>
          <tbody>
            <tr><td>SCOPE</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'height']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'width']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'scope', 'gain']))}</td></tr>
            <tr><td>FLAT</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'height']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'width']))}</td><td class="right">${safe(safeAccess(report, ['screenInfo', 'flat', 'gain']))}</td></tr>
            <tr><td>Screen Make</td><td colspan="2">${safe(safeAccess(report, ['screenInfo', 'screenMake']))}</td><td class="right">Throw Distance ${safe(safeAccess(report, ['screenInfo', 'throwDistance']))}</td></tr>
          </tbody>
        </table>
        
        <div class="section-title">RECOMMENDED PARTS TO CHANGE</div>
        <table class="compact-table">
          <thead><tr><th class="small">S. No.</th><th>Part Name</th><th>Part Number</th><th class="small">Qty</th><th>Notes</th></tr></thead>
          <tbody>
            ${(safeAccess(report, ['sections', 'recommendedParts']) || safeAccess(report, ['recommendedParts']) || new Array(6).fill({})).slice(0,6).map((r:any,idx:number)=>
              `<tr><td class="small center">${idx+1}</td><td>${safe(r?.partName)}</td><td>${safe(r?.partNumber)}</td><td class="small center">${safe(r?.quantity, '1')}</td><td>${safe(r?.notes)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-title">AIR POLLUTION LEVEL</div>
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
        <strong>Photos Taken:</strong> ${safeAccess(report, ['photos']) ? safeAccess(report, ['photos']).length : 0} photos
      </div>
      <div class="status-item">
        <strong>Service Start Time:</strong> ${safeAccess(report, ['serviceStartTime']) ? new Date(safeAccess(report, ['serviceStartTime'])).toLocaleString() : 'Not recorded'}
      </div>
      <div class="status-item">
        <strong>Service End Time:</strong> ${safeAccess(report, ['serviceEndTime']) ? new Date(safeAccess(report, ['serviceEndTime'])).toLocaleString() : 'Not recorded'}
      </div>
      <div class="status-item">
        <strong>Engineer Signature:</strong> ${safeAccess(report, ['signatures', 'engineer', 'name']) ? 'Signed by ' + safeAccess(report, ['signatures', 'engineer', 'name']) : 'Not signed'}
      </div>
      <div class="status-item">
        <strong>Customer Signature:</strong> ${safeAccess(report, ['signatures', 'customer', 'name']) ? 'Signed by ' + safeAccess(report, ['signatures', 'customer', 'name']) : 'Not signed'}
      </div>
      <div class="note">
        <strong>Note:</strong> The ODD file number is BEFORE and EVEN file number is AFTER, PM
      </div>
    </div>
  `;

  console.log('Generated HTML body length:', body.length);

  try {
    // Create a temporary container for the HTML content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          margin: 0; 
          padding: 0; 
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
          margin-bottom: 20px;
          font-size: 12px;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px 10px; 
          text-align: left;
          vertical-align: top;
        }
        th { 
          background: #f5f5f5; 
          font-weight: bold;
          text-align: center;
          font-size: 11px;
        }
        .section-title { 
          font-weight: bold; 
          margin: 20px 0 10px 0; 
          font-size: 14px;
          color: #000;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
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
      </style>
      <div class="page">
        ${body}
      </div>
    `;
    
    // Hide the container from view
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    // Wait a bit for the DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas
    console.log('🔄 Converting HTML to canvas...');
    console.log('Temp container HTML:', tempContainer.innerHTML.substring(0, 500) + '...');
    
    const canvas = await html2canvas(tempContainer, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
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

    console.log('Image dimensions:', imgWidth, 'x', imgHeight, 'mm');
    console.log('Height left:', heightLeft);

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const reportNumber = safe(report.reportNumber, 'Unknown');
    const filename = `ASCOMP_Report_${reportNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    console.log('🔄 Downloading PDF with filename:', filename);
    
    try {
      pdf.save(filename);
      console.log('✅ PDF generation and download completed successfully');
    } catch (downloadError) {
      console.error('❌ PDF download failed:', downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message || 'Unknown download error'}`);
    }
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error; // Re-throw to trigger fallback
  }
};

const exportAsText = (report: any): void => {
  console.log('📄 Creating text export...');
  
  const safe = (v: any, fallback: string = '-') => (v == null || v === '' ? fallback : String(v));
  const fmtDate = (d: any) => {
    try { return new Date(d || Date.now()).toLocaleDateString(); } catch { return safe(d); }
  };

  const textContent = `
ASCOMP INC. SERVICE REPORT
==========================

Report Number: ${safe(report.reportNumber)}
Report Type: ${safe(report.reportType)}
Date: ${fmtDate(report.date)}
Site: ${safe(report.siteName)}
Engineer: ${safe(report.engineer?.name)}

PROJECTOR INFORMATION
=====================
Model: ${safe(report.projectorModel)}
Serial Number: ${safe(report.projectorSerial)}
Software Version: ${safe(report.softwareVersion)}
Running Hours: ${safe(report.projectorRunningHours)}

LAMP INFORMATION
================
Model: ${safe(report.lampModel)}
Running Hours: ${safe(report.lampRunningHours)}

SERVICE DETAILS
===============
${safe(report.sections?.observations?.join('\n') || 'No observations recorded')}

Generated on: ${new Date().toLocaleString()}
  `.trim();

  // Create and download text file
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ASCOMP_Report_${safe(report.reportNumber)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Text export completed successfully');
  alert('Report exported as text file successfully!');
};

export const exportToExcel = (data: any[], filename: string): void => {
  // Convert to CSV for now (Excel can open CSV files)
  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, filename.replace('.xlsx', '.csv'));
}; 