@echo off
setlocal EnableExtensions EnableDelayedExpansion
title NetLab AI Launcher
cd /d "%~dp0"

:: --------------------------------------------------------------------------
:: 1. Cleanup Old Processes
:: --------------------------------------------------------------------------
echo [1/5] Terminating existing processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
:: Kill any window titled "Frontend" or "Backend" to avoid duplicates
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Frontend" >nul 2>&1
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Backend*" >nul 2>&1

:: --------------------------------------------------------------------------
:: 2. Setup Logs
:: --------------------------------------------------------------------------
echo [2/5] Preparing logs directory...
if not exist "logs" mkdir "logs"

:: --------------------------------------------------------------------------
:: 3. Install Dependencies
:: --------------------------------------------------------------------------
echo [3/5] Checking/Installing dependencies (check logs\npm_install.log for details)...
echo Starting npm install at %TIME% > "logs\npm_install.log"
call npm install --legacy-peer-deps >> "logs\npm_install.log" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed! See logs\npm_install.log for details.
    type "logs\npm_install.log"
    pause
    exit /b %ERRORLEVEL%
)
echo npm install finished at %TIME% >> "logs\npm_install.log"

:: --------------------------------------------------------------------------
:: 4. Start Services (Visible Windows + Logging)
:: --------------------------------------------------------------------------
echo [4/5] Starting services...

:: Start Frontend with PowerShell Tee-Object to show output AND log it
echo    - Launching Frontend (Vite)...
start "Frontend" powershell -NoExit -Command "npm run dev | Tee-Object -FilePath 'logs\frontend.log'"

:: Start Backend if exists
if exist "server.py" (
  echo    - Launching Python Backend...
  start "Backend (Python)" powershell -NoExit -Command "python server.py | Tee-Object -FilePath 'logs\backend_python.log'"
) else (
  if exist "server.js" (
    echo    - Launching Node Backend...
    start "Backend (Node)" powershell -NoExit -Command "node server.js | Tee-Object -FilePath 'logs\backend_node.log'"
  ) else (
    echo    - No backend file found (server.py/server.js). Running Frontend only.
  )
)

:: --------------------------------------------------------------------------
:: 5. Launch Browser
:: --------------------------------------------------------------------------
echo [5/5] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ================================================================
echo               NETLAB AI IS RUNNING
echo ================================================================
echo.
echo    If the browser does not open automatically, please visit:
echo.
echo        http://localhost:5173/
echo.
echo    (Ctrl+Click the link above if your terminal supports it)
echo.
echo ================================================================
echo.

:: Try to launch browser explicitly as a fallback
start "" "http://localhost:5173/" 2>nul

:: Keep this window open
pause
