/**
 * Shader code for the planet water surface
 */

// Vertex shader - handles displacement of the surface
export const planetVertexShader = `
  uniform float time;
  uniform float amplitude;
  uniform float frequency;
  uniform float speed;
  uniform float turbulence;
    float rand(vec2 co)
    {
    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
    }
  varying vec2 vUv;
  varying float vDisplacement;
  
  // Simple noise function
  float noise(vec3 p) {
    return sin(p.x*1.5) * sin(p.y*1.8) * sin(p.z*1.3);
  }
  
  void main() {
    vUv = uv;
    
    // Calculate river-like patterns based on latitude (y coordinate)
    float latitude = asin(position.y / length(position));
    float longitude = asin(position.x / length(position));
    float riverPattern = sin(latitude * rand(vUv)*0.5 * frequency * 10.0 + time * speed)*cos(longitude * rand(vUv)*0.5 * frequency * 10.0);
    
    // Add some noise based on position
    vec3 p = position * 2.0;
    float noiseValue = noise(p + time * 0.1);
    
    // Apply displacement along river patterns
    float displacement = riverPattern * amplitude;
    
    // Apply turbulence
    displacement += noiseValue * turbulence * 0.1;
    
    // Store displacement for fragment shader
    vDisplacement = displacement;
    
    // Apply displacement along normal
    vec3 newPosition = position + normal * displacement * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Fragment shader - handles coloring of the surface
export const planetFragmentShader = `
  uniform float colorShift;
  varying vec2 vUv;
  varying float vDisplacement;
  uniform float time;

  void main() {
    // Base blue color for water
    vec3 waterColor = vec3(0.0, 0.3, 0.6);
    float shimmer = sin(vUv.x * 20.0 + vUv.y * 15.0 + time * 2.0) * 0.05;
  
    // Adjust color based on displacement
    float intensity = vDisplacement * 5.0;

    waterColor += waterColor * shimmer;
    
    // Create shifting color effect
    vec3 finalColor = mix(
      waterColor,
      vec3(0.0, 1.0*colorShift, 1.0*colorShift),
      abs(intensity) + colorShift
    );
    
    // Add highlight for river crests
    if (intensity > 0.05) {
      finalColor = mix(finalColor, vec3(0.3, 0.9, 1.0), intensity * 2.0);
    }
    
    // Add depth for river troughs
    if (intensity < -0.05) {
      finalColor = mix(finalColor, vec3(0.0, 0.1, 0.3), abs(intensity) * 2.0);
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;