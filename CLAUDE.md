# CLAUDE.md — Test Civique 🇫🇷

@AGENTS.md

Le contenu portable (produit, données, workflow TL + sous-agents, Git, Trello, environnement) vit dans `AGENTS.md`, importé ci-dessus. Ce fichier ne garde que ce qui est propre à Claude Code. Depuis le 2026-11-20, une seule session tient le rôle de lead tech et confie chaque carte à un sous-agent dev (outil `Agent`, gabarit `docs/sous-agent-dev.md`).

---

## Mémoire persistante

En complément d'`AGENTS.md`, Claude Code a une mémoire automatique (`~/.claude/projects/.../memory/`). Toute règle de fonctionnement durable et utile au projet doit aussi être écrite dans `AGENTS.md`, pas seulement mémorisée.

## Outils propres à Claude Code

- Skill `impeccable:impeccable` pour le design et la relecture d'interface (voir `AGENTS.md` → Workflow)
- Commandes globales `/save` (fichier de session dans `.claude/sessions/`, avant un `/clear`) et `/start` (reprise de la session TL)

---

Règles génériques de collaboration (langue, rythme, git/PR, continuité) : `~/.claude/CLAUDE.md`.
