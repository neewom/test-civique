# Session TL — 2026-11-27 : batch « Qualité et parcours », page /centres

## Réalisé (tout en production, v1.22.3)
- Batch « Qualité et parcours » (PR #117 à #120, empilées, fusion en cascade après « Batch ok ») : petits correctifs avant lancement (#117), page « Trouver un centre d'examen » `/centres` (#118, v1.22.0), détail d'un examen montrant la bonne réponse proposée (#119, champ `answer` facultatif), réponses devinables par la forme neutralisées, lot 1 mises en situation (#120, script `scripts/detect-shape-giveaways.mjs`). Journal + rapports d'audit a11y et UX : PR #121.
- `/centres` clarifiée sur retour de l'utilisateur (maquette v2 validée, appliquée dans #118 avant merge) : deux réseaux, examen identique partout, le centre donne date et tarif ; CCIP en premier sous le nom du ministère (« Malgré son nom… toute la France ») ; pré-inscription FEI obligatoire dans ce réseau.
- Fiches des 3 titres alignées sur le nom CCIP (PR #122, v1.22.3, test dans `fiches.test.ts`). Journal : PR #123.
- TNR en production : 31 passés, 1 sauté. Cartes en Done. Entrée #122 retirée du tableau de bord. Contrôle GoatCounter : `/centres` ajouté aux chemins connus. Canevas : Tc2–Tc4 en v2, Ac221–Ac223 (v1.22.2) ajoutées.
- Règle globale ajoutée à `~/.claude/CLAUDE.md` : problème de tableau de bord → demander à « Optiplex - Dash » d'enquêter.

## Décisions du jour (utilisateur)
- Textes `/centres` v2 validés ; CCIP nommée « Chambre de commerce et d'industrie de Paris (CCIP) » partout (page et fiches).

## Reste à faire
- Batch « Avant le lancement (en attente du contenu complet) » : liste à renommer (ce qui reste n'attend plus le contenu complet) ; ticket Référencement [M] (page HTML par page publique, sitemap, robots) à revérifier sur le code avant son go.
- Neutralisation des réponses devinables : lots suivants (hors mises en situation) à cadrer.
- Canevas : choix des 3 titres pas encore reporté sur « Application actuelle ».
- Tableau de bord : entrées anciennes #62 et #65 encore présentes (à vérifier / retirer).

## Blockers / points ouverts
- Aucune PR ouverte ; Todo, En cours et En review / test vides.
- Non vérifié : centres CCIP en outre-mer (la page n'en dit rien).
- Checkout principal : `node_modules` possiblement périmé, lancer les checks dans le worktree de revue ou `npm ci` d'abord.
