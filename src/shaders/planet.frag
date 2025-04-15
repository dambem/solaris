  uniform float colorShift;
  varying vec2 vUv;
  varying float vDisplacement;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;

  
  uniform float intensity;
  uniform vec3 glowColor;
  uniform vec3 waterColorI;
  varying vec3 vSunPos; // Sun position passed from vertex shader

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
    fresnel = pow(fresnel, 5.0) * intensity;

    // Adjust color based on displacement
    float intensity = vDisplacement;

    waterColor += waterColor * shimmer;
    
    // Create shifting color effect
    vec3 finalColor = mix(
      waterColor,
      vec3(1.0*colorShift+rand(vUv)*0.9, 3.0*colorShift, 1.0*colorShift),
      abs(intensity) + colorShift * fresnel
    );
    
    // Add highlight for river crests
    if (intensity > 0.05) {
      finalColor = mix(finalColor, vec3(0.5, 0.1, 0.3), intensity * 0.4);
    }

    float sunFacing = max(0.5, dot(normalize(vNormal), normalize(vSunPos)));
    float shadowFactor = mix(0.5, 5.0, sunFacing);
    finalColor *= shadowFactor;

    // if (intensity > 0.02) {
    //   finalColor = mix(finalColor, vec3(0.1, 0.1, 0.1), intensity * 5);
    // }
    
    // Add depth for river troughs
    if (intensity < -0.05) {
      finalColor = mix(finalColor, vec3(0.9, 0.1, 0.5), abs(intensity)*0.4);
    }
    gl_FragColor = vec4(finalColor, fresnel);
  }