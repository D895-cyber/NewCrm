@echo off
echo ========================================
echo  Local Frontend-Backend Test Setup
echo ========================================
echo.

echo 1. Checking if frontend is built...
if not exist "frontend\dist\index.html" (
    echo ❌ Frontend not built. Building now...
    cd frontend
    call npm run build
    cd ..
    echo ✅ Frontend built successfully
) else (
    echo ✅ Frontend build found
)

echo.
echo 2. Starting backend server...
echo 📡 Backend will serve frontend at http://localhost:4000
echo.

cd backend\server
call npm start
