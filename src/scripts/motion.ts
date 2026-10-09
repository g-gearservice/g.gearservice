// The only client JS: slowed smooth scroll, one-shot scroll reveal + a relay fallback where scroll-driven animation is unsupported.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Slower, eased wheel scroll. lerp/wheelMultiplier are the speed knobs (Lenis defaults: 0.1 / 1).
// Touch stays native: JS-driven touch (syncTouch) dropped frames on phones.
// Anchor offset = sticky header height (matches scroll-padding-top in global.css).
const coarse = matchMedia('(pointer: coarse)').matches;
if (!reduce && !coarse) new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.7, anchors: { offset: -72 } });

// Header slides away while scrolling down, back on any scroll up (html.nav-up → Header.astro); the blur stays. Always shown near the top.
// Slide time follows scroll speed: a flick snaps it (150ms), a slow drag eases it (600ms). --nav-dur, set at each flip.
let lastY = scrollY;
let py = lastY;
let pt = performance.now();
let v = 0; // px/ms, smoothed over every scroll event (~1 per frame)
addEventListener('scroll', () => {
  const y = scrollY;
  const t = performance.now();
  const dy = Math.abs(y - py);
  // first event after a pause: the gap is idle time, not motion, so count it as one frame
  v = t - pt > 100 ? dy / 16 : v * 0.5 + (dy / Math.max(t - pt, 1)) * 0.5;
  py = y;
  pt = t;
  if (Math.abs(y - lastY) < 6) return; // ignore jitter
  const up = y > lastY && y > 72;
  if (up !== root.classList.contains('nav-up')) {
    const k = Math.min(Math.max((v - 0.3) / (3 - 0.3), 0), 1); // 0.3 px/ms = slow … 3 px/ms = flick
    root.style.setProperty('--nav-dur', `${Math.round(600 - k * 450)}ms`);
    root.classList.toggle('nav-up', up);
  }
  lastY = y;
}, { passive: true });

const io = new IntersectionObserver(
  (entries) => {
    let i = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const t = e.target as HTMLElement;
      t.style.setProperty('--i', String(Math.min(i++, 5))); // 60ms steps, capped
      t.classList.add('is-in');
      io.unobserve(t);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
);
document.querySelectorAll('[data-reveal], [data-reveal-item]').forEach((el) => io.observe(el));
root.classList.add('motion-ready');

// Hero fallback: same --a / --p as the CSS view timeline (motion.css), from scroll position.
const hero = document.querySelector<HTMLElement>('[data-hero-stage]');
if (hero && !reduce && !CSS.supports('animation-timeline: view()')) {
  const sec = hero.parentElement!;
  const split = () => {
    const q = (-sec.getBoundingClientRect().top - 72) / ((sec.offsetHeight - innerHeight) * 0.85); // scene runs over the first 85% of the pin
    const clamp = (n: number) => String(Math.min(Math.max(n, 0), 1));
    hero.style.setProperty('--a', clamp(q / 0.41));
    hero.style.setProperty('--p', clamp((q - 0.41) / 0.59));
  };
  addEventListener('scroll', split, { passive: true });
  split();
}

// Relay fallback (Firefox): same lighting as the CSS scroll timeline, played on enter, reversed on leave.
const stage = document.querySelector<HTMLElement>('[data-stage]');
if (stage && !reduce && !CSS.supports('animation-timeline: view()')) {
  stage.classList.add('relay');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const anims = (['T', 'C', 'B'] as const).flatMap((p, k) => {
    const opts = { duration: 500, delay: k * 80, easing: ease, fill: 'both' as const };
    const part = stage.querySelector(`[data-mark-part=${p}]`);
    const dimmed = stage.querySelectorAll(`[data-leader=${p}], [data-label=${p}]`);
    return [
      part?.animate([{ opacity: 0 }, { opacity: 1 }], opts),
      ...[...dimmed].map((el) => el.animate([{ opacity: 0.5 }, { opacity: 1 }], opts)),
    ].filter((a): a is Animation => !!a);
  });
  anims.forEach((a) => { a.pause(); a.currentTime = 0; });
  new IntersectionObserver(
    ([e]) => anims.forEach((a) => { a.playbackRate = e.isIntersecting ? 1 : -1; a.play(); }), // flipping rate retargets from the current value
    { threshold: 0.35 },
  ).observe(stage);
}

