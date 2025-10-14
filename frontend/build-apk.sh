#!/bin/bash

echo "========================================"
echo "  ProjectorCare FSE Portal - APK Builder"
echo "========================================"
echo

echo "[1/6] Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi

echo
echo "[2/6] Syncing with Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "ERROR: Capacitor sync failed!"
    exit 1
fi

echo
echo "[3/6] Checking Android SDK..."
if command -v adb &> /dev/null; then
    echo "Android SDK found! Building APK..."
    cd android
    ./gradlew assembleDebug
    if [ $? -eq 0 ]; then
        echo
        echo "✅ APK built successfully!"
        echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
        echo
        echo "========================================"
        echo "  APK Ready for Installation"
        echo "========================================"
        echo
        echo "Your APK includes:"
        echo "- Full offline functionality via PWA"
        echo "- Camera access for photo capture"
        echo "- File system access for uploads"
        echo "- Network detection for sync"
        echo "- Service worker for caching"
        echo
        echo "Install on Android device:"
        echo "1. Enable 'Install from unknown sources'"
        echo "2. Transfer APK to device"
        echo "3. Tap APK to install"
        echo
    else
        echo "❌ APK build failed!"
        echo "Opening Android Studio as fallback..."
        cd ..
        npx cap open android
    fi
else
    echo "Android SDK not found. Opening Android Studio..."
    npx cap open android
    echo
    echo "========================================"
    echo "  Manual Build Instructions"
    echo "========================================"
    echo
    echo "In Android Studio:"
    echo "1. Wait for Gradle sync to complete"
    echo "2. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)"
    echo "3. Wait for build to complete"
    echo "4. APK will be in: android/app/build/outputs/apk/debug/"
    echo
fi


