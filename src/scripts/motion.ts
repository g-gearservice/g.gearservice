// The only client JS: slowed smooth scroll, header hide, one-shot scroll reveal and the hero's scene switch.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Slower, eased wheel scroll. lerp/wheelMultiplier are the speed knobs (Lenis defaults: 0.1 / 1).
// Touch stays native: JS-driven touch (syncTouch) dropped frames on phones.
// Anchor offset = sticky header height (matches scroll-padding-top in global.css).
const coarse = matchMedia('(pointer: coarse)').matches;
const lenis = !reduce && !coarse ? new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.7, anchors: { offset: -72 } }) : null;

// 'scrolllock' (Work.astro, while the pointer is over the playing embed): the page holds still. stop() also kills Lenis' glide;
// html.scroll-locked (global.css) stops native scroll, which the embed would otherwise chain into.
addEventListener('scrolllock', (e) => {
  const on = (e as CustomEvent<boolean>).detail;
  if (on) lenis?.stop(); else lenis?.start();
  root.classList.toggle('scroll-locked', on);
});

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
      const t = (watched.get(e.target) ?? e.target) as HTMLElement;
      t.style.setProperty('--i', String(Math.min(i++, 5))); // 60ms steps, capped
      t.classList.add('is-in');
      io.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
);
// clip-path reveals (part / rise) start clipped to nothing, and a zero-area target never intersects: watch the parent for them
const watched = new Map<Element, Element>();
document.querySelectorAll('[data-reveal], [data-reveal-item]').forEach((el) => {
  const box = el.matches('[data-reveal=part], [data-reveal=rise]') ? el.parentElement! : el;
  watched.set(box, el);
  io.observe(box);
});
root.classList.add('motion-ready');


// Hero: the first `intro` px of the pin scrub the lockup 1:1 - the wordmark pulls the symbol up to the vertical centre (d1),
// rises on alone off the screen (d2), then the symbol zooms (d3). Past the intro, scroll only picks the scene
// (1-6, one per --step, scene 1 right as the zoom ends); motion.css transitions between them.
const hero = document.querySelector<HTMLElement>('[data-hero-stage]');
if (hero) {
  const sec = hero.parentElement!;
  const logo = hero.querySelector<HTMLElement>('[data-hero-logo]')!;
  const word = hero.querySelector<SVGGElement>('[data-wordmark]')!;
  let d1 = 1, d2 = 1, d3 = 1, units = 1; // px of scroll per phase; SVG units per px of the unzoomed logo
  const clamp = (x: number) => Math.min(Math.max(x, 0), 1);
  const measure = () => {
    word.style.transform = '';
    logo.style.setProperty('--z', '0');
    logo.style.setProperty('--a', '0');
    const top0 = logo.getBoundingClientRect().top;
    logo.style.setProperty('--a', '1');
    d1 = Math.max(top0 - logo.getBoundingClientRect().top, 1);
    d2 = Math.max(word.getBoundingClientRect().bottom, 1); // centred: wordmark bottom → screen top
    d3 = innerHeight * 0.3; // ponytail: zoom scroll length picked by eye, tune here
    units = 875 / logo.offsetWidth;
    sec.style.setProperty('--intro', `${d1 + d2 + d3}px`);
  };
  const scene = () => {
    const s = -sec.getBoundingClientRect().top;
    const w = clamp((s - d1) / d2);
    logo.style.setProperty('--a', clamp(s / d1).toFixed(4));
    logo.style.setProperty('--z', clamp((s - d1 - d2) / d3).toFixed(4));
    word.style.transform = `translateY(${(-w * d2 * units).toFixed(2)}px)`; // SVG user units
    word.style.opacity = String(1 - w);
    // the scroll that finishes the zoom starts scene 1 (the arcs part); then one --step per scene
    const step = (sec.offsetHeight - innerHeight - d1 - d2 - d3) / 6;
    const past = s - d1 - d2 - d3;
    const n = String(past <= 0 ? 0 : Math.min(1 + Math.floor(past / step), 6));
    if (hero.dataset.scene !== n) hero.dataset.scene = n; // a same-value write still invalidates style, every scroll frame
  };
  // focus zoom: symbol = 447 of the logo's 875 units tall; landscape fills the height, portrait the width
  const zoom = () => {
    const z = innerWidth > innerHeight ? innerHeight / (logo.offsetWidth * 447 / 875) : innerWidth / logo.offsetWidth;
    hero.style.setProperty('--zoom', String(Math.max(z, 1)));
  };
  addEventListener('scroll', scene, { passive: true });
  addEventListener('resize', () => { zoom(); measure(); scene(); });
  zoom();
  measure();
  scene();
}

// Process: pinned like the hero. Scroll picks the scene (-1 before the pin, then 0-7, one per --step); motion.css transitions between them.
// -1 heading hidden in a blur · 0 heading alone, centred, focuses in · 1-6 block lifts so the steps are centred, heading blurs out; step n comes in, earlier steps dim · 7 all steps lit, the row pops forward.
const proc = document.querySelector<HTMLElement>('[data-process-stage]');
if (proc) {
  const sec = proc.parentElement!;
  const head = proc.querySelector<HTMLElement>('[data-process-head]')!;
  const list = proc.querySelector<HTMLElement>('[data-process-steps]')!;
  const items = [...list.children] as HTMLElement[];
  // scene 0 centres the heading: drop it by half the space the steps take below it (offsets ignore transforms)
  // scenes 1+ lift the whole block until the steps sit at the screen's vertical centre (--lift)
  const measure = () => {
    proc.style.setProperty('--drop', `${(list.offsetTop + list.offsetHeight - head.offsetTop - head.offsetHeight) / 2}px`);
    proc.style.setProperty('--lift', `${Math.max(list.offsetTop + list.offsetHeight / 2 - proc.offsetHeight / 2, 0)}px`);
  };
  const scene = () => {
    const step = (sec.offsetHeight - innerHeight) / 8;
    const top = sec.getBoundingClientRect().top;
    // -1 until half a screen before the pin: the heading starts focusing in while the stage is still arriving (0.5 = the knob)
    const n = top > innerHeight * 0.5 ? -1 : Math.min(Math.max(Math.floor(-top / step), 0), 7);
    if (proc.dataset.scene === String(n)) return;
    proc.dataset.scene = String(n);
    items.forEach((li, i) => { li.dataset.state = n === 7 || i + 1 === n ? 'now' : i + 1 < n ? 'past' : 'next'; });
  };
  addEventListener('scroll', scene, { passive: true });
  addEventListener('resize', () => { measure(); scene(); });
  measure();
  scene();
}
