# Session 2026-11-24 — Identité, refonte « la carte du parcours » (TL)

## Réalisé
- Batch « Identité et outillage » (#46, #47, v1.2.1) et batch « Refonte » (#49 à #53, v1.6.1) mergés en cascade, prod vérifiée (police Atkinson, CSP, routes, premier lancement → /titre). Journal à jour (#48, #54).
- Fond animé : variante B retenue parmi 5 (Artifact https://claude.ai/artifact/E6jnSPJ2BBiQqfUxKAcgiS), cycles de 12 à 14 s.
- `docs/sous-agent-dev.md` : une carte de batch reste dans sa liste « Batch — … ».
- Maquettes (https://claude.ai/artifact/GaE1VRaaqK5fqND5BsBiqx) : page « Application actuelle » refaite en 14 captures de la prod v1.6.1 (clair et sombre) + fiche des écarts ; anciens écrans dans la page « Archive · avant la refonte ». Affichage des captures non vérifié par le TL (navigateur non connecté à claude.ai).
- Ménage fait : branches, serveur 5212 arrêté, tableau de bord vide pour le projet, cartes en Done, liste « Batch — Refonte » archivée.

## Reste à faire
- Faire vérifier par l'utilisateur l'affichage de la page « Application actuelle » des maquettes.
- Carte « [M] Maquettes de toute l'application (Artifact) » encore en « En review / test » : à passer en Done si l'utilisateur confirme qu'elle est soldée.
- Backlog à cadrer ensuite : DESIGN.md (impeccable document), contenu des questions (rédacteur + vérificateur, format `source` `{url,label}` à confirmer, mentions « Pôle emploi »), répartition officielle des 40 questions, carte de résident / naturalisation, centres d'examen, stats, mentions légales, gamification (message « prêt » à 3/3, coche de l'étape 1).

## Blockers
- Aucun. Aucune PR ouverte (vérifié par `gh pr list`).

## Actions de l'utilisateur
- Réserver futurcitoyen.fr ; éventuellement couper la barre d'outils Netlify des aperçus (Drawer).

## Décisions (utilisateur, 2026-11-24)
- Historique = section « Derniers examens » sous le parcours ; « À revoir » = dernière réponse connue fausse ou absente, sortie dès qu'elle est réussie ; compteur « n sur 3 » = réussites d'affilée depuis le plus récent, remis à 0 par un échec.
- Fond animé variante B (12 à 14 s, même ampleur).
