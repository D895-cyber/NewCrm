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
  const siteInchargeName = safeAccess(report, ['siteIncharge', 'name'], 'Mr. - -');
  const siteInchargePhone = safeAccess(report, ['siteIncharge', 'phone'], '');
  const engineerName = safeAccess(report, ['engineer', 'name'], 'Engineer Name');
  
  const projectorModel = safeAccess(report, ['projectorModel'], 'Model Not Available');
  const projectorSerial = safeAccess(report, ['projectorSerial'], 'Serial Not Available');
  const softwareVersion = safeAccess(report, ['softwareVersion'], 'Version Not Available');
  const projectorHours = safeAccess(report, ['projectorHours'], '0');
  
  const lampModel = safeAccess(report, ['lampModel'], 'Lamp Model Not Available');
  const lampHours = safeAccess(report, ['lampHours'], '0');
  const currentLampHours = safeAccess(report, ['currentLampHours'], '0');
  const lampReplacementRequired = safeAccess(report, ['lampReplacementRequired'], 'No');

  // Extract technical data from report
  const voltageParameters = safeAccess(report, ['voltageParameters'], {});
  const lampPowerMeasurements = safeAccess(report, ['lampPowerMeasurements'], {});
  const environmentStatus = safeAccess(report, ['environmentStatus'], {});
  const observations = safeAccess(report, ['observations'], []);
  const recommendedParts = safeAccess(report, ['recommendedParts'], []);
  const colorCoordinates = safeAccess(report, ['colorCoordinates'], {});
  const colorAccuracy = safeAccess(report, ['colorAccuracy'], {});
  const screenInfo = safeAccess(report, ['screenInfo'], {});
  const airPollution = safeAccess(report, ['airPollution'], {});
  const contentServer = safeAccess(report, ['contentServer'], '-');
  const leStatus = safeAccess(report, ['leStatus'], '-');
  const acStatus = safeAccess(report, ['acStatus'], '-');

  // Extract sections data
  const opticals = safeAccess(report, ['opticals'], []);
  const electronics = safeAccess(report, ['electronics'], []);
  const mechanical = safeAccess(report, ['mechanical'], []);
  const lightEngineTest = safeAccess(report, ['lightEngineTest'], []);
  const imageEvaluation = safeAccess(report, ['imageEvaluation'], {});

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
        
        .sections-table th,
        .sections-table td {
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
        
        .technical-table th,
        .technical-table td {
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
        
        .observations-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .observations-table th,
        .observations-table td {
          border: 1px solid #000;
          padding: 6px;
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
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .parts-table th,
        .parts-table td {
          border: 1px solid #000;
          padding: 6px;
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
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .color-coordinates-table th,
        .color-coordinates-table td {
          border: 1px solid #000;
          padding: 6px;
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
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .screen-info-table th,
        .screen-info-table td {
          border: 1px solid #000;
          padding: 6px;
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
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .pollution-table th,
        .pollution-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
        }
        
        .pollution-table th {
          background: #e9e9e9;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .status-section {
          margin: 20px 0;
        }
        
        .status-item {
          margin: 5px 0;
          font-size: 12px;
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
      
      <div class="company-section">
        <div class="company-logo">A</div>
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
      
      <div class="brand-title">CHRISTIE</div>
      <div class="subtitle">Projector Service Report - ${reportType} done on Date - ${reportDate}</div>
      
      <div class="info-grid">
        <div class="info-box">
          <h3>Site & Personnel</h3>
          <div class="info-item"><strong>Site:</strong> ${siteName}</div>
          <div class="info-item"><strong>Site In-charge:</strong> ${siteInchargeName} ${siteInchargePhone ? `(Contact: ${siteInchargePhone})` : ''}</div>
          <div class="info-item"><strong>Ascomp Engineer:</strong> ${engineerName}</div>
        </div>
        
        <div class="info-box">
          <h3>Projector & Lamp Information</h3>
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
            
            // OPTICALS Section - Dynamic descriptions from FSE input
            const opticalsData = [
              { description: safeAccess(opticals, ['item1', 'description'], ''), status: safeAccess(opticals, ['item1', 'status'], ''), result: safeAccess(opticals, ['item1', 'result'], 'OK') },
              { description: safeAccess(opticals, ['item2', 'description'], ''), status: safeAccess(opticals, ['item2', 'status'], ''), result: safeAccess(opticals, ['item2', 'result'], 'OK') },
              { description: safeAccess(opticals, ['item3', 'description'], ''), status: safeAccess(opticals, ['item3', 'status'], ''), result: safeAccess(opticals, ['item3', 'result'], 'OK') },
              { description: safeAccess(opticals, ['item4', 'description'], ''), status: safeAccess(opticals, ['item4', 'status'], ''), result: safeAccess(opticals, ['item4', 'result'], 'OK') },
              { description: safeAccess(opticals, ['item5', 'description'], ''), status: safeAccess(opticals, ['item5', 'status'], ''), result: safeAccess(opticals, ['item5', 'result'], 'OK') }
            ];
            
            opticalsData.forEach((item, index) => {
              rows += `
                <tr>
                  ${index === 0 ? `<td class="section-header" rowspan="${opticalsData.length}">OPTICALS</td>` : ''}
                  <td>${item.description}</td>
                  <td>${item.status}</td>
                  <td class="status-ok">${item.result}</td>
                </tr>
              `;
            });
            
            // ELECTRONICS Section - Dynamic descriptions from FSE input
            const electronicsData = [
              { description: safeAccess(electronics, ['item1', 'description'], ''), status: safeAccess(electronics, ['item1', 'status'], ''), result: safeAccess(electronics, ['item1', 'result'], 'OK') },
              { description: safeAccess(electronics, ['item2', 'description'], ''), status: safeAccess(electronics, ['item2', 'status'], ''), result: safeAccess(electronics, ['item2', 'result'], 'OK') },
              { description: safeAccess(electronics, ['item3', 'description'], ''), status: safeAccess(electronics, ['item3', 'status'], ''), result: safeAccess(electronics, ['item3', 'result'], 'OK') },
              { description: safeAccess(electronics, ['item4', 'description'], ''), status: safeAccess(electronics, ['item4', 'status'], ''), result: safeAccess(electronics, ['item4', 'result'], 'OK') },
              { description: safeAccess(electronics, ['item5', 'description'], ''), status: safeAccess(electronics, ['item5', 'status'], ''), result: safeAccess(electronics, ['item5', 'result'], 'OK') },
              { description: safeAccess(electronics, ['item6', 'description'], ''), status: safeAccess(electronics, ['item6', 'status'], ''), result: safeAccess(electronics, ['item6', 'result'], 'OK') }
            ];
            
            electronicsData.forEach((item, index) => {
              rows += `
                <tr>
                  ${index === 0 ? `<td class="section-header" rowspan="${electronicsData.length}">ELECTRONICS</td>` : ''}
                  <td>${item.description}</td>
                  <td>${item.status}</td>
                  <td class="status-ok">${item.result}</td>
                </tr>
              `;
            });
            
            // Serial Number verified
            rows += `
              <tr>
                <td class="section-header" rowspan="1">Serial Number verified</td>
                <td>${safeAccess(report, ['serialVerified', 'description'], 'Chassis label vs Touch Panel')}</td>
                <td>${safeAccess(report, ['serialVerified', 'status'], '')}</td>
                <td class="status-ok">${safeAccess(report, ['serialVerified', 'result'], 'OK')}</td>
              </tr>
            `;
            
            // Disposable Consumables
            rows += `
              <tr>
                <td class="section-header" rowspan="1">Disposable Consumables</td>
                <td>${safeAccess(report, ['consumables', 'description'], 'Air Intake, LAD and RAD')}</td>
                <td>${safeAccess(report, ['consumables', 'status'], 'replaced')}</td>
                <td class="status-ok">${safeAccess(report, ['consumables', 'result'], 'OK')}</td>
              </tr>
            `;
            
            // Coolant
            rows += `
              <tr>
                <td class="section-header" rowspan="1">Coolant</td>
                <td>${safeAccess(report, ['coolant', 'description'], 'Level and Color')}</td>
                <td>${safeAccess(report, ['coolant', 'status'], '')}</td>
                <td class="status-ok">${safeAccess(report, ['coolant', 'result'], 'OK')}</td>
              </tr>
            `;
            
            // Light Engine Test Pattern
            const lightEngineData = [
              { description: safeAccess(lightEngineTest, ['item1', 'description'], ''), status: safeAccess(lightEngineTest, ['item1', 'status'], ''), result: safeAccess(lightEngineTest, ['item1', 'result'], 'OK') },
              { description: safeAccess(lightEngineTest, ['item2', 'description'], ''), status: safeAccess(lightEngineTest, ['item2', 'status'], ''), result: safeAccess(lightEngineTest, ['item2', 'result'], 'OK') },
              { description: safeAccess(lightEngineTest, ['item3', 'description'], ''), status: safeAccess(lightEngineTest, ['item3', 'status'], ''), result: safeAccess(lightEngineTest, ['item3', 'result'], 'OK') },
              { description: safeAccess(lightEngineTest, ['item4', 'description'], ''), status: safeAccess(lightEngineTest, ['item4', 'status'], ''), result: safeAccess(lightEngineTest, ['item4', 'result'], 'OK') },
              { description: safeAccess(lightEngineTest, ['item5', 'description'], ''), status: safeAccess(lightEngineTest, ['item5', 'status'], ''), result: safeAccess(lightEngineTest, ['item5', 'result'], 'OK') }
            ];
            
            lightEngineData.forEach((item, index) => {
              rows += `
                <tr>
                  ${index === 0 ? `<td class="section-header" rowspan="${lightEngineData.length}">Light Engine Test Pattern</td>` : ''}
                  <td>${item.description}</td>
                  <td>${item.status}</td>
                  <td class="status-ok">${item.result}</td>
                </tr>
              `;
            });
            
            // MECHANICAL Section
            const mechanicalData = [
              { description: safeAccess(mechanical, ['item1', 'description'], ''), status: safeAccess(mechanical, ['item1', 'status'], ''), result: safeAccess(mechanical, ['item1', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item2', 'description'], ''), status: safeAccess(mechanical, ['item2', 'status'], ''), result: safeAccess(mechanical, ['item2', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item3', 'description'], ''), status: safeAccess(mechanical, ['item3', 'status'], ''), result: safeAccess(mechanical, ['item3', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item4', 'description'], ''), status: safeAccess(mechanical, ['item4', 'status'], ''), result: safeAccess(mechanical, ['item4', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item5', 'description'], ''), status: safeAccess(mechanical, ['item5', 'status'], ''), result: safeAccess(mechanical, ['item5', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item6', 'description'], ''), status: safeAccess(mechanical, ['item6', 'status'], ''), result: safeAccess(mechanical, ['item6', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item7', 'description'], ''), status: safeAccess(mechanical, ['item7', 'status'], ''), result: safeAccess(mechanical, ['item7', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item8', 'description'], ''), status: safeAccess(mechanical, ['item8', 'status'], ''), result: safeAccess(mechanical, ['item8', 'result'], 'OK') },
              { description: safeAccess(mechanical, ['item9', 'description'], ''), status: safeAccess(mechanical, ['item9', 'status'], ''), result: safeAccess(mechanical, ['item9', 'result'], 'OK') }
            ];
            
            mechanicalData.forEach((item, index) => {
              rows += `
                <tr>
                  ${index === 0 ? `<td class="section-header" rowspan="${mechanicalData.length}">MECHANICAL</td>` : ''}
                  <td>${item.description}</td>
                  <td>${item.status}</td>
                  <td class="status-ok">${item.result}</td>
                </tr>
              `;
            });
            
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
            <tr>
              <td class="section-header" rowspan="2">ICP Board</td>
              <td>ICP Board</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>IMB/S Board</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="1">Serial Number verified</td>
              <td>Chassis label vs Touch Panel</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="1">Disposable Consumables</td>
              <td>Air Intake, LAD and RAD</td>
              <td>Replaced</td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="1">Coolant</td>
              <td>Level and Color</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="5">Light Engine Test Pattern</td>
              <td></td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="3">MECHANICAL</td>
              <td>AC blower and Vane Switch</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Extractor Vane Switch</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Exhaust CFM</td>
              <td>7.5 M/S</td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td class="section-header" rowspan="6">Light Engine 4 fans with LAD fan</td>
              <td>Light Engine 4 fans with LAD fan</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Card Cage Top and Bottom fans</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Radiator fan and Pump</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Connector and hose for the Pump</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Security and lamp house lock switch</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
            <tr>
              <td>Lamp LOC Mechanism X, Y and Z movement</td>
              <td></td>
              <td class="status-ok">OK</td>
            </tr>
          </tbody>
        </table>
        
        <div class="technical-tables">
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
          </div>
          
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
          </div>
        </div>
        
        <div class="section-title">CONTENT PLAYING SERVER</div>
        <div style="margin-bottom: 20px;">${contentServer}</div>
        
        <div class="section-title">FL ON 100% LAMP POWER BEFORE AND AFTER</div>
        <table class="technical-table" style="width: 300px;">
          <tbody>
            <tr>
              <td>Before</td>
              <td>${safeAccess(lampPowerMeasurements, ['flBeforePM'], '-')}</td>
            </tr>
            <tr>
              <td>After</td>
              <td>${safeAccess(lampPowerMeasurements, ['flAfterPM'], '-')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">PROJECTOR PLACEMENT, ROOM, ENVIRONMENT</div>
        <div style="margin-bottom: 20px;">${safeAccess(environmentStatus, ['projectorPlacement'], 'ok')}</div>
        
        <div class="section-title">OBSERVATIONS AND REMARKS</div>
        <table class="observations-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Observation</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 6 }, (_, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${safeAccess(observations, [i, 'description'], '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="technical-tables">
          <div>
            <div class="section-title">RECOMMENDED PARTS TO CHANGE</div>
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
                ${Array.from({ length: 6 }, (_, i) => `
                  <tr>
                    <td>${safeAccess(recommendedParts, [i, 'serialNumber'], '-')}</td>
                    <td>${safeAccess(recommendedParts, [i, 'partName'], '-')}</td>
                    <td>${safeAccess(recommendedParts, [i, 'partNumber'], '-')}</td>
                    <td>${safeAccess(recommendedParts, [i, 'quantity'], '-')}</td>
                    <td>${safeAccess(recommendedParts, [i, 'notes'], '-')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div>
            <div class="section-title">MEASURED COLOR COORDINATES (MCGD)</div>
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
                <tr>
                  <td>White 2K</td>
                  <td>${safeAccess(colorCoordinates, ['white2k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['white2k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['white2k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>White 4K</td>
                  <td>${safeAccess(colorCoordinates, ['white4k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['white4k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['white4k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Red 2K</td>
                  <td>${safeAccess(colorCoordinates, ['red2k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['red2k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['red2k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Red 4K</td>
                  <td>${safeAccess(colorCoordinates, ['red4k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['red4k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['red4k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Green 2K</td>
                  <td>${safeAccess(colorCoordinates, ['green2k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['green2k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['green2k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Green 4K</td>
                  <td>${safeAccess(colorCoordinates, ['green4k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['green4k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['green4k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Blue 2K</td>
                  <td>${safeAccess(colorCoordinates, ['blue2k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['blue2k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['blue2k', 'y'], '-')}</td>
                </tr>
                <tr>
                  <td>Blue 4K</td>
                  <td>${safeAccess(colorCoordinates, ['blue4k', 'fL'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['blue4k', 'x'], '-')}</td>
                  <td>${safeAccess(colorCoordinates, ['blue4k', 'y'], '-')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
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
        
        <div class="section-title">CIE XYZ COLOR ACCURACY</div>
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
            <tr>
              <td>Blue 4K</td>
              <td>${safeAccess(colorAccuracy, ['blue4k', 'x'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['blue4k', 'y'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['blue4k', 'fL'], '-')}</td>
            </tr>
            <tr>
              <td>BW Step-10 2K</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_2k', 'x'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_2k', 'y'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_2k', 'fL'], '-')}</td>
            </tr>
            <tr>
              <td>BW Step-10 4K</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_4k', 'x'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_4k', 'y'], '-')}</td>
              <td>${safeAccess(colorAccuracy, ['bwStep10_4k', 'fL'], '-')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">SCREEN INFORMATION IN METRES</div>
        <table class="screen-info-table">
          <thead>
            <tr>
              <th>Height</th>
              <th>Width</th>
              <th>Gain</th>
              <th>Throw Distance</th>
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
              <td>${safeAccess(screenInfo, ['make'], '-')}</td>
              <td>${safeAccess(screenInfo, ['throwDistance'], '-')}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
        
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
              <td>${safeAccess(airPollution, ['level'], '4')}</td>
              <td>${safeAccess(airPollution, ['hcho'], '32')}</td>
              <td>${safeAccess(airPollution, ['tvoc'], '3')}</td>
              <td>${safeAccess(airPollution, ['pm1'], '3')}</td>
              <td>${safeAccess(airPollution, ['pm25'], '4')}</td>
              <td>${safeAccess(airPollution, ['pm10'], '3')}</td>
              <td>${safeAccess(airPollution, ['temperature'], '-')}</td>
              <td>${safeAccess(airPollution, ['humidity'], '-')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="status-section">
          <div class="status-item">LE Status During PM: ${leStatus}</div>
          <div class="status-item">AC Status: ${acStatus}</div>
          <div class="status-item">Review Photos: <a href="#" style="color: #0066cc; text-decoration: underline;">Click Here.</a></div>
        </div>
        
        <hr style="border: 1px solid #000; margin: 20px 0;">
        
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
  console.log('exportASCOMPStyleReport called with report:', report);
  
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
          .page-break { page-break-before: always; }
          .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px 0; color: #0066cc; text-decoration: underline; }
          .technical-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .technical-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .technical-table th, .technical-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .technical-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .observations-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .observations-table th, .observations-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .observations-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .parts-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .parts-table th, .parts-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .parts-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .color-coordinates-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .color-coordinates-table th, .color-coordinates-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .color-coordinates-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .screen-info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .screen-info-table th, .screen-info-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .screen-info-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .pollution-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .pollution-table th, .pollution-table td { border: 1px solid #000; padding: 6px; text-align: left; }
          .pollution-table th { background: #e9e9e9; font-weight: bold; text-align: center; font-size: 10px; }
          .status-section { margin: 20px 0; }
          .status-item { margin: 5px 0; font-size: 12px; }
          .footer-note { margin-top: 30px; text-align: center; font-size: 12px; font-weight: bold; }
          .page-number { position: absolute; bottom: 20px; right: 20px; font-size: 10px; }
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
