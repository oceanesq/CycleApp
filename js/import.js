/* ══════════════════════════════════════════════
   IMPORT APPLE HEALTH PDF / CSV
   Lit le format d'export Apple Santé et
   pré-remplit les cycles dans App.data
══════════════════════════════════════════════ */

function handleImportDrop(event) {
  event.preventDefault();
  document.getElementById('import-drop-zone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) processImportFile(file);
}

function handleImportFile(input) {
  const file = input.files[0];
  if (file) processImportFile(file);
}

function processImportFile(file) {
  const resultEl = document.getElementById('import-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<div class="import-loading"><span class="import-spin">⟳</span> Lecture du fichier en cours...</div>`;

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    readPDFAsText(file).then(text => {
      const data = parseAppleHealthPDF(text);
      showImportPreview(data, file.name);
    }).catch(err => {
      resultEl.innerHTML = `<div class="import-error">❌ Impossible de lire ce PDF. Essaie d'exporter depuis Apple Santé → Profil → Exporter les données.</div>`;
    });
  } else if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = e => {
      const data = parseCSV(e.target.result);
      showImportPreview(data, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    resultEl.innerHTML = `<div class="import-error">❌ Format non supporté. Utilise un PDF ou CSV Apple Santé.</div>`;
  }
}

/* ── Lecture PDF via FileReader (texte brut) ── */
function readPDFAsText(file) {
  return new Promise((resolve, reject) => {
    // Charger PDF.js si pas déjà là
    if (window.pdfjsLib) {
      extractPDFText(file).then(resolve).catch(reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      extractPDFText(file).then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error('PDF.js unavailable'));
    document.head.appendChild(script);
  });
}

async function extractPDFText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

/* ══════════════════════════════════════════════
   PARSER APPLE HEALTH PDF
   Extrait les cycles depuis le texte du PDF
══════════════════════════════════════════════ */
function parseAppleHealthPDF(text) {
  const cycles = [];
  const symptoms_raw = {};

  // ── 1. Extraire le résumé (longueur typique) ──
  const avgPeriodMatch = text.match(/Typical Period Length\s+(\d+)\s*Days?/i);
  const avgCycleMatch  = text.match(/Typical Cycle Length\s+(\d+)\s*Days?/i);
  const avgPeriodLen   = avgPeriodMatch ? parseInt(avgPeriodMatch[1]) : 6;
  const avgCycleLen    = avgCycleMatch  ? parseInt(avgCycleMatch[1])  : 32;

  // ── 2. Extraire l'historique des cycles ──
  // Format Apple Health PDF : "Sep 9 – Oct 8   30 days   6 days"
  // Ou "Started Apr 23   7 days   7 days"
  const cycleHistoryRegex = /(?:Started\s+)?([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)\s*(?:–|-)\s*([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)\s+(\d+)\s+days?\s+(\d+)\s+days?/gi;
  const ongoingRegex = /Started\s+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)\s+(\d+)\s+days?\s+(\d+)\s+days?/gi;

  let match;
  while ((match = cycleHistoryRegex.exec(text)) !== null) {
    const startStr  = match[1].trim();
    const endStr    = match[2].trim();
    const cycleLen  = parseInt(match[3]);
    const periodLen = parseInt(match[4]);
    const startDate = parseAppleDate(startStr);
    const endDate   = parseAppleDate(endStr);
    if (startDate && endDate) {
      cycles.push({ startDate, endDate, cycleLen, periodLen, ongoing: false });
    }
  }

  // Cycle en cours : "Started Apr 23   7 days   7 days" (sans tiret)
  while ((match = ongoingRegex.exec(text)) !== null) {
    // Vérifier si ce n'est pas déjà dans les cycles normaux
    const startStr  = match[1].trim();
    const cycleLen  = parseInt(match[2]);
    const periodLen = parseInt(match[3]);
    const startDate = parseAppleDate(startStr);
    const alreadyPresent = cycles.some(c => Math.abs(c.startDate - startDate) < 86400000 * 3);
    if (startDate && !alreadyPresent) {
      const today = new Date();
      cycles.push({ startDate, endDate: today, cycleLen, periodLen, ongoing: true });
    }
  }

  // ── 3. Extraire les symptômes par cycle / jour ──
  // Apple Health PDF mentionne les symptômes avec leur position dans le cycle
  // ex: "Abdominal Cramps  ●  ●  ●" avec des positions relatives
  // On cherche les patterns de points (●) sur chaque ligne de symptôme
  const SYMPTOM_MAP = {
    'Abdominal Cramps': 'Crampes intenses',
    'Lower Back Pain':  'Douleurs lombaires',
    'Pelvic Pain':      'Douleurs pelviennes',
    'Headache':         'Maux de tête',
    'Nausea':           'Nausées',
    'Breast Pain':      'Seins douloureux',
    'Bloating':         'Ballonnée',
    'Fatigue':          'Fatiguée',
    'Mood Changes':     'Irritable',
    'Acne':             'Acne',
    'Sleep Changes':    'Troubles du sommeil',
  };

  // ── 4. Extraire flow par jour (Heavy/Medium/Light) dans les cycles ──
  // Format : "Heavy  ● ●" "Medium  ●" "Light  ● ● ●"
  // On va reconstruire jour par jour pour chaque cycle
  const flowPatterns = {
    heavy:   { regex: /Heavy\s+((?:[●•\.\s]+))/g,  bleeding: 'Règles abondantes' },
    medium:  { regex: /Medium\s+((?:[●•\.\s]+))/g, bleeding: 'Règles moyennes'   },
    light:   { regex: /Light\s+((?:[●•\.\s]+))/g,  bleeding: 'Règles légères'    },
    spot:    { regex: /Spotting\s+((?:[●•\.\s]+))/g, bleeding: 'Spotting'         },
  };

  return {
    cycles: cycles.sort((a, b) => a.startDate - b.startDate),
    avgPeriodLen,
    avgCycleLen,
    rawText: text,
    symptomMap: SYMPTOM_MAP,
  };
}

/* ── Parse une date Apple Health ("Sep 9", "Apr 23, 2026", "Sep 9, 2025") ── */
function parseAppleDate(str) {
  if (!str) return null;
  str = str.trim();

  const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
                   jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

  // Avec année : "Sep 9, 2025" ou "Sep 9 2025"
  let m = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mon = MONTHS[m[1].toLowerCase().slice(0,3)];
    if (mon === undefined) return null;
    return new Date(parseInt(m[3]), mon, parseInt(m[2]), 12, 0, 0);
  }

  // Sans année : "Sep 9" → on infère l'année par contexte (2025/2026)
  m = str.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (m) {
    const mon = MONTHS[m[1].toLowerCase().slice(0,3)];
    if (mon === undefined) return null;
    const day = parseInt(m[2]);
    const today = new Date();
    // Essayer avec l'année actuelle et l'année précédente
    for (const year of [today.getFullYear(), today.getFullYear() - 1]) {
      const d = new Date(year, mon, day, 12, 0, 0);
      if (d <= today) return d; // Garder la date la plus récente qui est dans le passé
    }
    return new Date(today.getFullYear(), mon, day, 12, 0, 0);
  }

  return null;
}

/* ── Parser CSV (format générique) ── */
function parseCSV(text) {
  // Format basique : date,type,valeur
  const lines = text.split('\n').filter(l => l.trim());
  const cycles = [];
  // TODO: adapter selon le format exact d'export
  return { cycles, avgPeriodLen: 6, avgCycleLen: 32, rawText: text, symptomMap: {} };
}

/* ══════════════════════════════════════════════
   PRÉVISUALISATION & CONFIRMATION IMPORT
══════════════════════════════════════════════ */
function showImportPreview(data, filename) {
  const resultEl = document.getElementById('import-result');

  if (!data.cycles || data.cycles.length === 0) {
    resultEl.innerHTML = `
      <div class="import-error">
        ❌ Aucun cycle trouvé dans ce fichier.<br>
        <small>Assure-toi d'exporter depuis Apple Santé → Profil → Exporter les données de santé, et de choisir le PDF de synthèse.</small>
      </div>`;
    return;
  }

  // Calculer combien de jours vont être ajoutés
  let totalDays = 0;
  let newDays = 0;
  const preview = data.cycles.map(c => {
    const start = new Date(c.startDate);
    const end   = new Date(c.endDate);
    const days  = Math.round((end - start) / 86400000) + 1;
    totalDays += days;

    // Compter les jours réellement nouveaux (pas déjà dans App.data)
    let nd = 0;
    for (let i = 0; i < c.periodLen; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const k = App.getKey(d);
      if (!App.data[k]) nd++;
    }
    newDays += nd;

    return {
      ...c,
      startLabel: c.startDate.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'}),
      endLabel: c.ongoing ? "aujourd'hui" : c.endDate.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'}),
      days,
    };
  });

  const existingConflicts = data.cycles.reduce((acc, c) => {
    for (let i = 0; i < c.periodLen && i < 10; i++) {
      const d = new Date(c.startDate); d.setDate(d.getDate() + i);
      const k = App.getKey(d);
      if (App.data[k] && App.data[k].bleeding) acc++;
    }
    return acc;
  }, 0);

  resultEl.innerHTML = `
    <div class="import-preview">
      <div class="import-preview-header">
        <span class="import-preview-icon">✓</span>
        <div>
          <div class="import-preview-title">${data.cycles.length} cycle${data.cycles.length > 1 ? 's' : ''} détecté${data.cycles.length > 1 ? 's' : ''}</div>
          <div class="import-preview-sub">depuis ${preview[0].startLabel} · Cycle moyen ${data.avgCycleLen}j · Règles moyennes ${data.avgPeriodLen}j</div>
        </div>
      </div>

      <div class="import-cycles-list">
        ${preview.map(c => `
          <div class="import-cycle-row">
            <span class="import-cycle-dot" style="background:${c.ongoing ? '#1D9E75' : '#f96085'}"></span>
            <span class="import-cycle-dates">${c.startLabel} → ${c.endLabel}</span>
            <span class="import-cycle-meta">${c.days}j · règles ${c.periodLen}j${c.ongoing ? ' · en cours' : ''}</span>
          </div>`).join('')}
      </div>

      ${existingConflicts > 0 ? `
      <div class="import-warning">
        ⚠️ ${existingConflicts} jour${existingConflicts > 1 ? 's' : ''} ont déjà des données dans ton journal.
        L'import ne les écrasera pas — il complètera uniquement les jours vides.
      </div>` : ''}

      <div class="import-what-happens">
        <div class="import-what-title">Ce qui va être importé :</div>
        <div class="import-what-items">
          <span>🩸 Jours de règles avec abondance dégressive</span>
          <span>📅 Début de chaque cycle</span>
          <span>📊 Longueur de cycle dans l'historique</span>
        </div>
      </div>

      <div class="import-actions">
        <button class="btn btn-primary" onclick="confirmImport(${JSON.stringify(preview).replace(/"/g, '&quot;')})">
          Importer ${data.cycles.length} cycle${data.cycles.length > 1 ? 's' : ''} →
        </button>
        <button class="btn btn-outline" onclick="document.getElementById('import-result').style.display='none'">
          Annuler
        </button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════
   CONFIRMATION ET ÉCRITURE DES DONNÉES
══════════════════════════════════════════════ */
function confirmImport(cycles) {
  let imported = 0;
  let skipped  = 0;

  cycles.forEach(cycle => {
    const start     = new Date(cycle.startDate);
    const periodLen = cycle.periodLen || 6;

    // Schéma d'abondance sur periodLen jours
    const scheme = buildImportScheme(periodLen);

    // Définir le cycleStart pour le premier cycle importé
    if (!App.cycleStart || start < new Date(App.cycleStart + 'T12:00:00')) {
      App.cycleStart = App.getKey(start);
    }

    // Écrire les jours de règles
    for (let i = 0; i < periodLen; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const k = App.getKey(d);

      if (App.data[k] && App.data[k].bleeding) {
        skipped++;
        continue; // Ne pas écraser
      }

      App.data[k] = {
        ...(App.data[k] || {}),
        bleeding: scheme[i] || 'Règles légères',
        importedFrom: 'apple_health',
        mood: App.data[k]?.mood || [],
        food: App.data[k]?.food || [],
        sport_done: App.data[k]?.sport_done || null,
        sport_type: App.data[k]?.sport_type || [],
        sport_perf: App.data[k]?.sport_perf || 5,
        sport_motiv: App.data[k]?.sport_motiv || 5,
        sex: App.data[k]?.sex || [],
        energy: App.data[k]?.energy ?? null,
        notes: App.data[k]?.notes || '',
        pain: App.data[k]?.pain || [],
        bleeding_texture: App.data[k]?.bleeding_texture || null,
      };
      imported++;
    }
  });

  App.save();

  // Afficher le résultat
  const resultEl = document.getElementById('import-result');
  resultEl.innerHTML = `
    <div class="import-success">
      <div class="import-success-icon">🌸</div>
      <div class="import-success-title">Import réussi !</div>
      <div class="import-success-sub">${imported} jours importés · ${skipped} jours existants conservés</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigate('cycles')">Voir mes cycles →</button>
        <button class="btn btn-outline" onclick="navigate('phase')">Ma phase →</button>
      </div>
    </div>`;

  showToast(`${imported} jours importés depuis Apple Health 🌸`);
}

/* Schéma d'abondance réaliste sur N jours */
function buildImportScheme(n) {
  const scheme = [];
  for (let i = 0; i < n; i++) {
    const pos = i / Math.max(n - 1, 1);
    if (pos < 0.25)      scheme.push('Règles abondantes');
    else if (pos < 0.50) scheme.push('Règles abondantes');
    else if (pos < 0.70) scheme.push('Règles moyennes');
    else if (pos < 0.88) scheme.push('Règles légères');
    else                  scheme.push('Spotting');
  }
  return scheme;
}

/* ══════════════════════════════════════════════
   IMPORT XML APPLE HEALTH (export.xml)
   Contient les données de sommeil HKCategoryTypeIdentifierSleepAnalysis
   et menstruation HKCategoryTypeIdentifierMenstrualFlow
══════════════════════════════════════════════ */

function processImportFile(file) {
  const resultEl = document.getElementById('import-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<div class="import-loading"><span class="import-spin">⟳</span> Lecture du fichier en cours...</div>`;

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'xml') {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = parseAppleHealthXML(e.target.result);
        showImportPreviewXML(data, file.name);
      } catch(err) {
        resultEl.innerHTML = `<div class="import-error">❌ Erreur lors du parsing XML : ${err.message}</div>`;
      }
    };
    reader.onerror = () => {
      resultEl.innerHTML = `<div class="import-error">❌ Impossible de lire ce fichier.</div>`;
    };
    reader.readAsText(file, 'UTF-8');
    return;
  }

  if (ext === 'pdf') {
    readPDFAsText(file).then(text => {
      const data = parseAppleHealthPDF(text);
      showImportPreview(data, file.name);
    }).catch(() => {
      resultEl.innerHTML = `<div class="import-error">❌ Impossible de lire ce PDF.</div>`;
    });
    return;
  }

  resultEl.innerHTML = `<div class="import-error">❌ Format non supporté. Utilise le fichier <strong>export.xml</strong> ou le PDF Apple Santé.</div>`;
}

/* ── Parser Apple Health XML ── */
function parseAppleHealthXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('XML invalide ou corrompu');
  }

  const records = doc.querySelectorAll('Record');
  const sleepByDate = {};
  const weightByDate = {};
  const menstrualByDate = {};
  const cycleStarts = [];

  records.forEach(r => {
    const type  = r.getAttribute('type') || '';
    const value = r.getAttribute('value') || '';
    const start = r.getAttribute('startDate') || '';
    const end   = r.getAttribute('endDate') || '';

    // ── Menstruation ──
    if (type === 'HKCategoryTypeIdentifierMenstrualFlow') {
      const d = parseXMLDate(start);
      if (!d) return;
      const key = fmtKey(d);
      // value: HKCategoryValueMenstrualFlowUnspecified / Light / Medium / Heavy / None
      const flowMap = {
        'HKCategoryValueMenstrualFlowHeavy': 'Règles abondantes',
        'HKCategoryValueMenstrualFlowMedium': 'Règles moyennes',
        'HKCategoryValueMenstrualFlowLight': 'Règles légères',
        'HKCategoryValueMenstrualFlowNone': 'Rien',
        'HKCategoryValueMenstrualFlowUnspecified': 'Règles moyennes',
      };
      menstrualByDate[key] = flowMap[value] || 'Règles moyennes';
    }

    // ── Cycle start (ovulation / menstrual cycle start) ──
    if (type === 'HKCategoryTypeIdentifierOvulationTestResult') {
      const d = parseXMLDate(start);
      if (d) cycleStarts.push(fmtKey(d));
    }

    // ── Poids ──
    if (type === 'HKQuantityTypeIdentifierBodyMass') {
      const d = parseXMLDate(start);
      if (!d) return;
      const key = fmtKey(d);
      const w = parseFloat(value);
      if (!isNaN(w) && w > 20 && w < 300) weightByDate[key] = parseFloat(w.toFixed(1));
    }

    // ── Sommeil ──
    if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const d = parseXMLDateTime(start);
      const dEnd = parseXMLDateTime(end);
      if (!d || !dEnd) return;

      // Attribuer au jour auquel appartient la nuit (si avant 14h → nuit d'avant)
      const assignDay = d.getHours() < 14 ? new Date(d) : new Date(d);
      if (d.getHours() < 14) assignDay.setDate(assignDay.getDate() - 1);
      const key = fmtKey(assignDay);

      const durationH = (dEnd - d) / 3600000;

      // value: HKCategoryValueSleepAnalysisAsleep / InBed / Awake / REM / Core / Deep
      const isAsleep = ['HKCategoryValueSleepAnalysisAsleep',
                        'HKCategoryValueSleepAnalysisAsleepREM',
                        'HKCategoryValueSleepAnalysisAsleepCore',
                        'HKCategoryValueSleepAnalysisAsleepDeep'].some(v => value.includes(v));

      if (!sleepByDate[key]) sleepByDate[key] = { total: 0, asleep: 0, awake: 0, rem: 0, deep: 0, core: 0 };
      sleepByDate[key].total += durationH;

      if (isAsleep) {
        sleepByDate[key].asleep += durationH;
        if (value.includes('REM'))  sleepByDate[key].rem  += durationH;
        if (value.includes('Deep')) sleepByDate[key].deep += durationH;
        if (value.includes('Core')) sleepByDate[key].core += durationH;
      } else if (value.includes('Awake')) {
        sleepByDate[key].awake += durationH;
      }
    }
  });

  // Convertir sleepByDate en qualité perçue
  const sleepSummary = {};
  Object.entries(sleepByDate).forEach(([key, s]) => {
    const h = parseFloat(Math.min(s.asleep || s.total, 12).toFixed(1));
    if (h < 1) return; // ignorer les enregistrements trop courts
    sleepSummary[key] = {
      hours: h,
      quality: h >= 8 ? 'Très bien dormi' : h >= 7 ? 'Bien dormi' : h >= 6 ? 'Moyen' : h >= 5 ? 'Mal dormi' : 'Insomnie',
      issues: s.awake > 0.5 ? ['Réveils nocturnes'] : [],
      deep: parseFloat((s.deep || 0).toFixed(2)),
      rem:  parseFloat((s.rem  || 0).toFixed(2)),
    };
  });

  return {
    menstrualByDate,
    sleepSummary,
    weightByDate,
    totalSleepDays: Object.keys(sleepSummary).length,
    totalPeriodDays: Object.keys(menstrualByDate).length,
    totalWeightDays: Object.keys(weightByDate).length,
  };
}

function parseXMLDate(str) {
  if (!str) return null;
  // Format Apple Health : "2025-09-09 23:00:00 +0200"
  const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1] + 'T12:00:00') : null;
}

function parseXMLDateTime(str) {
  if (!str) return null;
  // Format Apple Health : "2025-09-09 23:00:00 +0200" → préserve l'heure exacte
  const m = str.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/);
  if (m) return new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`);
  const dm = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return dm ? new Date(dm[1] + 'T12:00:00') : null;
}

function fmtKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Prévisualisation XML ── */
function showImportPreviewXML(data, filename) {
  const resultEl = document.getElementById('import-result');
  const hasPeriod  = data.totalPeriodDays > 0;
  const hasSleep   = data.totalSleepDays > 0;
  const hasWeight  = (data.totalWeightDays || 0) > 0;

  if (!hasPeriod && !hasSleep && !hasWeight) {
    resultEl.innerHTML = `
      <div class="import-error">
        ❌ Aucune donnée de cycle ou de sommeil trouvée.<br>
        <small>Vérifie que tu exportes bien depuis iPhone → Santé → Profil → Exporter les données de santé → le fichier <strong>export.xml</strong> dans le ZIP.</small>
      </div>`;
    return;
  }

  // Calculer les conflits
  let periodConflicts = 0, sleepConflicts = 0;
  Object.keys(data.menstrualByDate).forEach(k => { if (App.data[k]?.bleeding) periodConflicts++; });
  Object.keys(data.sleepSummary).forEach(k => { if (App.data[k]?.sleep_quality) sleepConflicts++; });

  resultEl.innerHTML = `
    <div class="import-preview">
      <div class="import-preview-header">
        <span class="import-preview-icon">✓</span>
        <div>
          <div class="import-preview-title">Données Apple Health détectées</div>
          <div class="import-preview-sub">Fichier : ${filename}</div>
        </div>
      </div>

      <div class="import-xml-stats">
        ${hasPeriod ? `<div class="import-xml-stat" style="background:var(--pink-50);border-color:var(--pink-200)">
          <span class="import-xml-icon">🩸</span>
          <span class="import-xml-num">${data.totalPeriodDays}</span>
          <span class="import-xml-lbl">jours de règles</span>
        </div>` : ''}
        ${hasSleep ? `<div class="import-xml-stat" style="background:var(--lavender-100);border-color:var(--lavender-200)">
          <span class="import-xml-icon">🌙</span>
          <span class="import-xml-num">${data.totalSleepDays}</span>
          <span class="import-xml-lbl">nuits de sommeil</span>
        </div>` : ''}
        ${hasWeight ? `<div class="import-xml-stat" style="background:var(--mint-100);border-color:var(--mint-200)">
          <span class="import-xml-icon">⚖️</span>
          <span class="import-xml-num">${data.totalWeightDays}</span>
          <span class="import-xml-lbl">mesures de poids</span>
        </div>` : ''}
      </div>

      ${periodConflicts + sleepConflicts > 0 ? `
      <div class="import-warning">
        ⚠️ ${periodConflicts + sleepConflicts} entrées existent déjà — elles ne seront pas écrasées.
      </div>` : ''}

      <div class="import-what-happens">
        <div class="import-what-title">Ce qui va être importé :</div>
        <div class="import-what-items">
          ${hasPeriod ? `<span>🩸 Abondance des règles jour par jour (Heavy/Medium/Light)</span>` : ''}
          ${hasSleep  ? `<span>🌙 Durée, qualité, Deep & REM du sommeil chaque nuit</span>` : ''}
          ${hasSleep  ? `<span>💤 Détection des réveils nocturnes</span>` : ''}
          ${hasWeight ? `<span>⚖️ Poids quotidien (kg)</span>` : ''}
        </div>
      </div>

      <div class="import-actions">
        <button class="btn btn-primary" onclick="confirmImportXML(${encodeXMLData(data)})">
          Importer les données →
        </button>
        <button class="btn btn-outline" onclick="document.getElementById('import-result').style.display='none'">
          Annuler
        </button>
      </div>
    </div>`;
}

function encodeXMLData(data) {
  return `'${btoa(unescape(encodeURIComponent(JSON.stringify(data))))}'`;
}

/* ── Confirmation import XML ── */
function confirmImportXML(b64) {
  const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
  let importedPeriod = 0, importedSleep = 0;

  // ── Règles ──
  Object.entries(data.menstrualByDate).forEach(([key, bleeding]) => {
    if (App.data[key]?.bleeding) return;
    App.data[key] = {
      ...(App.data[key] || emptyImportEntry()),
      bleeding,
      importedFrom: 'apple_health_xml',
    };
    importedPeriod++;
  });

  // ── Sommeil ──
  Object.entries(data.sleepSummary).forEach(([key, s]) => {
    if (App.data[key]?.sleep_quality) return;
    if (!App.data[key]) App.data[key] = emptyImportEntry();
    App.data[key].sleep_quality = s.quality;
    App.data[key].sleep_hours   = s.hours;
    App.data[key].sleep_issues  = s.issues;
    App.data[key].sleep_deep    = s.deep;
    App.data[key].sleep_rem     = s.rem;
    const dScore = Math.min(60, Math.round((s.hours / 8) * 60));
    const deepScore = s.deep > 0 ? Math.min(20, Math.round((s.deep / 1.5) * 20)) : 0;
    const remScore  = s.rem  > 0 ? Math.min(20, Math.round((s.rem  / 1.5) * 20)) : 0;
    App.data[key].sleep_score   = dScore + deepScore + remScore;
    App.data[key].importedFrom  = App.data[key].importedFrom || 'apple_health_xml';
    importedSleep++;
  });

  // ── Poids ──
  let importedWeight = 0;
  Object.entries(data.weightByDate || {}).forEach(([key, w]) => {
    if (!App.data[key]) App.data[key] = emptyImportEntry();
    App.data[key].weight       = w;
    App.data[key].importedFrom = App.data[key].importedFrom || 'apple_health_xml';
    importedWeight++;
  });

  // Mettre à jour le cycleStart avec le plus ancien jour de règles
  const periodKeys = Object.keys(data.menstrualByDate).filter(k =>
    data.menstrualByDate[k].includes('Règles')
  ).sort();
  if (periodKeys.length && (!App.cycleStart || periodKeys[0] < App.cycleStart)) {
    App.cycleStart = periodKeys[0];
  }

  App.save();

  document.getElementById('import-result').innerHTML = `
    <div class="import-success">
      <div class="import-success-icon">🌸</div>
      <div class="import-success-title">Import réussi !</div>
      <div class="import-success-sub">
        ${importedPeriod ? `🩸 ${importedPeriod} jours de règles` : ''}
        ${importedSleep ? ` · 🌙 ${importedSleep} nuits de sommeil` : ''}
        ${importedWeight ? ` · ⚖️ ${importedWeight} mesures de poids` : ''}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigate('insights')">Voir mes insights →</button>
        <button class="btn btn-outline" onclick="navigate('phase')">Ma phase →</button>
      </div>
    </div>`;

  showToast(`Import Apple Health terminé 🌸`);
}

function emptyImportEntry() {
  return { bleeding: null, mood: [], food: [], sport_done: null, sport_type: [],
    sport_perf: null, sport_motiv: null, sex: [], energy: null, notes: '',
    bleeding_texture: null, pain: [],
    sleep_quality: null, sleep_hours: null, sleep_issues: [],
    sleep_deep: 0, sleep_rem: 0, sleep_score: null, weight: null };
}
