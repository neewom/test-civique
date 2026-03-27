# Test Civique 🇫🇷

Application d'entraînement à l'examen civique CSP (Carte de Séjour Pluriannuelle).

## Fonctionnalités
- Examen blanc : 40 questions aléatoires, chrono 60s par question, score final
- Mode révision : listing de toutes les questions avec réponse et explication

## Stack
- React + TypeScript + Vite
- React Router
- shadcn/ui + Tailwind
- Vitest + React Testing Library
- localStorage pour l'historique des examens

## Structure
- `src/data/questions.json` — les 191 questions officielles CSP
- `src/lib/` — logique métier
- `src/pages/` — pages React
- `src/components/` — composants UI

## Format questions.json
{
  "id": 1,
  "theme": "République & valeurs",
  "question": "...",
  "answer": "...",
  "distractors": ["...", "...", "..."],
  "explanation": "..."
}

## Workflow Git
- Ne jamais pusher directement sur `main`
- Toujours créer une branche : `feature/xxx` ou `fix/xxx`
- Toujours créer une PR après le push
- `main` déploie automatiquement sur Netlify
- Exception : le commit initial peut aller sur `main`

## Conventions de commit
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation

## Tests
- Toujours écrire les tests avec Vitest
