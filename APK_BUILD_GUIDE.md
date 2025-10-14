# 📱 APK Build Guide - ProjectorCare FSE Portal

## 🎯 What We've Set Up

Your CRM system is now ready to be converted to an Android APK! Here's what's been configured:

### ✅ Completed Setup
- **Capacitor Integration**: Your React app is now wrapped with Capacitor
- **Android Platform**: Android project structure created
- **Permissions**: Camera, file access, and network permissions configured
- **Plugins**: Camera, Filesystem, and Network plugins installed
- **Build Scripts**: Automated build scripts created

## 🚀 How to Build Your APK

### Option 1: Using Build Script (Recommended)
```bash
# Windows
cd frontend
.\build-apk.bat

# Linux/Mac
cd frontend
./build-apk.sh
```

### Option 2: Manual Steps
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

## 📱 Android Studio Build Process

When Android Studio opens:

1. **Wait for Gradle Sync** (5-10 minutes first time)
2. **Build APK**: 
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Or use the toolbar build button
3. **Find Your APK**: 
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Size: ~15-20 MB

## 🔧 Alternative: Command Line Build

If you have Android SDK installed:
```bash
cd frontend/android
./gradlew assembleDebug
```

## 📲 Installing the APK

### On Android Device:
1. **Enable Unknown Sources**:
   - Go to Settings → Security → Install unknown apps
   - Enable for your file manager/browser
2. **Transfer APK**: 
   - Email, USB, or cloud storage
3. **Install**: Tap the APK file to install

### On Emulator:
1. Drag and drop APK into emulator
2. Or use: `adb install app-debug.apk`

## 🌐 Offline Features

Your APK includes full offline functionality:

### ✅ What Works Offline:
- **Service Reports**: Create and edit reports
- **Photo Capture**: Take photos with device camera
- **Data Entry**: All forms and inputs
- **Navigation**: Full app navigation
- **Caching**: Service worker caches all resources

### 🔄 What Syncs When Online:
- **Photo Uploads**: Photos sync to your Render server
- **Report Submission**: Reports sync to database
- **Data Updates**: Fresh data from server
- **User Authentication**: Login/logout

## 🎨 App Features

### 📸 Camera Integration
- **Real-time Capture**: Use device camera
- **Photo Gallery**: Access device photos
- **Multiple Photos**: Capture multiple images per report
- **Auto-upload**: Photos sync when online

### 📁 File Management
- **Local Storage**: All data stored locally
- **File Access**: Read/write to device storage
- **Export**: Generate PDFs and reports
- **Import**: Bulk data import capabilities

### 🌐 Network Detection
- **Online/Offline**: Automatic detection
- **Sync Status**: Visual indicators
- **Queue Management**: Offline actions queued
- **Auto-sync**: Sync when connection restored

## 🔧 Troubleshooting

### Build Issues:
```bash
# Clean and rebuild
cd frontend
rm -rf android
npx cap add android
npx cap sync android
```

### Permission Issues:
- Check `AndroidManifest.xml` for all required permissions
- Ensure camera permissions are granted on device

### Sync Issues:
- Verify your Render server URL in the app
- Check network connectivity
- Review console logs for errors

## 📊 App Configuration

### App Details:
- **Name**: ProjectorCare FSE Portal
- **Package**: com.projectorcare.fseportal
- **Version**: 1.0.0
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

### Permissions:
- `INTERNET`: Network access
- `CAMERA`: Photo capture
- `WRITE_EXTERNAL_STORAGE`: File storage
- `READ_EXTERNAL_STORAGE`: File access
- `ACCESS_NETWORK_STATE`: Network detection

## 🚀 Production Deployment

### For Google Play Store:
1. **Sign APK**: Create release keystore
2. **Optimize**: Reduce APK size
3. **Test**: Thorough testing on devices
4. **Upload**: Google Play Console

### For Direct Distribution:
1. **Host APK**: On your website
2. **QR Code**: Easy download link
3. **Instructions**: Installation guide
4. **Updates**: Version management

## 📱 Testing Your APK

### Test Checklist:
- [ ] App installs successfully
- [ ] Camera permissions work
- [ ] Photo capture functions
- [ ] Offline mode works
- [ ] Online sync works
- [ ] All forms function
- [ ] Navigation works
- [ ] Data persists

### Test Devices:
- **Android 5.1+**: Minimum requirement
- **Different Screen Sizes**: Phone and tablet
- **Various Manufacturers**: Samsung, Google, etc.

## 🎉 You're Ready!

Your CRM system is now ready to be distributed as an APK! Users can:

1. **Download** the APK from your website
2. **Install** on their Android devices
3. **Use Offline** for all core functionality
4. **Sync Online** when connected to internet
5. **Capture Photos** using device camera
6. **Generate Reports** and PDFs

The app provides a native Android experience while maintaining all your web app's functionality!

---

## 📞 Support

If you need help with:
- Building the APK
- Troubleshooting issues
- Customizing features
- Distribution setup

Just let me know! 🚀

