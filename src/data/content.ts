// All copy from Proto-R1-A.dc.html, kept out of markup.
import type { MarkPart } from './marks';

export const nav = [
  { href: '#anatomy', label: 'anatomy' },
  { href: '#work', label: 'work' },
  { href: '#log', label: 'log' },
];

export const statement = {
  title: ['two arcs,', 'one lens.'],
  body: 'One unbroken flow from planning to operations. Two teams and one lead interlock like a single mark, facing the same direction.',
};

export const anatomy = {
  eyebrow: 'anatomy',
  title: 'the mark is the team.',
  body: 'The top arc is alpha, the bottom arc is delta, and the lens where the two arcs interlock is pistolinkr.',
  labels: [
    { part: 'T' as MarkPart, kicker: 'top arc', name: 'alpha team' },
    { part: 'C' as MarkPart, kicker: 'the lens', name: 'pistolinkr' },
    { part: 'B' as MarkPart, kicker: 'bottom arc', name: 'delta team' },
  ],
};

export const team = {
  eyebrow: 'team',
  title: 'one lead, two teams.',
  alpha: {
    kicker: 'top arc · operations',
    name: 'alpha',
    body: 'Handles design, planning, and feedback (bug finding and issues), and keeps day-to-day operations running. It is where work starts and where it comes back to at the end.',
    items: [
      { term: 'design', note: 'making the experience clear' },
      { term: 'planning', note: 'giving work a shape and an order' },
      { term: 'feedback', note: 'finding bugs and surfacing issues' },
    ],
  },
  lens: {
    kicker: 'the lens · lead',
    name: 'pistolinkr',
    body: 'Lead · PM · cross-functional. Where the two arcs cross, sets the direction and keeps every workstream moving. Leads the delta team directly.',
    items: ['owns direction', 'moves every workstream', 'direct command → delta'],
  },
  delta: {
    kicker: 'bottom arc · product',
    name: 'delta',
    body: 'Handles service, frontend, backend, and security. Makes what was designed actually run, and reports directly to pistolinkr.',
    items: [
      { term: 'service', note: 'connecting the product to its purpose' },
      { term: 'frontend · backend', note: 'building the screen and what is behind it' },
      { term: 'secure', note: 'taking another look through a security lens' },
    ],
  },
};

export const process = {
  eyebrow: 'process',
  title: ['top, cross,', 'bottom, back.'],
  body: 'A piece of work starts in the top arc, crosses the lens into the bottom arc, then comes back up and wraps up in the lens.',
  // part: which part of the mark is lit; handoff: show the arc glyph on the bar
  steps: [
    { n: '01', title: 'intake & planning', desc: 'Define the work and plan what comes next.', who: 'alpha', part: 'T', handoff: false },
    { n: '02', title: 'design', desc: 'Make the shape of the experience clear before building.', who: 'alpha', part: 'T', handoff: false },
    { n: '03', title: 'build', desc: 'Frontend · backend. Connect screens to implementation.', who: 'delta', part: 'B', handoff: true },
    { n: '04', title: 'secure review', desc: 'Review from a security point of view.', who: 'delta', part: 'B', handoff: false },
    { n: '05', title: 'qa & bug finding', desc: 'Find issues and hand them back to the team.', who: 'alpha', part: 'T', handoff: true },
    { n: '06', title: 'ship & retro', desc: 'Close the cycle and look back.', who: 'pistolinkr', part: 'C', handoff: true },
  ] as { n: string; title: string; desc: string; who: string; part: MarkPart; handoff: boolean }[],
};

// status: done / exp = quiet dot + text, prog = tonal pill, plan = outline pill
export type StatusKind = 'done' | 'exp' | 'prog' | 'plan';
export interface Status { kind: StatusKind; label: string }

export const work = {
  eyebrow: 'work',
  title: 'things we make.',
  items: [
    { name: 'regiontype.com', href: 'https://regiontype.com', embed: true, desc: 'A web game that teaches Seoul place names through typing.', statuses: [{ kind: 'done', label: 'live' }, { kind: 'plan', label: 'marketing prep' }] },
    { name: 'regiontype for mac', href: '', desc: 'A macOS app.', statuses: [{ kind: 'prog', label: 'in progress' }] },
    { name: 'minimetrotype', href: '', desc: 'A typing game experiment.', statuses: [{ kind: 'exp', label: 'experiment' }] },
    { name: 'reportal', href: '', desc: 'A Chrome extension that restyles the school portal.', statuses: [{ kind: 'exp', label: 'experiment' }] },
  ] as { name: string; href: string; embed?: boolean; desc: string; statuses: Status[] }[],
};

export const log = {
  eyebrow: 'log · lately',
  title: 'lately.',
  body: 'Recent news picked from the work log. The lit part of the mark is the team that did the work.',
  // part 'N' = nothing lit (planned)
  entries: [
    { date: '10.06.26', title: 'auth token rotation — rollout', team: 'delta · secure', part: 'B' },
    { date: '10.03.26', title: 'landing page rebuild', team: 'delta · frontend', part: 'B' },
    { date: '10.01.26', title: 'cycle 09 retro & scope lock', team: 'pistolinkr', part: 'C' },
    { date: '09.26.26', title: 'design system — color tokens', team: 'alpha · design', part: 'T' },
    { date: '09.19.26', title: 'bug sweep #412—#437', team: 'alpha · feedback', part: 'T' },
    { date: '[date]', title: 'next: start regiontype marketing', team: '[team]', part: 'N' },
  ] as { date: string; title: string; team: string; part: MarkPart | 'N' }[],
};

export const contact = {
  eyebrow: 'contact',
  title: 'let’s cross paths.',
  body: 'Collaboration, interviews, hiring, feedback. An idea, a question, or a problem worth solving: bring it.',
  primary: {
    label: 'g@gearservicevanguard.com',
    href: 'mailto:g@gearservicevanguard.com',
  },
  secondary: [
    { label: '[instagram]', href: null },
    { label: '[github]', href: 'https://github.com/g-gearservice' },
  ] as { label: string; href: string | null }[],
};

export const footer = {
  nav: [
    { href: '#anatomy', label: 'anatomy' },
    { href: '#process', label: 'process' },
    { href: '#log', label: 'log' },
    { href: null, label: '[instagram]' }, // placeholder until real links exist
    { href: null, label: '[github]' },
    { href: '#top', label: 'back to top ↑' },
  ] as { href: string | null; label: string }[],
};
