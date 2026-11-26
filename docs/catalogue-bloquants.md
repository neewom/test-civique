# Catalogue des bloquants (Test Civique)

Lu par le sous-agent relecteur (`docs/relecteur.md`). Chaque défaut trouvé par l'utilisateur en testant une PR déjà revue, ou en production, s'ajoute ici : famille, exemple, question à se poser. Mesure : défauts trouvés par l'utilisateur par PR revue, objectif 0. Les 7 familles de départ viennent du workflow commun (nées de Job finder) ; les exemples s'ajouteront au fil des PR.

## 1. Effet sur une autre fonction (lire le code autour, pas le diff seul)
- Question : **qui d'autre affiche ou lit ce que je change** (une clé `localStorage`, un champ de `questions.json`, un type de `exam-types.ts`, un composant partagé) ? Accueil, examen, détail d'examen et révision lisent souvent les mêmes données.

## 2. Valeurs vides, absentes ou par défaut
- Question : que se passe-t-il avec un historique vide, une ancienne entrée sans `id` ou sans `answers`, une progression sauvegardée avant le changement, une question à plusieurs `answers`, un `group` absent, un chrono à 0 ?

## 3. Une règle d'`AGENTS.md` tenue par la prose seulement
- Question : chaque règle touchée (IDs 1–191 = officielles, 40 questions / 45 minutes / seuil 32/40, pas deux questions du même `group`, UI en français) est-elle **tenue par le code** et un test, pas seulement écrite ?

- Exemple (PR #89, ajout de questions d'un autre titre) : des tests appelaient `buildExam()` sans pool et la suite TNR lisait toutes les questions ; ils passaient encore, mais sur un pool qu'aucun titre n'utilise (pluriannuelle mêlée à la carte de résident), et les TNR auraient échoué en production. Question : quand les données s'élargissent (nouvelle liste, nouveau titre), chaque test (Vitest et `e2e/`) lit-il encore le pool réellement montré à l'utilisateur ?

## 4. Cas multiples et concurrence
- Question : deux onglets ouverts, un examen repris puis abandonné, un double clic sur « Valider » ou « Question suivante », le chrono qui expire pendant la correction ?

## 5. Une donnée moins fiable qui décide pour une plus fiable
- Question : un état en mémoire, une valeur passée par l'URL ou par `location.state` prend-il le pas sur ce que `questions.json` ou la sauvegarde disent vraiment ?

## 6. Instructions contradictoires
- Question : la PR introduit-elle une règle qui contredit `AGENTS.md`, le README, `docs/sous-agent-dev.md` ou un texte de l'interface ?

## 7. Erreurs avalées et défauts dangereux
- Question : un `try / catch` vide ou un repli silencieux cache-t-il une perte de données (historique écrasé, progression perdue) ? Le comportement par défaut est-il le plus sûr ?
