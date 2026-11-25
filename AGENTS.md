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
- **Revue** : une seule, au ready ; tests, lint, build lus en entier ; contrôle visuel mobile mesuré ; commentaire de PR ; plan de test **au tableau de bord seulement**, résumé court à l'utilisateur. PR sans rien de testable avant le merge : « rien à tester de ton côté, donne ton go », et le TL vérifie lui-même en production.
- **Maquettes** (décision de l'utilisateur, 2026-11-23) : toute l'appli est maquettée dans un Artifact privé, https://claude.ai/artifact/GaE1VRaaqK5fqND5BsBiqx (une page « Application actuelle », une page par carte d'interface). Tout ajout ou changement d'interface est d'abord répercuté dans les maquettes et **validé par l'utilisateur avant le go dev** ; le sous-agent dev reçoit les maquettes validées comme référence ; après le merge, le TL reporte le changement sur la page « Application actuelle ».
- **impeccable** sur toutes les cartes d'interface (décision du 2026-11-20) : `shape` au cadrage, chargé par le sous-agent dev avant d'éditer l'UI, `critique` / `audit` en relecture et en revue. `PRODUCT.md` (vérité produit) existe depuis le 2026-11-23. **Direction de design retenue par l'utilisateur (2026-11-23) : « la carte du parcours »** (page « La carte du parcours · toutes les pages » du canevas de maquettes) ; design system léger : thème shadcn personnalisé + quelques composants propres. **`DESIGN.md` existe depuis le 2026-11-24** (racine du dépôt, écrit avec impeccable `document` sur la v1.6.1, sidecar `.impeccable/design.json`) : jetons, composants et règles visuelles de l'appli, à lire avant toute carte d'interface ; les maquettes validées d'une carte priment sur lui pour ce qu'elles changent, et `DESIGN.md` est mis à jour quand une carte fait évoluer le design system.
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
| Tableau de bord des revues | API HTTP `http://100.123.59.74:8095` (Tailscale, sans jeton), projet `"Test civique"`, auteur `"Test civique - TL"` : le TL y écrit lui-même (`docs/workflow.md`, section 5). Chaque entrée porte un vrai lien de l'appli dans `lien_test` (serveur de revue HTTPS ou aperçu Netlify `https://deploy-preview-<n>--test-civique.netlify.app`, jamais Trello ni la doc) et le lien de prod (https://futurcitoyen.fr) dans `remarques` (demande de l'utilisateur, 2026-11-20) |
| Numéro de version | `package.json` (`npm version <minor\|patch> --no-git-tag-version`), parti de **1.0.0** le 2026-11-20 |
| Serveur accessible | **en HTTPS** : `https://mac-mini-de-vichith.tail5a5a34.ts.net:1<port>/` (revue **15212**, dev **15211**), publié par `tailscale serve` (réseau Tailscale seulement, **jamais `funnel`**), configuration persistante posée le 2026-11-20. On lance Vite comme d'habitude. Ne jamais lancer `tailscale serve reset` (Mothana et Panda y ont leurs entrées) ; retirer une entrée seulement par son port. Liens donnés à l'utilisateur et au tableau de bord : toujours ce lien HTTPS ; les contrôles des agents restent sur `http://localhost:<port>` |

---

## Produit

**Futur Citoyen** (nom retenu le 2026-11-24, ex-« Test Civique » ; domaine https://futurcitoyen.fr depuis le 2026-11-24, l'ancienne adresse test-civique.netlify.app y redirige en 301 ; le dépôt, le board et les aperçus Netlify gardent « test-civique ») : application d'entraînement à l'examen civique, aujourd'hui pour la carte de séjour pluriannuelle (carte de résident et naturalisation annoncées « bientôt » sur l'écran du titre visé, `/titre`). Site indépendant, non officiel : mention en pied de l'accueil avec lien vers formation-civique.interieur.gouv.fr. Production : https://futurcitoyen.fr

Règles officielles (arrêté du 10 octobre 2025, art. 1 à 4) : 40 questions, 4 choix, une seule bonne réponse, 45 min au maximum, 1 point par bonne réponse et 0 sinon, réussite à 80 % (32/40). Rappelées sur la page « Comment se passe l'examen » (`/regles`, lien depuis l'accueil).

- **Examen blanc** : un seul examen, **conforme à la répartition officielle** (depuis la v1.9.0) : 40 questions tirées selon `EXAM_BLUEPRINT` de `src/lib/exam.ts` (nombre exact de questions par thème et sous-thème, dont 12 mises en situation, 6 en Principes et valeurs et 6 en Droits et devoirs ; une case qui manquerait de questions se complète dans son thème, puis dans le reste), **chrono global de 45 minutes** (pas de chrono par question ; un examen en cours sauvegardé garde son temps restant). L'étape 2 de l'accueil et « M'entraîner maintenant » sur `/regles` lancent toujours un nouvel examen ; l'examen en cours reste reprenable depuis l'accueil. Chaque question : choix → « Valider » → correction avec explication → « Question suivante ». À l'expiration du chrono, les questions restantes comptent comme « sans réponse ». Le résultat affiche « Réussi » ou « Pas encore réussi » (seuil `passThreshold` = 80 % du total, arrondi au supérieur, dans `src/lib/exam.ts`), à l'écran de fin comme dans le détail d'un examen, calculé à partir du score enregistré. Progression sauvegardée à chaque seconde et reprenable depuis l'accueil.
- **Mode révision** : toutes les questions par thème, bonne réponse et explication ; filtres par thème et « sans les mises en situation » (filtres en pastilles, qui défilent horizontalement sur téléphone).
- **Accueil en parcours** : titre visé (écran `/titre`, choix mémorisé), 4 étapes (réviser · réussir 3 examens blancs avec compteur « n sur 3 » = réussites d'affilée depuis l'examen le plus récent, un échec remet à 0, plafonné à 3, `src/lib/readiness.ts` · trouver un centre, « bientôt » · le jour J), reprise de l'examen en cours.
- **Mentions légales et confidentialité** (`/mentions-legales`, lien en pied de l'accueil) : éditeur CHITHDA (EURL), hébergeur Netlify, données restées dans le navigateur, statistiques GoatCounter sans cookie. Page à tenir à jour (texte et date `LAST_UPDATED` de `src/pages/MentionsLegales.tsx`) dès que la collecte de données change : publicité, paiement, nouveaux événements de statistiques. L'accueil rappelle en pied de page que la progression reste sur cet appareil et ce navigateur, avec un lien vers la section « Vos données » (`/mentions-legales#vos-donnees` ; `ScrollToTop` fait défiler jusqu'à l'ancre d'une adresse, depuis la v1.11.2).
- **Historique** : section « Derniers examens » (les 3 derniers) sur l'accueil, détail d'un examen sur `/examen/:id`.
- **Thème clair / sombre** persistant.
- **Marque** : logo « la pousse » (`src/components/BrandLogo.tsx` dans l'en-tête de l'accueil ; `public/logo.svg`, `favicon.svg` aux traits épaissis, PNG 16/32/48, `apple-touch-icon.png`, `icon-512.png`, `og-image.png`, `site.webmanifest`). Couleurs : feuilles #8ED462 / #F5E211, encre #2C2E2A, « Futur » #3A7A2C en clair et #8ED462 en sombre. Titre d'onglet par page « <page> · Futur Citoyen » (`src/lib/use-document-title.ts`).

## Données et stockage

- `src/data/questions.json` : 291 questions. IDs **1–191 = questions officielles**, **192+ = mises en situation** (le filtre se fait sur `id <= 191`).
  ```json
  {
    "id": 1,
    "theme": "Principes et valeurs de la République",
    "notion": "devise-symboles",
    "question": "…",
    "answers": ["…"],
    "distractors": ["…", "…", "…", "…"],
    "explanation": "…",
    "group": "fete-nationale",
    "source": { "url": "https://…", "label": "…" }
  }
  ```
  - `answers` : une ou plusieurs bonnes réponses ; l'examen en tire une au hasard, la révision et le détail affichent `answers[0]`.
  - `distractors` : souvent plus de 3 ; l'examen en tire 3 au hasard.
  - `group` (facultatif) : deux questions du même groupe ne tombent jamais dans le même examen.
  - `notion` (obligatoire) : sous-thème officiel, de la liste fermée `NOTIONS` de `src/lib/exam.ts` ; `mise-en-situation` pour les IDs 192+ et jamais pour 1–191 ; une notion classique n'appartient qu'à un thème. Classement 1–191 fait sur le fond (la liste officielle ne publie pas les sous-thèmes) ; vérifié par `src/data/notions.test.ts`, qui contrôle aussi qu'il y a assez de groupes distincts pour chaque case de `EXAM_BLUEPRINT`.
  - `source` (facultatif) : page officielle qui justifie la réponse, affichée sous l'explication (correction de l'examen, révision, détail d'un examen) par `src/components/SourceLink.tsx`. Renseigné pour les 53 questions de « Principes et valeurs de la République » (lot 1, v1.11.1) les 57 de « Système institutionnel et politique » (lot 2, v1.11.3) et les 56 de « Droits et devoirs » (lot 3, v1.11.4), surtout vers les fiches de formation-civique.interieur.gouv.fr ; les deux autres thèmes suivent avec les lots 4 et 5. `src/data/sources.test.ts` exige une URL `https://` sur un domaine accepté et un libellé.
- `localStorage` : `quiz-history` (liste d'`ExamRecord`), `exam-in-progress` (`ExamInProgress`), `theme` (`light` | `dark`), `target-title` (titre visé, chaîne brute : `pluriannuelle` seule valeur aujourd'hui ; lu et écrit uniquement par `src/lib/target-title.ts`, toute valeur inconnue ou illisible = pas de choix). Sans `target-title`, l'accueil renvoie vers l'écran du titre (`/titre`), sauf si un historique ou un examen en cours existe : la carte pluriannuelle est alors considérée comme choisie, sans rien écrire. Types et accès à la progression dans `src/lib/exam-types.ts` ; l'historique est lu et écrit uniquement par `src/lib/history.ts` (lecture tolérante : données illisibles ou entrées incomplètes ignorées ; les anciens examens sans `id` ni `answers` restent listés à l'accueil, sans lien vers le détail). Changer la forme d'une de ces clés = penser aux données déjà stockées chez les utilisateurs.

## Stack

- React 19 + TypeScript + Vite 5 ; React Router 7 ; shadcn/ui (base-ui) + Tailwind 4 ; police Atkinson Hyperlegible (auto-hébergée)
- Vitest 2 + React Testing Library (jsdom) ; pas de tests e2e automatisés (contrôle visuel avec Playwright Python sur le serveur du worktree)
- Déploiement Netlify depuis `main` ; redirection SPA dans `public/_redirects`
- **Statistiques de visite** (depuis la v1.7.0) : GoatCounter hébergé (site `futurcitoyen`, sans cookie, exempté de consentement), sans le script `count.js`. Module maison `src/lib/analytics.ts` : `navigator.sendBeacon` (repli `fetch` keepalive, `no-cors`) envoyé **directement** du navigateur à `https://futurcitoyen.goatcounter.com/count` (code du site écrit dans `analytics.ts` seulement) ; la CSP de `public/_headers` ouvre `connect-src` à cette seule origine, rien d'autre. Pas de proxy Netlify (essayé en v1.7.0) : GoatCounter classe en robots les requêtes venant d'IP de centre de données, les hits relayés étaient donc masqués (correctif v1.7.1). Comptage **uniquement** quand `location.hostname === 'futurcitoyen.fr'` (rien en local, sur les worktrees, les aperçus `deploy-preview-*` ni dans les tests). Envoyé : une page vue par nouveau `pathname` (`src/components/PageViewTracker.tsx`, sans la chaîne de recherche, référent seulement à la première), et 3 événements de `src/pages/Examen.tsx` : `examen-commence` (examen nouvellement tiré, pas une reprise), `examen-termine-reussi` / `examen-termine-pas-encore` (une fois par examen, chrono expiré compris). Aucune donnée personnelle, aucun score détaillé ; une panne d'envoi est avalée. Tout nouvel événement = un nom court en kebab-case dans `analytics.ts`. **Contrôle quotidien** (depuis le 2026-11-25, demande de l'utilisateur) : tâche planifiée « Futur Citoyen · contrôle quotidien GoatCounter » (vers 9 h 10, `~/.claude/scheduled-tasks/futur-citoyen-goatcounter-check/`), en lecture seule par l'API (clé `GOAT_COUNTER_API_KEY` du `.env`, droit d'export), qui remonte les cas anormaux (chemin ou événement inconnu, robots, rafales, référents suspects…). Nos propres contrôles en production sont comptés : les garder rares

## Structure

- `src/data/` — questions
- `src/lib/` — logique métier et types (`exam.ts` : tirage et sauvegarde de l'examen, `exam-types.ts`, `theme-context.ts`, `utils.ts`)
- `src/pages/` — `Home`, `Examen` (examen et écran de résultat), `ExamenDetail`, `Revision`, `Regles` (« Comment se passe l'examen », `/regles`), `TitreVise` (« Quel titre préparez-vous ? », `/titre`), `MentionsLegales` (« Mentions légales et confidentialité », `/mentions-legales`)
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
Lecture des 4 listes de routine d'un coup (début de session, `/start`). Le shell de la machine est **zsh** : pas de syntaxe propre à bash comme `${!var}` ; cette boucle marche sous zsh comme sous bash :
```
set -a; . ./.env; set +a
for pair in "Backlog:$TRELLO_LIST_BACKLOG" "Todo:$TRELLO_LIST_TODO" "En cours:$TRELLO_LIST_DOING" "En review / test:$TRELLO_LIST_REVIEW"; do
  echo "== ${pair%%:*}"
  curl -s "https://api.trello.com/1/lists/${pair##*:}/cards?fields=name,dateLastActivity,labels&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}" \
    | python3 -c "import sys,json;[print('-',c['name'],'|',c['dateLastActivity'][:10],'|',','.join(l['name'] for l in c['labels'])) for c in json.load(sys.stdin)]"
done
```
Déplacer une carte : `curl -s -X PUT "https://api.trello.com/1/cards/<CARD_ID>?idList=<LIST_ID>&pos=top&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"`

## État d'avancement

Historique : `docs/journal-avancement.md`. Le board Trello est la source de vérité du backlog. Fichiers de session : `.claude/sessions/YYYY-MM-DD_<sujet>.md`.

## graphify

Graphe de connaissances dans `graphify-out/` (`graphify update .` après modification du code, AST seul). Questions larges : `graphify query "<question>" --budget 500` ; quand on sait quel fichier lire, le lire directement.
