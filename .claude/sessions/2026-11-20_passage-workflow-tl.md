# Session 2026-11-20 — Passage au workflow TL + sous-agents (TL)

## Réalisé
- Tour complet du projet, des CLAUDE.md local et global, des workflows et commandes globales.
- Global (`~/.claude`, hors dépôt) : traces du duo TL/dev retirées (workflow `duo-tl-dev.md` passé en v2.3, nom de fichier conservé ; `/start`, `/save`, CLAUDE.md global) ; test-civique ajouté au registre des ports de `demarrage-projet.md`.
- Board Trello « Test Civique » créé (https://trello.com/b/p0hDnJZX), listes + étiquettes, identifiants dans `.env` (clés reprises de Panda).
- `tailscale serve` persistant : 15211 → 5211 (dev), 15212 → 5212 (revue).
- PR #27 `chore/tl-workflow-setup` (ouverte, non draft) : AGENTS.md, CLAUDE.md, docs (workflow, sous-agent-dev, relecteur, catalogue, journal), script de worktrees, allowedHosts Vite, `.gitignore`, version 1.0.0. Plan de test au tableau de bord (projet « Test civique » créé).
- 6 cartes au Backlog (non cadrées) : tests Node 25, lint, thèmes en doublon, pages vides, PRODUCT/DESIGN.md, accès historique dans `src/lib`.

## Reste à faire
- Après le « 27 ok » : merger #27, retirer l'entrée #27 du tableau de bord, `git pull --ff-only`, créer les worktrees (`scripts/agent-worktree.sh claude-dev` puis `review`), relancer la session TL dans `../test-civique-review` (« Test civique - TL »).
- Cadrer la carte 1 (tests Node 25) en premier.

## Blockers
- 36 tests rouges sous Node 25 et 7 erreurs de lint, déjà sur `main` : aucun push ne peut avoir des checks verts avant les cartes 1 et 2.

## Décisions (utilisateur, 2026-11-20)
- Plus de duo TL/dev : le TL est la seule session et distribue le dev à des sous-agents.
- Trello oui, tableau de bord des revues oui, worktrees 5211 / 5212 (relecteur 5213), version 1.0.0, impeccable sur les cartes d'interface, HTTPS par tailscale serve.
- Choix du TL (modifiable) : boucle de relecture sur les cartes `[M]`, `[L]` ou sensibles seulement, comme Panda.
- Hors périmètre : Panda (CLAUDE.md / AGENTS.md) mentionne encore une session dev dédiée possible, non modifié.
