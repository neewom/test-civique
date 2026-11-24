# Session 2026-11-24 (après-midi) — DESIGN.md, domaine futurcitoyen.fr (TL)

## Réalisé
- Carte « Maquettes de toute l'application » soldée (Done) après vérification de la page « Application actuelle » par l'utilisateur.
- [S] DESIGN.md (PR #56, sans version) : `DESIGN.md` + `.impeccable/design.json`, référencés dans AGENTS.md et `docs/sous-agent-dev.md`. Noms proposés validés par l'utilisateur. Journal : PR #57.
- Domaine **futurcitoyen.fr** réservé par l'utilisateur chez OVH (3 ans, DNSSEC, e-mail Zimbra Starter inclus, pas encore configuré). DNS chez OVH : A `@` → 75.2.60.5, CNAME `www` → test-civique.netlify.app. Netlify : domaine principal, HTTPS Let's Encrypt (jusqu'au 22/02/2027).
- [S] Basculer le site sur futurcitoyen.fr (PR #58, v1.6.2) : balises de partage, 301 de test-civique.netlify.app (hôte exact, aperçus épargnés), doc. Canonique fixe retirée en revue. Vérifié en prod. Journal : PR #59.
- Mémoire TL : lien de prod = https://futurcitoyen.fr.

## Reste à faire
- Cadrer « [S] Statistiques de visite » : débloquée, pré-cadrage en commentaire sur la carte (GoatCounter recommandé, passer par une réécriture `_redirects` pour garder la CSP ; questions ouvertes : outil, événements oui/non ; compte à créer par l'utilisateur).
- Puis « [S] Mentions légales et politique de confidentialité » (dépend des stats ; décider de l'éditeur affiché ; maquette avant le go ; adresse `contact@futurcitoyen.fr` possible via Zimbra).
- Canonique par page, robots.txt, sitemap : notés sur la carte « Communication et référencement ».
- Valeurs non harmonisées relevées par DESIGN.md (tailles de titre, rayons 16/24 px, gouttières 22/20 px) : pas de carte, à décider.

## Blockers
- Aucun. Aucune PR ouverte (vérifié par `gh pr list`), Todo / En cours / En review vides.

## Actions de l'utilisateur
- Éventuellement créer l'adresse e-mail Zimbra et couper la barre d'outils Netlify des aperçus.

## Décisions (utilisateur, 2026-11-24)
- DNS gardé chez OVH, domaine principal sans `www`.
- Stats mises de côté jusqu'au domaine (désormais réservé) ; batch « Socle avant lancement » réduit à DESIGN.md.
