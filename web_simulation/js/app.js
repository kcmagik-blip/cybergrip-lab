/**
 * CyberGrip: Main Application Controller
 * Connects 3D Graphics, Optical Vision, HUD UI, and Science Fair Data Logger
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const canvasContainer = 'canvas-container';
  const videoElem = document.getElementById('webcam-video');
  const overlayCanvas = document.getElementById('landmark-canvas');
  
  // HUD Elements
  const fpsEl = document.getElementById('fps-counter');
  const latEl = document.getElementById('latency-counter');
  const statusBadge = document.getElementById('status-badge');
  const gripPercentEl = document.getElementById('grip-percent');
  const gripFillEl = document.getElementById('grip-progress-fill');
  const gripStateEl = document.getElementById('grip-state');
  const safetyCard = document.getElementById('safety-card');
  const safetyLight = document.getElementById('safety-light');
  const safetyMessage = document.getElementById('safety-message');
  let safetyBlocked = false;
  let safetyReason = '';
  let consecutiveSafeFrames = 0;
  let previousMotionSample = null;
  let filteredMotionPosition = null;
  let previousMotionVelocity = null;
  let rapidMotionFrames = 0;

  function isOffensivePose(flexions) {
    if (!Array.isArray(flexions) || flexions.length < 5) return false;
    const [thumb, index, middle, ring, pinky] = flexions;
    if (![thumb, index, middle, ring, pinky].every(Number.isFinite)) return false;

    // Block the clear middle-finger salute: middle extended, the other long fingers curled.
    return middle < 0.28 && index > 0.62 && ring > 0.62 && pinky > 0.62;
  }

  function isJerkyMotion(position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return false;
    const now = performance.now();
    const current = { x: position.x, y: position.y, time: now };

    if (!previousMotionSample || now - previousMotionSample.time > 250) {
      previousMotionSample = current;
      filteredMotionPosition = { x: current.x, y: current.y };
      previousMotionVelocity = { x: 0, y: 0 };
      rapidMotionFrames = 0;
      return false;
    }

    const deltaSeconds = (now - previousMotionSample.time) / 1000;
    if (deltaSeconds < 0.008) return false;

    const alpha = 1 - Math.exp(-24 * deltaSeconds);
    const nextFiltered = {
      x: filteredMotionPosition.x + (current.x - filteredMotionPosition.x) * alpha,
      y: filteredMotionPosition.y + (current.y - filteredMotionPosition.y) * alpha
    };
    const velocity = {
      x: (nextFiltered.x - filteredMotionPosition.x) / deltaSeconds,
      y: (nextFiltered.y - filteredMotionPosition.y) / deltaSeconds
    };
    const speed = Math.hypot(velocity.x, velocity.y);
    const acceleration = Math.hypot(
      (velocity.x - previousMotionVelocity.x) / deltaSeconds,
      (velocity.y - previousMotionVelocity.y) / deltaSeconds
    );

    filteredMotionPosition = nextFiltered;
    previousMotionVelocity = velocity;
    previousMotionSample = current;

    if (speed > 2.6 || (speed > 1.25 && acceleration > 8)) return true;
    rapidMotionFrames = speed > 1.25 && acceleration > 6 ? rapidMotionFrames + 1 : 0;
    return rapidMotionFrames >= 2;
  }

  function setSafetyStatus(blocked, message) {
    const state = blocked ? 'blocked' : 'safe';
    const label = blocked ? 'RED · BLOCKED' : 'GREEN · SAFE';
    if (safetyCard.dataset.state !== state) safetyCard.dataset.state = state;
    if (safetyLight.textContent !== label) safetyLight.textContent = label;
    if (safetyMessage.textContent !== message) safetyMessage.textContent = message;
  }

  function updateSafetyGate(telemetry) {
    if (!telemetry.connected) {
      consecutiveSafeFrames = 0;
      previousMotionSample = null;
      filteredMotionPosition = null;
      previousMotionVelocity = null;
      rapidMotionFrames = 0;
      setSafetyStatus(
        safetyBlocked,
        safetyBlocked
          ? `${safetyReason} blocked. Robot held at its last safe pose.`
          : 'No hand detected. The robot is ready.'
      );
      return safetyBlocked;
    }

    const offensivePose = isOffensivePose(telemetry.fingerFlexions);
    const jerkyMotion = isJerkyMotion(telemetry.position);
    if (offensivePose || jerkyMotion) {
      safetyBlocked = true;
      consecutiveSafeFrames = 0;
      safetyReason = offensivePose && jerkyMotion
        ? 'Unsafe gesture and jerky movement'
        : offensivePose ? 'Middle-finger gesture' : 'Jerky movement';
      setSafetyStatus(true, `${safetyReason} blocked. Robot held at its last safe pose.`);
      return true;
    }

    if (safetyBlocked) {
      consecutiveSafeFrames += 1;
      if (consecutiveSafeFrames >= 4) {
        safetyBlocked = false;
        safetyReason = '';
        consecutiveSafeFrames = 0;
      }
    }

    setSafetyStatus(
      safetyBlocked,
      safetyBlocked
        ? 'Blocked. Hold a safe pose and move calmly for four tracking updates to resume.'
        : 'Safe pose. The robot can follow your hand.'
    );
    return safetyBlocked;
  }

  // Finger Joint Meters
  const thumbBar = document.getElementById('thumb-bar');
  const thumbDeg = document.getElementById('thumb-deg');
  const indexBar = document.getElementById('index-bar');
  const indexDeg = document.getElementById('index-deg');
  const middleBar = document.getElementById('middle-bar');
  const middleDeg = document.getElementById('middle-deg');
  const ringBar = document.getElementById('ring-bar');
  const ringDeg = document.getElementById('ring-deg');
  const pinkyBar = document.getElementById('pinky-bar');
  const pinkyDeg = document.getElementById('pinky-deg');

  // Benchmark Elements
  const startBenchBtn = document.getElementById('start-bench-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const sampleCountEl = document.getElementById('sample-count');
  const avgLatEl = document.getElementById('avg-lat');

  // Buttons
  const startCamBtn = document.getElementById('start-cam-btn');
  const toggleCamBtn = document.getElementById('toggle-camera-btn');
  const cameraBox = document.getElementById('camera-box');
  const resetCamBtn = document.getElementById('reset-cam-btn');
  const toggleGridBtn = document.getElementById('toggle-grid-btn');
  const resetObjBtn = document.getElementById('reset-object-btn');
  const previewPickupBtn = document.getElementById('preview-pickup-btn');
  const welcomeModal = document.getElementById('welcome-modal');
  const modalStartBtn = document.getElementById('modal-start-btn');
  startBenchBtn.disabled = true;

  // 1. Initialize 3D Robot Hand Simulator
  const simulator = new RobotHandSimulator(canvasContainer);

  // 2. Initialize Optical Hand Tracker
  const tracker = new HandTracker(videoElem, overlayCanvas, (telemetry) => {
    // Safety checks control only commands sent to the twin; the HUD keeps raw estimates.
    const blocked = updateSafetyGate(telemetry);
    simulator.setSafetyBlocked(blocked);
    previewPickupBtn.disabled = blocked;

    // Update 3D Robot Hand Model only while the current pose is safe.
    if (telemetry.connected) {
      if (!blocked) {
        simulator.updateFingerBends(telemetry.fingerFlexions);
        simulator.updateHandPose(telemetry.position, telemetry.rotation);
      }
    } else {
      // Keep the last pose through a brief detection gap instead of opening the grip.
      simulator.updateHandPose(null, null);
    }

    // Update HUD Stats
    fpsEl.textContent = Number.isFinite(telemetry.fps) ? telemetry.fps : '--';
    latEl.textContent = Number.isFinite(telemetry.latency) ? `${telemetry.latency} ms` : '-- ms';

    if (telemetry.connected) {
      statusBadge.textContent = 'Tracking';
      statusBadge.className = 'badge badge-active';

      // Grip percentage & bar
      const grip = telemetry.gripPercent;
      gripPercentEl.textContent = `${grip}%`;
      gripFillEl.style.width = `${grip}%`;

      // State label
      if (grip > 70) {
        gripStateEl.textContent = 'Closed';
        gripStateEl.style.color = 'var(--orange)';
      } else if (grip > 35) {
        gripStateEl.textContent = 'Partly curled';
        gripStateEl.style.color = 'var(--blue)';
      } else {
        gripStateEl.textContent = 'Open';
        gripStateEl.style.color = 'var(--green)';
      }

      // Individual finger bars & degrees
      const angles = telemetry.fingerAngles;
      const flex = telemetry.fingerFlexions;

      thumbBar.style.width = `${Math.round(flex[0] * 100)}%`;
      thumbDeg.textContent = `${angles[0]}°`;

      indexBar.style.width = `${Math.round(flex[1] * 100)}%`;
      indexDeg.textContent = `${angles[1]}°`;

      middleBar.style.width = `${Math.round(flex[2] * 100)}%`;
      middleDeg.textContent = `${angles[2]}°`;

      ringBar.style.width = `${Math.round(flex[3] * 100)}%`;
      ringDeg.textContent = `${angles[3]}°`;

      pinkyBar.style.width = `${Math.round(flex[4] * 100)}%`;
      pinkyDeg.textContent = `${angles[4]}°`;

      // Update Benchmark counter if active
      const recordedCount = tracker.benchmarkData.length;
      if (recordedCount) {
        sampleCountEl.textContent = `${recordedCount}/100`;
        const sumLat = tracker.benchmarkData.reduce((acc, cur) => acc + cur.latencyMs, 0);
        avgLatEl.textContent = `${Math.round(sumLat / recordedCount)} ms`;
      }
      if (tracker.isRecordingBenchmark) {
        startBenchBtn.textContent = `Stop run (${recordedCount}/100)`;
        startBenchBtn.disabled = false;
      } else if (tracker.benchmarkData.length >= 100) {
        startBenchBtn.textContent = 'Record again';
        startBenchBtn.disabled = false;
        exportCsvBtn.disabled = false;
      }
    } else {
      statusBadge.textContent = 'No hand';
      statusBadge.className = 'badge badge-standby';
      gripPercentEl.textContent = '0%';
      gripFillEl.style.width = '0%';
      gripStateEl.textContent = 'Waiting for hand';
      [thumbBar, indexBar, middleBar, ringBar, pinkyBar].forEach((bar) => { bar.style.width = '0%'; });
      [thumbDeg, indexDeg, middleDeg, ringDeg, pinkyDeg].forEach((value) => { value.textContent = '--°'; });
    }
  });

  // Action to launch camera and tracker
  async function launchSystem() {
    welcomeModal.style.display = 'none';
    try {
      statusBadge.textContent = 'Starting...';
      await tracker.initialize();
      await tracker.startCamera();
      startCamBtn.textContent = 'Camera on';
      startCamBtn.disabled = true;
      startBenchBtn.disabled = false;
    } catch (err) {
      console.error(err);
      statusBadge.textContent = 'Camera Error';
      statusBadge.className = 'badge badge-error';
      startCamBtn.disabled = false;
      startCamBtn.textContent = 'Try camera again';
      alert('Could not start tracking. Check webcam permission and internet access, then refresh the page and try again.');
    }
  }

  // Event Listeners
  modalStartBtn.addEventListener('click', launchSystem);
  startCamBtn.addEventListener('click', launchSystem);

  // Toggle Camera View
  toggleCamBtn.addEventListener('click', () => {
    cameraBox.classList.toggle('collapsed');
    const collapsed = cameraBox.classList.contains('collapsed');
    toggleCamBtn.textContent = collapsed ? '+' : '−';
    toggleCamBtn.setAttribute('aria-label', collapsed ? 'Expand camera preview' : 'Collapse camera preview');
    toggleCamBtn.title = collapsed ? 'Expand camera preview' : 'Collapse camera preview';
  });

  // 3D View Buttons
  resetCamBtn.addEventListener('click', () => simulator.resetCamera());
  toggleGridBtn.addEventListener('click', () => simulator.toggleGrid());
  resetObjBtn.addEventListener('click', () => simulator.resetObject());
  previewPickupBtn.addEventListener('click', () => simulator.playPickupPreview());

  // Benchmark Buttons
  startBenchBtn.addEventListener('click', () => {
    if (tracker.isRecordingBenchmark) {
      tracker.isRecordingBenchmark = false;
      const count = tracker.benchmarkData.length;
      startBenchBtn.textContent = count >= 100 ? 'Record again' : 'Record 100';
      startBenchBtn.disabled = false;
      exportCsvBtn.disabled = count === 0;
      return;
    }
    if (!tracker.isRunning) return;
    sampleCountEl.textContent = '0/100';
    avgLatEl.textContent = '-- ms';
    exportCsvBtn.disabled = true;
    const lightingValue = document.getElementById('lighting-input').value;
    tracker.startBenchmark({
      distanceM: Number.parseFloat(document.getElementById('distance-input').value) || '',
      lightingLux: lightingValue === '' ? '' : Number(lightingValue)
    });
    startBenchBtn.textContent = 'Stop run (0/100)';
    startBenchBtn.disabled = false;
  });

  exportCsvBtn.addEventListener('click', () => {
    const csvContent = tracker.exportCSV();
    if (!csvContent) {
      alert('No benchmark data to export. Please record a run first.');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `CyberGrip_Benchmark_${stamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
});
