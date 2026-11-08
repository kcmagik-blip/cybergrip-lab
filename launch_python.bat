@echo off
REM ==============================================================================
REM CyberGrip: 1-Click Python Pipeline Launcher (Windows)
REM ==============================================================================

set DIR=%~dp0python_pipeline
cd /d "%DIR%"

echo ============================================================
echo  Launching CyberGrip Python Teleoperation Interface...
echo ============================================================

python -c "import cv2, mediapipe, numpy" 2>nul
if %errorlevel% neq 0 (
    echo [Notice] Installing dependencies...
    pip install -r requirements.txt
)

python tracker.py
pause
