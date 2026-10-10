// The Grok bot's eyes under the footer's bottom arc - the same rig as regiontype's buddy.js, minus the body: the arc is the
// bot's head and the eyes are drawn in the hollow below its crown, in the arc's colour.
// The bot peeks up from the page bottom, so its resting look is up (pitch +30°) instead of the engine's up-right.
// engine.js: bloub (MIT, Jérémy Perret), the same bundle regiontype ships.
import { BotEngine, EXPRESSION_BY_ID } from './engine.js';

const NS = 'http://www.w3.org/2000/svg';
const SCALE = 120; // engine units → SVG units: eyes ~42 tall at rest
const REST = { yaw: 0, pitch: 30, mix: 1, spin: 0, wander: 1 };
const PITCH = [5, 45]; // cursor following: never looks down past level, never up into the crown
const IDLE_MS = 12000; // no pointer or scroll this long → dozes off

const mix = (a, b, t) => a + (b - a) * t;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// Doze in three nods (buddy.js): lids come down while the gaze sinks toward level
const somnolent = EXPRESSION_BY_ID.get('somnolent');
const lids = (open) => somnolent.eyes.map((e) => ({ ...e, open }));
const NODS = [
  [0, { ...somnolent, gaze: { yaw: 0, pitch: 20, roll: 0 }, eyes: lids(0.62) }],
  [1400, { ...somnolent, gaze: { yaw: 0, pitch: 14, roll: 0 }, eyes: lids(0.42) }],
  [2800, { ...somnolent, gaze: { yaw: 0, pitch: 8, roll: 0 }, eyes: lids(0.3) }],
];
const DOZE_LOOK = { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 0.4 }; // hands the gaze to the nod expression

const blend = (a, b, t) => ({
  id: b.id,
  gaze: { yaw: mix(a.gaze.yaw, b.gaze.yaw, t), pitch: mix(a.gaze.pitch, b.gaze.pitch, t), roll: mix(a.gaze.roll, b.gaze.roll, t) },
  split: mix(a.split, b.split, t),
  eyes: a.eyes.map((e, i) => {
    const f = b.eyes[i];
    return { w: mix(e.w, f.w, t), h: mix(e.h, f.h, t), tilt: mix(e.tilt ?? 0, f.tilt ?? 0, t), open: mix(e.open ?? 1, f.open ?? 1, t) };
  }),
});
const lerpLook = (a, b, t) => ({ yaw: mix(a.yaw, b.yaw, t), pitch: mix(a.pitch, b.pitch, t), mix: mix(a.mix, b.mix, t), spin: mix(a.spin, b.spin, t), wander: mix(a.wander, b.wander, t) });

// Shut eyes ‿: the capsule hole melts point by point into the arc (buddy.js), in engine units scaled to SCALE
const K = SCALE / 100, ARC_W = 13 * K, ARC_SAG = 12 * K, ARC_T = 6 * K, EDGE = 16;
function melt(eye, p) {
  const [mx, my, r] = eye.d.match(/-?[\d.]+/g).map(Number);
  const hw = -mx, hh = r - my;
  const [a, b, c, d, e, f] = eye.matrix.match(/-?[\d.]+/g).map(Number);
  const pts = [];
  for (const side of [-1, 1]) {
    for (let j = 0; j <= EDGE; j++) {
      const u = -Math.cos(((side < 0 ? j : EDGE - j) / EDGE) * Math.PI);
      const lx = u * hw, over = Math.max(0, Math.abs(lx) - (hw - r));
      const ly = side * (hh - r + Math.sqrt(Math.max(0, r * r - over * over)));
      const ex = a * lx + c * ly + e, ey = b * lx + d * ly + f;
      const bow = Math.sqrt(1 - u * u);
      const ax = e + u * ARC_W, ay = f + ARC_SAG * (bow * bow - 0.5) + side * ARC_T * bow;
      pts.push((ex + (ax - ex) * p).toFixed(2) + ' ' + (ey + (ay - ey) * p).toFixed(2));
    }
  }
  return 'M' + pts.join('L') + 'Z';
}

// host: a <g> filled in the arc's colour, translated to the eyes' pivot. calm: reduced motion - one still frame, no tracking.
export function mountEyes(host, { calm = false } = {}) {
  const engine = new BotEngine(SCALE, 'idle');
  const nodes = [];
  let raf = 0, t0 = 0, dozing = false, awake = null, nods = [], glide = null;
  let shutFrom = 0, shutTo = 0, shutAt = 0, shutFor = 1;

  const clock = () => {
    if (!t0) t0 = performance.now();
    return (performance.now() - t0) / 1000;
  };
  const shutAtTime = (now) => shutFrom + (shutTo - shutFrom) * ease(clamp((now - shutAt) / shutFor, 0, 1));
  const shut = (to, now, secs) => { shutFrom = shutAtTime(now); shutTo = to; shutAt = now; shutFor = secs; };
  const glideTo = (to, now, secs, look) => {
    glide = { ex: [engine.exprAtTime(now), to], lk: look ? [engine.lookAtTime(now), look] : null, at: now, secs };
  };
  const glideAt = (now) => {
    if (!glide) return;
    const k = clamp((now - glide.at) / glide.secs, 0, 1), e = ease(k);
    engine.expr = blend(glide.ex[0], glide.ex[1], e);
    engine.exprPrev = null;
    if (glide.lk) engine.setLook(lerpLook(glide.lk[0], glide.lk[1], e), now, 1e-6);
    if (k >= 1) { engine.expr = glide.ex[1]; glide = null; }
  };

  function draw(now) {
    glideAt(now);
    const f = engine.sample(now);
    const p = shutAtTime(now);
    f.eyes.forEach((eye, i) => {
      let n = nodes[i];
      if (!n) { n = nodes[i] = document.createElementNS(NS, 'path'); host.append(n); }
      if (p > 0.001) { n.setAttribute('d', melt(eye, p)); n.removeAttribute('transform'); }
      else { n.setAttribute('d', eye.d); n.setAttribute('transform', eye.matrix); }
      n.setAttribute('opacity', eye.alpha);
    });
    for (let i = f.eyes.length; i < nodes.length; i++) nodes[i].setAttribute('d', ''); // an eye turned past the edge
  }
  const tick = (ms) => { draw(clock()); raf = requestAnimationFrame(tick); };
  const at = (change) => { const now = clock(); change(now); if (!raf) draw(now + 1); };

  engine.setLook(REST, 0, 1e-6);

  // dozes after IDLE_MS of nothing; any poke wakes it and restarts the count
  let idle = 0;
  const doze = (on) => {
    if (on === dozing) return;
    dozing = on;
    nods.forEach(clearTimeout);
    if (on) {
      // no expression picked = the engine's built-in face; name it, or the nods glide from null (buddy.js does the same)
      awake = engine.expr ??= EXPRESSION_BY_ID.get('neutre');
      const last = NODS[NODS.length - 1][1];
      nods = NODS.map(([ms, e]) => setTimeout(() => at((now) => {
        glideTo(e, now, 0.9, e === NODS[0][1] ? DOZE_LOOK : null);
        if (e === last) shut(1, now, 0.9);
      }), ms));
    } else {
      at((now) => { glideTo(awake, now, 0.5, REST); shut(0, now, 0.4); });
    }
  };
  const poke = () => {
    doze(false);
    clearTimeout(idle);
    idle = setTimeout(() => doze(true), IDLE_MS);
  };

  return {
    start() {
      if (raf) return;
      if (calm) { draw(clock() + 1); return; }
      poke();
      raf = requestAnimationFrame(tick);
    },
    stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(idle); },
    poke: calm ? () => {} : poke,
    // dx, dy: screen px from the eyes' pivot to the pointer (right +, down +). Direction is kept, strength saturates
    // at `reach` px; the up-look stays the base so a pointer above the footer just leans it further up.
    lookToward(dx, dy, reach) {
      if (calm || dozing) return;
      const len = Math.hypot(dx, dy);
      if (!len) return;
      const k = Math.min(1, len / reach), nx = (dx / len) * k, ny = (dy / len) * k;
      engine.setLook({ yaw: 40 * nx, pitch: clamp(26 - 20 * ny, PITCH[0], PITCH[1]), mix: 1, wander: 0.25, spin: 0 }, clock());
    },
    lookAway() {
      if (calm || dozing) return;
      engine.setLook(REST, clock());
    },
  };
}
