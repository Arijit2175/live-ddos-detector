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

  