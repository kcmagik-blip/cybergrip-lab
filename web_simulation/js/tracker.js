/**
 * CyberGrip: Optical Kinematic Hand Tracker & Vector Angle Math
 * Powered by MediaPipe Hands
 */

class HandTracker {
  constructor(videoElement, canvasElement, onTelemetryUpdate) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onTelemetryUpdate = onTelemetryUpdate;

    this.hands = null;
    this.camera = null;
    this.isRunning = false;

    // Performance & Benchmark Metrics
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.currentFps = 0;
    this.currentLatency = 0;
    this.sendTimestamp = 0;

    // Benchmark recording session
    this.isRecordingBenchmark = false;
    this.benchmarkData = [];
    this.benchmarkTargetSamples = 100;
    this.benchmarkConditions = { distanceM: '', lightingLux: '' };
    this.benchmarkStartTime = 0;
  }

  async initialize() {
    if (typeof Hands === 'undefined') {
      throw new Error('MediaPipe Hands library not loaded from CDN.');
    }

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    await this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65
    });

    this.hands.onResults((results) => this.processResults(results));
  }

  async startCamera() {
    if (this.isRunning) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
      });
      this.video.srcObject = stream;
      await this.video.play();

      this.canvas.width = this.video.videoWidth || 640;
      this.canvas.height = this.video.videoHeight || 480;

      this.isRunning = true;
      this.frameLoop();
    } catch (err) {
      console.error('Camera access error:', err);
      throw err;
    }
  }

  async frameLoop() {
    if (!this.isRunning) return;

    if (this.video.readyState >= 2) {
      this.sendTimestamp = performance.now();
      await this.hands.send({ image: this.video });
    }

    requestAnimationFrame(() => this.frameLoop());
  }

  /**
   * The Mathematical Core: Calculates the 3D angle between two vectors
   * Formula: cos(theta) = (u . v) / (||u|| * ||v||)
   * theta = arccos(cos(theta)) in degrees
   */
  calculateVectorAngle(p1, p2, p3) {
    // Vector u: p2 -> p1
    const u = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
      z: (p1.z || 0) - (p2.z || 0)
    };
    // Vector v: p2 -> p3
    const v = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
      z: (p3.z || 0) - (p2.z || 0)
    };

    const dotProduct = (u.x * v.x) + (u.y * v.y) + (u.z * v.z);
    const magU = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
    const magV = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

    if (magU * magV === 0) return 180;

    let cosTheta = dotProduct / (magU * magV);
    // Clamp to avoid numerical floating-point inaccuracies outside [-1, 1]
    cosTheta = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(cosTheta) * (180 / Math.PI);
  }

  processResults(results) {
    const now = performance.now();
    this.currentLatency = Math.round(now - this.sendTimestamp);

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFrameTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Clear overlay canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw Sci-Fi HUD Skeleton on top of the webcam feed
      this.drawHandOverlay(landmarks);

      // --- Kinematic Flexion Calculations ---
      // 1. Thumb: Combine joint angle with palm proximity for natural opposable motion
      const thumbAngle = this.calculateVectorAngle(landmarks[2], landmarks[3], landmarks[4]);
      const thumbDistToPinky = Math.hypot(
        landmarks[4].x - landmarks[17].x,
        landmarks[4].y - landmarks[17].y
      );
      const thumbProxFlex = Math.max(0, Math.min(1, (0.26 - thumbDistToPinky) / (0.26 - 0.10)));
      const thumbAngleFlex = this.normalizeFlexion(thumbAngle, 168, 120);
      const thumbFlex = Math.max(thumbProxFlex, thumbAngleFlex);

      // 2. Index (MCP: 5, PIP: 6, DIP: 7, TIP: 8) - calibrated for natural middle-school grip
      const indexAngle = this.calculateVectorAngle(landmarks[5], landmarks[6], landmarks[8]);
      const indexFlex = this.normalizeFlexion(indexAngle, 168, 68);

      // 3. Middle (MCP: 9, PIP: 10, DIP: 11, TIP: 12)
      const middleAngle = this.calculateVectorAngle(landmarks[9], landmarks[10], landmarks[12]);
      const middleFlex = this.normalizeFlexion(middleAngle, 170, 68);

      // 4. Ring (MCP: 13, PIP: 14, DIP: 15, TIP: 16)
      const ringAngle = this.calculateVectorAngle(landmarks[13], landmarks[14], landmarks[16]);
      const ringFlex = this.normalizeFlexion(ringAngle, 168, 68);

      // 5. Pinky (MCP: 17, PIP: 18, DIP: 19, TIP: 20)
      const pinkyAngle = this.calculateVectorAngle(landmarks[17], landmarks[18], landmarks[20]);
      const pinkyFlex = this.normalizeFlexion(pinkyAngle, 165, 68);

      const fingerFlexions = [thumbFlex, indexFlex, middleFlex, ringFlex, pinkyFlex];
      const fingerAngles = [
        Math.round(thumbFlex * 90),
        Math.round(indexFlex * 90),
        Math.round(middleFlex * 90),
        Math.round(ringFlex * 90),
        Math.round(pinkyFlex * 90)
      ];

      // Overall grip percentage
      const gripPercent = Math.round(((indexFlex + middleFlex + ringFlex + pinkyFlex) / 4) * 100);

      // Hand Position & Orientation
      const wrist = landmarks[0];
      const indexBase = landmarks[5];
      const pinkyBase = landmarks[17];

      // Approximate pitch & roll from palm landmarks
      const pitch = (indexBase.y - wrist.y) * 2.0;
      const roll = (pinkyBase.y - indexBase.y) * 3.0;
      const yaw = (indexBase.x - pinkyBase.x) * 2.0;

      const telemetry = {
        connected: true,
        fps: this.currentFps,
        latency: this.currentLatency,
        gripPercent,
        fingerFlexions,
        fingerAngles,
        position: { x: wrist.x, y: wrist.y, z: wrist.z },
        rotation: { pitch, yaw, roll }
      };

      // Record benchmark sample if enabled
      if (this.isRecordingBenchmark && this.benchmarkData.length < this.benchmarkTargetSamples) {
        this.benchmarkData.push({
          sample: this.benchmarkData.length + 1,
          timestampMs: Math.round(now),
          elapsedRunMs: Math.round(now - this.benchmarkStartTime),
          fps: this.currentFps,
          latencyMs: this.currentLatency,
          distanceM: this.benchmarkConditions.distanceM,
          lightingLux: this.benchmarkConditions.lightingLux,
          gripPercent,
          thumbAngle: fingerAngles[0],
          indexAngle: fingerAngles[1],
          middleAngle: fingerAngles[2],
          ringAngle: fingerAngles[3],
          pinkyAngle: fingerAngles[4]
        });

        if (this.benchmarkData.length >= this.benchmarkTargetSamples) {
          this.isRecordingBenchmark = false;
        }
      }

      this.onTelemetryUpdate(telemetry);
    } else {
      this.onTelemetryUpdate({
        connected: false,
        fps: this.currentFps,
        latency: this.currentLatency,
        gripPercent: 0,
        fingerFlexions: [0, 0, 0, 0, 0],
        fingerAngles: [0, 0, 0, 0, 0]
      });
    }
  }

  normalizeFlexion(angle, maxExtended, minFlexed) {
    // Clamps angle and normalizes to 0.0 (open) - 1.0 (closed)
    const ratio = (maxExtended - angle) / (maxExtended - minFlexed);
    return Math.max(0, Math.min(1, ratio));
  }

  drawHandOverlay(landmarks) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Connections between landmark indices
    const connections = [
      [0,1],[1,2],[2,3],[3,4],       // Thumb
      [0,5],[5,6],[6,7],[7,8],       // Index
      [0,9],[9,10],[10,11],[11,12],  // Middle
      [0,13],[13,14],[14,15],[15,16],// Ring
      [0,17],[17,18],[18,19],[19,20],// Pinky
      [5,9],[9,13],[13,17]           // Palm base
    ];

    // Draw the tracked hand landmarks over the mirrored camera preview.
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.60)';
    this.ctx.shadowBlur = 0;

    connections.forEach(([i, j]) => {
      this.ctx.beginPath();
      this.ctx.moveTo(landmarks[i].x * w, landmarks[i].y * h);
      this.ctx.lineTo(landmarks[j].x * w, landmarks[j].y * h);
      this.ctx.stroke();
    });

    // Draw delicate joint nodes
    landmarks.forEach((pt, idx) => {
      this.ctx.beginPath();
      const isTip = (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20);
      const radius = isTip ? 4 : 2.5;
      this.ctx.arc(pt.x * w, pt.y * h, radius, 0, 2 * Math.PI);
      this.ctx.fillStyle = isTip ? '#0071e3' : '#ffffff';
      this.ctx.fill();
    });
  }

  startBenchmark(conditions = {}) {
    this.benchmarkData = [];
    this.benchmarkStartTime = performance.now();
    this.benchmarkConditions = {
      distanceM: conditions.distanceM ?? '',
      lightingLux: conditions.lightingLux ?? ''
    };
    this.isRecordingBenchmark = true;
  }

  exportCSV() {
    if (this.benchmarkData.length === 0) return null;

    const headers = [
      'Sample',
      'Page_Time_ms',
      'Elapsed_Run_ms',
      'FPS',
      'Processing_Delay_ms',
      'Camera_Distance_m',
      'Room_Light_lux',
      'Grip_Percent',
      'Thumb_Curl_Command_Deg',
      'Index_Curl_Command_Deg',
      'Middle_Curl_Command_Deg',
      'Ring_Curl_Command_Deg',
      'Pinky_Curl_Command_Deg'
    ];

    const rows = this.benchmarkData.map(d => [
      d.sample,
      d.timestampMs,
      d.elapsedRunMs,
      d.fps,
      d.latencyMs,
      d.distanceM,
      d.lightingLux,
      d.gripPercent,
      d.thumbAngle,
      d.indexAngle,
      d.middleAngle,
      d.ringAngle,
      d.pinkyAngle
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
