#!/usr/bin/env bash
# Crée (une seule fois) le worktree persistant d'un agent : ../test-civique-<agent>
# Usage : scripts/agent-worktree.sh <agent>   (claude-dev ou review)
# Ensuite, par carte : cd ../test-civique-<agent> && git switch -c <branche> origin/main
# Ports dédiés : claude-dev 5211 · review 5212 · relecteur (vite preview) 5213
set -euo pipefail

agent="${1:?usage: scripts/agent-worktree.sh <agent>}"
main="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
dir="$(dirname "$main")/test-civique-$agent"

if [ -e "$dir" ]; then
  echo "Existe déjà : $dir" >&2
  exit 1
fi

git fetch origin main
git worktree add --detach "$dir" origin/main

# Fichiers non versionnés que git ne transporte pas dans un worktree
[ -f "$main/.env" ] && cp "$main/.env" "$dir/.env"

(cd "$dir" && npm install --no-audit --no-fund)
(cd "$dir" && graphify update . >/dev/null 2>&1 || true)

echo "Worktree prêt : $dir"
