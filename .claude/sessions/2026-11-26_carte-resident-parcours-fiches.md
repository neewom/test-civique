# Session TL — 2026-11-26 : carte de résident, parcours et navigation, fiches des titres

## Réalisé (tout en production, v1.20.0)
- Épique « Contenu » terminée (lots 3 à 5, PR #80, #82, #84) : 288 / 291 questions sourcées.
- Batch TNR + listes par titre (PR #86, #87) : suite Playwright `npm run tnr`, lancée sur l'aperçu de chaque PR et en production après chaque merge.
- Épique « Carte de résident » terminée : lot 1 (#89), batch lots 2 à 5 (#92 à #95, 145 questions, 209 / 209 couvertes), ouverture à l'écran + un examen en cours par titre + statistiques par titre (#97), pas de question de l'examen précédent (#98).
- Batch « Parcours et navigation » (#100 à #103) : en-tête permanent avec panneau « Affichage » (thème, animations, clé `motion`), transitions View Transitions variante B (bandeau de l'examen en fondu), page de première visite, page « Avant l'examen blanc » (`/examen-blanc`).
- Fiches des titres (#105) : `/titres/...` pour les 3 titres, texte vérifié sur les sources officielles (naturalisation : 258 questions).
- Journal à jour (dernière PR de doc : #106). Canevas : page « Application actuelle » à jour (v1.20.0).
- Contrôle GoatCounter quotidien : liste des chemins (11 pages) et des 6 événements à jour. Le contrôle planifié de 9 h 10 s'est arrêté à sa première commande (autorisation non donnée) : contrôle fait à la main le 26/11.

## Décisions du jour (utilisateur)
- PR de doc mergées par le TL sans demander (AGENTS.md).
- Modèles des sous-agents : rédaction / dev / corrections sur Sonnet, vérification et relecture sur Opus, arbitre sur Fable en cas de désaccord (AGENTS.md).
- Carte de résident : seuil 32/40 ; groupes et doutes tranchés en fin de batch sur une page de relecture ; fautes officielles corrigées en exceptions documentées ; `insee.fr` accepté comme source.
- Un examen en cours par titre ; statistiques suffixées `-resident`.
- Parcours : bouton « Affichage » (pas d'icône « étincelles ») ; vert et jaune seulement en motif de fond ; transitions variante B ; l'étape 2 reprend un examen en cours au lieu de l'effacer.
- Fiches : pas de coût de l'examen, rien sur la validité du résultat pour la naturalisation ; bouton « Continuer mon entraînement » si c'est déjà le titre choisi.

## Reste à faire
- Épique « Naturalisation » (Todo) : 5 lots de questions (méthode des lots CR, liste de 258 questions, 44 déjà rattachées), puis ouverture à l'écran (clé `exam-in-progress-naturalisation` déjà prévue par le code).
- Batch « Avant le lancement » (liste dédiée, en attente du contenu complet) : petits correctifs, référencement, trouver un centre (maquettes Tc1–Tc4 à valider).
- Backlog : actions admin (RGPD…), gamification, communication, consentement et publicité, accès payant.

## Blockers / points ouverts
- Aucune PR ouverte. Aucune carte en cours.
- Contrôle GoatCounter planifié : l'utilisateur doit le lancer une fois avec « Exécuter maintenant » et autoriser ses commandes.
- Mineurs connus : `/revision` déborde à 200 % de texte (lien source, antérieur) ; contraste « Futur » vert sur la forme bleue des règles (~1,9:1, antérieur).
