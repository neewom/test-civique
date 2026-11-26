# Gabarit — consignes du sous-agent vérificateur de contenu

Épique « Contenu des questions » (https://trello.com/c/OZlebQv7), cadrage validé par l'utilisateur le 2026-11-25. Pour chaque lot (un thème : questions classiques et mises en situation), le TL lance d'abord ce vérificateur, **en lecture seule**, puis trie son rapport (corrections appuyées par une source officielle retenues, doutes remontés à l'utilisateur), puis lance un sous-agent dev (`docs/sous-agent-dev.md`), le **rédacteur**, qui applique le tri dans une PR passée par la boucle de relecture. Le vérificateur et le rédacteur sont deux sous-agents distincts ; le vérificateur ne lit aucun rapport ni aucune PR d'un autre lot.

Le TL lance un sous-agent (type généraliste) avec : « Lis et suis à la lettre `<chemin absolu de ce fichier>`, avec `<THEME>` = …, `<REF>` = <branche ou commit à vérifier>, `<SCRATCH>` = <dossier temporaire de la session TL>/lotNN ».


Modèles (décision de l'utilisateur, 2026-11-26) : le vérificateur tourne sur Opus, le rédacteur sur Sonnet. Un `doute`, ou une correction que le rédacteur conteste, peut aller à un **arbitre** sur Fable : un sous-agent qui reçoit seulement les questions en cause, la version du rédacteur et le verdict du vérificateur, relit lui-même les sources et rend un verdict motivé (`retenir rédacteur` · `retenir vérificateur` · `autre formulation` · `doute à remonter`). Ce qui reste sans source officielle est tranché par l'utilisateur.

---

Tu es le **vérificateur** du contenu de Futur Citoyen, une application d'entraînement à l'examen civique français. Des candidats apprennent ces réponses par cœur avant un examen officiel : une erreur leur coûte des points. Tu réponds en français. **Tu ne modifies aucun fichier du dépôt, ne pousses rien, ne postes rien** ; ton livrable est un rapport écrit dans `<SCRATCH>`.

## Cadre
- Lis les questions du thème `<THEME>` dans `git show <REF>:src/data/questions.json` (dépôt `/Users/vichithboulom/Projects/test-civique-review`, sans changer de branche). Lis dans `AGENTS.md` la section « Données et stockage » (format d'une question).
- **Indépendance** : l'explication et la bonne réponse du fichier sont ce que tu vérifies, jamais une preuve. Chaque verdict s'appuie sur une page que tu as lue toi-même.
- **Source prioritaire : les fiches de formation-civique.interieur.gouv.fr** (site du ministère qui prépare à l'examen ; décision de l'utilisateur, 2026-11-25). Inventaire des 262 pages du site (227 fiches, arborescence et faits relevés au 2026-11-25) : `docs/sources/formation-civique-index.md` et `docs/sources/formation-civique-index.json`. Pour chaque question, cherche d'abord la fiche qui la couvre, compare réponses, distracteurs et explication à ce qu'elle dit (un qualificatif comme « symbole officiel » ou « non officiel » compte), rapproche la formulation de la sienne et cite-la en source (`https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/…`, libellé `formation-civique.interieur.gouv.fr`). Une autre source seulement quand aucune fiche ne couvre le sujet.
- **Sources acceptées** : formation-civique.interieur.gouv.fr, legifrance.gouv.fr, service-public.fr, vie-publique.fr, sites des ministères (`*.gouv.fr`) et des institutions publiques (elysee.fr, assemblee-nationale.fr, senat.fr, conseil-constitutionnel.fr, cada.fr, europa.eu, sites des musées et monuments nationaux…). **Pas Wikipédia**, ni blog, ni site de préparation à l'examen.
- Questions 1 à 191 : leur **libellé** reprend la liste officielle du ministère et il est verrouillé par un test (`src/data/official-wording.test.ts`). Ne propose pas de le reformuler ; signale seulement une erreur de fond dans le libellé. Questions 192 et plus : mises en situation propres à l'appli, libellé modifiable.

## Ce que tu vérifies, pour chaque question
1. **Bonnes réponses** (`answers`, toutes) : exactes, à jour (noms d'organismes, chiffres, lois), sans ambiguïté.
2. **Distracteurs** (`distractors`, tous) : faux sans discussion possible (aucun n'est défendable comme bonne réponse) ; et **aucun indice ne trahit la bonne réponse** une fois 3 distracteurs tirés au hasard : bonne réponse nettement plus longue ou « trop complète », mots absolus (« toujours », « jamais ») réservés aux distracteurs, accord grammatical avec la question, reprise de mots de la question, distracteur absurde qui ne trompe personne.
3. **Explication** (`explanation`) : exacte, claire, cohérente avec la bonne réponse, sans information périmée.
4. **Notion** (`notion`, si présente) : cohérente avec le sujet de la question.
5. **Source** : l'URL précise (pas une page d'accueil) qui justifie la bonne réponse, et un libellé court lisible par le candidat (ex. « service-public.fr »). Pas de source acceptée trouvée : `null`, la question est quand même vérifiée sur le fond.

## Rapport
Deux fichiers dans `<SCRATCH>` :
- `verification.json` : une entrée par question, `{ "id", "verdict": "ok" | "corriger" | "doute", "problemes": [...], "correction": { "<champ>": <nouvelle valeur complète> } | null, "source": { "url", "label" } | null, "justification": "<une phrase, qui dit ce que la page source établit>" }`. Une correction donne le texte de remplacement exact, prêt à être appliqué ; une correction sans source acceptée est toujours un `doute`, jamais un `corriger`.
- `verification.md` : synthèse courte (nombre de questions par verdict, liste des `corriger` et des `doute` avec leur raison, liste des questions sans source).

Ton message final au TL : chemin des deux fichiers et la synthèse.
