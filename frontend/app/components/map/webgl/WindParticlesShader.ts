/**
 * WebGL Wind Particles Shader - Windy.com style
 * GPU-accelerated particle simulation for smooth animation
 * 
 * Features:
 * - Transform feedback for particle position updates
 * - Fade trails for smooth motion
 * - Screen-space rendering (constant size regardless of zoom)
 * - Color-coded by wind speed
 */

// ===== PARTICLE UPDATE SHADERS =====
// These shaders update particle positions on GPU

export const particleUpdateVertexShader = `
  precision highp float;

  // Input: current particle state
  attribute vec2 a_pos;          // Particle position in normalized coords [0,1]
  attribute float a_age;         // Current age (0 to maxAge)
  attribute vec2 a_seed;         // Random seed for reset

  // Output: updated particle state (will be captured via transform feedback)
  varying vec2 v_pos;
  varying float v_age;

  // Wind data texture (U=R, V=G channels from TIFF)
  uniform sampler2D u_wind;
  uniform vec2 u_windTextureSize;

  // Animation parameters
  uniform float u_deltaTime;     // Time since last frame (seconds)
  uniform float u_speedFactor;   // Speed multiplier
  uniform float u_dropRate;      // Probability of particle reset
  uniform float u_dropRateBump;  // Extra drop rate in high-speed areas
  uniform float u_particleMaxAge; // Maximum particle age

  // Random function (deterministic based on seed)
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 pos = a_pos;
    float age = a_age;

    // Sample wind at current position
    // Note: wind texture has U,V components in m/s, scaled to [-30, 30]
    vec4 windSample = texture2D(u_wind, pos);
    vec2 windVelocity = windSample.rg; // U, V components
    
    // Convert from texture space [-1,1] to wind speed [m/s]
    // Assuming texture stores normalized values
    windVelocity = (windVelocity - 0.5) * 60.0; // Scale from [0,1] to [-30,30] m/s
    
    // Calculate wind speed
    float windSpeed = length(windVelocity);
    
    // Normalize wind direction
    vec2 windDir = windSpeed > 0.01 ? normalize(windVelocity) : vec2(0.0);
    
    // Move particle based on wind
    // Convert wind speed to screen space movement
    // Windy.com style: smooth, natural motion
    // Scale factor adjusted for 60fps: pixels per second = windSpeed (m/s) * speedFactor
    float moveScale = u_speedFactor * u_deltaTime * 0.00015; // Slightly faster for Windy.com feel
    vec2 newPos = pos + windDir * windSpeed * moveScale;
    
    // Wrap around world edges (for global map)
    newPos.x = fract(newPos.x);
    newPos.y = clamp(newPos.y, 0.0, 1.0); // Don't wrap Y (latitude)
    
    // Age the particle
    float newAge = age + u_deltaTime;
    
    // Calculate drop probability
    float dropProb = u_dropRate + windSpeed * u_dropRateBump;
    float randomValue = random(a_seed * (age + 1.234));
    bool shouldDrop = randomValue < dropProb * u_deltaTime;
    
    // Reset particle if too old or random drop
    if (newAge > u_particleMaxAge || shouldDrop) {
      // Reset to random position
      newPos = vec2(
        random(a_seed * 1.234),
        random(a_seed * 5.678)
      );
      newAge = 0.0;
    }
    
    // Output updated state (captured by transform feedback)
    v_pos = newPos;
    v_age = newAge;
    
    // We don't care about gl_Position here, but WebGL requires it
    gl_Position = vec4(0.0);
  }
`;

export const particleUpdateFragmentShader = `
  precision mediump float;
  void main() {
    // We don't render anything in update pass
    discard;
  }
`;

// ===== PARTICLE RENDER SHADERS =====
// These shaders render particles to screen

export const particleRenderVertexShader = `
  precision highp float;

  // Input: particle state
  attribute vec2 a_pos;          // Particle position in normalized coords [0,1]
  attribute float a_age;         // Current age

  // Uniforms
  uniform mat4 u_matrix;         // Mapbox projection matrix
  uniform vec2 u_viewport;       // Viewport size (pixels)
  uniform float u_particleMaxAge;

  // Output to fragment shader
  varying float v_fade;

  void main() {
    // Calculate fade based on age (fade out at end of life)
    v_fade = 1.0 - (a_age / u_particleMaxAge);
    
    // Convert normalized position [0,1] to clip space [-1,1]
    vec2 clipPos = a_pos * 2.0 - 1.0;
    
    // Apply Mapbox projection matrix
    gl_Position = u_matrix * vec4(clipPos, 0.0, 1.0);
    
    // Particle size in pixels (Windy.com style: small and subtle)
    gl_PointSize = 1.5;
  }
`;

export const particleRenderFragmentShader = `
  precision mediump float;

  uniform float u_opacity;

  varying float v_fade;

  void main() {
    // White particles (like Windy.com)
    vec3 whiteColor = vec3(1.0, 1.0, 1.0);
    
    // Apply fade and opacity
    float alpha = v_fade * u_opacity;
    
    // Make particles round (not square)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }
    
    // Smooth edges (softer fade for Windy.com style)
    alpha *= 1.0 - smoothstep(0.2, 0.5, dist);
    
    gl_FragColor = vec4(whiteColor, alpha);
  }
`;

// ===== FADE TRAIL SHADERS =====
// These shaders create fade trails for smooth motion (like Windy)

export const fadeTrailVertexShader = `
  precision highp float;
  
  attribute vec2 a_position;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const fadeTrailFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_screen;
  uniform vec2 u_resolution;
  uniform float u_fadeOpacity;  // Fade factor (0.96-0.99 for trail effect)
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec4 color = texture2D(u_screen, uv);
    
    // Fade the previous frame
    gl_FragColor = vec4(color.rgb, color.a * u_fadeOpacity);
  }
`;

/**
 * Compile shader from source
 */
export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('❌ Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('❌ Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create shader program
 */
export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  transformFeedbackVaryings?: string[]
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error('❌ Failed to create program');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Setup transform feedback if specified
  if (transformFeedbackVaryings && transformFeedbackVaryings.length > 0) {
    const ext = gl.getExtension('EXT_transform_feedback');
    if (ext) {
      ext.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('❌ Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // Clean up shaders (no longer needed after linking)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Setup full-screen quad for fade trail effect
 */
export function setupFullscreenQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const posLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLocation);
  gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

  return buffer;
}


