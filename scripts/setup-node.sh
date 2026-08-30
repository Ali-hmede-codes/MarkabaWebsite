#!/usr/bin/env bash
# =============================================================================
# News Markaba — nvm + Node 18, then install packages and start the site
#
#   bash scripts/setup-node.sh
#   bash scripts/setup-node.sh --node-only    # nvm/node only, do not start
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NVM_VERSION="v0.40.3"
NODE_VERSION="18"
NODE_ONLY=0

if [[ "${1:-}" == "--node-only" ]]; then
  NODE_ONLY=1
fi

if [[ -f "$ROOT_DIR/.nvmrc" ]]; then
  NODE_VERSION="$(tr -d '[:space:]' < "$ROOT_DIR/.nvmrc")"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

load_nvm() {
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    return 0
  fi
  return 1
}

echo
echo "News Markaba — Node.js setup"
echo "Required: Node ${NODE_VERSION}+ / npm 8+"
echo

if command -v node >/dev/null 2>&1; then
  CURRENT_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
else
  CURRENT_MAJOR=0
fi

if [[ "$CURRENT_MAJOR" -ge 18 ]]; then
  echo "Node $(node -v) is already installed. Skipping nvm."
else
  if ! load_nvm; then
    echo "nvm not found. Installing nvm ${NVM_VERSION}..."
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
    if ! load_nvm; then
      echo "nvm installed, but this shell could not load it."
      echo "Open a new terminal, then run:  bash scripts/setup-node.sh"
      exit 1
    fi
    echo "nvm ${NVM_VERSION} installed."
  else
    echo "nvm already installed: $(nvm --version)"
  fi

  echo "Installing Node.js ${NODE_VERSION}..."
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
  nvm alias default "$NODE_VERSION"
fi

echo
echo "Active versions:"
echo "  node $(node -v)"
echo "  npm  $(npm -v)"
echo

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
NPM_MAJOR="$(npm -v | cut -d. -f1)"

if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "Node $(node -v) is too old. This project needs Node 18+."
  exit 1
fi

if [[ "$NPM_MAJOR" -lt 8 ]]; then
  echo "npm $(npm -v) is too old. This project needs npm 8+."
  exit 1
fi

if [[ "$NODE_ONLY" -eq 1 ]]; then
  echo "Node is ready. Start later with:  npm run setup:node"
  exit 0
fi

cd "$ROOT_DIR"

if [[ ! -d node_modules || ! -d client/node_modules || ! -d server/node_modules ]]; then
  echo "Installing packages..."
  [[ -d node_modules ]] || npm install
  [[ -d client/node_modules ]] || (cd client && npm install)
  [[ -d server/node_modules ]] || (cd server && npm install)
  echo "Packages installed."
  echo
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing .env — run:  bash scripts/setup-env.sh --domain localhost --yes"
  exit 1
fi

echo "Starting website..."
echo "  Site:  http://localhost:3000"
echo "  API:   http://localhost:5000"
echo
exec npm run start-dev
