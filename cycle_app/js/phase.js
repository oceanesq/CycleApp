/* ══════════════════════════════════════════════
   PAGE MA PHASE — Science + personnalisation
══════════════════════════════════════════════ */

const PHASE_SCIENCE = {
  menstruelle: {
    label: 'Phase menstruelle',
    emoji: '🩸',
    days: 'Jours 1–5',
    color: '#f96085',
    bg: 'var(--pink-50)',
    border: 'var(--pink-200)',
    hormone: 'Œstrogène & progestérone au plus bas',
    science: "Durant la phase menstruelle, la chute brutale d'œstrogène et de progestérone déclenche les règles. Les prostaglandines provoquent des contractions utérines responsables des crampes. Les niveaux de sérotonine sont bas, ce qui explique la fatigue et les variations d'humeur. (Source : ACOG, 2020 ; Scientific Reports, 2025)",
    energy_expected: 'Basse à modérée',
    libido_expected: 'Généralement basse',
    sport_expected: 'Effort léger recommandé',
    tips: {
      body: [
        { icon: '🌡️', title: 'Bouillotte', text: 'Applique une bouillotte sur le bas-ventre ou les lombaires. La chaleur détend les muscles utérins et réduit les crampes de 40% selon les études.' },
        { icon: '🛁', title: 'Bain chaud', text: 'Un bain chaud soulage les douleurs pelviennes et favorise la relaxation musculaire.' },
        { icon: '😴', title: 'Repos actif', text: 'Ton corps dépense de l\'énergie. Autorise-toi à ralentir — c\'est physiologiquement normal.' },
        { icon: '💊', title: 'Ibuprofène si nécessaire', text: 'L\'ibuprofène (anti-inflammatoire) est plus efficace que le paracétamol contre les crampes menstruelles car il bloque les prostaglandines.' },
      ],
      nutrition: [
        { icon: '🥩', title: 'Viande rouge & légumineuses', text: 'Le flux menstruel entraîne une perte de fer. Favorise la viande rouge, les lentilles, les épinards pour compenser. Associe-les à de la vitamine C pour optimiser l\'absorption.' },
        { icon: '🍫', title: 'Chocolat noir ≥ 70%', text: 'Riche en magnésium, il aide à réduire les crampes et améliore l\'humeur via la sérotonine.' },
        { icon: '🫚', title: 'Oméga-3', text: 'Saumon, noix, graines de chia : les oméga-3 réduisent l\'inflammation et atténuent les douleurs menstruelles.' },
        { icon: '💧', title: 'Hydratation++', text: 'La rétention d\'eau est courante. Boire plus d\'eau paradoxalement réduit les ballonnements.' },
      ],
      sport: [
        { icon: '🧘', title: 'Yoga & étirements', text: 'Les postures de yoga (enfant, papillon) soulagent les crampes et libèrent les tensions pelviennes.' },
        { icon: '🚶', title: 'Marche douce', text: 'Une marche légère libère des endorphines naturelles qui réduisent la douleur sans surcharger le corps.' },
        { icon: '🏊', title: 'Natation légère', text: 'L\'eau chaude soulage les crampes tout en maintenant une activité douce.' },
        { icon: '🚫', title: 'Évite l\'intensité', text: 'Les entraînements HIIT ou musculation lourde peuvent aggraver les crampes et la fatigue.' },
      ],
    }
  },
  folliculaire: {
    label: 'Phase folliculaire',
    emoji: '🌱',
    days: 'Jours 6–13',
    color: '#EF9F27',
    bg: 'var(--yellow-50)',
    border: 'var(--yellow-200)',
    hormone: 'Œstrogène en hausse',
    science: "L'œstrogène monte progressivement, stimulant la croissance des follicules ovariens. Cette hormone booste la sérotonine et la dopamine, expliquant l'amélioration de l'humeur, de l'énergie et de la motivation. La mémoire de travail et la créativité sont à leur meilleur. (Source : Hampson, 1990 ; Dreher et al., 2007 — Nature Neuroscience)",
    energy_expected: 'En hausse, bonne',
    libido_expected: 'Modérée, en augmentation',
    sport_expected: 'Idéal pour l\'intensité',
    tips: {
      body: [
        { icon: '✨', title: 'C\'est ta meilleure période', text: 'Profite de l\'élan hormonal pour initier de nouveaux projets, prendre des décisions importantes et planifier les moments exigeants.' },
        { icon: '🧠', title: 'Pic cognitif', text: 'Mémoire, concentration et créativité sont au maximum. Idéal pour le travail intense, les présentations, les apprentissages.' },
        { icon: '💆', title: 'Peau en forme', text: 'L\'œstrogène stimule le collagène. Ta peau est plus lumineuse et élastique pendant cette phase.' },
      ],
      nutrition: [
        { icon: '🥦', title: 'Légumes crucifères', text: 'Brocoli, chou, chou-fleur aident à métaboliser l\'excès d\'œstrogène et soutiennent le foie.' },
        { icon: '🌾', title: 'Fibres & céréales complètes', text: 'Les fibres régulent les œstrogènes en excès et stabilisent la glycémie.' },
        { icon: '🥚', title: 'Protéines complètes', text: 'Œufs, légumineuses, poisson : les protéines soutiennent la croissance folliculaire et le renouvellement cellulaire.' },
        { icon: '🫐', title: 'Antioxydants', text: 'Baies, fruits colorés : protègent les follicules en développement du stress oxydatif.' },
      ],
      sport: [
        { icon: '💪', title: 'Musculation & force', text: 'C\'est le moment idéal pour les séances de force. L\'œstrogène favorise la récupération musculaire et la synthèse protéique.' },
        { icon: '⚡', title: 'HIIT & cardio intense', text: 'Tes performances cardiovasculaires sont au mieux. Profite-en pour pousser l\'intensité.' },
        { icon: '🏊', title: 'Endurance', text: 'Excellent moment pour les longues distances — natation, running, cyclisme.' },
        { icon: '🎯', title: 'Nouveaux objectifs', text: 'La motivation est haute : c\'est le meilleur moment pour commencer un nouveau programme ou dépasser tes records.' },
      ],
    }
  },
  ovulation: {
    label: 'Ovulation',
    emoji: '✨',
    days: 'Jours 14–16',
    color: '#1D9E75',
    bg: 'var(--mint-100)',
    border: 'var(--mint-200)',
    hormone: 'Pic d\'œstrogène + testosterone',
    science: "Le pic d'œstrogène déclenche un surge de LH (hormone lutéinisante) qui provoque l'ovulation. La testostérone atteint aussi son maximum, ce qui amplifie la libido, la confiance et l'assurance sociale. Tu rayonnes biologiquement — voix plus grave, peau lumineuse, posture plus ouverte. (Source : Gangestad & Thornhill, 2008 ; Puts et al., 2013 — PNAS)",
    energy_expected: 'Maximum',
    libido_expected: 'Au plus haut',
    sport_expected: 'Performance maximale',
    tips: {
      body: [
        { icon: '🔥', title: 'Pic de confiance & charisme', text: 'La testostérone et l\'œstrogène amplifient ta présence sociale, ta confiance et ton attractivité. Moments idéaux pour les défis sociaux.' },
        { icon: '🌡️', title: 'Température corporelle légèrement élevée', text: 'La température basale monte de ~0,2°C après l\'ovulation. Normal et attendu.' },
        { icon: '💧', title: 'Pertes blanches filantes', text: 'Les sécrétions cervicales deviennent transparentes et filantes (comme du blanc d\'œuf) — signe d\'ovulation fertile.' },
      ],
      nutrition: [
        { icon: '🥗', title: 'Alimentation anti-inflammatoire', text: 'Curcuma, gingembre, légumes verts : soutiennent la santé ovarienne et préparent la phase lutéale.' },
        { icon: '🌰', title: 'Zinc & sélénium', text: 'Noix du Brésil, graines de courge : soutiennent la santé hormonale et la fertilité.' },
        { icon: '🫀', title: 'Légumes à feuilles vertes', text: 'Épinards, roquette, mâche : riches en folates, essentiels si tu es en âge de procréer.' },
      ],
      sport: [
        { icon: '🏆', title: 'Record personnel', text: 'Tes performances sont à leur maximum absolu. Idéal pour les compétitions, tests de force ou records.' },
        { icon: '⚡', title: 'HIIT & plyo', text: 'La puissance musculaire est au sommet. Profite-en pour les exercices explosifs.' },
        { icon: '⚠️', title: 'Attention aux blessures', text: 'La relaxine (hormone de grossesse potentielle) peut fragiliser les ligaments. Échauffement soigneux requis.' },
      ],
    }
  },
  luteale: {
    label: 'Phase lutéale',
    emoji: '🌙',
    days: 'Jours 17–28',
    color: '#7F77DD',
    bg: 'var(--lavender-100)',
    border: 'var(--lavender-200)',
    hormone: 'Progestérone dominante',
    science: "Le corps jaune sécrète de la progestérone qui prépare l'utérus à une grossesse. Si la grossesse n'a pas lieu, les niveaux chutent, entraînant les symptômes du SPM : rétention d'eau, ballonnements, irritabilité, fatigue et cravings. La sérotonine diminue — d'où la sensibilité émotionnelle accrue. (Source : Bäckström et al., 2011 — CNS Drugs)",
    energy_expected: 'Variable à basse',
    libido_expected: 'En baisse',
    sport_expected: 'Effort modéré à léger',
    tips: {
      body: [
        { icon: '💆', title: 'SPM : normal, pas fatal', text: 'Les symptômes prémenstruels sont réels et physiologiques. Réduire la caféine, le sel et l\'alcool aide significativement.' },
        { icon: '🌙', title: 'Besoin de calme accru', text: 'C\'est biologiquement normal de vouloir se retirer socialement. Honore ce besoin de recharge.' },
        { icon: '😴', title: 'Sommeil perturbé possible', text: 'La progestérone peut perturber le sommeil profond en fin de phase. Rituel de coucher régulier recommandé.' },
        { icon: '💧', title: 'Rétention d\'eau', text: 'La progestérone favorise la rétention de sodium. Réduire le sel aide à limiter les ballonnements.' },
      ],
      nutrition: [
        { icon: '🍠', title: 'Glucides complexes', text: 'Patate douce, avoine, quinoa : stabilisent la glycémie et atténuent les cravings sucrés en soutenant la sérotonine.' },
        { icon: '🎃', title: 'Magnésium++', text: 'Graines de courge, amandes, chocolat noir : le magnésium réduit les crampes, les maux de tête et l\'irritabilité liés au SPM.' },
        { icon: '🫚', title: 'Réduire sel & alcool', text: 'Le sel amplifie la rétention d\'eau. L\'alcool aggrave l\'anxiété et perturbe le sommeil déjà fragile.' },
        { icon: '🫐', title: 'Vitamine B6', text: 'Banane, pois chiches, poisson : la B6 soutient la production de sérotonine et réduit les symptômes du SPM.' },
      ],
      sport: [
        { icon: '🧘', title: 'Yoga & pilates', text: 'Parfaits pour cette phase : soulagement du stress, travail de mobilité, sans surcharger un corps déjà en mode économie.' },
        { icon: '🚶', title: 'Marche & natation', text: 'Exercice modéré : libère des endorphines qui contrebalancent la baisse de sérotonine.' },
        { icon: '🎧', title: 'Écoute ton corps', text: 'Si tu te sens épuisée, réduire l\'intensité n\'est pas un échec — c\'est une adaptation intelligente à ta biologie.' },
        { icon: '🔄', title: 'Étirements & mobilité', text: 'Focus sur la récupération, la mobilité et la décompression plutôt que la performance.' },
      ],
    }
  }
};

function initPhase() {
  const container = document.getElementById('phase-container');
  const cycles = App.detectCycles();
  const today = new Date();
  const cday = App.getCycleDay(today);
  const phase = App.getPhase(cday);

  if (!cycles.length || !cday || !phase) {
    container.innerHTML = `
      <div class="section section-narrow" style="padding-top:60px;text-align:center">
        <div style="font-size:64px;margin-bottom:20px">🌸</div>
        <h2 class="heading" style="margin-bottom:12px">Commence ton suivi</h2>
        <p class="subheading" style="margin-bottom:32px;font-size:16px">Renseigne tes premiers jours de règles dans le Journal pour découvrir ta phase et tes conseils personnalisés.</p>
        <button class="btn btn-primary" onclick="navigate('journal')">Ouvrir le journal →</button>
      </div>`;
    return;
  }

  const sci = PHASE_SCIENCE[phase];
  const meta_color = sci.color;

  // ── Données personnalisées depuis les cycles passés ──
  const personalData = buildPersonalData(phase, cycles);

  // ── Progression dans le cycle ──
  const cycleObj = cycles[cycles.length - 1];
  const cycleLength = Math.round((new Date(cycleObj.end + 'T12:00:00') - new Date(cycleObj.start + 'T12:00:00')) / 86400000) + 1;
  const progressPct = Math.min(100, Math.round((cday / 28) * 100));

  // ── Phases visuelles (arc de cycle) ──
  const phaseSegments = [
    { key: 'menstruelle',  label: 'Menstruelle', pct: 18, color: '#f96085' },
    { key: 'folliculaire', label: 'Folliculaire', pct: 32, color: '#EF9F27' },
    { key: 'ovulation',    label: 'Ovulation',    pct: 11, color: '#1D9E75' },
    { key: 'luteale',      label: 'Lutéale',      pct: 39, color: '#7F77DD' },
  ];

  container.innerHTML = `

    <!-- ── Hero phase ── -->
    <div class="phase-hero" style="background:${sci.bg};border-bottom:1px solid ${sci.border}">
      <div class="phase-hero-inner">
        <div class="phase-hero-left">
          <div class="phase-hero-label">Aujourd'hui · Jour ${cday}</div>
          <h1 class="phase-hero-title">${sci.emoji} ${sci.label}</h1>
          <div class="phase-hero-sub">${sci.days} · ${sci.hormone}</div>

          <!-- Barre de progression du cycle -->
          <div class="cycle-progress-wrap">
            <div class="cycle-progress-track">
              ${phaseSegments.map(s => `
                <div class="cycle-progress-seg ${s.key === phase ? 'active' : ''}"
                  style="width:${s.pct}%;background:${s.key === phase ? s.color : s.color+'40'};"
                  title="${s.label}">
                </div>`).join('')}
              <div class="cycle-progress-cursor" style="left:${progressPct}%"></div>
            </div>
            <div class="cycle-progress-labels">
              <span>Jour 1</span>
              <span>Jour 7</span>
              <span>Jour 14</span>
              <span>Jour 21</span>
              <span>Jour 28</span>
            </div>
          </div>
        </div>

        <div class="phase-hero-right">
          <!-- Cercle phase -->
          <div class="phase-circle" style="border-color:${sci.color}20;background:${sci.color}10">
            <div class="phase-circle-emoji">${sci.emoji}</div>
            <div class="phase-circle-day" style="color:${sci.color}">Jour ${cday}</div>
            <div class="phase-circle-name">${sci.label}</div>
          </div>
          <!-- Indicateurs rapides -->
          <div class="phase-quick-stats">
            <div class="pqs-item"><span class="pqs-icon">⚡</span><span class="pqs-label">Énergie</span><span class="pqs-val">${sci.energy_expected}</span></div>
            <div class="pqs-item"><span class="pqs-icon">💗</span><span class="pqs-label">Libido</span><span class="pqs-val">${sci.libido_expected}</span></div>
            <div class="pqs-item"><span class="pqs-icon">🏃</span><span class="pqs-label">Sport</span><span class="pqs-val">${sci.sport_expected}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section" style="padding-top:40px">

      <!-- ── Personnalisation ── -->
      ${personalData.html}

      <!-- ── Science ── -->
      <div class="phase-science-block">
        <div class="psb-header">
          <span class="psb-icon">🔬</span>
          <div>
            <div class="psb-title">Ce qui se passe dans ton corps</div>
            <div class="psb-sub">Basé sur des études scientifiques publiées</div>
          </div>
        </div>
        <p class="psb-text">${sci.science}</p>
      </div>

      <!-- ── Conseils ── -->
      <div class="phase-tips-section">
        ${renderTipsBlock('Corps & bien-être', '💆', sci.tips.body, sci.color)}
        ${renderTipsBlock('Nutrition', '🥗', sci.tips.nutrition, sci.color)}
        ${renderTipsBlock('Sport & activité', '🏃', sci.tips.sport, sci.color)}
      </div>

      <!-- ── Prochaine phase ── -->
      ${renderNextPhase(phase, cday, sci.color)}

    </div>`;
}

function buildPersonalData(currentPhase, cycles) {
  if (cycles.length < 1) return { html: '' };

  const PHASES = ['menstruelle', 'folliculaire', 'ovulation', 'luteale'];
  const byPhase = {};
  PHASES.forEach(p => byPhase[p] = { energy: [], perf: [], mood: {}, pain: {}, desire: { high:0, mod:0, low:0 }, totalDays: 0 });

  const cycleStart = new Date((cycles[0].start || App.cycleStart) + 'T12:00:00');

  App.getAllKeys().forEach(k => {
    const e = App.data[k];
    const d = new Date(k + 'T12:00:00');
    const diff = Math.floor((d - cycleStart) / 86400000);
    if (diff < 0) return;
    const cd = (diff % 28) + 1;
    const ph = App.getPhase(cd);
    if (!ph) return;
    const p = byPhase[ph];
    p.totalDays++;
    if (e.energy) p.energy.push(e.energy);
    if (e.sport_done === 'Oui' && e.sport_perf) p.perf.push(e.sport_perf);
    (e.mood||[]).forEach(m => p.mood[m] = (p.mood[m]||0)+1);
    (e.pain||[]).forEach(pa => p.pain[pa] = (p.pain[pa]||0)+1);
    (e.sex||[]).forEach(s => {
      if (s === 'Désir élevé') p.desire.high++;
      else if (s === 'Désir modéré') p.desire.mod++;
      else if (s === 'Peu de désir') p.desire.low++;
    });
  });

  const d = byPhase[currentPhase];
  if (d.totalDays === 0) return { html: '' };

  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null;
  const topN = (obj, n) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>k);

  const avgE    = avg(d.energy);
  const avgP    = avg(d.perf);
  const topMood = topN(d.mood, 3);
  const topPain = topN(d.pain, 2);
  const totalD  = d.desire.high + d.desire.mod + d.desire.low;
  const desire  = totalD ? (d.desire.high > d.desire.mod && d.desire.high > d.desire.low ? 'élevé' : d.desire.mod >= d.desire.low ? 'modéré' : 'faible') : null;

  const items = [];
  if (avgE)        items.push({ icon:'⚡', color:'#ff85a1', text:`Ton énergie moyenne pendant cette phase : <strong>${avgE}/10</strong>` });
  if (avgP)        items.push({ icon:'🏃', color:'#1D9E75', text:`Tes performances sportives : <strong>${avgP}/10</strong>` });
  if (topMood.length) items.push({ icon:'💭', color:'#7F77DD', text:`Tes émotions fréquentes : <strong>${topMood.join(', ')}</strong>` });
  if (topPain.length && !topPain.includes('Aucune douleur')) items.push({ icon:'🌡️', color:'#f96085', text:`Douleurs fréquentes : <strong>${topPain.join(', ')}</strong>` });
  if (desire)      items.push({ icon:'💗', color:'#ED93B1', text:`Ton désir est généralement <strong>${desire}</strong> pendant cette phase` });

  if (!items.length) return { html: '' };

  const sci = PHASE_SCIENCE[currentPhase];
  return {
    html: `
    <div class="personal-insights-block" style="border-left:4px solid ${sci.color};background:${sci.bg}">
      <div class="pib-header">
        <span style="font-size:18px">🌸</span>
        <div>
          <div class="pib-title">Tes tendances personnelles</div>
          <div class="pib-sub">D'après tes ${d.totalDays} jours de données pendant cette phase</div>
        </div>
      </div>
      <div class="pib-items">
        ${items.map(item => `
          <div class="pib-item">
            <span class="pib-item-icon" style="background:${item.color}20;color:${item.color}">${item.icon}</span>
            <span class="pib-item-text">${item.text}</span>
          </div>`).join('')}
      </div>
    </div>`
  };
}

function renderTipsBlock(title, emoji, tips, color) {
  return `
    <div class="tips-block">
      <div class="tips-block-title">${emoji} ${title}</div>
      <div class="tips-grid">
        ${tips.map(t => `
          <div class="tip-card">
            <div class="tip-icon">${t.icon}</div>
            <div>
              <div class="tip-title">${t.title}</div>
              <p class="tip-text">${t.text}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderNextPhase(currentPhase, cday, color) {
  const order = ['menstruelle', 'folliculaire', 'ovulation', 'luteale'];
  const idx = order.indexOf(currentPhase);
  const nextPhase = order[(idx + 1) % 4];
  const nextSci = PHASE_SCIENCE[nextPhase];
  const phaseLengths = { menstruelle: 5, folliculaire: 8, ovulation: 3, luteale: 12 };
  const daysInCurrentPhase = phaseLengths[currentPhase];
  const phaseStartDay = { menstruelle: 1, folliculaire: 6, ovulation: 14, luteale: 17 }[currentPhase];
  const daysLeft = Math.max(0, (phaseStartDay + daysInCurrentPhase) - cday);

  return `
    <div class="next-phase-block" style="border:1px solid ${nextSci.border};background:${nextSci.bg}">
      <div style="font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-soft);margin-bottom:10px">
        Prochaine phase dans ~${daysLeft} jour${daysLeft > 1 ? 's' : ''}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:32px">${nextSci.emoji}</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;color:var(--text-dark)">${nextSci.label}</div>
          <div style="font-size:13px;color:var(--text-soft)">${nextSci.days} · ${nextSci.hormone}</div>
        </div>
      </div>
    </div>`;
}
