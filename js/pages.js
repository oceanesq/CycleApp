/* ─── Calendrier ─── */
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function initCalendrier() {
  renderCal();
}

function renderCal() {
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  document.getElementById('cal-title').textContent = `${MONTHS[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);
  let dow = (first.getDay() + 6) % 7;

  for (let i = 0; i < dow; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(calYear, calMonth, d);
    const key = App.getKey(date);
    const entry = App.data[key];
    const isToday = date.toDateString() === new Date().toDateString();

    const el = document.createElement('div');
    el.className = 'cal-cell' + (isToday ? ' today' : '');

    let bg = '';
    let dotColor = '';
    if (entry) {
      const b = entry.bleeding || '';
      if (b.includes('Règles')) { bg = 'var(--pink-100)'; dotColor = 'var(--pink-400)'; }
      else if (b.includes('Spotting')) { bg = 'var(--yellow-100)'; dotColor = 'var(--yellow-300)'; }
      else if (Object.values(entry).some(v => Array.isArray(v) && v.length > 0)) { bg = 'var(--mint-100)'; dotColor = 'var(--mint-200)'; }
    }

    el.style.background = bg;
    el.innerHTML = `
      <span class="cal-day-num">${d}</span>
      ${entry && dotColor ? `<span class="cal-dot" style="background:${dotColor}"></span>` : ''}
    `;

    el.onclick = () => showDayPopup(date, key, el);
    grid.appendChild(el);
  }
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
}

function showDayPopup(date, key, cell) {
  document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
  cell.classList.add('selected');

  const panel = document.getElementById('day-panel');
  const entry = App.data[key];

  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Pas de données dans le futur
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  const isFuture = d > today;

  // Bouton d'action selon l'état
  const isoDate = key; // format YYYY-MM-DD
  const btnLabel = entry ? '✏️ Modifier ce jour' : '＋ Ajouter des données';
  const btnHtml = isFuture ? '' : `
    <button class="day-panel-journal-btn" onclick="navigateToJournalDate('${isoDate}')">
      ${btnLabel}
    </button>`;

  if (!entry) {
    panel.innerHTML = `
      <div class="day-panel-empty">
        <p class="day-panel-date" style="margin-bottom:6px">${label}</p>
        <p style="color:var(--text-soft);font-size:13px;margin-bottom:${isFuture ? '0' : '16px'}">
          ${isFuture ? 'Jour à venir' : 'Aucune donnée pour ce jour'}
        </p>
        ${btnHtml}
      </div>`;
    return;
  }

  let html = `<p class="day-panel-date">${label}</p><div class="day-panel-body">`;
  if (entry.bleeding) html += `<div class="day-row"><span class="day-icon">🩸</span><span>${entry.bleeding}</span></div>`;
  if (entry.mood?.length) html += `<div class="day-row"><span class="day-icon">💭</span><span>${entry.mood.join(' · ')}</span></div>`;
  if (entry.energy) html += `<div class="day-row"><span class="day-icon">⚡</span><span>Énergie ${entry.energy}/10</span></div>`;
  if (entry.food?.length) html += `<div class="day-row"><span class="day-icon">🥗</span><span>${entry.food.join(' · ')}</span></div>`;
  if (entry.sport_done === 'Oui') {
    html += `<div class="day-row"><span class="day-icon">🏃</span><span>${entry.sport_type?.join(', ') || 'Sport'} — Perf ${entry.sport_perf}/10</span></div>`;
  }
  if (entry.sleep_quality) {
    const sleepH = entry.sleep_hours ? ` · ${Math.floor(entry.sleep_hours)}h${entry.sleep_hours % 1 ? '30' : ''}` : '';
    html += `<div class="day-row"><span class="day-icon">🌙</span><span>${entry.sleep_quality}${sleepH}</span></div>`;
  }
  if (entry.sex?.length) html += `<div class="day-row"><span class="day-icon">💗</span><span>${entry.sex.join(' · ')}</span></div>`;
  if (entry.notes) html += `<div class="day-row"><span class="day-icon">📝</span><em style="color:var(--text-mid);font-size:13px">${entry.notes}</em></div>`;
  html += `</div>${btnHtml}`;

  panel.innerHTML = html;
}

function navigateToJournalDate(isoDate) {
  // isoDate = 'YYYY-MM-DD'
  const date = new Date(isoDate + 'T12:00:00');
  navigate('journal');
  // initJournal est appelé par navigate, on le rappelle avec la bonne date
  setTimeout(() => initJournal(date), 0);
}

/* ─── Cycles ─── */
function initCycles() {
  const cycles = App.detectCycles();
  const container = document.getElementById('cycles-container');

  if (!cycles.length || Object.keys(App.data).length < 3) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌸</div>
        <p>Commence à remplir ton journal pour voir tes cycles ici.</p>
      </div>`;
    return;
  }

  let html = '';
  [...cycles].reverse().forEach((cycle, i) => {
    const entries = cycle.days.map(k => App.data[k]).filter(Boolean);
    const avgEnergy = entries.length ? entries.reduce((a, e) => a + (e.energy || 5), 0) / entries.length : 0;
    const periodDays = entries.filter(e => e.bleeding?.includes('Règles')).length;
    const moodMap = {};
    entries.forEach(e => (e.mood || []).forEach(m => moodMap[m] = (moodMap[m] || 0) + 1));
    const topMoods = Object.entries(moodMap).sort((a,b) => b[1]-a[1]).slice(0,3).map(([m]) => m);
    const sportDays = entries.filter(e => e.sport_done === 'Oui').length;
    const highDesire = entries.filter(e => e.sex?.includes('Désir élevé')).length;

    const startDate = new Date(cycle.start + 'T12:00:00');
    const endDate   = new Date(cycle.end   + 'T12:00:00');

    // Durée réelle du cycle = nombre de jours entre début et fin (inclus)
    const realLength = Math.round((endDate - startDate) / 86400000) + 1;

    // Label de fin
    const isOngoing = cycle.end === App.getKey(new Date());
    const endLabel  = isOngoing
      ? `en cours`
      : endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const colors  = ['var(--pink-50)',    'var(--yellow-50)', 'var(--lavender-100)', 'var(--mint-100)',  'var(--peach-100)'];
    const borders = ['var(--pink-200)',   'var(--yellow-200)','var(--lavender-200)', 'var(--mint-200)',  'var(--peach-200)'];
    const ci = i % colors.length;

    // ── Détecter les trous dans les règles ──
    const gaps = App.detectPeriodGaps(cycle.start);
    const gapBanner = gaps.length ? buildGapBanner(gaps, cycle.start, cycles.length - i) : '';

    html += `
    <div class="cycle-card" style="background:${colors[ci]};border-color:${borders[ci]}">
      <div class="cycle-card-header">
        <div>
          <div class="cycle-num">Cycle ${cycles.length - i}${isOngoing ? ' <span style="font-size:13px;font-weight:400;color:var(--pink-500)">— en cours</span>' : ''}</div>
          <div class="cycle-start-date">
            ${startDate.toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
            → ${isOngoing ? "aujourd'hui" : endDate.toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
          </div>
        </div>
        <div class="cycle-length-badge" title="Durée réelle du cycle">${realLength} jours</div>
      </div>
      ${gapBanner}
      <div class="cycle-stats">
        <div class="cstat"><span class="cstat-num">${periodDays}</span><span class="cstat-lbl">jours de règles</span></div>
        <div class="cstat"><span class="cstat-num">${entries.length ? avgEnergy.toFixed(1) : '—'}</span><span class="cstat-lbl">énergie moy.</span></div>
        <div class="cstat"><span class="cstat-num">${sportDays}</span><span class="cstat-lbl">séances sport</span></div>
        <div class="cstat"><span class="cstat-num">${highDesire}</span><span class="cstat-lbl">j. désir élevé</span></div>
      </div>
      ${topMoods.length ? `<div class="cycle-moods">${topMoods.map(m => `<span class="chip" style="font-size:12px;padding:4px 10px">${m}</span>`).join('')}</div>` : ''}
      <div class="cycle-bar">
        ${renderCycleBar(cycle.days, cycle.start, cycle.end)}
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function buildGapBanner(gaps, cycleStart, cycleNum) {
  // Encoder les gaps en JSON pour passer en attribut data
  const gapsJson = encodeURIComponent(JSON.stringify(gaps.map(g => ({
    key: g.key,
    bleeding: g.suggestedBleeding,
    label: g.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }))));

  const bleedingColors = {
    'Règles abondantes': { bg: '#fff0f3', border: '#ffaabf', dot: '#f96085', text: '#c0405a' },
    'Règles moyennes':   { bg: '#fff4f6', border: '#ffcad8', dot: '#ff85a1', text: '#d4607a' },
    'Règles légères':    { bg: '#fff8f9', border: '#ffe4ec', dot: '#ffcad8', text: '#e08090' },
    'Spotting':          { bg: '#fffdf0', border: '#ffe066', dot: '#EF9F27', text: '#8a6b00' },
  };

  const dayPreviews = gaps.map(g => {
    const c = bleedingColors[g.suggestedBleeding] || bleedingColors['Règles légères'];
    return `
      <div class="gap-day-preview" style="background:${c.bg};border-color:${c.border}">
        <span class="gap-day-dot" style="background:${c.dot}"></span>
        <span class="gap-day-label">${g.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span class="gap-day-type" style="color:${c.text}">${g.suggestedBleeding.replace('Règles ', '')}</span>
      </div>`;
  }).join('');

  return `
    <div class="gap-banner" id="gap-banner-${cycleNum}">
      <div class="gap-banner-header">
        <span class="gap-banner-icon">🩸</span>
        <div>
          <div class="gap-banner-title">${gaps.length} jour${gaps.length > 1 ? 's' : ''} de règles probable${gaps.length > 1 ? 's' : ''} non renseigné${gaps.length > 1 ? 's' : ''}</div>
          <div class="gap-banner-sub">Entre tes jours de règles saisis, ces jours semblent manquants. L'abondance est calculée de façon dégressive.</div>
        </div>
      </div>
      <div class="gap-days-row">${dayPreviews}</div>
      <div class="gap-actions">
        <button class="gap-btn-confirm" onclick="confirmFillGaps('${gapsJson}', ${cycleNum})">
          Valider et remplir ces jours
        </button>
        <button class="gap-btn-dismiss" onclick="dismissGapBanner(${cycleNum})">
          Ignorer
        </button>
      </div>
    </div>`;
}

function confirmFillGaps(gapsJsonEncoded, cycleNum) {
  const gaps = JSON.parse(decodeURIComponent(gapsJsonEncoded));

  gaps.forEach(g => {
    // Ne pas écraser des données existantes
    if (!App.data[g.key]) {
      App.data[g.key] = { bleeding: g.bleeding, mood: [], food: [], sport_done: null, sport_type: [], sport_perf: 5, sport_motiv: 5, sex: [], energy: 5, notes: '', autoFilled: true };
    } else if (!App.data[g.key].bleeding) {
      App.data[g.key].bleeding = g.bleeding;
      App.data[g.key].autoFilled = true;
    }
  });

  App.save();
  showToast(`${gaps.length} jour${gaps.length > 1 ? 's' : ''} rempli${gaps.length > 1 ? 's' : ''} automatiquement 🩸`);
  initCycles(); // Rafraîchir
}

function dismissGapBanner(cycleNum) {
  const banner = document.getElementById(`gap-banner-${cycleNum}`);
  if (banner) {
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-6px)';
    setTimeout(() => banner.remove(), 300);
  }
}

function renderCycleBar(days, cycleStart, cycleEnd) {
  if (!cycleStart) return '';

  const start = new Date(cycleStart + 'T12:00:00');
  const end   = new Date((cycleEnd || cycleStart) + 'T12:00:00');
  const totalDays = Math.round((end - start) / 86400000) + 1;

  // Map des données par clé
  const dataMap = {};
  (days || []).forEach(k => { dataMap[k] = App.data[k]; });

  const segments = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const k = App.getKey(d);
    const e = dataMap[k];
    if (!e) { segments.push('var(--pink-50)'); continue; }
    const b = e.bleeding || '';
    if (b.includes('Règles')) segments.push('var(--pink-400)');
    else if (b.includes('Spotting')) segments.push('var(--yellow-300)');
    else if (e.mood?.length || e.food?.length || e.sport_done) segments.push('var(--mint-200)');
    else segments.push('var(--pink-100)');
  }

  return `<div class="cycle-timeline">${segments.map((c, i) => `<div class="cycle-seg" style="background:${c}" title="Jour ${i+1}"></div>`).join('')}</div>`;
}

/* ─── Insights ─── */
function initInsights() {
  const keys = App.getAllKeys();
  const container = document.getElementById('insights-container');

  if (keys.length < 5 || !App.cycleStart) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <p>Continue à remplir ton journal quelques jours de plus<br>et démarre ton cycle pour voir tes insights personnalisés !</p>
      </div>`;
    return;
  }

  // ── Attribuer une phase à chaque journée ──
  const PHASES = ['menstruelle', 'folliculaire', 'ovulation', 'luteale'];
  const PHASE_META = {
    menstruelle:  { label: 'Phase menstruelle',  short: 'Menstruelle',  emoji: '🩸', color: '#f96085', bg: 'var(--pink-100)',     border: 'var(--pink-200)',     days: 'Jours 1–5'   },
    folliculaire: { label: 'Phase folliculaire',  short: 'Folliculaire', emoji: '🌱', color: '#EF9F27', bg: 'var(--yellow-50)',    border: 'var(--yellow-200)',   days: 'Jours 6–13'  },
    ovulation:    { label: 'Ovulation',           short: 'Ovulation',    emoji: '✨', color: '#1D9E75', bg: 'var(--mint-100)',     border: 'var(--mint-200)',     days: 'Jours 14–16' },
    luteale:      { label: 'Phase lutéale',       short: 'Lutéale',      emoji: '🌙', color: '#7F77DD', bg: 'var(--lavender-100)', border: 'var(--lavender-200)', days: 'Jours 17–28' },
  };

  // Accumuler les données par phase
  const byPhase = {};
  PHASES.forEach(p => byPhase[p] = {
    energy: [], perf: [], motiv: [],
    mood: {}, food: {}, sex: {},
    sportDays: 0, totalDays: 0,
    desire: { high: 0, mod: 0, low: 0 },
    sleepHours: [], sleepQuality: {}, sleepIssues: {},
  });

  const cycleStart = new Date(App.cycleStart + 'T12:00:00');

  keys.forEach(k => {
    const e = App.data[k];
    const dayDate = new Date(k + 'T12:00:00');
    const diff = Math.floor((dayDate - cycleStart) / 86400000);
    if (diff < 0) return;
    const cycleDay = (diff % 28) + 1;
    const phase = App.getPhase(cycleDay);
    if (!phase || !byPhase[phase]) return;

    const p = byPhase[phase];
    p.totalDays++;
    if (e.energy)     p.energy.push(e.energy);
    if (e.sport_done === 'Oui') {
      p.sportDays++;
      if (e.sport_perf) p.perf.push(e.sport_perf);
      if (e.sport_motiv) p.motiv.push(e.sport_motiv);
    }
    (e.mood||[]).forEach(m => p.mood[m] = (p.mood[m]||0)+1);
    (e.food||[]).forEach(f => p.food[f] = (p.food[f]||0)+1);
    (e.sex||[]).forEach(s => {
      p.sex[s] = (p.sex[s]||0)+1;
      if (s === 'Désir élevé') p.desire.high++;
      else if (s === 'Désir modéré') p.desire.mod++;
      else if (s === 'Peu de désir') p.desire.low++;
    });
    if (e.sleep_hours) p.sleepHours.push(e.sleep_hours);
    if (e.sleep_quality) p.sleepQuality[e.sleep_quality] = (p.sleepQuality[e.sleep_quality]||0)+1;
    (e.sleep_issues||[]).forEach(i => p.sleepIssues[i] = (p.sleepIssues[i]||0)+1);
  });

  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const pct = (n, total) => total ? Math.round((n/total)*100) : 0;

  // Stats globales
  const allEntries = keys.map(k => App.data[k]);
  const cycles = App.detectCycles();
  const totalSportDays = allEntries.filter(e => e.sport_done === 'Oui').length;
  const globalAvgEnergy = avg(allEntries.map(e => e.energy||5));

  let html = `
  <div class="insights-stats">
    <div class="stat-bubble"><div class="stat-num">${keys.length}</div><div class="stat-label">jours suivis</div></div>
    <div class="stat-bubble"><div class="stat-num">${cycles.length}</div><div class="stat-label">cycles</div></div>
    <div class="stat-bubble"><div class="stat-num">${globalAvgEnergy ? globalAvgEnergy.toFixed(1) : '—'}</div><div class="stat-label">énergie moyenne</div></div>
    <div class="stat-bubble"><div class="stat-num">${totalSportDays}</div><div class="stat-label">séances sport</div></div>
  </div>`;

  // ════════════════════════════════════════════
  // GRAPHIQUE 1 : Énergie & performances par phase
  // ════════════════════════════════════════════
  const energyByPhase  = PHASES.map(p => avg(byPhase[p].energy));
  const perfByPhase    = PHASES.map(p => avg(byPhase[p].perf));
  const motivByPhase   = PHASES.map(p => avg(byPhase[p].motiv));
  const hasEnergy = energyByPhase.some(v => v !== null);
  const hasSport  = perfByPhase.some(v => v !== null);

  if (hasEnergy || hasSport) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">⚡ Énergie & sport par phase</div>
      <div class="insight-block-sub">Tes moyennes de /10 selon la phase du cycle</div>
      <div class="chart-legend" id="legend-energy"></div>
      <div class="chart-phase-header">
        ${PHASES.map(p => `<div class="chart-phase-label" style="color:${PHASE_META[p].color}">${PHASE_META[p].emoji} ${PHASE_META[p].short}</div>`).join('')}
      </div>
      <div style="position:relative;height:240px">
        <canvas id="chart-energy" role="img" aria-label="Courbe énergie et sport par phase du cycle"></canvas>
      </div>
    </div>`;
  }

  const hasLibido = PHASES.some(p => byPhase[p].desire.high + byPhase[p].desire.mod + byPhase[p].desire.low > 0);
  if (hasLibido) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">💗 Désir & vie intime par phase</div>
      <div class="insight-block-sub">Répartition du désir (%) selon la phase</div>
      <div class="chart-legend" id="legend-libido"></div>
      <div class="chart-phase-header">
        ${PHASES.map(p => `<div class="chart-phase-label" style="color:${PHASE_META[p].color}">${PHASE_META[p].emoji} ${PHASE_META[p].short}</div>`).join('')}
      </div>
      <div style="position:relative;height:220px">
        <canvas id="chart-libido" role="img" aria-label="Courbe désir par phase du cycle"></canvas>
      </div>
    </div>`;
  }

  const cravingKeys = ['Craving sucré', 'Craving salé', 'Craving gras', 'Craving chocolat', 'Faim intense'];
  const hasCravings = PHASES.some(p => cravingKeys.some(c => byPhase[p].food[c]));
  if (hasCravings) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🥗 Cravings par phase</div>
      <div class="insight-block-sub">Fréquence de tes envies alimentaires</div>
      <div class="chart-legend" id="legend-cravings"></div>
      <div class="chart-phase-header">
        ${PHASES.map(p => `<div class="chart-phase-label" style="color:${PHASE_META[p].color}">${PHASE_META[p].emoji} ${PHASE_META[p].short}</div>`).join('')}
      </div>
      <div style="position:relative;height:220px">
        <canvas id="chart-cravings" role="img" aria-label="Courbe cravings par phase du cycle"></canvas>
      </div>
    </div>`;
  }

  const hasSleep = PHASES.some(p => byPhase[p].sleepHours.length > 0);
  if (hasSleep) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🌙 Sommeil par phase</div>
      <div class="insight-block-sub">Durée moyenne de sommeil (heures) selon la phase</div>
      <div class="chart-legend" id="legend-sleep"></div>
      <div class="chart-phase-header">
        ${PHASES.map(p => `<div class="chart-phase-label" style="color:${PHASE_META[p].color}">${PHASE_META[p].emoji} ${PHASE_META[p].short}</div>`).join('')}
      </div>
      <div style="position:relative;height:200px">
        <canvas id="chart-sleep" role="img" aria-label="Courbe sommeil par phase"></canvas>
      </div>
    </div>`;
  }

  html += `
  <div class="insight-block">
    <div class="insight-block-title">🔍 Mon profil par phase</div>
    <div class="insight-block-sub">Basé sur tes données personnelles</div>
    <div class="phase-profiles-grid" id="phase-profiles"></div>
  </div>`;

  container.innerHTML = html;

  // Charger Chart.js puis dessiner tous les graphiques
  if (!window.Chart) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => drawAllCharts(byPhase, PHASES, PHASE_META, energyByPhase, perfByPhase, motivByPhase, cravingKeys);
    document.head.appendChild(s);
  } else {
    drawAllCharts(byPhase, PHASES, PHASE_META, energyByPhase, perfByPhase, motivByPhase, cravingKeys);
  }

  // Profils par phase
  const profilesEl = document.getElementById('phase-profiles');
  if (profilesEl) profilesEl.innerHTML = renderPhaseProfiles(PHASES, PHASE_META, byPhase);
}

function drawAllCharts(byPhase, PHASES, PHASE_META, energyByPhase, perfByPhase, motivByPhase, cravingKeys) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const phaseColors = PHASES.map(p => PHASE_META[p].color);

  // Détruire les anciens charts si on revient sur la page
  ['chart-energy', 'chart-sport', 'chart-libido', 'chart-cravings'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el._chartInstance) { el._chartInstance.destroy(); delete el._chartInstance; }
  });

  // ── Fond zone colorée par phase (plugin inline) ──
  const phaseZonesPlugin = {
    id: 'phaseZones',
    beforeDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom }, scales: { x } } = chart;
      if (!x) return;
      const w = (right - left) / 4;
      const zoneColors = ['rgba(249,96,133,0.06)', 'rgba(239,159,39,0.06)', 'rgba(29,158,117,0.06)', 'rgba(127,119,221,0.06)'];
      zoneColors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(left + i * w, top, w, bottom - top);
      });
      // Séparateurs légers
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(left + i * w, top);
        ctx.lineTo(left + i * w, bottom);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const commonOptions = (yMax = 10, yLabel = '') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderColor: 'rgba(249,96,133,0.2)',
        borderWidth: 1,
        titleColor: '#2d1f26',
        bodyColor: '#7a5566',
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) : '—'}${yLabel}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 12, family: 'DM Sans' }, color: '#7a5566' }
      },
      y: {
        min: 0, max: yMax,
        grid: { color: 'rgba(0,0,0,0.05)', lineWidth: 1 },
        border: { display: false, dash: [4,4] },
        ticks: { font: { size: 11, family: 'DM Sans' }, color: '#b8909f', stepSize: yMax <= 10 ? 2 : undefined }
      }
    }
  });

  const makeDataset = (label, data, color, dashed = false) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: color + '18',
    borderWidth: 2.5,
    borderDash: dashed ? [5, 4] : [],
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 7,
    tension: 0.45,
    fill: false,
    spanGaps: true,
  });

  // ════ GRAPHIQUE 1 : Énergie & sport ════
  const canvasEnergy = document.getElementById('chart-energy');
  const hasEnergy = energyByPhase.some(v => v !== null);
  const hasSport  = perfByPhase.some(v => v !== null);
  if (canvasEnergy && (hasEnergy || hasSport)) {
    const datasets = [];
    if (hasEnergy)                           datasets.push(makeDataset('Énergie',     energyByPhase,                    '#ff85a1'));
    if (hasSport)                            datasets.push(makeDataset('Perf. sport', perfByPhase,                      '#1D9E75', true));
    if (motivByPhase.some(v => v !== null))  datasets.push(makeDataset('Motivation',  motivByPhase,                     '#7F77DD', true));

    const chart = new Chart(canvasEnergy, {
      type: 'line',
      data: { labels, datasets },
      options: commonOptions(10, '/10'),
      plugins: [phaseZonesPlugin]
    });
    canvasEnergy._chartInstance = chart;
    renderChartLegend('legend-energy', datasets);
  }

  // ════ GRAPHIQUE 2 : Libido ════
  const canvasLibido = document.getElementById('chart-libido');
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  const hasLibido = PHASES.some(p => byPhase[p].desire.high + byPhase[p].desire.mod + byPhase[p].desire.low > 0);
  if (canvasLibido && hasLibido) {
    const hiData  = PHASES.map(p => { const d = byPhase[p].desire; const t = d.high+d.mod+d.low; return t ? Math.round(d.high/t*100) : null; });
    const modData = PHASES.map(p => { const d = byPhase[p].desire; const t = d.high+d.mod+d.low; return t ? Math.round(d.mod/t*100)  : null; });
    const loData  = PHASES.map(p => { const d = byPhase[p].desire; const t = d.high+d.mod+d.low; return t ? Math.round(d.low/t*100)  : null; });
    const datasets = [
      makeDataset('Désir élevé',  hiData,  '#f96085'),
      makeDataset('Désir modéré', modData, '#ffaabf', true),
      makeDataset('Peu de désir', loData,  '#ddd0ff', true),
    ];
    const chart = new Chart(canvasLibido, {
      type: 'line',
      data: { labels, datasets },
      options: { ...commonOptions(100, '%'), scales: { ...commonOptions(100,'%').scales, y: { ...commonOptions(100,'%').scales.y, ticks: { ...commonOptions(100,'%').scales.y.ticks, callback: v => v + '%' } } } },
      plugins: [phaseZonesPlugin]
    });
    canvasLibido._chartInstance = chart;
    renderChartLegend('legend-libido', datasets);
  }

  // ════ GRAPHIQUE 4 : Sommeil ════
  const canvasSleep = document.getElementById('chart-sleep');
  const sleepData = PHASES.map(p => {
    const h = byPhase[p].sleepHours;
    return h.length ? parseFloat((h.reduce((a,b)=>a+b,0)/h.length).toFixed(1)) : null;
  });
  if (canvasSleep && sleepData.some(v => v !== null)) {
    const datasets = [makeDataset('Durée (h)', sleepData, '#7F77DD')];
    // Ligne de référence 8h
    const refPlugin = {
      id: 'sleepRef',
      afterDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        if (!y) return;
        const y8 = y.getPixelForValue(8);
        ctx.save();
        ctx.strokeStyle = 'rgba(127,119,221,0.25)';
        ctx.setLineDash([4,4]);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left, y8); ctx.lineTo(right, y8); ctx.stroke();
        ctx.fillStyle = 'rgba(127,119,221,0.5)';
        ctx.font = '10px DM Sans';
        ctx.fillText('8h recommandées', left + 4, y8 - 4);
        ctx.restore();
      }
    };
    const chart = new Chart(canvasSleep, {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...commonOptions(11, 'h'),
        scales: {
          ...commonOptions(11,'h').scales,
          y: { ...commonOptions(11,'h').scales.y, min: 4, max: 11, ticks: { ...commonOptions(11,'h').scales.y.ticks, callback: v => v + 'h', stepSize: 1 } }
        }
      },
      plugins: [phaseZonesPlugin, refPlugin]
    });
    canvasSleep._chartInstance = chart;
    renderChartLegend('legend-sleep', datasets);
  }
  const canvasCravings = document.getElementById('chart-cravings');
  const cravingColors = { 'Craving sucré': '#f96085', 'Craving chocolat': '#c07850', 'Craving salé': '#7F77DD', 'Craving gras': '#EF9F27', 'Faim intense': '#1D9E75' };
  const hasCravings = PHASES.some(p => cravingKeys.some(c => byPhase[p].food[c]));
  if (canvasCravings && hasCravings) {
    const datasets = cravingKeys
      .filter(c => PHASES.some(p => byPhase[p].food[c]))
      .map((c, i) => makeDataset(c.replace('Craving ', ''), PHASES.map(p => byPhase[p].food[c] || null), cravingColors[c], i > 0));
    const maxCraving = Math.max(...datasets.flatMap(d => d.data.filter(v => v !== null)), 1);
    const chart = new Chart(canvasCravings, {
      type: 'line',
      data: { labels, datasets },
      options: { ...commonOptions(Math.ceil(maxCraving * 1.3), '×'), scales: { ...commonOptions(maxCraving,'×').scales, y: { ...commonOptions(maxCraving,'×').scales.y, ticks: { ...commonOptions(maxCraving,'×').scales.y.ticks, callback: v => v + '×', stepSize: 1 } } } },
      plugins: [phaseZonesPlugin]
    });
    canvasCravings._chartInstance = chart;
    renderChartLegend('legend-cravings', datasets);
  }
}

function renderChartLegend(containerId, datasets) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = datasets.map(d => `
    <span class="chart-legend-item">
      <span style="display:inline-block;width:20px;height:2.5px;background:${d.borderColor};border-radius:2px;vertical-align:middle;margin-right:4px"></span>
      ${d.label}
    </span>`).join('');
}

// ── Profils personnalisés par phase ──
function renderPhaseProfiles(phases, meta, byPhase) {
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  const topN = (obj, n) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>k);

  return phases.map(p => {
    const m = meta[p];
    const d = byPhase[p];
    const hasDays = d.totalDays > 0;

    if (!hasDays) {
      return `
        <div class="phase-profile-card" style="background:${m.bg};border-color:${m.border}">
          <div class="ppc-header">
            <span class="ppc-emoji">${m.emoji}</span>
            <div>
              <div class="ppc-title">${m.label}</div>
              <div class="ppc-days">${m.days}</div>
            </div>
          </div>
          <p class="ppc-no-data">Pas encore de données pour cette phase</p>
        </div>`;
    }

    const avgEnergy  = avg(d.energy);
    const avgPerf    = avg(d.perf);
    const avgMotiv   = avg(d.motiv);
    const topMoods   = topN(d.mood, 3);
    const topFoods   = topN(d.food, 3);
    const totalDesire = d.desire.high + d.desire.mod + d.desire.low;
    const dominantDesire = totalDesire > 0
      ? (d.desire.high >= d.desire.mod && d.desire.high >= d.desire.low ? 'élevé'
        : d.desire.mod >= d.desire.low ? 'modéré' : 'faible')
      : null;

    const obs = [];

    if (avgEnergy !== null) {
      const lvl = avgEnergy >= 7 ? 'élevée 🔋' : avgEnergy >= 5 ? 'moyenne' : 'basse 😴';
      obs.push({ icon: '⚡', text: `Énergie ${lvl} en moyenne (${avgEnergy.toFixed(1)}/10)` });
    }
    if (avgPerf !== null) {
      const lvl = avgPerf >= 7 ? 'au top 💪' : avgPerf >= 5 ? 'correctes' : 'en retrait';
      obs.push({ icon: '🏃', text: `Performances sportives ${lvl} (${avgPerf.toFixed(1)}/10)` });
    }
    if (avgMotiv !== null && avgMotiv < 5) {
      obs.push({ icon: '💭', text: `Motivation sportive plus faible (${avgMotiv.toFixed(1)}/10) — écoute ton corps` });
    }
    if (topMoods.length) obs.push({ icon: '🌸', text: `Émotions fréquentes : ${topMoods.join(', ')}` });
    if (topFoods.length) {
      const cravings = topFoods.filter(f => f.startsWith('Craving') || f === 'Faim intense');
      const balanced = topFoods.includes('Équilibré');
      if (cravings.length) obs.push({ icon: '🍫', text: `Tendances alimentaires : ${cravings.map(c => c.replace('Craving ', '')).join(', ')}` });
      if (balanced) obs.push({ icon: '🥗', text: 'Alimentation plutôt équilibrée pendant cette phase' });
    }
    if (dominantDesire) {
      const icon = dominantDesire === 'élevé' ? '🔥' : dominantDesire === 'modéré' ? '💗' : '🌙';
      obs.push({ icon, text: `Désir ${dominantDesire} pendant cette phase` });
    }

    // Sommeil
    const avgSleep = avg(d.sleepHours);
    if (avgSleep !== null) {
      const sleepH = Math.floor(avgSleep);
      const sleepM = avgSleep % 1 >= 0.5 ? '30' : '00';
      const quality = avgSleep >= 8 ? 'excellent 😴' : avgSleep >= 7 ? 'correct' : avgSleep >= 6 ? 'un peu court' : 'insuffisant ⚠️';
      obs.push({ icon: '🌙', text: `Sommeil ${quality} en moyenne (${sleepH}h${sleepM})` });
    }
    const topIssues = topN(d.sleepIssues, 2).filter(i => i !== 'Sommeil réparateur');
    if (topIssues.length) obs.push({ icon: '💤', text: `Problèmes récurrents : ${topIssues.join(', ')}` });
    const dominantSleepQ = Object.entries(d.sleepQuality).sort((a,b)=>b[1]-a[1])[0]?.[0];
    if (dominantSleepQ === 'Insomnie' || dominantSleepQ === 'Mal dormi') {
      obs.push({ icon: '⚠️', text: `Sommeil souvent perturbé pendant cette phase — prévois des rituels de coucher` });
    }
    if (d.sportDays > 0) {
      const freq = d.totalDays > 0 ? Math.round((d.sportDays / d.totalDays) * 100) : 0;
      obs.push({ icon: '📊', text: `Sport ${freq}% des jours de cette phase (${d.sportDays} séances)` });
    }

    const obsHtml = obs.length
      ? obs.map(o => `
          <div class="ppc-obs">
            <span class="ppc-obs-icon">${o.icon}</span>
            <span class="ppc-obs-text">${o.text}</span>
          </div>`).join('')
      : `<p class="ppc-no-data">Continue à remplir ton journal pour voir tes patterns !</p>`;

    return `
      <div class="phase-profile-card" style="background:${m.bg};border-color:${m.border}">
        <div class="ppc-header">
          <span class="ppc-emoji">${m.emoji}</span>
          <div>
            <div class="ppc-title">${m.label}</div>
            <div class="ppc-days">${m.days} · ${d.totalDays} jour${d.totalDays > 1 ? 's' : ''} de données</div>
          </div>
        </div>
        <div class="ppc-obs-list">${obsHtml}</div>
      </div>`;
  }).join('');
}

function pct2(n, total) { return total ? Math.round((n/total)*100) : 0; }
