#!/usr/bin/env bash

# Triggered by the admin panel to rebuild the site and hot-reload the running
# PM2 app. This script is intentionally standalone: it does NOT pull from git
# or install dependencies, because the admin panel only needs to regenerate
# static output from the latest database state.
#
# Runtime data paths preserved (never touched by this script):
#   - data/site.db
#   - public/uploads/
#
# Override defaults via environment variables:
#   MIZUKI_APP_NAME          PM2 app name (default: mizuki)
#   MIZUKI_BUILD_CMD         build command  (default: pnpm build, fallback: npm run build)
#   MIZUKI_SKIP_PM2_RELOAD   set to 1 to skip the final pm2 reload

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="${MIZUKI_APP_NAME:-mizuki}"
STATE_PATH="${MIZUKI_REBUILD_STATE_PATH:-${PROJECT_ROOT}/data/rebuild.state.json}"

cd "${PROJECT_ROOT}"

# Update the rebuild state file on exit so the admin UI reflects final status
# even if the Node API process was reloaded mid-build by `pm2 reload`.
finalize_state() {
	local exit_code="$1"
	local status
	if [[ "${exit_code}" -eq 0 ]]; then
		status="succeeded"
	else
		status="failed"
	fi

	if ! command -v node >/dev/null 2>&1; then
		return 0
	fi

	node --input-type=module -e "
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const p = process.argv[1];
const status = process.argv[2];
const exitCode = Number(process.argv[3]);
let s = {};
if (existsSync(p)) {
	try { s = JSON.parse(readFileSync(p, 'utf8')); } catch {}
}
s.status = status;
s.finishedAt = new Date().toISOString();
s.exitCode = exitCode;
writeFileSync(p, JSON.stringify(s, null, 2));
" "${STATE_PATH}" "${status}" "${exit_code}" >/dev/null 2>&1 || true
}

trap 'finalize_state $?' EXIT

echo "[rebuild] start at $(date '+%F %T')"
echo "[rebuild] project root: ${PROJECT_ROOT}"
echo "[rebuild] state file: ${STATE_PATH}"

# pnpm occasionally extracts native binaries without the executable bit
# (seen with @pagefind/linux-arm64 on Baota servers). Make sure anything
# under node_modules .../bin/ can actually run.
if [[ -d node_modules ]]; then
	echo "[rebuild] ensuring executable bits on node_modules binaries..."
	find node_modules -type f \( -path '*/.bin/*' -o -path '*/bin/pagefind*' -o -path '*/bin/esbuild*' \) -exec chmod +x {} + 2>/dev/null || true
fi

if [[ -n "${MIZUKI_BUILD_CMD:-}" ]]; then
	echo "[rebuild] running custom build command: ${MIZUKI_BUILD_CMD}"
	bash -c "${MIZUKI_BUILD_CMD}"
elif [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
	echo "[rebuild] building with pnpm..."
	pnpm build
elif command -v npm >/dev/null 2>&1; then
	echo "[rebuild] building with npm..."
	npm run build
else
	echo "[rebuild] no package manager found (pnpm or npm required)" >&2
	exit 1
fi

if [[ "${MIZUKI_SKIP_PM2_RELOAD:-0}" == "1" ]]; then
	echo "[rebuild] MIZUKI_SKIP_PM2_RELOAD=1, skipping pm2 reload"
elif command -v pm2 >/dev/null 2>&1; then
	if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
		echo "[rebuild] reloading pm2 app '${APP_NAME}'..."
		pm2 reload "${APP_NAME}" --update-env
	else
		echo "[rebuild] pm2 app '${APP_NAME}' not found, starting from ecosystem config..."
		pm2 start ecosystem.config.cjs
		pm2 save
	fi
else
	echo "[rebuild] pm2 not found, skipping reload" >&2
fi

echo "[rebuild] done at $(date '+%F %T')"
