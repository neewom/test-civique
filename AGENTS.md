# AGENTS.md — Test Civique 🇫🇷

Contexte projet et règles de fonctionnement, lus par tout agent de code travaillant sur ce dépôt (Claude Code l'importe via `@AGENTS.md` en tête de `CLAUDE.md`). Ce fichier contient tout ce qui est portable ; `CLAUDE.md` ne garde que le spécifique Claude Code.

Projet démarré en mars 2026 avec un agent seul ; passé au workflow TL + sous-agents le 2026-11-20 (décision de l'utilisateur). L'ancien `CLAUDE.md` est repris ici, corrigé là où il ne collait plus au code (chrono, format des questions).

---

## Workflow — TL + sous-agents dev v2.3 (2026-11-20)

Version complète : **`docs/workflow.md`** (copie du workflow commun `~/.claude/workflows/duo-tl-dev.md`), à lire en entier en début de rôle et avant une étape inhabituelle (batch empilé, revue). L'essentiel :

- **Rôles** : l'utilisateur donne les go, teste et valide (« <n> ok » = merge de cette PR) ; le **TL** est la **seule session** du projet : il cadre, rédige les tickets, **lance un sous-agent dev par carte** (gabarit `docs/sous-agent-dev.md`), revoit, donne les plans de test, merge, tient Trello et le journal. Le **sous-agent dev** traite une carte cadrée + ticket + go, ouvre une PR draft tout de suite, la passe en ready et rend un rapport final au TL. Le TL ne code pas les cartes lui-même (correctif trivial ou mécanique toléré).
- **Garde-fous** : diff relu et checks relancés par le TL, au moins une mesure visuelle par le TL pour toute carte d'interface, revue indépendante pour une carte `[L]` ou sensible ; questions ouvertes des rapports tranchées ou remontées, jamais perdues.
- **Boucle de relecture** : pour une carte `[M]`, `[L]` ou sensible (données des questions, stockage local, examen), dès le ready du sous-agent dev et avant la revue du TL, un sous-agent relecteur (`docs/relecteur.md`) relit le diff et le code qui lit ce qui change, avec le catalogue `docs/catalogue-bloquants.md`. Corrections, nouvelle relecture, jusqu'à « prête à fusionner » ; au-delà de 3 tours ou sur un point métier, remontée à l'utilisateur. Une carte `[S]` et les PR de doc gardent la seule revue du TL.
- **Carte** : cadrage validé dans le chat avant le board, taille `[S]` / `[M]` / `[L]`, ticket dev dans la carte, Done **et** entrée du journal dans la même respiration.
- **Batch** : un seul go ; tickets revérifiés sur le code avant le go ; un sous-agent à la fois ; cartes regroupées dans une liste « Batch — … », archivée une fois toutes les cartes traitées ; PR testées ensemble marquées comme un même **lot** au tableau de bord.
- **Revue** : une seule, au ready ; tests, lint, build lus en entier ; contrôle visuel mobile mesuré ; commentaire de PR ; plan de test **au tableau de bord seulement**, résumé court à l'utilisateur.
- **Maquettes** (décision de l'utilisateur, 2026-11-23) : toute l'appli est maquettée dans un Artifact privé, https://claude.ai/artifact/GaE1VRaaqK5fqND5BsBiqx (une page « Application actuelle », une page par carte d'interface). Tout ajout ou changement d'interface est d'abord répercuté dans les maquettes et **validé par l'utilisateur avant le go dev** ; le sous-agent dev reçoit les maquettes validées comme référence ; après le merge, le TL reporte le changement sur la page « Application actuelle ».
- **impeccable** sur toutes les cartes d'interface (décision du 2026-11-20) : `shape` au cadrage, chargé par le sous-agent dev avant d'éditer l'UI, `critique` / `audit` en relecture et en revue. `PRODUCT.md` (vérité produit) existe depuis le 2026-11-23. **Direction de design retenue par l'utilisateur (2026-11-23) : « la carte du parcours »** (page « La carte du parcours · toutes les pages » du canevas de maquettes) ; design system léger : thème shadcn personnalisé + quelques composants propres + `DESIGN.md` écrit avec impeccable une fois la refonte construite. Jusque-là, les maquettes validées font référence.
- **Git** : jamais de push sur `main` ; PR automatique ; défaut trouvé en test corrigé dans la même PR ; PR de doc convenue mergée dans la foulée ; version incrémentée par carte ; chacun ne supprime que ses branches ; jamais affirmer l'état d'une PR sans `gh pr view`.
- **Isolation** : sous-agents dev dans le worktree dev (port 5211), un à la fois, worktree laissé en HEAD détaché ; TL dans le worktree de revue (5212) ; relecteur sur une copie jetable (`vite preview` sur 5213) ; arrêt des serveurs par PID exact uniquement.
- **Économie** : messages synthétiques, une session TL par batch ou journée ; le TL propose `/save` lui-même aux états stables (voir `docs/workflow.md`, section 12).

### 0. Paramètres de Test Civique

| Paramètre | Test Civique |
|---|---|
| Branche de base des PR | `main` (production) |
| Environnement de recette | aucun : tests sur les ports des worktrees, puis en production |
| Ce qui déploie | `main` seul, sur Netlify (chaque merge = un déploiement) |
| Déploiements hors code | aucun |
| Worktrees et ports | dev `../test-civique-claude-dev` port **5211** (sous-agents dev) ; revue `../test-civique-review` port **5212** (TL) ; relecteur `vite preview` port **5213** ; créés par `scripts/agent-worktree.sh <agent>` |
| Nom de la session | « Test civique - TL » |
| Board Trello | « Test Civique » : Backlog · Todo · En cours · En review / test · Done (voir Board Trello) |
| Migrations | aucune (pas de base : données dans `src/data/questions.json`, état dans `localStorage`) |
| Tableau de bord des revues | API HTTP `http://100.123.59.74:8095` (Tailscale, sans jeton), projet `"Test civique"`, auteur `"Test civique - TL"` : le TL y écrit lui-même (`docs/workflow.md`, section 5). Chaque entrée porte un vrai lien de l'appli dans `lien_test` (serveur de revue HTTPS ou aperçu Netlify `https://deploy-preview-<n>--test-civique.netlify.app`, jamais Trello ni la doc) et le lien de prod dans `remarques` (demande de l'utilisateur, 2026-11-20) |
| Numéro de version | `package.json` (`npm version <minor\|patch> --no-git-tag-version`), parti de **1.0.0** le 2026-11-20 |
| Serveur accessible | **en HTTPS** : `https://mac-mini-de-vichith.tail5a5a34.ts.net:1<port>/` (revue **15212**, dev **15211**), publié par `tailscale serve` (réseau Tailscale seulement, **jamais `funnel`**), configuration persistante posée le 2026-11-20. On lance Vite comme d'habitude. Ne jamais lancer `tailscale serve reset` (Mothana et Panda y ont leurs entrées) ; retirer une entrée seulement par son port. Liens donnés à l'utilisateur et au tableau de bord : toujours ce lien HTTPS ; les contrôles des agents restent sur `http://localhost:<port>` |

---

## Produit

**Futur Citoyen** (nom retenu le 2026-11-24, ex-« Test Civique » ; le dépôt, le board et l'adresse du site gardent « test-civique » tant que le domaine n'est pas réservé) : application d'entraînement à l'examen civique, aujourd'hui pour la carte de séjour pluriannuelle (carte de résident et naturalisation annoncées « bientôt » sur l'accueil). Site indépendant, non officiel : mention en pied de l'accueil avec lien vers formation-civique.interieur.gouv.fr. Production : https://test-civique.netlify.app

Règles officielles (arrêté du 10 octobre 2025, art. 1 à 4) : 40 questions, 4 choix, une seule bonne réponse, 45 min au maximum, 1 point par bonne réponse et 0 sinon, réussite à 80 % (32/40). Rappelées dans le bloc repliable « Comment se passe l'examen » et dans la carte « Examen blanc » de l'accueil.

- **Examen blanc** : 40 questions tirées au hasard, **chrono global de 45 minutes** (pas de chrono par question ; un examen en cours sauvegardé garde son temps restant). Deux jeux au choix depuis l'accueil : questions classiques seules (191) ou avec les mises en situation (291). Chaque question : choix → « Valider » → correction avec explication → « Question suivante ». À l'expiration du chrono, les questions restantes comptent comme « sans réponse ». Le résultat affiche « Réussi » ou « Pas encore réussi » (seuil `passThreshold` = 80 % du total, arrondi au supérieur, dans `src/lib/exam.ts`), à l'écran de fin comme dans le détail d'un examen, calculé à partir du score enregistré. Progression sauvegardée à chaque seconde et reprenable depuis l'accueil.
- **Mode révision** : toutes les questions par thème, bonne réponse et explication ; filtres par thème et « sans les mises en situation » (en-tête fixe, filtres repliables).
- **Historique** : les 3 derniers examens sur l'accueil, détail d'un examen sur `/examen/:id`.
- **Thème clair / sombre** persistant.
- **Marque** : logo « la pousse » (`src/components/BrandLogo.tsx` dans l'en-tête de l'accueil ; `public/logo.svg`, `favicon.svg` aux traits épaissis, PNG 16/32/48, `apple-touch-icon.png`, `icon-512.png`, `og-image.png`, `site.webmanifest`). Couleurs : feuilles #8ED462 / #F5E211, encre #2C2E2A, « Futur » #3A7A2C en clair et #8ED462 en sombre. Titre d'onglet par page « <page> · Futur Citoyen » (`src/lib/use-document-title.ts`).

## Données et stockage

- `src/data/questions.json` : 291 questions. IDs **1–191 = questions officielles**, **192+ = mises en situation** (le filtre se fait sur `id <= 191`).
  ```json
  {
    "id": 1,
    "theme": "Principes et valeurs de la République",
    "question": "…",
    "answers": ["…"],
    "distractors": ["…", "…", "…", "…"],
    "explanation": "…",
    "group": "fete-nationale"
  }
  ```
  - `answers` : une ou plusieurs bonnes réponses ; l'examen en tire une au hasard, la révision et le détail affichent `answers[0]`.
  - `distractors` : souvent plus de 3 ; l'examen en tire 3 au hasard.
  - `group` (facultatif) : deux questions du même groupe ne tombent jamais dans le même examen.
- `localStorage` : `quiz-history` (liste d'`ExamRecord`), `exam-in-progress` (`ExamInProgress`), `theme` (`light` | `dark`). Types et accès à la progression dans `src/lib/exam-types.ts` ; l'historique est lu et écrit uniquement par `src/lib/history.ts` (lecture tolérante : données illisibles ou entrées incomplètes ignorées ; les anciens examens sans `id` ni `answers` restent listés à l'accueil, sans lien vers le détail). Changer la forme d'une de ces clés = penser aux données déjà stockées chez les utilisateurs.

## Stack

- React 19 + TypeScript + Vite 5 ; React Router 7 ; shadcn/ui (base-ui) + Tailwind 4 ; police Geist
- Vitest 2 + React Testing Library (jsdom) ; pas de tests e2e automatisés (contrôle visuel avec Playwright Python sur le serveur du worktree)
- Déploiement Netlify depuis `main` ; redirection SPA dans `public/_redirects`

## Structure

- `src/data/` — questions
- `src/lib/` — logique métier et types (`exam.ts` : tirage et sauvegarde de l'examen, `exam-types.ts`, `theme-context.ts`, `utils.ts`)
- `src/pages/` — `Home`, `Examen` (examen et écran de résultat), `ExamenDetail`, `Revision`
- `src/components/` — `ThemeProvider`, `ThemeSwitch` et composants shadcn (`ui/`, règle `react-refresh/only-export-components` coupée pour eux)

---

## Environnement de développement — ⚠️ règle critique

Machine partagée (Mac mini, pilotée à distance via Claude Code Remote Control, y compris depuis un smartphone), où tournent aussi Mothana (5174-5176), Panda Scoring (5184-5186), Job finder (5190-5192) et Home assistant (5201-5202). Pas d'instance permanente : chaque worktree démarre son serveur sur son port quand il en a besoin (`npm run dev -- --port <port> --strictPort --host`) et annonce le lien HTTPS.

- **Ne jamais faire `pkill -f vite`** (ni aucun kill par nom de processus)
- Arrêt d'un serveur uniquement par PID exact (le `node` de vite et son parent `npm exec`), après `lsof -nP -iTCP:<port> -sTCP:LISTEN`
- Node 25 sur la machine : son `localStorage` natif masque celui de jsdom ; Vitest lance donc ses workers avec `--no-experimental-webstorage` (`vite.config.ts`, PR #28). Ne pas retirer ce réglage

## Git — spécificités Test Civique

Règles générales : `docs/workflow.md`, section 6. Propre au projet :
- Branches `feature/…`, `fix/…`, `docs/…`, `chore/…` ; commits et PR en anglais, préfixes `feat:` · `fix:` · `docs:` · `chore:` · `refactor:` · `test:`
- **Identité Git** : identité par défaut du Mac mini (« mini »), ne pas la modifier
- Plus aucune exception pour pousser sur `main` (le fix Netlify `134a48f` du 2026-11 y est allé directement : à ne pas reproduire)

## Tests et vérifications

- Toujours écrire les tests Vitest pertinents : une fonctionnalité a ses tests (nominal + cas limites), un correctif a un test qui reproduit le bug
- **Ne jamais modifier un test existant sans raison écrite dans la PR**
- Avant tout push : `npm test`, `npm run lint` et `npm run build` verts (le build inclut `tsc -b`), sorties lues

## Conventions de code

- Code en anglais, UI en français (vouvoiement dans l'interface)
- Composants PascalCase, un fichier par composant ; réutiliser plutôt que dupliquer
- Pas de `any` sauf cas exceptionnel justifié en commentaire
- Implémenter uniquement ce qui est demandé ; en cas de doute, l'option la plus simple

---

## Board Trello « Test Civique »

Board : https://trello.com/b/p0hDnJZX (créé le 2026-11-20). Les identifiants vivent dans `.env` (jamais dans ce fichier) : `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID`, `TRELLO_LIST_BACKLOG`, `TRELLO_LIST_TODO`, `TRELLO_LIST_DOING`, `TRELLO_LIST_REVIEW`, `TRELLO_LIST_DONE` (modèle : `.env.example`).

- **Backlog** : idées non cadrées (l'utilisateur y note ses demandes hors session)
- **Todo** : cartes ordonnées par priorité ; étiquette verte « cadré » = ticket dev rédigé. Être en Todo n'autorise pas le démarrage : le go explicite de l'utilisateur reste requis
- **En cours** : une carte = un sous-agent = une PR en draft (commentaire « Dev en cours — sous-agent du TL, branche, PR #n »)
- **En review / test** : PR ready, revue du TL puis test par l'utilisateur
- **Done** : mergé, avec l'entrée correspondante dans `docs/journal-avancement.md`
- Toute carte déplacée ou créée va en haut de sa liste (`pos=top`) ; le TL annonce en une ligne toute carte qu'il crée d'office
- Listes « Batch — … » et « Pr <n> » : voir `docs/workflow.md`, sections 3 et 9 ; étiquette bleue « action admin » = tâche de l'utilisateur, ignorée au cadrage

Lecture d'une liste (jamais « Done » en scan de routine, `desc` seulement sur une carte précise) :
```
set -a; . ./.env; set +a
curl -s "https://api.trello.com/1/lists/${TRELLO_LIST_TODO}/cards?fields=name,shortUrl,labels&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"
```
Déplacer une carte : `curl -s -X PUT "https://api.trello.com/1/cards/<CARD_ID>?idList=<LIST_ID>&pos=top&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"`

## État d'avancement

Historique : `docs/journal-avancement.md`. Le board Trello est la source de vérité du backlog. Fichiers de session : `.claude/sessions/YYYY-MM-DD_<sujet>.md`.

## graphify

Graphe de connaissances dans `graphify-out/` (`graphify update .` après modification du code, AST seul). Questions larges : `graphify query "<question>" --budget 500` ; quand on sait quel fichier lire, le lire directement.
