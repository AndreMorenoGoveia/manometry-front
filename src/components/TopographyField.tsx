import { useEffect, useRef } from "react";

/**
 * The ambient background: a slow, synthetic pressure topography.
 *
 * It is the same picture the model reads, drawn as atmosphere rather than as a
 * chart: a peristaltic front descending through the oesophageal body, a
 * standing high-pressure band where the junction sits, and a soft bloom that
 * follows the pointer. `accent` tints the warm end of the ramp, so once a study
 * has been classified the whole page settles into that diagnosis's colour.
 *
 * Everything is one fragment shader over a full-screen triangle: no geometry, no
 * texture uploads, one draw call per frame. If WebGL is missing or the context
 * is lost, the element simply stays transparent and the CSS gradient behind it
 * carries the page.
 */

const VERTEX = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uPointer;     // 0..1, smoothed
uniform float uPointerGlow; // 0..1
uniform vec3  uAccent;
uniform float uIntensity;

// -- value noise + fbm ------------------------------------------------------

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash2(i).x;
  float b = hash2(i + vec2(1.0, 0.0)).x;
  float c = hash2(i + vec2(0.0, 1.0)).x;
  float d = hash2(i + vec2(1.0, 1.0)).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 3; octave++) {
    total += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return total;
}

// The warp only needs a low-frequency displacement; two octaves are enough and
// the field is sampled three times per pixel, so this is where the cost is.
float fbm2(vec2 p) {
  return 0.5 * noise(p) + 0.25 * noise(p * 2.03);
}

// -- colour ramp ------------------------------------------------------------

vec3 ramp(float t, vec3 accent) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.020, 0.024, 0.039);   // void
  vec3 c1 = vec3(0.043, 0.086, 0.192);   // deep blue
  vec3 c2 = vec3(0.055, 0.278, 0.396);   // teal blue
  vec3 c3 = vec3(0.098, 0.514, 0.463);   // teal
  vec3 c4 = accent;                      // diagnosis tint
  vec3 c5 = vec3(0.945, 0.639, 0.294);   // amber
  vec3 c6 = vec3(1.000, 0.361, 0.361);   // red

  if (t < 0.22) return mix(c0, c1, smoothstep(0.00, 0.22, t));
  if (t < 0.42) return mix(c1, c2, smoothstep(0.22, 0.42, t));
  if (t < 0.60) return mix(c2, c3, smoothstep(0.42, 0.60, t));
  if (t < 0.76) return mix(c3, c4, smoothstep(0.60, 0.76, t));
  if (t < 0.90) return mix(c4, c5, smoothstep(0.76, 0.90, t));
  return mix(c5, c6, smoothstep(0.90, 1.00, t));
}

// -- field ------------------------------------------------------------------

float band(float y, float centre, float width) {
  return exp(-pow((y - centre) / width, 2.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = uTime * 0.055;

  // Domain warp: two fbm lookups displacing a third, which is what turns
  // regular noise into something that reads as fluid.
  vec2 warp = vec2(fbm2(p * 1.6 + vec2(0.0, t)), fbm2(p * 1.6 + vec2(4.3, -t * 0.8)));
  float texture0 = fbm(p * 2.4 + warp * 1.3 + vec2(t * 0.4, 0.0));

  // A peristaltic front descending the body, repeating every ~14 s.
  float cycle = fract(uTime * 0.07);
  float front = 1.0 - uv.y - cycle * 1.35 + 0.2;
  float wave = exp(-pow(front / 0.085, 2.0)) * (0.55 + 0.45 * texture0);

  // Standing bands: the upper sphincter high, the junction low.
  float sphincters = band(uv.y, 0.93, 0.035) * 0.42 + band(uv.y, 0.12, 0.05) * 0.55;

  // Pointer bloom, corrected for aspect so it stays circular.
  vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
  float glow = exp(-pow(distance(p, pointer) / 0.34, 2.0)) * uPointerGlow;

  float pressure = texture0 * 0.52 + wave * 0.66 + sphincters + glow * 0.5;
  pressure *= uIntensity;

  vec3 colour = ramp(pressure, uAccent);

  // Vignette and a floor of pure void so the page's text always has contrast.
  float vignette = smoothstep(1.25, 0.28, length(uv - 0.5));
  colour *= 0.30 + 0.70 * vignette;
  colour = mix(vec3(0.020, 0.024, 0.039), colour, 0.94);

  gl_FragColor = vec4(colour, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  const numeric = Number.parseInt(full, 16);
  if (!Number.isFinite(numeric) || full.length !== 6) return [0.376, 0.902, 0.784];
  return [((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export interface TopographyFieldProps {
  /** Hex colour the warm end of the ramp is tinted with. */
  accent?: string;
  /** Overall brightness; drop it when content sits on top. */
  intensity?: number;
  className?: string;
}

export default function TopographyField({
  accent = "#60e6c8",
  intensity = 1,
  className = "",
}: TopographyFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Read by the render loop, which must not be torn down and rebuilt just
  // because the page changed colour.
  const accentRef = useRef(accent);
  const intensityRef = useRef(intensity);
  useEffect(() => {
    accentRef.current = accent;
    intensityRef.current = intensity;
  }, [accent, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false, depth: false }) as
        | WebGLRenderingContext
        | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the clip volume, cheaper than a quad, and it
    // avoids the diagonal seam two triangles produce in derivative-heavy shaders.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      glow: gl.getUniformLocation(program, "uPointerGlow"),
      accent: gl.getUniformLocation(program, "uAccent"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
    };

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, glow: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    const started = performance.now();

    // The field is a smooth gradient, so it is drawn well below the display's
    // pixel grid and upscaled by the compositor: no visible difference, a third
    // of the fragments. On a machine that still cannot keep up, the first
    // second of frames halves it once more rather than shipping a stutter.
    let scale = 0.6;
    let sampled = 0;
    let sampleStart = 0;
    let degraded = false;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      const nextWidth = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const nextHeight = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    const measure = (now: number) => {
      if (degraded || reduced) return;
      if (sampleStart === 0) {
        sampleStart = now;
        return;
      }
      sampled += 1;
      const elapsed = now - sampleStart;
      if (elapsed < 1200) return;
      degraded = true;
      if (sampled / (elapsed / 1000) < 24) {
        scale = 0.38;
        width = height = 0;   // force the next resize() to rebuild the buffer
      }
    };

    const draw = (now: number) => {
      resize();
      // Ease the pointer so a fast flick does not snap the bloom across the page.
      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;
      const [r, g, b] = hexToRgb(accentRef.current);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform1f(uniforms.time, reduced ? 8 : (now - started) / 1000);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.glow, pointer.glow);
      gl.uniform3f(uniforms.accent, r, g, b);
      gl.uniform1f(uniforms.intensity, intensityRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (!running) return;
      measure(now);
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX / window.innerWidth;
      pointer.targetY = 1 - event.clientY / window.innerHeight;
      pointer.glow = 1;
    };
    const onPointerLeave = () => {
      pointer.glow = 0;
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running && !reduced) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);

    if (reduced) {
      draw(performance.now());
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="topography-field"
      className={`h-full w-full ${className}`}
    />
  );
}
