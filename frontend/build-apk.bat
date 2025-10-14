@echo off
echo ========================================
echo   ProjectorCare FSE Portal - APK Builder
echo ========================================
echo.

echo [1/6] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [2/6] Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/6] Opening Android Studio...
echo Please follow these steps in Android Studio:
echo 1. Wait for Gradle sync to complete
echo 2. Go to Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Wait for build to complete
echo 4. APK will be generated in: android\app\build\outputs\apk\debug\
echo.
echo Press any key to open Android Studio...
pause >nul

call npx cap open android

echo.
echo ========================================
echo   APK Build Instructions
echo ========================================
echo.
echo After Android Studio opens:
echo.
echo 1. Wait for Gradle sync (may take 5-10 minutes first time)
echo 2. Click Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Wait for build to complete
echo 4. Find your APK at: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Alternative: Use command line (if Android SDK is installed):
echo   cd android
echo   .\gradlew assembleDebug
echo.
echo ========================================
echo   Offline Features Ready
echo ========================================
echo.
echo Your APK will include:
echo - Full offline functionality via PWA
echo - Camera access for photo capture
echo - File system access for uploads
echo - Network detection for sync
echo - Service worker for caching
echo.
pause


