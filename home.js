/*
  thewebpage.com.au — the background.
  One full-screen shader draws a sheet of spacetime: swells that catch long
  strip lights, a faint lattice lensed by the curvature, wells under the
  cursor, each window and any selected text, ripples from clicks and passing
  gravitational waves, and quantum foam: bubbles that swell and pop, virtual
  pairs that split and annihilate, and a froth that shimmers in the light.
  Dust is ~1,000 points drawn on top. If frames run long the canvas drops
  resolution until it holds 60fps.

  startSpace() returns a stop function. The same engine runs in the Claude
  Design copy of this page, where tweak() reads its sliders.
*/
function startSpace({ canvas, tweak = () => ({}) }) {
  const doc = canvas.ownerDocument, view = doc.defaultView;
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) { doc.documentElement.classList.add('no-gl'); return () => {}; }

  const calm = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wins = [...doc.querySelectorAll('.win')].slice(0, 8); // the shader has 8 window slots
  const frames = wins.map(a => a.querySelector('.frame'));
  const offs = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); offs.push(() => target.removeEventListener(type, fn, opts)); };

  const FULL = `#version 300 es
void main() { gl_Position = vec4(vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4.0 - 1.0, 0.0, 1.0); }`;

  const FABRIC = `#version 300 es
precision highp float;
uniform vec2 uRes, uDev;
uniform float uTime, uFade;
uniform vec4 uCur, uSel;
uniform vec4 uTweak;     // waves, foam, unused, lattice
uniform vec4 uRip[16];   // x, y, born, amplitude
uniform vec4 uWin[8];    // centre x, y, half width, half height (css px)
uniform vec4 uTint[8];   // linear rgb, hover
out vec4 o;

uvec3 pcg(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 hash(vec3 p) { return vec3(pcg(uvec3(ivec3(p) + 65536))) * (1.0 / 4294967295.0); }
vec3 grad(vec3 p) { return hash(p) * 2.0 - 1.0; }

// gradient noise and its analytic derivatives (after Inigo Quilez)
vec4 noised(vec3 x) {
  vec3 i = floor(x), f = x - i;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec3 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec3 ga = grad(i), gb = grad(i + vec3(1, 0, 0)), gc = grad(i + vec3(0, 1, 0)), gd = grad(i + vec3(1, 1, 0));
  vec3 ge = grad(i + vec3(0, 0, 1)), gf = grad(i + vec3(1, 0, 1)), gg = grad(i + vec3(0, 1, 1)), gh = grad(i + vec3(1, 1, 1));
  float va = dot(ga, f), vb = dot(gb, f - vec3(1, 0, 0)), vc = dot(gc, f - vec3(0, 1, 0)), vd = dot(gd, f - vec3(1, 1, 0));
  float ve = dot(ge, f - vec3(0, 0, 1)), vf = dot(gf, f - vec3(1, 0, 1)), vg = dot(gg, f - vec3(0, 1, 1)), vh = dot(gh, f - vec3(1, 1, 1));
  float k7 = -va + vb + vc - vd + ve - vf - vg + vh;
  return vec4(
    va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va) + u.x * u.y * (va - vb - vc + vd)
      + u.y * u.z * (va - vc - ve + vg) + u.z * u.x * (va - vb - ve + vf) + u.x * u.y * u.z * k7,
    ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga) + u.x * u.y * (ga - gb - gc + gd)
      + u.y * u.z * (ga - gc - ge + gg) + u.z * u.x * (ga - gb - ge + gf) + u.x * u.y * u.z * (-ga + gb + gc - gd + ge - gf - gg + gh)
      + du * (vec3(vb - va, vc - va, ve - va) + u.yzx * vec3(va - vb - vc + vd, va - vc - ve + vg, va - vb - ve + vf)
      + u.zxy * vec3(va - vb - ve + vf, va - vb - vc + vd, va - vc - ve + vg) + u.yzx * u.zxy * k7));
}

// distance to a rounded box, and its gradient
vec3 sdgBox(vec2 p, vec2 b, float r) {
  vec2 s = sign(p), w = abs(p) - b + r, q = max(w, 0.0);
  float g = max(w.x, w.y), l = length(q);
  return vec3((g > 0.0 ? l : g) - r, s * (g > 0.0 ? q / max(l, 1e-4) : (w.x > w.y ? vec2(1, 0) : vec2(0, 1))));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uDev.y - gl_FragCoord.y) * uRes / uDev; // css px, y down
  float t = uTime, wv = uTweak.x, fm = uTweak.y;
  vec3 F = vec3(0);    // height of the fabric (css px) and its gradient
  vec3 glow = vec3(0);

  // swells: two octaves of evolving noise and three long travelling waves
  vec4 n = noised(vec3(p / 640.0, t * 0.04));
  F += vec3(n.x, n.yz / 640.0) * 19.0 * wv;
  const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  n = noised(vec3(R * p / 270.0, t * 0.065 + 17.0));
  F += vec3(n.x, (n.yz * R) / 270.0) * 6.0 * wv;
  vec2 k1 = vec2(0.0066, 0.0021), k2 = vec2(-0.0047, 0.0079), k3 = vec2(0.0019, -0.0049);
  float a1 = dot(k1, p) - t * 0.2, a2 = dot(k2, p) - t * 0.15, a3 = dot(k3, p) - t * 0.11;
  F += wv * (3.5 * vec3(sin(a1), k1 * cos(a1)) + 2.5 * vec3(sin(a2), k2 * cos(a2)) + 4.5 * vec3(sin(a3), k3 * cos(a3)));

  // gravity wells: the cursor, and any selected text
  vec2 d = p - uCur.xy;
  float u = 1.0 + dot(d, d) / 15000.0;
  F += uCur.z * 34.0 * vec3(-1.0 / u, 2.0 * d / (15000.0 * u * u));
  d = p - uSel.xy;
  u = 1.0 + dot(d, d) / 40000.0;
  F += uSel.z * 40.0 * vec3(-1.0 / u, 2.0 * d / (40000.0 * u * u));

  // ripples: outgoing wave packets
  for (int i = 0; i < 16; i++) {
    vec4 r = uRip[i];
    float age = t - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 7.0) continue;
    vec2 e = p - r.xy;
    float rr = length(e), x = rr - 230.0 * age;
    if (abs(x) > 180.0) continue;
    float env = r.w * 3.0 * exp(-age * 0.85 - x * x / 3600.0) / sqrt(1.0 + rr / 80.0);
    float s = sin(x * 0.1366), c = cos(x * 0.1366);
    F.x += env * s;
    F.yz += env * (0.1366 * c - x / 1800.0 * s) * e / max(rr, 1.0) * smoothstep(0.0, 30.0, rr);
  }

  // quantum foam: in random cells a bubble swells and collapses while a
  // virtual pair splits apart and annihilates
  vec2 cell = floor(p / 80.0);
  vec3 hs = hash(vec3(cell, 3.0));
  float ep = t / (2.0 + 3.0 * hs.x) + hs.y;
  vec3 he = hash(vec3(cell, floor(ep) + 9.0));
  float lf = fract(ep) / 0.4;
  if (he.x < 0.5 * min(fm, 1.6) && lf < 1.0) {
    float env = sin(3.14159 * lf);
    env *= env;
    vec2 e = p - (cell + 0.3 + 0.4 * he.yz) * 80.0;
    float sg = 2.5 + 5.5 * lf, g = exp(-dot(e, e) / (sg * sg));
    F += (he.z > 0.5 ? 1.0 : -1.0) * (0.9 + 1.1 * he.y) * fm * env * g * vec3(1.0, -2.0 * e / (sg * sg));
    vec2 ax = vec2(cos(he.z * 40.0), sin(he.z * 40.0)) * 3.5 * sin(3.14159 * lf);
    glow += env * env * 0.9 * fm * (exp(-dot(e - ax, e - ax) / 1.4) * vec3(1.0, 0.78, 0.58) + exp(-dot(e + ax, e + ax) / 1.4) * vec3(0.6, 0.78, 1.0));
  }

  // each window weighs the fabric down and spills its colour onto it
  for (int i = 0; i < 8; i++) {
    vec4 w = uWin[i];
    if (w.z <= 0.0) continue;
    vec3 sd = sdgBox(p - w.xy, w.zw, 12.0);
    float dd = max(sd.x, 0.0);
    if (dd > 420.0) continue;
    float hot = uTint[i].w, u2 = 1.0 + dd * dd / 6400.0;
    F += (7.0 + 16.0 * hot) * vec3(-1.0 / u2, 2.0 * dd / (6400.0 * u2 * u2) * sd.yz);
    glow += uTint[i].rgb * exp(-dd / (46.0 + 50.0 * hot)) * (0.012 + 0.05 * hot);
  }

  // shade
  vec2 G = F.yz;
  vec3 N = normalize(vec3(-G, 1.0));
  vec2 cc = (p - uRes * vec2(0.5, 0.56)) / uRes.y;
  vec3 col = vec3(0.0020, 0.0026, 0.0048)
    + vec3(0.0045, 0.0060, 0.0170) * exp(-dot(cc, cc) * 2.2)
    + vec3(0.0000, 0.0040, 0.0060) * exp(-dot(cc - vec2(0.62, 0.42), cc - vec2(0.62, 0.42)) * 2.6)
    + vec3(0.0030, 0.0012, 0.0045) * exp(-dot(cc + vec2(0.7, 0.45), cc + vec2(0.7, 0.45)) * 2.8);

  vec3 L = normalize(vec3(-0.55 + 0.2 * sin(t * 0.04), -0.8, 0.5));
  float rel = dot(N, L) - L.z;                      // zero on flat fabric
  col *= 1.0 + 3.6 * rel;
  col += vec3(0.010, 0.013, 0.024) * max(rel, 0.0) * 2.5;

  // silk: the swells catch long strip lights, so highlights slide along their
  // slopes; a fine froth (the foam at small scale) shimmers inside them
  vec4 mf = noised(vec3(p / 22.0, t * 0.9));
  vec3 Ns = normalize(vec3(-(G + mf.yz * 0.012 * fm), 1.0));
  vec3 Rf = reflect(vec3(0.0, 0.0, -1.0), Ns);
  float s1 = (Rf.y + 0.11 + 0.04 * sin(t * 0.05)) / 0.05, s2 = (Rf.y - 0.17) / 0.07, s3 = (Rf.x - 0.2 + 0.05 * sin(t * 0.03)) / 0.06;
  col += wv * (0.22 + 0.5 * exp(-dot(cc, cc) * 1.2)) * (
      exp(-s1 * s1) * exp(-Rf.x * Rf.x * 4.0) * vec3(0.036, 0.045, 0.078)
    + exp(-s2 * s2) * vec3(0.022, 0.012, 0.028)
    + exp(-s3 * s3) * vec3(0.000, 0.012, 0.016));
  col += vec3(0.85, 0.88, 1.0) * pow(max(dot(Ns, normalize(L + vec3(0, 0, 1))), 0.0), 180.0) * 0.55;
  float tilt = length(G);
  col += (0.5 + 0.5 * cos(6.2831 * (atan(G.y, G.x) / 6.2831 + tilt * 2.0 + vec3(0.0, 0.33, 0.67)))) * 0.018 * smoothstep(0.04, 0.4, tilt);

  // the lattice, bent by the same curvature
  vec2 gq = (p + G * 60.0) / 66.0;
  vec2 gw = abs(fract(gq - 0.5) - 0.5) / fwidth(gq);
  float line = 1.0 - min(min(gw.x, gw.y), 1.0);
  col += vec3(0.0055, 0.0070, 0.0135) * line * exp(-dot(cc, cc) * 1.6) * (1.0 + 10.0 * max(rel, 0.0)) * uTweak.w;

  col += glow;
  vec2 uv = p / uRes - 0.5;
  col *= mix(0.45, 1.0, smoothstep(1.35, 0.3, length(uv * vec2(uRes.x / uRes.y, 1.0)))) * uFade;
  col = pow(col / (1.0 + col), vec3(1.0 / 2.2));
  vec3 h = hash(vec3(gl_FragCoord.xy, floor(fract(t * 0.37) * 4096.0)));
  o = vec4(col + (h.x + h.y - 1.0) / 255.0, 1.0); // dither: no banding in the dark gradients
}`;

  const DUST_VS = `#version 300 es
layout(location = 0) in vec4 aP;   // x, y (css px), size (css px), alpha
layout(location = 1) in float aT;  // 0 warm .. 1 cool
uniform vec2 uRes, uDev;
out vec3 vC;
out float vA, vB;
void main() {
  gl_Position = vec4(aP.x / uRes.x * 2.0 - 1.0, 1.0 - aP.y / uRes.y * 2.0, 0.0, 1.0);
  float px = aP.z * uDev.x / uRes.x, s = max(px, 2.0);
  gl_PointSize = s;
  vA = aP.w * min(1.0, px * px / (s * s)); // sub-pixel motes: draw 2px, dim by area, no shimmer
  vB = step(5.0, aP.z);
  vC = mix(vec3(1.0, 0.88, 0.72), vec3(0.74, 0.85, 1.0), aT);
}`;

  const DUST_FS = `#version 300 es
precision mediump float;
in vec3 vC;
in float vA, vB;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float a = mix(exp(-r2 * 4.5), smoothstep(1.0, 0.7, r2) * 0.55 + 0.25 * exp(-r2 * 3.0), vB);
  o = vec4(vC * a * vA, 1.0);
}`;

  function program(vs, fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // dust
  const N = Math.round(Math.min(1500, Math.max(280, view.innerWidth * view.innerHeight / 1100)));
  const P = new Float32Array(N * 5); // to the GPU: x, y, size, alpha, temperature
  const V = new Float32Array(N * 2); // velocity
  const M = new Float32Array(N * 4); // depth, base alpha, twinkle rate, phase

  let fabric, dust, U, DU, vao, buf;
  function init() {
    fabric = program(FULL, FABRIC);
    dust = program(DUST_VS, DUST_FS);
    U = {};
    DU = {};
    for (const k of ['uRes', 'uDev', 'uTime', 'uFade', 'uCur', 'uSel', 'uTweak', 'uRip', 'uWin', 'uTint']) U[k] = gl.getUniformLocation(fabric, k);
    for (const k of ['uRes', 'uDev']) DU[k] = gl.getUniformLocation(dust, k);
    vao = gl.createVertexArray();
    buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, P.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
    gl.bindVertexArray(null);
  }
  try { init(); } catch (err) {
    console.error(err);
    doc.documentElement.classList.add('no-gl');
    return () => {};
  }

  // sizing: never more than ~6.5M pixels, never above 2x
  // shortcut: pixel ratio is read once, so dragging the window to a sharper screen keeps the old one until reload
  let W = 0, H = 0;
  let scale = Math.min(view.devicePixelRatio || 1, 2, Math.sqrt(6.5e6 / (view.innerWidth * view.innerHeight)));
  function size() {
    W = canvas.clientWidth || view.innerWidth;
    H = canvas.clientHeight || view.innerHeight;
    canvas.width = Math.max(1, Math.round(W * scale));
    canvas.height = Math.max(1, Math.round(H * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  size();

  for (let i = 0; i < N; i++) {
    const d = Math.random() ** 2.4, bokeh = Math.random() < 0.035;
    P.set([Math.random() * W, Math.random() * H, bokeh ? 7 + Math.random() * 12 : 0.7 + d * 2.3 + Math.random() * 0.5, 0, Math.random()], i * 5);
    M.set([bokeh ? 1 : d, bokeh ? 0.05 + Math.random() * 0.07 : 0.4 + Math.random() * 0.6, 0.4 + Math.random() * 1.6, Math.random() * 6.283], i * 4);
    P[i * 5 + 3] = calm ? M[i * 4 + 1] : 0;
  }

  const resizer = new ResizeObserver(() => {
    const ow = W, oh = H;
    size();
    // keep the dust spread over the new size (a page that loaded hidden had no size to scale from)
    for (let i = 0; i < N; i++) {
      P[i * 5] = ow ? P[i * 5] * W / ow : Math.random() * W;
      P[i * 5 + 1] = oh ? P[i * 5 + 1] * H / oh : Math.random() * H;
    }
    if (calm) still();
  });
  resizer.observe(canvas);

  // ripples: slots 0-5 for clicks, hovers, selections and passing waves, 6-15 for the cursor's wake
  const RIP = new Float32Array(64);
  let big = 0, small = 0, t = 0;
  function ripple(x, y, amp, loud) {
    if (calm) return;
    RIP.set([x, y, t, amp], (loud ? big++ % 6 : 6 + small++ % 10) * 4);
  }

  const cur = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, s: 0, on: 0, trail: 0 };
  on(view, 'pointermove', e => {
    const x = e.clientX, y = e.clientY;
    if (!cur.on) { cur.x = cur.tx = x; cur.y = cur.ty = y; cur.on = 1; }
    cur.trail += Math.hypot(x - cur.tx, y - cur.ty);
    cur.tx = x;
    cur.ty = y;
    if (cur.trail > 120) { cur.trail = 0; ripple(x, y, 0.22, false); }
  }, { passive: true });
  on(view, 'pointerdown', e => ripple(e.clientX, e.clientY, 1, true), { passive: true });
  on(doc, 'pointerout', e => { if (!e.relatedTarget) cur.on = 0; });
  on(view, 'blur', () => { cur.on = 0; });

  const sel = { x: 0, y: 0, s: 0, on: 0 };
  function selRect() {
    const s = view.getSelection();
    const r = s && !s.isCollapsed && s.rangeCount ? s.getRangeAt(0).getBoundingClientRect() : null;
    return r && (r.width || r.height) ? r : null;
  }
  on(doc, 'selectionchange', () => {
    const r = selRect();
    if (!r) { sel.on = 0; return; }
    sel.x = r.left + r.width / 2;
    sel.y = r.top + r.height / 2;
    if (!sel.on) ripple(sel.x, sel.y, 0.8, true);
    sel.on = 1;
  });

  const WIN = new Float32Array(32);
  const TINT = new Float32Array(32);
  const lin = hex => [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255) ** 2.2);
  wins.forEach((a, i) => TINT.set(lin(view.getComputedStyle(a).getPropertyValue('--tint').trim() || '#8899ff'), i * 4));
  let hot = -1;
  wins.forEach((a, i) => {
    const enter = () => {
      if (hot === i) return;
      hot = i;
      const r = frames[i].getBoundingClientRect();
      ripple(r.left + r.width / 2, r.top + r.height / 2, 0.5, true);
      if (calm) still();
    };
    const leave = () => { if (hot === i) { hot = -1; if (calm) still(); } };
    on(a, 'pointerenter', enter);
    on(a, 'pointerleave', leave);
    on(a, 'focus', enter);
    on(a, 'blur', leave);
  });

  function readWindows(k) {
    for (let i = 0; i < frames.length; i++) {
      const r = frames[i].getBoundingClientRect();
      WIN.set([r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2], i * 4);
      TINT[i * 4 + 3] += ((i === hot ? 1 : 0) - TINT[i * 4 + 3]) * k;
    }
  }
  const knob = (v, d) => (Number.isFinite(+v) ? +v : d);

  function step(dt) {
    // reads first, then style writes, so layout never thrashes
    readWindows(1 - Math.exp(-dt * 5));
    if (sel.on) {
      const r = selRect();
      if (r) { sel.x = r.left + r.width / 2; sel.y = r.top + r.height / 2; } else sel.on = 0;
    }

    const k = 1 - Math.exp(-dt * 8);
    const px = cur.x, py = cur.y;
    cur.x += (cur.tx - cur.x) * k;
    cur.y += (cur.ty - cur.y) * k;
    cur.vx += ((cur.x - px) / dt - cur.vx) * 0.25;
    cur.vy += ((cur.y - py) / dt - cur.vy) * 0.25;
    const goal = cur.on * (0.5 + Math.min(Math.hypot(cur.vx, cur.vy) / 1400, 0.7));
    cur.s += (goal - cur.s) * (1 - Math.exp(-dt * 3));
    sel.s += (sel.on - sel.s) * (1 - Math.exp(-dt * 2.5));

    // dust rides a slow divergence-free current, gets swept by the cursor,
    // pushed by ripple fronts and pulled into orbit around selected text
    const relax = 1 - Math.exp(-dt * 1.2);
    const fade = Math.min(1, t / 3) * knob(tweak().dust, 1);
    for (let i = 0; i < N; i++) {
      const j = i * 5, m = i * 2, q = i * 4;
      let x = P[j], y = P[j + 1];
      const d = M[q], sp = 5 + d * 24;
      const a = x * 0.0021 + t * 0.06, b = y * 0.0026 - t * 0.045, c = (x - y) * 0.0013 + t * 0.03;
      const cc = 0.6 * 0.0013 * Math.cos(c);
      const fx = 0.6 + (-0.0026 * Math.sin(a) * Math.sin(b) - cc) * 380;
      const fy = 0.15 - (0.0021 * Math.cos(a) * Math.cos(b) + cc) * 380;
      let vx = V[m] + (fx * sp - V[m]) * relax, vy = V[m + 1] + (fy * sp - V[m + 1]) * relax;

      const dx = x - cur.x, dy = y - cur.y, r2 = dx * dx + dy * dy;
      if (cur.s > 0.01 && r2 < 52000) {
        const f = (1 - r2 / 52000) ** 2 * cur.s * (0.5 + d), r = Math.sqrt(r2) + 1;
        vx += ((cur.vx - vx) * 2.5 + (dx / r) * 260 - (dy / r) * 120) * f * dt;
        vy += ((cur.vy - vy) * 2.5 + (dy / r) * 260 + (dx / r) * 120) * f * dt;
      }
      if (sel.s > 0.01) {
        const ex = sel.x - x, ey = sel.y - y, e2 = ex * ex + ey * ey;
        if (e2 < 160000) {
          const g = (1 - e2 / 160000) * sel.s, e = Math.sqrt(e2) + 1;
          vx += (ex * 160 + ey * 220) / e * g * dt;
          vy += (ey * 160 - ex * 220) / e * g * dt;
        }
      }
      for (let s = 0; s < 6; s++) {
        const amp = RIP[s * 4 + 3], age = t - RIP[s * 4 + 2];
        if (!amp || age < 0 || age > 2.5) continue;
        const ex = x - RIP[s * 4], ey = y - RIP[s * 4 + 1], e = Math.sqrt(ex * ex + ey * ey) + 1, w = e - 230 * age;
        if (w > -60 && w < 60) {
          const g = (1 - Math.abs(w) / 60) * amp * Math.exp(-age * 0.9) * 900 * dt * (0.4 + d);
          vx += ex / e * g;
          vy += ey / e * g;
        }
      }

      x += vx * dt;
      y += vy * dt;
      if (x > W + 30) x -= W + 60; else if (x < -30) x += W + 60;
      if (y > H + 30) y -= H + 60; else if (y < -30) y += H + 60;
      P[j] = x;
      P[j + 1] = y;
      V[m] = vx;
      V[m + 1] = vy;
      const tw = Math.sin(t * M[q + 2] + M[q + 3]);
      P[j + 3] = M[q + 1] * (0.6 + 0.3 * tw + 1.8 * Math.max(0, tw) ** 30) * fade;
    }
  }

  function draw() {
    const f = calm ? 1 : Math.min(1, t / 2.4);
    const tw = tweak();
    gl.useProgram(fabric);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform2f(U.uDev, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uFade, f * f * (3 - 2 * f));
    gl.uniform4f(U.uCur, cur.x, cur.y, cur.s, 0);
    gl.uniform4f(U.uSel, sel.x, sel.y, sel.s, 0);
    gl.uniform4f(U.uTweak, knob(tw.waves, 1), knob(tw.foam, 1), 0, tw.lattice === false ? 0 : 1);
    gl.uniform4fv(U.uRip, RIP);
    gl.uniform4fv(U.uWin, WIN);
    gl.uniform4fv(U.uTint, TINT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(dust);
    gl.uniform2f(DU.uRes, W, H);
    gl.uniform2f(DU.uDev, canvas.width, canvas.height);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, P);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  // reduced motion: one still frame, redrawn only when something moves
  function still() {
    t = 40;
    readWindows(1);
    draw();
  }

  // once a second: if over a quarter of frames missed ~45fps, step resolution
  // down towards what would hold 60 (the first second is skipped as startup)
  // after three smooth seconds in a row, step back up (the live sites' loading can stall frames for a while)
  const top = scale;
  let slow = 0, count = 0, span = 0, settled = 0, calmRun = 0;
  function watch(ms) {
    count++;
    span += ms;
    if (ms > 22) slow++;
    if (span < 1000) return;
    if (settled++ > 0 && slow > count / 4 && scale > 0.6) {
      scale = Math.max(0.6, scale * Math.min(0.85, Math.sqrt(count * 1000 / span / 60)));
      size();
      calmRun = 0;
    } else if (slow <= count / 20 && ++calmRun >= 3 && scale < top) {
      scale = Math.min(top, scale * 1.25);
      size();
      calmRun = 0;
    }
    slow = count = span = 0;
  }

  let last = view.performance.now(), raf = 0, wave = 4;
  function tick(now) {
    raf = view.requestAnimationFrame(tick);
    const ms = now - last;
    last = now;
    watch(ms);
    if (doc.querySelector('.viewer:not([hidden])')) return;
    const dt = Math.min(Math.max(ms, 1), 50) / 1000;
    t += dt;
    // now and then a faint gravitational wave rolls in from somewhere, even when nobody touches anything
    if (t > wave) { ripple(Math.random() * W, Math.random() * H, 0.3, true); wave = t + 5 + Math.random() * 7; }
    step(dt);
    draw();
  }

  on(doc, 'visibilitychange', () => { slow = count = span = calmRun = 0; last = view.performance.now(); });
  on(canvas, 'webglcontextlost', e => { e.preventDefault(); view.cancelAnimationFrame(raf); });
  on(canvas, 'webglcontextrestored', () => {
    init();
    if (calm) still(); else { last = view.performance.now(); raf = view.requestAnimationFrame(tick); }
  });

  if (calm) {
    still();
    on(view, 'scroll', still, { passive: true });
    on(view, 'load', still);
  } else raf = view.requestAnimationFrame(tick);

  if (view.location.search === '?check') {
    console.assert(wins.length === 8 && frames.every(Boolean), 'eight windows, each with a frame');
    console.assert(TINT.every(Number.isFinite), 'tints parse');
    console.assert(Object.values(U).every(Boolean), 'fabric uniforms all live');
    console.assert(N >= 280 && N <= 1500, 'dust count in range');
    console.log(`thewebpage: ${wins.length} windows, ${N} motes, scale ${scale.toFixed(2)}`);
  }

  return () => {
    view.cancelAnimationFrame(raf);
    resizer.disconnect();
    offs.forEach(off => off());
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

if (document.querySelector('.space')) startSpace({ canvas: document.querySelector('.space') });

/*
  A window opens its site in place (#/host in the address, so Back returns
  home). The sites menu and the arrows move between them, like the old page.
*/
(() => {
  const v = document.querySelector('.viewer');
  if (!v) return;
  const wins = [...document.querySelectorAll('.win')];
  const sites = wins.map(a => {
    const host = a.getAttribute('href').replace(/^#\//, '');
    return { href: 'https://' + host, host, name: a.querySelector('.cap b').textContent };
  });
  const frame = v.querySelector('.vframe'), reel = v.querySelector('.vreel');
  const btn = v.querySelector('.vmenu-btn'), out = v.querySelector('.vout'), trail = v.querySelector('.vtrail');
  const title = document.title;

  sites.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vpick';
    b.dataset.i = i;
    b.innerHTML = '<span></span>';
    b.querySelector('span').textContent = s.name;
    reel.append(b);
  });

  const current = () => sites.findIndex(s => location.hash === '#/' + s.host);
  const go = i => { location.hash = '#/' + sites[(i + sites.length) % sites.length].host; };
  const menu = open => { reel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };

  function show() {
    const i = current();
    menu(false);
    if (i < 0) {
      v.hidden = true;
      frame.removeAttribute('src');
      document.title = title;
      return;
    }
    const s = sites[i];
    v.hidden = false;
    if (frame.getAttribute('src') !== s.href) frame.src = s.href;
    out.href = s.href;
    out.textContent = s.host + ' ↗';
    trail.textContent = '/' + String(i + 1).padStart(2, '0');
    document.title = s.name + ' — thewebpage.com.au';
    reel.querySelectorAll('.vpick').forEach((b, k) => b.classList.toggle('is-on', k === i));
  }

  wins.forEach((a, i) => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // let new-tab clicks through
    e.preventDefault();
    go(i);
  }));
  v.querySelector('.prev').addEventListener('click', () => go(current() - 1));
  v.querySelector('.next').addEventListener('click', () => go(current() + 1));
  btn.addEventListener('click', () => menu(reel.hidden));
  reel.addEventListener('click', e => { const b = e.target.closest('.vpick'); if (b) go(+b.dataset.i); });
  v.querySelector('.vhome').addEventListener('click', e => { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); show(); });
  addEventListener('hashchange', show);
  addEventListener('popstate', show);
  addEventListener('keydown', e => {
    if (v.hidden) return;
    if (e.key === 'ArrowLeft') go(current() - 1);
    else if (e.key === 'ArrowRight') go(current() + 1);
    else if (e.key === 'Escape') reel.hidden ? v.querySelector('.vhome').click() : menu(false);
  });
  show();

  // each window's live site is laid out at 1440px wide; scale it to the window
  const fit = new ResizeObserver(entries => entries.forEach(e => e.target.style.setProperty('--k', (e.contentRect.width / 1440).toFixed(4))));
  document.querySelectorAll('.screen').forEach(el => fit.observe(el));

  if (location.search === '?check') {
    console.assert(sites.length === 8 && sites.every(s => s.host && s.name), 'viewer knows all eight sites');
    console.assert(reel.children.length === sites.length, 'sites menu lists every site');
  }
})();
