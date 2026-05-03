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

  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  const isFuture = d > today;

  const btnLabel = entry ? '✏️ Modifier ce jour' : '＋ Ajouter des données';
  const btnHtml = isFuture ? '' : `
    <button class="day-panel-journal-btn" onclick="navigateToJournalDate('${key}')">
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
  const date = new Date(isoDate + 'T12:00:00');
  navigate('journal');
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
    const energyEntries = entries.filter(e => e.energy != null);
    const avgEnergy = energyEntries.length ? energyEntries.reduce((a, e) => a + e.energy, 0) / energyEntries.length : 0;
    const periodDays = entries.filter(e => e.bleeding?.includes('Règles')).length;
    const moodMap = {};
    entries.forEach(e => (e.mood || []).forEach(m => moodMap[m] = (moodMap[m] || 0) + 1));
    const topMoods = Object.entries(moodMap).sort((a,b) => b[1]-a[1]).slice(0,3).map(([m]) => m);
    const sportDays = entries.filter(e => e.sport_done === 'Oui').length;
    const highDesire = entries.filter(e => e.sex?.includes('Désir élevé')).length;

    const startDate = new Date(cycle.start + 'T12:00:00');
    const endDate   = new Date(cycle.end   + 'T12:00:00');
    const realLength = Math.round((endDate - startDate) / 86400000) + 1;

    const isOngoing = cycle.end === App.getKey(new Date());
    const endLabel  = isOngoing
      ? `en cours`
      : endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const CYCLE_COLORS  = ['var(--pink-50)', 'var(--yellow-50)', 'var(--lavender-100)', 'var(--mint-100)', 'var(--peach-100)'];
    const CYCLE_BORDERS = ['var(--pink-200)', 'var(--yellow-200)', 'var(--lavender-200)', 'var(--mint-200)', 'var(--peach-200)'];
    const ci = i % CYCLE_COLORS.length;

    const gaps = App.detectPeriodGaps(cycle.start);
    const cycleNum = cycles.length - i;
    const gapBanner = gaps.length ? buildGapBanner(gaps, cycle.start, cycleNum) : '';

    html += `
    <div class="cycle-card" style="background:${CYCLE_COLORS[ci]};border-color:${CYCLE_BORDERS[ci]}">
      <div class="cycle-card-header">
        <div>
          <div class="cycle-num">Cycle ${cycleNum}${isOngoing ? ' <span style="font-size:13px;font-weight:400;color:var(--pink-500)">— en cours</span>' : ''}</div>
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

/* ─── Gap banner ─── */

// Stocke les gaps en mémoire par numéro de cycle, évite de sérialiser en JSON dans les attributs onclick
const _pendingGaps = {};

function buildGapBanner(gaps, cycleStart, cycleNum) {
  _pendingGaps[cycleNum] = gaps.map(g => ({
    key: g.key,
    bleeding: g.suggestedBleeding,
    label: g.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
  }));

  const bleedingColors = {
    'Règles abondantes': { bg: '#fff0f3', border: '#ffaabf', dot: '#f96085', text: '#c0405a' },
    'Règles moyennes':   { bg: '#fff4f6', border: '#ffcad8', dot: '#ff85a1', text: '#d4607a' },
    'Règles légères':    { bg: '#fff8f9', border: '#ffe4ec', dot: '#ffcad8', text: '#e08090' },
    'Spotting':          { bg: '#fffdf0', border: '#ffe066', dot: '#EF9F27', text: '#8a6b00' },
  };

  const dayPreviews = _pendingGaps[cycleNum].map(g => {
    const c = bleedingColors[g.bleeding] || bleedingColors['Règles légères'];
    return `
      <div class="gap-day-preview" style="background:${c.bg};border-color:${c.border}">
        <span class="gap-day-dot" style="background:${c.dot}"></span>
        <span class="gap-day-label">${g.label}</span>
        <span class="gap-day-type" style="color:${c.text}">${g.bleeding.replace('Règles ', '')}</span>
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
        <button class="gap-btn-confirm" onclick="confirmFillGaps(${cycleNum})">
          Valider et remplir ces jours
        </button>
        <button class="gap-btn-dismiss" onclick="dismissGapBanner(${cycleNum})">
          Ignorer
        </button>
      </div>
    </div>`;
}

function confirmFillGaps(cycleNum) {
  const gaps = _pendingGaps[cycleNum];
  if (!gaps) return;

  gaps.forEach(g => {
    if (!App.data[g.key]) {
      App.data[g.key] = { bleeding: g.bleeding, mood: [], food: [], sport_done: null, sport_type: [], sport_perf: null, sport_motiv: null, sex: [], energy: null, notes: '', autoFilled: true };
    } else if (!App.data[g.key].bleeding) {
      App.data[g.key].bleeding = g.bleeding;
      App.data[g.key].autoFilled = true;
    }
  });

  delete _pendingGaps[cycleNum];
  App.save();
  showToast(`${gaps.length} jour${gaps.length > 1 ? 's' : ''} rempli${gaps.length > 1 ? 's' : ''} automatiquement 🩸`);
  initCycles();
}

function dismissGapBanner(cycleNum) {
  delete _pendingGaps[cycleNum];
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

// Clés cravings utilisées dans plusieurs graphiques
const CRAVING_KEYS = ['Craving sucré', 'Craving salé', 'Craving gras', 'Craving chocolat', 'Faim intense'];

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

  // Accumuler les données par phase
  const byPhase = {};
  PHASES.forEach(p => byPhase[p] = {
    energy: [], perf: [], motiv: [],
    mood: {}, food: {}, sex: {},
    sportDays: 0, totalDays: 0,
    desire: { high: 0, mod: 0, low: 0 },
    sexScores: [],
    sleepHours: [], sleepQuality: {}, sleepIssues: {},
    sleepDeep: [], sleepREM: [], sleepScore: [],
    hrv: [], steps: [], weight: [], hr: [], bbt: [],
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
    if (e.energy)           p.energy.push(e.energy);
    if (e.sport_done === 'Oui') {
      p.sportDays++;
      if (e.sport_perf)  p.perf.push(e.sport_perf);
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
    const sexArr = e.sex || [];
    const hasRapport = sexArr.some(s => s.toLowerCase().includes('rapport') || s.toLowerCase().includes('sexe') || s.toLowerCase().includes('pénétr'));
    const hasPrelis  = sexArr.some(s => s.toLowerCase().includes('préli') || s.toLowerCase().includes('preli') || s.toLowerCase().includes('masturbation') || s.toLowerCase().includes('câlin'));
    const sexScore = hasRapport ? 100 : hasPrelis ? 50 : (sexArr.length > 0 ? 25 : 0);
    if (sexArr.length > 0 || e.sex !== undefined) p.sexScores.push(sexScore);
    if (e.sleep_hours && e.sleep_quality) p.sleepHours.push(e.sleep_hours);
    if (e.sleep_quality)  p.sleepQuality[e.sleep_quality] = (p.sleepQuality[e.sleep_quality]||0)+1;
    (e.sleep_issues||[]).forEach(i => p.sleepIssues[i] = (p.sleepIssues[i]||0)+1);
    if (e.sleep_deep  > 0) p.sleepDeep.push(e.sleep_deep);
    if (e.sleep_rem   > 0) p.sleepREM.push(e.sleep_rem);
    if (e.sleep_score != null) p.sleepScore.push(e.sleep_score);
    if (e.hrv_avg)    p.hrv.push(e.hrv_avg);
    if (e.steps > 0)  p.steps.push(e.steps);
    if (e.weight)     p.weight.push(e.weight);
    if (e.hr_avg)     p.hr.push(e.hr_avg);
    if (e.bbt)        p.bbt.push(e.bbt);
  });

  // Stats globales
  const cycles = App.detectCycles();

  let avgCycleLen = '—';
  if (cycles.length >= 2) {
    const lens = [];
    for (let i = 1; i < cycles.length; i++) {
      const l = Math.round((new Date(cycles[i].start+'T12:00:00') - new Date(cycles[i-1].start+'T12:00:00')) / 86400000);
      if (l >= 18 && l <= 45) lens.push(l);
    }
    if (lens.length) avgCycleLen = Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) + 'j';
  }

  let nextPeriod = '—';
  if (cycles.length >= 1) {
    const lastCycleStart = cycles[cycles.length - 1].start;
    let cycleLen = 28;
    if (cycles.length >= 2) {
      const lens = [];
      for (let i = 1; i < cycles.length; i++) {
        const l = Math.round((new Date(cycles[i].start+'T12:00:00') - new Date(cycles[i-1].start+'T12:00:00')) / 86400000);
        if (l >= 18 && l <= 45) lens.push(l);
      }
      if (lens.length) cycleLen = Math.round(lens.reduce((a,b)=>a+b,0)/lens.length);
    }
    const nextDate = new Date(lastCycleStart + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + cycleLen);
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.round((nextDate - today) / 86400000);
    if (diffDays === 0) nextPeriod = 'auj.';
    else if (diffDays === 1) nextPeriod = 'demain';
    else if (diffDays > 0) nextPeriod = `J-${diffDays}`;
    else nextPeriod = `J+${Math.abs(diffDays)}`;
  }

  const todayCycleDay = App.getCycleDay();
  const currentPhase = todayCycleDay ? App.getPhase(todayCycleDay) : null;

  let regularityLabel = '—'; let regularityColor = 'var(--text-soft)';
  if (cycles.length >= 3) {
    const lens = [];
    for (let i = 1; i < cycles.length; i++) {
      const l = Math.round((new Date(cycles[i].start+'T12:00:00') - new Date(cycles[i-1].start+'T12:00:00')) / 86400000);
      if (l >= 18 && l <= 45) lens.push(l);
    }
    if (lens.length >= 2) {
      const mean = lens.reduce((a,b)=>a+b,0)/lens.length;
      const sd = Math.sqrt(lens.map(l=>(l-mean)**2).reduce((a,b)=>a+b,0)/lens.length);
      if (sd <= 2) { regularityLabel = '± 2j'; regularityColor = '#1D9E75'; }
      else if (sd <= 4) { regularityLabel = '± 4j'; regularityColor = '#EF9F27'; }
      else { regularityLabel = `± ${Math.round(sd)}j`; regularityColor = '#f96085'; }
    }
  } else if (cycles.length > 0) {
    regularityLabel = `${cycles.length} cycle${cycles.length>1?'s':''}`;
  }

  // Construire le HTML des blocs (uniquement si des données existent)
  let html = `
  <div class="insights-stats">
    <div class="stat-bubble"><div class="stat-num">${avgCycleLen}</div><div class="stat-label">Cycle moyen</div></div>
    <div class="stat-bubble"><div class="stat-num">${nextPeriod}</div><div class="stat-label">Prochaines règles</div></div>
    <div class="stat-bubble">
      <div class="stat-num">${currentPhase ? PHASE_META[currentPhase].emoji : '—'}</div>
      <div class="stat-label">${currentPhase ? PHASE_META[currentPhase].short : 'Phase actuelle'}</div>
    </div>
    <div class="stat-bubble">
      <div class="stat-num" style="color:${regularityColor}">${regularityLabel}</div>
      <div class="stat-label">Régularité du cycle</div>
    </div>
  </div>`;

  const phaseHeader = () => PHASES.map(p =>
    `<div class="chart-phase-label" style="color:${PHASE_META[p].color}">${PHASE_META[p].emoji} ${PHASE_META[p].short}</div>`
  ).join('');

  if (PHASES.some(p => byPhase[p].energy.length > 0 || byPhase[p].perf.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">⚡ Énergie & sport par phase</div>
      <div class="insight-block-sub">Tes moyennes de /10 selon la phase du cycle</div>
      <div class="chart-legend" id="legend-energy"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:240px">
        <canvas id="chart-energy" role="img" aria-label="Courbe énergie et sport par phase du cycle"></canvas>
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].desire.high + byPhase[p].desire.mod + byPhase[p].desire.low > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">💗 Désir & vie intime par phase</div>
      <div class="insight-block-sub">Score moyen de désir et d'activité selon la phase du cycle</div>
      <div class="chart-legend" id="legend-libido"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:220px">
        <canvas id="chart-libido" role="img" aria-label="Courbe désir et activité par phase du cycle"></canvas>
      </div>
      <div class="insight-scale-hint" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:var(--text-soft)">
        <span>💗 Désir : <b>Peu de désir</b> = 0% · <b>Modéré</b> = 50% · <b>Élevé</b> = 100%</span>
        <span>🔥 Activité : <b>Aucune</b> = 0% · <b>Prélim.</b> = 50% · <b>Rapport</b> = 100%</span>
      </div>
    </div>`;
  }

  if (PHASES.some(p => CRAVING_KEYS.some(c => byPhase[p].food[c]))) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🥗 Cravings par phase</div>
      <div class="insight-block-sub">Fréquence de tes envies alimentaires</div>
      <div class="chart-legend" id="legend-cravings"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:220px">
        <canvas id="chart-cravings" role="img" aria-label="Courbe cravings par phase du cycle"></canvas>
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].sleepHours.length > 0 || byPhase[p].sleepDeep.length > 0)) {
    const hasSleepPhases = PHASES.some(p => byPhase[p].sleepDeep.length > 0 || byPhase[p].sleepREM.length > 0);
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🌙 Sommeil par phase</div>
      <div class="insight-block-sub">Durée totale · Sommeil profond (Deep) · Sommeil paradoxal (REM)</div>
      <div class="chart-legend" id="legend-sleep"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:240px">
        <canvas id="chart-sleep" role="img" aria-label="Courbe sommeil par phase"></canvas>
      </div>
      ${hasSleepPhases ? `<div class="insight-science-note" style="margin-top:12px">
        📚 Le REM (paradoxal) régule les émotions et consolide la mémoire — il augmente en phase lutéale sous l'effet de la progestérone
        (Shechter & Boivin, 2010 — <em>Sleep Medicine Reviews</em>).
      </div>` : ''}
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].sleepScore.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">⭐ Score qualité sommeil par phase</div>
      <div class="insight-block-sub">Score /100 basé sur la durée + profondeur (Deep) + régénération (REM)</div>
      <div class="chart-legend" id="legend-sleep-score"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:200px">
        <canvas id="chart-sleep-score" role="img" aria-label="Score qualité sommeil par phase"></canvas>
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].hrv.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🧘 Variabilité cardiaque (VFC/HRV) par phase</div>
      <div class="insight-block-sub">Un HRV élevé = bonne récupération & moins de stress. Il tend à baisser avant et pendant les règles.</div>
      <div class="chart-legend" id="legend-hrv"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:200px">
        <canvas id="chart-hrv" role="img" aria-label="VFC HRV par phase"></canvas>
      </div>
      <div class="insight-science-note" style="margin-top:12px">
        📚 Le HRV diminue significativement en phase prémenstruelle (lutéale tardive) — la progestérone réduit la tonus parasympathique
        (Goldberger et al., 2001 · Yıldırım & Oğuz, 2020 — <em>Autonomic Neuroscience</em>).
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].bbt.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">🌡️ Température basale par phase</div>
      <div class="insight-block-sub">Un pic de +0.2°C après l'ovulation confirme que l'ovulation a bien eu lieu.</div>
      <div class="chart-legend" id="legend-bbt"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:200px">
        <canvas id="chart-bbt" role="img" aria-label="Température basale par phase"></canvas>
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].steps.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">👟 Activité physique (pas) par phase</div>
      <div class="insight-block-sub">Tes variations naturelles d'activité selon ton cycle</div>
      <div class="chart-legend" id="legend-steps"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:200px">
        <canvas id="chart-steps" role="img" aria-label="Nombre de pas par phase"></canvas>
      </div>
    </div>`;
  }

  if (PHASES.some(p => byPhase[p].weight.length > 0)) {
    html += `
    <div class="insight-block">
      <div class="insight-block-title">⚖️ Poids par phase</div>
      <div class="insight-block-sub">Variations moyennes de ton poids selon ta phase du cycle</div>
      <div class="chart-legend" id="legend-weight"></div>
      <div class="chart-phase-header">${phaseHeader()}</div>
      <div style="position:relative;height:200px">
        <canvas id="chart-weight" role="img" aria-label="Poids par phase du cycle"></canvas>
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
  drawAllCharts(byPhase);

  const profilesEl = document.getElementById('phase-profiles');
  if (profilesEl) profilesEl.innerHTML = renderPhaseProfiles(byPhase);
}

/* ═══════════════════════════════════════════════════════════════
   GRAPHIQUES — helpers partagés à portée module
═══════════════════════════════════════════════════════════════ */

const phaseZonesPlugin = {
  id: 'phaseZones',
  beforeDraw(chart) {
    const { ctx, chartArea, scales: { x } } = chart;
    if (!x || !chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const w = (right - left) / 4;
    const zoneColors = ['rgba(249,96,133,0.06)', 'rgba(239,159,39,0.06)', 'rgba(29,158,117,0.06)', 'rgba(127,119,221,0.06)'];
    zoneColors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(left + i * w, top, w, bottom - top);
    });
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

function _mkChart(canvasId, config) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  if (el._chartInstance) { el._chartInstance.destroy(); delete el._chartInstance; }
  el._chartInstance = new Chart(el, config);
  const legendId = 'legend-' + canvasId.replace('chart-', '');
  renderChartLegend(legendId, config.data.datasets);
}

/* ═══════════════════════════════════════════════════════════════
   GRAPHIQUES INDIVIDUELS
═══════════════════════════════════════════════════════════════ */

function drawChartEnergy(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const energyData = PHASES.map(p => avg(byPhase[p].energy));
  const perfData   = PHASES.map(p => avg(byPhase[p].perf));
  const motivData  = PHASES.map(p => avg(byPhase[p].motiv));

  const datasets = [];
  if (energyData.some(v => v !== null)) datasets.push(makeDataset('Énergie',     energyData, '#ff85a1'));
  if (perfData.some(v => v !== null))   datasets.push(makeDataset('Perf. sport', perfData,   '#1D9E75', true));
  if (motivData.some(v => v !== null))  datasets.push(makeDataset('Motivation',  motivData,  '#7F77DD', true));
  if (!datasets.length) return;

  _mkChart('chart-energy', {
    type: 'line',
    data: { labels, datasets },
    options: commonOptions(10, '/10'),
    plugins: [phaseZonesPlugin],
  });
}

function drawChartLibido(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const hasData = PHASES.some(p => byPhase[p].desire.high + byPhase[p].desire.mod + byPhase[p].desire.low > 0);
  if (!hasData) return;

  const desireData = PHASES.map(p => {
    const d = byPhase[p].desire;
    const total = d.high + d.mod + d.low;
    return total ? Math.round((d.high * 100 + d.mod * 50) / total) : null;
  });
  const activityData = PHASES.map(p => {
    const scores = byPhase[p].sexScores;
    return scores.length ? Math.round(avg(scores)) : null;
  });

  const datasets = [
    makeDataset('Désir', desireData, '#f96085'),
    ...(activityData.some(v => v !== null) ? [makeDataset('Activité sexuelle', activityData, '#EF9F27', true)] : []),
  ];

  _mkChart('chart-libido', {
    type: 'line',
    data: { labels, datasets },
    options: {
      ...commonOptions(100),
      plugins: {
        ...commonOptions(100).plugins,
        tooltip: {
          ...commonOptions(100).plugins.tooltip,
          callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y !== null ? ctx.parsed.y + '%' : '—'}` }
        }
      },
      scales: {
        ...commonOptions(100).scales,
        y: { ...commonOptions(100).scales.y, min: 0, max: 100, ticks: { ...commonOptions(100).scales.y.ticks, callback: v => v + '%', stepSize: 25 } }
      }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawChartCravings(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const CRAVING_COLORS = {
    'Craving sucré':    '#f96085',
    'Craving chocolat': '#c07850',
    'Craving salé':     '#7F77DD',
    'Craving gras':     '#EF9F27',
    'Faim intense':     '#1D9E75',
  };

  const datasets = CRAVING_KEYS
    .filter(c => PHASES.some(p => byPhase[p].food[c]))
    .map((c, i) => makeDataset(c.replace('Craving ', ''), PHASES.map(p => byPhase[p].food[c] || null), CRAVING_COLORS[c], i > 0));
  if (!datasets.length) return;

  const maxVal = Math.max(...datasets.flatMap(d => d.data.filter(v => v !== null)), 1);

  _mkChart('chart-cravings', {
    type: 'line',
    data: { labels, datasets },
    options: {
      ...commonOptions(Math.ceil(maxVal * 1.3), '×'),
      scales: {
        ...commonOptions(maxVal).scales,
        y: { ...commonOptions(maxVal).scales.y, ticks: { ...commonOptions(maxVal).scales.y.ticks, callback: v => v + '×', stepSize: 1 } }
      }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawChartSleep(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const sleepData = PHASES.map(p => { const h = byPhase[p].sleepHours; return h.length ? parseFloat((h.reduce((a,b)=>a+b,0)/h.length).toFixed(1)) : null; });
  const deepData  = PHASES.map(p => avg(byPhase[p].sleepDeep));
  const remData   = PHASES.map(p => avg(byPhase[p].sleepREM));

  const datasets = [];
  if (sleepData.some(v=>v!==null)) datasets.push(makeDataset('Durée totale',   sleepData, '#7F77DD'));
  if (deepData.some(v=>v!==null))  datasets.push(makeDataset('Profond (Deep)', deepData,  '#1D9E75', true));
  if (remData.some(v=>v!==null))   datasets.push(makeDataset('Paradoxal (REM)', remData,  '#EF9F27', true));
  if (!datasets.length) return;

  const ref8hPlugin = {
    id: 'sleepRef',
    afterDraw(chart) {
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      if (!y) return;
      const y8 = y.getPixelForValue(8);
      ctx.save();
      ctx.strokeStyle = 'rgba(127,119,221,0.3)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y8); ctx.lineTo(right, y8); ctx.stroke();
      ctx.fillStyle = 'rgba(127,119,221,0.55)';
      ctx.font = '10px DM Sans';
      ctx.fillText('8h recommandées', left + 4, y8 - 4);
      ctx.restore();
    }
  };

  _mkChart('chart-sleep', {
    type: 'line',
    data: { labels, datasets },
    options: {
      ...commonOptions(11),
      plugins: {
        ...commonOptions(11).plugins,
        tooltip: { ...commonOptions(11).plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) + 'h' : '—'}` } }
      },
      scales: {
        ...commonOptions(11).scales,
        y: { ...commonOptions(11).scales.y, min: 0, max: 11, ticks: { ...commonOptions(11).scales.y.ticks, callback: v => v + 'h', stepSize: 1 } }
      }
    },
    plugins: [phaseZonesPlugin, ref8hPlugin],
  });
}

function drawChartSleepScore(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const scoreData = PHASES.map(p => avg(byPhase[p].sleepScore));
  if (!scoreData.some(v=>v!==null)) return;

  const scoreRefPlugin = {
    id: 'scoreRef',
    afterDraw(chart) {
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      if (!y) return;
      const y70 = y.getPixelForValue(70);
      ctx.save();
      ctx.strokeStyle = 'rgba(29,158,117,0.3)';
      ctx.setLineDash([4,4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y70); ctx.lineTo(right, y70); ctx.stroke();
      ctx.fillStyle = 'rgba(29,158,117,0.6)';
      ctx.font = '10px DM Sans';
      ctx.fillText('Objectif 70+', left + 4, y70 - 4);
      ctx.restore();
    }
  };

  _mkChart('chart-sleep-score', {
    type: 'line',
    data: { labels, datasets: [makeDataset('Score sommeil', scoreData, '#7F77DD')] },
    options: {
      ...commonOptions(100, '/100'),
      scales: { ...commonOptions(100).scales, y: { ...commonOptions(100).scales.y, min: 0, max: 100, ticks: { ...commonOptions(100).scales.y.ticks, stepSize: 20 } } }
    },
    plugins: [phaseZonesPlugin, scoreRefPlugin],
  });
}

function drawChartHRV(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const hrvData = PHASES.map(p => avg(byPhase[p].hrv));
  if (!hrvData.some(v=>v!==null)) return;

  _mkChart('chart-hrv', {
    type: 'line',
    data: { labels, datasets: [makeDataset('HRV (ms)', hrvData, '#1D9E75')] },
    options: {
      ...commonOptions(120, 'ms'),
      scales: { ...commonOptions(120).scales, y: { ...commonOptions(120).scales.y, min: 0, max: 120, ticks: { ...commonOptions(120).scales.y.ticks, callback: v => v + 'ms', stepSize: 20 } } }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawChartBBT(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const bbtData = PHASES.map(p => avg(byPhase[p].bbt));
  if (!bbtData.some(v=>v!==null)) return;

  const validBBT = bbtData.filter(v => v !== null);
  const minBBT = Math.floor((Math.min(...validBBT) - 0.3) * 10) / 10;
  const maxBBT = Math.ceil ((Math.max(...validBBT) + 0.3) * 10) / 10;

  _mkChart('chart-bbt', {
    type: 'line',
    data: { labels, datasets: [makeDataset('Temp. basale (°C)', bbtData, '#EF9F27')] },
    options: {
      ...commonOptions(maxBBT, '°C'),
      scales: { ...commonOptions(maxBBT).scales, y: { ...commonOptions(maxBBT).scales.y, min: minBBT, max: maxBBT, ticks: { ...commonOptions(maxBBT).scales.y.ticks, callback: v => v + '°C', stepSize: 0.1 } } }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawChartSteps(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const stepsData = PHASES.map(p => avg(byPhase[p].steps));
  if (!stepsData.some(v=>v!==null)) return;

  const maxSteps = Math.max(...stepsData.filter(v=>v!==null)) * 1.2;

  _mkChart('chart-steps', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pas moyens',
        data: stepsData,
        backgroundColor: PHASES.map(p => PHASE_META[p].color + '80'),
        borderColor: PHASES.map(p => PHASE_META[p].color),
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'rgba(255,255,255,0.97)', borderColor: 'rgba(249,96,133,0.2)', borderWidth: 1, titleColor: '#2d1f26', bodyColor: '#7a5566', padding: 10, cornerRadius: 10 }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 12, family: 'DM Sans' }, color: '#7a5566' } },
        y: { min: 0, max: maxSteps, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { font: { size: 11, family: 'DM Sans' }, color: '#b8909f', callback: v => (v/1000).toFixed(0) + 'k' } }
      }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawChartWeight(byPhase) {
  const labels = PHASES.map(p => PHASE_META[p].short);
  const weightData = PHASES.map(p => avg(byPhase[p].weight));
  if (!weightData.some(v => v !== null)) return;

  const valid = weightData.filter(v => v !== null);
  const minW = Math.floor(Math.min(...valid) - 1);
  const maxW = Math.ceil(Math.max(...valid) + 1);

  _mkChart('chart-weight', {
    type: 'line',
    data: { labels, datasets: [makeDataset('Poids (kg)', weightData, '#1D9E75')] },
    options: {
      ...commonOptions(maxW, 'kg'),
      plugins: {
        ...commonOptions(maxW, 'kg').plugins,
        tooltip: { ...commonOptions(maxW, 'kg').plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) + ' kg' : '—'}` } }
      },
      scales: {
        ...commonOptions(maxW).scales,
        y: { ...commonOptions(maxW).scales.y, min: minW, max: maxW, ticks: { ...commonOptions(maxW).scales.y.ticks, callback: v => v + 'kg', stepSize: 1 } }
      }
    },
    plugins: [phaseZonesPlugin],
  });
}

function drawAllCharts(byPhase) {
  drawChartEnergy(byPhase);
  drawChartLibido(byPhase);
  drawChartCravings(byPhase);
  drawChartSleep(byPhase);
  drawChartSleepScore(byPhase);
  drawChartHRV(byPhase);
  drawChartBBT(byPhase);
  drawChartSteps(byPhase);
  drawChartWeight(byPhase);
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

/* ─── Profils par phase ─── */
function renderPhaseProfiles(byPhase) {
  const topN = (obj, n) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>k);

  const bar = (val, max, color, label) => {
    const pct = Math.min(100, Math.round((val / max) * 100));
    return `
      <div class="ppc-bar-row">
        <span class="ppc-bar-label">${label}</span>
        <div class="ppc-bar-track">
          <div class="ppc-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="ppc-bar-val">${typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(1) : val}</span>
      </div>`;
  };

  const gauge = (pct, color, emoji) => {
    const r = 22, c = 2 * Math.PI * r;
    const filled = (pct / 100) * c;
    return `
      <div class="ppc-gauge">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="5"/>
          <circle cx="28" cy="28" r="${r}" fill="none" stroke="${color}" stroke-width="5"
            stroke-dasharray="${filled} ${c}" stroke-dashoffset="${c * 0.25}"
            stroke-linecap="round" transform="rotate(-90 28 28)"/>
          <text x="28" y="33" text-anchor="middle" font-size="18">${emoji}</text>
        </svg>
        <div class="ppc-gauge-pct" style="color:${color}">${pct}%</div>
      </div>`;
  };

  return PHASES.map(p => {
    const m = PHASE_META[p];
    const d = byPhase[p];

    if (!d.totalDays) {
      return `
        <div class="phase-profile-card" style="background:${m.bg};border-color:${m.border}">
          <div class="ppc-header">
            <span class="ppc-emoji">${m.emoji}</span>
            <div><div class="ppc-title">${m.label}</div><div class="ppc-days">${m.days}</div></div>
          </div>
          <p class="ppc-no-data">Pas encore de données pour cette phase</p>
        </div>`;
    }

    const avgEnergy = avg(d.energy);
    const avgPerf   = avg(d.perf);
    const avgSleep  = avg(d.sleepHours);
    const avgDeep   = avg(d.sleepDeep);
    const avgREM    = avg(d.sleepREM);
    const avgHRV    = avg(d.hrv);
    const topMoods  = topN(d.mood, 3);
    const sportFreq = d.totalDays > 0 ? Math.round((d.sportDays / d.totalDays) * 100) : 0;

    const totalDesire = d.desire.high + d.desire.mod + d.desire.low;
    const desireScore = totalDesire > 0
      ? Math.round((d.desire.high * 100 + d.desire.mod * 50) / totalDesire)
      : null;
    const sleepScore = avgSleep ? Math.min(100, Math.round((avgSleep / 9) * 100)) : null;

    let content = `<div class="ppc-header">
        <span class="ppc-emoji">${m.emoji}</span>
        <div>
          <div class="ppc-title">${m.label}</div>
          <div class="ppc-days">${m.days} · ${d.totalDays}j de données</div>
        </div>
      </div>`;

    const gauges = [];
    if (avgEnergy !== null) gauges.push(gauge(Math.round(avgEnergy * 10), m.color, '⚡'));
    if (desireScore !== null) gauges.push(gauge(desireScore, '#f96085', '💗'));
    if (sleepScore !== null) gauges.push(gauge(sleepScore, '#7F77DD', '🌙'));
    if (sportFreq > 0) gauges.push(gauge(sportFreq, '#1D9E75', '🏃'));

    if (gauges.length) {
      content += `<div class="ppc-gauges">${gauges.join('')}</div>`;
      content += `<div class="ppc-gauge-labels">
        ${avgEnergy !== null ? `<span>Énergie</span>` : ''}
        ${desireScore !== null ? `<span>Désir</span>` : ''}
        ${sleepScore !== null ? `<span>Sommeil</span>` : ''}
        ${sportFreq > 0 ? `<span>Sport</span>` : ''}
      </div>`;
    }

    content += `<div class="ppc-bars" style="margin-top:12px">`;
    if (avgEnergy !== null) content += bar(avgEnergy.toFixed(1), 10, m.color, '⚡ Énergie');
    if (avgPerf   !== null) content += bar(avgPerf.toFixed(1),   10, m.color, '💪 Perf. sport');
    if (avgSleep  !== null) content += bar(avgSleep.toFixed(1),  10, '#7F77DD', '🌙 Sommeil');
    if (avgDeep   !== null) content += bar(avgDeep.toFixed(1),    4, '#1D9E75', '💤 Profond');
    if (avgREM    !== null) content += bar(avgREM.toFixed(1),     4, '#EF9F27', '🌀 REM');
    if (avgHRV    !== null) content += bar(avgHRV.toFixed(0),   100, '#1D9E75', '🧘 HRV (ms)');
    content += `</div>`;

    if (topMoods.length) {
      content += `<div class="ppc-mood-chips">${topMoods.map(mood =>
        `<span class="ppc-chip" style="background:${m.color}22;color:${m.color};border-color:${m.color}44">${mood}</span>`
      ).join('')}</div>`;
    }

    return `<div class="phase-profile-card" style="background:${m.bg};border-color:${m.border}">${content}</div>`;
  }).join('');
}
