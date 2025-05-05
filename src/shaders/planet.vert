  uniform float time;
  uniform float amplitude;
  uniform float frequency;
  uniform float speed;
  uniform float turbulence;
  #define PI 3.141592653589793238
  uniform vec3 sunPosition; // Position of the sun

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vSunPos;


    float rand(vec2 co)
    {
    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
    }
  varying vec2 vUv;
  varying float vDisplacement;
  varying float LightIntensity;

  // Simple noise function
  float noise(vec3 p) {
    return sin(p.x*1.5) * sin(p.y*1.8) * sin(p.z*1.3);
  }

  vec2 cartesianToSpherical(vec3 p) {
    p = normalize(p);
    float theta = atan(p.z, p.x);
    float phi = asin(p.y);
    return vec2(theta, phi);
  }

  #define MOD3 vec3(.1094,.1034,.123)


  void main() {
        vec3 LightPos   = vec3(10., 20., 30.);

        vUv = uv;
        vNormal = normalize(normalMatrix*normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        // vec3 ECposition = vec3(modelViewMatrix * gl_Vertex);

        gl_Position = projectionMatrix * modelViewMatrix *  vec4(position, 1.0);
        LightIntensity  = dot(normalize( LightPos - vPosition ), vNormal);
        LightIntensity  = abs(LightIntensity);

        float latitude = asin(position.y / length(position));
        float longitude = asin(position.x / length(position));
        float langonitude = asin(position.z / length(position));
        float riverPattern = sin(latitude * rand(vUv)*0.1 * frequency * 2.0 + time * speed);
        
        riverPattern = riverPattern*sin(longitude * rand(vUv)*0.1 * frequency);
        riverPattern = riverPattern*sin(noise(position)*0.1 * LightIntensity * frequency);
        
        // Add some noise based on position
        vec3 p = position * 10.0 * noise(position)*floor(noise(vNormal));
        float noiseValue = noise(p + sin(time));
        
        // Apply displacement along river patterns
        float displacement = riverPattern * amplitude;

        // Apply turbulence
        displacement += noiseValue * turbulence*0.1 * cos(time*0.01)*cos(position.x);
        
        // Store displacement for fragment shader
        vDisplacement = displacement;
        
        // Apply displacement along normal
        vec3 newPosition = position + normal * displacement * 0.1;
        vSunPos = sunPosition;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }