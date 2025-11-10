(async function () {
  const container = document.getElementById('globe-container');
  container.style.width = '100%';
  container.style.height = '100%';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    1,
    2000
  );
  camera.position.z = 420;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const Globe = new ThreeGlobe({ animateIn: true })
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .arcsData([])
    .arcColor('color')
    .arcDashLength(0.3)
    .arcDashGap(0.1)
    .arcDashInitialGap(() => Math.random())
    .arcDashAnimateTime(900)
    .arcStroke(1.8);

  scene.add(Globe);

  Globe.pointsData([])
       .pointLat(d => d.lat)
       .pointLng(d => d.lng)
       .pointColor(d => d.color || 'orange')
       .pointAltitude(d => d.altitude || 0.02)
       .pointRadius(0.6);

  const recentMarkers = [];
  const MARKER_TTL = 6.0;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
  const pointLight = new THREE.PointLight(0xffffff, 1.6);
  camera.add(pointLight);
  scene.add(ambientLight);
  scene.add(camera);

  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  (function animate() {
    Globe.rotation.y += 0.0008;

    const now = performance.now() / 1000;
    let changed = false;
    for (let i = recentMarkers.length - 1; i >= 0; i--) {
      const m = recentMarkers[i];
      const age = now - m.start;
      if (age > MARKER_TTL) {
        recentMarkers.splice(i, 1);
        changed = true;
        continue;
      }
      const fade = 1 - age / MARKER_TTL;
      const pulse = Math.abs(Math.sin(age * 3.0)) * 0.08 * fade + 0.02 * fade;
      m.altitude = pulse;
      changed = true;
    }

    if (changed) {
      Globe.pointsData(
        recentMarkers.map(m => ({
          lat: m.lat,
          lng: m.lng,
          color: m.color,
          altitude: m.altitude
        }))
      );
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

  const geoCacheKey = 'ip_geo_cache_v1';
  let ipGeoCache = {};
  try {
    ipGeoCache = JSON.parse(localStorage.getItem(geoCacheKey) || '{}');
  } catch {
    ipGeoCache = {};
  }

  function isPrivateIP(ip) {
    return (
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.') ||
      ip === '127.0.0.1' ||
      ip === 'localhost'
    );
  }

  async function geolocateIP(ip) {
    if (!ip) return null;
    if (ipGeoCache[ip]) return ipGeoCache[ip];

    if (isPrivateIP(ip)) {
      const localLoc = { lat: 20.5937, lng: 78.9629 };
      ipGeoCache[ip] = localLoc;
      localStorage.setItem(geoCacheKey, JSON.stringify(ipGeoCache));
      return localLoc;
    }

    try {
      const r = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!r.ok) throw new Error('geo fail');
      const j = await r.json();
      if (j && j.latitude && j.longitude) {
        const obj = {
          lat: j.latitude,
          lng: j.longitude,
          city: j.city || '',
          country: j.country_name || ''
        };
        ipGeoCache[ip] = obj;
        localStorage.setItem(geoCacheKey, JSON.stringify(ipGeoCache));
        return obj;
      }
    } catch {
      return null;
    }

    return null;
  }

  let totalAlerts = 0;
  const alertsList = document.getElementById('alerts-list');
  const totalEl = document.getElementById('total');
  const info = document.getElementById('info');

  const shownAttackLocations = new Set();
  const shownNormalLocations = new Set();
  let allArcs = [];

  let showAttack = true;
  let showNormal = true;

  function addAlertItem(alert) {
    totalAlerts++;
    totalEl.textContent = totalAlerts;
    const li = document.createElement('li');
    li.textContent = `${alert.detected_at} | pkts=${alert.pkts} prob=${alert.probability}`;
    alertsList.insertBefore(li, alertsList.firstChild);
    while (alertsList.childNodes.length > 50)
      alertsList.removeChild(alertsList.lastChild);
  }

  function renderArcsFromAll() {
    const filtered = allArcs.filter(a => {
      if (a._label === 'attack') return showAttack;
      if (a._label === 'normal') return showNormal;
      return true;
    });
    Globe.arcsData(filtered.slice(-300));
  }

  function updateLegendCounters() {
    const attackCount = shownAttackLocations.size;
    const normalCount = shownNormalLocations.size;
    const attackCounter = document.getElementById('legend-attack-count');
    const normalCounter = document.getElementById('legend-normal-count');
    if (attackCounter) attackCounter.textContent = attackCount;
    if (normalCounter) normalCounter.textContent = normalCount;
  }

  async function handleAlert(alert) {
    if (!alert) return;
    if (alert.predicted_label === 1) addAlertItem(alert);

    const top = alert.top_srcs || {};
    const arcsToAdd = [];
    let primaryGeo = null;

    const arcColor =
      alert.predicted_label === 1
        ? 'rgba(255,60,60,0.9)'
        : 'rgba(60,180,90,0.9)';
    const labelName = alert.predicted_label === 1 ? 'attack' : 'normal';

    for (const ip of Object.keys(top)) {
      const geo = await geolocateIP(ip);
      if (!geo) continue;
      if (!primaryGeo) primaryGeo = geo;

      const locKey = `${geo.lat.toFixed(2)},${geo.lng.toFixed(2)},${labelName}`;
      const setRef =
        labelName === 'attack' ? shownAttackLocations : shownNormalLocations;
      if (setRef.has(locKey)) continue;
      setRef.add(locKey);

      arcsToAdd.push({
        startLat: geo.lat,
        startLng: geo.lng,
        endLat: 20.5937, 
        endLng: 78.9629,
        color: arcColor,
        weight: Math.min(12, Math.log((top[ip] || 1) + 1)),
        _label: labelName
      });
    }

    if (primaryGeo) {
      recentMarkers.push({
        lat: primaryGeo.lat,
        lng: primaryGeo.lng,
        color: arcColor,
        start: performance.now() / 1000,
        altitude: 0.02
      });
      if (recentMarkers.length > 40) recentMarkers.shift();
    }

    allArcs.push(...arcsToAdd);
    const uniqueArcs = [];
    const seenKeys = new Set();
    for (const arc of allArcs) {
      const key = `${arc.startLat.toFixed(2)},${arc.startLng.toFixed(2)},${arc._label}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueArcs.push(arc);
      }
    }
    allArcs = uniqueArcs;

    renderArcsFromAll();
    updateLegendCounters();
  }

  function connectSSE() {
    const sse = new EventSource('/stream');
    sse.onopen = () => (info.textContent = '✅ Connected to live alerts.');
    sse.onerror = () => {
      info.textContent = '⚠️ Reconnecting...';
      sse.close();
      setTimeout(connectSSE, 2000);
    };
    sse.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        handleAlert(data);
      } catch (err) {
        console.warn('bad alert', err);
      }
    };
  }
  connectSSE();

  async function preload() {
    try {
      const r = await fetch('/api/alerts');
      const arr = await r.json();
      for (const a of arr.slice(-50)) {
        await handleAlert(a);
        addAlertItem(a);
      }
      totalEl.textContent = totalAlerts;
    } catch (e) {
      console.warn('preload failed', e);
    }
  }
  preload();

  function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'globe-legend';
    legend.innerHTML = `
      <div style="font-weight:600; margin-bottom:6px;">🌍 Live Attack Map</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="legend-attack-btn" class="legend-btn" title="Toggle attack arcs">🔴 Attack</button>
        <span id="legend-attack-count" style="min-width:22px; text-align:center;">0</span>
        <button id="legend-normal-btn" class="legend-btn" title="Toggle normal arcs">🟢 Normal</button>
        <span id="legend-normal-count" style="min-width:22px; text-align:center;">0</span>
      </div>
      <div style="font-size:12px; margin-top:6px; opacity:0.9;">
        Click a button to show/hide category. Counters show unique locations tracked.
      </div>
    `;
    Object.assign(legend.style, {
      position: 'absolute',
      bottom: '12px',
      right: '16px',
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      padding: '10px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      lineHeight: '1.5',
      fontFamily: 'monospace',
      zIndex: 20
    });
    document.body.appendChild(legend);

    const style = document.createElement('style');
    style.innerHTML = `
      .legend-btn {
        background: rgba(255,255,255,0.06);
        color: #fff;
        border: 0;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-weight:600;
      }
      .legend-btn.off { opacity: 0.4; }
    `;
    document.head.appendChild(style);

    const attackBtn = document.getElementById('legend-attack-btn');
    const normalBtn = document.getElementById('legend-normal-btn');
    attackBtn.addEventListener('click', () => {
      showAttack = !showAttack;
      attackBtn.classList.toggle('off', !showAttack);
      renderArcsFromAll();
    });
    normalBtn.addEventListener('click', () => {
      showNormal = !showNormal;
      normalBtn.classList.toggle('off', !showNormal);
      renderArcsFromAll();
    });
  }
  createLegend();
})();
