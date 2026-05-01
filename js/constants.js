/* ─── Constantes partagées ───────────────────────────────────────
   Chargé en premier. Utilisé par app.js, phase.js, pages.js, journal.js.
──────────────────────────────────────────────────────────────── */

/* ── Utilitaire ── */
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/* ── Données hormonales (valeurs normalisées 0–100, 28 points, J1–J28) ── */
const HORMONE_CURVES = {
  estrogen:     [10,10,12,14,17,22,28,35,42,50,58,65,72,80,95,88,72,58,50,46,44,42,38,32,26,20,14,10],
  progesterone: [5,5,5,5,5,6,6,7,7,8,8,8,9,10,12,20,38,55,65,72,75,72,65,52,35,18,8,5],
  lh:           [8,8,8,9,10,11,12,14,16,18,22,30,45,85,100,60,20,10,8,7,7,7,6,6,6,6,6,6],
  fsh:          [25,22,20,18,17,16,15,14,13,12,12,13,15,22,14,12,11,10,10,10,10,10,10,11,12,15,18,22],
  testosterone: [30,30,31,32,34,36,40,44,48,52,56,60,65,72,80,75,65,56,50,46,42,38,35,32,30,29,29,29],
};

/* ── Métadonnées hormonales (label + couleur) ── */
const HORMONE_META = {
  estrogen:     { label: 'Œstrogène',    color: '#f96085' },
  progesterone: { label: 'Progestérone', color: '#7F77DD' },
  lh:           { label: 'LH',           color: '#EF9F27' },
  fsh:          { label: 'FSH',          color: '#c9880a' },
  testosterone: { label: 'Testostérone', color: '#1D9E75' },
};

/* ── Phases : métadonnées communes (partagées par phase.js, pages.js, app.js) ── */
const PHASES = ['menstruelle', 'folliculaire', 'ovulation', 'luteale'];

const PHASE_META = {
  menstruelle: {
    label: 'Phase menstruelle', short: 'Menstruelle', emoji: '🩸',
    color: '#f96085', bg: 'var(--pink-50)', border: 'var(--pink-200)', days: 'Jours 1–5',
  },
  folliculaire: {
    label: 'Phase folliculaire', short: 'Folliculaire', emoji: '🌱',
    color: '#EF9F27', bg: 'var(--yellow-50)', border: 'var(--yellow-200)', days: 'Jours 6–13',
  },
  ovulation: {
    label: 'Ovulation', short: 'Ovulation', emoji: '✨',
    color: '#1D9E75', bg: 'var(--mint-100)', border: 'var(--mint-200)', days: 'Jours 14–16',
  },
  luteale: {
    label: 'Phase lutéale', short: 'Lutéale', emoji: '🌙',
    color: '#7F77DD', bg: 'var(--lavender-100)', border: 'var(--lavender-200)', days: 'Jours 17–28',
  },
};
