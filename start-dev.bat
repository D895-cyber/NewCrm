@echo off
echo Starting Local Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Development Server...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173 (or check the frontend terminal for actual port)
echo.
echo Press any key to exit...
pause > nul

































