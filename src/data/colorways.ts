// Single source of truth: route -> colorway -> tokens. Sections only read the CSS vars.
// Values lifted verbatim from renderVals() in Proto-R1-A.dc.html.

export interface Tokens {
  bg: string; fg: string; soft: string; line: string; panel: string; dim: string;
  pgBg: string; pgFg: string; // "in progress" pill
  mark: string; markS: string; // mark on ground / mark at small sizes + done dot
  accent: string; onAccent: string;
  tA: string; tD: string; tL: string; // process bar: alpha / delta / lens
}

const RED = { bg: '#9F0000', fg: '#E6E6E6', soft: '#E6E6E6', line: 'rgba(230,230,230,0.4)', panel: '#870000', dim: '#870000', pgBg: '#870000', pgFg: '#E6E6E6' };
const INK = { bg: '#1A1A1A', fg: '#E6E6E6', soft: '#B5B5B5', line: '#3A3A3A', panel: '#2E2E2E', dim: '#2E2E2E', pgBg: '#2E2E2E', pgFg: '#E6E6E6' };

export const colorways = {
  'red-mist':    { ...RED, mark: '#E6E6E6', markS: '#E6E6E6', accent: '#E6E6E6', onAccent: '#9F0000', tA: '#E6E6E6', tD: '#E6E6E6', tL: '#E6E6E6' },
  'red-black':   { ...RED, fg: '#000000', soft: '#000000', line: 'rgba(0,0,0,0.4)', pgFg: '#000000', mark: '#000000', markS: '#000000', accent: '#000000', onAccent: '#9F0000', tA: '#000000', tD: '#000000', tL: '#000000' },
  'paper-black': { bg: '#F2F2F2', fg: '#000000', soft: '#3D3D3D', line: '#CFCFCF', panel: '#FFFFFF', dim: '#CFCFCF', pgBg: '#FCAE17', pgFg: '#000000', mark: '#000000', markS: '#000000', accent: '#000000', onAccent: '#F2F2F2', tA: '#00C575', tD: '#FCAE17', tL: '#9F0000' },
  'ink-mist':    { ...INK, mark: '#E6E6E6', markS: '#E6E6E6', accent: '#E6E6E6', onAccent: '#1A1A1A', tA: '#E6E6E6', tD: '#E6E6E6', tL: '#E6E6E6' },
  'ink-green':   { ...INK, mark: '#00C575', markS: '#00C575', accent: '#00C575', onAccent: '#1A1A1A', tA: '#00C575', tD: '#00C575', tL: '#00C575' },
  'ink-amber':   { ...INK, mark: '#FCAE17', markS: '#FCAE17', accent: '#FCAE17', onAccent: '#1A1A1A', tA: '#FCAE17', tD: '#FCAE17', tL: '#FCAE17' },
} satisfies Record<string, Tokens>;

export type ColorwayKey = keyof typeof colorways;

// route (no leading/trailing slash; '' = "/") -> colorway
export const routes: Record<string, ColorwayKey> = {
  '': 'paper-black', // home = /white
  'red/white': 'red-mist',
  'red/black': 'red-black',
  'white': 'paper-black',
  'black': 'ink-mist',
  'green': 'ink-green',
  'yellow': 'ink-amber',
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** `--bg:#..;--fg:#..;...` for <html style>. */
export const cssVars = (key: ColorwayKey) =>
  Object.entries(colorways[key]).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
