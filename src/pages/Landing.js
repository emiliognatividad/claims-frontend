import { useEffect, useRef, useState } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0, 1); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;

vec3 chrome(float t) {
  float s = sin(t * 6.28318);
  float c = cos(t * 6.28318 * 0.7);
  float bright = 0.5 + 0.5 * s;
  float mid = 0.3 + 0.3 * c;
  return vec3(
    0.15 + bright * 0.8,
    0.15 + bright * 0.82 + mid * 0.05,
    0.18 + bright * 0.78 + mid * 0.1
  );
}

float wave(vec2 uv, float t, float freq, float amp, float spd) {
  return sin(uv.x * freq + t * spd) * amp
       + sin(uv.x * freq * 1.7 - t * spd * 0.6) * amp * 0.4
       + sin(uv.x * freq * 0.5 + t * spd * 0.3) * amp * 0.6;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / u_res.y;
  float t = u_t * 0.35;
  vec3 color = vec3(0.0);

  for (float i = 0.0; i < 7.0; i++) {
    float layer = i / 7.0;
    float w = wave(uv, t, 1.8 + i * 0.4, 0.08 + i * 0.015, 0.5 + i * 0.1);
    float center = -0.25 + uv.x * 0.55 + layer * 0.12 + w;
    float dist = abs(uv.y - center);
    float line = smoothstep(0.003, 0.0, dist - 0.001);
    float glow = exp(-dist * 28.0) * 0.35;
    float band = exp(-dist * 8.0) * 0.12;
    float col_t = fract(uv.x * 0.3 - t * 0.12 + layer * 0.15 + w * 0.5);
    vec3 c = chrome(col_t);
    float shimmer = 0.7 + 0.3 * sin(uv.x * 12.0 + t * 2.0 + i);
    color += c * (line * shimmer + glow + band);
  }

  float vignette = 1.0 - length(uv) * 0.8;
  color *= clamp(vignette, 0.0, 1.0);
  color = color / (color + vec3(0.5));
  color = pow(color, vec3(0.85));
  gl_FragColor = vec4(color, 1.0);
}
`;

export default function Landing({ onEnter }) {
  const canvasRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    let raf;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT = gl.getUniformLocation(prog, 'u_t');

    window.addEventListener('resize', resize);
    resize();

    let start = null;
    function frame(ts) {
      if (!start) start = ts;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, (ts - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  const stats = [
    { value: '7', label: 'Industries' },
    { value: '21', label: 'Clients' },
    { value: '100%', label: 'Audit trail' },
    { value: 'Live', label: 'on AWS' },
  ];

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#000',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center', padding: '0 24px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 100, padding: '6px 18px',
          fontSize: 11, color: 'rgba(255,255,255,0.5)',
          marginBottom: 28, letterSpacing: '0.14em',
          fontFamily: 'inherit',
        }}>
          LOGISTICS OPERATIONS PLATFORM
        </div>

        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 88px)',
          fontWeight: 700,
          color: 'white',
          marginBottom: 20,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
        }}>
          Claims<br />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Platform</span>
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 1.8vw, 17px)',
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 44,
          maxWidth: 440,
          margin: '0 auto 44px',
          lineHeight: 1.65,
          letterSpacing: '-0.01em',
        }}>
          End-to-end logistics claims management. Track, escalate, and resolve claims with full audit trail and SLA monitoring.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <button onClick={onEnter} style={{
            background: 'rgba(255,255,255,0.92)', color: '#000',
            border: 'none', padding: '13px 28px',
            borderRadius: 12, fontSize: 15, fontWeight: 500,
            cursor: 'pointer', letterSpacing: '-0.01em',
            fontFamily: 'inherit',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.02)'}
          >
            Get started
          </button>
          <button onClick={onEnter} style={{
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '13px 28px', borderRadius: 12,
            fontSize: 15, fontWeight: 400,
            cursor: 'pointer', letterSpacing: '-0.01em',
            fontFamily: 'inherit',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Try demo
          </button>
        </div>

        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 3 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
