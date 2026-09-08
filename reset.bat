@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title NuraHelp - reset

rem Kill whatever holds :3471 (previous npm/next), then start fresh via start.bat.
rem Same idea as Hubcast restart_hubcast.bat → stop then pokreni.

echo.
echo  [EMDR] Stopping previous server on port 3471 (if running)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$pids = @(); Get-NetTCPConnection -LocalPort 3471 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' -or $_.OwningProcess -gt 0 } | ForEach-Object { $pids += $_.OwningProcess }; $pids = $pids | Select-Object -Unique; foreach ($procId in $pids) { if ($procId -and $procId -gt 0) { Write-Host ('  [EMDR] taskkill /T PID ' + $procId); & taskkill.exe /PID $procId /T /F 2>$null | Out-Null } }"

rem Brief settle so the port is free (TIME_WAIT / file locks).
ping 127.0.0.1 -n 3 >nul

echo  [EMDR] Starting fresh (Docker Postgres + npm run dev)...
echo.
call "%~dp0start.bat"
exit /b %ERRORLEVEL%
