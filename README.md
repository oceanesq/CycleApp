# Cycle App

Application web de suivi du cycle menstruel. Fonctionne entièrement en local, sans serveur ni compte — toutes les données restent dans le navigateur (localStorage).

## Fonctionnalités

- **Journal quotidien** — saignement, humeur, énergie, sommeil, alimentation, sport, notes libres
- **Ma phase** — phase hormonale du jour avec explications scientifiques et courbe hormonale
- **Cycles** — historique visuel de tous les cycles, détection automatique
- **Insights** — graphiques d'analyse sur l'ensemble des données (humeur, énergie, sport…)
- **Import Apple Health** — import de données depuis un export XML ou PDF Apple Santé
- **Aucune donnée envoyée** — 100 % offline, stockage localStorage

## Lancement

Ouvrir `index.html` directement dans un navigateur. Aucun build, aucun serveur requis.

```
cycle_app/
└── index.html   ← ouvrir ce fichier
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Structure | HTML5 |
| Style | CSS vanilla (design tokens, pas de framework) |
| Logique | JavaScript vanilla (ES6+, pas de bundler) |
| Graphiques | [Chart.js 4.4](https://www.chartjs.org/) (CDN) |
| Polices | Google Fonts — Playfair Display + DM Sans |
| Persistance | `localStorage` (clé `lunaire_data`) |

## Structure des fichiers

```
index.html          Structure HTML de toutes les pages (SPA)

css/
  style.css         Design tokens, reset, nav, composants réutilisables
  pages.css         Styles spécifiques à chaque page

js/
  app.js            État global (App.data), routeur, localStorage, graphique hormonal home
  journal.js        Saisie et restauration du journal quotidien
  pages.js          Page Cycles + page Insights (calendrier, graphiques d'analyse)
  phase.js          Page Ma Phase — science hormonale, SVG de phase, courbe
  parametres.js     Gestion des sports favoris
  import.js         Import Apple Health (XML et PDF)
```

## Modèle de données

Toutes les données sont stockées sous `localStorage["lunaire_data"]`, structure :

```json
{
  "2025-05-01": {
    "bleeding": "Règles moyennes",
    "bleeding_texture": "Fluide",
    "mood": ["Sereine", "Motivée"],
    "energy": 3,
    "sleep_hours": 7.5,
    "food": ["Sucré", "Salé"],
    "sport_done": "Oui",
    "sport_type": ["Yoga"],
    "sport_intensity": 2,
    "notes": "..."
  }
}
```

Les clés sont des dates au format `YYYY-MM-DD`. Les champs sont tous optionnels.

## Paramètres utilisateur

Stockés séparément sous `localStorage["lunaire_prefs"]` :

```json
{
  "favoriteSports": ["Yoga", "Course", "Natation"]
}
```

## Axes d'amélioration connus

- Les courbes hormonales sont définies en double (`app.js` et `phase.js`) — à centraliser dans un fichier `constants.js`
- `drawAllCharts()` (pages.js) gère 10 graphiques en une seule fonction de ~350 lignes — à découper
- La génération de HTML via template strings JS (pages.js, phase.js, import.js) rend le débogage difficile
- `detectCycles()` est recalculé plusieurs fois par navigation — un cache simple diviserait les appels
- Nombreux styles `style="..."` inline dans index.html qui pourraient être des classes CSS

## Auteur

Océane — projet personnel, 2025
