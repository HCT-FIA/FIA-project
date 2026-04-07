/*
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var ptzCameraBtnElement = document.querySelector('#ptzCameraBtn');
  var ptzCameraPanelElement = document.querySelector('#ptzCameraPanel');
  var ptzCloseBtnElement = document.querySelector('#ptzCloseBtn');
  var ptzOverlayElement = document.querySelector('#ptzOverlay');

  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
    requestGyroPermission();
  }, { passive: true });

  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  var scenes = data.scenes.map(function(sceneData) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + sceneData.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + sceneData.id + "/preview.jpg" }
    );

    var geometry = new Marzipano.CubeGeometry(sceneData.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(
      sceneData.faceSize,
      80 * Math.PI / 180,
      140 * Math.PI / 180
    );

    var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneData.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    sceneData.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: sceneData,
      scene: scene,
      view: view
    };
  });

  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI / 2
  });

  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');

    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });

    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  sceneListToggleElement.addEventListener('click', toggleSceneList);

  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    if (el) {
      el.addEventListener('click', function() {
        switchScene(scene);
        if (document.body.classList.contains('mobile')) {
          hideSceneList();
        }
      });
    }
  });

  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  var velocity = 0.7;
  var friction = 3;

  var controls = viewer.controls();
  controls.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  controls.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  controls.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);
  controls.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', velocity, friction), true);
  controls.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', -velocity, friction), true);

  var gyroSupported = typeof window.DeviceOrientationEvent !== 'undefined';
  var gyroRequested = false;
  var gyroEnabled = false;
  var gyroInitial = null;
  var currentScene = null;

  var ptzCameraLocationElement = document.querySelector('#ptzCameraLocation');
  var ptzCameraIdElement = document.querySelector('#ptzCameraId');
  var ptzCameraStatusElement = document.querySelector('#ptzCameraStatus');
  var ptzDirectionElement = document.querySelector('#ptzDirection');
  var ptzZoomElement = document.querySelector('#ptzZoom');
  var ptzSceneNoteElement = document.querySelector('#ptzSceneNote');
  var ptzControlElements = document.querySelectorAll('[data-ptz-action]');
  var ptzPresetElements = document.querySelectorAll('[data-ptz-preset]');
  var ptzZoomLevel = 1;

  var aiAnalyzeBtnElement = document.querySelector('#aiAnalyzeBtn');
  var aiAreaTypeElement = document.querySelector('#aiAreaType');
  var aiCrowdLevelElement = document.querySelector('#aiCrowdLevel');
  var aiSecurityStatusElement = document.querySelector('#aiSecurityStatus');
  var aiDetectedObjectsElement = document.querySelector('#aiDetectedObjects');
  var aiRecommendationElement = document.querySelector('#aiRecommendation');

  var ptzSweepInterval = null;
  var ptzSweepDirection = 1;
  var ptzSweepStep = 0.03;
  var ptzSweepRange = 0.45;
  var ptzSweepCenterYaw = null;

  if (ptzCameraBtnElement) {
    ptzCameraBtnElement.addEventListener('click', openPtzPanel);
  }
  if (ptzCloseBtnElement) {
    ptzCloseBtnElement.addEventListener('click', closePtzPanel);
  }
  if (ptzOverlayElement) {
    ptzOverlayElement.addEventListener('click', closePtzPanel);
  }

  Array.prototype.forEach.call(ptzControlElements, function(button) {
    button.addEventListener('click', function() {
      handlePtzAction(button.getAttribute('data-ptz-action'));
    });
  });

  Array.prototype.forEach.call(ptzPresetElements, function(button) {
    button.addEventListener('click', function() {
      handlePtzPreset(button.getAttribute('data-ptz-preset'));
    });
  });

  if (aiAnalyzeBtnElement) {
    aiAnalyzeBtnElement.addEventListener('click', runAiSceneAnalysis);
  }

  var ptzCameraConfig = {
    '0-entrance': {
      cameraId: 'CAM-ENT-01',
      location: 'Entrance Surveillance Zone',
      direction: 'North Gate',
      note: 'Monitoring airport entrance access and visitor movement.'
    },
    '1-lobby': {
      cameraId: 'CAM-LOB-02',
      location: 'Lobby Monitoring Point',
      direction: 'Reception Desk',
      note: 'Monitoring lobby movement, reception, and waiting area activity.'
    },
    '2-ground-floor': {
      cameraId: 'CAM-GRF-03',
      location: 'Ground Floor Observation',
      direction: 'Main Corridor',
      note: 'Monitoring the main ground-floor corridor and passenger circulation.'
    },
    '3-wing-1': {
      cameraId: 'CAM-WNG-04',
      location: 'Wing 1 Security Zone',
      direction: 'Restricted Passage',
      note: 'Monitoring movement inside Wing 1 and adjacent access points.'
    },
    '4-ground-floor-2': {
      cameraId: 'CAM-GR2-05',
      location: 'Ground Floor Secondary Zone',
      direction: 'Service Area',
      note: 'Monitoring the secondary ground-floor area for safety and crowd visibility.'
    }
  };

  var gyroSmoothing = 0.15;
  var lastGyroYaw = null;
  var lastGyroPitch = null;
  var lastRawYaw = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function unwrapAngle(previous, current) {
    if (previous === null) {
      return current;
    }
    var delta = current - previous;
    if (delta > Math.PI) {
      current -= Math.PI * 2;
    } else if (delta < -Math.PI) {
      current += Math.PI * 2;
    }
    return current;
  }

  function getScreenOrientationAngle() {
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      return window.screen.orientation.angle;
    }
    if (typeof window.orientation === 'number') {
      return window.orientation;
    }
    return 0;
  }

  function enableGyro() {
    if (!gyroSupported || gyroEnabled) return;
    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    gyroEnabled = true;
  }

  function disableGyro() {
    if (!gyroEnabled) return;
    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    gyroEnabled = false;
    gyroInitial = null;
  }

  function requestGyroPermission() {
    if (!gyroSupported || gyroRequested) return;
    gyroRequested = true;

    if (typeof window.DeviceOrientationEvent !== 'undefined' &&
        typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      window.DeviceOrientationEvent.requestPermission()
        .then(function(state) {
          if (state === 'granted') enableGyro();
        })
        .catch(function() {
          disableGyro();
        });
    } else {
      enableGyro();
    }
  }

  function handleDeviceOrientation(event) {
    if (!gyroEnabled || !currentScene) return;
    if (event.alpha === null || event.beta === null || event.gamma === null) return;

    var degToRad = Math.PI / 180;
    var alpha = event.alpha * degToRad;
    var beta = event.beta * degToRad;
    var gamma = event.gamma * degToRad;
    var screenAngle = getScreenOrientationAngle() * degToRad;

    var euler = deviceOrientationToEuler(alpha, beta, gamma, screenAngle);
    var params = currentScene.view.parameters();

    if (!gyroInitial) {
      gyroInitial = {
        yaw: euler.yaw,
        pitch: euler.pitch,
        viewYaw: params.yaw,
        viewPitch: params.pitch
      };
    }

    var rawYaw = euler.yaw - gyroInitial.yaw;
    var rawPitch = euler.pitch - gyroInitial.pitch;

    rawYaw = unwrapAngle(lastRawYaw, rawYaw);
    lastRawYaw = rawYaw;

    var nextYaw = gyroInitial.viewYaw + rawYaw;
    var nextPitch = gyroInitial.viewPitch - rawPitch;
    nextPitch = clamp(nextPitch, -Math.PI / 2, Math.PI / 2);

    if (lastGyroYaw === null) {
      lastGyroYaw = nextYaw;
      lastGyroPitch = nextPitch;
    } else {
      lastGyroYaw = lastGyroYaw + (nextYaw - lastGyroYaw) * gyroSmoothing;
      lastGyroPitch = lastGyroPitch + (nextPitch - lastGyroPitch) * gyroSmoothing;
    }

    currentScene.view.setParameters({
      yaw: lastGyroYaw,
      pitch: lastGyroPitch,
      fov: params.fov
    });
  }

  function deviceOrientationToEuler(alpha, beta, gamma, orient) {
    var x = beta;
    var y = alpha;
    var z = -gamma;

    var c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
    var s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

    var qx = s1 * c2 * c3 + c1 * s2 * s3;
    var qy = c1 * s2 * c3 - s1 * c2 * s3;
    var qz = c1 * c2 * s3 - s1 * s2 * c3;
    var qw = c1 * c2 * c3 + s1 * s2 * s3;

    var q1x = -Math.SQRT1_2, q1y = 0, q1z = 0, q1w = Math.SQRT1_2;

    var tqx = qw * q1x + qx * q1w + qy * q1z - qz * q1y;
    var tqy = qw * q1y - qx * q1z + qy * q1w + qz * q1x;
    var tqz = qw * q1z + qx * q1y - qy * q1x + qz * q1w;
    var tqw = qw * q1w - qx * q1x - qy * q1y - qz * q1z;

    var halfOrient = -orient / 2;
    var so = Math.sin(halfOrient), co = Math.cos(halfOrient);

    var q0x = 0, q0y = 0, q0z = so, q0w = co;

    var fqx = tqw * q0x + tqx * q0w + tqy * q0z - tqz * q0y;
    var fqy = tqw * q0y - tqx * q0z + tqy * q0w + tqz * q0x;
    var fqz = tqw * q0z + tqx * q0y - tqy * q0x + tqz * q0w;
    var fqw = tqw * q0w - tqx * q0x - tqy * q0y - tqz * q0z;

    var test = 2 * (fqw * fqx - fqy * fqz);
    test = clamp(test, -1, 1);

    var pitch = Math.asin(test);
    var yaw = Math.atan2(2 * (fqw * fqy + fqx * fqz), 1 - 2 * (fqx * fqx + fqy * fqy));

    return { yaw: -yaw, pitch: pitch };
  }

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    stopPtzSweep();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    currentScene = scene;
    gyroInitial = null;
    lastGyroYaw = null;
    lastGyroPitch = null;
    lastRawYaw = null;
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
    updatePtzPanel(scene);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) return;
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function openPtzPanel() {
    if (!ptzCameraPanelElement || !ptzOverlayElement) return;
    ptzCameraPanelElement.classList.add('open');
    ptzOverlayElement.classList.add('visible');
    ptzCameraPanelElement.setAttribute('aria-hidden', 'false');
    ptzOverlayElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ptz-open');
  }

  function closePtzPanel() {
    if (!ptzCameraPanelElement || !ptzOverlayElement) return;
    ptzCameraPanelElement.classList.remove('open');
    ptzOverlayElement.classList.remove('visible');
    ptzCameraPanelElement.setAttribute('aria-hidden', 'true');
    ptzOverlayElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ptz-open');
  }

  function updatePtzPanel(scene) {
    if (!scene || !ptzCameraLocationElement) return;

    var config = ptzCameraConfig[scene.data.id] || {
      cameraId: 'CAM-FIA-00',
      location: scene.data.name + ' Monitoring Zone',
      direction: 'General View',
      note: 'Monitoring the active airport scene.'
    };

    ptzCameraLocationElement.textContent = config.location;
    ptzCameraIdElement.textContent = config.cameraId;
    ptzCameraStatusElement.textContent = 'ACTIVE';
    ptzDirectionElement.textContent = 'Direction: ' + config.direction;
    ptzSceneNoteElement.textContent = config.note;

    var params = scene.view.parameters();
    ptzZoomLevel = computeZoomMultiplier(params.fov);
    ptzZoomElement.textContent = 'Zoom: ' + ptzZoomLevel.toFixed(1) + 'x';
  }

  function computeZoomMultiplier(fov) {
    var baseFov = 1.55;
    return Math.max(1, Math.min(4, baseFov / fov));
  }

  function applyPtzView(next) {
    if (!currentScene) return;

    var params = currentScene.view.parameters();

    currentScene.view.setParameters({
      yaw: next.yaw !== undefined ? next.yaw : params.yaw,
      pitch: next.pitch !== undefined ? next.pitch : params.pitch,
      fov: next.fov !== undefined ? next.fov : params.fov
    });

    ptzZoomLevel = computeZoomMultiplier(currentScene.view.parameters().fov);
    ptzZoomElement.textContent = 'Zoom: ' + ptzZoomLevel.toFixed(1) + 'x';
  }

  function stopPtzSweep() {
    if (ptzSweepInterval) {
      clearInterval(ptzSweepInterval);
      ptzSweepInterval = null;
    }
    if (ptzCameraStatusElement) {
      ptzCameraStatusElement.textContent = 'ACTIVE';
    }
  }

  function startPtzSweep() {
    if (!currentScene) return;

    stopPtzSweep();
    stopAutorotate();

    var params = currentScene.view.parameters();
    ptzSweepCenterYaw = params.yaw;
    ptzSweepDirection = 1;

    if (ptzCameraStatusElement) {
      ptzCameraStatusElement.textContent = 'SWEEP';
    }
    if (ptzSceneNoteElement) {
      ptzSceneNoteElement.textContent = 'Automatic security sweep is active for this camera.';
    }

    ptzSweepInterval = setInterval(function() {
      if (!currentScene) return;

      var currentParams = currentScene.view.parameters();
      var nextYaw = currentParams.yaw + (ptzSweepStep * ptzSweepDirection);

      if (nextYaw > ptzSweepCenterYaw + ptzSweepRange) {
        ptzSweepDirection = -1;
      } else if (nextYaw < ptzSweepCenterYaw - ptzSweepRange) {
        ptzSweepDirection = 1;
      }

      currentScene.view.setParameters({
        yaw: currentParams.yaw + (ptzSweepStep * ptzSweepDirection),
        pitch: currentParams.pitch,
        fov: currentParams.fov
      });
    }, 60);
  }

  function handlePtzAction(action) {
    if (!currentScene) return;

    stopPtzSweep();
    stopAutorotate();

    var params = currentScene.view.parameters();
    var yawStep = 0.18;
    var pitchStep = 0.12;
    var fovStep = 0.14;

    var next = {
      yaw: params.yaw,
      pitch: params.pitch,
      fov: params.fov
    };

    if (action === 'left') {
      next.yaw -= yawStep;
    } else if (action === 'right') {
      next.yaw += yawStep;
    } else if (action === 'up') {
      next.pitch -= pitchStep;
    } else if (action === 'down') {
      next.pitch += pitchStep;
    } else if (action === 'zoomIn') {
      next.fov = Math.max(0.7, params.fov - fovStep);
    } else if (action === 'zoomOut') {
      next.fov = Math.min(1.55, params.fov + fovStep);
    } else if (action === 'center') {
      next = {
        yaw: currentScene.data.initialViewParameters.yaw,
        pitch: currentScene.data.initialViewParameters.pitch,
        fov: currentScene.data.initialViewParameters.fov
      };
    }

    if (ptzSceneNoteElement) {
      ptzSceneNoteElement.textContent = 'Manual PTZ control is active.';
    }

    applyPtzView(next);
  }

  function handlePtzPreset(preset) {
    if (!currentScene) return;

    stopPtzSweep();
    stopAutorotate();

    var base = currentScene.data.initialViewParameters;
    var next = {
      yaw: base.yaw,
      pitch: base.pitch,
      fov: base.fov
    };

    if (preset === 'wide') {
      next.fov = 1.55;
      if (ptzSceneNoteElement) ptzSceneNoteElement.textContent = 'Wide surveillance view selected.';
    } else if (preset === 'focus') {
      next.fov = 0.9;
      next.pitch = Math.max(-1.2, base.pitch - 0.08);
      if (ptzSceneNoteElement) ptzSceneNoteElement.textContent = 'Focused monitoring view selected.';
    } else if (preset === 'secure') {
      startPtzSweep();
      return;
    }

    applyPtzView(next);
  }

  function setAiResults(result) {
    if (aiAreaTypeElement) aiAreaTypeElement.textContent = result.areaType || 'Unknown';
    if (aiCrowdLevelElement) aiCrowdLevelElement.textContent = result.crowdLevel || 'Unknown';
    if (aiSecurityStatusElement) aiSecurityStatusElement.textContent = result.securityStatus || 'Unknown';
    if (aiDetectedObjectsElement) aiDetectedObjectsElement.textContent = result.detectedObjects || 'Unknown';
    if (aiRecommendationElement) aiRecommendationElement.textContent = result.recommendation || 'No recommendation';
  }

  function classifySceneType(sceneName) {
    var name = (sceneName || '').toLowerCase();
    if (name.indexOf('entrance') !== -1) return 'Entrance / Access Point';
    if (name.indexOf('lobby') !== -1) return 'Lobby / Reception Area';
    if (name.indexOf('wing') !== -1) return 'Restricted Services Corridor';
    if (name.indexOf('ground') !== -1) return 'Passenger Circulation Zone';
    return 'Airport Service Area';
  }

  function extractDetectedObjects(sceneData) {
    var labels = [];
    var source = (sceneData.infoHotspots || []).map(function(h) {
      return h.title;
    }).join(', ').toLowerCase();

    if (source.indexOf('desk') !== -1 || source.indexOf('reception') !== -1 || source.indexOf('counter') !== -1) {
      labels.push('service desk');
    }
    if (source.indexOf('cafe') !== -1) {
      labels.push('cafe');
    }
    if (source.indexOf('security') !== -1) {
      labels.push('security office');
    }
    if (source.indexOf('restroom') !== -1 || source.indexOf('washroom') !== -1) {
      labels.push('restroom');
    }
    if (source.indexOf('elevator') !== -1) {
      labels.push('elevator');
    }
    if (source.indexOf('display') !== -1) {
      labels.push('information display');
    }

    if (!labels.length) {
      labels.push('airport facilities');
    }

    return labels.join(', ');
  }

  function runAiSceneAnalysis() {
    if (!currentScene) {
      setAiResults({
        areaType: 'No active scene',
        crowdLevel: 'Unknown',
        securityStatus: 'Unavailable',
        detectedObjects: 'None',
        recommendation: 'Open a scene first.'
      });
      return;
    }

    var sceneData = currentScene.data;
    var infoCount = (sceneData.infoHotspots || []).length;
    var linkCount = (sceneData.linkHotspots || []).length;
    var areaType = classifySceneType(sceneData.name);
    var detectedObjects = extractDetectedObjects(sceneData);

    var crowdLevel = 'Low';
    var securityStatus = 'Normal';
    var recommendation = 'Continue normal monitoring.';

    if (sceneData.id === '0-entrance') {
      crowdLevel = 'Medium';
      securityStatus = 'Observe entry activity';
      recommendation = 'Monitor visitor flow and entry points.';
    } else if (sceneData.id === '1-lobby') {
      crowdLevel = 'Medium';
      securityStatus = 'Service area active';
      recommendation = 'Keep reception and waiting area under observation.';
    } else if (sceneData.id === '2-ground-floor' || sceneData.id === '4-ground-floor-2') {
      crowdLevel = 'High';
      securityStatus = 'Busy circulation zone';
      recommendation = 'Watch movement patterns and maintain clear paths.';
    } else if (sceneData.id === '3-wing-1') {
      crowdLevel = 'Low';
      securityStatus = 'Restricted area';
      recommendation = 'Check access permissions and patrol the corridor.';
    }

    if (infoCount >= 3 && linkCount >= 2 && crowdLevel === 'Medium') {
      crowdLevel = 'Medium to High';
    }

    setAiResults({
      areaType: areaType,
      crowdLevel: crowdLevel,
      securityStatus: securityStatus,
      detectedObjects: detectedObjects,
      recommendation: recommendation
    });

    if (ptzSceneNoteElement) {
      ptzSceneNoteElement.textContent = 'AI prototype analyzed the active scene and generated a monitoring summary.';
    }

    if (ptzCameraStatusElement) {
      ptzCameraStatusElement.textContent = 'AI READY';
    }
  }

  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    stopTouchAndScrollEventPropagation(wrapper);

    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');

    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');

    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');

    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    wrapper.appendChild(header);
    wrapper.appendChild(text);

    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  function stopTouchAndScrollEventPropagation(element) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) return scenes[i];
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) return data.scenes[i];
    }
    return null;
  }

  // LOGIN / LOGOUT
  var loginOverlayElement = document.querySelector('#loginOverlay');
  var loginBtnElement = document.querySelector('#loginBtn');
  var logoutBtnElement = document.querySelector('#logoutBtn');
  var usernameElement = document.querySelector('#username');
  var passwordElement = document.querySelector('#password');
  var roleSelectElement = document.querySelector('#roleSelect');
  var loginErrorElement = document.querySelector('#loginError');
  var headerBarElement = document.querySelector('#headerBar');
  var titleBarElement = document.querySelector('#titleBar');

  function showAppAfterLogin() {
    if (loginOverlayElement) loginOverlayElement.style.display = 'none';
    if (headerBarElement) headerBarElement.style.display = 'flex';
    if (panoElement) panoElement.style.display = 'block';
    if (sceneListElement) sceneListElement.style.display = 'block';
    if (sceneListToggleElement) sceneListToggleElement.style.display = 'block';
    if (autorotateToggleElement) autorotateToggleElement.style.display = 'block';
    if (fullscreenToggleElement) fullscreenToggleElement.style.display = 'block';
    if (titleBarElement) titleBarElement.style.display = 'block';
  }

  function hideAppBeforeLogin() {
    if (loginOverlayElement) loginOverlayElement.style.display = 'flex';
    if (headerBarElement) headerBarElement.style.display = 'none';
    if (panoElement) panoElement.style.display = 'none';
    if (sceneListElement) sceneListElement.style.display = 'none';
    if (sceneListToggleElement) sceneListToggleElement.style.display = 'none';
    if (autorotateToggleElement) autorotateToggleElement.style.display = 'none';
    if (fullscreenToggleElement) fullscreenToggleElement.style.display = 'none';
    if (titleBarElement) titleBarElement.style.display = 'none';
    closePtzPanel();
  }

  function handleLogin() {
    var username = usernameElement ? usernameElement.value.trim() : '';
    var password = passwordElement ? passwordElement.value.trim() : '';
    var role = roleSelectElement ? roleSelectElement.value : '';

    if (loginErrorElement) loginErrorElement.textContent = '';

    var validPassenger = (role === 'passenger' && username === 'passenger' && password === 'passenger123');
    var validAdmin = (role === 'admin' && username === 'admin' && password === 'admin123');

    if (validPassenger || validAdmin) {
      showAppAfterLogin();
      if (usernameElement) usernameElement.value = '';
      if (passwordElement) passwordElement.value = '';
    } else {
      if (loginErrorElement) {
        loginErrorElement.textContent = 'Invalid username, password, or role.';
      }
    }
  }

  function handleLogout() {
    hideAppBeforeLogin();
    if (loginErrorElement) loginErrorElement.textContent = '';
  }

  if (loginBtnElement) {
    loginBtnElement.addEventListener('click', handleLogin);
  }

  if (logoutBtnElement) {
    logoutBtnElement.addEventListener('click', handleLogout);
  }

  if (passwordElement) {
    passwordElement.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        handleLogin();
      }
    });
  }

  hideAppBeforeLogin();
  switchScene(scenes[0]);

})();
