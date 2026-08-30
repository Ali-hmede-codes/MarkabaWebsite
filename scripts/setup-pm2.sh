#!/usr/bin/env bash
# =============================================================================
# News Markaba — install PM2 and start frontend + backend
#
#   bash scripts/setup-pm2.sh
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo
echo "News Markaba — PM2 setup"
echo "Project: $ROOT_DIR"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is missing. Run:  bash scripts/setup-node.sh --node-only"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is missing."
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing .env. Run:  bash scripts/setup-env.sh --domain markaba.news --yes"
  exit 1
fi

if [[ ! -d "$ROOT_DIR/server/node_modules" || ! -d "$ROOT_DIR/client/node_modules" ]]; then
  echo "Installing packages..."
  npm install
  (cd server && npm install)
  (cd client && npm install)
fi

if [[ ! -d "$ROOT_DIR/client/.next" ]]; then
  echo "Building Next.js (first time)..."
  (cd client && npm run build)
fi

mkdir -p "$ROOT_DIR/logs"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2..."
  npm install -g pm2
fi

echo "Starting apps with PM2..."
pm2 start "$ROOT_DIR/ecosystem.config.js"
pm2 save

echo
echo "Apps:"
pm2 status
echo
echo "  Website:  http://127.0.0.1:3000"
echo "  API:      http://127.0.0.1:5000"
echo
echo "Useful commands:"
echo "  pm2 status"
echo "  pm2 logs"
echo "  pm2 restart all"
echo "  pm2 stop all"
echo
echo "Survive reboot (run the command PM2 prints):"
echo "  pm2 startup"
echo "  pm2 save"
echo
