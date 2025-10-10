# ASCOMP Checklist Field Mapping Guide

## 📋 Overview

This guide explains how to automatically populate your Word template with all the checklist field mappings (OK/Not OK, Yes/No status fields) for the ASCOMP EW Report.

## 🚀 Quick Start

### Step 1: Run the Auto-Mapping Script

Open your terminal and run:

```bash
node backend/server/scripts/add-ascomp-checklist-mappings.js
```

This will automatically add **52 field mappings** to your uploaded template!

### Step 2: Prepare Your Word Template

Use the tokens below in your Word document template:

## 📝 Complete Token List for Your Word Template

### **OPTICALS Section** (5 items)

```
Description                     STATUS                          YES/NO-OK
─────────────────────────────────────────────────────────────────────────
Reflector                      [OPT_REFLECTOR_STATUS]          [OPT_REFLECTOR_OK]
UV filter                      [OPT_UVFILTER_STATUS]           [OPT_UVFILTER_OK]
Integrator Rod                 [OPT_INTROD_STATUS]             [OPT_INTROD_OK]
Cold Mirror                    [OPT_COLDMIRROR_STATUS]         [OPT_COLDMIRROR_OK]
Fold Mirror                    [OPT_FOLDMIRROR_STATUS]         [OPT_FOLDMIRROR_OK]
```

### **ELECTRONICS Section** (4 items)

```
Description                     STATUS                          YES/NO-OK
─────────────────────────────────────────────────────────────────────────
Touch Panel                    [ELEC_TOUCHPANEL_STATUS]        [ELEC_TOUCHPANEL_OK]
EVB and IMCB Board            [ELEC_EVBIMCB_STATUS]           [ELEC_EVBIMCB_OK]
PIB and ICP Board             [ELEC_PIBICP_STATUS]            [ELEC_PIBICP_OK]
IMB-2 Board                   [ELEC_IMB2_STATUS]              [ELEC_IMB2_OK]
```

### **MECHANICAL Section** (8 items)

```
Description                                         STATUS                      YES/NO-OK
───────────────────────────────────────────────────────────────────────────────────────────
AC Blower and Vane Switch                          [MECH_ACBLOWER_STATUS]      [MECH_ACBLOWER_OK]
Extractor Vane Switch                              [MECH_EXTRACTOR_STATUS]     [MECH_EXTRACTOR_OK]
Exhaust CFM - Value                                [MECH_EXHAUSTCFM_STATUS]    [MECH_EXHAUSTCFM_OK]
Light Engine's fans with LAD fan                   [MECH_LEFANS_STATUS]        [MECH_LEFANS_OK]
Card Cage Top and Bottom fans                      [MECH_CARDCAGE_STATUS]      [MECH_CARDCAGE_OK]
Radiator fan and Pump                              [MECH_RADIATOR_STATUS]      [MECH_RADIATOR_OK]
Connector and hose for the Pump                    [MECH_CONNECTOR_STATUS]     [MECH_CONNECTOR_OK]
Security and lamp house lock switch                [MECH_SECURITY_STATUS]      [MECH_SECURITY_OK]
```

### **Serial Number Verified**

```
Description                                         STATUS                          YES/NO-OK
─────────────────────────────────────────────────────────────────────────────────────────────
Chassis Label vs Touch Panel                       [SERIAL_VERIFIED_STATUS]        [SERIAL_VERIFIED_OK]
```

### **Disposable Consumables**

```
Description                                         STATUS                      YES/NO-OK
───────────────────────────────────────────────────────────────────────────────────────
Air Intake LAD and RAD                             [DISPOSABLE_STATUS]         [DISPOSABLE_OK]
```

### **Coolant Section** (3 items)

```
Description                     STATUS                      YES/NO-OK
─────────────────────────────────────────────────────────────────────
Level and Color                [COOLANT_LEVEL_STATUS]      [COOLANT_LEVEL_OK]
White                          [COOLANT_WHITE_STATUS]      [COOLANT_WHITE_OK]
Red                            [COOLANT_RED_STATUS]        [COOLANT_RED_OK]
```

### **Light Engine Test Pattern** (3 items)

```
Description                     STATUS                  YES/NO-OK
─────────────────────────────────────────────────────────────────
Green                          [LE_GREEN_STATUS]       [LE_GREEN_OK]
Blue                           [LE_BLUE_STATUS]        [LE_BLUE_OK]
Black                          [LE_BLACK_STATUS]       [LE_BLACK_OK]
```

### **Lamp LOC Mechanism**

```
Description                     STATUS                  YES/NO-OK
─────────────────────────────────────────────────────────────────
X & Z Movement                 [LAMP_LOC_STATUS]       [LAMP_LOC_OK]
```

## 📊 Complete Field Mapping Reference

### Data Paths Explanation

Each checklist item has **TWO fields**:

1. **STATUS Field**: What was done (Cleaned, Replaced, OK, etc.)
2. **YES/NO-OK Field**: The result (OK, Not OK, Yes, No, etc.)

### Example Data Structure

When an FSE fills the form:

```javascript
{
  opticals: {
    reflector: {
      status: "Cleaned",      // Maps to [OPT_REFLECTOR_STATUS]
      yesNoOk: "OK"          // Maps to [OPT_REFLECTOR_OK]
    }
  }
}
```

In the generated Word document:
```
Reflector     Cleaned     OK
```

## 🎯 Complete Mapping List

| Token | Data Path | Default | Description |
|-------|-----------|---------|-------------|
| `OPT_REFLECTOR_STATUS` | `opticals.reflector.status` | `-` | Reflector status |
| `OPT_REFLECTOR_OK` | `opticals.reflector.yesNoOk` | `OK` | Reflector result |
| `OPT_UVFILTER_STATUS` | `opticals.uvFilter.status` | `-` | UV Filter status |
| `OPT_UVFILTER_OK` | `opticals.uvFilter.yesNoOk` | `OK` | UV Filter result |
| `OPT_INTROD_STATUS` | `opticals.integratorRod.status` | `-` | Integrator Rod status |
| `OPT_INTROD_OK` | `opticals.integratorRod.yesNoOk` | `OK` | Integrator Rod result |
| `OPT_COLDMIRROR_STATUS` | `opticals.coldMirror.status` | `-` | Cold Mirror status |
| `OPT_COLDMIRROR_OK` | `opticals.coldMirror.yesNoOk` | `OK` | Cold Mirror result |
| `OPT_FOLDMIRROR_STATUS` | `opticals.foldMirror.status` | `-` | Fold Mirror status |
| `OPT_FOLDMIRROR_OK` | `opticals.foldMirror.yesNoOk` | `OK` | Fold Mirror result |
| `ELEC_TOUCHPANEL_STATUS` | `electronics.touchPanel.status` | `-` | Touch Panel status |
| `ELEC_TOUCHPANEL_OK` | `electronics.touchPanel.yesNoOk` | `OK` | Touch Panel result |
| `ELEC_EVBIMCB_STATUS` | `electronics.evbAndImcbBoard.status` | `-` | EVB/IMCB status |
| `ELEC_EVBIMCB_OK` | `electronics.evbAndImcbBoard.yesNoOk` | `OK` | EVB/IMCB result |
| `ELEC_PIBICP_STATUS` | `electronics.pibAndIcpBoard.status` | `-` | PIB/ICP status |
| `ELEC_PIBICP_OK` | `electronics.pibAndIcpBoard.yesNoOk` | `OK` | PIB/ICP result |
| `ELEC_IMB2_STATUS` | `electronics.imb2Board.status` | `-` | IMB-2 Board status |
| `ELEC_IMB2_OK` | `electronics.imb2Board.yesNoOk` | `OK` | IMB-2 result |
| `MECH_ACBLOWER_STATUS` | `mechanical.acBlowerAndVaneSwitch.status` | `-` | AC Blower status |
| `MECH_ACBLOWER_OK` | `mechanical.acBlowerAndVaneSwitch.yesNoOk` | `OK` | AC Blower result |
| `MECH_EXTRACTOR_STATUS` | `mechanical.extractorVaneSwitch.status` | `-` | Extractor status |
| `MECH_EXTRACTOR_OK` | `mechanical.extractorVaneSwitch.yesNoOk` | `OK` | Extractor result |
| `MECH_EXHAUSTCFM_STATUS` | `mechanical.exhaustCfmValue.status` | `-` | Exhaust CFM status |
| `MECH_EXHAUSTCFM_OK` | `mechanical.exhaustCfmValue.yesNoOk` | `OK` | Exhaust CFM result |
| `MECH_LEFANS_STATUS` | `mechanical.lightEngineFansWithLadFan.status` | `-` | LE Fans status |
| `MECH_LEFANS_OK` | `mechanical.lightEngineFansWithLadFan.yesNoOk` | `OK` | LE Fans result |
| `MECH_CARDCAGE_STATUS` | `mechanical.cardCageTopAndBottomFans.status` | `-` | Card Cage status |
| `MECH_CARDCAGE_OK` | `mechanical.cardCageTopAndBottomFans.yesNoOk` | `OK` | Card Cage result |
| `MECH_RADIATOR_STATUS` | `mechanical.radiatorFanAndPump.status` | `-` | Radiator status |
| `MECH_RADIATOR_OK` | `mechanical.radiatorFanAndPump.yesNoOk` | `OK` | Radiator result |
| `MECH_CONNECTOR_STATUS` | `mechanical.connectorAndHoseForPump.status` | `-` | Connector status |
| `MECH_CONNECTOR_OK` | `mechanical.connectorAndHoseForPump.yesNoOk` | `OK` | Connector result |
| `MECH_SECURITY_STATUS` | `mechanical.securityAndLampHouseLockSwitch.status` | `-` | Security status |
| `MECH_SECURITY_OK` | `mechanical.securityAndLampHouseLockSwitch.yesNoOk` | `OK` | Security result |
| `SERIAL_VERIFIED_STATUS` | `serialNumberVerified.chassisLabelVsTouchPanel.status` | `-` | Serial verify status |
| `SERIAL_VERIFIED_OK` | `serialNumberVerified.chassisLabelVsTouchPanel.yesNoOk` | `OK` | Serial verify result |
| `DISPOSABLE_STATUS` | `disposableConsumables.airIntakeLadAndRad.status` | `-` | Consumables status |
| `DISPOSABLE_OK` | `disposableConsumables.airIntakeLadAndRad.yesNoOk` | `OK` | Consumables result |
| `COOLANT_LEVEL_STATUS` | `coolant.levelAndColor.status` | `-` | Coolant level status |
| `COOLANT_LEVEL_OK` | `coolant.levelAndColor.yesNoOk` | `OK` | Coolant level result |
| `COOLANT_WHITE_STATUS` | `coolant.white.status` | `-` | White coolant status |
| `COOLANT_WHITE_OK` | `coolant.white.yesNoOk` | `OK` | White coolant result |
| `COOLANT_RED_STATUS` | `coolant.red.status` | `-` | Red coolant status |
| `COOLANT_RED_OK` | `coolant.red.yesNoOk` | `OK` | Red coolant result |
| `LE_GREEN_STATUS` | `lightEngineTestPattern.green.status` | `-` | Green pattern status |
| `LE_GREEN_OK` | `lightEngineTestPattern.green.yesNoOk` | `OK` | Green pattern result |
| `LE_BLUE_STATUS` | `lightEngineTestPattern.blue.status` | `-` | Blue pattern status |
| `LE_BLUE_OK` | `lightEngineTestPattern.blue.yesNoOk` | `OK` | Blue pattern result |
| `LE_BLACK_STATUS` | `lightEngineTestPattern.black.status` | `-` | Black pattern status |
| `LE_BLACK_OK` | `lightEngineTestPattern.black.yesNoOk` | `OK` | Black pattern result |
| `LAMP_LOC_STATUS` | `lampLocMechanism.xAndZMovement.status` | `-` | Lamp LOC status |
| `LAMP_LOC_OK` | `lampLocMechanism.xAndZMovement.yesNoOk` | `OK` | Lamp LOC result |

## 🔧 Usage Instructions

### 1. First Time Setup

1. **Upload your Word template** via the Report Templates page
2. **Run the auto-mapping script**:
   ```bash
   node backend/server/scripts/add-ascomp-checklist-mappings.js
   ```
3. **Refresh** the Report Templates page
4. **Verify** field mappings were added (should show 52+ mappings)

### 2. Prepare Your Word Template

Open your Word document and add the tokens exactly as shown above. For example:

```
═══════════════════════════════════════════════════════════════════════
                    DESCRIPTION                    STATUS      YES/NO-OK
═══════════════════════════════════════════════════════════════════════

OPTICALS
───────────────────────────────────────────────────────────────────────
Reflector                                    [OPT_REFLECTOR_STATUS]        [OPT_REFLECTOR_OK]
UV filter                                    [OPT_UVFILTER_STATUS]         [OPT_UVFILTER_OK]
Integrator Rod                               [OPT_INTROD_STATUS]           [OPT_INTROD_OK]
...
```

### 3. Test It

1. **Create a test ASCOMP report** via the FSE portal
2. **Fill in the checklist sections** with various statuses
3. **Download as Word** from the Report Downloader
4. **Verify** all fields are populated correctly

## ✅ Verification

After running the script, you should see:

```
✅ Successfully added all checklist field mappings!

📊 Summary:
   Total mappings now: 52
   New mappings added: 52

📄 Detailed breakdown:

   OPTICALS (10 mappings):
      ✓ OPT_REFLECTOR_STATUS → opticals.reflector.status
      ✓ OPT_REFLECTOR_OK → opticals.reflector.yesNoOk
      ...

   ELECTRONICS (8 mappings):
      ✓ ELEC_TOUCHPANEL_STATUS → electronics.touchPanel.status
      ...

   MECHANICAL (16 mappings):
      ...
```

## 🎨 Formatting Tips for Your Word Template

1. **Use Tables**: Put tokens in table cells for clean alignment
2. **Font Size**: Use 8-10pt for checklist sections
3. **Borders**: Add light borders to separate sections
4. **Spacing**: Add 2-3pt padding in table cells
5. **Bold Headers**: Make section names (OPTICALS, ELECTRONICS, etc.) bold

## 🐛 Troubleshooting

### "No ASCOMP template found"
- Make sure you've uploaded a Word template via the Report Templates page
- The template name should contain "ASCOMP" or type should be "ASCOMP_EW"

### "All checklist mappings already exist"
- The script has already been run
- Check the Report Templates page to see existing mappings

### Tokens not being replaced in Word document
- Make sure you've run the script AFTER uploading the template
- Verify the token names exactly match (case-sensitive)
- Check the field mappings on the Report Templates page

## 📚 Related Documentation

- See `WORD_TEMPLATE_GUIDE.md` for general template usage
- See `ASCOMP_EXACT_FORMAT_IMPLEMENTATION.md` for data structure details
- See `WORD_TEMPLATE_IMPLEMENTATION_SUMMARY.md` for system overview

## 🎉 Success!

Once everything is set up, your FSEs can:
1. Fill out the ASCOMP form with all checklist items
2. Download the report as Word document
3. Get a perfectly formatted report with all OK/Not OK fields populated!

No manual work required! 🚀







