<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as THREE from 'three';
    import { planetVertexShader, planetFragmentShader } from '../lib/PlanetShaders.js';
    import vertexShader from '../shaders/planet.vert?raw';
    import fragmentShader from '../shaders/planet.frag?raw';
    import vertexCloud from '../shaders/cloud.vert?raw';
    import fragmentCloud from '../shaders/cloud.frag?raw';

    // Props
    export let scene;
    
    // Initialize planet
    let planetMesh, cloudMesh;
    let planetMaterial, cloudShaderMaterial;
    const planetRadius = 5;
    const planetSegments = 2048;
    
    // Method that will be exposed to parent component
    export function updatePlanet(params) {
        if (!planetMaterial) return;
        if (!cloudShaderMaterial) return;

        // Update uniforms based on parameters
        planetMaterial.uniforms.amplitude.value = params.amplitude;
        planetMaterial.uniforms.frequency.value = params.frequency;
        planetMaterial.uniforms.speed.value = params.speed;
        planetMaterial.uniforms.turbulence.value = params.turbulence;
        planetMaterial.uniforms.colorShift.value = params.colorShift;
        // cloudShaderMaterial.uniforms.noiseScale.value = Math.cos(params.amplitude)*0.1;
        // cloudShaderMaterial.uniforms.cloudDensity.value = Math.sin(params.speed);
        // Increment time for animation
        cloudShaderMaterial.uniforms.time.value = params.turbulence;

        planetMaterial.uniforms.time.value += 0.01;
        cloudShaderMaterial.uniforms.time.value += 0.001;

        // Rotate planet slowly
        if (planetMesh) {
            planetMesh.position.y = 0
            planetMesh.position.x = 3
            planetMesh.rotation.y += 0.001;
            planetMesh.rotation.z += 0.001;
            // planetMesh.scale.x = Math.sin(planetMesh.rotation.y)+1;

            cloudMesh.position.y = 0
            cloudMesh.position.x = 3
            cloudMesh.rotation.y += 0.0005;
            cloudMesh.rotation.x += 0.0005;
        }
    }
    
    onMount(() => {
        if (!scene) {
            console.error('Scene is not available in Solaris component');
            return;
        }
        const cloudGeometry = new THREE.SphereGeometry(planetRadius+0.05, planetSegments, planetSegments);
        cloudShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                lightDir: { value: new THREE.Vector3(1, 1, 1).normalize() },
                lightColor: { value: new THREE.Color(0x000000) },
                cloudColor: { value: new THREE.Color(0xffffff) }, // Light blue for clouds
                baseColor: { value: new THREE.Color(0x000000) }, // Royal blue for the base
                noiseScale: { value: 2 },
                cloudDensity: { value: 0.9 },
            },
            vertexShader: vertexCloud,
            fragmentShader: fragmentCloud,
            transparent: true, 
            blending: THREE.MultiplyBlending,
            wireframe: false
        });
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
        cloudMesh = new THREE.Mesh(cloudGeometry, cloudShaderMaterial);
        planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        scene.add(planetMesh);
        scene.add(cloudMesh)
        
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