#!/usr/bin/env bash
# ==============================================================================
# CyberGrip: 1-Click Python Pipeline Launcher (Mac & Linux)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/python_pipeline"
cd "$DIR" || exit 1

echo "============================================================"
echo " Launching CyberGrip Python Teleoperation Interface..."
echo "============================================================"

# Check Python environment
if ! command -v python3 &>/dev/null; then
    echo "[Error] Python 3 not found. Please install Python 3.8+."
    exit 1
fi

# Optional: check if packages installed
python3 -c "import cv2, mediapipe, numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[Notice] Installing required libraries (opencv-python, mediapipe, numpy)..."
    pip3 install -r requirements.txt
fi

python3 tracker.py
