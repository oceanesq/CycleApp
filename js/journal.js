/* ─── Journal (Saisie) ─── */

let journalDate = new Date();

let journalState = {
  bleeding: null, mood: [], food: [],
  sport_done: null, sport_type: [], sport_perf: 5, sport_motiv: 5,
  sex: [], energy: 5, notes: '',
  bleeding_texture: null, pain: [],
  sleep_quality: null, sleep_hours: 7, sleep_issues: []
};

function emptyState() {
  return {
    bleeding: null, mood: [], food: [],
    sport_done: null, sport_type: [], sport_perf: null, sport_motiv: null,
    sex: [], energy: null, notes: '',
    bleeding_texture: null, pain: [],
    sleep_quality: null, sleep_hours: null, sleep_issues: []
  };
}
function isToday(date) {
  const t = new Date();
  return date.getFullYear()===t.getFullYear() && date.getMonth()===t.getMonth() && date.getDate()===t.getDate();
}
function isFuture(date) {
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return d > t;
}

function initJournal(date) {
  if (date) journalDate = new Date(date);
  const key = App.getKey(journalDate);
  const existing = App.data[key];
  journalState = existing ? { ...emptyState(), ...existing } : emptyState();

  renderDateNav();
  renderPhaseBadge();
  renderRecentDays();

  // Injecter les chips sport dynamiques (dépend des prefs)
  renderSportChipsJournal();
  // Refermer le panel "autres sports" à chaque changement de jour
  othersOpen = false;
  const othersPanel = document.getElementById('sport-others-panel');
  const othersArrow = document.getElementById('sport-others-arrow');
  if (othersPanel) othersPanel.style.display = 'none';
  if (othersArrow) othersArrow.textContent = '+';

  restoreChips('bleeding-chips', journalState.bleeding, true);
  restoreChips('mood-chips', journalState.mood, false);
  restoreChips('food-chips', journalState.food, false);
  restoreChips('sport-done-chips', journalState.sport_done, true);
  restoreChips('sport-type-chips', journalState.sport_type, false);
  restoreChips('sex-chips', journalState.sex, false);
  restoreChips('bleeding-texture-chips', journalState.bleeding_texture, true);
  restoreChips('pain-chips', journalState.pain, false);
  restoreChips('sleep-quality-chips', journalState.sleep_quality, true);
  restoreChips('sleep-issues-chips', journalState.sleep_issues, false);
  updateBleedingDetail();
  updateSleepHoursDisplay();
  setSlider('energy-slider', 'energy-val', journalState.energy);
  setSlider('perf-slider', 'perf-val', journalState.sport_perf);
  setSlider('motiv-slider', 'motiv-val', journalState.sport_motiv);
  const notesEl = document.getElementById('journal-notes');
  if (notesEl) notesEl.value = journalState.notes || '';
  updateSportDetail();

  // Disable if future
  const isFut = isFuture(journalDate);
  document.querySelectorAll('.journal-card .chip, .journal-card input[type=range], .journal-card textarea').forEach(el => {
    el.disabled = isFut;
    el.style.opacity = isFut ? '0.4' : '';
    el.style.pointerEvents = isFut ? 'none' : '';
  });
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) { saveBtn.disabled = isFut; saveBtn.style.opacity = isFut ? '0.4' : ''; }
  document.getElementById('journal-next-btn').disabled = isToday(journalDate);

  // Update save button label
  if (saveBtn && !isFut) saveBtn.textContent = isToday(journalDate) ? 'Enregistrer ma journée ✦' : 'Enregistrer ce jour ✦';
}

function renderDateNav() {
  const dateEl = document.getElementById('journal-date');
  const subEl = document.getElementById('journal-date-sub');
  const pillEl = document.getElementById('journal-data-pill');
  const pickerEl = document.getElementById('journal-date-picker');

  const diff = Math.round((new Date().setHours(0,0,0,0) - new Date(journalDate).setHours(0,0,0,0)) / 86400000);
  let label;
  if (diff === 0) label = "Aujourd'hui";
  else if (diff === 1) label = 'Hier';
  else if (diff === 2) label = 'Avant-hier';
  else label = journalDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (dateEl) dateEl.textContent = label;
  if (subEl) subEl.textContent = journalDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const hasData = !!App.data[App.getKey(journalDate)];
  if (pillEl) pillEl.style.display = hasData ? 'inline-flex' : 'none';

  // Sync picker value
  if (pickerEl) {
    const y = journalDate.getFullYear();
    const m = String(journalDate.getMonth()+1).padStart(2,'0');
    const d = String(journalDate.getDate()).padStart(2,'0');
    pickerEl.value = `${y}-${m}-${d}`;
    pickerEl.max = App.getKey(new Date());
  }
}

function renderPhaseBadge() {
  const dayEl = document.getElementById('journal-cycleday');
  if (!dayEl) return;

  const cycles = App.detectCycles();
  if (!cycles.length) {
    dayEl.innerHTML = `<span style="font-size:13px;color:var(--text-soft)">Sélectionne "Règles" pour démarrer ton cycle</span>`;
    return;
  }

  const cday = App.getCycleDay(journalDate);
  if (!cday) {
    dayEl.innerHTML = `<span style="font-size:13px;color:var(--text-soft)">Avant le début du cycle suivi</span>`;
    return;
  }

  const phase = App.getPhase(cday);
  if (phase) dayEl.innerHTML = `<span class="phase-badge phase-${phase}"><span class="dot"></span>${App.getPhaseLabel(phase)} — Jour ${cday}</span>`;
}

function renderRecentDays() {
  const strip = document.getElementById('recent-days-strip');
  if (!strip) return;

  strip.innerHTML = '';

  const year = journalDate.getFullYear();
  const month = journalDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const key = App.getKey(d);
    const entry = App.data[key];

    const btn = document.createElement('button');
    btn.className = 'rd-btn';

    if (isToday(d)) btn.classList.add('today');
    if (App.getKey(d) === App.getKey(journalDate)) btn.classList.add('selected');

    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dayNum = d.getDate();

    let dotColor = 'transparent';
    if (entry) dotColor = 'var(--mint-200)';
    if (entry && entry.bleeding && entry.bleeding.includes('Règles')) dotColor = 'var(--pink-400)';
    if (entry && entry.bleeding === 'Spotting') dotColor = 'var(--yellow-300)';

    btn.innerHTML = `
      <div class="rd-name">${dayName}</div>
      <div class="rd-num">${dayNum}</div>
      <div class="rd-dot" style="background:${dotColor}"></div>
    `;

    btn.onclick = () => initJournal(d);

    strip.appendChild(btn);
  }
}

function journalNavDay(delta) {
  const d = new Date(journalDate);
  d.setDate(d.getDate() + delta);
  if (isFuture(d)) return;
  initJournal(d);
}

function journalPickDate(val) {
  if (!val) return;
  const picked = new Date(val + 'T12:00:00');
  if (isFuture(picked)) return;
  initJournal(picked);
}

function restoreChips(groupId, value, single) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.chip').forEach(chip => {
    chip.classList.remove('active');
    const v = chip.dataset.value;
    if (single && v === value) chip.classList.add('active');
    if (!single && Array.isArray(value) && value.includes(v)) chip.classList.add('active');
  });
}

function setSlider(sliderId, valId, value) {
  const s = document.getElementById(sliderId); const v = document.getElementById(valId);
  if (s) s.value = value; if (v) v.textContent = value;
}

function toggleChip(el, field, single = false) {
  if (isFuture(journalDate)) return;
  const value = el.dataset.value;
  if (single) {
    el.closest('[id]').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const wasActive = journalState[field] === value;
    if (!wasActive) { el.classList.add('active'); journalState[field] = value; }
    else { journalState[field] = null; }
  } else {
    el.classList.toggle('active');
    if (!Array.isArray(journalState[field])) journalState[field] = [];
    if (el.classList.contains('active')) { if (!journalState[field].includes(value)) journalState[field].push(value); }
    else { journalState[field] = journalState[field].filter(v => v !== value); }
  }
  if (field === 'sport_done') updateSportDetail();
  if (field === 'bleeding') updateBleedingDetail();
  if (field === 'bleeding' && value.includes('Règles') && el.classList.contains('active')) checkNewCycle();
}

function updateSportDetail() {
  const detail = document.getElementById('sport-detail');
  if (detail) detail.style.display = journalState.sport_done === 'Oui' ? 'block' : 'none';
}

function updateBleedingDetail() {
  const detail = document.getElementById('bleeding-detail');
  if (!detail) return;
  const show = journalState.bleeding && journalState.bleeding.includes('Règles');
  detail.style.display = show ? 'block' : 'none';
}

function updateSleepHoursDisplay() {
  const el = document.getElementById('sleep-hours-display');
  if (!el) return;
  const h = journalState.sleep_hours || 7;
  el.textContent = h % 1 === 0 ? `${h}h` : `${Math.floor(h)}h30`;
}

function adjustSleepHours(delta) {
  journalState.sleep_hours = Math.min(12, Math.max(3, (journalState.sleep_hours || 7) + delta));
  updateSleepHoursDisplay();
}

function checkNewCycle() {
  const key = App.getKey(journalDate);
  const dateLabel = isToday(journalDate) ? "aujourd'hui" : journalDate.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
  if (!App.cycleStart || confirm(`🩸 Marquer le ${dateLabel} comme début d'un nouveau cycle ?`)) {
    App.cycleStart = key; App.save(); renderPhaseBadge();
    showToast('Nouveau cycle démarré !', '🌸');
  }
}

function updateSlider(id, field, displayId) {
  const val = parseInt(document.getElementById(id).value);
  journalState[field] = val;
  document.getElementById(displayId).textContent = val;
}

function saveJournal() {
  if (isFuture(journalDate)) return;
  const notesEl = document.getElementById('journal-notes');
  journalState.notes = notesEl ? notesEl.value : '';
  const key = App.getKey(journalDate);
  App.data[key] = { ...journalState, savedAt: new Date().toISOString() };
  App.save();
  renderRecentDays();
  const btn = document.getElementById('save-btn');
  const orig = isToday(journalDate) ? 'Enregistrer ma journée ✦' : 'Enregistrer ce jour ✦';
  btn.textContent = '✓ Enregistré !'; btn.style.background = '#4caf82';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
  const dateLabel = isToday(journalDate) ? 'Journée' : journalDate.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
  showToast(`${dateLabel} sauvegardée 🌸`);
}
