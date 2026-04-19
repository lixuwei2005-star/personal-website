$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$AppName = "mizuki"

Set-Location $ProjectRoot

Write-Host "[mizuki] project root: $ProjectRoot"
Write-Host "[mizuki] runtime data is preserved in:"
Write-Host "  - data/site.db"
Write-Host "  - public/uploads/"

function Test-Command {
	param([string]$Name)

	if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
		throw "[mizuki] missing required command: $Name"
	}
}

Test-Command git
Test-Command node
Test-Command pm2

git diff --quiet
$hasWorkingTreeChanges = $LASTEXITCODE -ne 0

git diff --cached --quiet
$hasIndexChanges = $LASTEXITCODE -ne 0

if ($hasWorkingTreeChanges -or $hasIndexChanges) {
	throw "[mizuki] the repository has tracked local changes. Update aborted to avoid overwriting server-side changes. Run 'git status' and resolve them first."
}

Write-Host "[mizuki] pulling latest code..."
git pull --ff-only

if (Test-Path (Join-Path $ProjectRoot "pnpm-lock.yaml")) {
	if (Get-Command pnpm -ErrorAction SilentlyContinue) {
		Write-Host "[mizuki] installing dependencies with pnpm..."
		pnpm install --frozen-lockfile
	} elseif (Get-Command corepack -ErrorAction SilentlyContinue) {
		Write-Host "[mizuki] pnpm not found, using corepack..."
		corepack pnpm install --frozen-lockfile
	} else {
		throw "[mizuki] pnpm-lock.yaml exists, but neither pnpm nor corepack is available."
	}
} else {
	Write-Host "[mizuki] installing dependencies with npm..."
	npm install
}

Write-Host "[mizuki] building production bundle..."
npm run build

pm2 describe $AppName *> $null
if ($LASTEXITCODE -eq 0) {
	Write-Host "[mizuki] restarting pm2 app '$AppName'..."
	pm2 restart $AppName
} else {
	Write-Host "[mizuki] pm2 app '$AppName' not found, starting from ecosystem config..."
	pm2 start ecosystem.config.cjs
	pm2 save
}

Write-Host "[mizuki] update complete."
