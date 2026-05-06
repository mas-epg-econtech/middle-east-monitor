// Shared design system — keeps every scene visually consistent and matches
// the showcase deck (build_deck.js) where possible.

export const COL = {
  // Backgrounds
  bgDeep:    '#0F1A2E',  // page background, very dark navy
  bgPanel:   '#1A2A4A',  // card / panel surface, a touch lighter
  bgPanelHi: '#243A66',  // hover / accent panel

  // Brand accents
  navy:      '#1E2761',
  navyDeep:  '#0F2C4F',
  teal:      '#1B7A8A',
  tealLight: '#3CA8B8',
  amber:     '#E8A838',
  gold:      '#F1C453',
  coral:     '#E8655A',

  // Status badges (canonical from the dashboard)
  calm:      '#10B981',
  watchful:  '#F59E0B',
  strained:  '#F97316',
  critical:  '#EF4444',

  // Text
  textHigh:    '#F4F6FA',
  textMid:     '#B8C3D6',
  textMuted:   '#7E8AA1',
  textOnDark:  '#FFFFFF',

  // Lines / dividers
  border:    '#2D3F5F',
};

export const FONT = {
  head: 'Georgia, "Times New Roman", serif',
  body: 'Calibri, "Helvetica Neue", sans-serif',
  mono: '"Roboto Mono", "SF Mono", monospace',
};

// Standard composition geometry
export const CANVAS = {
  width:  1920,
  height: 1080,
  fps:    30,
};

// Shared scene timing — exported so Root.tsx and the main composition
// can both reference the same durations without drift.
export const DURATIONS = {
  title:        180,   // 6s
  geography:    360,   // 12s (incl. 4s static-hold pause at end)
  challenge:    540,   // 18s  (incl. pause after questions appear)
  transmission: 420,   // 14s
  narratives:   660,   // 22s
  audit:        360,   // 12s
  pipeline:     840,   // 28s
  closing:      330,   // 11s  (URL typing animation + ~5s static hold)
} as const;

export const TOTAL_FRAMES =
  DURATIONS.title +
  DURATIONS.geography +
  DURATIONS.challenge +
  DURATIONS.transmission +
  DURATIONS.narratives +
  DURATIONS.audit +
  DURATIONS.pipeline +
  DURATIONS.closing;
