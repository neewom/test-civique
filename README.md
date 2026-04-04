# Test Civique 🇫🇷

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://test-civique.netlify.app)

Application de préparation à l'examen civique requis pour l'obtention d'un titre de séjour pluriannuel, d'une carte de résident ou de la nationalité française.

---

## Fonctionnalités

- **Examen blanc** — 40 questions tirées aléatoirement, timer global de 40 minutes. Deux modes au choix : questions classiques uniquement (191 questions officielles) ou avec les mises en situation (291 questions). La progression est sauvegardée automatiquement et peut être reprise depuis la page d'accueil.
- **Mode révision** — listing complet des questions organisées par thème, avec la bonne réponse et une explication pour chacune. Filtres par thème et par type de question.
- **Historique des examens** — les résultats passés sont conservés localement et accessibles depuis la page d'accueil.
- **Dark mode** — thème clair/sombre persistant via `localStorage`.

## Stack

| Outil | Rôle |
|---|---|
| [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) | Interface et logique applicative |
| [Vite](https://vitejs.dev) | Bundler et serveur de développement |
| [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com) | Composants et styles |
| [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com) | Tests unitaires et d'intégration |
| [Netlify](https://www.netlify.com) | Déploiement continu depuis `main` |

## Lancer le projet en local

```bash
git clone https://github.com/neewom/test-civique.git
cd test-civique
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

Pour lancer les tests :

```bash
npm test
```

## Structure du projet

```
src/
├── data/         Questions au format JSON
├── lib/          Logique métier (types, gestion de la progression, utilitaires)
├── pages/        Pages React (Home, Examen, Révision, Historique…)
└── components/   Composants UI réutilisables (shadcn/ui + surcharges)
```

## Données

Les questions sont définies dans `src/data/questions.json`. Le fichier peut être modifié manuellement pour ajouter, corriger ou supprimer des questions.

Format d'une question :

```json
{
  "id": 1,
  "theme": "République & valeurs",
  "question": "Quelle est la devise de la République française ?",
  "answers": ["Liberté, Égalité, Fraternité"],
  "distractors": ["Unité, Foi, Travail", "Liberté, Sécurité, Propriété", "Égalité, Justice, Paix"],
  "explanation": "La devise « Liberté, Égalité, Fraternité » est inscrite dans la Constitution de 1958."
}
```

| Champ | Description |
|---|---|
| `id` | Identifiant unique (entier). Les IDs 1–191 désignent les questions officielles ; 192 et au-delà désignent les mises en situation. |
| `theme` | Thème de la question (utilisé pour les filtres en mode révision). |
| `question` | Intitulé de la question. |
| `answers` | Tableau des bonnes réponses (une ou plusieurs selon la question). |
| `distractors` | Propositions incorrectes affichées comme choix. |
| `explanation` | Explication affichée après validation de la réponse. |
