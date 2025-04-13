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

  varying vec3 vNormal;
  varying vec3 vPosition;


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
    vNormal = normalize(normalMatrix*normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float latitude = asin(position.y / length(position));
    float longitude = asin(position.x / length(position));
    float langonitude = asin(position.z / length(position));
    float riverPattern = sin(latitude * rand(vUv)*0.1 * frequency * 2.0 + time * speed)*sin(longitude * rand(vUv)*0.1 * frequency * 0.8)*sin(langonitude * rand(vUv)*0.2 * frequency * 0.5);
    
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
  varying vec3 vNormal;
  varying vec3 vPosition;

  
  uniform float intensity;
  uniform vec3 glowColor;
  uniform vec3 waterColorI;

    float rand(vec2 co)
    {
    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
    }
  void main() {
    // Base blue color for water
    vec3 waterColor = waterColorI;
  
    float shimmer = sin(vUv.x * 20.0 + vUv.y * 15.0 + time * 2.0) * 0.05;
    vec3 viewDirection = normalize(-vPosition);
    float fresnel = dot(viewDirection, vNormal);
    fresnel = pow(fresnel, 3.0) * intensity;

    // Adjust color based on displacement
    float intensity = vDisplacement * 5.0;

    waterColor += waterColor * shimmer;
    
    // Create shifting color effect
    vec3 finalColor = mix(
      waterColor,
      vec3(1.0*colorShift+rand(vUv)*0.1, 1.0*colorShift, 1.0*colorShift),
      abs(intensity) + colorShift * fresnel
    );
    
    // Add highlight for river crests
    if (intensity > 0.05) {
      finalColor = mix(finalColor, vec3(0.5, 0.5, 1.0), intensity * 2.0);
    }
    
    // Add depth for river troughs
    if (intensity < -0.05) {
      finalColor = mix(finalColor, vec3(0.957, 0.5, 0.9), abs(intensity) * 2.0);
    }
    gl_FragColor = vec4(finalColor, fresnel);
  }
`;