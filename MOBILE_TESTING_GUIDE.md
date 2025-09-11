# 📱 FSE Mobile Portal Testing Guide

## 🚀 Quick Start

### 1. Deploy Mobile Version
```bash
./deploy-mobile.sh
```

### 2. Start Local Server
```bash
cd mobile-build
python3 -m http.server 8080
# or
npx serve -s . -l 8080
```

### 3. Test on Mobile Device
- Find your computer's IP address: `ifconfig | grep 'inet ' | grep -v 127.0.0.1`
- On mobile device, navigate to: `http://YOUR_IP:8080`

## 📱 Mobile Testing Features

### ✅ What's Available
- **PWA Support**: Install as mobile app
- **Camera Integration**: Photo capture with device camera
- **Touch Optimization**: Mobile-friendly interface
- **Offline Support**: Service worker caching
- **Photo Upload Testing**: Backend integration testing
- **Responsive Design**: Works on all screen sizes

### 🔧 Testing Components
1. **PhotoCaptureTest**: Dedicated photo testing component
2. **FSEMobileApp**: Full FSE mobile portal
3. **Service Report Forms**: Mobile-optimized forms
4. **Photo Upload**: Real backend integration

## 📸 Photo Testing Workflow

### Camera Testing
1. **Start Camera**: Click "Start Camera" button
2. **Grant Permissions**: Allow camera access when prompted
3. **Capture Photos**: Click "Capture Photo" to take pictures
4. **Stop Camera**: Click "Stop Camera" when done

### File Upload Testing
1. **Select Files**: Use file picker to select images
2. **Multiple Selection**: Choose multiple files at once
3. **Preview**: See thumbnails of selected images
4. **Edit Metadata**: Add descriptions and categories

### Upload Testing
1. **Configure Test**: Set visit ID and category
2. **Test Upload**: Click "Test Upload" button
3. **Monitor Progress**: Watch upload progress bar
4. **Check Results**: Verify success/error status

## 🌐 Network Testing

### Local Network Testing
```bash
# Find your IP address
ifconfig | grep 'inet ' | grep -v 127.0.0.1

# Start server on specific interface
python3 -m http.server 8080 --bind 0.0.0.0
```

### External Testing
- **Ngrok**: Create public tunnel for external access
- **Cloudflare Tunnel**: Secure external access
- **Vercel/Netlify**: Deploy for public testing

## 📱 Device Testing Checklist

### iOS Testing
- [ ] Safari browser
- [ ] Camera permissions
- [ ] Photo library access
- [ ] PWA installation
- [ ] Touch gestures
- [ ] Screen rotation

### Android Testing
- [ ] Chrome browser
- [ ] Camera permissions
- [ ] File system access
- [ ] PWA installation
- [ ] Touch gestures
- [ ] Screen rotation

### Common Issues & Solutions

#### Camera Not Working
```javascript
// Check permissions
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log('Camera permission:', result.state));

// Request permissions
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera access granted'))
  .catch(err => console.error('Camera access denied:', err));
```

#### Photos Not Uploading
```javascript
// Check network status
if (navigator.onLine) {
  console.log('Online - can upload');
} else {
  console.log('Offline - upload will queue');
}

// Check file size
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  console.error('File too large:', file.size);
}
```

#### PWA Not Installing
- Ensure HTTPS (required for PWA)
- Check manifest.json is valid
- Verify service worker registration
- Test on supported browsers

## 🔍 Debugging Tools

### Browser DevTools
- **Network Tab**: Monitor API calls
- **Console**: Check for errors
- **Application Tab**: Verify PWA setup
- **Sensors**: Test device orientation

### Mobile DevTools
- **Chrome DevTools**: Remote debugging
- **Safari Web Inspector**: iOS debugging
- **Flipper**: Facebook's debugging platform

### Console Logging
```javascript
// Add to your components for debugging
console.log('Photo capture:', photoData);
console.log('Upload progress:', progress);
console.log('API response:', response);
```

## 📊 Performance Testing

### Lighthouse Audit
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:8080 --output html --output-path ./lighthouse-report.html
```

### Core Web Vitals
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift

### Mobile Performance
- **3G Network**: Test on slow connections
- **Device Performance**: Test on low-end devices
- **Battery Usage**: Monitor power consumption

## 🚀 Production Deployment

### Requirements
- **HTTPS**: Required for PWA features
- **Valid SSL Certificate**: Let's Encrypt or commercial
- **Service Worker**: Must be served over HTTPS
- **Manifest**: Valid JSON manifest file

### Deployment Options
1. **Vercel**: Easy deployment with HTTPS
2. **Netlify**: Simple static hosting
3. **AWS S3 + CloudFront**: Scalable solution
4. **Custom Server**: Full control over deployment

### Environment Variables
```bash
# Required for production
VITE_API_BASE_URL=https://your-api-domain.com
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

## 📱 Testing Scenarios

### Photo Capture Scenarios
1. **New Service Visit**: Capture before/after photos
2. **Issue Documentation**: Photo evidence of problems
3. **Parts Replacement**: Before/after part installation
4. **Quality Check**: Final verification photos

### Upload Scenarios
1. **Single Photo**: Test individual upload
2. **Multiple Photos**: Test batch upload
3. **Large Files**: Test size limits
4. **Poor Network**: Test offline/retry

### User Experience Scenarios
1. **First Time User**: Onboarding experience
2. **Returning User**: Quick access to features
3. **Offline Mode**: Functionality without internet
4. **Error Handling**: Graceful failure recovery

## 🔧 Troubleshooting

### Common Problems
- **Camera not accessible**: Check browser permissions
- **Photos not saving**: Verify backend connectivity
- **App not installing**: Ensure HTTPS and valid manifest
- **Slow performance**: Check image optimization

### Debug Commands
```bash
# Check service worker
navigator.serviceWorker.getRegistrations()

# Check PWA installability
navigator.getInstalledRelatedApps()

# Check camera permissions
navigator.permissions.query({ name: 'camera' })
```

## 📞 Support

### Getting Help
1. Check browser console for errors
2. Verify network connectivity
3. Test on different devices/browsers
4. Check backend server status

### Useful Resources
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)

---

**Happy Testing! 🎉**

Your FSE mobile portal is now ready for comprehensive mobile testing with full photo capture and upload functionality.

