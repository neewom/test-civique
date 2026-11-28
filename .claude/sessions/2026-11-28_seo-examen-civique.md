# Session TL — 2026-11-28 : référencement, bling bling, page « L'examen civique »

## Réalisé (tout en production, v1.35.0)
- Référencement, socle technique (#160, v1.33.0) : `seo.ts` source unique, HTML par adresse, sitemap, robots, vraie 404, `noindex` sur examen et titre.
- Français simple, thème « Système institutionnel et politique » (#161, v1.33.1).
- Batch « bling bling » (#164 parallaxe, #165 animations de l'examen, v1.34.0).
- Page « L'examen civique » `/examen-civique` (#168, v1.35.0) : remplace `/regles` (301), texte rédigé/vérifié/validé, étape 4 « Le jour J » de l'accueil en lien vers la page. TNR production 45 passés, 1 sauté.
- Docs : journal (#166, #169), liste bling bling permanente (#167), Search Console / Bing dans AGENTS.md (#170).
- Google Search Console (propriété Domaine, TXT `google-site-verification` chez OVH, `@`) et Bing Webmaster (importé) configurés par l'utilisateur, sitemap soumis aux deux (Bing en « Processing »). Aperçu LinkedIn vérifié par l'utilisateur.
- Canevas « Application actuelle » à jour en v1.35.0 (Ac132-02 accueil, Ac132-05 devenu « L'examen civique », déplacé en x 3290).

## Décisions du jour (utilisateur)
- Liste « Batch — bling bling » gardée ouverte en permanence.
- Page `/examen-civique` validée, étape 4 « Le jour J » = lien vers elle.
- Idées de communication dans une carte du Backlog ; post LinkedIn prévu lundi 2026-11-30 au matin.

## Reste à faire
- Français simple : Droits et devoirs, Histoire géographie culture, Vie en société (même chaîne rédacteur Sonnet → vérificateur Opus → validation sur page privée). Proposé, go pas encore donné.
- Comm (offert, non demandé) : modèle de message pour groupes et associations, flyer A5 avec QR code.
- Plus tard : publicité, accès payant.
- Search Console : regarder les premières données d'ici 2 à 4 jours.

## Blockers / points ouverts
- Aucune PR ouverte ; Todo, En cours, En review / test vides.
- Non vérifié : rendu de la FAQ (`details`) sur un vrai iPhone ; annonce de la correction de l'examen avec un vrai lecteur d'écran.
- Worktree de revue en HEAD détaché sur `origin/main` (c9b7a60, v1.35.0) ; un `vite preview` peut encore tourner sur 5212 (arrêt par PID seulement).
