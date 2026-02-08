#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$ROOT_DIR/ChatUI"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed."
  exit 1
fi

if [[ ! -d "$UI_DIR" ]]; then
  echo "Error: ChatUI directory not found at $UI_DIR"
  exit 1
fi

cd "$UI_DIR"

if [[ ! -d node_modules ]]; then
  echo "node_modules not found, installing dependencies..."
  npm install
fi

PW_CACHE_DIR="$HOME/Library/Caches/ms-playwright"
if [[ ! -d "$PW_CACHE_DIR" ]]; then
  echo "Playwright browsers not found, installing..."
  npx playwright install
fi

echo "Running Playwright tests..."
npm run test:e2e
