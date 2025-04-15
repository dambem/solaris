<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as THREE from 'three';
    import { planetVertexShader, planetFragmentShader } from '../lib/PlanetShaders.js';
    import vertexShader from '../shaders/planet.vert?raw';
    import fragmentShader from '../shaders/planet.frag?raw';

    // Props
    export let scene;
    
    // Initialize planet
    let planetMesh;
    let planetMaterial;
    const planetRadius = 3.8;
    const planetSegments = 2500;
    
    // Method that will be exposed to parent component
    export function updatePlanet(params) {
        if (!planetMaterial) return;
        
        // Update uniforms based on parameters
        planetMaterial.uniforms.amplitude.value = params.amplitude;
        planetMaterial.uniforms.frequency.value = params.frequency;
        planetMaterial.uniforms.speed.value = params.speed;
        planetMaterial.uniforms.turbulence.value = params.turbulence;
        planetMaterial.uniforms.colorShift.value = params.colorShift;
        
        // Increment time for animation
        planetMaterial.uniforms.time.value += 0.01;
        
        // Rotate planet slowly
        if (planetMesh) {
            planetMesh.position.y = 0
            planetMesh.position.x = 3
            planetMesh.rotation.y += 0.001;
            planetMesh.rotation.z += 0.001;

        }
    }
    
    onMount(() => {
        if (!scene) {
            console.error('Scene is not available in Solaris component');
            return;
        }
        
        // Create planet geometry
        const planetGeometry = new THREE.SphereGeometry(planetRadius, planetSegments, planetSegments);
        
        // Create planet material with custom shader
        planetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                amplitude: { value: 0.5 },
                frequency: { value: 0.5 },
                speed: { value: 0.2 },
                turbulence: { value: 0.5 },
                colorShift: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: false
        });
        
        // Create the planet mesh
        planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        scene.add(planetMesh);
        
        // Clean up on unmount
        return () => {
            if (planetMesh && scene) {
                scene.remove(planetMesh);
                planetGeometry.dispose();
                planetMaterial.dispose();
            }
        };
    });
</script>