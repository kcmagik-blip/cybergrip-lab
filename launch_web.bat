@echo off
REM ==============================================================================
REM CyberGrip: 1-Click Web Simulation Launcher (Windows)
REM ==============================================================================

set PORT=8000
set DIR=%~dp0web_simulation

echo ============================================================
echo  Starting CyberGrip 3D Web Teleoperation Simulation...
echo  Opening browser at: http://localhost:%PORT%
echo  (Press Ctrl+C to stop the server)
echo ============================================================

cd /d "%DIR%"

start "" "http://localhost:%PORT%"
python -m http.server %PORT%
pause
