> Rapport archivé le 2026-11-27 après le batch « Qualité et parcours ». Les scripts, mesures brutes et captures cités ci-dessous sont restés dans le dossier temporaire de la session et ne sont pas versionnés ; les constats ont été repris en cartes Trello.

# Audit accessibilité — Futur Citoyen v1.21.0 (build `main`, `vite preview` :5213)

Date : 2026-11-27. Référentiel : WCAG 2.2 AA / RGAA 4.1. Outils : Playwright (Chromium), axe-core 4.10.2 injecté, arbre d'accessibilité Chromium (CDP), mesure de contraste au pixel (texte masqué, fond capturé, formes organiques comprises), `Page.setFontSizes` 32 px, `forced-colors: active`. Scripts et mesures brutes : ce dossier (`run_pages.py`, `contrast.py`, `contrast_states.py`, `keyboard.py`, `zoom.py`, `probes.py`, `forced.py`, `landscape.py`, `*.json`), captures dans `shots/`.

## Synthèse

1. Base saine : aucun contraste de texte en échec sur 15 pages × 2 tailles × 2 thèmes (plus de 17 000 segments de texte mesurés au pixel, formes organiques comprises), h1 unique partout, `lang="fr"`, titres d'onglet uniques, cibles ≥ 44 px hors liens dans une phrase, mouvement réduit respecté.
2. Défaut principal : à chaque changement de page (lien, bouton, « Retour », « Nouvel examen blanc »), le focus retombe sur `<body>`, sans annonce. L'utilisateur de lecteur d'écran ne sait pas que la page a changé (seuls l'examen et le résultat déplacent le focus).
3. En mode contraste forcé (Windows), la réponse choisie, le filtre actif, le thème choisi et la barre du chrono deviennent invisibles : ces états ne sont portés que par une couleur de fond.
4. Avec un texte à 200 %, le lien « Source » déborde aussi pendant la correction de l'examen et dans le détail d'un examen : même cause que le défaut connu sur `/revision`, mais il touche aussi l'examen.
5. Le reste est mineur : en-tête `banner` imbriqué dans `main`, focus perdu après « Supprimer l'examen en cours », cercle des titres non choisis peu contrasté, numéro de question non annoncé, quelques annonces et noms à affiner.

**Décompte : 0 bloquant, 3 importants, 9 mineurs** (plus 1 remarque hors critère).

Déjà connus, non recomptés : débordement de `/revision` à 200 % (voir I2 : la même cause touche aussi d'autres pages), perte du focus au passage des 1024 px.

---

## Importants

### I1. Focus perdu et page non annoncée à chaque navigation
- **Gravité** : important · **WCAG** 2.4.3 Parcours du focus, 4.1.3 Messages d'état (RGAA 12.8, 7.5)
- **Pages** : toutes les navigations internes, avec ou sans animation de transition. Mesuré par `keyboard.py` :
  - Accueil → « 1 · Réviser les thèmes » (Entrée) : `document.activeElement` = `BODY` ; Tab suivant = logo « Futur Citoyen ». Même chose pour Accueil → « Comment se passe l'examen ? », Accueil → étape 2 (`/examen-blanc`), « Retour » de `/regles`.
  - Écran de résultat → « Nouvel examen blanc » : focus sur `BODY` sur la nouvelle question 1.
  - Le titre d'onglet change bien (`Révision · Futur Citoyen`…), mais la plupart des lecteurs d'écran (VoiceOver iOS, TalkBack) ne l'annoncent pas pour une application monopage : rien n'annonce le changement de page.
- **Cause** : `src/components/PageShell.tsx:14-70` remplace la page (`setShown`) sans gérer le focus ; seuls `src/pages/Examen.tsx:269-277` (question suivante) et `src/components/ExamResult.tsx:40-42` (titre du résultat) le font. « Nouvel examen blanc » remonte la session par sa `key` (`Examen.tsx:82-90`) : le bouton disparaît, le focus avec lui.
- **Correctif** : dans `PageShell`, après chaque changement de `shown.pathname` (pas au premier chargement), placer le focus sur le `h1` de la nouvelle page (`tabIndex={-1}`, sans contour visible) ou à défaut sur `main`, et laisser l'examen et le résultat garder leur propre règle. Option : une région `aria-live="polite"` masquée qui reçoit `document.title`. Même traitement après le remontage de « Nouvel examen blanc » (focus sur le h1 de la question). Tests : focus sur le h1 après un clic de lien, en mouvement réduit et avec transition.
- **Taille** : [M]

### I2. Lien « Source » qui déborde à 200 % de texte aussi pendant l'examen et dans le détail (même cause que le défaut connu de `/revision`)
- **Gravité** : important (le défaut connu n'était listé que pour `/revision`, mais il touche aussi la correction de l'examen) · **WCAG** 1.4.4 Redimensionnement du texte, 1.4.10 Redistribution
- **Preuve** (`zoom.py`, `probes.py`) : 390 px, texte 32 px → correction de l'examen : `scrollWidth` 469 pour 390 (défilement horizontal de **79 px**), lien de x = 0 à 401 ; détail d'un examen : **83 px** ; à 320 px + 200 % : 149 px (correction) et 153 px (détail). Capture : `shots/texte200-correction-source.png`, `shots/zoom-texte200-tel|examen-correction.png`.
- **Cause** : `src/components/SourceLink.tsx:12` : `inline-flex … self-start` sans `max-w-full`, et un domaine sans point de coupure (« formation-civique.interieur.gouv.fr ») dans le `span` (l. 15-18).
- **Correctif** : `max-w-full` sur le lien, `min-w-0` et `[overflow-wrap:anywhere]` sur le `span` du libellé. Un seul composant : corriger les trois pages ensemble, avec la carte déjà prévue pour `/revision`.
- **Taille** : [S]

### I3. États invisibles en mode contraste forcé (Windows « Contraste élevé »)
- **Gravité** : important pour ce public (bloque la vérification de sa réponse), hors exigence stricte des WCAG · **WCAG** 1.4.11 (constaté sous `forced-colors: active`), 1.4.1
- **Preuve** (`forced.py`, captures `shots/forced-*.png`) : sous contraste forcé, les 4 cartes de réponse ont la même apparence calculée (`bg rgb(255,255,255)`, bordure noire 3 px, texte noir), que la carte soit `selected` ou `idle` : seule la pastille de la lettre perd son cercle (`forced-examen-choix.png`). Pastilles de filtre de `/revision` : `aria-pressed=true` et `false` identiques (`forced-revision.png`). Panneau « Affichage » : rien ne montre si « Clair » ou « Sombre » est choisi (`forced-panneau.png`). La barre du chrono (piste et remplissage) disparaît.
- **Cause** : états portés uniquement par `background-color`, que le mode forcé remplace : `src/components/AnswerCard.tsx:57` (`bg-primary` pour la sélection), `src/pages/Revision.tsx:31-35`, `src/pages/ExamenDetail.tsx:48`, `src/components/AppHeader.tsx:36-38`, chrono `src/pages/Examen.tsx:353-362`.
- **Correctif** : variantes `forced-colors:` de Tailwind : état choisi en `forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]` (ou bordure épaisse `forced-colors:border-[Highlight]`) sur les cartes de réponse, les filtres et les réglages ; chrono : `forced-colors:bg-[CanvasText]` sur le remplissage et une bordure `forced-colors:border` sur la piste. Contrôle visuel sous `forced-colors: active`.
- **Taille** : [M]

---

## Mineurs

### M1. En-tête `role="banner"` dans `main` (et `footer` dans `main` sur ordinateur)
- **WCAG** 1.3.1 (bonne pratique des repères ; RGAA 12.6) · axe `landmark-banner-is-top-level` sur les **60 combinaisons** page × taille × thème.
- **Preuve** : repères mesurés sur l'accueil : `main > banner, nav, section` ; à 1440 px, `footer(in main)`, donc pas de `contentinfo`. Aller au repère `main` ramène avant l'en-tête.
- **Cause** : `src/components/AppHeader.tsx:165-168` (rôle forcé, commentaire « inside <main> ») ; chaque page rend `<AppHeader />` dans son `<main>` (ex. `src/pages/Home.tsx:316-319`) ; `src/pages/Home.tsx:336` (`<footer>` dans `main`).
- **Correctif** : rendre l'en-tête avant `main` (wrapper `div` dans chaque page, ou `AppHeader` remonté dans `PageShell` avec ses variantes `thin` / `hideBrand` / `onLogoClick`), et sortir le pied de l'accueil de `main`.
- **Taille** : [M] (toutes les pages et leurs tests)

### M2. Focus perdu après « Supprimer l'examen en cours »
- **WCAG** 2.4.3 · Accueil avec examen en cours.
- **Preuve** : `probes.py` §2 : après Entrée, focus = `BODY` (le bouton disparaît avec sa section) ; Tab suivant = « Comment se passe l'examen ? ». Aucun message ne confirme la suppression.
- **Cause** : `src/pages/Home.tsx:157-160` et `245-251`.
- **Correctif** : après la suppression, mettre le focus sur le bouton de l'étape 2 (ou le h1) et annoncer « Examen en cours supprimé » dans une région `role="status"`.
- **Taille** : [S]

### M3. Cercle des titres non choisis peu contrasté (première visite)
- **WCAG** 1.4.11 Contraste du non-textuel · `/titre`, première visite.
- **Preuve** (pixels de `shots/p1-titre-premiere-tel-*.png`) : cercle `#B7B8B5` sur carte blanche = **1,99:1** (clair) ; `#5C5E57` sur `#1E2621` = **2,36:1** (sombre) ; seuil 3:1. Le titre choisi reste identifiable (coche, fond vert), mais rien ne montre clairement que les autres cartes sont des choix.
- **Cause** : `src/pages/TitreVise.tsx:86` (`border-muted-foreground/40`).
- **Correctif** : `border-muted-foreground` sans opacité (≈ 8:1 en clair) ou au moins `/70`.
- **Taille** : [S]

### M4. Examen au lecteur d'écran : numéro de question non annoncé, correction ambiguë
- **WCAG** 1.3.1, 4.1.2 · `/examen`.
- **Preuve** : après « Question suivante », le focus va sur le h1 (texte de la question seulement) : « Question 7 sur 40 » n'est pas lu. En correction, l'arbre d'accessibilité expose deux boutons radio désactivés : « Bonne réponse … » **non coché** et « Votre réponse … » **coché** (`ax_correction.py`), ce qui fait entendre « non coché » sur la bonne réponse.
- **Cause** : `src/pages/Examen.tsx:273-276` (focus) et `347-349` (compteur hors du titre) ; `src/pages/Examen.tsx:391-414` (cartes de correction en `<input type="radio" disabled>` avec `checked={isCorrect}`).
- **Correctif** : texte masqué « Question 7 sur 40 : » en tête du h1 (ou `aria-describedby` vers le compteur) ; en correction, afficher les cartes comme du contenu (sans `input`), le libellé « Bonne réponse » / « Votre réponse » suffit.
- **Taille** : [S]

### M5. Annonce « Il reste moins de 5 minutes » perdue à la reprise d'un examen
- **WCAG** 4.1.3 · `/examen` repris avec moins de 5 min (ou moins d'1 min).
- **Preuve** : `probes.py` §7 : `timeLeft` = 200 s → la région `aria-live` contient déjà « Il reste moins de 5 minutes. » au montage ; une région remplie dès son insertion n'est en général pas annoncée.
- **Cause** : `src/pages/Examen.tsx:73-79` et `371`.
- **Correctif** : région vide au montage, texte posé au tick suivant (ou au franchissement d'un seuil, mémorisé dans un état).
- **Taille** : [S]

### M6. Lien externe de l'accueil sans mention « nouvel onglet »
- **WCAG** 3.2.5 (AAA) / bonne pratique G201 ; RGAA 13.2 en usage · Accueil, pied de page.
- **Preuve** : `formation-civique.interieur.gouv.fr` a `target="_blank"` sans icône ni texte masqué ; les autres liens externes (sources, fiches, Légifrance, CNIL) ont « (nouvel onglet) ».
- **Cause** : `src/pages/Home.tsx:297-304`.
- **Correctif** : ajouter `<span className="sr-only"> (nouvel onglet)</span>` et l'icône `ArrowUpRight` comme dans `ExamRules.tsx:68-69`.
- **Taille** : [S]

### M7. Scores en « 39/40 » lus « barre oblique » ; `aria-label` sur un paragraphe
- **WCAG** 1.3.1 (lecture) · résultat, accueil (« Derniers examens »), détail (« Par thème »), examen blanc et fiches (« 32/40 pour réussir »).
- **Preuve** : sur le résultat, le score est un `<p aria-label="Score : 39 sur 40">` ; ARIA 1.2 interdit de nommer le rôle `paragraph`, et VoiceOver ou NVDA lisent alors le contenu « 39 /40 ». Ailleurs, « 8/11 » et « 32/40 » sont lus « 8 barre oblique 11 ».
- **Cause** : `src/components/ExamResult.tsx:64-70`, `src/pages/Home.tsx:43-45`, `src/pages/ExamenDetail.tsx:203-207`, `src/pages/ExamenBlanc.tsx:42`, `src/pages/FicheTitre.tsx:44`.
- **Correctif** : contenu visible en `aria-hidden="true"` doublé d'un `<span className="sr-only">39 sur 40</span>` (au lieu de l'`aria-label`), même motif pour les autres fractions.
- **Taille** : [S]

### M8. Pastille du verdict qui déborde à 320 px avec texte à 200 % (détail d'un examen)
- **WCAG** au-delà de l'exigence (1.4.4 et 1.4.10 cumulés) · `/examen/:id`.
- **Preuve** : `zoom.py` (`reflow320-texte200|detail`) : « Pas encore réussi · seuil 32/40 » va jusqu'à x = 337 pour 320 px (17 px de débordement, en plus de I2).
- **Cause** : `src/components/ExamVerdict.tsx:26` (`whitespace-nowrap` sur « seuil 32/40 »).
- **Correctif** : laisser la coupure possible (retirer `whitespace-nowrap`, ou n'insécabiliser que « 32/40 »).
- **Taille** : [S]

### M9. Titre du détail d'un examen sans contexte
- **WCAG** 2.4.6 En-têtes et étiquettes (RGAA 9.1) · `/examen/:id`.
- **Preuve** : h1 = « 26/40 » (nom « Score : 26 sur 40 ») ; la nature de la page (« Détail de l'examen du 21 novembre ») n'apparaît que dans le titre d'onglet.
- **Cause** : `src/pages/ExamenDetail.tsx:150-155`.
- **Correctif** : h1 « Examen du 21 novembre 2026 » (masqué ou visible) avec le score dessous, ou `<span className="sr-only">Examen du … : </span>` dans le h1.
- **Taille** : [S]

### Remarque hors critère : contraste du mot « Futur » du logo sur les formes
« Futur » (`#3A7A2C`) sur la forme bleue de `/regles` : **1,89:1** ; sur la forme verte de `/mentions-legales` : **2,94:1** (thème clair, 390 et 1440 px). Les logotypes sont exemptés par 1.4.3, mais ce logo sert aussi de lien vers l'accueil. Piste : ne pas faire passer les formes sous l'en-tête, ou un contour du texte. `src/components/BrandLogo.tsx:44`. Non compté.

---

## Vérifié sans défaut (hors connus)
- **Contrastes du texte** : 0 échec en clair comme en sombre, sur toutes les pages, dans les états choix / correction / panneau / titre choisi / détail « Toutes » (`contrast.json`, `contrast_states.json`) ; « bientôt », pastilles, textes `text-xs` sur les formes compris.
- **Non-textuel** : remplissage du chrono par rapport à sa piste : 5,16:1 (clair) et 8,69:1 (sombre) ; anneau de focus : 12,1:1 (clair) et 15,5:1 (sombre) ; case à cocher native correcte.
- **Clavier** : ordre logique sur toutes les pages, aucun piège, focus visible sur tous les éléments interactifs (contour 3 px ; contour porté par la carte pour les boutons radio). Flèches entre les réponses, Tab vers « Valider », focus sur le verdict puis sur la question suivante. Panneau « Affichage » : focus sur « Clair » à l'ouverture, fermeture en sortant au Tab, Échap rend le focus au bouton, `aria-expanded` à jour. Dialogues « Quitter l'examen ? » et « Commencer un nouvel examen ? » : focus initial sur « Annuler », Tab enfermé (avec un délai réaliste), Échap rend le focus au déclencheur (bouton « Quitter » ou logo), reste de la page retiré de l'arbre d'accessibilité.
- **Rôles et états** : `aria-pressed` (titres, filtres, réglages), `role="progressbar"` avec `aria-valuetext` « 30 minutes sur 45 », verdict en `role="status"`, région polie du nombre de questions en révision, `radiogroup` nommé par la question.
- **Structure** : un seul h1 par page, niveaux sans saut, `lang="fr"`, titres d'onglet uniques par page et par état (« Résultat », « Avant l'examen blanc »…).
- **Agrandissement** : texte à 200 % à 390 et 1440 px et reflow à 320 px sans débordement ni chevauchement sur toutes les pages, en dehors de I2 et M8 ; espacement du texte (1.4.12) sans perte ; paysage 844 × 390 : dialogue défilable (`overflow-y: auto`), panneau atteignable.
- **Cibles** : toutes ≥ 44 × 44 px, sauf liens dans une phrase (exemptés) et case « Sans les mises en situation » (22 px, avec un espacement suffisant, exception 2.5.8).
- **Mouvement** : `prefers-reduced-motion: reduce` sans choix enregistré donne `data-motion="off"`, pas d'`<animate>`, aucune transition de page ; « Désactivées » coupe l'animation en direct et les transitions suivantes ; le choix enregistré prime sur le réglage de l'appareil (2.2.2 et 2.3.3 couverts).
- **Chrono** : la limite de 45 min reproduit l'examen réel (exception « essentielle » de 2.2.1) ; quitter met le temps en pause (progression sauvegardée), et l'expiration mène au résultat avec focus sur son titre et « Temps écoulé : n questions sans réponse ».

## Non vérifié
- Lecteurs d'écran réels (VoiceOver iOS / macOS, TalkBack, NVDA) : seuls l'arbre d'accessibilité de Chromium et le comportement du DOM ont été contrôlés. Les annonces réelles (verdict `status`, régions `aria-live`, changement de titre) restent à écouter.
- Safari iOS et Firefox ; réglage de taille de texte du téléphone (Dynamic Type, taille de police Android), approché ici par `setFontSizes` et le reflow à 320 px.
- Zoom navigateur réel à 400 % sur ordinateur (simulé par la largeur de 320 px) ; commande vocale et contacteurs.
- Les transitions de page n'ont pas été regardées image par image (vérifié seulement qu'elles ne se déclenchent pas quand les animations sont coupées).
- Contraste forcé seulement émulé dans Chromium (`forced-colors: active`), pas sous Windows avec un vrai thème.
- Expiration complète du chrono de 45 min (testée avec 3 s restantes).
