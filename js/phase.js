/* ══════════════════════════════════════════════
   PAGE MA PHASE — Science + visualisation hormonale
   Sources :
   - Reed & Carr, 2018 — Endotext (hormones cycle)
   - Bäckström et al., 2011 — CNS Drugs (SPM/lutéale)
   - Dreher et al., 2007 — Nature Neuroscience (folliculaire/dopamine)
   - Gangestad & Thornhill, 2008 (ovulation/comportement)
   - Shechter & Boivin, 2010 — Sleep Medicine Reviews (sommeil/cycle)
══════════════════════════════════════════════ */

// HORMONE_CURVES et HORMONE_META sont dans constants.js

const PHASE_EFFECTS = {
  menstruelle: {
    mood:     { icon:'😔', label:'Humeur basse',       score:30 },
    energy:   { icon:'🔋', label:'Énergie faible',     score:25 },
    focus:    { icon:'🧠', label:'Concentration',      score:40 },
    libido:   { icon:'💗', label:'Libido basse',       score:20 },
    perf:     { icon:'🏃', label:'Perfs. réduites',    score:30 },
    cravings: { icon:'🍫', label:'Cravings sucre/sel', score:70 },
    pain:     { icon:'🌡️', label:'Douleurs',          score:75 },
    skin:     { icon:'✨', label:'Peau terne',         score:30 },
  },
  folliculaire: {
    mood:     { icon:'😊', label:'Humeur en hausse',   score:75 },
    energy:   { icon:'🔋', label:'Énergie élevée',     score:80 },
    focus:    { icon:'🧠', label:'Focus & créativité', score:85 },
    libido:   { icon:'💗', label:'Libido modérée',     score:55 },
    perf:     { icon:'🏃', label:'Perfs. top',         score:85 },
    cravings: { icon:'🥗', label:'Appétit équilibré',  score:35 },
    pain:     { icon:'🌡️', label:'Sans douleur',      score:10 },
    skin:     { icon:'✨', label:'Peau lumineuse',     score:80 },
  },
  ovulation: {
    mood:     { icon:'🌟', label:'Humeur au top',      score:90 },
    energy:   { icon:'🔋', label:'Énergie max',        score:95 },
    focus:    { icon:'🧠', label:'Confiance élevée',   score:88 },
    libido:   { icon:'💗', label:'Libido au max',      score:95 },
    perf:     { icon:'🏃', label:'Record perso',       score:95 },
    cravings: { icon:'🥗', label:'Peu de cravings',    score:20 },
    pain:     { icon:'🌡️', label:'Légère sensib.',    score:20 },
    skin:     { icon:'✨', label:'Peau au mieux',      score:95 },
  },
  luteale: {
    mood:     { icon:'😤', label:'Irritabilité/SPM',   score:35 },
    energy:   { icon:'🔋', label:'Énergie variable',   score:45 },
    focus:    { icon:'🧠', label:'Brouillard mental',  score:40 },
    libido:   { icon:'💗', label:'Libido en baisse',   score:35 },
    perf:     { icon:'🏃', label:'Perfs. modérées',    score:50 },
    cravings: { icon:'🍫', label:'Cravings intenses',  score:85 },
    pain:     { icon:'🌡️', label:'Ballonnements',     score:60 },
    skin:     { icon:'✨', label:'Acné possible',      score:40 },
  },
};

// PHASE_SCIENCE étend PHASE_META (label, emoji, days, color, bg, border depuis constants.js)
const PHASE_SCIENCE = {
  menstruelle: {
    ...PHASE_META.menstruelle,
    hormone: 'Œstrogène & progestérone au plus bas',
    keyHormones: ['estrogen', 'progesterone'],
    hormoneNote: 'La chute brutale d\'œstrogène et progestérone déclenche les règles et abaisse la sérotonine — fatigue et variations d\'humeur.',
    sources: [
      { ref: 'ACOG, 2020',               note: 'Dysmenorrhea — crampes & prostaglandines' },
      { ref: 'Reed & Carr, Endotext 2018', note: 'Hormones du cycle menstruel' },
    ],
    tips: {
      body:      [{ icon: '🌡️', title: 'Bouillotte' }, { icon: '🛁', title: 'Bain chaud' }, { icon: '😴', title: 'Repos actif' }, { icon: '💊', title: 'Ibuprofène' }],
      nutrition: [{ icon: '🥩', title: 'Fer (viande/lentilles)' }, { icon: '🍫', title: 'Chocolat noir 70%' }, { icon: '🫚', title: 'Oméga-3' }, { icon: '💧', title: 'Hydratation++' }],
      sport:     [{ icon: '🧘', title: 'Yoga & étirements' }, { icon: '🚶', title: 'Marche douce' }, { icon: '🏊', title: 'Natation légère' }, { icon: '🚫', title: 'Évite le HIIT' }],
    },
  },
  folliculaire: {
    ...PHASE_META.folliculaire,
    hormone: 'Œstrogène en hausse',
    keyHormones: ['estrogen', 'testosterone'],
    hormoneNote: 'L\'œstrogène monte progressivement, boostant sérotonine et dopamine — mémoire, créativité et motivation au maximum.',
    sources: [
      { ref: 'Dreher et al., Nature Neuroscience 2007', note: 'Œstrogène & dopamine' },
      { ref: 'Hampson, Psychoneuroendocrinology 1990', note: 'Cognition & œstrogène' },
    ],
    tips: {
      body:      [{ icon: '✨', title: 'Meilleure période' }, { icon: '🧠', title: 'Pic cognitif' }, { icon: '💆', title: 'Peau lumineuse' }, { icon: '📅', title: 'Planifie tes défis' }],
      nutrition: [{ icon: '🥦', title: 'Légumes crucifères' }, { icon: '🌾', title: 'Fibres & céréales' }, { icon: '🥚', title: 'Protéines complètes' }, { icon: '🫐', title: 'Antioxydants' }],
      sport:     [{ icon: '💪', title: 'Musculation & force' }, { icon: '⚡', title: 'HIIT & cardio' }, { icon: '🏊', title: 'Endurance' }, { icon: '🎯', title: 'Nouveaux records' }],
    },
  },
  ovulation: {
    ...PHASE_META.ovulation,
    hormone: 'Pic LH + testostérone',
    keyHormones: ['lh', 'estrogen', 'testosterone'],
    hormoneNote: 'Le pic de LH déclenche l\'ovulation. La testostérone atteint son maximum — libido, confiance et performances physiques au sommet.',
    sources: [
      { ref: 'Gangestad & Thornhill, 2008', note: 'Ovulation & comportement social' },
      { ref: 'Puts et al., PNAS 2013',       note: 'Testostérone & attractivité' },
    ],
    tips: {
      body:      [{ icon: '🔥', title: 'Confiance max' }, { icon: '🌡️', title: 'Temp. basale ↑' }, { icon: '💧', title: 'Sécrétions filantes' }, { icon: '🌟', title: 'Rayonnement social' }],
      nutrition: [{ icon: '🥗', title: 'Anti-inflammatoire' }, { icon: '🌰', title: 'Zinc & sélénium' }, { icon: '🫀', title: 'Légumes verts' }, { icon: '🍓', title: 'Fruits rouges' }],
      sport:     [{ icon: '🏆', title: 'Record personnel' }, { icon: '⚡', title: 'HIIT & pliométrie' }, { icon: '⚠️', title: 'Échauffement++' }, { icon: '🎯', title: 'Compétitions' }],
    },
  },
  luteale: {
    ...PHASE_META.luteale,
    hormone: 'Progestérone dominante',
    keyHormones: ['progesterone', 'estrogen'],
    hormoneNote: 'La progestérone prépare l\'utérus. Sa chute en fin de phase réduit la sérotonine — SPM, irritabilité, cravings.',
    sources: [
      { ref: 'Bäckström et al., CNS Drugs 2011',       note: 'SPM & progestérone' },
      { ref: 'Shechter & Boivin, Sleep Med Rev 2010',  note: 'Sommeil & phases du cycle' },
    ],
    tips: {
      body:      [{ icon: '💆', title: 'SPM : normal' }, { icon: '🌙', title: 'Besoin de calme' }, { icon: '😴', title: 'Sommeil perturbé' }, { icon: '💧', title: 'Rétention d\'eau' }],
      nutrition: [{ icon: '🌿', title: 'Magnésium' }, { icon: '🫘', title: 'Fibres solubles' }, { icon: '🍵', title: 'Tisanes apaisantes' }, { icon: '🚫', title: 'Réduire caféine/sel' }],
      sport:     [{ icon: '🧘', title: 'Yoga & pilates' }, { icon: '🚶', title: 'Cardio modéré' }, { icon: '🛌', title: 'Récup. prioritaire' }, { icon: '🎧', title: 'Méditation' }],
    },
  },
};

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
function initPhase() {
  const container = document.getElementById('phase-container');
  if (!container) return;

  const cycles = App.detectCycles();
  const cday   = App.getCycleDay();
  const phase  = cday ? App.getPhase(cday) : null;

  if (!cday || !phase) {
    container.innerHTML = `
      <div class="section">
        <div class="empty-state">
          <div class="empty-icon">🌙</div>
          <p>Démarre ton cycle dans le journal pour voir ta phase actuelle.</p>
          <button class="btn btn-primary" onclick="navigate('journal')" style="margin-top:20px">Ouvrir le journal →</button>
        </div>
      </div>`;
    return;
  }

  const sci     = PHASE_SCIENCE[phase];
  const effects = PHASE_EFFECTS[phase];
  const progressPct = Math.min(100, Math.round(((cday-1)/28)*100));
  const phaseSegs = [
    {key:'menstruelle',pct:18,color:'#f96085'},
    {key:'folliculaire',pct:32,color:'#EF9F27'},
    {key:'ovulation',pct:11,color:'#1D9E75'},
    {key:'luteale',pct:39,color:'#7F77DD'},
  ];

  container.innerHTML = `
    <!-- HERO -->
    <div class="phase-hero" style="background:${sci.bg};border-bottom:1px solid ${sci.border}">
      <div class="phase-hero-inner">
        <div class="phase-hero-left">
          <div class="phase-hero-label">Aujourd'hui · Jour ${cday} du cycle</div>
          <h1 class="phase-hero-title">${sci.emoji} ${sci.label}</h1>
          <div class="phase-hero-sub">${sci.days} · ${sci.hormone}</div>
          <div class="cycle-progress-wrap">
            <div class="cycle-progress-track">
              ${phaseSegs.map(s=>`<div class="cycle-progress-seg ${s.key===phase?'active':''}" style="width:${s.pct}%;background:${s.key===phase?s.color:s.color+'40'}" title="${s.key}"></div>`).join('')}
              <div class="cycle-progress-cursor" style="left:${progressPct}%"></div>
            </div>
            <div class="cycle-progress-labels"><span>J1</span><span>J7</span><span>J14</span><span>J21</span><span>J28</span></div>
          </div>
        </div>
        <div class="phase-hero-right">
          <div class="phase-circle" style="border-color:${sci.color}30;background:${sci.color}10">
            <div class="phase-circle-emoji">${sci.emoji}</div>
            <div class="phase-circle-day" style="color:${sci.color}">Jour ${cday}</div>
            <div class="phase-circle-name">${sci.label}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section phase-content" style="padding-top:36px">

      <!-- EFFETS VISUELS -->
      <div class="phase-effects-grid">
        ${Object.values(effects).map(e => `
          <div class="phase-effect-card">
            <div class="pec-icon">${e.icon}</div>
            <div class="pec-label">${e.label}</div>
            <div class="pec-bar-track">
              <div class="pec-bar-fill" style="width:${e.score}%;background:${sci.color}"></div>
            </div>
          </div>`).join('')}
      </div>

      <!-- GRAPHIQUE HORMONAL -->
      <div class="phase-hormone-block">
        <div class="phb-header">
          <div class="phb-title">📈 Courbe hormonale — cette phase</div>
          <div class="phb-sub">Évolution sur 28 jours · ta position actuelle en trait pointillé</div>
        </div>
        <div class="phb-legend">
          ${sci.keyHormones.map(h=>`
            <span class="phb-legend-item">
              <span style="display:inline-block;width:20px;height:3px;background:${HORMONE_META[h].color};border-radius:2px;vertical-align:middle;margin-right:5px"></span>
              ${HORMONE_META[h].label}
            </span>`).join('')}
        </div>
        <div class="phb-chart-wrap">${renderHormoneChart(phase, cday, sci.keyHormones, sci.color)}</div>
        <div class="phb-note">${sci.hormoneNote}</div>
        <div class="phb-sources">
          ${sci.sources.map(s=>`<span class="phb-source">📚 <em>${s.ref}</em> — ${s.note}</span>`).join('')}
        </div>
      </div>

      <!-- DONNÉES PERSO -->
      ${buildPersonalData(phase, cycles)}

      <!-- CONSEILS COMPACTS -->
      <div class="phase-tips-compact">
        ${renderTipsCompact('Corps','💆',sci.tips.body,sci.color)}
        ${renderTipsCompact('Nutrition','🥗',sci.tips.nutrition,sci.color)}
        ${renderTipsCompact('Sport','🏃',sci.tips.sport,sci.color)}
      </div>

      <!-- PROCHAINE PHASE -->
      ${renderNextPhase(phase, cday, sci.color)}

    </div>`;
}

/* ── SVG Graphique hormonal ── */
function renderHormoneChart(phase, cday, keyHormones, phaseColor) {
  const W=700, H=200, PAD={t:20,r:20,b:36,l:32};
  const cw=W-PAD.l-PAD.r, ch=H-PAD.t-PAD.b;
  const xOf=d=>PAD.l+(d/28)*cw;
  const yOf=v=>PAD.t+ch-(v/100)*ch;

  const phaseZones=[
    {key:'menstruelle',start:0,end:5,color:'#f96085'},
    {key:'folliculaire',start:5,end:13,color:'#EF9F27'},
    {key:'ovulation',start:13,end:16,color:'#1D9E75'},
    {key:'luteale',start:16,end:28,color:'#7F77DD'},
  ];

  let svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;

  // Zones phases
  phaseZones.forEach(z=>{
    const x1=xOf(z.start), x2=xOf(z.end);
    const active=z.key===phase;
    svg+=`<rect x="${x1.toFixed(1)}" y="${PAD.t}" width="${(x2-x1).toFixed(1)}" height="${ch}" fill="${z.color}" opacity="${active?0.13:0.04}" rx="0"/>`;
    if(active){
      svg+=`<rect x="${x1.toFixed(1)}" y="${PAD.t}" width="2" height="${ch}" fill="${z.color}" opacity="0.5"/>`;
      svg+=`<rect x="${(x2-2).toFixed(1)}" y="${PAD.t}" width="2" height="${ch}" fill="${z.color}" opacity="0.5"/>`;
    }
  });

  // Grille horizontale
  [25,50,75].forEach(v=>{
    const y=yOf(v);
    svg+=`<line x1="${PAD.l}" y1="${y.toFixed(1)}" x2="${W-PAD.r}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>`;
  });

  // Courbes
  keyHormones.forEach(h=>{
    const m=HORMONE_META[h];
    const data=HORMONE_CURVES[h];
    const path=data.map((v,i)=>`${i===0?'M':'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
    svg+=`<path d="${path}" fill="none" stroke="${m.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    // Remplissage transparent sous la courbe pour la phase active
    if(phase==='menstruelle'&&h==='estrogen'||phase==='folliculaire'&&h==='estrogen'||phase==='ovulation'&&h==='lh'||phase==='luteale'&&h==='progesterone'){
      const pz=phaseZones.find(z=>z.key===phase);
      const x1=xOf(pz.start), x2=xOf(pz.end);
      const pts=data.slice(pz.start,pz.end+1).map((v,i)=>`${xOf(pz.start+i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
      svg+=`<polyline points="${pts}" fill="none" stroke="${m.color}" stroke-width="4" stroke-linecap="round" opacity="0.4"/>`;
    }
  });

  // Curseur jour actuel
  const cx=xOf(cday-1);
  svg+=`<line x1="${cx.toFixed(1)}" y1="${PAD.t}" x2="${cx.toFixed(1)}" y2="${H-PAD.b}" stroke="${phaseColor}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>`;
  svg+=`<circle cx="${cx.toFixed(1)}" cy="${PAD.t}" r="4" fill="${phaseColor}"/>`;
  svg+=`<text x="${Math.min(cx+6,W-PAD.r-16).toFixed(1)}" y="${(PAD.t+10).toFixed(1)}" font-size="10" fill="${phaseColor}" font-family="DM Sans,sans-serif" font-weight="700">J${cday}</text>`;

  // Labels jours axe X
  [1,7,14,21,28].forEach(d=>{
    const x=xOf(d-1);
    svg+=`<text x="${x.toFixed(1)}" y="${(H-PAD.b+12).toFixed(1)}" text-anchor="middle" font-size="9" fill="rgba(0,0,0,0.3)" font-family="DM Sans,sans-serif">${d}</text>`;
  });

  // Labels phases axe X bas
  phaseZones.forEach(z=>{
    const xm=xOf((z.start+z.end)/2);
    const active=z.key===phase;
    svg+=`<text x="${xm.toFixed(1)}" y="${(H-PAD.b+24).toFixed(1)}" text-anchor="middle" font-size="8" fill="${z.color}" font-family="DM Sans,sans-serif" font-weight="${active?700:400}" opacity="${active?1:0.55}">${{menstruelle:'Mens.',folliculaire:'Follic.',ovulation:'Ovul.',luteale:'Lutéale'}[z.key]}</text>`;
  });

  svg+=`</svg>`;
  return svg;
}

/* ── Conseils compacts ── */
function renderTipsCompact(title, emoji, tips, color) {
  return `
    <div class="tips-compact-block">
      <div class="tcb-title">${emoji} ${title}</div>
      <div class="tcb-grid">
        ${tips.map(t=>`
          <div class="tcb-item" style="border-color:${color}30;background:${color}08">
            <span class="tcb-icon">${t.icon}</span>
            <span class="tcb-label">${t.title}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── Données personnelles ── */
function buildPersonalData(currentPhase, cycles) {
  const PHASES=['menstruelle','folliculaire','ovulation','luteale'];
  const byPhase={};
  PHASES.forEach(p=>byPhase[p]={energy:[],perf:[],mood:{},pain:{},totalDays:0});

  const cycleStart=new Date((cycles[0].start||App.cycleStart)+'T12:00:00');
  App.getAllKeys().forEach(k=>{
    const e=App.data[k];
    const diff=Math.floor((new Date(k+'T12:00:00')-cycleStart)/86400000);
    if(diff<0) return;
    const ph=App.getPhase((diff%28)+1);
    if(!ph) return;
    const p=byPhase[ph];
    p.totalDays++;
    if(e.energy) p.energy.push(e.energy);
    if(e.sport_done==='Oui'&&e.sport_perf) p.perf.push(e.sport_perf);
    (e.mood||[]).forEach(m=>p.mood[m]=(p.mood[m]||0)+1);
    (e.pain||[]).forEach(pa=>p.pain[pa]=(p.pain[pa]||0)+1);
  });

  const d=byPhase[currentPhase];
  if(d.totalDays===0) return '';

  // avg est dans constants.js
  const topN=(obj,n)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>k);
  const sci=PHASE_SCIENCE[currentPhase];

  const avgE=avg(d.energy), avgP=avg(d.perf);
  const moods=topN(d.mood,3);
  const pains=topN(d.pain,2).filter(p=>p!=='Aucune douleur');

  const r=18, c=2*Math.PI*r;
  const gaugeItems=[];
  if(avgE) gaugeItems.push({icon:'⚡',label:'Énergie',pct:Math.round(avgE*10),color:'#ff85a1'});
  if(avgP) gaugeItems.push({icon:'💪',label:'Sport',  pct:Math.round(avgP*10),color:'#1D9E75'});

  if(!gaugeItems.length&&!moods.length) return '';

  const gaugeSVG=({icon,label,pct,color})=>{
    const filled=(pct/100)*c;
    return `<div class="personal-gauge">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="${r}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="5"/>
        <circle cx="26" cy="26" r="${r}" fill="none" stroke="${color}" stroke-width="5"
          stroke-dasharray="${filled} ${c}" stroke-dashoffset="${c*0.25}" stroke-linecap="round" transform="rotate(-90 26 26)"/>
        <text x="26" y="31" text-anchor="middle" font-size="17">${icon}</text>
      </svg>
      <div style="font-size:10px;color:var(--text-soft);text-align:center;margin-top:2px">${label}</div>
      <div style="font-size:12px;font-weight:700;color:${color};text-align:center">${pct}%</div>
    </div>`;
  };

  return `
    <div class="personal-data-block" style="border-color:${sci.border};background:${sci.bg}">
      <div class="pdb-header">
        <span>🌸</span>
        <div>
          <div class="pdb-title">Tes tendances personnelles</div>
          <div class="pdb-sub">${d.totalDays} jours de données pour cette phase</div>
        </div>
      </div>
      <div class="pdb-body">
        ${gaugeItems.length?`<div class="pdb-gauges">${gaugeItems.map(gaugeSVG).join('')}</div>`:''}
        ${moods.length?`<div class="pdb-chips-wrap">
          <div class="pdb-chips-label">Émotions fréquentes</div>
          <div class="pdb-chips">${moods.map(m=>`<span class="pdb-chip" style="background:${sci.color}18;color:${sci.color};border-color:${sci.color}33">${m}</span>`).join('')}</div>
        </div>`:''}
        ${pains.length?`<div class="pdb-chips-wrap">
          <div class="pdb-chips-label">Douleurs fréquentes</div>
          <div class="pdb-chips">${pains.map(p=>`<span class="pdb-chip" style="background:#f9608518;color:#f96085;border-color:#f9608533">${p}</span>`).join('')}</div>
        </div>`:''}
      </div>
    </div>`;
}

/* ── Prochaine phase ── */
function renderNextPhase(currentPhase, cday) {
  const order=['menstruelle','folliculaire','ovulation','luteale'];
  const nextPhase=order[(order.indexOf(currentPhase)+1)%4];
  const ns=PHASE_SCIENCE[nextPhase];
  const starts={menstruelle:1,folliculaire:6,ovulation:14,luteale:17};
  const lengths={menstruelle:5,folliculaire:8,ovulation:3,luteale:12};
  const daysLeft=Math.max(0,(starts[currentPhase]+lengths[currentPhase])-cday);
  return `
    <div class="next-phase-block" style="border:1px solid ${ns.border};background:${ns.bg}">
      <div style="font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-soft);margin-bottom:10px">
        Prochaine phase dans ~${daysLeft} jour${daysLeft>1?'s':''}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:32px">${ns.emoji}</span>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;color:var(--text-dark)">${ns.label}</div>
          <div style="font-size:13px;color:var(--text-soft)">${ns.days} · ${ns.hormone}</div>
        </div>
      </div>
    </div>`;
}
