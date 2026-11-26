# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personnes étrangères primo-arrivantes qui préparent l'examen civique exigé pour leur titre de séjour (carte de séjour pluriannuelle, carte de résident) ou leur naturalisation. Elles s'entraînent surtout sur téléphone, souvent par petites sessions, parfois peu à l'aise en français ou avec le numérique, et généralement stressées par une démarche dont dépend leur séjour en France. Leur travail : savoir ce qui les attend le jour J, apprendre les réponses aux questions officielles de leur démarche, et savoir quand elles sont prêtes à passer l'examen.

## Product Purpose

Une application d'entraînement à l'examen civique : examen blanc chronométré, mode révision par thème, historique des examens. Elle a été faite à l'origine pour une personne qui préparait l'examen ; cette personne s'est entraînée sur l'appli et a obtenu sa carte de résident. Le succès : l'utilisateur arrive à l'examen en sachant comment il se déroule, réussit du premier coup (une tentative coûte 70 à 90 €), et a pu se préparer gratuitement sur l'essentiel.

## Positioning

La fidélité au format officiel est attendue de toute appli du secteur ; ce n'est pas la différence. Ce qui doit distinguer celle-ci (décision de l'utilisateur, 2026-11-23) :
- **L'accompagnement jusqu'au jour J** : savoir si l'on est prêt d'après ses derniers examens blancs, puis trouver un centre d'examen proche et s'inscrire.
- **La révision ciblée par démarche** : le bon jeu de questions selon le titre visé (carte pluriannuelle, carte de résident, naturalisation), alors que les listes officielles diffèrent.
- Des réponses dont la source officielle est consultable, et un contenu propre (les mises en situation officielles ne sont pas publiques).

Pistes proposées par le TL, non décidées : révision des questions ratées (répétition espacée), mode « jour J » sans correction entre les questions comme à l'examen réel, aide à la compréhension du français (lexique des mots difficiles, lecture audio des questions), liste des étapes de la démarche (inscription CCIP ou FEI, pièces, convocation).

## Operating Context

- Examen officiel (arrêté du 10 octobre 2025) : 40 questions en QCM, 4 choix, une seule bonne réponse, 45 minutes au maximum, réussite à 80 % (32/40), répartition fixe par thème dont 12 mises en situation. Deux organismes agréés pour la passation : CCIP et France Éducation International.
- Le ministère de l'Intérieur publie le programme, des fiches et les listes de questions de connaissance (CSP : 191, CR : 209), sans les réponses, et met en garde contre les sites de préparation payants (« risques de fraude », « fausses informations »).
- Usage typique : quelques minutes dans les transports ou le soir, sur un téléphone, parfois sur un écran partagé avec un proche ou un formateur.

## Capabilities and Constraints

- Appli web statique (React, Vite), déployée sur Netlify, sans compte ni serveur ; données des questions dans le dépôt, progression et historique dans le navigateur (`localStorage`).
- Couverture actuelle : liste CSP (191 questions), liste de la carte de résident (209 questions, ouverte depuis la v1.14.0) et 100 mises en situation rédigées pour l'appli, communes aux titres ; liste de la naturalisation (258 questions, ouverte depuis la v1.21.0).
- Décidé pour plus tard : modèle gratuit avec publicité (jamais sur l'écran de question) et accès complet payant à prix bas, après une phase de lancement mesurée.
- Nom : **Futur Citoyen** (décision de l'utilisateur, 2026-11-24), qui remplace « Test Civique », nom du site d'inscription officiel de France Éducation International (test-civique.fr). Logo « la pousse » : une jeune pousse, une feuille verte et une feuille jaune. L'adresse du site et le nom du dépôt restent inchangés tant que le domaine futurcitoyen.fr n'est pas réservé.

## Brand Commitments

- Interface en français, vouvoiement.
- Transparence : « site indépendant, non officiel », lien vers les sources officielles.
- Ton rassurant et encourageant (« pas encore réussi » plutôt qu'« échoué »).

## Evidence on Hand

- Les listes officielles de questions et l'arrêté sont publics (formation-civique.interieur.gouv.fr, Légifrance).
- Un cas réel : une personne qui a préparé l'examen sur l'appli et obtenu sa carte de résident (témoignage non rédigé, ne pas en inventer).
- Aucune statistique d'usage, aucun avis utilisateur, aucun partenariat : ne rien inventer de tel.

## Product Principles

1. Rassurer avant d'impressionner : l'utilisateur doit toujours savoir où il en est et ce qui l'attend.
2. Juste et vérifiable : une réponse fausse est le pire défaut ; chaque réponse renvoie à sa source.
3. Le bon contenu pour la bonne démarche : ne jamais faire réviser des questions qui ne tomberont pas.
4. Accompagner jusqu'au bout : de la première question à l'inscription à l'examen.
5. L'essentiel reste gratuit et sans inscription.

## Accessibility & Inclusion

Public dont le français n'est pas la langue maternelle et dont l'aisance numérique varie : phrases courtes, vocabulaire simple, aucun jargon d'interface. Lecture sur petit écran, souvent à une main ; texte agrandi respecté ; contraste suffisant en clair comme en sombre ; navigation au clavier et lecteurs d'écran pris en charge (audit en cours, 2026-11-23).
