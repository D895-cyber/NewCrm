const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const officeToPdf = require('office-to-pdf');

const ServiceReport = require('../models/ServiceReport');
const cloudinary = require('cloudinary').v2;

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const TEMP_DIR = path.resolve(__dirname, '../../tmp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const ensureTemplateFields = (templateBuffer, data) => {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  doc.setData(data);
  doc.render();
  return doc.getZip().generate({ type: 'nodebuffer' });
};

const applyTokenReplacements = (buffer, replacements = {}) => {
  if (!replacements || Object.keys(replacements).length === 0) {
    return buffer;
  }

  let content = buffer.toString('binary');
  Object.entries(replacements).forEach(([token, value]) => {
    if (!token) return;
    const regex = new RegExp(`\[${token}\]`, 'g');
    content = content.replace(regex, (value ?? '').toString());
  });

  return Buffer.from(content, 'binary');
};

const uploadToCloudinary = async (buffer, filename, folder, resourceType = 'raw') => {
  const tempPath = path.join(TEMP_DIR, filename);
  await writeFileAsync(tempPath, buffer);

  try {
    const result = await cloudinary.uploader.upload(tempPath, {
      folder,
      resource_type: resourceType,
      public_id: path.parse(filename).name
    });

    return {
      filename: result.public_id,
      cloudUrl: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes
    };
  } finally {
    await unlinkAsync(tempPath).catch(() => {});
  }
};

const convertDocxToPdf = async (docBuffer) => {
  try {
    const pdfBuffer = await officeToPdf(docBuffer);
    return pdfBuffer;
  } catch (error) {
    console.warn('DOCX to PDF conversion failed:', error.message);
    return null;
  }
};

const buildTemplateData = (report) => {
  const plainReport = report.toObject ? report.toObject() : report;

  // Handle ASCOMP data structure - ensure both sections and inspectionSections are available
  if (plainReport.sections && !plainReport.inspectionSections) {
    plainReport.inspectionSections = {
      opticals: plainReport.sections.opticals || [],
      electronics: plainReport.sections.electronics || [],
      mechanical: plainReport.sections.mechanical || []
    };
  } else if (plainReport.inspectionSections && !plainReport.sections) {
    plainReport.sections = {
      opticals: plainReport.inspectionSections.opticals || [],
      electronics: plainReport.inspectionSections.electronics || [],
      mechanical: plainReport.inspectionSections.mechanical || []
    };
  }

  return {
    ...plainReport,
    reportDate: plainReport.date ? new Date(plainReport.date).toLocaleDateString('en-IN') : '',
    engineerName: plainReport.engineer?.name || '',
    engineerEmail: plainReport.engineer?.email || '',
    engineerPhone: plainReport.engineer?.phone || '',
    siteInchargeName: plainReport.siteIncharge?.name || '',
    siteInchargeContact: plainReport.siteIncharge?.contact || '',
    observationsList: (plainReport.observations || []).map((obs, index) => ({
      position: index + 1,
      description: obs.description || obs || ''
    })),
    recommendedPartsList: (plainReport.recommendedParts || []).map((part, index) => ({
      position: index + 1,
      partName: part.partName || '',
      partNumber: part.partNumber || ''
    })),
    // ASCOMP-specific data for report generation
    opticalsList: (plainReport.sections?.opticals || plainReport.inspectionSections?.opticals || []).map((item, index) => ({
      position: index + 1,
      description: item.description || '',
      status: item.status || '',
      result: item.result || 'OK'
    })),
    electronicsList: (plainReport.sections?.electronics || plainReport.inspectionSections?.electronics || []).map((item, index) => ({
      position: index + 1,
      description: item.description || '',
      status: item.status || '',
      result: item.result || 'OK'
    })),
    mechanicalList: (plainReport.sections?.mechanical || plainReport.inspectionSections?.mechanical || []).map((item, index) => ({
      position: index + 1,
      description: item.description || '',
      status: item.status || '',
      result: item.result || 'OK'
    }))
  };
};

const safe = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  return value.toString();
};

const buildTokenReplacements = (data) => {
  const observationsBlock = (data.observationsList || [])
    .map((obs) => `${obs.position}. ${safe(obs.description)}`)
    .join('\n');

  const recommendedPartsBlock = (data.recommendedPartsList || [])
    .map((part) => `${part.position}. ${safe(part.partName)} (${safe(part.partNumber)})`)
    .join('\n');

  const opticalsBlock = (data.opticalsList || [])
    .map((item) => `${item.position}. ${safe(item.description)} - Status: ${safe(item.status)} - Result: ${safe(item.result)}`)
    .join('\n');

  const electronicsBlock = (data.electronicsList || [])
    .map((item) => `${item.position}. ${safe(item.description)} - Status: ${safe(item.status)} - Result: ${safe(item.result)}`)
    .join('\n');

  const mechanicalBlock = (data.mechanicalList || [])
    .map((item) => `${item.position}. ${safe(item.description)} - Status: ${safe(item.status)} - Result: ${safe(item.result)}`)
    .join('\n');

  const environmentSummary = [
    data.environmentalConditions?.temperature ? `Temp: ${data.environmentalConditions.temperature}` : null,
    data.environmentalConditions?.humidity ? `Humidity: ${data.environmentalConditions.humidity}` : null,
    data.airPollutionLevel?.overall ? `Air Quality: ${data.airPollutionLevel.overall}` : null
  ].filter(Boolean).join(' | ');

  return {
    REPORT_NUMBER: safe(data.reportNumber),
    REPORT_DATE: safe(data.reportDate),
    REPORT_TYPE: safe(data.reportType),
    SITE_NAME: safe(data.siteName),
    SITE_INCHARGE_NAME: safe(data.siteInchargeName),
    SITE_INCHARGE_CONTACT: safe(data.siteInchargeContact),
    ENGINEER_NAME: safe(data.engineerName),
    ENGINEER_EMAIL: safe(data.engineerEmail),
    ENGINEER_PHONE: safe(data.engineerPhone),
    PROJECTOR_MODEL: safe(data.projectorModel),
    PROJECTOR_SERIAL: safe(data.projectorSerial),
    PROJECTOR_BRAND: safe(data.brand),
    SOFTWARE_VERSION: safe(data.softwareVersion),
    PROJECTOR_RUNNING_HOURS: safe(data.projectorRunningHours),
    LAMP_MODEL: safe(data.lampModel),
    LAMP_RUNNING_HOURS: safe(data.lampRunningHours),
    CURRENT_LAMP_HOURS: safe(data.currentLampHours),
    LAMP_REPLACEMENT_REQUIRED: data.replacementRequired ? 'Yes' : 'No',
    VOLTAGE_P_VS_N: safe(data.voltageParameters?.pVsN),
    VOLTAGE_P_VS_E: safe(data.voltageParameters?.pVsE),
    VOLTAGE_N_VS_E: safe(data.voltageParameters?.nVsE),
    LAMP_FL_BEFORE_PM: safe(data.lampPowerMeasurements?.flBeforePM),
    LAMP_FL_AFTER_PM: safe(data.lampPowerMeasurements?.flAfterPM),
    AIR_HCHO: safe(data.airPollutionLevel?.hcho),
    AIR_TVOC: safe(data.airPollutionLevel?.tvoc),
    AIR_PM25: safe(data.airPollutionLevel?.pm25),
    AIR_PM10: safe(data.airPollutionLevel?.pm10),
    AIR_OVERALL: safe(data.airPollutionLevel?.overall),
    ROOM_TEMPERATURE: safe(data.environmentalConditions?.temperature),
    ROOM_HUMIDITY: safe(data.environmentalConditions?.humidity),
    CONTENT_SERVER: safe(data.contentPlayingServer),
    NOTES: safe(data.notes),
    SYSTEM_STATUS_LE: safe(data.systemStatus?.leStatus),
    SYSTEM_STATUS_AC: safe(data.systemStatus?.acStatus),
    OBSERVATIONS_BLOCK: observationsBlock,
    RECOMMENDED_PARTS_BLOCK: recommendedPartsBlock,
    ENVIRONMENT_SUMMARY: environmentSummary,
    // ASCOMP Section Blocks
    OPTICALS_BLOCK: opticalsBlock,
    ELECTRONICS_BLOCK: electronicsBlock,
    MECHANICAL_BLOCK: mechanicalBlock
  };
};

const generateFromTemplate = async ({ report, templateBuffer, options = {}, templateMappings = [] }) => {
  const data = buildTemplateData(report);
  const populatedDocx = ensureTemplateFields(templateBuffer, data);

  const tokenReplacements = {
    ...buildTokenReplacements(data)
  };

  (templateMappings || []).forEach(mapping => {
    if (!mapping?.token || !mapping?.dataPath) return;
    const value = mapping.dataPath.split('.').reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
        return acc[key];
      }
      return undefined;
    }, data);
    tokenReplacements[mapping.token] = safe(value, mapping.defaultValue || '');
  });

  const docxWithTokens = applyTokenReplacements(populatedDocx, tokenReplacements);

  let pdfBuffer = null;

  if (options.generatePdf) {
    pdfBuffer = await convertDocxToPdf(docxWithTokens);
  }

  return { docxBuffer: docxWithTokens, pdfBuffer };
};

const storeGeneratedFiles = async (report, { docxBuffer, pdfBuffer }, generatedBy = 'system') => {
  const timestamp = Date.now();
  const baseName = `${report.reportNumber || report._id}_${timestamp}`;

  let docUploadResult = null;
  let pdfUploadResult = null;

  if (docxBuffer) {
    docUploadResult = await uploadToCloudinary(
      docxBuffer,
      `${baseName}.docx`,
      'projectorcare/service-reports/generated-docs'
    );
  }

  if (pdfBuffer) {
    pdfUploadResult = await uploadToCloudinary(
      pdfBuffer,
      `${baseName}.pdf`,
      'projectorcare/service-reports/generated-pdfs'
    );
  }

  const updates = {};

  if (docUploadResult) {
    updates.generatedDocReport = {
      filename: `${baseName}.docx`,
      cloudUrl: docUploadResult.cloudUrl,
      publicId: docUploadResult.publicId,
      generatedAt: new Date(),
      generatedBy,
      fileSize: docUploadResult.bytes
    };
  }

  if (pdfUploadResult) {
    updates.generatedPdfReport = {
      filename: `${baseName}.pdf`,
      cloudUrl: pdfUploadResult.cloudUrl,
      publicId: pdfUploadResult.publicId,
      generatedAt: new Date(),
      generatedBy,
      fileSize: pdfUploadResult.bytes
    };
  }

  await ServiceReport.findByIdAndUpdate(report._id, updates, { new: true });

  return updates;
};

module.exports = {
  buildTemplateData,
  generateFromTemplate,
  storeGeneratedFiles
};

