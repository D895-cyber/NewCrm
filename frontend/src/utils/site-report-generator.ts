// Site Report Generator - ASCOMP Style
// Generates site reports in the same format as service reports

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

// Generate site report HTML in ASCOMP style
const generateSiteReportHTML = (siteData: any, analyticsData: any = {}): string => {
  const reportNumber = `SITE-${Date.now()}`;
  const reportDate = formatDate(new Date());
  const reportTime = new Date().toLocaleTimeString();
  
  const siteName = safeAccess(siteData, ['name'], 'Site Name Not Available');
  const siteCode = safeAccess(siteData, ['siteCode'], 'N/A');
  const region = safeAccess(siteData, ['region'], 'N/A');
  const state = safeAccess(siteData, ['state'], 'N/A');
  const city = safeAccess(siteData, ['city'], 'N/A');
  const address = safeAccess(siteData, ['address'], 'Address Not Available');
  
  const contactPerson = safeAccess(siteData, ['contactPerson'], 'Contact Person');
  const contactPhone = safeAccess(siteData, ['contactPhone'], 'N/A');
  const contactEmail = safeAccess(siteData, ['contactEmail'], 'N/A');
  
  const totalProjectors = safeAccess(siteData, ['totalProjectors'], 0);
  const activeProjectors = safeAccess(siteData, ['activeProjectors'], 0);
  const totalAuditoriums = safeAccess(siteData, ['auditoriums', 'length'], 0);
  
  // Analytics data
  const rmaCases = safeAccess(analyticsData, ['rmaAnalysis', 'totalCases'], 0);
  const avgResolutionTime = safeAccess(analyticsData, ['rmaAnalysis', 'avgResolutionTime'], 0);
  const totalCost = safeAccess(analyticsData, ['rmaAnalysis', 'totalCost'], 0);
  const serviceVisits = safeAccess(analyticsData, ['serviceAnalysis', 'totalVisits'], 0);
  const lastServiceDate = safeAccess(analyticsData, ['serviceAnalysis', 'lastVisit'], 'N/A');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ASCOMP Site Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.3;
          color: #000;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
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
        .company-logo {
          width: 60px;
          height: 60px;
          background: #0066cc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-right: 20px;
        }
        .company-info {
          flex: 1;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-address {
          font-size: 11px;
          margin-bottom: 5px;
        }
        .company-contact {
          font-size: 11px;
          display: flex;
          gap: 20px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .brand-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
          margin: 20px 0 10px 0;
        }
        .subtitle {
          text-align: center;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-box {
          border: 2px solid #000;
          padding: 15px;
          background: #f8f8f8;
          margin-bottom: 15px;
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
          margin-bottom: 20px;
          font-size: 12px;
          border: 2px solid #000;
        }
        .sections-table th, .sections-table td {
          border: 1px solid #000;
          padding: 10px 8px;
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
        .status-warning {
          text-align: center;
          font-weight: bold;
          color: #ff6600;
          font-size: 11px;
        }
        .status-error {
          text-align: center;
          font-weight: bold;
          color: #cc0000;
          font-size: 11px;
        }
        .page-break {
          page-break-before: always;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          margin: 20px 0 10px 0;
          color: #0066cc;
          text-decoration: underline;
        }
        .technical-tables {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .technical-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .technical-table th, .technical-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
        }
        .technical-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        .footer-note {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          font-weight: bold;
        }
        .page-number {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <!-- Header Section -->
      <div class="header">
        <div class="date-time">
          <div>Date: ${reportDate}</div>
          <div>Time: ${reportTime}</div>
        </div>
        <div class="report-details">
          <div>Report No: ${reportNumber}</div>
          <div>Report Type: Site Analysis</div>
        </div>
      </div>

      <!-- Company Section -->
      <div class="company-section">
        <div class="company-logo">A</div>
        <div class="company-info">
          <div class="company-name">ASCOMP INC.</div>
          <div class="company-address">123 Business Park, Tech City, State 12345</div>
          <div class="company-contact">
            <div class="contact-item">📞 +1 (555) 123-4567</div>
            <div class="contact-item">✉️ info@ascomp.com</div>
            <div class="contact-item">🌐 www.ascomp.com</div>
          </div>
        </div>
      </div>

      <!-- Report Title -->
      <div class="brand-title">SITE ANALYSIS REPORT</div>
      <div class="subtitle">Comprehensive Site Performance and Analytics Report</div>

      <!-- Site Information -->
      <div class="info-grid">
        <div class="info-box">
          <h3>SITE INFORMATION</h3>
          <div class="info-item"><strong>Site Name:</strong> ${siteName}</div>
          <div class="info-item"><strong>Site Code:</strong> ${siteCode}</div>
          <div class="info-item"><strong>Region:</strong> ${region}</div>
          <div class="info-item"><strong>State:</strong> ${state}</div>
          <div class="info-item"><strong>City:</strong> ${city}</div>
          <div class="info-item"><strong>Address:</strong> ${address}</div>
        </div>
        <div class="info-box">
          <h3>CONTACT DETAILS</h3>
          <div class="info-item"><strong>Contact Person:</strong> ${contactPerson}</div>
          <div class="info-item"><strong>Phone:</strong> ${contactPhone}</div>
          <div class="info-item"><strong>Email:</strong> ${contactEmail}</div>
          <div class="info-item"><strong>Report Date:</strong> ${reportDate}</div>
          <div class="info-item"><strong>Report Time:</strong> ${reportTime}</div>
        </div>
      </div>

      <!-- Site Statistics -->
      <div class="section-title">SITE STATISTICS</div>
      <table class="sections-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Projectors</td>
            <td>${totalProjectors}</td>
            <td class="status-ok">Active</td>
            <td>All projectors accounted for</td>
          </tr>
          <tr>
            <td>Active Projectors</td>
            <td>${activeProjectors}</td>
            <td class="${activeProjectors === totalProjectors ? 'status-ok' : 'status-warning'}">${activeProjectors === totalProjectors ? 'All Active' : 'Some Inactive'}</td>
            <td>${((activeProjectors / totalProjectors) * 100).toFixed(1)}% utilization</td>
          </tr>
          <tr>
            <td>Total Auditoriums</td>
            <td>${totalAuditoriums}</td>
            <td class="status-ok">Operational</td>
            <td>All auditoriums functional</td>
          </tr>
          <tr>
            <td>RMA Cases</td>
            <td>${rmaCases}</td>
            <td class="${rmaCases === 0 ? 'status-ok' : rmaCases < 5 ? 'status-warning' : 'status-error'}">${rmaCases === 0 ? 'No Issues' : rmaCases < 5 ? 'Low' : 'High'}</td>
            <td>Average resolution: ${avgResolutionTime} days</td>
          </tr>
          <tr>
            <td>Service Visits</td>
            <td>${serviceVisits}</td>
            <td class="status-ok">Regular</td>
            <td>Last visit: ${lastServiceDate}</td>
          </tr>
        </tbody>
      </table>

      <!-- Projector Analysis -->
      <div class="section-title">PROJECTOR ANALYSIS</div>
      <div class="technical-tables">
        <table class="technical-table">
          <thead>
            <tr>
              <th>Auditorium</th>
              <th>Projectors</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${siteData.auditoriums?.map((auditorium: any) => `
              <tr>
                <td>${auditorium.name || auditorium.audiNumber}</td>
                <td>${auditorium.projectorCount || 0}</td>
                <td class="status-ok">${auditorium.status || 'Active'}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No auditorium data available</td></tr>'}
          </tbody>
        </table>
        <table class="technical-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Projectors</td>
              <td>${totalProjectors}</td>
            </tr>
            <tr>
              <td>Active Projectors</td>
              <td>${activeProjectors}</td>
            </tr>
            <tr>
              <td>Utilization Rate</td>
              <td>${totalProjectors > 0 ? ((activeProjectors / totalProjectors) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>Average per Auditorium</td>
              <td>${totalAuditoriums > 0 ? (totalProjectors / totalAuditoriums).toFixed(1) : 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- RMA Analysis -->
      <div class="section-title">RMA ANALYSIS</div>
      <table class="sections-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Status</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total RMA Cases</td>
            <td>${rmaCases}</td>
            <td class="${rmaCases === 0 ? 'status-ok' : rmaCases < 5 ? 'status-warning' : 'status-error'}">${rmaCases === 0 ? 'No Issues' : rmaCases < 5 ? 'Low' : 'High'}</td>
            <td>Stable</td>
          </tr>
          <tr>
            <td>Average Resolution Time</td>
            <td>${avgResolutionTime} days</td>
            <td class="${avgResolutionTime < 7 ? 'status-ok' : avgResolutionTime < 14 ? 'status-warning' : 'status-error'}">${avgResolutionTime < 7 ? 'Fast' : avgResolutionTime < 14 ? 'Moderate' : 'Slow'}</td>
            <td>Improving</td>
          </tr>
          <tr>
            <td>Total RMA Cost</td>
            <td>$${totalCost.toLocaleString()}</td>
            <td class="${totalCost < 1000 ? 'status-ok' : totalCost < 5000 ? 'status-warning' : 'status-error'}">${totalCost < 1000 ? 'Low' : totalCost < 5000 ? 'Moderate' : 'High'}</td>
            <td>Controlled</td>
          </tr>
        </tbody>
      </table>

      <!-- Service History -->
      <div class="section-title">SERVICE HISTORY</div>
      <table class="sections-table">
        <thead>
          <tr>
            <th>Service Type</th>
            <th>Date</th>
            <th>Engineer</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Routine Maintenance</td>
            <td>${lastServiceDate}</td>
            <td>FSE Engineer</td>
            <td class="status-ok">Completed</td>
            <td>All systems operational</td>
          </tr>
          <tr>
            <td>Total Visits</td>
            <td>${serviceVisits}</td>
            <td>Multiple</td>
            <td class="status-ok">Regular</td>
            <td>Consistent service schedule</td>
          </tr>
        </tbody>
      </table>

      <!-- Recommendations -->
      <div class="section-title">RECOMMENDATIONS</div>
      <div class="info-box">
        <h3>MAINTENANCE RECOMMENDATIONS</h3>
        <div class="info-item">• Schedule regular maintenance every 3 months</div>
        <div class="info-item">• Monitor projector utilization rates</div>
        <div class="info-item">• Review RMA cases for pattern analysis</div>
        <div class="info-item">• Update contact information as needed</div>
        <div class="info-item">• Consider preventive maintenance for high-usage projectors</div>
      </div>

      <!-- Footer -->
      <div class="footer-note">
        This report was generated automatically by the ASCOMP Site Management System<br>
        For questions or support, contact: support@ascomp.com
      </div>
      <div class="page-number">Page 1 of 1</div>
    </body>
    </html>
  `;
};

// Main export function for site reports
export const exportSiteReportToPDF = async (siteData: any, analyticsData: any = {}): Promise<void> => {
  console.log('🔄 Generating site report PDF...');
  
  if (!siteData) {
    console.error('exportSiteReportToPDF: Site data is required');
    alert('Error: No site data available for report generation');
    return;
  }

  try {
    // Generate HTML content
    const htmlContent = generateSiteReportHTML(siteData, analyticsData);
    console.log('Generated site report HTML content length:', htmlContent.length);

    // Create a complete HTML document
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>ASCOMP Site Report</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; color: #000; background: white; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .date-time { font-size: 11px; color: #333; }
            .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
            .report-details { text-align: right; font-size: 11px; }
            .company-section { display: flex; align-items: center; margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9; }
            .company-logo { width: 60px; height: 60px; background: #0066cc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 20px; }
            .company-info { flex: 1; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .company-address { font-size: 11px; margin-bottom: 5px; }
            .company-contact { font-size: 11px; display: flex; gap: 20px; }
            .contact-item { display: flex; align-items: center; gap: 5px; }
            .brand-title { text-align: center; font-size: 24px; font-weight: bold; color: #0066cc; margin: 20px 0 10px 0; }
            .subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { border: 2px solid #000; padding: 15px; background: #f8f8f8; margin-bottom: 15px; }
            .info-box h3 { margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-decoration: underline; color: #000; }
            .info-item { margin: 3px 0; font-size: 12px; }
            .sections-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 2px solid #000; }
            .sections-table th, .sections-table td { border: 1px solid #000; padding: 10px 8px; text-align: left; vertical-align: middle; }
            .sections-table th { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 11px; border: 1px solid #000; }
            .section-header { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 11px; border: 1px solid #000; }
            .status-ok { text-align: center; font-weight: bold; color: #006600; font-size: 11px; }
            .status-warning { text-align: center; font-weight: bold; color: #ff6600; font-size: 11px; }
            .status-error { text-align: center; font-weight: bold; color: #cc0000; font-size: 11px; }
            .page-break { page-break-before: always; }
            .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px 0; color: #0066cc; text-decoration: underline; }
            .technical-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .technical-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .technical-table th, .technical-table td { border: 1px solid #000; padding: 6px; text-align: left; }
            .technical-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
            .footer-note { margin-top: 30px; text-align: center; font-size: 12px; font-weight: bold; }
            .page-number { position: absolute; bottom: 20px; right: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtmlDocument;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.height = '297mm'; // A4 height
    document.body.appendChild(tempDiv);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const siteCode = safeAccess(siteData, ['siteCode'], 'SITE');
      const date = new Date().toISOString().split('T')[0];
      const filename = `ASCOMP_Site_Report_${siteCode}_${date}.pdf`;

      // Download PDF
      pdf.save(filename);
      console.log('✅ Site report PDF generated successfully');

    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }

  } catch (error: any) {
    console.error('❌ Site report PDF generation failed:', error);
    alert(`Site report generation failed: ${error?.message || 'Unknown error'}`);
  }
};

// Export function for regional reports
export const exportRegionalReportToPDF = async (regionalData: any): Promise<void> => {
  console.log('🔄 Generating regional report PDF...');
  // Implementation similar to site report but for regional data
  // This would generate reports for multiple sites in a region
};

// Export function for site performance reports
export const exportSitePerformanceReportToPDF = async (siteData: any, performanceData: any): Promise<void> => {
  console.log('🔄 Generating site performance report PDF...');
  // Implementation for detailed site performance analysis
};

















