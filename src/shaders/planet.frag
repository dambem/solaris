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

uniform vec3 atmosphereColor; // Color of the atmosphere
uniform float atmosphereThickness; // Thickness of the atmosphere
uniform float atmosphereIntensity; // Brightness of the glow

// Noise functions (keeping your existing ones)
float rand(vec2 co) {
    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

const mat2 mtx = mat2( 0.80, 0.60, -0.60, 0.80);

vec2 cartesianToSpherical(vec3 p) {
    p = normalize(p);
    float theta = atan(p.z, p.x);
    float phi = asin(p.y);
    return vec2(theta, phi);
}

float fbm4( vec2 p ) {
    float f = 0.0;
    f += 0.5000*(-1.0+2.0*noise( p )); p = mtx*p*2.02;
    f += 0.2500*(-1.0+2.0*noise( p )); p = mtx*p*2.03;
    f += 0.1250*(-1.0+2.0*noise( p )); p = mtx*p*2.01;
    f += 0.0625*(-1.0+2.0*noise( p ));
    return f/0.9375;
}

float fbm6( vec2 p ) {
    float f = 0.0;
    f += 0.500000*noise(p); p= mtx*p*2.02;
    f += 0.250000*noise(p); p= mtx*p*2.03;
    f += 0.125000*noise(p); p= mtx*p*2.01;
    f += 0.062500*noise(p); p= mtx*p*2.04;
    f += 0.031250*noise(p); p= mtx*p*2.01;
    f += 0.015625*noise(p);
    return f/0.96875;
}

vec2 fbm4_2( vec2 p ) {
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

// Enhanced lighting function
vec3 calculateLighting(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 baseColor) {
    // Normalize all vectors
    normal = normalize(normal);
    lightDir = normalize(lightDir);
    viewDir = normalize(viewDir);
    
    // Diffuse lighting
    float NdotL = max(0.0, dot(normal, lightDir));
    vec3 diffuse = baseColor * NdotL;
    
    // Specular lighting (Phong)
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(0.3) * spec;
    
    // Ambient lighting
    vec3 ambient = baseColor * 0.2;
    
    // Subsurface scattering approximation
    float subsurface = pow(max(0.0, dot(-lightDir, viewDir)), 4.0) * 0.3;
    vec3 sss = baseColor * subsurface;
    
    return ambient + diffuse + specular + sss;
}

void main() {
    vec3 tot = vec3(0.0);
    float alpha = 0.1;

    for (int mi=0; mi<AA; mi++)
    for (int ni=0; ni<AA; ni++) {
        vec2 sphereCoords = cartesianToSpherical(normalize(vPosition));
        vec2 of = vec2(float(mi), float(ni))/float(AA) - 0.5;
        sphereCoords += of * 0.00001;

        vec4 on = vec4(0.0);
        float f = func(sphereCoords, on);
        
        // Enhanced base colors with more variation
        vec3 deepOcean = vec3(0.05, 0.1, 0.3);
        vec3 shallowWater = vec3(0.1, 0.3, 0.5);
        vec3 land = vec3(0.2, 0.5, 0.1);
        vec3 mountains = vec3(0.4, 0.3, 0.2);
        vec3 snow = vec3(0.9, 0.9, 0.95);
        
        // Base color mixing based on height
        vec3 col = deepOcean;
        col = mix(col, shallowWater, smoothstep(0.3, 0.45, f));
        col = mix(col, land, smoothstep(0.45, 0.55, f));
        col = mix(col, mountains, smoothstep(0.65, 0.75, f));
        col = mix(col, snow, smoothstep(0.8, 0.9, f));
        
        // Add noise variation
        col = mix(col, col * 1.2, dot(on.zw, on.zw) * 0.5);
        
        // Calculate enhanced normals
        vec3 nor = normalize(vNormal);
        vec3 tangentX = normalize(cross(nor, vec3(0.0,1.0,0.0)));
        vec3 tangentY = normalize(cross(nor, tangentX));
        
        // Stronger normal perturbation for more surface detail
        float normalStrength = 0.5;
        nor = normalize(nor + tangentX * (on.x * normalStrength) + tangentY * (on.y * normalStrength));
        
        // DEBUG: Simple, strong lighting that should definitely be visible
        vec3 lightDir = normalize(vSunPos); // Treat as directional light
        vec3 viewDir = normalize(-vPosition);
        
        // Simple diffuse lighting with strong contrast
        float NdotL = max(0.0, dot(nor, lightDir));
        
        // Make lighting very obvious
        vec3 litColor = col * (0.3 + 0.7 * NdotL); // Strong lighting contrast
        
        // Add simple specular
        vec3 reflectDir = reflect(-lightDir, nor);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
        litColor += vec3(0.5) * spec;
        
        // DEBUG: Make the final color very obvious
        vec3 finalColor = litColor;
        
        // Add color shift as a simple tint
        finalColor *= (1.0 + colorShift * 0.5);
        
        tot += finalColor;
    }

    tot /= float(AA * AA);
    
    // Calculate fresnel and atmosphere
    vec3 viewDirection = normalize(-vPosition);
    float fresnel = 1.0 - max(0.0, dot(viewDirection, normalize(vNormal)));
    fresnel = pow(fresnel, 3.0);

    float atmosphere = calculateAtmosphere(
        vPosition,
        viewDirection,
        normalize(vSunPos), 
        atmosphereThickness
    );

    // Add atmospheric glow
    vec3 atmosphericGlow = atmosphereColor * atmosphere * atmosphereIntensity;
    tot += atmosphericGlow;
    
    // Enhanced alpha calculation
    alpha = max(fresnel * 0.8, atmosphere * 0.3);
    alpha = clamp(alpha, 0.1, 1.0);

    gl_FragColor = vec4(tot, alpha);
}