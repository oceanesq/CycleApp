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

function setDailyQuote() {
  const quotes = [
    { text: "On ne naît pas femme : on le devient.", source: "Simone de Beauvoir" },
    { text: "Je ne suis pas libre tant qu’une femme est prisonnière, même si ses chaînes sont très différentes des miennes.", source: "Audre Lorde" },
    { text: "Le silence ne nous protégera pas.", source: "Audre Lorde" },
    { text: "Je suis délibérément féministe.", source: "Chimamanda Ngozi Adichie" },
    { text: "Le féminisme est pour tout le monde.", source: "bell hooks" },
    { text: "Les femmes appartiennent à tous les lieux où se prennent les décisions.", source: "Ruth Bader Ginsburg" },
    { text: "Le combat pour les droits des femmes est un combat pour la justice.", source: "Ruth Bader Ginsburg" },
    { text: "Personne ne peut vous faire sentir inférieur sans votre consentement.", source: "Eleanor Roosevelt" },
    { text: "Le futur appartient à celles qui croient à la beauté de leurs rêves.", source: "Eleanor Roosevelt" },
    { text: "Je ne souhaite pas que les femmes aient du pouvoir sur les hommes, mais sur elles-mêmes.", source: "Mary Wollstonecraft" },

    { text: "Rien dans la vie n’est à craindre, tout est à comprendre.", source: "Marie Curie" },
    { text: "Dans la vie, rien n’est à craindre, tout est à comprendre. Il est temps de comprendre davantage, afin de craindre moins.", source: "Marie Curie" },
    { text: "Il faut persévérer et surtout avoir confiance en soi.", source: "Marie Curie" },
    { text: "Je n’ai jamais vu de femme faible. J’ai vu des femmes épuisées.", source: "Simone Veil" },
    { text: "Aucune femme ne devrait avoir à choisir entre sa liberté et sa sécurité.", source: "Simone Veil" },
    { text: "La liberté ne se donne pas, elle se prend.", source: "Simone de Beauvoir" },
    { text: "Changer le monde commence par refuser l’injustice.", source: "Angela Davis" },
    { text: "Je ne suis plus en train d’accepter les choses que je ne peux pas changer, je change les choses que je ne peux pas accepter.", source: "Angela Davis" },
    { text: "Une femme doit avoir de l’argent et une chambre à soi si elle veut écrire.", source: "Virginia Woolf" },
    { text: "Les femmes doivent être libres de définir leur propre destinée.", source: "Malala Yousafzai" },

    { text: "Un enfant, un professeur, un livre et un stylo peuvent changer le monde.", source: "Malala Yousafzai" },
    { text: "Je ne suis pas un oiseau ; aucun filet ne m’enferme.", source: "Charlotte Brontë (Jane Eyre)" },
    { text: "Je suis ma propre muse. Je suis le sujet que je connais le mieux.", source: "Frida Kahlo" },
    { text: "Je veux une vie immense.", source: "Frida Kahlo" },
    { text: "Le courage est comme un muscle. Nous le renforçons par l’usage.", source: "Ruth Bader Ginsburg" },
    { text: "Le doute tue plus de rêves que l’échec.", source: "Michelle Obama" },
    { text: "Il n’y a pas de limite à ce que nous pouvons accomplir en tant que femmes.", source: "Michelle Obama" },
    { text: "Je suis venue ici pour dire que l’égalité n’attend pas.", source: "Emmeline Pankhurst" },
    { text: "Les femmes ne seront jamais libres tant qu’elles ne contrôleront pas leur propre corps.", source: "Margaret Sanger" },
    { text: "La maternité doit être un choix, pas une obligation.", source: "Simone Veil" },

    { text: "L’acte le plus courageux est encore de penser par soi-même. À haute voix.", source: "Coco Chanel" },
    { text: "Une femme forte regarde un défi droit dans les yeux et lui fait un clin d’œil.", source: "Gina Carey" },
    { text: "Je ne serai pas la femme qu’on attend de moi. Je serai celle que je décide d’être.", source: "Nawal El Saadawi" },
    { text: "Le patriarcat est un système, pas une fatalité.", source: "Nawal El Saadawi" },
    { text: "Le pouvoir n’est pas donné. Il est pris.", source: "Aung San Suu Kyi" },
    { text: "Je suis une femme, phénoménalement.", source: "Maya Angelou" },
    { text: "Si vous n’aimez pas quelque chose, changez-le. Si vous ne pouvez pas le changer, changez votre attitude.", source: "Maya Angelou" },
    { text: "Je refuse d’être réduite au silence.", source: "Maya Angelou" },
    { text: "La vérité vous libérera, mais d’abord elle vous mettra en colère.", source: "Gloria Steinem" },
    { text: "Une femme sans homme, c’est comme un poisson sans bicyclette.", source: "Gloria Steinem" },

    { text: "L’éducation est l’arme la plus puissante pour changer le monde.", source: "Wangari Maathai" },
    { text: "La passion est la clé de la réussite.", source: "Ada Lovelace" },
    { text: "Ce cerveau est plus qu’un simple organe : c’est une révolution.", source: "Sally Ride" },
    { text: "Les femmes peuvent être scientifiques, ingénieures, et leaders.", source: "Mae Jemison" },
    { text: "Le plus important est de ne jamais cesser de poser des questions.", source: "Jane Goodall" },
    { text: "Chaque individu compte. Chaque individu a un rôle à jouer.", source: "Jane Goodall" },
    { text: "Nos corps ne sont pas des problèmes à corriger, mais des forces à comprendre.", source: "Lunaire" },
    { text: "Votre cycle n’est pas une faiblesse : c’est un rythme biologique puissant.", source: "Lunaire" },
    { text: "Être femme n’est pas une limite. C’est une énergie.", source: "Lunaire" }
  ];

  const today = new Date();
  const index = (today.getFullYear() + today.getMonth() + today.getDate()) % quotes.length;

  document.getElementById("daily-quote-text").textContent = `"${quotes[index].text}"`;
  document.getElementById("daily-quote-source").textContent = `— ${quotes[index].source}`;
}

function initHormoneChart() {
  const canvas = document.getElementById("hormoneChart");
  if (!canvas) return;

  const labels = Array.from({ length: 28 }, (_, i) => i + 1);

  // Courbes hormonales typiques (valeurs normalisées)
  const estrogen = [20,20,22,25,30,38,45,55,65,75,85,95,100,90,70,50,40,38,35,33,30,28,25,22,20,18,18,18];
  const progesterone = [5,5,5,5,5,5,6,7,8,10,12,14,15,18,30,45,60,70,80,85,90,92,88,75,55,30,15,8];
  const lh = [5,5,5,5,5,5,5,6,6,7,8,10,20,100,25,10,6,5,5,5,5,5,5,5,5,5,5,5];
  const fsh = [25,22,20,18,17,16,15,14,13,12,12,13,15,22,14,12,11,10,10,10,10,10,10,11,12,15,18,22];

  // Plugin : fond coloré par phase
  const phaseBackgroundPlugin = {
    id: "phaseBackground",
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;

      const { left, right, top, bottom } = chartArea;

      // couleurs du site (identiques App.getPhaseColor)
      const phases = [
        { start: 1, end: 5, color: "rgba(249, 96, 133, 0.12)" },   // menstruelle
        { start: 6, end: 13, color: "rgba(255, 224, 102, 0.18)" }, // folliculaire
        { start: 14, end: 16, color: "rgba(184, 234, 217, 0.18)" },// ovulation
        { start: 17, end: 28, color: "rgba(221, 208, 255, 0.20)" } // lutéale
      ];

      phases.forEach(p => {
        const xStart = scales.x.getPixelForValue(p.start) - (scales.x.getPixelForValue(p.start + 1) - scales.x.getPixelForValue(p.start)) / 2;
        const xEnd = scales.x.getPixelForValue(p.end) + (scales.x.getPixelForValue(p.end) - scales.x.getPixelForValue(p.end - 1)) / 2;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.fillRect(xStart, top, xEnd - xStart, bottom - top);
        ctx.restore();
      });

      // petite séparation verticale douce
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;

      [5.5, 13.5, 16.5].forEach(day => {
        const x = scales.x.getPixelForValue(day);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      });

      ctx.restore();
    }
  };

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Œstrogènes", data: estrogen, borderWidth: 2, tension: 0.35, pointRadius: 0 },
        { label: "Progestérone", data: progesterone, borderWidth: 2, tension: 0.35, pointRadius: 0 },
        { label: "LH", data: lh, borderWidth: 2, tension: 0.35, pointRadius: 0 },
        { label: "FSH", data: fsh, borderWidth: 2, tension: 0.35, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            padding: 14,
            font: { size: 12 }
          }
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: { display: false }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 }
          },
          title: {
            display: true,
            text: "Jour du cycle (28 jours)",
            font: { size: 12, weight: "500" }
          }
        }
      }
    },
    plugins: [phaseBackgroundPlugin]
  });
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
  setDailyQuote();
  initHormoneChart();
});
