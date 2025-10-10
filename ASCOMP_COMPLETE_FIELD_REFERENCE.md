# ASCOMP Complete Field Reference - All Pages

## 📄 **Page 1 - Header & Checklist**

### Header Section:
- `{reportNumber}` - Report number
- `{date}` - Date
- `{cinemaName}` - Cinema name
- `{address}` - Full address
- `{contactDetails}` - Contact details
- `{location}` - Location
- `{serialNumber}` - Screen No.
- `{equipAndEWServiceVisit}` - Engg and EW Service visit
- `{projectorModelSerialAndHours}` - Projector Model, Serial No. and Running Hours
- `{replacementRequired}` - Replacement Required

### Checklist Table (52 fields):

**OPTICALS:**
- `{OPT_REFLECTOR_STATUS}` + `{OPT_REFLECTOR_OK}`
- `{OPT_UVFILTER_STATUS}` + `{OPT_UVFILTER_OK}`
- `{OPT_INTROD_STATUS}` + `{OPT_INTROD_OK}`
- `{OPT_COLDMIRROR_STATUS}` + `{OPT_COLDMIRROR_OK}`
- `{OPT_FOLDMIRROR_STATUS}` + `{OPT_FOLDMIRROR_OK}`

**ELECTRONICS:**
- `{ELEC_TOUCHPANEL_STATUS}` + `{ELEC_TOUCHPANEL_OK}`
- `{ELEC_EVBIMCB_STATUS}` + `{ELEC_EVBIMCB_OK}`
- `{ELEC_PIBICP_STATUS}` + `{ELEC_PIBICP_OK}`
- `{ELEC_IMB2_STATUS}` + `{ELEC_IMB2_OK}`

**Serial Number Verified:**
- `{SERIAL_VERIFIED_STATUS}` + `{SERIAL_VERIFIED_OK}`

**Disposable Consumables:**
- `{DISPOSABLE_STATUS}` + `{DISPOSABLE_OK}`

**Coolant:**
- `{COOLANT_LEVEL_STATUS}` + `{COOLANT_LEVEL_OK}`
- `{COOLANT_WHITE_STATUS}` + `{COOLANT_WHITE_OK}`
- `{COOLANT_RED_STATUS}` + `{COOLANT_RED_OK}`

**Light Engine Test Pattern:**
- `{LE_GREEN_STATUS}` + `{LE_GREEN_OK}`
- `{LE_BLUE_STATUS}` + `{LE_BLUE_OK}`
- `{LE_BLACK_STATUS}` + `{LE_BLACK_OK}`

**MECHANICAL:**
- `{MECH_ACBLOWER_STATUS}` + `{MECH_ACBLOWER_OK}`
- `{MECH_EXTRACTOR_STATUS}` + `{MECH_EXTRACTOR_OK}`
- `{MECH_EXHAUSTCFM_STATUS}` + `{MECH_EXHAUSTCFM_OK}`
- `{MECH_LEFANS_STATUS}` + `{MECH_LEFANS_OK}`
- `{MECH_CARDCAGE_STATUS}` + `{MECH_CARDCAGE_OK}`
- `{MECH_RADIATOR_STATUS}` + `{MECH_RADIATOR_OK}`
- `{MECH_CONNECTOR_STATUS}` + `{MECH_CONNECTOR_OK}`
- `{MECH_SECURITY_STATUS}` + `{MECH_SECURITY_OK}`

**Lamp LOC Mechanism:**
- `{LAMP_LOC_STATUS}` + `{LAMP_LOC_OK}`

---

## 📄 **Page 2 - Technical Details**

### Projector Placement:
- `{projectorPlacement}` - Projector placement, room and environment

### Lamp Information:
- `{lampMakeModel}` - Lamp Make and Model
- `{numberOfLamps}` - Number of hours running
- `{currentLampHours}` - Current lamp running hours

### Voltage Parameters:
- `{voltagePN}` - P vs N
- `{voltagePE}` - P vs E
- `{voltageNE}` - N vs E

### Measurements:
- `{flMeasurements}` - fL measurements

### Content Player:
- `{contentPlayerModel}` - Content Player Model
- `{acStatus}` - AC Status: Working – Not Working – Not Available

### LE Status:
- `{leStatusDuringPM}` - LE Status during PM: Removed – Not removed, Good fL – Not removed, DE-bonded

### Remarks:
- `{remarks}` - Remarks
- `{leSNo}` - LE S. No.

### Software Version Table:
- `{softwareW2K}` - W2K /4K - MCGD
- `{softwareW2KFl}` - W2K /4K - fL
- `{softwareW2KX}` - W2K /4K - x
- `{softwareW2KY}` - W2K /4K - y
- `{softwareR2K}` - R2K /4K - MCGD
- `{softwareR2KFl}` - R2K /4K - fL
- `{softwareR2KX}` - R2K /4K - x
- `{softwareR2KY}` - R2K /4K - y
- `{softwareG2K}` - G2K /4K - MCGD
- `{softwareG2KFl}` - G2K /4K - fL
- `{softwareG2KX}` - G2K /4K - x
- `{softwareG2KY}` - G2K /4K - y
- `{softwareB2K}` - B2K /4K - MCGD (if exists)
- `{softwareB2KFl}` - B2K /4K - fL
- `{softwareB2KX}` - B2K /4K - x
- `{softwareB2KY}` - B2K /4K - y

### Screen Information:
- `{screenScopeHeight}` - SCOPE - Height
- `{screenScopeWidth}` - SCOPE - Width
- `{screenScopeGain}` - SCOPE - Gain
- `{screenFlatHeight}` - FLAT - Height
- `{screenFlatWidth}` - FLAT - Width
- `{screenFlatGain}` - FLAT - Gain
- `{screenMake}` - Screen Make
- `{throwDistance}` - Throw Distance

### Image Evaluation (OK - Yes/No):
- `{focusBoresight}` - Focus/boresite
- `{integratorPosition}` - Integrator Position
- `{spotOnScreen}` - Any Spot on the Screen after PPM
- `{screenCropping}` - Check Screen Cropping - FLAT and SCOPE
- `{convergenceChecked}` - Convergence Checked
- `{channelsChecked}` - Channels Checked - Scope, Flat, Alternative
- `{pixelDefects}` - Pixel defects
- `{imageVibration}` - Excessive image vibration
- `{liteLoc}` - LiteLOC

### CIE XYZ Color Accuracy:
- `{cieBwStepX}` - BW Step 10 2K /4K - x
- `{cieBwStepY}` - BW Step 10 2K /4K - y
- `{cieBwStepFl}` - BW Step 10 2K /4K - fL

### Air Pollution Level:
- `{hcho}` - HCHO
- `{tvoc}` - TVOC
- `{pm10}` - PM1.0
- `{pm25}` - PM2.5
- `{pm10Full}` - PM10
- `{temperature}` - Temperature C
- `{humidity}` - Humidity %

### Signatures:
- `{clientSignature}` - Client's Signature & Stamp
- `{engineerName}` - Engineer's Signature

---

## 🎯 **Total Fields: 100+**

All fields use `{curly braces}` for `docxtemplater` compatibility.

## 📝 **Note:**
The WordTemplateService already maps most of these fields. Some additional fields from Page 2 may need to be added to the service's `prepareTemplateData()` method.







