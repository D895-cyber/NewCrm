@echo off
cd /d "%~dp0"
echo.
echo ==========================================
echo   Starting ASCOMP Backend Server
echo ==========================================
echo.
echo Current directory: %CD%
echo.
echo Starting server...
node server/index.js
pause








