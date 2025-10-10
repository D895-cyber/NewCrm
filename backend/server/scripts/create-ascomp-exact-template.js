/**
 * Create ASCOMP Word Template with Exact Format
 * Based on the user's document structure
 */

const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

function createASCOMPTemplate() {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    
    <!-- Logo/Company Header Box -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12"/>
          <w:left w:val="single" w:sz="12"/>
          <w:bottom w:val="single" w:sz="12"/>
          <w:right w:val="single" w:sz="12"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0066CC"/></w:rPr>
              <w:t>ASCOMP INC.</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
              <w:t>EW - Preventive Maintenance Report</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
            <w:r>
              <w:rPr><w:sz w:val="18"/></w:rPr>
              <w:t>Address: 9, Community Centre, 2nd Floor, Phase I, Mayapuri, New Delhi, Delhi 110064</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
            <w:r>
              <w:rPr><w:sz w:val="18"/></w:rPr>
              <w:t>Landline: 011-45501226 | Mobile: 8882475207</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
            <w:r>
              <w:rPr><w:sz w:val="18"/></w:rPr>
              <w:t>Email: helpdesk@ascompinc.in | www.ascompinc.in</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
    
    <!-- Cinema Name and Date Table -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8"/>
          <w:left w:val="single" w:sz="8"/>
          <w:bottom w:val="single" w:sz="8"/>
          <w:right w:val="single" w:sz="8"/>
          <w:insideH w:val="single" w:sz="6"/>
          <w:insideV w:val="single" w:sz="6"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>CINEMA NAME: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{cinemaName}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>DATE: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{date}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <!-- Address Row -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8"/>
          <w:left w:val="single" w:sz="8"/>
          <w:bottom w:val="single" w:sz="8"/>
          <w:right w:val="single" w:sz="8"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:shd w:fill="E7E6E6"/></w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Address: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{address}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <!-- Contact Details and Location -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8"/>
          <w:left w:val="single" w:sz="8"/>
          <w:bottom w:val="single" w:sz="8"/>
          <w:right w:val="single" w:sz="8"/>
          <w:insideV w:val="single" w:sz="6"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Contact Details: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{contactDetails}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>LOCATION: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{location}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <!-- Screen No and Service Visit -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8"/>
          <w:left w:val="single" w:sz="8"/>
          <w:bottom w:val="single" w:sz="8"/>
          <w:right w:val="single" w:sz="8"/>
          <w:insideV w:val="single" w:sz="6"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2000" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>SCREEN No: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{serialNumber}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3000" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Engg and EW Service visit: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{equipAndEWServiceVisit}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <!-- Projector Model and Replacement -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8"/>
          <w:left w:val="single" w:sz="8"/>
          <w:bottom w:val="single" w:sz="8"/>
          <w:right w:val="single" w:sz="8"/>
          <w:insideV w:val="single" w:sz="6"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Projector Model, Serial No. and Running Hours: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{projectorModelSerialAndHours}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1500" w:type="pct"/>
            <w:shd w:fill="E7E6E6"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Replacement Required: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>{replacementRequired}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <w:p><w:r><w:t></w:t></w:r></w:p>
    
    <!-- Main Checklist Table -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12"/>
          <w:left w:val="single" w:sz="12"/>
          <w:bottom w:val="single" w:sz="12"/>
          <w:right w:val="single" w:sz="12"/>
          <w:insideH w:val="single" w:sz="6"/>
          <w:insideV w:val="single" w:sz="6"/>
        </w:tblBorders>
      </w:tblPr>
      
      <!-- Header Row -->
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1500" w:type="pct"/>
            <w:shd w:fill="D9D9D9"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="100" w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>SECTIONS</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2000" w:type="pct"/>
            <w:shd w:fill="D9D9D9"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="100" w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>DESCRIPTION</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="750" w:type="pct"/>
            <w:shd w:fill="D9D9D9"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="100" w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>STATUS</w:t></w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="750" w:type="pct"/>
            <w:shd w:fill="D9D9D9"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="100" w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>YES/NO - OK</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
      
      <!-- OPTICALS -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>OPTICALS</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Reflector</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_REFLECTOR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_REFLECTOR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>UV filter</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_UVFILTER_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_UVFILTER_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Integrator Rod</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_INTROD_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_INTROD_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cold Mirror</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_COLDMIRROR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_COLDMIRROR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Fold Mirror</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_FOLDMIRROR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{OPT_FOLDMIRROR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- ELECTRONICS -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>ELECTRONICS</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Touch Panel</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_TOUCHPANEL_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_TOUCHPANEL_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>EVB and IMCB Board</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_EVBIMCB_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_EVBIMCB_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>PIB and ICP Board</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_PIBICP_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_PIBICP_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>IMB/S Board</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_IMB2_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{ELEC_IMB2_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- Serial Number Verified -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Serial Number verified</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Chassis label vs Touch Panel</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{SERIAL_VERIFIED_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{SERIAL_VERIFIED_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- Disposable Consumables -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Disposable Consumables</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Air Intake, LAD and RAD</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{DISPOSABLE_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{DISPOSABLE_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- Coolant -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Coolant</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Level and Color</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_LEVEL_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_LEVEL_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- Light Engine Test Pattern -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Light Engine Test Pattern</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>White</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_WHITE_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_WHITE_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Red</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_RED_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{COOLANT_RED_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Green</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_GREEN_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_GREEN_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Blue</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_BLUE_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_BLUE_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Black</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_BLACK_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LE_BLACK_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- MECHANICAL -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>MECHANICAL</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>AC blower and Vane Switch</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_ACBLOWER_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_ACBLOWER_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Extractor Vane Switch</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_EXTRACTOR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_EXTRACTOR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Exhaust CFM - Value</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_EXHAUSTCFM_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_EXHAUSTCFM_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Light Engine 4 fans with LAD fan</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_LEFANS_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_LEFANS_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Card Cage Top and Bottom fans</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_CARDCAGE_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_CARDCAGE_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Radiator fan and Pump</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_RADIATOR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_RADIATOR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Connector and hose for the Pump</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_CONNECTOR_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_CONNECTOR_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Security and lamp house lock switch</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_SECURITY_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{MECH_SECURITY_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
      
      <!-- Lamp LOC Mechanism -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Lamp LOC Mechanism</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>X, Y and Z movement</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LAMP_LOC_STATUS}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{LAMP_LOC_OK}</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    
    <w:p><w:r><w:t></w:t></w:r></w:p>
    
    <!-- Projector Placement -->
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Projector placement, room and environment:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{projectorPlacement}</w:t></w:r>
    </w:p>
    
    <w:p><w:r><w:t></w:t></w:r></w:p>
    
    <!-- Air Pollution Level Table -->
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Air Pollution Level</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4"/>
          <w:left w:val="single" w:sz="4"/>
          <w:bottom w:val="single" w:sz="4"/>
          <w:right w:val="single" w:sz="4"/>
          <w:insideH w:val="single" w:sz="4"/>
          <w:insideV w:val="single" w:sz="4"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>HCHO</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>TVOC</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>PM1.0</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>PM2.5</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>PM10</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Temperature C</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Humidity %</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>{hcho}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{tvoc}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{pm10}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{pm25}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{pm10Full}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{temperature}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>{humidity}</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    
    <!-- Signatures -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Client's Signature &amp; Stamp</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>{clientSignature}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:t>Engineer's Signature</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>{engineerName}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="16"/></w:rPr>
        <w:t>PM Report Version 6.3.5</w:t>
      </w:r>
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

  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function main() {
  try {
    console.log('📝 Creating ASCOMP Template with Exact Format...\n');
    
    const templatePath = path.join(__dirname, '../templates/ASCOMP_EW_Report.docx');
    
    // Backup existing template if present
    if (fs.existsSync(templatePath)) {
      const backupPath = templatePath.replace('.docx', '_backup.docx');
      fs.copyFileSync(templatePath, backupPath);
      console.log('📋 Backed up existing template to:', backupPath);
    }
    
    const buffer = createASCOMPTemplate();
    fs.writeFileSync(templatePath, buffer);
    
    console.log('✅ ASCOMP Template Created Successfully!');
    console.log('📁 Location:', templatePath);
    console.log('\n📊 Template Structure:');
    console.log('   ✓ Company header and contact details');
    console.log('   ✓ Cinema name, date, address fields');
    console.log('   ✓ Contact details and location');
    console.log('   ✓ Screen number and service visit type');
    console.log('   ✓ Projector model and replacement required');
    console.log('   ✓ Complete checklist table:');
    console.log('     - OPTICALS (5 items)');
    console.log('     - ELECTRONICS (4 items)');
    console.log('     - Serial Number Verified');
    console.log('     - Disposable Consumables');
    console.log('     - Coolant');
    console.log('     - Light Engine Test Pattern (5 colors)');
    console.log('     - MECHANICAL (8 items)');
    console.log('     - Lamp LOC Mechanism');
    console.log('   ✓ Projector placement field');
    console.log('   ✓ Air pollution level table');
    console.log('   ✓ Client and Engineer signatures');
    console.log('   ✓ Version footer');
    console.log('\n🎉 Template matches your exact document structure!');
    console.log('   Test it now by downloading a report from the app!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { createASCOMPTemplate };

