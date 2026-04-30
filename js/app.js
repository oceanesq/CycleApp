/* ─── App State ─── */
const App = {
  data: JSON.parse(localStorage.getItem('lunaire_data') || '{}'),
  cycleStart: localStorage.getItem('lunaire_cycle_start') || null,
  currentPage: 'home',

  save() {
    localStorage.setItem('lunaire_data', JSON.stringify(this.data));
    if (this.cycleStart) localStorage.setItem('lunaire_cycle_start', this.cycleStart);
  },

  getKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  },

  getCycleDay(forDate) {
    // Trouver le début du cycle qui contient forDate (ou aujourd'hui)
    const targetDate = forDate || new Date();
    const targetKey  = this.getKey(targetDate);

    const cycles = this.detectCycles();
    if (!cycles.length) return null;

    // Trouver le cycle qui contient la date cible
    const cycle = cycles.find(c => targetKey >= c.start && targetKey <= c.end)
      || cycles[cycles.length - 1]; // fallback : dernier cycle connu

    if (!cycle) return null;

    const start = new Date(cycle.start + 'T12:00:00');
    const target = new Date(targetKey  + 'T12:00:00');
    const diff   = Math.floor((target - start) / (1000*60*60*24));
    return diff >= 0 ? diff + 1 : null;
  },

  getPhase(cycleDay) {
    if (!cycleDay) return null;
    const d = ((cycleDay - 1) % 28) + 1;
    if (d <= 5) return 'menstruelle';
    if (d <= 13) return 'folliculaire';
    if (d <= 16) return 'ovulation';
    return 'luteale';
  },

  getPhaseLabel(phase) {
    return { menstruelle: 'Phase menstruelle', folliculaire: 'Phase folliculaire', ovulation: 'Ovulation', luteale: 'Phase lutéale' }[phase] || '';
  },

  getPhaseColor(phase) {
    return { menstruelle: '#f96085', folliculaire: '#ffe066', ovulation: '#b8ead9', luteale: '#ddd0ff' }[phase] || '#ffcad8';
  },

  getAllKeys() {
    return Object.keys(this.data).sort();
  },

  detectCycles() {
    const keys = this.getAllKeys();
    if (!keys.length) return [];

    // Construire la liste des jours avec règles
    // Un nouveau cycle = des règles apparaissent après au moins 10 jours sans règles
    // (pour ne pas couper un cycle en 2 si les règles durent 5 jours)
    const MIN_CYCLE_GAP_DAYS = 10;

    // 1. Repérer tous les jours de règles
    const periodKeys = keys.filter(k => {
      const e = this.data[k];
      return e.bleeding && e.bleeding.includes('Règles');
    });

    if (!periodKeys.length) {
      // Pas de règles connues : un seul "cycle" couvrant tous les jours saisis
      return [{ start: keys[0], end: keys[keys.length - 1], days: keys }];
    }

    // 2. Regrouper les jours de règles consécutifs (ou proches) en "épisodes menstruels"
    //    Un épisode = suite de jours de règles séparés de moins de MIN_CYCLE_GAP_DAYS
    const episodes = []; // [{ firstDay, lastDay }]
    periodKeys.forEach(k => {
      const d = new Date(k);
      if (!episodes.length) {
        episodes.push({ firstDay: k, lastDay: k });
        return;
      }
      const last = episodes[episodes.length - 1];
      const daysSinceLast = Math.round((d - new Date(last.lastDay)) / 86400000);
      if (daysSinceLast <= MIN_CYCLE_GAP_DAYS) {
        last.lastDay = k; // prolonger l'épisode en cours
      } else {
        episodes.push({ firstDay: k, lastDay: k }); // nouvel épisode
      }
    });

    // 3. Chaque épisode marque le début d'un cycle.
    //    Un cycle va du premier jour de règles jusqu'au jour AVANT les règles suivantes.
    const cycles = [];
    episodes.forEach((ep, i) => {
      const cycleStart = ep.firstDay;
      const cycleEnd = i < episodes.length - 1
        ? this._dayBefore(episodes[i + 1].firstDay)
        : this.getKey(new Date()); // cycle en cours → jusqu'à aujourd'hui

      // Collecter tous les jours saisis dans cette plage
      const days = keys.filter(k => k >= cycleStart && k <= cycleEnd);

      // Toujours inclure au moins le jour de début même si pas de données ce jour-là
      if (!days.includes(cycleStart)) days.unshift(cycleStart);

      cycles.push({ start: cycleStart, end: cycleEnd, days });
    });

    return cycles;
  },

  _dayBefore(isoKey) {
    const d = new Date(isoKey + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return this.getKey(d);
  },

  // Détecte les jours sans données entre le 1er et le dernier jour de règles d'un épisode
  // Utilise une durée réaliste (max 7 jours) avec abondance dégressive + spotting en fin
  detectPeriodGaps(cycleStart) {
    const keys = this.getAllKeys();

    // Tous les jours de règles OU spotting de ce cycle
    const periodKeys = keys.filter(k => {
      const e = this.data[k];
      return k >= cycleStart && e && e.bleeding &&
        (e.bleeding.includes('Règles') || e.bleeding === 'Spotting');
    });

    if (periodKeys.length < 2) return [];

    const firstKey = periodKeys[0];
    const lastKey  = periodKeys[periodKeys.length - 1];

    // Quelle est la dernière entrée avec "Règles" (pas spotting) ?
    const lastPeriodKey = [...periodKeys].reverse().find(k => this.data[k].bleeding.includes('Règles')) || firstKey;

    // Durée réelle entre premier et dernier jour connu
    const knownSpan = Math.round(
      (new Date(lastKey + 'T12:00:00') - new Date(firstKey + 'T12:00:00')) / 86400000
    );

    // Moyenne historique des cycles connus, sinon 7j par défaut
    const avgDuration = this._avgPeriodDuration() || 7;
    // On limite à avgDuration jours depuis le premier jour
    const maxDays = avgDuration;

    // Déterminer jusqu'où remplir : min(lastKey, firstKey + maxDays - 1)
    const fillEndDate = new Date(firstKey + 'T12:00:00');
    fillEndDate.setDate(fillEndDate.getDate() + maxDays - 1);
    const fillEndKey = this.getKey(fillEndDate);

    // Schéma d'abondance sur maxDays jours (avec spotting les 2 derniers jours)
    // Ex pour 7j : [abondantes, abondantes, moyennes, moyennes, légères, spotting, spotting]
    const scheme = this._buildBleedingScheme(maxDays);

    const gaps = [];
    for (let i = 1; i < maxDays; i++) {
      const d = new Date(firstKey + 'T12:00:00');
      d.setDate(d.getDate() + i);
      const k = this.getKey(d);

      // Ne dépasse pas fillEnd ni la date d'aujourd'hui
      if (k > fillEndKey) break;
      const today = this.getKey(new Date());
      if (k > today) break;

      // Ne remplace pas un jour déjà renseigné avec un saignement
      if (this.data[k] && this.data[k].bleeding) continue;

      gaps.push({ key: k, date: new Date(d), suggestedBleeding: scheme[i] });
    }

    return gaps;
  },

  // Construit le schéma d'abondance sur N jours avec spotting en fin
  _buildBleedingScheme(n) {
    // Répartition : ~40% abondantes, ~30% moyennes, ~20% légères, ~10% spotting (min 1j)
    const spottingDays  = Math.max(1, Math.round(n * 0.15));
    const lightDays     = Math.max(1, Math.round(n * 0.20));
    const mediumDays    = Math.max(1, Math.round(n * 0.30));
    const heavyDays     = n - spottingDays - lightDays - mediumDays;

    const scheme = [];
    for (let i = 0; i < heavyDays;   i++) scheme.push('Règles abondantes');
    for (let i = 0; i < mediumDays;  i++) scheme.push('Règles moyennes');
    for (let i = 0; i < lightDays;   i++) scheme.push('Règles légères');
    for (let i = 0; i < spottingDays;i++) scheme.push('Spotting');
    return scheme; // index 0 = jour 1 (déjà rempli), on l'utilise à partir de [1]
  },

  // Calcule la durée moyenne des règles à partir des données existantes
  _avgPeriodDuration() {
    const keys = this.getAllKeys();
    const periodKeys = keys.filter(k => {
      const e = this.data[k];
      return e && e.bleeding && (e.bleeding.includes('Règles') || e.bleeding === 'Spotting');
    });
    if (periodKeys.length < 3) return 7; // pas assez de données → défaut 7j

    // Regrouper en épisodes consécutifs (séparés de max 2 jours)
    const episodes = [];
    let ep = [periodKeys[0]];
    for (let i = 1; i < periodKeys.length; i++) {
      const gap = Math.round(
        (new Date(periodKeys[i] + 'T12:00:00') - new Date(periodKeys[i-1] + 'T12:00:00')) / 86400000
      );
      if (gap <= 2) { ep.push(periodKeys[i]); }
      else { episodes.push(ep); ep = [periodKeys[i]]; }
    }
    episodes.push(ep);

    if (episodes.length < 2) return 7;
    const durations = episodes.map(e => {
      return Math.round(
        (new Date(e[e.length-1] + 'T12:00:00') - new Date(e[0] + 'T12:00:00')) / 86400000
      ) + 1;
    });
    const avg = durations.reduce((a,b) => a+b, 0) / durations.length;
    // Borner entre 3 et 10 jours
    return Math.min(10, Math.max(3, Math.round(avg)));
  },

  getAvg(keys, field) {
    const vals = keys.map(k => this.data[k][field]).filter(v => v != null && !isNaN(v));
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : null;
  }
};

/* ─── Router ─── */
function navigate(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  const link = document.querySelector(`[data-page="${page}"]`);
  if (link) link.classList.add('active');
  App.currentPage = page;
  window.scrollTo(0, 0);
  if (page === 'journal') initJournal();
  if (page === 'calendrier') initCalendrier();
  if (page === 'cycles') initCycles();
  if (page === 'insights') initInsights();
  if (page === 'parametres') initParametres();
  if (page === 'phase') initPhase();
}

/* ─── Toast ─── */
function showToast(msg, icon = '✓') {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ─── Nav hamburger ─── */
document.addEventListener('DOMContentLoaded', () => {
  const ham = document.querySelector('.nav-hamburger');
  const nav = document.querySelector('.nav');
  if (ham) ham.addEventListener('click', () => nav.classList.toggle('menu-open'));

  // Close menu on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('menu-open'));
  });

  navigate('home');
});
