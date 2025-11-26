# Local Development Startup Script
Write-Host "🚀 Starting Local Development Environment..." -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait for backend to start
Write-Host "⏳ Waiting 5 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "🎨 Starting Frontend Development Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both services are starting..." -ForegroundColor Green
Write-Host "🔗 Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173 (or check frontend terminal)" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Check both terminal windows for startup status" -ForegroundColor Magenta












































