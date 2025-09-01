# 🚀 Bulk Upload Guide - Sites & Projectors

## ✅ **BULK UPLOAD FEATURE READY!**

Your application now has a powerful bulk upload feature that allows you to add multiple sites and their projectors at once. Here's how to use it:

## 🎯 **How to Access Bulk Upload**

1. **Open your application**: http://localhost:3001 (or the port shown in your terminal)
2. **Navigate to**: Click "Bulk Upload" in the left sidebar
3. **Choose format**: Select JSON or CSV format

## 📊 **Two Upload Formats Available**

### **1. JSON Format (Recommended)**
- **Structure**: Hierarchical data with sites containing nested projectors
- **Best for**: Complex data with multiple projectors per site
- **Example**: One site with multiple projectors in a structured format
- **Upload method**: Paste JSON data into text area

### **2. CSV Format**
- **Structure**: Flat table with one row per projector
- **Best for**: Simple data from Excel/spreadsheets
- **Example**: Multiple rows where each row represents a projector
- **Upload method**: Upload CSV file directly or paste CSV data

## 📋 **JSON Format Example**

```json
{
  "sites": [
    {
      "name": "Metro Convention Center",
      "address": {
        "street": "123 Main Street",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "country": "India"
      },
      "contactPerson": {
        "name": "Priya Sharma",
        "email": "priya.sharma@metroconvention.com",
        "phone": "+91-9876543211",
        "designation": "Facility Manager"
      },
      "businessHours": {
        "openTime": "08:00",
        "closeTime": "20:00",
        "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      },
      "siteType": "Convention Center",
      "status": "Active",
      "contractDetails": {
        "contractNumber": "CONV-2024-001",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "contractValue": 500000,
        "serviceLevel": "Premium"
      },
      "projectors": [
        {
          "serialNumber": "EP2250U240101",
          "model": "Epson EB-2250U",
          "brand": "Epson",
          "installationDate": "2024-01-15",
          "warrantyStart": "2024-01-15",
          "warrantyEnd": "2027-01-15",
          "status": "Active",
          "condition": "Excellent",
          "technician": "Rajesh Kumar",
          "location": "Hall A - Main Screen"
        },
        {
          "serialNumber": "EP2250U240102",
          "model": "Epson EB-2250U",
          "brand": "Epson",
          "installationDate": "2024-01-20",
          "warrantyStart": "2024-01-20",
          "warrantyEnd": "2027-01-20",
          "status": "Active",
          "condition": "Good",
          "technician": "Meera Sharma",
          "location": "Hall B - Secondary Screen"
        }
      ]
    }
  ]
}
```

## 📊 **CSV Format Example**

```csv
Site Name,Street,City,State,Pincode,Country,Contact Name,Email,Phone,Designation,Open Time,Close Time,Working Days,Site Type,Status,Contract Number,Contract Start,Contract End,Contract Value,Service Level,Projector Serial,Projector Model,Projector Brand,Installation Date,Warranty Start,Warranty End,Projector Status,Projector Condition,Technician,Location
Metro Convention Center,123 Main Street,Noida,Uttar Pradesh,201301,India,Priya Sharma,priya.sharma@metroconvention.com,+91-9876543211,Facility Manager,08:00,20:00,"Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",Convention Center,Active,CONV-2024-001,2024-01-01,2024-12-31,500000,Premium,EP2250U240101,Epson EB-2250U,Epson,2024-01-15,2024-01-15,2027-01-15,Active,Excellent,Rajesh Kumar,Hall A - Main Screen
Metro Convention Center,123 Main Street,Noida,Uttar Pradesh,201301,India,Priya Sharma,priya.sharma@metroconvention.com,+91-9876543211,Facility Manager,08:00,20:00,"Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",Convention Center,Active,CONV-2024-001,2024-01-01,2024-12-31,500000,Premium,EP2250U240102,Epson EB-2250U,Epson,2024-01-20,2024-01-20,2027-01-20,Active,Good,Meera Sharma,Hall B - Secondary Screen
City Mall Multiplex,456 Cinema Road,Mumbai,Maharashtra,400001,India,Amit Singh,amit.singh@citymall.com,+91-9876543212,Cinema Manager,11:00,23:30,"Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",Cinema,Active,CINEMA-2024-001,2024-01-01,2024-12-31,300000,Standard,VPL120240202,Sony VPL-FHZ120,Sony,2024-01-10,2024-01-10,2027-01-10,Active,Good,Sanjay Patel,Screen 1 - Premium Hall
```

## 🚀 **Step-by-Step Upload Process**

### **Step 1: Choose Format**
- Click **"JSON Format"** or **"CSV Format"** button
- Both formats support the same data structure

### **Step 2: Download Sample Data**
- Click **"Download JSON Sample"** or **"Download CSV Sample"**
- This gives you the exact format to follow

### **Step 3: Prepare Your Data**
- **For JSON**: Structure your data as shown in the example above
- **For CSV**: Create a spreadsheet with the exact column headers
- **Multiple projectors per site**: In JSON, nest projectors under each site. In CSV, repeat site data for each projector

### **Step 4: Upload Data**
- **For CSV**: Upload a CSV file by dragging and dropping or clicking "Choose CSV File"
- **For JSON**: Paste your JSON data into the text area
- **Click "Load Sample"** to see the format
- **Click "Upload Data"** to process

### **Step 5: Review Results**
- **Success counts**: See how many sites and projectors were created
- **Error details**: View any failed uploads with specific error messages
- **Data verification**: Check the Sites and Projectors pages to confirm

## 📋 **Required Fields**

### **Site Information:**
- ✅ **name**: Site name
- ✅ **address**: Complete address (street, city, state, pincode, country)
- ✅ **contactPerson**: Contact details (name, email, phone, designation)
- ✅ **businessHours**: Operating hours (openTime, closeTime, workingDays)
- ✅ **siteType**: Type of facility (Convention Center, Cinema, Mall, etc.)
- ✅ **status**: Site status (Active, Inactive, etc.)
- ✅ **contractDetails**: Contract information (contractNumber, startDate, endDate, contractValue, serviceLevel)

### **Projector Information:**
- ✅ **serialNumber**: Unique projector serial number
- ✅ **model**: Projector model name
- ✅ **brand**: Manufacturer brand
- ✅ **installationDate**: When projector was installed
- ✅ **warrantyStart**: Warranty start date
- ✅ **warrantyEnd**: Warranty end date
- ✅ **status**: Projector status (Active, Under Maintenance, etc.)
- ✅ **condition**: Physical condition (Excellent, Good, Fair, Poor)
- ✅ **technician**: Assigned technician name
- ✅ **location**: Specific location within the site

## 🎯 **Best Practices**

### **For Large Datasets:**
1. **Start small**: Test with 2-3 sites first
2. **Validate data**: Ensure all required fields are filled
3. **Check dates**: Use YYYY-MM-DD format for all dates
4. **Unique serials**: Ensure projector serial numbers are unique
5. **Valid emails**: Use proper email format for contacts

### **Data Quality:**
- ✅ **Consistent naming**: Use consistent site and projector names
- ✅ **Valid phone numbers**: Include country codes
- ✅ **Realistic dates**: Use future dates for warranties
- ✅ **Proper status**: Use valid status values (Active, Inactive, Under Maintenance)

## 🔍 **Troubleshooting**

### **Common Issues:**
1. **JSON parsing error**: Check for missing commas, brackets, or quotes
2. **CSV format error**: Ensure proper comma separation and quoted text
3. **Duplicate serial numbers**: Each projector must have a unique serial number
4. **Missing required fields**: All fields marked with ✅ are required

### **Error Messages:**
- **"Site already exists"**: Site name must be unique
- **"Projector serial already exists"**: Serial number must be unique
- **"Invalid date format"**: Use YYYY-MM-DD format
- **"Invalid email format"**: Use proper email format

## 📊 **Expected Results**

After successful upload, you should see:
- ✅ **Sites created**: All sites appear in the Sites page
- ✅ **Projectors created**: All projectors appear in the Projectors page
- ✅ **Dashboard updated**: Counts reflect new data
- ✅ **Warranty alerts**: If any projectors have expiring warranties
- ✅ **Relationships**: Projectors properly linked to their sites

## 🎉 **Ready to Upload!**

Your bulk upload feature is now ready to handle multiple sites and projectors at once. Start with the sample data to understand the format, then upload your real data!

**Access it at**: http://localhost:3001 → Click "Bulk Upload" in the sidebar 