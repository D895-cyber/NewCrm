/**
 * Create a simple default Word template for testing
 * This creates a basic .docx file with placeholders
 */

const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Simple function to create a minimal Word document
function createBasicWordTemplate() {
  // Create a minimal Word document XML structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>ASCOMP EW - Preventive Maintenance Report</w:t>
      </w:r>
    </w:p>
    
    <w:p><w:r><w:t>Report Number: {reportNumber}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Date: {date}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Cinema: {cinemaName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Address: {address}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Location: {location}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Serial Number: {serialNumber}</w:t></w:r></w:p>
    
    <w:p>
      <w:pPr><w:spacing w:before="240"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>OPTICALS</w:t>
      </w:r>
    </w:p>
    
    <w:p><w:r><w:t>Reflector: Status={OPT_REFLECTOR_STATUS}, OK={OPT_REFLECTOR_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>UV Filter: Status={OPT_UVFILTER_STATUS}, OK={OPT_UVFILTER_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Integrator Rod: Status={OPT_INTROD_STATUS}, OK={OPT_INTROD_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Cold Mirror: Status={OPT_COLDMIRROR_STATUS}, OK={OPT_COLDMIRROR_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Fold Mirror: Status={OPT_FOLDMIRROR_STATUS}, OK={OPT_FOLDMIRROR_OK}</w:t></w:r></w:p>
    
    <w:p>
      <w:pPr><w:spacing w:before="240"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>ELECTRONICS</w:t>
      </w:r>
    </w:p>
    
    <w:p><w:r><w:t>Touch Panel: Status={ELEC_TOUCHPANEL_STATUS}, OK={ELEC_TOUCHPANEL_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>EVB and IMCB Board: Status={ELEC_EVBIMCB_STATUS}, OK={ELEC_EVBIMCB_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>PIB and ICP Board: Status={ELEC_PIBICP_STATUS}, OK={ELEC_PIBICP_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>IMB-2 Board: Status={ELEC_IMB2_STATUS}, OK={ELEC_IMB2_OK}</w:t></w:r></w:p>
    
    <w:p>
      <w:pPr><w:spacing w:before="240"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>MECHANICAL</w:t>
      </w:r>
    </w:p>
    
    <w:p><w:r><w:t>AC Blower: Status={MECH_ACBLOWER_STATUS}, OK={MECH_ACBLOWER_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Extractor: Status={MECH_EXTRACTOR_STATUS}, OK={MECH_EXTRACTOR_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Exhaust CFM: Status={MECH_EXHAUSTCFM_STATUS}, OK={MECH_EXHAUSTCFM_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>LE Fans: Status={MECH_LEFANS_STATUS}, OK={MECH_LEFANS_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Card Cage: Status={MECH_CARDCAGE_STATUS}, OK={MECH_CARDCAGE_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Radiator: Status={MECH_RADIATOR_STATUS}, OK={MECH_RADIATOR_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Connector: Status={MECH_CONNECTOR_STATUS}, OK={MECH_CONNECTOR_OK}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Security: Status={MECH_SECURITY_STATUS}, OK={MECH_SECURITY_OK}</w:t></w:r></w:p>
    
    <w:p>
      <w:pPr><w:spacing w:before="480"/></w:pPr>
      <w:r><w:t>Engineer: {engineerName}</w:t></w:r>
    </w:p>
    
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Create ZIP structure
  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function createDefaultTemplate() {
  try {
    console.log('📝 Creating default ASCOMP template...\n');
    
    const templatePath = path.join(__dirname, '../templates/ASCOMP_EW_Report.docx');
    
    // Check if template already exists
    if (fs.existsSync(templatePath)) {
      console.log('⚠️  Template already exists at:', templatePath);
      console.log('   Delete it first if you want to recreate it.\n');
      return;
    }
    
    // Create the template
    const buffer = createBasicWordTemplate();
    
    // Save to disk
    fs.writeFileSync(templatePath, buffer);
    
    console.log('✅ Default template created successfully!');
    console.log('📁 Location:', templatePath);
    console.log('\n📋 Template includes placeholders for:');
    console.log('   - Basic report info (reportNumber, date, cinema, etc.)');
    console.log('   - OPTICALS section (5 items)');
    console.log('   - ELECTRONICS section (4 items)');
    console.log('   - MECHANICAL section (8 items)');
    console.log('   - Engineer information');
    console.log('\n💡 You can now test Word download from the app!');
    console.log('   Or replace this file with your custom template.\n');
    
  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createDefaultTemplate()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultTemplate };







