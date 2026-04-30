/* ─── Paramètres & gestion des sports ─── */

// 20 sports les plus pratiqués en France (source : INJEP / Ministère des Sports 2022-2023)
const SPORTS_BASE = [
  { name: 'Marche / Randonnée',       emoji: '🥾' },
  { name: 'Natation',                  emoji: '🏊' },
  { name: 'Course à pied',             emoji: '🏃' },
  { name: 'Cyclisme / Vélo',           emoji: '🚴' },
  { name: 'Musculation / Fitness',     emoji: '💪' },
  { name: 'Yoga',                      emoji: '🧘' },
  { name: 'Football',                  emoji: '⚽' },
  { name: 'Tennis',                    emoji: '🎾' },
  { name: 'Pilates',                   emoji: '🤸' },
  { name: 'Danse',                     emoji: '💃' },
  { name: 'HIIT',                      emoji: '⚡' },
  { name: 'Arts martiaux / Judo',      emoji: '🥋' },
  { name: 'Basket-ball',               emoji: '🏀' },
  { name: 'Ski / Sports d\'hiver',     emoji: '🎿' },
  { name: 'Équitation',                emoji: '🏇' },
  { name: 'Stretching / Mobilité',     emoji: '🙆' },
  { name: 'Escalade',                  emoji: '🧗' },
  { name: 'Badminton',                 emoji: '🏸' },
  { name: 'Rugby',                     emoji: '🏉' },
  { name: 'CrossFit',                  emoji: '🔥' },
];

/* ─── Persistance ─── */
function loadSportPrefs() {
  try {
    const raw = localStorage.getItem('lunaire_sport_prefs');
    if (!raw) return { favorites: [], custom: [] };
    const parsed = JSON.parse(raw);
    if (!parsed.favorites) parsed.favorites = [];
    if (!parsed.custom) parsed.custom = [];
    return parsed;
  } catch(e) {
    return { favorites: [], custom: [] };
  }
}

function saveSportPrefs(prefs) {
  localStorage.setItem('lunaire_sport_prefs', JSON.stringify(prefs));
}

function getAllSports() {
  const prefs = loadSportPrefs();
  return [...SPORTS_BASE, ...prefs.custom];
}

/* ─── Page Paramètres ─── */
function initParametres() {
  renderMasterGrid();
  renderFavPreview();
}

function renderMasterGrid() {
  const grid = document.getElementById('sports-master-grid');
  if (!grid) return;

  const prefs = loadSportPrefs();
  const all = getAllSports();

  grid.innerHTML = all.map(sport => {
    const isFav = prefs.favorites.includes(sport.name);
    const isCustom = prefs.custom.some(c => c.name === sport.name);
    // Échapper les apostrophes pour l'attribut onclick
    const safeName = sport.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
    <div class="sport-tile${isFav ? ' selected' : ''}" onclick="toggleFavSport('${safeName}')">
      <div class="sport-tile-check">${isFav ? '✓' : ''}</div>
      ${isCustom ? `<button class="sport-tile-delete" onclick="event.stopPropagation();deleteCustomSport('${safeName}')" title="Supprimer">×</button>` : ''}
      <div class="sport-tile-emoji">${sport.emoji}</div>
      <div class="sport-tile-name">${sport.name}</div>
    </div>`;
  }).join('');

  // Badge compteur
  const badge = document.getElementById('fav-count-badge');
  if (badge) {
    const n = prefs.favorites.length;
    badge.textContent = n === 0 ? 'Aucun sélectionné' : `${n} sélectionné${n > 1 ? 's' : ''}`;
    badge.style.background  = n > 0 ? 'var(--mint-100)' : 'var(--pink-50)';
    badge.style.color       = n > 0 ? '#1a6045'         : 'var(--text-soft)';
    badge.style.borderColor = n > 0 ? 'var(--mint-200)' : 'var(--pink-100)';
  }
}

function renderFavPreview() {
  const prefs = loadSportPrefs();
  const card  = document.getElementById('fav-summary-card');
  const chips = document.getElementById('fav-preview-chips');
  if (!card || !chips) return;

  if (prefs.favorites.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';
  const all = getAllSports();
  chips.innerHTML = prefs.favorites.map(name => {
    const sport = all.find(s => s.name === name);
    return `<span class="chip mint active" style="pointer-events:none">${sport ? sport.emoji : '🏅'} ${name}</span>`;
  }).join('');
}

function toggleFavSport(name) {
  const prefs = loadSportPrefs();
  const idx = prefs.favorites.indexOf(name);
  if (idx > -1) prefs.favorites.splice(idx, 1);
  else prefs.favorites.push(name);
  saveSportPrefs(prefs);
  renderMasterGrid();
  renderFavPreview();
  const verb = idx > -1 ? 'retiré des' : 'ajouté aux';
  showToast(`${name} ${verb} favoris`, idx > -1 ? '—' : '✓');
}

function deleteCustomSport(name) {
  if (!confirm(`Supprimer "${name}" de ta liste ?`)) return;
  const prefs = loadSportPrefs();
  prefs.custom    = prefs.custom.filter(c => c.name !== name);
  prefs.favorites = prefs.favorites.filter(f => f !== name);
  saveSportPrefs(prefs);
  renderMasterGrid();
  renderFavPreview();
  showToast(`${name} supprimé`, '🗑️');
}

function addCustomSport() {
  const input      = document.getElementById('custom-sport-input');
  const emojiSel   = document.getElementById('custom-sport-emoji');
  const name       = (input.value || '').trim();
  if (!name) { input.focus(); return; }

  const prefs = loadSportPrefs();
  const all   = getAllSports();
  if (all.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('Ce sport est déjà dans la liste !', '⚠️');
    return;
  }

  const emoji = emojiSel ? emojiSel.value : '🏅';
  prefs.custom.push({ name, emoji });
  prefs.favorites.push(name); // auto-favori
  saveSportPrefs(prefs);

  input.value = '';
  renderMasterGrid();
  renderFavPreview();
  showToast(`${emoji} ${name} ajouté !`, '✓');
}

/* ─── Injection dans le journal ─── */
function renderSportChipsJournal() {
  const favChips    = document.getElementById('sport-type-chips');
  const othersChips = document.getElementById('sport-others-chips');
  const othersToggle = document.getElementById('sport-others-toggle');
  if (!favChips) return;

  const prefs = loadSportPrefs();
  const all   = getAllSports();

  /* — Favoris — */
  if (prefs.favorites.length === 0) {
    favChips.innerHTML = `
      <div style="width:100%;padding:12px 14px;background:var(--yellow-50);border:1px solid var(--yellow-200);border-radius:var(--radius-sm)">
        <p style="font-size:13px;color:#8a6b00;margin-bottom:8px">Aucun sport favori configuré.</p>
        <button class="btn btn-outline" style="padding:7px 16px;font-size:13px" onclick="navigate('parametres')">Configurer mes sports →</button>
      </div>`;
  } else {
    favChips.innerHTML = prefs.favorites.map(name => {
      const sport = all.find(s => s.name === name) || { emoji: '🏅' };
      return `<button class="chip mint" data-value="${name}" onclick="toggleChip(this,'sport_type',false)">${sport.emoji} ${name}</button>`;
    }).join('');
  }

  /* — Autres sports (non favoris) — */
  if (!othersChips || !othersToggle) return;
  const others = all.filter(s => !prefs.favorites.includes(s.name));
  if (others.length === 0) {
    othersToggle.style.display = 'none';
  } else {
    othersToggle.style.display = 'block';
    othersChips.innerHTML = others.map(s =>
      `<button class="chip mint" data-value="${s.name}" onclick="toggleChip(this,'sport_type',false)">${s.emoji} ${s.name}</button>`
    ).join('');
  }
}

/* — Toggle panel "autres" dans le journal — */
let othersOpen = false;
function toggleOtherSports() {
  othersOpen = !othersOpen;
  const panel = document.getElementById('sport-others-panel');
  const arrow = document.getElementById('sport-others-arrow');
  if (panel) panel.style.display = othersOpen ? 'block' : 'none';
  if (arrow) arrow.textContent   = othersOpen ? '−' : '+';
}
