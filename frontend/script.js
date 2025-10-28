(async function(){
  const container = document.getElementById('globe-container');
  container.style.width = '100%';
  container.style.height = '100%';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  camera.position.z = 400;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const Globe = new ThreeGlobe({
    animateIn: true
  })
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .arcsData([])
  .arcColor('color')
  .arcDashLength(0.4)
  .arcDashGap(0.6)
  .arcDashAnimateTime(2000)
  .arcStroke(0.8);

  scene.add(Globe);

   window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  });

  (function animate(){
    Globe.rotation.y += 0.002;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();

   const geoCacheKey = "ip_geo_cache_v1";
  let ipGeoCache = {};
  try { ipGeoCache = JSON.parse(localStorage.getItem(geoCacheKey) || "{}"); } catch(e){ ipGeoCache = {}; }

  async function geolocateIP(ip){
    if(!ip) return null;
    if(ipGeoCache[ip]) return ipGeoCache[ip];
    try {
      const r = await fetch(`https://ipapi.co/${ip}/json/`);
      if(!r.ok) throw new Error("geo fail");
      const j = await r.json();
      if(j && j.latitude && j.longitude){
        const obj = { lat: j.latitude, lng: j.longitude, city: j.city || "", country: j.country_name || "" };
        ipGeoCache[ip] = obj;
        try { localStorage.setItem(geoCacheKey, JSON.stringify(ipGeoCache)); } catch(e){}
        return obj;
      }
    } catch(e){
      return null;
    }
    return null;
  }

  let totalAlerts = 0;
  const alertsList = document.getElementById('alerts-list');
  const totalEl = document.getElementById('total');
  const info = document.getElementById('info');

  function addAlertItem(alert){
    totalAlerts++;
    totalEl.textContent = totalAlerts;
    const li = document.createElement('li');
    li.textContent = `${alert.detected_at} | pkts=${alert.pkts} prob=${alert.probability}`;
    alertsList.insertBefore(li, alertsList.firstChild);
    while(alertsList.childNodes.length > 50) alertsList.removeChild(alertsList.lastChild);
  }

  async function handleAlert(alert){
    addAlertItem(alert);
    const top = alert.top_srcs || {};
    const arcsToAdd = [];
    for(const ip of Object.keys(top)){
      const geo = await geolocateIP(ip);
      if(!geo) continue;
      arcsToAdd.push({
        startLat: geo.lat,
        startLng: geo.lng,
        endLat: 0,
        endLng: 0,
        color: alert.predicted_label==1 ? 'rgba(255,60,60,0.8)' : 'rgba(80,200,120,0.7)',
        weight: Math.min(10, Math.log( (top[ip]||1) + 1))
      });
    }
    if(arcsToAdd.length){
      const existing = Globe.arcsData() || [];
      Globe.arcsData(existing.concat(arcsToAdd));
    }
  }

  function connectSSE(){
    const sse = new EventSource('/stream');
    sse.onopen = () => { info.textContent = "Connected to live alerts."; };
    sse.onerror = (e) => { info.textContent = "SSE error — retrying..."; sse.close(); setTimeout(connectSSE, 2000); };
    sse.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        handleAlert(data);
      } catch(err){
        console.warn("bad alert", err);
      }
    };
  }
  connectSSE();

  async function preload(){
    try {
      const r = await fetch('/api/alerts');
      const arr = await r.json();
      for(const a of arr.slice(-100)){
        totalAlerts++;
        addAlertItem(a);
        if(a.top_srcs){
          for(const ip of Object.keys(a.top_srcs)){
            geolocateIP(ip).then(()=>{  });
          }
        }
      }
      totalEl.textContent = totalAlerts;
    } catch(e){
      console.warn("preload failed", e);
    }
  }
  preload();

})();