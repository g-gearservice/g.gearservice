// The only client JS: slowed smooth scroll, one-shot scroll reveal + a relay fallback where scroll-driven animation is unsupported.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Slower, eased wheel scroll. lerp/wheelMultiplier are the speed knobs (Lenis defaults: 0.1 / 1).
// Anchor offset = sticky header height (matches scroll-padding-top in global.css).
if (!reduce) new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.7, anchors: { offset: -72 } });

// Keep the footer's --bleed (Footer.astro) below the visible end so phone Safari draws it under its bar.
const bleed = () => parseFloat(getComputedStyle(root).getPropertyValue('--bleed')) || 0;
const pinEnd = () => {
  const max = root.scrollHeight - innerHeight - bleed();
  if (bleed() && scrollY > max) scrollTo(0, max);
};
for (const e of ['scroll', 'resize']) addEventListener(e, pinEnd, { passive: true });

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

// Relay fallback (Firefox): same lighting as the CSS scroll timeline, played on enter, reversed on leave.
const stage = document.querySelector<HTMLElement>('[data-stage]');
if (stage && !reduce && !CSS.supports('animation-timeline: view()')) {
  stage.classList.add('relay');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const anims = (['L', 'C', 'R'] as const).flatMap((p, k) => {
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
