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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(100, 200, 300);
scene.add(directionalLight);

const atmosphereGeometry = new THREE.SphereGeometry(200, 64, 64);
const atmosphereMaterial = new THREE.MeshPhongMaterial({
  color: 0x3399ff,
  transparent: true,
  opacity: 0.08,
  side: THREE.BackSide,
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
atmosphere.scale.set(1.15, 1.15, 1.15);
scene.add(atmosphere);

camera.position.set(0, 120, 420);
camera.lookAt(0, 0, 0);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  (function animate() {
    Globe.rotation.y += 0.0005;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

  const geoCacheKey = 'ip_geo_cache_v1';
  let ipGeoCache = {};
  try {
    ipGeoCache = JSON.parse(localStorage.getItem(geoCacheKey) || '{}');
  } catch {}

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
      const loc = { lat: 20.5937, lng: 78.9629 };
      ipGeoCache[ip] = loc;
      return loc;
    }
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!res.ok) throw new Error('geo fail');
      const j = await res.json();
      if (j.latitude && j.longitude) {
        const obj = { lat: j.latitude, lng: j.longitude, city: j.city, country: j.country_name };
        ipGeoCache[ip] = obj;
        return obj;
      }
    } catch {
      return null;
    }
    return null;
  }

  const totalEl = document.getElementById('alert-counter');
  const latestInfo = document.getElementById('latest-info');
  const info = document.getElementById('info');
  let totalAlerts = 0;
  let allArcs = [];
  const shownAttackLocations = new Set();
  const shownNormalLocations = new Set();
  let showAttack = true;
  let showNormal = true;

  const chart = document.getElementById('alert-chart');
  const ctx = chart.getContext('2d');
  const chartData = Array(30).fill(0);
  let chartTimer = null;

  function drawChart() {
    const w = chart.width;
    const h = chart.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(0, h - chartData[0]);
    for (let i = 1; i < chartData.length; i++) {
      ctx.lineTo((i / (chartData.length - 1)) * w, h - chartData[i]);
    }
    ctx.strokeStyle = '#ff3d00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,61,0,0.2)';
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  function pushAlertToChart() {
    chartData.push(Math.min(100, totalAlerts * 2));
    if (chartData.length > 30) chartData.shift();
    drawChart();
  }

  chartTimer = setInterval(() => {
    chartData.push(chartData[chartData.length - 1] * 0.8);
    if (chartData.length > 30) chartData.shift();
    drawChart();
  }, 3000);

  function renderArcsFromAll() {
    const filtered = allArcs.filter(
      (a) => (a._label === 'attack' && showAttack) || (a._label === 'normal' && showNormal)
    );
    Globe.arcsData(filtered.slice(-300));
  }

  async function handleAlert(alert) {
    if (!alert) return;
    totalAlerts++;
    totalEl.textContent = `Active Alerts: ${totalAlerts}`;
    pushAlertToChart();

    const top = alert.top_srcs || {};
    const arcsToAdd = [];
    const labelName = alert.predicted_label === 1 ? 'attack' : 'normal';
    const arcColor =
      labelName === 'attack' ? 'rgba(255,60,60,0.9)' : 'rgba(60,180,90,0.9)';

    let primaryGeo = null;
    for (const ip of Object.keys(top)) {
      const geo = await geolocateIP(ip);
      if (!geo) continue;
      if (!primaryGeo) primaryGeo = geo;

      const locKey = `${geo.lat.toFixed(2)},${geo.lng.toFixed(2)},${labelName}`;
      const setRef = labelName === 'attack' ? shownAttackLocations : shownNormalLocations;
      if (setRef.has(locKey)) continue;
      setRef.add(locKey);

      arcsToAdd.push({
        startLat: geo.lat,
        startLng: geo.lng,
        endLat: 20.5937,
        endLng: 78.9629,
        color: arcColor,
        _label: labelName,
      });
    }

    if (primaryGeo) {
      latestInfo.innerHTML = `
        <b>Last Source:</b> ${primaryGeo.city || 'Unknown'}, ${primaryGeo.country || 'Unknown'}<br>
        <b>Type:</b> ${labelName}<br>
        <b>Time:</b> ${new Date(alert.detected_at || Date.now()).toLocaleTimeString()}
      `;
    }

    allArcs = [
      ...new Map(
        allArcs
          .concat(arcsToAdd)
          .map((a) => [`${a.startLat.toFixed(2)},${a.startLng.toFixed(2)},${a._label}`, a])
      ).values(),
    ];

    renderArcsFromAll();
  }

  function connectSSE() {
    const sse = new EventSource('/stream');
    sse.onopen = () => (info.textContent = '✅ Connected to live alerts.');
    sse.onerror = () => {
      info.textContent = '⚠️ Reconnecting...';
      sse.close();
      setTimeout(connectSSE, 2000);
    };
    sse.onmessage = (e) => {
      try {
        handleAlert(JSON.parse(e.data));
      } catch {}
    };
  }

  connectSSE();

  function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'globe-legend';
    legend.innerHTML = `
      <div style="font-weight:600; margin-bottom:6px;">🌍 Live Attack Map</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="legend-attack-btn" class="legend-btn">🔴 Attack</button>
        <button id="legend-normal-btn" class="legend-btn">🟢 Normal</button>
      </div>
      <div style="font-size:12px; margin-top:6px; opacity:0.9;">
        Toggle visibility by type.
      </div>
    `;
    document.body.appendChild(legend);

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

  const tips = [
  "🧩 Keep your OS and software up to date.",
  "🔐 Use strong, unique passwords for each account.",
  "🌐 Avoid clicking unknown or suspicious links.",
  "🧱 Enable a firewall to block unwanted traffic.",
  "📊 Monitor network activity for unusual spikes.",
  "💾 Backup important data regularly.",
  "🚫 Disable unused network ports and services.",
  "🕵️ Use intrusion detection tools for deeper insights.",
  "📡 Limit SSH and RDP access to trusted IPs only.",
  "⚙️ Configure rate limiting to mitigate DDoS effects."
];

const tipEl = document.getElementById("tip-text");
let tipIndex = 0;

function cycleTips() {
  tipEl.style.opacity = 0;
  setTimeout(() => {
    tipEl.textContent = tips[tipIndex];
    tipEl.style.opacity = 1;
    tipIndex = (tipIndex + 1) % tips.length;
  }, 400);
}

setInterval(cycleTips, 3000); 
cycleTips();
})();
