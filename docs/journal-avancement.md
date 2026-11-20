# Journal d'avancement — Test Civique

Une entrée par carte terminée (résumé, décisions, bugs trouvés en testant, PR). Ajoutée dans la même respiration que le passage de la carte Trello en Done. Avant le 2026-11-20 : voir l'historique Git (PR #1 à #26).

## 2026-11-20 — Passage au workflow TL + sous-agents (pas de carte)
Décisions de l'utilisateur : le TL est la seule session et confie le dev à des sous-agents ; board Trello « Test Civique » (https://trello.com/b/p0hDnJZX) ; plans de test au tableau de bord des revues ; worktrees `test-civique-claude-dev` (5211) et `test-civique-review` (5212), relecteur sur 5213, liens HTTPS par `tailscale serve` (15211 / 15212) ; version de départ 1.0.0 ; impeccable sur les cartes d'interface. `CLAUDE.md` devient `AGENTS.md` (chrono global de 40 min et format `answers` / `group` corrigés). Constaté au passage : 36 tests rouges sous Node 25 (`localStorage` natif), 7 erreurs de lint, thèmes en doublon dans les données.

## 2026-11-20 — [S] Remettre les tests au vert sous Node 25 (PR #28, v1.0.1)
Sous Node 25, le `localStorage` natif de Node masquait celui de jsdom : 36 tests rouges. Correctif : `test.poolOptions.forks.execArgv: ['--no-experimental-webstorage']` dans `vite.config.ts` (option retenue plutôt qu'un flag dans les scripts npm, pour couvrir aussi `npx vitest`). 100/100 tests, build vert ; le lint garde ses 7 erreurs (carte suivante). Premier passage du workflow sous-agent : sans accroc. Au passage, règle ajoutée à `AGENTS.md` : lien de test de l'appli et lien de prod sur chaque entrée du tableau de bord.
