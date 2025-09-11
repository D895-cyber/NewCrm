# 📸 Photo-First Workflow Test Guide

## 🎯 Overview
This guide helps you test the new photo-first workflow on your mobile device. The workflow enforces that FSEs must capture photos before generating reports and getting signatures.

## 🚀 Quick Start

### 1. Run the Setup Script
```bash
./test-photo-workflow.sh
```

This will:
- ✅ Check your system requirements
- 🔧 Create a test service visit in your database
- 📱 Provide instructions for mobile testing

### 2. Start Your Server
```bash
npm start
```

### 3. Find Your Computer's IP Address
- **macOS**: `ifconfig | grep 'inet ' | grep -v 127.0.0.1`
- **Linux**: `ip addr show | grep 'inet ' | grep -v 127.0.0.1`
- **Windows**: `ipconfig | findstr IPv4`

### 4. Test on Your Phone
Open this URL on your phone:
```
http://YOUR_IP_ADDRESS:3001/mobile-test-build/photo-workflow-test.html
```

## 🧪 Test Features

### 📸 Photo Capture
- **Category Selection**: Choose from Before Service, During Service, After Service, Issue Found
- **Multiple Photos**: Upload multiple photos per category
- **Photo Preview**: See uploaded photos before submitting
- **Category Progress**: Visual indicators for completed categories

### 🔧 Workflow Steps
1. **Photo Capture** - Must complete all photo categories
2. **Service Work** - Describe work performed
3. **Report Generation** - Create service report
4. **Digital Signature** - Capture site in-charge signature
5. **Completion** - Finish workflow

### 🎨 Digital Signature
- **Touch Drawing**: Draw signature on canvas
- **Name Input**: Enter site in-charge name
- **Clear Function**: Reset signature if needed

### 🔍 Debug Features
- **Real-time Logs**: See all actions and API calls
- **API Testing**: Test server connection
- **Reset Function**: Start over anytime
- **Progress Tracking**: Visual progress bar

## 📱 Mobile Optimizations

### Touch-Friendly Interface
- Large touch targets (44px minimum)
- Optimized for mobile screens
- Prevents zoom on input focus
- Smooth touch interactions

### PWA Features
- Add to home screen capability
- Offline-ready design
- Mobile-optimized viewport
- Touch gesture support

## 🔧 Troubleshooting

### Common Issues

#### ❌ "API connection failed"
- **Check**: Server is running (`npm start`)
- **Check**: IP address is correct
- **Check**: Phone and computer are on same network
- **Try**: Use "Test API Connection" button

#### ❌ "Upload failed"
- **Check**: Cloudinary configuration in `.env`
- **Check**: File size (max 10MB)
- **Check**: File type (images only)
- **Try**: Smaller image files

#### ❌ "MongoDB connection error"
- **Check**: MongoDB is running
- **Check**: Connection string in `.env`
- **Try**: Restart MongoDB service

### Debug Information
The test page includes a debug section that shows:
- Real-time action logs
- API response details
- Error messages
- System status

## 📋 Test Scenarios

### Scenario 1: Complete Workflow
1. Select "Before Service" category
2. Upload 2-3 photos
3. Repeat for other categories
4. Complete service work
5. Generate report
6. Capture signature
7. Finish workflow

### Scenario 2: API Testing
1. Click "Test API Connection"
2. Verify successful response
3. Check debug info for details

### Scenario 3: Error Handling
1. Try uploading without selecting category
2. Try completing steps out of order
3. Test with invalid data

## 🎯 Expected Results

### ✅ Successful Test
- All workflow steps complete
- Photos upload successfully
- Signature captures properly
- Progress bar reaches 100%
- Debug info shows successful API calls

### 📊 Database Changes
After successful test, check your database:
```javascript
// Check workflow status
db.servicevisits.findOne({visitId: "test-visit-001"})

// Check photo categories
db.servicevisits.findOne({visitId: "test-visit-001"}, {photoCategories: 1})

// Check digital signature
db.servicevisits.findOne({visitId: "test-visit-001"}, {digitalSignature: 1})
```

## 🔄 Next Steps

After successful testing:
1. **Integrate with FSE Workflow**: Update the main FSE workflow component
2. **Add Real Data**: Test with actual service visits
3. **Enhance UI**: Improve mobile interface based on feedback
4. **Add Features**: Implement offline sync, photo compression, etc.

## 📞 Support

If you encounter issues:
1. Check the debug information
2. Verify server logs
3. Test API endpoints directly
4. Check database connectivity

---

**Happy Testing! 🎉**

