import * as THREE from 'three';

/**
 * Sets up the Three.js scene, camera, and renderer
 * @param {HTMLElement} container - DOM element to attach the renderer to
 * @returns {Object} - Object containing scene, camera, and renderer
 */
export function setupScene(container) {
  // Create scene
  const scene = new THREE.Scene();
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000814);
  
  // Add to container
  container.appendChild(renderer.domElement);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(10, 10, 10);

  scene.add(directionalLight);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 10);
  directionalLight2.position.set(-10, 10, 10);

  scene.add(directionalLight2);

  return { scene, camera, renderer };
}

/**
 * Creates a star field background
 * @param {THREE.Scene} scene - The scene to add stars to
 * @returns {THREE.Points} - The star field object
 */
export function createStars(scene) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1000;
  const starsPositions = [];
  
  for (let i = 0; i < starsCount; i++) {
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    starsPositions.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  
  scene.add(stars);
  return stars;
}