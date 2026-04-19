#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="mizuki"

cd "${PROJECT_ROOT}"

echo "[mizuki] project root: ${PROJECT_ROOT}"
echo "[mizuki] runtime data is preserved in:"
echo "  - data/site.db"
echo "  - public/uploads/"

require_command() {
	local cmd="$1"
	if ! command -v "${cmd}" >/dev/null 2>&1; then
		echo "[mizuki] missing required command: ${cmd}" >&2
		exit 1
	fi
}

require_command git
require_command node
require_command pm2

if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "[mizuki] the repository has tracked local changes."
	echo "[mizuki] update aborted to avoid overwriting server-side changes."
	echo "[mizuki] run 'git status' and resolve them first."
	exit 1
fi

echo "[mizuki] pulling latest code..."
git pull --ff-only

if [[ -f "pnpm-lock.yaml" ]]; then
	if command -v pnpm >/dev/null 2>&1; then
		echo "[mizuki] installing dependencies with pnpm..."
		pnpm install --frozen-lockfile
	elif command -v corepack >/dev/null 2>&1; then
		echo "[mizuki] pnpm not found, using corepack..."
		corepack pnpm install --frozen-lockfile
	else
		echo "[mizuki] pnpm-lock.yaml exists, but neither pnpm nor corepack is available." >&2
		exit 1
	fi
else
	echo "[mizuki] installing dependencies with npm..."
	npm install
fi

echo "[mizuki] building production bundle..."
npm run build

if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
	echo "[mizuki] restarting pm2 app '${APP_NAME}'..."
	pm2 restart "${APP_NAME}"
else
	echo "[mizuki] pm2 app '${APP_NAME}' not found, starting from ecosystem config..."
	pm2 start ecosystem.config.cjs
	pm2 save
fi

echo "[mizuki] update complete."
