// The only client JS: slowed smooth scroll, header hide, one-shot scroll reveal and the hero's scene switch.
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

// Hero scenes: scroll only picks the scene (0-6, one per --step of the pin); motion.css transitions between them.
const hero = document.querySelector<HTMLElement>('[data-hero-stage]');
if (hero) {
  const sec = hero.parentElement!;
  const logo = hero.querySelector<HTMLElement>('[data-hero-logo]')!;
  const scene = () => {
    const q = -sec.getBoundingClientRect().top / (sec.offsetHeight - innerHeight); // 0 → 1 over the pin
    hero.dataset.scene = String(Math.min(Math.max(Math.round(q * 6), 0), 6));
  };
  // focus zoom: symbol = 447 of the logo's 875 units tall; landscape fills the height, portrait the width
  const zoom = () => {
    const z = innerWidth > innerHeight ? innerHeight / (logo.offsetWidth * 447 / 875) : innerWidth / logo.offsetWidth;
    hero.style.setProperty('--zoom', String(Math.max(z, 1)));
  };
  addEventListener('scroll', scene, { passive: true });
  addEventListener('resize', () => { zoom(); scene(); });
  zoom();
  scene();
}
