# ASCOMP Report System - Testing Guide

## 🎯 What Was Fixed

**Critical Issue:** PDF reports showed "N/A" instead of actual data

**Solution:** Data transformation mapper that converts form structure to match HTML template

---

## ✅ Quick Test Checklist

### Test 1: Form Submission (5 minutes)

1. **Open ASCOMP Form:**
   - Navigate to FSE portal
   - Create new ASCOMP report

2. **Fill Minimal Data:**
   ```
   - Report Number: TEST-001
   - Site Name: Test Cinema
   - Projector Serial: TEST123
   - Projector Model: CP2220
   - Brand: Christie
   - Engineer Name: Your Name
   ```

3. **Check Console (F12):**
   - Look for: `🔄 Starting data transformation...`
   - Look for: `✅ Transformation complete`
   - Look for: `🔄 Submitting report with transformed data`

4. **Submit Report:**
   - Click Submit
   - Check for success message
   - No errors should appear

**✅ Pass Criteria:** Console shows transformation logs, no errors

---

### Test 2: Backend Processing (3 minutes)

1. **Check Backend Logs:**
   - Open terminal running backend server
   - Look for: `✅ Using pre-transformed template data from frontend`

2. **Verify Database:**
   - Report saved successfully
   - templateData field exists in document

**✅ Pass Criteria:** Backend uses transformed data

---

### Test 3: PDF Generation (5 minutes)

1. **Generate PDF:**
   - After submitting report
   - Click "Download PDF" or "Generate Report"

2. **Open PDF:**
   - Check Site Name shows "Test Cinema" (not "N/A")
   - Check Projector Model shows "CP2220" (not "N/A")
   - Check Engineer Name shows your name (not "N/A")

3. **Verify Sections:**
   - Opticals section shows statuses
   - Electronics section shows statuses
   - Mechanical section shows statuses

**✅ Pass Criteria:** PDF shows actual data, not "N/A"

---

### Test 4: Full Report (15 minutes)

1. **Fill Complete Form:**
   - All 13 steps
   - Include inspection checklists
   - Add observations
   - Fill color measurements
   - Add voltage parameters

2. **Submit and Generate PDF:**
   - Verify all filled data appears in PDF
   - Check inspection tables populated
   - Verify measurements displayed

**✅ Pass Criteria:** All data from form appears in PDF

---

## 🐛 Troubleshooting

### Problem: PDF still shows "N/A"

**Check 1: Frontend Transformation**
```javascript
// Open browser console (F12)
// Should see:
🔄 Starting data transformation...
📥 Input form data: {...}
📤 Output template data: {...}
✅ Transformation complete
```

**If you DON'T see these logs:**
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page (Ctrl+F5)
- Check file: `frontend/src/utils/ascompDataMapper.ts` exists

---

**Check 2: Backend Reception**
```bash
# Backend terminal should show:
✅ Using pre-transformed template data from frontend
```

**If you see this instead:**
```bash
⚠️ No templateData found, using legacy transformation
```

**Then:** Template data didn't reach backend
- Check API client sends templateData
- Check ServiceReport model accepts templateData field
- Restart backend server

---

**Check 3: Database Storage**
```javascript
// Check MongoDB document
db.servicereports.findOne({reportNumber: "TEST-001"})

// Should have:
{
  reportNumber: "TEST-001",
  siteName: "Test Cinema",
  templateData: {
    cinemaName: "Test Cinema",  // ← This should exist
    opticals: {...},
    electronics: {...}
  }
}
```

**If templateData is missing:**
- Backend didn't save it
- Check ServiceReport schema allows flexible fields
- Check backend route processes templateData

---

### Problem: Console shows errors

**Error:** `transformFormDataToTemplate is not defined`
- **Fix:** Clear cache, refresh page
- File not loaded properly

**Error:** `Validation failed: ...`
- **Fix:** Fill required fields:
  - Report Number
  - Site Name
  - Projector Serial
  - Projector Model
  - Brand
  - Engineer Name

**Error:** `Authentication required`
- **Fix:** Log out and log back in
- Token expired

---

## 📊 Expected vs Actual Results

### Before Fix
| Field | Expected | Actual |
|-------|----------|--------|
| Cinema Name | "PVR Cinema" | "N/A" |
| Projector Model | "CP2220" | "N/A" |
| Opticals - Reflector | "OK" | "N/A" |
| Engineer Name | "John Doe" | "N/A" |

### After Fix
| Field | Expected | Actual |
|-------|----------|--------|
| Cinema Name | "PVR Cinema" | ✅ "PVR Cinema" |
| Projector Model | "CP2220" | ✅ "CP2220" |
| Opticals - Reflector | "OK" | ✅ "OK" |
| Engineer Name | "John Doe" | ✅ "John Doe" |

---

## 🔍 Detailed Verification

### 1. Check Form Data Structure
```javascript
// In browser console after filling form:
console.log('Form Data:', formData);

// Should show:
{
  siteName: "Test Cinema",
  projectorModel: "CP2220",
  inspectionSections: {
    opticals: [
      { description: "Reflector", status: "OK", result: "OK" }
    ]
  }
}
```

### 2. Check Transformed Data
```javascript
// Should also show:
{
  templateData: {
    cinemaName: "Test Cinema",  // ← Transformed
    projectorModelSerialAndHours: "CP2220 - Serial: TEST123 - Hours: N/A",
    opticals: {
      reflector: { status: "OK", replacement: "OK" }  // ← Transformed
    }
  }
}
```

### 3. Check Backend Response
```javascript
// API response after submission:
{
  message: "ASCOMP report created successfully",
  report: {
    _id: "...",
    reportNumber: "TEST-001",
    siteName: "Test Cinema",
    templateData: {
      cinemaName: "Test Cinema",  // ← Stored
      ...
    }
  }
}
```

---

## 📝 Test Data Examples

### Minimal Test Data
```javascript
{
  reportNumber: "TEST-001",
  reportType: "First",
  date: "2024-01-15",
  siteName: "Test Cinema",
  siteAddress: "123 Test Street",
  projectorSerial: "TEST123",
  projectorModel: "CP2220",
  brand: "Christie",
  engineer: {
    name: "Test Engineer",
    phone: "1234567890"
  }
}
```

### Complete Test Data
Use the ASCOMP form and fill all fields with sample data to test complete transformation.

---

## ✅ Success Indicators

1. **Console Logs Present:**
   - ✅ Data transformation started
   - ✅ Transformation complete
   - ✅ Validation passed
   - ✅ Report submitted

2. **Backend Logs Present:**
   - ✅ Using pre-transformed data
   - ✅ Report created successfully
   - ✅ PDF generated

3. **PDF Contains Real Data:**
   - ✅ No "N/A" for filled fields
   - ✅ Cinema name correct
   - ✅ Projector details correct
   - ✅ Inspection sections populated
   - ✅ Engineer name visible

---

## 🎉 All Tests Pass?

If all tests pass, the data transformation is working correctly!

### Next Steps:
1. Test with real production data
2. Have FSEs test on their devices
3. Generate multiple reports to verify consistency
4. Move on to implementing:
   - Photo embedding
   - Signature capture
   - Form simplification (13 → 7 steps)
   - Offline storage

---

## 📞 Need Help?

If tests fail:
1. Check this guide's troubleshooting section
2. Review console logs carefully
3. Verify all files are saved
4. Restart both frontend and backend servers
5. Clear browser cache and cookies
6. Try in incognito/private mode

**Still having issues?**
- Review: `ASCOMP_FIX_IMPLEMENTATION_SUMMARY.md`
- Check: `frontend/src/utils/ascompDataMapper.ts`
- Verify: Backend logs show transformed data usage









