// The only client JS: slowed smooth scroll, one-shot scroll reveal + a relay fallback where scroll-driven animation is unsupported.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Keep the footer's --bleed (Footer.astro) below the visible end so phone Safari draws it under its bar.
const bleed = () => parseFloat(getComputedStyle(root).getPropertyValue('--bleed')) || 0;
const max = () => root.scrollHeight - innerHeight - bleed();

// Slower, eased scroll for wheel AND touch. lerp/*Multiplier are the speed knobs (Lenis defaults: 0.1 / 1).
// Anchor offset = sticky header height (matches scroll-padding-top in global.css).
const lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.7, syncTouch: true, touchMultiplier: 0.7, anchors: { offset: -72 } });
if (lenis) {
  // Lenis clamps every target (drag + its own inertia) to limit: a hard stop at the bleed, never a bounce past it.
  Object.defineProperty(lenis, 'limit', { get: () => Math.max(0, max()) });
} else {
  // Native scroll: block drags past the end, kill momentum that coasts into the bleed (overflow toggle stops iOS momentum).
  let y0 = 0;
  addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    if (bleed() && y < y0 && scrollY >= max() - 1) e.preventDefault();
    y0 = y;
  }, { passive: false });
  addEventListener('scroll', () => {
    if (!bleed() || scrollY <= max()) return;
    root.style.overflow = 'hidden';
    scrollTo(0, max());
    requestAnimationFrame(() => { root.style.overflow = ''; });
  }, { passive: true });
}

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

// Phone Safari paints the document above the viewport under the status bar, but no backdrop-filter there (it only
// tints the bar with --bg). So, as regiontype.com does, the header's progressive blur is drawn from blurred twins of
// the page instead: a band (.ceil in global.css) from the top of the screen down past the header, re-placed every
// frame. Each layer = ground + twin blurred at one strength, masked shorter the stronger it is.
if (matchMedia('(pointer: coarse) and (display-mode: browser)').matches) {
  const page = document.querySelector<HTMLElement>('.page')!;
  const header = page.querySelector('header')!;
  const above = 120; // covers the status bar
  const band = document.createElement('div');
  band.className = 'ceil';
  band.setAttribute('aria-hidden', 'true');
  band.inert = true;
  const all = page.querySelectorAll('*');
  const twins = new Map<Element, Element[]>();
  const pages = [4, 12, 32].map((b) => {
    const layer = band.appendChild(document.createElement('div'));
    layer.style.setProperty('--b', `${b}px`);
    const twin = layer.appendChild(page.cloneNode(true) as HTMLElement);
    twin.removeAttribute('id');
    twin.querySelectorAll('*').forEach((el, i) => {
      el.removeAttribute('id');
      twins.set(all[i], [...(twins.get(all[i]) ?? []), el]);
    });
    return twin;
  });
  // keep reveal classes / inline vars in step with the real page
  new MutationObserver((ms) => ms.forEach(({ target, attributeName: n }) => {
    const v = (target as Element).getAttribute(n!);
    twins.get(target as Element)?.forEach((t) => (v === null ? t.removeAttribute(n!) : t.setAttribute(n!, v)));
  })).observe(page, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  document.body.append(band);
  const place = () => {
    const y = scrollY - above;
    band.style.top = `${y}px`;
    for (const t of pages) t.style.top = `${-y}px`;
  };
  const size = () => {
    band.style.setProperty('--s', `${above}px`);
    band.style.setProperty('--h', `${header.offsetHeight + 32}px`);
    place();
  };
  size();
  addEventListener('resize', size, { passive: true });
  // Lenis moves the page inside its rAF: follow in the same frame, or the band lags a frame behind the content
  if (lenis) lenis.on('scroll', place);
  else addEventListener('scroll', place, { passive: true });
}
