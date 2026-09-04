@echo off
cd /d "%~dp0"
echo Stopping dev on port 3471...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3471" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)
echo Clearing .next...
if exist ".next\" rmdir /s /q ".next" 2>nul
echo Done. Run: npm run dev
pause
