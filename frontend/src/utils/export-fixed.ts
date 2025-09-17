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

// Simple text export as fallback
const exportAsText = (report: any): void => {
  console.log('📄 Exporting as text fallback...');
  
  const safe = (v: any, fallback: string = '-') => (v == null || v === '' ? fallback : String(v));
  const fmtDate = (d: any) => {
    try { return new Date(d || Date.now()).toLocaleDateString(); } catch { return safe(d); }
  };

  const textContent = `
ASCOMP INC. - CHRISTIE PROJECTOR SERVICE REPORT
===============================================

Report Number: ${safe(report.reportNumber)}
Report Type: ${safe(report.reportType)}
Date: ${fmtDate(report.date)}

SITE INFORMATION
----------------
Site Name: ${safe(report.siteName)}
Engineer: ${safe(report.engineer?.name || report.engineerName)}
Site Contact: ${safe(report.siteIncharge?.name || report.siteInchargeName)}
Contact Phone: ${safe(report.siteIncharge?.phone || report.siteInchargePhone)}

PROJECTOR INFORMATION
--------------------
Model: ${safe(report.projectorModel)}
Serial Number: ${safe(report.projectorSerial)}
Software Version: ${safe(report.softwareVersion)}
Projector Running Hours: ${safe(report.projectorRunningHours)}

LAMP INFORMATION
---------------
Lamp Model: ${safe(report.lampModel)}
Lamp Running Hours: ${safe(report.lampRunningHours)}
Current Lamp Hours: ${safe(report.currentLampHours)}
Replacement Required: ${report.replacementRequired ? 'Yes' : 'No'}

SERVICE DETAILS
--------------
Work Performed: ${safe(report.workPerformed, 'Standard maintenance performed')}

Issues Found:
${(report.issuesFound || ['No issues found']).map((issue: any) => 
  `- ${typeof issue === 'string' ? issue : safe(issue?.description)}`
).join('\n')}

Parts Used:
${(report.partsUsed || ['No parts used']).map((part: any) => 
  `- ${typeof part === 'string' ? part : safe(part?.partName)}`
).join('\n')}

Recommendations: ${safe(report.recommendations, 'No specific recommendations')}

TECHNICAL MEASUREMENTS
---------------------
Voltage Parameters:
${report.voltageParameters ? Object.entries(report.voltageParameters).map(([key, value]) => 
  `${key}: ${safe(value)}V`
).join('\n') : 'No voltage measurements recorded'}

Lamp Power Measurements:
${report.lampPowerMeasurements ? Object.entries(report.lampPowerMeasurements).map(([key, value]) => 
  `${key}: ${safe(value)}W`
).join('\n') : 'No lamp power measurements recorded'}

ENVIRONMENTAL CONDITIONS
-----------------------
Temperature: ${safe(report.environmentalConditions?.temperature)}°C
Humidity: ${safe(report.environmentalConditions?.humidity)}%
Air Pollution Level: ${safe(report.airPollutionLevel?.overall)}

SYSTEM STATUS
------------
LE Status During PM: ${safe(report.systemStatus?.leStatus)}
AC Status: ${safe(report.systemStatus?.acStatus)}

SIGNATURES
----------
Engineer Signature: ${report.signatures?.engineer?.name ? 'Signed by ' + report.signatures.engineer.name : 'Not signed'}
Customer Signature: ${report.signatures?.customer?.name ? 'Signed by ' + report.signatures.customer.name : 'Not signed'}

SERVICE TIMING
--------------
Service Start Time: ${report.serviceStartTime ? new Date(report.serviceStartTime).toLocaleString() : 'Not recorded'}
Service End Time: ${report.serviceEndTime ? new Date(report.serviceEndTime).toLocaleString() : 'Not recorded'}

PHOTOS
------
Photos Taken: ${report.photos ? report.photos.length : 0} photos

===============================================
Generated on: ${new Date().toLocaleString()}
ASCOMP INC. - 9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, 110064
Desk: 011-45501226 | Mobile: 8882475207 | Email: helpdesk@ascompinc.in
WWW.ASCOMPINC.IN
  `;

  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ASCOMP_Report_${safe(report.reportNumber)}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .company-info { flex: 1; }
        .company-logo { font-size: 24px; font-weight: bold; color: #0066cc; }
        .company-name { font-size: 18px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        .website { font-weight: bold; color: #0066cc; }
        .right { text-align: right; }
        .small { font-size: 10px; }
        .report-title { font-size: 24px; font-weight: bold; text-align: center; margin: 15px 0; color: #0066cc; font-family: 'Times New Roman', serif; letter-spacing: 2px; }
        .subtitle { font-size: 14px; text-align: center; margin-bottom: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 8px 10px; text-align: left; vertical-align: top; }
        th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 11px; }
        .section-title { font-weight: bold; margin: 20px 0 10px 0; font-size: 14px; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .info-box { border: 1px solid #ccc; padding: 10px; background: #f9f9f9; margin-bottom: 10px; }
        .compact-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
        .compact-table th, .compact-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
        .compact-table th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .indent { margin-left: 20px; }
        .status-ok { color: #008000; font-weight: bold; }
        .muted { color: #666; font-style: italic; }
        .status-footer { margin-top: 30px; padding: 15px; background: #f0f0f0; border: 1px solid #ccc; }
        .status-item { margin: 5px 0; font-size: 11px; }
        .note { margin-top: 10px; font-size: 10px; font-style: italic; color: #666; }
        .small { font-size: 10px; }
        .section-cell { background: #e9e9e9; font-weight: bold; text-align: center; }
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

  return `
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

    <div class="status-footer">
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
      const htmlContent = generateReportHTML(report);
      printHtml('ASCOMP Service Report', htmlContent);
    } else {
      throw error; // Re-throw to let calling code handle it
    }
  }
};

const generateAndDownloadPDF = async (report: any): Promise<void> => {
  console.log('🔄 Starting PDF generation...');

  // Generate HTML content
  const htmlContent = generateReportHTML(report);
  console.log('Generated HTML content length:', htmlContent.length);

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
  
  tempContainer.innerHTML = htmlContent;
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
    const reportNumber = safeAccess(report, ['reportNumber'], 'Unknown');
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
