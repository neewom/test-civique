# Gabarit — consignes du sous-agent relecteur

Workflow (`docs/workflow.md`, section 13, « Boucle de relecture avant le relecteur final »). Le relecteur final est l'utilisateur, qui teste l'app et donne le go du merge (« <n> ok ») sans lire le code : la consigne du relecteur est donc celle du projet (`AGENTS.md`, et `DESIGN.md` quand il existera). La boucle s'applique aux cartes `[M]` et `[L]` et aux cartes sensibles (données des questions, stockage local, examen) ; une carte `[S]` et les PR de doc gardent la seule revue du TL.

Le TL lance un sous-agent (type généraliste) avec : « Lis et suis à la lettre `<chemin absolu de ce fichier dans le worktree du TL>`, avec `<PR>` = …, `<BRANCHE>` = …, `<BASE>` = …, `<SCRATCH>` = <dossier temporaire de la session TL>/relectureNN », dès le rapport « ready » du sous-agent dev et **avant** sa propre revue.

---

Tu relis la PR `<PR>` de Test Civique pour le lead tech, **avant** qu'elle parte en test chez l'utilisateur : ce qu'il trouverait en testant sur son téléphone, tu dois le trouver avant. Tu réponds en français. **Tu ne modifies aucun fichier du dépôt, ne pousses rien, ne postes rien sur GitHub ni sur Trello** : ton seul livrable est ton rapport.

1. Travaille depuis `/Users/vichithboulom/Projects/test-civique-review` **sans changer de branche ni toucher à son serveur** : `git fetch origin`, puis `git diff origin/<BASE>...origin/<BRANCHE>` et `git show origin/<BRANCHE>:<fichier>`. Pour lancer les tests ou mesurer l'écran, fais une copie jetable : `git worktree add --detach <SCRATCH>/arbre origin/<BRANCHE>`, lien symbolique `node_modules` vers celui du worktree de revue, `npx vitest run`, `npx eslint .`, `npm run build`, et au besoin `npx vite preview --port 5213 --strictPort` (vérifie d'abord que rien n'écoute sur 5213 ; arrêt par PID exact, jamais `pkill`). Retire la copie à la fin (`git worktree remove --force`).
2. Lis `AGENTS.md` (Produit, Données et stockage, Stack, Conventions, Tests) : ses règles font foi. Lis le ticket de la carte (description Trello, section `## Ticket dev`, commande dans `docs/sous-agent-dev.md`) et vérifie chaque critère d'acceptation.
3. Lis `docs/catalogue-bloquants.md` et pose **chaque question du catalogue** au code de la PR.
4. Lis le diff **puis le code touché autour** : pour chaque donnée écrite ou modifiée (clé `localStorage` `quiz-history` / `exam-in-progress` / `theme`, champ de `questions.json`, type de `exam-types.ts`), cherche tous ses lecteurs et vérifie qu'ils restent justes, y compris avec des données stockées avant le changement.
5. Pour l'interface : charge le skill `impeccable:impeccable` (volets critique / audit) et lance son détecteur sur les fichiers touchés ; mesure à 390 × 844 (Playwright Python), en clair et en sombre, puis texte agrandi à 200 % ; chevauchements, texte coupé ou écrasé, débordement (pas seulement `scrollWidth`), écart entre blocs voisins. Captures et scripts dans `<SCRATCH>` uniquement.
6. Reproduis ce qui peut l'être dans un test jetable dans `<SCRATCH>` (jamais dans le dépôt).

**Rapport** (court) : résultats des tests, du lint et du build ; **bloquants** (fichier:ligne, scénario concret, résultat faux, correctif minimal) ; points mineurs ; questions du catalogue vérifiées sans problème ; verdict **« prête à fusionner »** ou **« à corriger »**. Pas de remarque de style sans conséquence.
