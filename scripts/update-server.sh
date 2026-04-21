#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="mizuki"

cd "${PROJECT_ROOT}"

# Paths written by the admin panel at runtime. They live outside git now
# (see .gitignore), but we back them up anyway so the very first pull after
# they were removed from tracking doesn't wipe server content.
RUNTIME_PATHS=(
	"data/site.db"
	"public/uploads"
	"src/content/spec/about.md"
	"src/content/spec/about-site.md"
	"public/images/albums"
)

echo "[mizuki] project root: ${PROJECT_ROOT}"
echo "[mizuki] runtime data is preserved in:"
for p in "${RUNTIME_PATHS[@]}"; do
	echo "  - ${p}"
done

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

BACKUP_DIR="$(mktemp -d)"

restore_runtime_paths() {
	local exit_code=$?
	echo "[mizuki] restoring runtime paths from backup..."
	for p in "${RUNTIME_PATHS[@]}"; do
		if [[ -e "${BACKUP_DIR}/${p}" ]]; then
			rm -rf "${p}"
			mkdir -p "$(dirname "${p}")"
			cp -a "${BACKUP_DIR}/${p}" "${p}"
		fi
	done
	rm -rf "${BACKUP_DIR}"
	return $exit_code
}
trap restore_runtime_paths EXIT

echo "[mizuki] backing up runtime paths to ${BACKUP_DIR}..."
for p in "${RUNTIME_PATHS[@]}"; do
	if [[ -e "${p}" ]]; then
		mkdir -p "${BACKUP_DIR}/$(dirname "${p}")"
		cp -a "${p}" "${BACKUP_DIR}/${p}"
	fi
done

# Reset any tracked-file state for the runtime paths so `git pull` can cleanly
# apply commits that previously tracked them (e.g. the untrack-admin-content
# commit). Non-runtime tracked changes still abort below. Backup above will be
# restored in the EXIT trap whether the pull succeeds or aborts.
for p in "${RUNTIME_PATHS[@]}"; do
	git checkout HEAD -- "${p}" 2>/dev/null || true
done

if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "[mizuki] the repository has tracked local changes outside runtime paths."
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
