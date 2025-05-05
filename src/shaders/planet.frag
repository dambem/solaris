  uniform float colorShift;
  varying vec2 vUv;
  varying float vDisplacement;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;


  #define AA 3
  uniform float intensity;
  uniform vec3 glowColor;
  uniform vec3 waterColorI;
  varying vec3 vSunPos; // Sun position passed from vertex shader


  uniform vec3 atmosphereColor; // Color of the atmosphere (e.g., vec3(0.3, 0.6, 1.0) for blue)
  uniform float atmosphereThickness; // Thickness of the atmosphere (e.g., 0.15)
  uniform float atmosphereIntensity; // Brightness of the glow (e.g., 1.5)



  float rand(vec2 co)
  {
  return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f); // Smoother interpolation
      
      float a = rand(i);
      float b = rand(i + vec2(1.0, 0.0));
      float c = rand(i + vec2(0.0, 1.0));
      float d = rand(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }


  float hash(vec2 p) {
    p = fract(p*0.6180339887);
    p += 25.0;    
    return fract(p.x*p.y*(p.x+p.y));
  }

  const mat2 mtx = mat2( 0.80, 0.60, -0.60, 0.80);


  vec2 cartesianToSpherical(vec3 p) {
    p = normalize(p);
    float theta = atan(p.z, p.x);
    float phi = asin(p.y);
    return vec2(theta, phi);
  }

  float fbm4( vec2 p )
  {
      float f = 0.0;
      f += 0.5000*(-1.0+2.0*noise( p )); p = mtx*p*2.02;
      f += 0.2500*(-1.0+2.0*noise( p )); p = mtx*p*2.03;
      f += 0.1250*(-1.0+2.0*noise( p )); p = mtx*p*2.01;
      f += 0.0625*(-1.0+2.0*noise( p ));
      return f/0.9375;
  }


  float fbm6( vec2 p )
  {
    float f = 0.0;
    f += 0.500000*noise(p); p= mtx*p*2.02;
    f += 0.250000*noise(p); p= mtx*p*2.03;
    f += 0.125000*noise(p); p= mtx*p*2.01;
    f += 0.062500*noise(p); p= mtx*p*2.04;
    f += 0.031250*noise(p); p= mtx*p*2.01;
    f += 0.015625*noise(p);
    return f/0.96875;
  }

  vec2 fbm4_2( vec2 p )
  {
    return vec2( fbm4(p+vec2(1.0)), fbm4(p+vec2(6.2)));
  }

  vec2 fbm6_2( vec2 p ){
    return vec2( fbm6(p+vec2(9.2)), fbm6(p+vec2(5.7)));
  }

float func(vec2 q, out vec4 ron) {
    q *= vec2(20.0, 20.0);
    
    q += 0.03 * sin(vec2(0.27, 0.23) * time + length(q) * vec2(4.1, 4.3));
    vec2 o = fbm4_2(0.9 * q);
    o += 0.04 * sin(vec2(0.12, 0.14) * time + length(o));
    vec2 n = fbm6_2(3.0 * o);
    ron = vec4(o, n);
    float f = 0.5 + 0.5 * fbm4(1.8 * q + 6.0 * n);
    return mix(f, f * f * f * 3.5, f * abs(n.x));
}
  float calculateAtmosphere(vec3 position, vec3 viewDirection, vec3 lightDirection, float thickness) {
      float rim = 1.0 - max(0.0, dot(normalize(position), viewDirection));
      rim = pow(rim, 4.0) * thickness;
      
      float subsurface = max(0.0, dot(viewDirection, -lightDirection)) * 0.5;
      subsurface = pow(subsurface, 2.0);      
      return pow(rim, 1.5) + subsurface * rim;
  }
  void main() {
    // Base blue color for water
    vec3 tot = vec3(0.0);
    float alpha = 0.1;


    for (int mi=0; mi<AA; mi++)
    for (int ni=0; ni<AA; ni++)
    {
      vec2 sphereCoords = cartesianToSpherical(normalize(vPosition));

      vec2 of = vec2(float(mi), float(ni))/float(AA) - 0.5;
      sphereCoords += of * 0.00001;

      vec4 on = vec4(0.0);
      vec2 o, n;
      float f = func(sphereCoords, on);

      vec3 col = vec3(0.2,0.2,0.4);

      col = mix( col, vec3(0.1,0.25,0.05), f );
      col = mix( col, vec3(0.9,0.9,0.9), dot(n,n) );
      col = mix( col, vec3(0.5,0.2,0.2), 0.5*o.y*o.y );
      col = mix( col, vec3(0.3,0.2,0.4), 0.5*smoothstep(1.2, 1.3, abs(n.y)+abs(n.x) ));
      col *= f*2.0;

      vec3 nor = vNormal;
      vec3 tangentX = normalize(cross(nor, vec3(0.0,1.0,0.0)));
      vec3 tangentY = normalize(cross(nor, tangentX));

      nor = normalize(nor+ tangentX*(on.x*0.1) +  tangentY * (on.y*0.1));
      vec3 lig = normalize(vSunPos);
      float dif = clamp(0.3 + 0.7 * dot(nor, lig), 0.0, 1.0);
      vec3 lin = vec3(0.70, 0.90, 0.95) * (nor.y*0.5 + 0.5) + vec3(0.15,0.15,0.05) * dif;

      col *= 1.2*lin;
      col = 1.0 - col;
      col = 1.1 * col * col;

      float shimmer = sin(sphereCoords.x * 20.0 + sphereCoords.y * 15.0 + time * 2.0) * 0.05;
      vec3 viewDirection = normalize(-vPosition);
      float fresnel = dot(viewDirection, nor);
      fresnel = pow(fresnel, 5.0) * f;

      col += col*shimmer;

      vec3 finalColor = mix(
        col,
        vec3(1.0*colorShift+rand(vUv)*0.9, 3.0*colorShift, 1.0*colorShift),
        abs(f - 0.7) + colorShift * fresnel
      );

      if (f > 0.55) {
        finalColor = mix(finalColor, vec3(0.1, 0.2, 0.4), (f - 0.55) * 2.0);
      }
  
      float sunFacing = max(0.1, dot(nor, normalize(vSunPos)));
      float shadowFactor = mix(0.5, 5.0, sunFacing);
      finalColor *= shadowFactor;

      if (f < 0.45) {
        finalColor = mix(finalColor, vec3(0.9, 0.1, 0.5), (0.45-f)*2.0);
      }

      tot +=finalColor;
    }

    tot /= float(AA * AA);
    vec3 viewDirection = normalize(-vPosition);
    float fresnel = dot(viewDirection, vNormal);
    fresnel = pow(fresnel, 7.0);

    float atmosphere = calculateAtmosphere(
        vPosition,
        viewDirection,
        normalize(vSunPos), 
        atmosphereThickness
    );

    vec3 atmosphericGlow = atmosphereColor*atmosphere*atmosphereIntensity;
    tot += atmosphericGlow;
    alpha = max(fresnel, atmosphere*0.5);

    gl_FragColor = vec4(tot, alpha);
  }