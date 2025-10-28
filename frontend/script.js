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

  