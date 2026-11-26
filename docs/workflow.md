# Workflow « TL + sous-agents dev » — v2.3 (2026-11-20)

Workflow générique pour un projet mené par **une session lead tech (TL)** et l'utilisateur, sur une même machine ; le développement est confié à des **sous-agents dev** que le TL lance, une carte à la fois (section 13). Né de Panda Scoring et Mothana. **v2.3 (2026-11-20, décision de l'utilisateur)** : le TL est la seule session du projet ; il orchestre et distribue tout le développement à des sous-agents.

Un projet qui l'adopte en **copie** le contenu utile dans son `AGENTS.md`, avec la mention « Workflow TL + sous-agents dev v2 (date) » et ses paramètres (section 0). Une évolution de ce fichier ne change pas un projet en cours : son TL propose la mise à jour, l'utilisateur décide. Le démarrage d'un projet suit `demarrage-projet.md`. **v2.1 (2026-10-29, décision de l'utilisateur)** : boucle de relecture avant le relecteur final (section 13), née de Job finder (8 bloquants trouvés par le relecteur final sur deux PR malgré la revue du TL et une revue indépendante).

---

## 0. Paramètres du projet

À fixer au démarrage et à écrire dans l'`AGENTS.md` du projet :

| Paramètre | Exemples |
|---|---|
| Branche de base des PR | `main` (Panda) ; `dev` avec promotions `dev` → `main` (Mothana) |
| Environnement de recette | aucun (Panda) ; branche `dev` déployée sur une URL de recette (Mothana) |
| Ce qui déploie | `main` seul (quota partagé) ; `main` + `dev` |
| Promotion vers la prod (projet avec recette) | ex. PR `dev` → `main` créée et mergée par le TL sur le go de l'utilisateur, commit de fusion, **sans jamais supprimer la branche de recette** |
| Déploiements hors code | ce qui ne part pas au push / merge et se déploie à la main (ex. Edge Functions Supabase : `supabase functions deploy <nom>` après chaque modification) |
| Worktrees et ports | dev `../<projet>-claude-dev` port N (sous-agents dev) ; revue `../<projet>-review` port N+1 (TL) (registre des ports : `demarrage-projet.md`) |
| Nom de la session | « <Projet> - TL » |
| Board Trello | Backlog · Todo · En cours · En review / test · Done (noms libres, ordre fixe, voir 9) |
| Migrations | outil et commande (script npm, CLI Supabase, psql…) ; en prod, exécutées par le TL ou par l'utilisateur (choix fait au démarrage, modifiable) |
| Tableau de bord des revues | API HTTP du dashboard (adresse Tailscale), voir 5 |
| Numéro de version | fichier qui le porte (`package.json`…) |

## 1. Rôles

- **Utilisateur** : seul à donner le go d'une carte ou d'un batch ; seul à valider une PR après son test ; lance la session TL dans son worktree et lui attribue son rôle par le message de démarrage ; seul à approuver ce que le mode de permissions bloque. Donne ses retours de test au TL.
- **Lead tech (TL) / PO / reviewer** : cadre, découpe, tranche l'architecture, rédige les tickets, **lance un sous-agent dev par carte** (section 13), revoit les PR, donne les plans de test, merge après le « ok », tient le board et le journal. Ne code pas les cartes lui-même (correctif trivial ou mécanique toléré).
- **Dev (sous-agent du TL)** : ne traite qu'une carte cadrée, avec ticket et go ; implémente, teste, ouvre et passe la PR en ready, puis rend un rapport final au TL ; ne pouvant pas poser de question en cours de route, il fait la partie sûre et remonte dans son rapport toute ambiguïté d'architecture, de périmètre, de sécurité ou de modèle de données.

## 2. Cycle d'une carte

1. **Backlog** : l'utilisateur note ses idées à la volée.
2. **Cadrage** (TL, un sujet à la fois) : on en discute dans le chat ; maquette publiée en artifact quand la carte touche l'UX ; **le cadrage est validé dans le chat avant d'être écrit sur le board**. Taille en tête du titre : `[S]` (1 à 3 fichiers, tests ciblés), `[M]` (plusieurs composants ou logique métier, tests complets et QA), `[L]` (transversal, migration ou architecture : découper avant de coder).
3. **Ticket de dev** dans la description de la carte (section `## Ticket dev`) : objectif · périmètre (inclus / exclu) · zones du code (graphify) · décisions prises · contraintes · critères d'acceptation vérifiables · ce que le dev tranche seul / ce qu'il remonte. Étiquette « cadré », carte en Todo, Todo reclassé par priorité et complexité.
4. **Go** de l'utilisateur, redemandé même pour une carte déjà cadrée ; un accord qui date se revérifie (le ticket colle-t-il toujours au code ?).
5. **Dev** (sous-agent lancé par le TL) : branche depuis la base, **PR en draft ouverte tout de suite**, commentaire Trello « Dev en cours — sous-agent du TL, branche, PR #n », carte en « En cours ».
6. **Pas de boucle draft avec l'utilisateur** : le sous-agent va jusqu'au ready sans interlocuteur ; les choix qu'il a faits seul figurent dans son rapport et dans la PR.
7. **Ready for review** : le sous-agent repasse la PR, commente « prête pour review », déplace la carte en « En review / test » ; son **rapport final** prévient le TL (pas de message).
8. **Revue** (section 4), puis **plan de test** à l'utilisateur et au tableau de bord (section 5).
9. **Test** par l'utilisateur ; ses retours, donnés au TL, se traitent sur la même PR (en lot si une liste « Pr <n> » est utilisée) par un sous-agent relancé avec ces retours (ou en reprenant le même sous-agent) ; une remarque fonctionnelle peut ramener la PR en draft.
10. **« <n> ok »** de l'utilisateur = autorisation de merger cette PR-là (un « ok » sans numéro n'en est pas une). Le TL merge.
11. **Après le merge** : carte en Done **et** entrée dans `docs/journal-avancement.md`, dans la même respiration ; une fois le déploiement en ligne, **TNR sur la production** (`TNR_BASE_URL=https://futurcitoyen.fr npm run tnr`, Test Civique) : un échec est signalé à l'utilisateur et un correctif ouvert ; serveur de revue arrêté ; vérification Trello dans les deux sens (cartes traitées, nouvelles cartes).

## 3. Batchs

- Une liste Trello « Batch — … » : **un seul go pour tout le batch**, les cartes s'enchaînent sans reconfirmation ; dès le rapport d'un sous-agent, le TL lance celui de la carte suivante et revoit la précédente pendant ce temps. Le TL ne démarre jamais de lui-même un batch. Avant le go, il revérifie que les tickets collent toujours au code (numéros de ligne, cartes mergées entre-temps).
- **Liste du batch** (décision de l'utilisateur, 2026-11-04) : toutes les cartes d'un batch sont regroupées dans leur liste « Batch — … » dès le go (créée par le TL si elle n'existe pas), et y restent jusqu'au bout ; une fois **toutes** les cartes du batch traitées (mergées et passées en Done, ou abandonnées), le TL **archive la liste** du batch, et les listes « Pr <n> » qui s'y rattachent, dans la même respiration que l'entrée du journal.
- **Tableau de bord** : quand plusieurs PR d'un batch sont testées ensemble (un seul serveur, un seul passage de test), le TL les marque comme un même lot au tableau de bord pour que l'utilisateur voie qu'il s'agit d'un test unique (voir section 5).
- **Batch simple** : chaque branche part de la base, chaque PR cible la base.
- **Batch empilé** (cartes qui se suivent sur les mêmes fichiers, ou batch testé en bloc) : chaque carte part de la branche de la précédente et sa PR cible cette branche. Une correction amont se propage **par merge** dans les branches suivantes (jamais de rebase ni de force-push). Chaque carte incrémente la version à partir de la précédente.
- **Fin d'un batch empilé**, choisie par batch :
  - **cascade (par défaut)** : une fois tout validé, merge d'aval en amont (chaque PR dans sa base), puis **un seul merge sur la base**, donc un seul déploiement ;
  - **reciblage** : quand on veut pouvoir livrer une carte seule : après chaque merge sur la base, la PR suivante est reciblée sur la base avant son test.
- **Test d'un batch** :
  - **PR par PR, dans l'ordre (par défaut)** : le TL sert chaque branche sur son port de revue et donne son plan ;
  - **version intégrée** : quand les migrations du batch sont déjà appliquées sur une recette partagée (une branche seule ne marcherait plus), ou si l'utilisateur préfère tester en bloc : branche locale jetable = base + toutes les PR, conflits résolus, build et tests verts, un seul serveur et un plan de test consolidé.

## 4. Revue (TL)

- **Une seule revue complète, au passage « ready for review »** (rapport du sous-agent), pas à chaque push en draft. Le TL vérifie l'état réel de la PR (`gh pr view <n> --json state,isDraft`) avant de commencer, relit le diff lui-même (pas seulement le rapport) et relance les checks.
- **Garde-fous de la revue** (le TL relit du code écrit sur ses propres consignes) : relire contre le ticket **et** contre le code existant, pas seulement contre le rapport ; pour une carte `[L]`, sensible (sécurité, modèle de données, argent) ou contestée, demander une **revue indépendante** (sous-agent de revue qui reçoit le diff, pas la conclusion du TL).
- Contenu : exactitude, sécurité, cohérence avec les patterns et le design system, tests (un test existant ne se modifie qu'avec une raison écrite), impact (`graphify affected`), checks du projet (`npm test`, lint, build avec `tsc -b`). **Un résultat de tests ne s'annonce qu'après lecture de la sortie complète.**
- **Contrôle visuel** de toute modif d'interface : capture mobile (~360 à 390 px) et texte agrandi ; mesurer les chevauchements, le texte écrasé ou coupé et la hauteur des lignes, pas seulement le débordement horizontal (`scrollWidth`). Le sous-agent mesure ; le TL refait **au moins une mesure lui-même par carte qui touche l'interface** (sondage), sans se contenter des chiffres du rapport.
- **TNR sur l'aperçu de la PR** (Test Civique, depuis la v1.12.0) : avant le plan de test, le TL lance `npm run tnr` sur l'aperçu Netlify de la PR (`TNR_BASE_URL=https://deploy-preview-<n>--test-civique.netlify.app`) et en donne le résultat dans son commentaire de PR ; un échec est un bloquant.
- Résultat en **commentaire de PR** (bloquants / suggestions / vérifié) ; un bloquant se corrige par un sous-agent relancé sur la même branche (ou le même sous-agent repris), le TL confirme par un nouveau commentaire.
- **Retours mécaniques** (duplication, renommage, nettoyage, design system, tests manquants, sans ambiguïté) : le TL les corrige lui-même, en commit séparé, checks verts, commentaire « corrigé par le lead tech » ; en batch empilé, la correction se propage par merge dans les branches suivantes. Tout ce qui touche comportement, périmètre, logique métier, sécurité ou modèle de données repasse par un sous-agent.
- Une dépendance ou un blocage annoncé (doc, carte, message) se vérifie dans le code avant d'être relayé. Avant d'explorer large une zone récemment travaillée : `git log` / diff des PR concernées.

## 5. Plan de test et tableau de bord

- Dès la revue faite, sans attendre qu'on le demande, le TL démarre (ou redémarre) **uniquement** le serveur de son worktree de revue sur la branche de la PR et rédige : **contexte · remarques · lien de test · plan de test** (étapes numérotées, chacune avec son « Attendu », cas limites) · « ce que je vérifie moi-même » (ce qui n'est pas testable depuis le téléphone). Ce plan va au tableau de bord (voir plus bas) ; l'utilisateur en reçoit un résumé court dans le chat.
- Un **bug connu ne va jamais dans le plan** : il va dans le commentaire de PR.
- **Rien à tester** (décision de l'utilisateur, 2026-11-24) : quand une PR n'offre rien que l'utilisateur puisse vérifier avant le merge (doc, changement visible en production seulement), le TL le dit en une ligne (« rien à tester de ton côté, donne ton go ») au lieu d'un plan ; s'il reste une vérification en production, il la fait lui-même juste après le déploiement et en donne le résultat (et marque la carte `test_apres_prod` au tableau de bord si l'utilisateur doit regarder lui-même).
- En batch, les plans arrivent **PR par PR** une fois tout le batch revu (ou au fil des revues si l'utilisateur teste déjà).
- **Tableau de bord** (décision du 2026-10-25, écriture directe depuis le 2026-10-26, pour économiser des tokens) : le **plan complet n'est écrit qu'une fois, au tableau de bord**, une fois la revue faite ; dans le chat, l'utilisateur reçoit un résumé court (PR, ce qui change, lien de test, « plan au tableau de bord »). Le TL écrit **lui-même** sur le dashboard par HTTP (Tailscale, sans jeton) : plus de messages `REVIEW AJOUT` / `REVIEW SUPPRIMER` à la session du dashboard (ils ne sont plus traités), et aucune confirmation à lui envoyer.
  - **Ajouter / mettre à jour** : écrire le JSON (UTF-8) dans un fichier du scratchpad, puis `curl -s -X POST <dashboard>/api/review -H 'Content-Type: application/json' --data-binary @review.json`. Champs : `projet` (obligatoire, orthographe exacte du paramètre), `pr` (entier, obligatoire), `titre` (obligatoire à la création), `lien_pr` (URL nue), `description` (contexte), `remarques`, `lien_test`, `plan_texte` (le plan, lignes séparées par `\n` ; `###` titres, `-` puces, `**gras**`, `` `code` ``) **ou** `plan_test` (liste d'étapes, exclusif), `auteur` (« <Projet> - TL »). Même `projet` + même `pr` = mise à jour des seuls champs envoyés ; un plan envoyé remplace l'ancien. Réponse `{"ok":true,"action":"créée"|"mise à jour"}` ; refus = code 400 et `{"erreur":"…"}` : corriger et renvoyer.
  - **Retirer** (PR validée par l'utilisateur, mergée ou fermée) : `curl -s -X POST <dashboard>/api/review/supprimer -H 'Content-Type: application/json' --data-binary '{"projet":"<Projet>","pr":<n>}'` (404 si absente).
  - `lien_test` = **URL nue** uniquement (`http(s)://…`, sinon refusé) : toute précision va dans `remarques`. Le plan envoyé est la **copie fidèle** de celui de la revue (mêmes étapes, même ordre). Renvoyé à chaque correction ; en batch, chaque PR y entre dès sa revue.
  - **À tester après la mise en prod** (2026-10-30) : champ `test_apres_prod` (booléen, `false` par défaut) à `true` pour une PR qui ne se teste qu'en production (installation Android, routine, HTTPS…) : la carte va dans la section « À tester après mise en prod » (badge violet) et ne compte pas dans la pastille. Une fois déployée, envoyer `prod_le` (`"AAAA-MM-JJ"`) : la carte remonte avec un badge vert « En prod le JJ/MM · à tester » ; `""` l'efface. Exemple : `{"projet":"<Projet>","pr":<n>,"test_apres_prod":true}` puis, après le déploiement, `{"projet":"<Projet>","pr":<n>,"prod_le":"2026-10-31"}`. Valeurs refusées (400, message lisible) : `test_apres_prod` autre que `true` / `false`, `prod_le` hors format `AAAA-MM-JJ`.
  - **Lot d'un test groupé** (décision de l'utilisateur, 2026-11-04) : plusieurs PR d'un batch testées ensemble (un serveur, un passage) portent toutes le champ `lot` avec **exactement la même valeur** (texte ≤ 80 caractères, le nom du batch, par ex. `"lot": "Batch — Règles"`), au sein d'un même projet ; le tableau de bord les regroupe, avec un bandeau coloré à gauche (couleur stable, dérivée du nom) et un badge « Test global · <nom> ». `""` efface le champ ; mise à jour partielle comme les autres champs ; renvoyé par les `GET` sous `lot` (`""` si absent).
  - **Lire** (2026-10-30) : `GET <dashboard>/api/reviews?projet=<Projet>` → `{"ok":true,"reviews":[…]}` (sans `projet` : tous les projets) ; `GET <dashboard>/api/review?projet=<Projet>&pr=<n>` → `{"ok":true,"review":{…}}` (404 si absente, 400 si `projet` ou `pr` manque). Champs renvoyés sous les mêmes noms qu'à l'écriture, plus `cree_le` et `modifie_le`. Vérifier par une lecture plutôt que de supposer ce qui est affiché.

## 6. Git

- Ne jamais pousser sur la base. Branches `feature/…`, `fix/…`, `docs/…` (+ `chore:`/`refactor:`), créées depuis la base à jour ; commits et branches en anglais.
- **PR ouverte automatiquement** dès le premier push, sans exception, y compris pour un correctif du TL : la PR est la trace et le point de rollback.
- Avant de démarrer un développement : vérifier les PR ouvertes ; sans rapport direct, prévenir l'utilisateur.
- Un défaut trouvé en testant une PR se corrige **dans cette PR**.
- **Merge** : jamais sans le « <n> ok » de l'utilisateur, même testé par un agent. Exception : une **PR qui ne touche que de la doc** (`AGENTS.md`, `CLAUDE.md`, `docs/`, `.claude/sessions/`, README) et dont le contenu a été convenu est mergée par le TL dans la foulée. Chaque merge sur une branche qui déploie est un déploiement : regrouper la doc en une PR par jalon.
- **Numéro de version** : chaque carte livrée l'incrémente dans sa PR (`minor` pour une fonctionnalité, `patch` pour une correction, rien pour la doc), calculé par rapport à la base ; le TL corrige au merge si une autre PR est passée avant.
- On ne pousse qu'après une vérification explicite que les checks passent (pas un simple coup d'œil au résumé).
- Chacun ne supprime **que les branches qu'il a créées** (les branches locales sont partagées entre worktrees).
- Après un merge : base locale à jour (`git pull --ff-only`).
- Jamais affirmer l'état d'une PR ou d'une carte de mémoire : `gh pr view` (après `git fetch`), ou la dernière entrée de session / journal.

## 7. Migrations

- Numérotées et versionnées dans le dépôt.
- **Recette** : le TL les applique directement.
- **Production** : avant le merge qui en dépend, toujours **depuis un worktree dédié sur la bonne branche** (jamais depuis le worktree de revue s'il n'est pas sur cette branche), avec les **lignes exactes attendues** annoncées d'abord (« Applied 0XX_nom.sql »). Une sortie différente (« Database is up to date », autre numéro) = on s'arrête avant de merger. Qui l'exécute est un **réglage du projet** (section 0), **choisi avec l'utilisateur au démarrage** et modifiable en cours de projet sur sa décision (le paramètre est alors mis à jour dans l'`AGENTS.md` du projet) :
  - **par le TL** : le « <n> ok » d'une PR qui porte une migration autorise le TL à l'appliquer en prod puis à merger. **Projet avec recette** (base des PR ≠ branche de prod) : le merge de la PR n'atteint que la recette ; l'application en prod et son feu vert se font à la **promotion** vers la branche de prod (go explicite de l'utilisateur pour la promotion). L'accès prod est posé **par l'utilisateur lui-même** dans un fichier local non versionné du seul worktree du TL (jamais dans le `.env` du checkout principal, que le script de worktree recopie chez le dev), sans que l'URL passe par la conversation ; le TL ne l'affiche jamais ;
  - **par l'utilisateur** : le TL lui donne la commande prête et les lignes attendues ; l'utilisateur colle lui-même l'accès (`read -rs`).
- Une donnée ou un environnement « jetable » en apparence ne se supprime jamais sans confirmation.

## 8. Isolation et environnement

- Chaque agent travaille dans **son propre worktree** ; jamais deux agents dans le même répertoire : les sous-agents dev travaillent **un à la fois** dans le worktree dev, le TL dans le worktree de revue ; le checkout principal n'est le worktree d'aucun agent (il sert aux opérations du TL : merges, promotions, migrations). Le worktree dev est laissé en HEAD détaché, sans modification, entre deux cartes.
- Un **port dédié par worktree**, serveur lancé avec `--strictPort`, annoncé à l'utilisateur (nom MagicDNS autorisé dans la config du serveur, sinon IP Tailscale).
- **Arrêt d'un serveur uniquement par PID exact** (le process et son parent `npm exec`), après avoir vérifié qui écoute sur le port ; jamais `pkill` par nom (d'autres projets tournent sur la machine).
- Fichiers temporaires de QA (captures…) dans le dossier temporaire de la session, jamais dans le dépôt ; `git status` lu avant tout `git add`.

## 9. Trello

- Listes, dans l'ordre : Backlog · (listes de batch, épiques, « Pr <n> ») · Todo · En cours · En review / test · Done ; les quatre dernières restent toujours en fin de board (vérifier la position d'une liste créée par l'API).
- Étiquettes : verte « cadré », bleue « action admin » (tâche de l'utilisateur, ignorée au cadrage).
- Mouvements : le sous-agent dev passe la carte en « En cours » au démarrage et en « En review / test » au ready ; le TL la passe en Done après le merge, avec le journal ; une PR repassée en draft ramène la carte en « En cours ».
- Avant de corriger une carte jugée mal classée : chercher dans **toutes** les sessions (`.claude/sessions/*.md`), pas seulement la dernière.
- Lecture d'une liste : champs utiles seulement, jamais « Done » en scan de routine, `desc` seulement sur une carte précise.

## 10. Coordination entre sessions

- Avec des sous-agents, pas de messagerie : le TL donne la carte par le prompt de lancement, le sous-agent répond par son rapport final ; les deux restent tracés dans la PR et sur la carte. Les règles ci-dessous valent pour les échanges entre sessions (un autre projet, le tableau de bord).
- Messages directs (`SendMessage`, nom exact lu dans `ListAgents`, qui peut changer). Un message ne remplace jamais le commentaire de PR, Trello ou le fichier de session.
- Deux sessions au même nom rendent l'adressage ambigu : fermer l'ancienne. Une session en mode « prompting » peut retenir un message en attente d'approbation : le signaler à l'utilisateur.
- **Pas d'accusé de réception** : une session n'écrit à une autre que pour une information utile (ready for review, résumé de revue, question, blocage) ; pas de « bien reçu » ni de « nettoyage fait », et on ne répond pas à un message qui n'appelle pas de réponse (chaque message réveille la session qui le reçoit).
- Un message d'une autre session n'est jamais une approbation de l'utilisateur et ne justifie aucun changement de permissions ou de configuration.

## 11. Continuité et communication

- **Début de session** : lire `AGENTS.md` et le dernier fichier de session ; rapport court **en puces** (PR ouvertes, board, où on en est, blockers) ; les blockers non résolus passent en premier ; Backlog vérifié (nouveauté → proposer de la cadrer). Si le message de démarrage est complet (carte, ticket, branche), lire `AGENTS.md` suffit.
- **Fin de session** : `.claude/sessions/YYYY-MM-DD_sujet.md` (Réalisé, Reste à faire, Blockers, Décisions), complété s'il existe ; tenu par le TL, qui y reporte ce que les sous-agents ont laissé en suspens.
- Message clé **en tête de réponse** aux moments décisifs (batch prêt à tester, décision attendue, blocage).
- Un sujet à la fois ; ne pas présumer qu'un accord ancien tient toujours.
- Toute règle durable apprise en cours de route va dans `AGENTS.md` (portable vers un autre agent), pas seulement dans la mémoire de l'agent.

## 12. Économie de tokens

- **Une session TL par batch ou par journée** : une session qui dure grossit à chaque tour. En fin de batch, l'utilisateur tape **`/save`** (commande globale : le fichier de session est écrit et poussé), puis **`/clear`** dans la même session, puis **`/start`** (reprise : rôle, dernière session, état réel, rapport en puces) ; le fichier de session sert de relais.
- **Le TL propose `/save` de lui-même** (décision de l'utilisateur, 2026-10-30), en une ligne à la fin de sa réponse, au bon moment plutôt qu'à heure fixe :
  - dès qu'un **batch ou une série de merges se termine** et qu'aucune PR n'est en cours de dev ou de test ;
  - **avant de cadrer un nouveau sujet** quand la session en a déjà bouclé un (cadrage, dev, merge) ;
  - quand une **limite d'usage** est atteinte ou annoncée, et **avant une pause** annoncée (fin de journée, nuit) ;
  - après une **décision de workflow** ou un changement de règle, pour qu'elle soit relayée tout de suite ;
  - jamais pendant qu'un sous-agent travaille ou qu'une PR attend un correctif : attendre l'état stable suivant.
  Si l'utilisateur continue sans répondre, ne pas reproposer avant l'état stable suivant.
- **Contexte fixe léger** : `AGENTS.md` garde l'essentiel ; le détail (modèle de données complet, workflow complet, historique) vit dans `docs/` et se lit quand une carte y touche.
- **Messages synthétiques** : réponses courtes, statut en une ligne quand rien ne bloque ; le détail est donné quand l'utilisateur le demande.
- **Recherche** : lire directement le fichier quand on sait où chercher ; `graphify query` pour les questions larges seulement, avec `--budget 500`.
- **Contrôle visuel** : mesurer d'abord (hauteurs, largeurs, chevauchements en chiffres) ; capturer un élément précis plutôt qu'une page entière, et seulement quand il faut le voir.
- **Gros textes répétés** (prompt d'une routine, plan, maquette) : les envoyer une fois et vérifier par empreinte (hash) ou par diff, sans les relire en entier ; maquettes à partir d'un gabarit réutilisable.
- **Tests** : une passe suffit ; en relancer seulement pour un test instable. Sorties lues en entier mais filtrées sur le résumé et les échecs.
- **Sous-agents** : un sous-agent neuf par carte (contexte vide, consignes courtes et complètes) plutôt qu'une session qui grossit ; mesurer l'usage d'un batch quand on veut comparer (transcriptions de la session TL et de ses sous-agents).

## 13. Sous-agents dev

- **Lancement** : le TL lance un sous-agent (`Agent`, type généraliste, en arrière-plan) par carte, avec un prompt qui pointe vers le **gabarit de consignes versionné du projet** (ex. `docs/sous-agent-dev.md`) et donne ses valeurs : carte (id et lien), branche de base, branche à créer, incrément de version, dossier temporaire de la carte, plus les précisions propres à la carte (ce qui a changé depuis le ticket, décisions récentes, pièges connus).
- **Le gabarit** dit au sous-agent : son worktree et son port (et rien d'autre), quoi lire (`AGENTS.md`, sections utiles du workflow), où lire le ticket, le déroulé (branche, version, PR draft, carte « En cours », implémentation, tests, checks, contrôle visuel mesuré, ready, carte « En review / test »), les interdits (pas de push sur la base, pas de merge, pas de rebase ni de force-push, pas de migration en prod, pas de config ni d'identité Git, pas de suppression de branche, pas de message à d'autres sessions, pas d'outil emprunté à un autre projet, aucun fichier hors de son dossier temporaire), et la forme du **rapport final** (PR, branche, SHA, version, fait / sauté et pourquoi, tests ajoutés ou modifiés avec la raison, mesures, questions ouvertes).
- **Modèle** : chaque projet peut fixer le modèle de chaque rôle de sous-agent (paramètre `model` de l'outil `Agent`) ; Test Civique : rédaction sur Sonnet, vérification et relecture sur Opus, arbitre des doutes sur Fable (`AGENTS.md`, Workflow).
- **Une carte à la fois** dans le worktree dev ; en batch empilé, la carte suivante part de la branche de la précédente dès le rapport reçu.
- **Boucle de relecture avant le relecteur final** (v2.1) : sur **chaque** PR, avant la revue du TL, un second sous-agent relit avec **la même consigne que le relecteur final** du projet (la personne ou l'automatisme qui décide de la fusion : sa consigne écrite si elle existe, sinon les règles du projet), en lisant le diff **et le code touché autour** (pour chaque donnée écrite ou modifiée, tous ses lecteurs), et en posant les questions d'un **catalogue des bloquants** propre au projet. Il ne modifie rien et ne poste rien ; rapport au TL. Corrections par un sous-agent, nouvelle relecture, jusqu'au verdict « prête à fusionner » ; au-delà de 3 tours ou sur un point métier, arrêt et remontée à l'utilisateur. **Mesure** : bloquants trouvés par le relecteur final sur chaque PR (objectif 0) ; chacun enrichit le catalogue (famille, exemple, question à se poser). Familles de départ, issues de Job finder : effet sur une autre fonction ; valeurs vides ou par défaut ; règle métier tenue par la prose seulement, pas par le code ; cas multiples et concurrence ; une donnée moins fiable qui décide pour une plus fiable ; instructions contradictoires dans un skill ; erreurs avalées et défauts dangereux.
- **Questions ouvertes** d'un rapport : le TL tranche ce qui est de son ressort, remonte le reste à l'utilisateur avec le résumé de revue ; il ne les laisse pas se perdre (commentaire de PR, carte, fichier de session).
- **Suppression des branches** : les branches créées par les sous-agents sont celles du TL ; il les supprime après le merge.

