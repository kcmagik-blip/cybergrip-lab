/**
 * CyberGrip: Three.js robot-hand digital twin
 * A base-mounted, palm-down hand grips a floor sample and carries it to a side platform.
 */

class RobotHandSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Hand assembly & joints
    this.handRoot = null;
    this.fingerJoints = [];
    this.fingerBends = [0, 0, 0, 0, 0];
    this.targetBends = [0, 0, 0, 0, 0];

    // Specimen & Pedestal
    this.specimen = null;
    this.specimenCore = null;
    this.specimenPedestal = null;
    this.specimenRing = null;
    this.giftLid = null;
    this.giftRibbonX = null;
    this.giftRibbonZ = null;
    this.giftTopRibbonX = null;
    this.giftTopRibbonZ = null;
    this.giftBow = null;
    this.giftUnwrapStartTime = 0;
    this.giftUnwrapping = false;
    this.deliveryCelebrated = false;
    this.celebrationTimeout = null;
    this.isHoldingSpecimen = false;
    this.sourceX = -0.48;
    this.targetX = 1.22;
    this.targetDropTolerance = 0.16;
    this.armShoulder = new THREE.Vector3(-1.42, 1.05, 0);
    this.upperArmLength = 1.55;
    this.lowerArmLength = 1.55;
    this.specimenFloorY = 0.27;
    this.targetPlatformTopY = 0.18;
    this.targetRestY = this.targetPlatformTopY + 0.02 + this.specimenFloorY;
    this.specimenVelocityY = 0;
    this.lastAnimationTime = performance.now();
    this.liftStartTime = 0;

    // A compact floor base anchors a pivoting shoulder/elbow arm and the side drop platform.
    this.pedestalY = 0.11;
    this.specimenRestY = this.specimenFloorY;
    this.specimenTargetY = this.specimenRestY;
    this.handScale = 0.64;
    this.handRestY = 1.52;
    this.graspY = this.handRestY;
    this.graspOffsetY = (this.specimenRestY - this.handRestY) / this.handScale;
    this.handCurrentY = this.handRestY;
    this.targetLiftY = this.handRestY;
    this.handTargetX = this.sourceX;
    this.handTargetRotation = new THREE.Euler(Math.PI, 0, 0);
    this.operatorHeightOffset = 0;
    this.trackingHand = false;
    this.gripRequested = false;
    this.ignoreGripUntilOpen = false;
    this.specimenGripOffset = new THREE.Vector3(0, this.graspOffsetY, 0);
    this.specimenGripRotation = new THREE.Quaternion();
    this.previewStartTime = 0;
    this.previewActive = false;
    this.previewLiftAdjustment = 0;
    this.safetyHold = false;

    // Materials cache
    this.materials = {};

    this.initScene();
    this.createMaterials();
    this.createEnvironment();
    this.buildRobotHand();
    this.createSpecimen();
    this.setupEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Soft neutral background keeps the hand and sample easy to see.
    this.scene.background = new THREE.Color(0xedf1f6);
    this.scene.fog = new THREE.FogExp2(0xedf1f6, 0.02);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Frame the stage itself so the twin stays centered between the side panels.
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 1.72, 7.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.enableRotate = false;
      this.controls.enablePan = false;
      this.controls.maxPolarAngle = Math.PI / 2;
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 16;
      this.controls.target.set(0, 0.95, 0);
    }

    // High-Key Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    this.scene.add(ambientLight);

    // Overhead Key Softbox
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    this.scene.add(keyLight);

    // Front-Fill Light (illuminates front of hand & specimen)
    const fillLight = new THREE.DirectionalLight(0xfff6ec, 1.3);
    fillLight.position.set(-5, 6, 7);
    this.scene.add(fillLight);

    // Subtle Rim Light
    const rimLight = new THREE.DirectionalLight(0xdbe7f6, 1.2);
    rimLight.position.set(0, 5, -6);
    this.scene.add(rimLight);
  }

  createMaterials() {
    // 1. Brushed titanium armor with a cool steel-blue finish.
    this.materials.titaniumAlloy = new THREE.MeshStandardMaterial({
      color: 0x8b9bab,
      metalness: 0.82,
      roughness: 0.27
    });

    // 2. Precision Machined Silver Aluminum (Knuckle Disks & Bezel)
    this.materials.silverAluminum = new THREE.MeshStandardMaterial({
      color: 0xc2cfdb,
      metalness: 0.88,
      roughness: 0.22
    });

    // 3. Dark Graphite Structural Core
    this.materials.graphiteCore = new THREE.MeshStandardMaterial({
      color: 0x1b2530,
      metalness: 0.78,
      roughness: 0.31
    });

    // 4. Soft Slate Tactile Grip Pads (Inner palm & finger pads)
    this.materials.tactilePad = new THREE.MeshStandardMaterial({
      color: 0x101820,
      roughness: 0.72,
      metalness: 0.15
    });

    // 5. Radiant Sunset Orange Specimen (HIGH CONTRAST)
    this.materials.vibrantOrange = new THREE.MeshStandardMaterial({
      color: 0xe87520,
      metalness: 0.58,
      roughness: 0.30,
      emissive: 0x572000,
      emissiveIntensity: 0.18
    });

    // 6. Accent Apple Blue
    this.materials.appleBlue = new THREE.MeshStandardMaterial({
      color: 0x0071e3,
      emissive: 0x0071e3,
      emissiveIntensity: 0.60
    });

    // 7. Latch Emerald Green
    this.materials.emeraldGreen = new THREE.MeshStandardMaterial({
      color: 0x28a745,
      emissive: 0x28a745,
      emissiveIntensity: 0.65
    });

    // Festive gift paper and a metallic gold ribbon for the delivery reveal.
    this.materials.giftWrapRed = new THREE.MeshStandardMaterial({
      color: 0xc81732,
      metalness: 0.12,
      roughness: 0.42,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });
    this.materials.giftRibbonGold = new THREE.MeshStandardMaterial({
      color: 0xf2c14e,
      metalness: 0.72,
      roughness: 0.26,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });
  }

  createEnvironment() {
    // Studio architectural concrete floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.88,
      metalness: 0.10
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle clean studio grid
    this.gridHelper = new THREE.GridHelper(22, 22, 0xb8c3d1, 0xccd5e0);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);

    // Compact base supports the arm's shoulder joint.
    const baseGeo = new THREE.CylinderGeometry(0.58, 0.66, 0.22, 48);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.graphiteCore);
    baseMesh.position.set(-1.42, this.pedestalY, 0);
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(0.56, 0.018, 12, 48);
    const baseRing = new THREE.Mesh(baseRingGeo, this.materials.silverAluminum);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(-1.42, this.pedestalY * 2, 0);
    this.scene.add(baseRing);

    const mastGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.86, 32);
    const mast = new THREE.Mesh(mastGeo, this.materials.silverAluminum);
    mast.position.set(-1.42, 0.65, 0);
    mast.castShadow = true;
    this.scene.add(mast);

    [0.38, 0.68, 0.96].forEach((y) => {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.205, 0.205, 0.055, 32),
        this.materials.graphiteCore
      );
      band.position.set(-1.42, y, 0);
      this.scene.add(band);
    });

    const shoulderSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 28, 22),
      this.materials.graphiteCore
    );
    shoulderSocket.position.copy(this.armShoulder);
    this.scene.add(shoulderSocket);

    const shoulderBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.12, 24),
      this.materials.silverAluminum
    );
    shoulderBolt.rotation.x = Math.PI / 2;
    shoulderBolt.position.set(this.armShoulder.x, this.armShoulder.y, 0.24);
    this.scene.add(shoulderBolt);

    const armLinkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1, 12);
    this.upperArmShell = new THREE.Mesh(armLinkGeo, this.materials.titaniumAlloy);
    this.lowerArmShell = new THREE.Mesh(armLinkGeo, this.materials.titaniumAlloy);
    this.upperArmShell.castShadow = true;
    this.lowerArmShell.castShadow = true;
    this.scene.add(this.upperArmShell, this.lowerArmShell);

    const pistonGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 12);
    this.upperArmPiston = new THREE.Mesh(pistonGeo, this.materials.silverAluminum);
    this.lowerArmPiston = new THREE.Mesh(pistonGeo, this.materials.silverAluminum);
    this.scene.add(this.upperArmPiston, this.lowerArmPiston);

    this.elbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 20),
      this.materials.graphiteCore
    );
    this.elbowBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.12, 24),
      this.materials.silverAluminum
    );
    this.elbowBolt.rotation.x = Math.PI / 2;
    this.scene.add(this.elbowJoint, this.elbowBolt);

    // A small raised drop platform sits to the right of the floor pickup zone.
    const targetGeo = new THREE.CylinderGeometry(0.40, 0.46, this.targetPlatformTopY, 40);
    const target = new THREE.Mesh(targetGeo, this.materials.silverAluminum);
    target.position.set(this.targetX, this.targetPlatformTopY / 2, 0);
    target.receiveShadow = true;
    target.castShadow = true;
    this.scene.add(target);

    const targetTopGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.025, 40);
    const targetTop = new THREE.Mesh(targetTopGeo, this.materials.graphiteCore);
    targetTop.position.set(this.targetX, this.targetPlatformTopY + 0.0125, 0);
    this.scene.add(targetTop);

    const targetRingGeo = new THREE.TorusGeometry(0.32, 0.014, 12, 48);
    const targetRing = new THREE.Mesh(targetRingGeo, this.materials.emeraldGreen);
    targetRing.rotation.x = Math.PI / 2;
    targetRing.position.set(this.targetX, this.targetPlatformTopY + 0.03, 0);
    this.scene.add(targetRing);

    // A floor ring marks where the sample starts without lifting it off the floor.
    const pickupRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.39, 0.012, 12, 48),
      this.materials.appleBlue
    );
    pickupRing.rotation.x = Math.PI / 2;
    pickupRing.position.set(this.sourceX, 0.012, 0);
    this.scene.add(pickupRing);
  }

  createSpecimen() {
    // The wrapped sample starts on the floor pickup marker. Its original orange
    // specimen stays hidden inside until a successful platform delivery.
    const specimenGroup = new THREE.Group();
    specimenGroup.position.set(this.sourceX, this.specimenRestY, 0);
    const core = new THREE.Group();

    // Radiant Sunset Orange Specimen Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.50, 32);
    const cylMesh = new THREE.Mesh(cylGeo, this.materials.vibrantOrange);
    cylMesh.castShadow = true;
    core.add(cylMesh);

    // Silver Aluminum End-Caps
    const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32);
    const topCap = new THREE.Mesh(capGeo, this.materials.silverAluminum);
    topCap.position.set(0, 0.25, 0);
    core.add(topCap);

    const btmCap = new THREE.Mesh(capGeo, this.materials.silverAluminum);
    btmCap.position.set(0, -0.25, 0);
    core.add(btmCap);

    // Magnetic Latch Indicator Ring around the specimen
    const ringGeo = new THREE.TorusGeometry(0.265, 0.012, 12, 40);
    this.specimenRing = new THREE.Mesh(ringGeo, this.materials.appleBlue);
    this.specimenRing.rotation.x = Math.PI / 2;
    core.add(this.specimenRing);
    core.visible = false;
    this.specimenCore = core;
    specimenGroup.add(core);

    // Red box, fitted lid, crossed gold bands, and a simple bow.
    const gift = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.47, 0.49), this.materials.giftWrapRed);
    body.position.y = -0.035;
    body.castShadow = true;
    body.receiveShadow = true;
    gift.add(body);

    this.giftLid = new THREE.Group();
    this.giftLid.position.y = 0.18;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.075, 0.52), this.materials.giftWrapRed);
    lid.position.y = 0.035;
    lid.castShadow = true;
    lid.receiveShadow = true;
    this.giftLid.add(lid);
    gift.add(this.giftLid);

    this.giftRibbonX = new THREE.Group();
    const ribbonAlongX = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.47, 0.505), this.materials.giftRibbonGold);
    ribbonAlongX.position.y = -0.035;
    this.giftRibbonX.add(ribbonAlongX);
    gift.add(this.giftRibbonX);

    this.giftRibbonZ = new THREE.Group();
    const ribbonAlongZ = new THREE.Mesh(new THREE.BoxGeometry(0.505, 0.47, 0.075), this.materials.giftRibbonGold);
    ribbonAlongZ.position.y = -0.035;
    this.giftRibbonZ.add(ribbonAlongZ);
    gift.add(this.giftRibbonZ);

    this.giftTopRibbonX = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.52), this.materials.giftRibbonGold);
    this.giftTopRibbonX.position.set(0, 0.226, 0);
    gift.add(this.giftTopRibbonX);
    this.giftTopRibbonZ = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.012, 0.09), this.materials.giftRibbonGold);
    this.giftTopRibbonZ.position.set(0, 0.227, 0);
    gift.add(this.giftTopRibbonZ);

    this.giftBow = new THREE.Group();
    const bowLoopGeometry = new THREE.TorusGeometry(0.07, 0.018, 10, 24, Math.PI * 1.6);
    const leftLoop = new THREE.Mesh(bowLoopGeometry, this.materials.giftRibbonGold);
    leftLoop.rotation.z = Math.PI * 0.62;
    leftLoop.position.set(-0.045, 0.27, 0);
    this.giftBow.add(leftLoop);
    const rightLoop = new THREE.Mesh(bowLoopGeometry, this.materials.giftRibbonGold);
    rightLoop.rotation.z = -Math.PI * 0.62;
    rightLoop.position.set(0.045, 0.27, 0);
    this.giftBow.add(rightLoop);
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), this.materials.giftRibbonGold);
    bowKnot.position.y = 0.265;
    this.giftBow.add(bowKnot);
    gift.add(this.giftBow);

    this.giftWrap = gift;
    specimenGroup.add(gift);

    this.specimen = specimenGroup;
    this.scene.add(this.specimen);
  }

  resetGiftWrap() {
    this.giftUnwrapping = false;
    this.giftUnwrapStartTime = 0;
    this.deliveryCelebrated = false;
    if (this.celebrationTimeout !== null) {
      window.clearTimeout(this.celebrationTimeout);
      this.celebrationTimeout = null;
    }
    if (this.specimenCore) this.specimenCore.visible = false;
    if (this.giftWrap) this.giftWrap.visible = true;
    if (this.giftLid) {
      this.giftLid.position.set(0, 0.18, 0);
      this.giftLid.rotation.set(0, 0, 0);
    }
    if (this.giftRibbonX) {
      this.giftRibbonX.position.set(0, 0, 0);
      this.giftRibbonX.rotation.set(0, 0, 0);
    }
    if (this.giftRibbonZ) {
      this.giftRibbonZ.position.set(0, 0, 0);
      this.giftRibbonZ.rotation.set(0, 0, 0);
    }
    if (this.giftBow) {
      this.giftBow.position.set(0, 0, 0);
      this.giftBow.rotation.set(0, 0, 0);
    }
    this.materials.giftWrapRed.opacity = 1;
    this.materials.giftRibbonGold.opacity = 1;
    const toast = document.getElementById('celebration-toast');
    if (toast) {
      toast.hidden = true;
      toast.classList.remove('celebrate-in');
    }
  }

  celebrateDelivery(now) {
    if (this.deliveryCelebrated) return;
    this.deliveryCelebrated = true;
    this.giftUnwrapping = true;
    this.giftUnwrapStartTime = now;
    if (this.specimenCore) this.specimenCore.visible = true;

    const toast = document.getElementById('celebration-toast');
    if (toast) {
      toast.hidden = false;
      toast.classList.remove('celebrate-in');
      void toast.offsetWidth;
      toast.classList.add('celebrate-in');
      if (this.celebrationTimeout !== null) window.clearTimeout(this.celebrationTimeout);
      this.celebrationTimeout = window.setTimeout(() => {
        toast.hidden = true;
        this.celebrationTimeout = null;
      }, 6000);
    }
  }

  updateGiftUnwrap(now) {
    if (!this.giftUnwrapping) return;
    const progress = THREE.MathUtils.clamp((now - this.giftUnwrapStartTime) / 1500, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    this.materials.giftWrapRed.opacity = 1 - eased;
    this.materials.giftRibbonGold.opacity = 1 - eased;
    this.giftLid.position.y = 0.18 + 0.52 * eased;
    this.giftLid.rotation.z = -0.18 * eased;
    this.giftRibbonX.position.set(-0.22 * eased, 0.38 * eased, 0);
    this.giftRibbonX.rotation.z = -0.8 * eased;
    this.giftRibbonZ.position.set(0.22 * eased, 0.28 * eased, 0);
    this.giftRibbonZ.rotation.x = 0.8 * eased;
    this.giftBow.position.set(0.08 * eased, 0.46 * eased, 0);
    this.giftBow.rotation.z = 0.6 * eased;
    if (progress >= 1) {
      this.giftUnwrapping = false;
      this.giftWrap.visible = false;
    }
  }

  buildRobotHand() {
    this.handRoot = new THREE.Group();
    // The articulated arm supports the wrist; the palm stays parallel to the floor.
    this.handRoot.position.set(this.sourceX, this.handRestY, 0);
    this.handRoot.rotation.set(Math.PI, 0, 0);
    this.handRoot.scale.setScalar(this.handScale);
    this.scene.add(this.handRoot);

    // ==========================================
    // 1. Forearm Mount & Wrist Gimbal
    // ==========================================
    const wristGroup = new THREE.Group();
    this.handRoot.add(wristGroup);

    // Machined silver aluminum wrist ring
    const ringGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 32);
    const ring = new THREE.Mesh(ringGeo, this.materials.silverAluminum);
    ring.position.set(0, 0.02, 0);
    wristGroup.add(ring);

    // Apple Blue status bezel ring
    const ledRingGeo = new THREE.TorusGeometry(0.38, 0.012, 16, 64);
    const ledRing = new THREE.Mesh(ledRingGeo, this.materials.appleBlue);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.set(0, 0.02, 0);
    wristGroup.add(ledRing);

    // Internal dark graphite spherical joint
    const gimbalGeo = new THREE.SphereGeometry(0.29, 24, 24);
    const gimbal = new THREE.Mesh(gimbalGeo, this.materials.graphiteCore);
    gimbal.position.set(0, -0.14, 0);
    wristGroup.add(gimbal);

    // A plated wrist stem visibly joins the rotating joint to the palm shell.
    const wristStemGeo = new THREE.CylinderGeometry(0.20, 0.24, 0.68, 20);
    const wristStem = new THREE.Mesh(wristStemGeo, this.materials.titaniumAlloy);
    wristStem.position.set(0, 0.38, 0);
    wristStem.castShadow = true;
    wristGroup.add(wristStem);

    // ==========================================
    // 2. Low-profile titanium palm housing parallel to the floor.
    // ==========================================
    const palmGroup = new THREE.Group();
    palmGroup.position.set(0, 0.20, 0);
    this.handRoot.add(palmGroup);

    // Low-profile titanium palm shell
    const palmGeo = new THREE.SphereGeometry(1, 32, 24);
    const palm = new THREE.Mesh(palmGeo, this.materials.titaniumAlloy);
    palm.position.set(0, 0.69, 0);
    palm.scale.set(0.70, 0.27, 0.42);
    palm.castShadow = true;
    palmGroup.add(palm);

    // Rubber contact plate faces the floor and reinforces the palm shell.
    const palmPadGeo = new THREE.BoxGeometry(0.72, 0.035, 0.60);
    const palmPad = new THREE.Mesh(palmPadGeo, this.materials.tactilePad);
    palmPad.position.set(0, 0.96, 0);
    palmGroup.add(palmPad);

    // Machined knuckle bridge ties the finger pivots together.
    const bridgeGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.35, 24);
    const bridge = new THREE.Mesh(bridgeGeo, this.materials.titaniumAlloy);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 1.02, -0.03);
    bridge.castShadow = true;
    palmGroup.add(bridge);

    // ==========================================
    // 3. Ergonomic Sculpted Capsule Digits
    // ==========================================
    const fingerConfigs = [
      { name: 'Thumb',  x: -0.62, y: 0.86, z:  0.30, scale: 0.88, isThumb: true },
      { name: 'Index',  x: -0.48, y: 1.10, z:  0.18, scale: 0.94, isThumb: false },
      { name: 'Middle', x: -0.24, y: 1.13, z: -0.45, scale: 1.00, isThumb: false },
      { name: 'Ring',   x:  0.24, y: 1.11, z: -0.45, scale: 0.96, isThumb: false },
      { name: 'Pinky',  x:  0.48, y: 1.02, z:  0.18, scale: 0.82, isThumb: false }
    ];

    this.fingerJoints = [];

    fingerConfigs.forEach((cfg) => {
      const finger = this.createIRobotFinger(cfg);
      this.handRoot.add(finger.root);
      this.fingerJoints.push(finger);
    });
  }

  createIRobotFinger(cfg) {
    const root = new THREE.Group();
    root.position.set(cfg.x, cfg.y, cfg.z);

    if (cfg.isThumb) {
      // Thumb angled naturally inward to face the palm
      root.rotation.z = -Math.PI / 4.8;
      root.rotation.y = -Math.PI / 4.5;
    }

    // Joint 1: Knuckle Aluminum Disk
    const mcpGroup = new THREE.Group();
    root.add(mcpGroup);

    const knuckleDiskGeo = new THREE.SphereGeometry(0.13 * cfg.scale, 20, 16);
    const knuckleDisk = new THREE.Mesh(knuckleDiskGeo, this.materials.graphiteCore);
    knuckleDisk.castShadow = true;
    mcpGroup.add(knuckleDisk);
    const knuckleBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075 * cfg.scale, 0.075 * cfg.scale, 0.035, 20),
      this.materials.silverAluminum
    );
    knuckleBolt.rotation.x = Math.PI / 2;
    knuckleBolt.position.z = 0.105 * cfg.scale;
    mcpGroup.add(knuckleBolt);

    // Segment 1: Proximal Capsule
    const pLen = 0.52 * cfg.scale;
    const pBoneGroup = new THREE.Group();
    pBoneGroup.position.set(0, pLen / 2, 0);

    const pOuterGeo = new THREE.CylinderGeometry(0.11 * cfg.scale, 0.13 * cfg.scale, pLen, 20);
    const pOuter = new THREE.Mesh(pOuterGeo, this.materials.titaniumAlloy);
    pOuter.castShadow = true;
    pBoneGroup.add(pOuter);

    const pCapGeo = new THREE.SphereGeometry(0.105 * cfg.scale, 16, 12);
    const pBaseCap = new THREE.Mesh(pCapGeo, this.materials.titaniumAlloy);
    pBaseCap.position.y = -pLen / 2;
    pBoneGroup.add(pBaseCap);
    const pEndCap = new THREE.Mesh(pCapGeo, this.materials.titaniumAlloy);
    pEndCap.position.y = pLen / 2;
    pBoneGroup.add(pEndCap);

    // Inner tactile grip pad (facing forward +Z)
    mcpGroup.add(pBoneGroup);

    // Joint 2: PIP Intermediate Hinge
    const pipGroup = new THREE.Group();
    pipGroup.position.set(0, pLen, 0);
    mcpGroup.add(pipGroup);

    const pipDiskGeo = new THREE.SphereGeometry(0.11 * cfg.scale, 18, 14);
    const pipDisk = new THREE.Mesh(pipDiskGeo, this.materials.graphiteCore);
    pipDisk.castShadow = true;
    pipGroup.add(pipDisk);
    const pipBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062 * cfg.scale, 0.062 * cfg.scale, 0.03, 18),
      this.materials.silverAluminum
    );
    pipBolt.rotation.x = Math.PI / 2;
    pipBolt.position.z = 0.085 * cfg.scale;
    pipGroup.add(pipBolt);

    // Segment 2: Intermediate Capsule
    const iLen = 0.40 * cfg.scale;
    const iBoneGroup = new THREE.Group();
    iBoneGroup.position.set(0, iLen / 2, 0);

    const iOuterGeo = new THREE.CylinderGeometry(0.09 * cfg.scale, 0.11 * cfg.scale, iLen, 18);
    const iOuter = new THREE.Mesh(iOuterGeo, this.materials.titaniumAlloy);
    iOuter.castShadow = true;
    iBoneGroup.add(iOuter);

    const iCapGeo = new THREE.SphereGeometry(0.085 * cfg.scale, 16, 12);
    const iBaseCap = new THREE.Mesh(iCapGeo, this.materials.titaniumAlloy);
    iBaseCap.position.y = -iLen / 2;
    iBoneGroup.add(iBaseCap);
    const iEndCap = new THREE.Mesh(iCapGeo, this.materials.titaniumAlloy);
    iEndCap.position.y = iLen / 2;
    iBoneGroup.add(iEndCap);

    pipGroup.add(iBoneGroup);

    // Joint 3: DIP & Fingertip Capsule
    const dipGroup = new THREE.Group();
    dipGroup.position.set(0, iLen, 0);
    pipGroup.add(dipGroup);

    const dLen = 0.30 * cfg.scale;
    const tipGeo = new THREE.CylinderGeometry(0.07 * cfg.scale, 0.09 * cfg.scale, dLen, 18);
    const tipMesh = new THREE.Mesh(tipGeo, this.materials.titaniumAlloy);
    tipMesh.position.set(0, dLen / 2, 0);
    tipMesh.castShadow = true;
    dipGroup.add(tipMesh);

    // Soft rounded fingertip cap
    const capGeo = new THREE.SphereGeometry(0.078 * cfg.scale, 16, 16);
    const capMesh = new THREE.Mesh(capGeo, this.materials.tactilePad);
    capMesh.position.set(0, dLen, 0);
    dipGroup.add(capMesh);

    return {
      root,
      mcp: mcpGroup,
      pip: pipGroup,
      dip: dipGroup,
      isThumb: cfg.isThumb,
      curlSide: cfg.x === 0 ? 1 : Math.sign(cfg.x),
      curlDepth: cfg.z < 0 ? 1 : -1
    };
  }

  updateFingerBends(bendRatios) {
    for (let i = 0; i < 5; i++) {
      this.targetBends[i] = Math.max(0, Math.min(1, bendRatios[i] || 0));
    }
  }

  updateHandPose(pos, rot) {
    this.trackingHand = Boolean(pos);
    if (!pos) return;

    // Camera X maps the hand from the floor pickup zone to the side platform.
    const mirroredX = 1 - pos.x;
    this.handTargetX = THREE.MathUtils.lerp(this.sourceX, this.targetX, mirroredX);
    // Vertical movement adds a small lift once the sample is attached.
    this.operatorHeightOffset = THREE.MathUtils.clamp((0.52 - pos.y) * 0.45, -0.08, 0.18);

    // Keep wrist rotation subtle so the grip stays aligned with the sample.
    const safeRot = rot || {};
    this.handTargetRotation.set(
      Math.PI + THREE.MathUtils.clamp((safeRot.pitch || 0) * 0.06, -0.10, 0.10),
      THREE.MathUtils.clamp((safeRot.yaw || 0) * 0.10, -0.18, 0.18),
      THREE.MathUtils.clamp((safeRot.roll || 0) * 0.10, -0.2, 0.2)
    );
  }

  resetObject() {
    this.previewActive = false;
    this.resetGiftWrap();
    this.isHoldingSpecimen = false;
    this.gripRequested = false;
    this.ignoreGripUntilOpen = true;
    this.specimenGripOffset.set(0, this.graspOffsetY, 0);
    this.specimenGripRotation.identity();
    this.specimenTargetY = this.specimenRestY;
    this.specimenVelocityY = 0;
    this.liftStartTime = 0;
    this.specimenRing.material = this.materials.appleBlue;
    this.specimen.position.set(this.sourceX, this.specimenRestY, 0);
    this.handTargetX = this.sourceX;
    this.operatorHeightOffset = 0;
    this.handCurrentY = this.handRestY;
    this.handRoot.position.set(this.sourceX, this.handRestY, 0);
    this.handRoot.rotation.set(Math.PI, 0, 0);
    this.handTargetRotation.set(Math.PI, 0, 0);
    this.specimen.rotation.set(0, 0, 0);

    const badge = document.getElementById('mission-status');
    if (badge) {
      badge.textContent = 'Sample on the floor';
      badge.className = 'mission-badge';
    }
    const island = document.getElementById('island-prompt');
    if (island) island.textContent = 'Move over the floor sample, close to grip, and carry it to the side platform';
  }

  playPickupPreview() {
    if (this.previewActive) return;
    this.resetGiftWrap();
    this.previewStartTime = performance.now();
    this.previewActive = true;
    this.ignoreGripUntilOpen = false;
    this.gripRequested = false;
    this.isHoldingSpecimen = false;
    this.fingerBends.fill(0);
    this.targetBends.fill(0);
    this.specimenVelocityY = 0;
    this.specimenTargetY = this.specimenRestY;
    this.specimen.position.set(this.sourceX, this.specimenRestY, 0);
    this.specimen.quaternion.identity();
    this.handTargetX = this.sourceX;
    this.handCurrentY = this.handRestY;
    this.targetLiftY = this.handRestY;
    this.handRoot.position.set(this.sourceX, this.handRestY, 0);
    this.handRoot.rotation.set(Math.PI, 0, 0);
    this.handTargetRotation.set(Math.PI, 0, 0);
    this.previewLiftAdjustment = 0;
    this.operatorHeightOffset = 0;
  }

  resetCamera() {
    this.camera.position.set(0, 1.72, 7.8);
    if (this.controls) {
      this.controls.target.set(0, 0.95, 0);
      this.controls.update();
    }
  }

  toggleGrid() {
    if (this.gridHelper) {
      this.gridHelper.visible = !this.gridHelper.visible;
    }
  }

  setSafetyBlocked(blocked) {
    this.safetyHold = Boolean(blocked);
    if (this.safetyHold) this.previewActive = false;
  }

  setupEvents() {
    const resize = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (!width || !height) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(this.container);
    }
  }

  placeArmLink(mesh, start, end, depth = 0) {
    const direction = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
    const length = direction.length();
    mesh.position.set(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
      (start.z + end.z) / 2 + depth
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.set(1, length, 1);
  }

  updateArmKinematics() {
    if (!this.handRoot || !this.upperArmShell) return;

    const wrist = this.handRoot.position;
    const dx = wrist.x - this.armShoulder.x;
    const dy = wrist.y - this.armShoulder.y;
    const rawDistance = Math.hypot(dx, dy);
    const distance = THREE.MathUtils.clamp(
      rawDistance,
      Math.abs(this.upperArmLength - this.lowerArmLength) + 0.001,
      this.upperArmLength + this.lowerArmLength - 0.001
    );
    const along = (this.upperArmLength ** 2 - this.lowerArmLength ** 2 + distance ** 2) / (2 * distance);
    const elbowHeight = Math.sqrt(Math.max(0, this.upperArmLength ** 2 - along ** 2));
    const unitX = dx / rawDistance;
    const unitY = dy / rawDistance;
    const elbow = new THREE.Vector3(
      this.armShoulder.x + along * unitX - unitY * elbowHeight,
      this.armShoulder.y + along * unitY + unitX * elbowHeight,
      0
    );
    const shoulder = this.armShoulder;

    this.placeArmLink(this.upperArmShell, shoulder, elbow);
    this.placeArmLink(this.lowerArmShell, elbow, wrist);
    this.placeArmLink(this.upperArmPiston, shoulder, elbow, 0.13);
    this.upperArmPiston.scale.y *= 0.72;
    this.placeArmLink(this.lowerArmPiston, elbow, wrist, 0.13);
    this.lowerArmPiston.scale.y *= 0.72;
    this.elbowJoint.position.copy(elbow);
    this.elbowBolt.position.set(elbow.x, elbow.y, 0.23);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const now = performance.now();
    this.updateGiftUnwrap(now);
    const deltaSeconds = Math.min((now - this.lastAnimationTime) / 1000, 0.05);
    this.lastAnimationTime = now;
    if (this.safetyHold) {
      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const fingerAlpha = 1 - Math.exp(-8 * deltaSeconds);
    const handAlpha = 1 - Math.exp(-7 * deltaSeconds);
    const rotationAlpha = 1 - Math.exp(-6 * deltaSeconds);

    if (this.previewActive) {
      const previewSeconds = (now - this.previewStartTime) / 1000;
      if (previewSeconds < 0.35) {
        this.targetBends.fill(0.02);
        this.handTargetX = this.sourceX;
        this.previewLiftAdjustment = 0;
      } else if (previewSeconds < 1.30) {
        this.targetBends.fill(0.92);
        this.handTargetX = this.sourceX;
        this.previewLiftAdjustment = 0;
      } else if (previewSeconds < 1.75) {
        this.targetBends.fill(0.92);
        this.handTargetX = this.sourceX;
        this.previewLiftAdjustment = 0;
      } else if (previewSeconds < 2.65) {
        this.targetBends.fill(0.92);
        const travel = (previewSeconds - 1.75) / 0.90;
        this.handTargetX = THREE.MathUtils.lerp(this.sourceX, this.targetX, travel);
        this.previewLiftAdjustment = 0;
      } else if (previewSeconds < 3.15) {
        this.targetBends.fill(0.92);
        this.handTargetX = this.targetX;
        this.previewLiftAdjustment = -0.20;
      } else if (previewSeconds < 3.75) {
        this.targetBends.fill(0.02);
        this.handTargetX = this.targetX;
        this.previewLiftAdjustment = -0.20;
      } else if (previewSeconds < 4.40) {
        this.targetBends.fill(0.02);
        this.handTargetX = THREE.MathUtils.lerp(
          this.targetX,
          this.sourceX,
          (previewSeconds - 3.75) / 0.65
        );
        this.previewLiftAdjustment = 0;
      } else {
        this.previewActive = false;
        this.targetBends.fill(0);
        this.handTargetX = this.sourceX;
        this.previewLiftAdjustment = 0;
      }
      this.operatorHeightOffset = 0;
    }

    // 1. Smooth the joint targets with time-based easing so movement feels similar at any FPS.
    for (let i = 0; i < 5; i++) {
      this.fingerBends[i] = THREE.MathUtils.lerp(this.fingerBends[i], this.targetBends[i], fingerAlpha);
      const bend = this.fingerBends[i];
      const joints = this.fingerJoints[i];

      if (joints) {
        if (joints.isThumb) {
          // The thumb sweeps across the palm while its joints curl toward the grip.
          joints.mcp.rotation.set(joints.curlDepth * bend * 0.38, 0, joints.curlSide * bend * 0.56);
          joints.pip.rotation.set(joints.curlDepth * bend * 0.52, 0, joints.curlSide * bend * 0.42);
          joints.dip.rotation.set(joints.curlDepth * bend * 0.38, 0, joints.curlSide * bend * 0.28);
        } else {
          // Curl toward the palm and slightly inward so the digits close around the sample.
          joints.mcp.rotation.set(joints.curlDepth * bend * 0.46, 0, joints.curlSide * bend * 0.18);
          joints.pip.rotation.set(joints.curlDepth * bend * 0.82, 0, joints.curlSide * bend * 0.22);
          joints.dip.rotation.set(joints.curlDepth * bend * 0.58, 0, joints.curlSide * bend * 0.16);
        }
      }
    }

    // 2. Calculate overall grip closure
    const avgGrip = (this.fingerBends[1] + this.fingerBends[2] + this.fingerBends[3] + this.fingerBends[4]) / 4;

    // 3. Teleoperated Grasp & Lift Logic
    const badge = document.getElementById('mission-status');
    const island = document.getElementById('island-prompt');
    const setTextIfChanged = (element, value) => {
      if (element && element.textContent !== value) element.textContent = value;
    };

    const nearPickup = Math.abs(this.handTargetX - this.specimen.position.x) < 0.34;
    if (this.ignoreGripUntilOpen) {
      if (avgGrip < 0.32) this.ignoreGripUntilOpen = false;
      this.gripRequested = false;
    } else if (this.gripRequested ? avgGrip < 0.32 : avgGrip > 0.52) {
      this.gripRequested = !this.gripRequested;
    }
    if (!this.gripRequested && this.isHoldingSpecimen) {
      this.isHoldingSpecimen = false;
      this.liftStartTime = 0;
      this.specimenVelocityY = 0;
      this.specimenTargetY = Math.abs(this.specimen.position.x - this.targetX) < this.targetDropTolerance
        ? this.targetRestY
        : this.specimenFloorY;
    }

    if (this.isHoldingSpecimen) {
      this.targetLiftY = now < this.liftStartTime
        ? this.handRestY
        : this.handRestY + Math.max(0.20, 0.42 + this.operatorHeightOffset + this.previewLiftAdjustment);
    } else {
      this.targetLiftY = this.handRestY;
    }

    this.handCurrentY = THREE.MathUtils.lerp(this.handCurrentY, this.targetLiftY, handAlpha);
    this.handRoot.position.x = THREE.MathUtils.lerp(this.handRoot.position.x, this.handTargetX, handAlpha);
    this.handRoot.position.y = this.handCurrentY;
    this.handRoot.rotation.x = THREE.MathUtils.lerp(this.handRoot.rotation.x, this.handTargetRotation.x, rotationAlpha);
    this.handRoot.rotation.y = THREE.MathUtils.lerp(this.handRoot.rotation.y, this.handTargetRotation.y, rotationAlpha);
    this.handRoot.rotation.z = THREE.MathUtils.lerp(this.handRoot.rotation.z, this.handTargetRotation.z, rotationAlpha);
    this.updateArmKinematics();

    if (this.gripRequested && !this.isHoldingSpecimen && nearPickup && avgGrip > 0.62) {
      this.handRoot.updateMatrixWorld(true);
      this.specimenGripOffset.copy(this.handRoot.worldToLocal(this.specimen.position.clone()));
      this.specimenGripRotation.copy(this.handRoot.quaternion).invert().multiply(this.specimen.quaternion);
      this.isHoldingSpecimen = true;
      this.liftStartTime = now + 180;
    }

    if (this.isHoldingSpecimen) {
      this.handRoot.updateMatrixWorld(true);
      this.specimen.position.copy(this.handRoot.localToWorld(this.specimenGripOffset.clone()));
      this.specimen.quaternion.copy(this.handRoot.quaternion).multiply(this.specimenGripRotation);
      this.specimenRing.material = this.materials.emeraldGreen;
      if (badge) {
        setTextIfChanged(badge, 'Sample picked up');
        badge.className = 'mission-badge success';
      }
      setTextIfChanged(island, 'Swing the arm to the green side platform, then open to release');
    } else {
      this.specimenRing.material = this.materials.appleBlue;

      if (this.specimen.position.y <= this.specimenTargetY) {
        this.specimen.position.y = this.specimenTargetY;
        this.specimenVelocityY = 0;
      } else {
        this.specimenVelocityY -= 5.5 * deltaSeconds;
        this.specimen.position.y += this.specimenVelocityY * deltaSeconds;
        if (this.specimen.position.y <= this.specimenTargetY) {
          this.specimen.position.y = this.specimenTargetY;
          this.specimenVelocityY = 0;
        }
      }

      const delivered = Math.abs(this.specimen.position.x - this.targetX) < this.targetDropTolerance
        && Math.abs(this.specimen.position.y - this.targetRestY) < 0.015
        && this.specimenVelocityY === 0;
      if (delivered) this.celebrateDelivery(now);
      const missedPlatform = Math.abs(this.specimen.position.x - this.targetX) < 0.52
        && Math.abs(this.specimen.position.y - this.specimenFloorY) < 0.015
        && this.specimenVelocityY === 0;

      if (badge && this.gripRequested && !nearPickup) {
        setTextIfChanged(badge, 'Move hand over the sample to pick up');
        badge.className = 'mission-badge';
      } else if (badge && this.gripRequested && nearPickup) {
        setTextIfChanged(badge, 'Close your hand fully to grip');
        badge.className = 'mission-badge';
      } else if (badge) {
        const readyText = delivered
          ? 'Congratulations — gift delivered!'
          : missedPlatform
            ? 'Missed platform — try again'
            : !this.trackingHand
              ? 'Show your hand to begin'
              : this.ignoreGripUntilOpen ? 'Open hand to re-arm' : 'Sample on the floor';
        setTextIfChanged(badge, readyText);
        badge.className = 'mission-badge';
      }

      if (island) {
        if (delivered) {
          setTextIfChanged(island, 'Congratulations! The specimen is on the platform. Reset to unwrap another gift.');
        } else if (missedPlatform) {
          setTextIfChanged(island, 'Missed the platform — reset the specimen and try again');
        } else if (!this.trackingHand) {
          setTextIfChanged(island, 'Show your whole hand in the camera view');
        } else if (this.ignoreGripUntilOpen) {
          setTextIfChanged(island, 'Open your hand to re-arm the pickup');
        } else if (this.gripRequested && nearPickup) {
          setTextIfChanged(island, 'Close your hand fully to grip the sample');
        } else {
          setTextIfChanged(island, this.gripRequested && !nearPickup
            ? 'Move your hand over the sample to reach it'
            : 'Close over the floor sample, carry it to the side platform, and open to drop it');
        }
      }
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
