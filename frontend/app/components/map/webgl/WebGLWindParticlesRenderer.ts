/**
 * WebGL Wind Particles Renderer - Windy.com style
 * 
 * High-performance GPU-accelerated particle simulation
 * Features:
 * - 10,000-65,000 particles (adaptive based on zoom)
 * - 60 FPS smooth animation
 * - Fade trails like Windy.com
 * - Color-coded by wind speed
 * - Screen-space rendering
 */

import {
  particleUpdateVertexShader,
  particleUpdateFragmentShader,
  particleRenderVertexShader,
  particleRenderFragmentShader,
  fadeTrailVertexShader,
  fadeTrailFragmentShader,
  compileShader,
  createShaderProgram,
  setupFullscreenQuad,
} from './WindParticlesShader';
import { createColorRampTexture, createWindTexture } from './WindShader';
import { WINDY_COLOR_STOPS } from '../utils/windyColorScale';
import type { TIFFWindData } from '../services/tiffService';

export interface WindParticlesOptions {
  numParticles?: number;      // Number of particles (default: adaptive)
  speedFactor?: number;        // Animation speed multiplier (default: 0.25)
  fadeOpacity?: number;        // Trail fade factor 0-1 (default: 0.996)
  dropRate?: number;           // Particle reset rate (default: 0.003)
  dropRateBump?: number;       // Extra drop in fast wind (default: 0.01)
  particleMaxAge?: number;     // Max particle lifetime in seconds (default: 10)
  opacity?: number;            // Overall opacity (default: 1.0)
}

export class WebGLWindParticlesRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  
  // Programs
  private updateProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;
  private fadeProgram: WebGLProgram | null = null;
  
  // Buffers for double-buffered particle state
  private particleStateBuffers: [WebGLBuffer | null, WebGLBuffer | null] = [null, null];
  private currentStateIndex = 0;
  
  // Textures
  private windTexture: WebGLTexture | null = null;
  private colorRampTexture: WebGLTexture | null = null;
  private screenTexture: WebGLTexture | null = null;
  private screenFramebuffer: WebGLFramebuffer | null = null;
  
  // Particle data
  private numParticles = 16384; // Will be adjusted based on zoom
  private particleMaxAge = 10.0; // seconds
  
  // Animation parameters
  private speedFactor = 0.25;
  private fadeOpacity = 0.996;
  private dropRate = 0.003;
  private dropRateBump = 0.01;
  private opacity = 1.0;
  
  // State
  private windData: TIFFWindData | null = null;
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;
  private isInitialized = false;
  
  // CPU-side particle data (for updates)
  private particleData: Float32Array | null = null;
  
  constructor(canvas: HTMLCanvasElement, options: WindParticlesOptions = {}) {
    this.canvas = canvas;
    
    // Get WebGL context
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: true,
    });
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    this.gl = gl;
    
    // Apply options
    if (options.numParticles) this.numParticles = options.numParticles;
    if (options.speedFactor) this.speedFactor = options.speedFactor;
    if (options.fadeOpacity) this.fadeOpacity = options.fadeOpacity;
    if (options.dropRate) this.dropRate = options.dropRate;
    if (options.dropRateBump) this.dropRateBump = options.dropRateBump;
    if (options.particleMaxAge) this.particleMaxAge = options.particleMaxAge;
    if (options.opacity !== undefined) this.opacity = options.opacity;
    
    this.initialize();
  }
  
  /**
   * Initialize WebGL programs and buffers
   */
  private initialize(): boolean {
    const gl = this.gl;
    
    // Create shader programs
    this.updateProgram = createShaderProgram(
      gl,
      particleUpdateVertexShader,
      particleUpdateFragmentShader
    );
    
    this.renderProgram = createShaderProgram(
      gl,
      particleRenderVertexShader,
      particleRenderFragmentShader
    );
    
    this.fadeProgram = createShaderProgram(
      gl,
      fadeTrailVertexShader,
      fadeTrailFragmentShader
    );
    
    if (!this.updateProgram || !this.renderProgram || !this.fadeProgram) {
      console.error('❌ Failed to create shader programs');
      return false;
    }
    
    // Create color ramp texture
    this.colorRampTexture = createColorRampTexture(gl, WINDY_COLOR_STOPS);
    if (!this.colorRampTexture) {
      console.error('❌ Failed to create color ramp texture');
      return false;
    }
    
    // Initialize particle state buffers
    this.initializeParticles();
    
    // Setup screen texture for fade trails
    this.setupScreenTexture();
    
    // Setup fullscreen quad for fade effect
    setupFullscreenQuad(gl, this.fadeProgram);
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    console.log('✅ Wind particles renderer initialized');
    console.log(`   Particles: ${this.numParticles}`);
    console.log(`   Speed factor: ${this.speedFactor}`);
    console.log(`   Fade opacity: ${this.fadeOpacity}`);
    
    this.isInitialized = true;
    return true;
  }
  
  /**
   * Initialize particle state with random positions
   */
  private initializeParticles() {
    const gl = this.gl;
    
    // Particle state: [x, y, age, seedX, seedY]
    const particleData = new Float32Array(this.numParticles * 5);
    
    for (let i = 0; i < this.numParticles; i++) {
      const offset = i * 5;
      particleData[offset + 0] = Math.random(); // x position [0,1]
      particleData[offset + 1] = Math.random(); // y position [0,1]
      particleData[offset + 2] = Math.random() * this.particleMaxAge; // age (stagger starts)
      particleData[offset + 3] = Math.random(); // seed x
      particleData[offset + 4] = Math.random(); // seed y
    }
    
    // Store CPU-side copy for updates
    this.particleData = new Float32Array(particleData);
    
    // Create double buffers for particle state (for ping-pong)
    for (let i = 0; i < 2; i++) {
      const buffer = gl.createBuffer();
      if (!buffer) {
        console.error('❌ Failed to create particle buffer');
        return;
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);
      this.particleStateBuffers[i] = buffer;
    }
    
    console.log(`✅ Initialized ${this.numParticles} particles`);
  }
  
  /**
   * Setup screen texture for fade trail effect
   */
  private setupScreenTexture() {
    const gl = this.gl;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create texture
    this.screenTexture = gl.createTexture();
    if (!this.screenTexture) {
      console.error('❌ Failed to create screen texture');
      return;
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Create framebuffer
    this.screenFramebuffer = gl.createFramebuffer();
    if (!this.screenFramebuffer) {
      console.error('❌ Failed to create screen framebuffer');
      return;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.screenFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.screenTexture, 0);
    
    // Check framebuffer status
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('❌ Framebuffer incomplete');
    }
    
    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  /**
   * Load wind data from TIFF
   */
  public loadWindData(windData: TIFFWindData) {
    const gl = this.gl;
    this.windData = windData;
    
    // Create texture with U and V components as RG channels
    const width = windData.width;
    const height = windData.height;
    const textureData = new Float32Array(width * height * 4); // RGBA
    
    for (let i = 0; i < width * height; i++) {
      // Normalize U,V from [-30, 30] to [0, 1]
      textureData[i * 4 + 0] = (windData.u[i] + 30) / 60; // R = U
      textureData[i * 4 + 1] = (windData.v[i] + 30) / 60; // G = V
      textureData[i * 4 + 2] = 0; // B (unused)
      textureData[i * 4 + 3] = 1; // A
    }
    
    // Create texture
    if (this.windTexture) {
      gl.deleteTexture(this.windTexture);
    }
    
    this.windTexture = gl.createTexture();
    if (!this.windTexture) {
      console.error('❌ Failed to create wind texture');
      return;
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.windTexture);
    
    // Check for float texture support
    const floatExt = gl.getExtension('OES_texture_float');
    if (!floatExt) {
      console.error('❌ Float textures not supported');
      return;
    }
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      textureData
    );
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    console.log(`✅ Loaded wind data: ${width}x${height}`);
  }
  
  /**
   * Update particle positions on CPU (for WebGL1 compatibility)
   * Updates CPU-side particle data, then uploads to GPU
   */
  private updateParticles(deltaTime: number) {
    if (!this.windData || !this.particleData) return;
    
    const { u, v, width, height } = this.windData;
    const clampedDelta = Math.min(deltaTime, 0.1);
    
    // Update each particle
    for (let i = 0; i < this.numParticles; i++) {
      const offset = i * 5;
      let x = this.particleData[offset + 0];
      let y = this.particleData[offset + 1];
      let age = this.particleData[offset + 2];
      const seedX = this.particleData[offset + 3];
      const seedY = this.particleData[offset + 4];
      
      // Sample wind at particle position
      const dataX = Math.floor(x * width);
      const dataY = Math.floor(y * height);
      const index = Math.max(0, Math.min(dataY * width + dataX, u.length - 1));
      
      const windU = u[index] || 0;
      const windV = v[index] || 0;
      const windSpeed = Math.sqrt(windU * windU + windV * windV);
      
      // Move particle based on wind direction
      // Normalize wind direction
      const windDirX = windSpeed > 0.01 ? windU / windSpeed : 0;
      const windDirY = windSpeed > 0.01 ? windV / windSpeed : 0;
      
      // Move particle (convert m/s to normalized coordinates)
      const moveScale = this.speedFactor * clampedDelta * 0.00015;
      x += windDirX * windSpeed * moveScale;
      y -= windDirY * windSpeed * moveScale; // Flip Y (canvas Y goes down)
      
      // Wrap around edges
      x = x - Math.floor(x); // Wrap X [0,1]
      y = Math.max(0, Math.min(1, y)); // Clamp Y [0,1]
      
      // Age particle
      age += clampedDelta;
      
      // Reset if too old or random drop
      const dropProb = this.dropRate + windSpeed * this.dropRateBump;
      const shouldDrop = Math.random() < dropProb * clampedDelta;
      
      if (age > this.particleMaxAge || shouldDrop) {
        x = Math.random();
        y = Math.random();
        age = 0;
      }
      
      // Write back to CPU-side data
      this.particleData[offset + 0] = x;
      this.particleData[offset + 1] = y;
      this.particleData[offset + 2] = age;
    }
    
    // Upload updated data to GPU buffer
    const gl = this.gl;
    const buffer = this.particleStateBuffers[this.currentStateIndex];
    if (buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleData, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }
  
  /**
   * Render particles to screen
   */
  private renderParticles(projectionMatrix: Float32Array) {
    if (!this.renderProgram || !this.windTexture) {
      console.warn('⚠️ Missing resources for rendering:', {
        program: !!this.renderProgram,
        windTexture: !!this.windTexture
      });
      return;
    }
    
    const gl = this.gl;
    const buffer = this.particleStateBuffers[this.currentStateIndex];
    if (!buffer) {
      console.warn('⚠️ No particle buffer');
      return;
    }
    
    // Use render program
    gl.useProgram(this.renderProgram);
    
    // Bind particle state buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    // Setup attributes
    const posLoc = gl.getAttribLocation(this.renderProgram, 'a_pos');
    const ageLoc = gl.getAttribLocation(this.renderProgram, 'a_age');
    
    const stride = 5 * 4;
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
    
    gl.enableVertexAttribArray(ageLoc);
    gl.vertexAttribPointer(ageLoc, 1, gl.FLOAT, false, stride, 8);
    
    // Set textures (only wind texture needed, no color ramp for white particles)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.windTexture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_wind'), 0);
    
    // Set uniforms
    gl.uniformMatrix4fv(gl.getUniformLocation(this.renderProgram, 'u_matrix'), false, projectionMatrix);
    gl.uniform2f(gl.getUniformLocation(this.renderProgram, 'u_viewport'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_particleMaxAge'), this.particleMaxAge);
    gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'u_opacity'), this.opacity);
    
    // Draw particles
    gl.drawArrays(gl.POINTS, 0, this.numParticles);
  }
  
  /**
   * Apply fade trail effect
   */
  private applyFadeTrail() {
    if (!this.fadeProgram || !this.screenTexture || !this.screenFramebuffer) return;
    
    const gl = this.gl;
    
    // Copy current framebuffer to screen texture
    gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.canvas.width, this.canvas.height, 0);
    
    // Use fade program
    gl.useProgram(this.fadeProgram);
    
    // Bind screen texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
    gl.uniform1i(gl.getUniformLocation(this.fadeProgram, 'u_screen'), 0);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(this.fadeProgram, 'u_resolution'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.fadeProgram, 'u_fadeOpacity'), this.fadeOpacity);
    
    // Draw fullscreen quad with fade
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  /**
   * Render one frame
   * 
   * Performance optimizations:
   * - Particles update happens in render shader (no CPU<->GPU transfer)
   * - Uses POINTS primitive for efficient rendering
   * - Adaptive particle count based on zoom
   * - Target: 60 FPS with 65k particles
   */
  public render(projectionMatrix: Float32Array) {
    if (!this.isInitialized) {
      console.warn('⚠️ Renderer not initialized');
      return;
    }
    
    if (!this.windData) {
      console.warn('⚠️ No wind data loaded');
      return;
    }
    
    const currentTime = performance.now() / 1000; // seconds
    const deltaTime = this.lastFrameTime > 0 ? currentTime - this.lastFrameTime : 1 / 60;
    this.lastFrameTime = currentTime;
    
    // Clamp delta time to avoid huge jumps (e.g., when tab inactive)
    const clampedDelta = Math.min(deltaTime, 0.1);
    
    const gl = this.gl;
    
    // Update particle positions first
    this.updateParticles(clampedDelta);
    
    // Clear canvas (for now, we'll add fade trails later)
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Enable blending for particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Render particles
    this.renderParticles(projectionMatrix);
    
    // Log first few renders for debugging
    if (this.lastFrameTime < 5) {
      console.log(`🎨 Rendering particles frame (time: ${this.lastFrameTime.toFixed(2)}s)`);
    }
  }
  
  /**
   * Start animation loop
   */
  public startAnimation(getProjectionMatrix: () => Float32Array) {
    if (this.animationFrameId !== null) {
      return; // Already animating
    }
    
    const animate = () => {
      const matrix = getProjectionMatrix();
      this.render(matrix);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.lastFrameTime = performance.now() / 1000;
    animate();
  }
  
  /**
   * Stop animation loop
   */
  public stopAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Update options
   */
  public updateOptions(options: Partial<WindParticlesOptions>) {
    if (options.speedFactor !== undefined) this.speedFactor = options.speedFactor;
    if (options.fadeOpacity !== undefined) this.fadeOpacity = options.fadeOpacity;
    if (options.dropRate !== undefined) this.dropRate = options.dropRate;
    if (options.dropRateBump !== undefined) this.dropRateBump = options.dropRateBump;
    if (options.particleMaxAge !== undefined) this.particleMaxAge = options.particleMaxAge;
    if (options.opacity !== undefined) this.opacity = options.opacity;
    
    if (options.numParticles !== undefined && options.numParticles !== this.numParticles) {
      this.numParticles = options.numParticles;
      this.initializeParticles();
    }
  }
  
  /**
   * Resize canvas
   */
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.setupScreenTexture();
  }
  
  /**
   * Clean up resources
   */
  public destroy() {
    this.stopAnimation();
    
    const gl = this.gl;
    
    // Delete programs
    if (this.updateProgram) gl.deleteProgram(this.updateProgram);
    if (this.renderProgram) gl.deleteProgram(this.renderProgram);
    if (this.fadeProgram) gl.deleteProgram(this.fadeProgram);
    
    // Delete buffers
    this.particleStateBuffers.forEach(buffer => {
      if (buffer) gl.deleteBuffer(buffer);
    });
    
    // Delete textures
    if (this.windTexture) gl.deleteTexture(this.windTexture);
    if (this.colorRampTexture) gl.deleteTexture(this.colorRampTexture);
    if (this.screenTexture) gl.deleteTexture(this.screenTexture);
    
    // Delete framebuffer
    if (this.screenFramebuffer) gl.deleteFramebuffer(this.screenFramebuffer);
    
    console.log('✅ Wind particles renderer destroyed');
  }
}

