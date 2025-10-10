const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

class WordTemplateService {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates');
    this.ensureTemplateDir();
  }

  ensureTemplateDir() {
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true });
    }
  }

  /**
   * Save uploaded Word template
   * @param {Buffer} templateBuffer - The Word template file buffer
   * @param {string} templateName - Name for the template
   * @returns {Promise<string>} Path to saved template
   */
  async saveTemplate(templateBuffer, templateName) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.docx`);
      fs.writeFileSync(templatePath, templateBuffer);
      console.log(`✅ Template saved: ${templatePath}`);
      return templatePath;
    } catch (error) {
      console.error('❌ Error saving template:', error);
      throw new Error(`Failed to save template: ${error.message}`);
    }
  }

  /**
   * Generate Word document from template and data
   * @param {string} templateName - Name of the template to use
   * @param {Object} data - Data to fill in the template
   * @returns {Promise<Buffer>} Generated Word document as buffer
   */
  async generateDocument(templateName, data) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.docx`);
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Load the template
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      
      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '', // Return empty string for null values
      });

      // Prepare data for template
      const templateData = this.prepareTemplateData(data);

      // Fill the template with data
      doc.render(templateData);

      // Generate the document
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log(`✅ Document generated successfully from template: ${templateName}`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating document:', error);
      
      // Provide more detailed error information
      if (error.properties && error.properties.errors) {
        const errorMessages = error.properties.errors.map(err => 
          `${err.message} at ${err.part}`
        ).join(', ');
        throw new Error(`Template error: ${errorMessages}`);
      }
      
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  }

  /**
   * Prepare data for Word template placeholders
   * @param {Object} reportData - Raw report data
   * @returns {Object} Formatted data for template
   */
  prepareTemplateData(reportData) {
    return {
      // Header Information
      reportNumber: reportData.reportNumber || '',
      reportType: reportData.reportType || 'EW - Preventive Maintenance Report',
      date: this.formatDate(reportData.date),
      
      // Cinema Details
      cinemaName: reportData.cinemaName || '',
      address: reportData.address || '',
      contactDetails: reportData.contactDetails || '',
      location: reportData.location || '',
      
      // Serial Information
      serialNumber: reportData.serialNumber || '',
      equipAndEWServiceVisit: reportData.equipAndEWServiceVisit || '',
      projectorModelSerialAndHours: reportData.projectorModelSerialAndHours || '',
      replacementRequired: reportData.replacementRequired ? '☑' : '☐',
      
      // Opticals (convert to table-friendly format)
      opticals: this.formatChecklistSection(reportData.opticals, [
        'reflector', 'uvFilter', 'integratorRod', 'coldMirror', 'foldMirror'
      ], [
        'Reflector', 'UV filter', 'Integrator Rod', 'Cold Mirror', 'Fold Mirror'
      ]),
      
      // Electronics
      electronics: this.formatChecklistSection(reportData.electronics, [
        'touchPanel', 'evbAndImcbBoard', 'pibAndIcpBoard', 'imb2Board'
      ], [
        'Touch Panel', 'EVB and IMCB Board', 'PIB and ICP Board', 'IMB-2 Board'
      ]),
      
      // Serial Number Verified
      serialNumberVerified: reportData.serialNumberVerified?.chassisLabelVsTouchPanel?.status || '',
      serialNumberVerifiedOk: reportData.serialNumberVerified?.chassisLabelVsTouchPanel?.yesNoOk || '',
      
      // Disposable Consumables
      disposableConsumables: reportData.disposableConsumables?.airIntakeLadAndRad?.status || '',
      disposableConsumablesOk: reportData.disposableConsumables?.airIntakeLadAndRad?.yesNoOk || '',
      
      // Coolant
      coolantLevel: reportData.coolant?.levelAndColor?.status || '',
      coolantLevelOk: reportData.coolant?.levelAndColor?.yesNoOk || '',
      coolantWhite: reportData.coolant?.white?.status || '',
      coolantWhiteOk: reportData.coolant?.white?.yesNoOk || '',
      coolantRed: reportData.coolant?.red?.status || '',
      coolantRedOk: reportData.coolant?.red?.yesNoOk || '',
      
      // Light Engine Test Pattern
      lightEngineGreen: reportData.lightEngineTestPattern?.green?.status || '',
      lightEngineGreenOk: reportData.lightEngineTestPattern?.green?.yesNoOk || '',
      lightEngineBlue: reportData.lightEngineTestPattern?.blue?.status || '',
      lightEngineBlueOk: reportData.lightEngineTestPattern?.blue?.yesNoOk || '',
      lightEngineBlack: reportData.lightEngineTestPattern?.black?.status || '',
      lightEngineBlackOk: reportData.lightEngineTestPattern?.black?.yesNoOk || '',
      
      // Mechanical
      mechanical: this.formatChecklistSection(reportData.mechanical, [
        'acBlowerAndVaneSwitch', 'extractorVaneSwitch', 'exhaustCfmValue',
        'lightEngineFansWithLadFan', 'cardCageTopAndBottomFans', 'radiatorFanAndPump',
        'connectorAndHoseForPump', 'securityAndLampHouseLockSwitch'
      ], [
        'AC Blower and Vane Switch', 'Extractor Vane Switch', 'Exhaust CFM - Value',
        "Light Engine's fans with LAD fan", 'Card Cage Top and Bottom fans', 'Radiator fan and Pump',
        'Connector and hose for the Pump', 'Security and lamp house lock switch'
      ]),
      
      // Lamp LOC Mechanism
      lampLocMovement: reportData.lampLocMechanism?.xAndZMovement?.status || '',
      lampLocMovementOk: reportData.lampLocMechanism?.xAndZMovement?.yesNoOk || '',
      
      // Page 2 - Technical Details
      projectorPlacement: reportData.projectorPlacementRoomAndEnvironment || '',
      
      // Lamp Information
      lampMakeModel: reportData.lampInfo?.makeAndModel || '',
      numberOfLamps: reportData.lampInfo?.numberOfLampsRunning || '',
      currentLampHours: reportData.lampInfo?.currentLampRunningHours || '',
      
      // Voltage Parameters
      voltagePN: reportData.voltageParameters?.pVsN || '',
      voltagePE: reportData.voltageParameters?.pVsE || '',
      voltageNE: reportData.voltageParameters?.nVsE || '',
      
      // Measurements
      flMeasurements: reportData.flMeasurements || '',
      contentPlayerModel: reportData.contentPlayerModel || '',
      acStatus: reportData.acStatus || '',
      leStatusDuringPM: reportData.leStatusDuringPM || '',
      remarks: reportData.remarks || '',
      leSNo: reportData.leSNo || '',
      
      // Software Version
      softwareW2K: reportData.softwareVersion?.w2k4k?.mcgd || '',
      softwareW2KFl: reportData.softwareVersion?.w2k4k?.fl || '',
      softwareW2KX: reportData.softwareVersion?.w2k4k?.x || '',
      softwareW2KY: reportData.softwareVersion?.w2k4k?.y || '',
      softwareR2K: reportData.softwareVersion?.r2k4k?.mcgd || '',
      softwareR2KFl: reportData.softwareVersion?.r2k4k?.fl || '',
      softwareR2KX: reportData.softwareVersion?.r2k4k?.x || '',
      softwareR2KY: reportData.softwareVersion?.r2k4k?.y || '',
      softwareG2K: reportData.softwareVersion?.g2k4k?.mcgd || '',
      softwareG2KFl: reportData.softwareVersion?.g2k4k?.fl || '',
      softwareG2KX: reportData.softwareVersion?.g2k4k?.x || '',
      softwareG2KY: reportData.softwareVersion?.g2k4k?.y || '',
      
      // Screen Information
      screenScopeHeight: reportData.screenInformation?.scope?.height || '',
      screenScopeWidth: reportData.screenInformation?.scope?.width || '',
      screenScopeGain: reportData.screenInformation?.scope?.gain || '',
      screenFlatHeight: reportData.screenInformation?.flat?.height || '',
      screenFlatWidth: reportData.screenInformation?.flat?.width || '',
      screenFlatGain: reportData.screenInformation?.flat?.gain || '',
      screenMake: reportData.screenInformation?.screenMake || '',
      throwDistance: reportData.screenInformation?.throwDistance || '',
      
      // Image Evaluation
      focusBoresight: reportData.imageEvaluation?.focusBoresight || 'N/A',
      integratorPosition: reportData.imageEvaluation?.integratorPosition || 'N/A',
      spotOnScreen: reportData.imageEvaluation?.spotOnScreen || 'N/A',
      screenCropping: reportData.imageEvaluation?.screenCropping || 'N/A',
      convergenceChecked: reportData.imageEvaluation?.convergenceChecked || 'N/A',
      channelsChecked: reportData.imageEvaluation?.channelsChecked || 'N/A',
      pixelDefects: reportData.imageEvaluation?.pixelDefects || 'N/A',
      imageVibration: reportData.imageEvaluation?.imageVibration || 'N/A',
      liteLoc: reportData.imageEvaluation?.liteLoc || 'N/A',
      
      // CIE XYZ Color Accuracy
      cieBwStepX: reportData.cieXyzColorAccuracy?.bwStep?.x || '',
      cieBwStepY: reportData.cieXyzColorAccuracy?.bwStep?.y || '',
      cieBwStepFl: reportData.cieXyzColorAccuracy?.bwStep?.fl || '',
      cie10_2k4kX: reportData.cieXyzColorAccuracy?._10_2k4k?.x || '',
      cie10_2k4kY: reportData.cieXyzColorAccuracy?._10_2k4k?.y || '',
      cie10_2k4kFl: reportData.cieXyzColorAccuracy?._10_2k4k?.fl || '',
      
      // Air Pollution Level
      hcho: reportData.airPollutionLevel?.hcho || '',
      tvoc: reportData.airPollutionLevel?.tvoc || '',
      pm10: reportData.airPollutionLevel?.pm10 || '',
      pm25: reportData.airPollutionLevel?.pm25 || '',
      pm10Full: reportData.airPollutionLevel?.pm10_full || '',
      temperature: reportData.airPollutionLevel?.temperature || '',
      humidity: reportData.airPollutionLevel?.humidityPercent || '',
      
      // Engineer Information
      engineerName: reportData.engineer?.name || '',
      engineerPhone: reportData.engineer?.phone || '',
      engineerEmail: reportData.engineer?.email || '',
      
      // Observations
      observations: reportData.observations || '',
      
      // Signatures (if you want to include them as text)
      clientSignature: reportData.clientSignatureAndStamp?.name || '',
      engineerSignature: reportData.engineer?.name || '',
    };
  }

  /**
   * Format checklist section for Word template
   */
  formatChecklistSection(sectionData, keys, labels) {
    if (!sectionData) return [];
    
    return keys.map((key, index) => ({
      description: labels[index],
      status: sectionData[key]?.status || '',
      yesNoOk: sectionData[key]?.yesNoOk || ''
    }));
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * List all available templates
   */
  listTemplates() {
    try {
      const files = fs.readdirSync(this.templateDir);
      return files
        .filter(file => file.endsWith('.docx'))
        .map(file => ({
          name: file.replace('.docx', ''),
          path: path.join(this.templateDir, file),
          size: fs.statSync(path.join(this.templateDir, file)).size,
          modified: fs.statSync(path.join(this.templateDir, file)).mtime
        }));
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateName) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.docx`);
      if (fs.existsSync(templatePath)) {
        fs.unlinkSync(templatePath);
        console.log(`✅ Template deleted: ${templateName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }
}

module.exports = new WordTemplateService();







