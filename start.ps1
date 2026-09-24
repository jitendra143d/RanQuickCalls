# RanQuickCalls - Start Both Servers
# Run this script from the project root to launch the full app

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RanQuickCalls - Starting All Servers   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Start Backend Server
Write-Host "`n[1/2] Starting Backend Server (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\server'; Write-Host 'Backend Server' -ForegroundColor Green; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend Dev Server
Write-Host "[2/2] Starting Frontend Dev Server (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\client'; Write-Host 'Frontend Dev Server' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  Both servers started!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
Write-Host "`nPress any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
