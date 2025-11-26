/**
 * ASCOMP PDF Generator Service
 * Generates ASCOMP-formatted PDFs from report data using Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class ASCOMPPdfGeneratorService {
  /**
   * Generate ASCOMP PDF from report data
   * @param {Object} reportData - ASCOMP report data object
   * @returns {Promise<Buffer>} - PDF buffer
   */
  static async generatePDF(reportData) {
    let browser = null;
    
    try {
      console.log('🔄 Starting ASCOMP PDF generation for report:', reportData.reportNumber);
      
      // Generate HTML content
      const htmlContent = this.generateASCOMPHTML(reportData);
      
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: false
      });

      console.log('✅ ASCOMP PDF generated successfully:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Error generating ASCOMP PDF:', error);
      throw new Error(`Failed to generate ASCOMP PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate complete HTML document for ASCOMP report
   * @param {Object} report - ASCOMP report data
   * @returns {string} - HTML content
   */
  static generateASCOMPHTML(report) {
    const safeAccess = (obj, path, defaultValue = '') => {
      try {
        return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), obj);
      } catch {
        return defaultValue;
      }
    };

    const formatDate = (date) => {
      try {
        return new Date(date).toLocaleDateString('en-GB');
      } catch {
        return new Date().toLocaleDateString('en-GB');
      }
    };

    const formatTime = (date) => {
      try {
        return new Date(date).toLocaleTimeString('en-GB');
      } catch {
        return new Date().toLocaleTimeString('en-GB');
      }
    };

    // Extract data with safe access
    const reportNumber = safeAccess(report, ['reportNumber'], 'REPORT-' + Date.now());
    const reportDate = formatDate(report.date);
    const reportTime = formatTime(report.date);
    const reportType = safeAccess(report, ['reportType'], 'EW - Preventive Maintenance Report');
    
    const cinemaName = safeAccess(report, ['cinemaName'], 'Cinema Name Not Available');
    const address = safeAccess(report, ['address'], '');
    const contactDetails = safeAccess(report, ['contactDetails'], '');
    const location = safeAccess(report, ['location'], '');
    
    const engineerName = safeAccess(report, ['engineer', 'name'], 'Engineer Name');
    const engineerPhone = safeAccess(report, ['engineer', 'phone'], '');
    const engineerEmail = safeAccess(report, ['engineer', 'email'], '');
    
    const serialNumber = safeAccess(report, ['serialNumber'], '');
    const projectorModelSerialAndHours = safeAccess(report, ['projectorModelSerialAndHours'], '');
    
    // Generate checklist table rows
    const generateChecklistSection = (sectionTitle, items) => {
      let html = `<tr><td colspan="3" class="section-header">${sectionTitle}</td></tr>`;
      
      items.forEach(item => {
        const itemData = safeAccess(report, item.path, { status: '', yesNoOk: '' });
        html += `
          <tr>
            <td>${item.label}</td>
            <td class="status-ok">${itemData.status || ''}</td>
            <td class="status-ok">${itemData.yesNoOk || ''}</td>
          </tr>
        `;
      });
      
      return html;
    };

    const checklistHTML = `
      <table class="sections-table">
        <thead>
          <tr>
            <th style="width: 50%;">CHECK LIST ITEMS</th>
            <th style="width: 25%;">STATUS</th>
            <th style="width: 25%;">YES / NO - OK</th>
          </tr>
        </thead>
        <tbody>
          ${generateChecklistSection('OPTICALS', [
            { label: 'Reflector', path: ['opticals', 'reflector'] },
            { label: 'UV Filter', path: ['opticals', 'uvFilter'] },
            { label: 'Integrator Rod', path: ['opticals', 'integratorRod'] },
            { label: 'Cold Mirror', path: ['opticals', 'coldMirror'] },
            { label: 'Fold Mirror', path: ['opticals', 'foldMirror'] }
          ])}
          
          ${generateChecklistSection('ELECTRONICS', [
            { label: 'Touch Panel', path: ['electronics', 'touchPanel'] },
            { label: 'EVB and IMCB Board', path: ['electronics', 'evbAndImcbBoard'] },
            { label: 'PIB and ICP Board', path: ['electronics', 'pibAndIcpBoard'] },
            { label: 'IMB2 Board', path: ['electronics', 'imb2Board'] }
          ])}
          
          ${generateChecklistSection('Serial Number Verified', [
            { label: 'Chassis Label vs Touch Panel', path: ['serialNumberVerified', 'chassisLabelVsTouchPanel'] }
          ])}
          
          ${generateChecklistSection('Disposable Consumables', [
            { label: 'Air Intake LAD and RAD', path: ['disposableConsumables', 'airIntakeLadAndRad'] }
          ])}
          
          ${generateChecklistSection('Coolant', [
            { label: 'Level and Color', path: ['coolant', 'levelAndColor'] },
            { label: 'White', path: ['coolant', 'white'] },
            { label: 'Red', path: ['coolant', 'red'] }
          ])}
          
          ${generateChecklistSection('Light Engine Test Pattern', [
            { label: 'Green', path: ['lightEngineTestPattern', 'green'] },
            { label: 'Blue', path: ['lightEngineTestPattern', 'blue'] },
            { label: 'Black', path: ['lightEngineTestPattern', 'black'] }
          ])}
          
          ${generateChecklistSection('MECHANICAL', [
            { label: 'AC Blower and Vane Switch', path: ['mechanical', 'acBlowerAndVaneSwitch'] },
            { label: 'Extractor Vane Switch', path: ['mechanical', 'extractorVaneSwitch'] },
            { label: 'Exhaust CFM Value', path: ['mechanical', 'exhaustCfmValue'] },
            { label: 'Light Engine Fans with LAD Fan', path: ['mechanical', 'lightEngineFansWithLadFan'] },
            { label: 'Card Cage Top and Bottom Fans', path: ['mechanical', 'cardCageTopAndBottomFans'] },
            { label: 'Radiator Fan and Pump', path: ['mechanical', 'radiatorFanAndPump'] },
            { label: 'Connector and Hose for Pump', path: ['mechanical', 'connectorAndHoseForPump'] },
            { label: 'Security and Lamp House Lock Switch', path: ['mechanical', 'securityAndLampHouseLockSwitch'] }
          ])}
          
          ${generateChecklistSection('Lamp LOC Mechanism', [
            { label: 'X and Z Movement', path: ['lampLocMechanism', 'xAndZMovement'] }
          ])}
        </tbody>
      </table>
    `;

    // Page 2 details
    const lampInfo = safeAccess(report, ['lampInfo'], {});
    const voltageParameters = safeAccess(report, ['voltageParameters'], {});
    const screenInfo = safeAccess(report, ['screenInformation'], {});
    const imageEval = safeAccess(report, ['imageEvaluation'], {});

    const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>ASCOMP Service Report - ${reportNumber}</title>
        <style>
          body { 
            margin: 0; 
            padding: 15px; 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #000; 
            background: white; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
          }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            color: #000; 
          }
          .report-title { 
            text-align: center; 
            font-size: 16px; 
            font-weight: bold; 
            margin: 15px 0; 
            text-decoration: underline;
          }
          .report-details { 
            text-align: right; 
            font-size: 11px; 
          }
          .info-section { 
            margin-bottom: 12px; 
            border: 1px solid #000; 
            padding: 10px; 
            background: #f8f8f8; 
          }
          .info-section h3 { 
            margin: 0 0 8px 0; 
            font-size: 13px; 
            font-weight: bold; 
            text-decoration: underline; 
          }
          .info-item { 
            margin: 3px 0; 
            font-size: 11px; 
          }
          .sections-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            font-size: 10px; 
          }
          .sections-table th, .sections-table td { 
            border: 1px solid #000; 
            padding: 6px 5px; 
            text-align: left; 
          }
          .sections-table th { 
            background: #e0e0e0; 
            font-weight: bold; 
            text-align: center; 
          }
          .section-header { 
            background: #f0f0f0; 
            font-weight: bold; 
            text-align: center; 
          }
          .status-ok { 
            text-align: center; 
            font-weight: bold; 
          }
          .technical-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
            font-size: 10px; 
          }
          .technical-table th, .technical-table td { 
            border: 1px solid #000; 
            padding: 5px; 
            text-align: left; 
          }
          .technical-table th { 
            background: #e9e9e9; 
            font-weight: bold; 
            text-align: center; 
          }
          .page-break { 
            page-break-before: always; 
          }
          .signature-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 2px solid #000; 
          }
          .signature-box { 
            flex: 1; 
            text-align: center; 
            padding: 10px; 
            border: 1px solid #ccc; 
            margin: 0 10px; 
          }
          .signature-box h4 { 
            margin: 0 0 10px 0; 
            font-size: 12px; 
          }
          .signature-placeholder { 
            height: 60px; 
            border: 1px dashed #999; 
            margin: 10px 0; 
          }
        </style>
      </head>
      <body>
        <!-- PAGE 1 -->
        <div class="header">
          <div class="company-name">ASCOMP ELECTRONICS PVT. LTD.</div>
          <div class="report-details">
            <div><strong>Report No:</strong> ${reportNumber}</div>
            <div><strong>Date:</strong> ${reportDate} ${reportTime}</div>
          </div>
        </div>

        <div class="report-title">${reportType}</div>

        <div class="info-section">
          <h3>Cinema Information</h3>
          <div class="info-item"><strong>Cinema Name:</strong> ${cinemaName}</div>
          ${address ? `<div class="info-item"><strong>Address:</strong> ${address}</div>` : ''}
          ${location ? `<div class="info-item"><strong>Location:</strong> ${location}</div>` : ''}
          ${contactDetails ? `<div class="info-item"><strong>Contact:</strong> ${contactDetails}</div>` : ''}
        </div>

        <div class="info-section">
          <h3>Projector Information</h3>
          ${serialNumber ? `<div class="info-item"><strong>Serial Number:</strong> ${serialNumber}</div>` : ''}
          ${projectorModelSerialAndHours ? `<div class="info-item"><strong>Model/Hours:</strong> ${projectorModelSerialAndHours}</div>` : ''}
        </div>

        <div class="info-section">
          <h3>Engineer Information</h3>
          <div class="info-item"><strong>Name:</strong> ${engineerName}</div>
          ${engineerPhone ? `<div class="info-item"><strong>Phone:</strong> ${engineerPhone}</div>` : ''}
          ${engineerEmail ? `<div class="info-item"><strong>Email:</strong> ${engineerEmail}</div>` : ''}
        </div>

        ${checklistHTML}

        <!-- PAGE 2 -->
        <div class="page-break"></div>
        
        <div class="header">
          <div class="company-name">ASCOMP ELECTRONICS PVT. LTD.</div>
          <div class="report-details">
            <div><strong>Report No:</strong> ${reportNumber}</div>
            <div><strong>Page:</strong> 2</div>
          </div>
        </div>

        <h3 style="margin-top: 15px;">Additional Information</h3>

        ${lampInfo.makeAndModel || lampInfo.numberOfLampsRunning || lampInfo.currentLampRunningHours ? `
        <table class="technical-table">
          <thead>
            <tr>
              <th colspan="3">Lamp Information</th>
            </tr>
          </thead>
          <tbody>
            ${lampInfo.makeAndModel ? `<tr><td><strong>Make & Model:</strong></td><td colspan="2">${lampInfo.makeAndModel}</td></tr>` : ''}
            ${lampInfo.numberOfLampsRunning ? `<tr><td><strong>Number of Lamps Running:</strong></td><td colspan="2">${lampInfo.numberOfLampsRunning}</td></tr>` : ''}
            ${lampInfo.currentLampRunningHours ? `<tr><td><strong>Current Lamp Hours:</strong></td><td colspan="2">${lampInfo.currentLampRunningHours}</td></tr>` : ''}
          </tbody>
        </table>
        ` : ''}

        ${voltageParameters.pVsN || voltageParameters.pVsE || voltageParameters.nVsE ? `
        <table class="technical-table">
          <thead>
            <tr>
              <th colspan="3">Voltage Parameters</th>
            </tr>
          </thead>
          <tbody>
            ${voltageParameters.pVsN ? `<tr><td><strong>P vs N:</strong></td><td colspan="2">${voltageParameters.pVsN}</td></tr>` : ''}
            ${voltageParameters.pVsE ? `<tr><td><strong>P vs E:</strong></td><td colspan="2">${voltageParameters.pVsE}</td></tr>` : ''}
            ${voltageParameters.nVsE ? `<tr><td><strong>N vs E:</strong></td><td colspan="2">${voltageParameters.nVsE}</td></tr>` : ''}
          </tbody>
        </table>
        ` : ''}

        ${report.remarks ? `
        <div class="info-section">
          <h3>Remarks</h3>
          <div class="info-item">${report.remarks}</div>
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <h4>Engineer Signature</h4>
            <div class="signature-placeholder"></div>
            <div>${engineerName}</div>
            <div>${reportDate}</div>
          </div>
          <div class="signature-box">
            <h4>Client Signature & Stamp</h4>
            <div class="signature-placeholder"></div>
            <div>${reportDate}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
          This is a system-generated report from ASCOMP Electronics Pvt. Ltd.
        </div>
      </body>
    </html>
    `;

    return fullHTML;
  }
}

module.exports = ASCOMPPdfGeneratorService;









