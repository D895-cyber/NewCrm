# 🧪 Word Template Testing Guide

## ✅ Current Status

Your system is ready to test! Here's what's already set up:

- ✅ **52 checklist field mappings** added to database
- ✅ **25 old reports** migrated to ASCOMP format
- ✅ **Word template system** fully implemented
- ✅ **Template uploaded** (ASCOMP_REPORT_001)

## 🎯 Step-by-Step Testing Instructions

### **Step 1: View Your Migrated Reports** (2 minutes)

1. **Open your browser** and go to: `http://localhost:3000`
2. **Login** as admin or any user
3. **Navigate to**: ASCOMP Report Downloader page
4. **You should see**: 25 reports with names starting with `ASCOMP-EW-`

   Example:
   - ASCOMP-EW-1757399831938
   - ASCOMP-EW-1757862562348
   - etc.

### **Step 2: Test Current Word Download** (1 minute)

1. **Pick any report** from the list
2. **Click**: "Download as Word (.docx)" button (green button)
3. **Wait** for the download (should be instant)
4. **Open** the downloaded `.docx` file

**What you'll see:**
- The Word document will be generated
- Basic fields will be populated (cinema name, date, etc.)
- **Checklist tokens** will show as `[OPT_REFLECTOR_STATUS]` if your template doesn't have them yet
- OR they'll show as blank if the template has them but data is missing

### **Step 3: Check What Data is Available** (Optional)

To see what data was migrated from old reports:

1. Go to **Report Downloader** page
2. Click **"View"** on any report
3. You'll see the report details
4. Check if the **opticals**, **electronics**, **mechanical** sections have data

### **Step 4: Update Your Word Template** (if needed)

If you see tokens like `[OPT_REFLECTOR_STATUS]` in the downloaded file:

1. **Open** your original Word template: `D:\EW_open_word_v6.3.5docx.docx`
2. **Add the tokens** from `ASCOMP_CHECKLIST_MAPPINGS_ADDED.md`
3. **Example** - In the OPTICALS section, add:

```
Description                     STATUS                          YES/NO-OK
─────────────────────────────────────────────────────────────────────────
Reflector                      [OPT_REFLECTOR_STATUS]          [OPT_REFLECTOR_OK]
UV filter                      [OPT_UVFILTER_STATUS]           [OPT_UVFILTER_OK]
Integrator Rod                 [OPT_INTROD_STATUS]             [OPT_INTROD_OK]
```

4. **Save** the template
5. **Re-upload** via Report Templates page
6. **Test download again**

## 📊 What to Expect

### **If Template Has Tokens:**

✅ **With Data:**
```
Reflector          Cleaned         OK
UV Filter          Replaced        Not OK
```

✅ **Without Data (from old reports):**
```
Reflector          -               -
UV Filter          -               -
```

### **If Template Doesn't Have Tokens:**

⚠️ **You'll see:**
```
Reflector          [OPT_REFLECTOR_STATUS]          [OPT_REFLECTOR_OK]
```

This means: Tokens are in the database, but not in your Word template yet.

## 🎯 Quick Test Right Now!

**Fastest way to test:**

1. Open: `http://localhost:3000`
2. Go to: **ASCOMP Report Downloader**
3. Click: **"Download as Word"** on the first report
4. Open the downloaded file
5. Look for:
   - ✅ Cinema name populated?
   - ✅ Date populated?
   - ✅ Report number populated?
   - ❓ Checklist tokens showing or blank?

## 🔍 Troubleshooting

### "Template not found" error
- Go to **Report Templates** page
- Make sure template is uploaded
- Check if it's set as "Default"

### "Download fails"
- Check browser console (F12) for errors
- Check terminal/backend logs
- Ensure MongoDB is running

### Tokens showing in Word instead of data
- This is expected if:
  1. Template doesn't have the tokens yet (add them!)
  2. OR old migrated data doesn't have checklist values (create new report!)

### All fields are blank
- Old reports might not have all data
- Create a **new test report** with checklist data:
  1. Go to **FSE ASCOMP Reports** (as FSE user)
  2. Click "Create New Report"
  3. Fill in checklist sections
  4. Submit and download

## ✅ Success Indicators

You know it's working when:

1. ✅ Word document downloads successfully
2. ✅ Basic fields (cinema, date, engineer) are populated
3. ✅ Document opens without errors
4. ✅ Formatting matches your template structure
5. ✅ Checklist fields show actual values (if template has tokens and data exists)

## 📝 Next Actions Based on Results

### **If Download Works But Shows Tokens:**
→ Update Word template with tokens (see Step 4 above)

### **If Download Works But Fields Are Blank:**
→ Create new test report with checklist data

### **If Download Fails:**
→ Check browser console and backend logs
→ Share error message for debugging

## 🚀 Ready to Test!

Your system is fully set up. Just go to:

**http://localhost:3000 → ASCOMP Report Downloader → Download as Word**

Open the downloaded file and see what you get! 🎉

---

**📧 Report any issues with:**
- Screenshot of the Word document
- Error messages from browser console (F12)
- Backend terminal logs







