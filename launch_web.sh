#!/usr/bin/env bash
# ==============================================================================
# CyberGrip: 1-Click Web Simulation Launcher (Mac & Linux)
# ==============================================================================

PORT=8000
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/web_simulation"

echo "============================================================"
echo " Starting CyberGrip 3D Web Teleoperation Simulation..."
echo " Opening browser at: http://localhost:${PORT}"
echo " (Press Ctrl+C to stop the server)"
echo "============================================================"

# Navigate to simulation directory
cd "$DIR" || exit 1

# Open browser in background after short delay
(sleep 1.2 && (open "http://localhost:${PORT}" 2>/dev/null || xdg-open "http://localhost:${PORT}" 2>/dev/null)) &

# Launch built-in Python lightweight HTTP server
if command -v python3 &>/dev/null; then
    python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
    python -m http.server "$PORT"
else
    echo "[Error] Python is not installed. Please open web_simulation/index.html in Google Chrome."
fi
