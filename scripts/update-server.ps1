$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$AppName = "mizuki"

Set-Location $ProjectRoot

# Paths written by the admin panel at runtime. They live outside git now
# (see .gitignore), but we back them up anyway so the very first pull after
# they were removed from tracking doesn't wipe server content.
$RuntimePaths = @(
	"data/site.db",
	"public/uploads",
	"src/content/spec/about.md",
	"src/content/spec/about-site.md",
	"public/images/albums"
)

Write-Host "[mizuki] project root: $ProjectRoot"
Write-Host "[mizuki] runtime data is preserved in:"
foreach ($p in $RuntimePaths) {
	Write-Host "  - $p"
}

function Test-Command {
	param([string]$Name)

	if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
		throw "[mizuki] missing required command: $Name"
	}
}

Test-Command git
Test-Command node
Test-Command pm2

$BackupDir = Join-Path ([System.IO.Path]::GetTempPath()) ("mizuki-backup-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $BackupDir | Out-Null

Write-Host "[mizuki] backing up runtime paths to $BackupDir..."
foreach ($p in $RuntimePaths) {
	if (Test-Path $p) {
		$dest = Join-Path $BackupDir $p
		$destParent = Split-Path -Parent $dest
		if (-not (Test-Path $destParent)) {
			New-Item -ItemType Directory -Path $destParent -Force | Out-Null
		}
		Copy-Item -Path $p -Destination $dest -Recurse -Force
	}
}

try {
	# Reset any tracked-file state for the runtime paths so `git pull` can cleanly
	# apply commits that previously tracked them (e.g. the untrack-admin-content
	# commit). Non-runtime tracked changes still abort below.
	foreach ($p in $RuntimePaths) {
		git checkout HEAD -- $p 2>$null
	}

	git diff --quiet
	$hasWorkingTreeChanges = $LASTEXITCODE -ne 0

	git diff --cached --quiet
	$hasIndexChanges = $LASTEXITCODE -ne 0

	if ($hasWorkingTreeChanges -or $hasIndexChanges) {
		throw "[mizuki] the repository has tracked local changes outside runtime paths. Update aborted to avoid overwriting server-side changes. Run 'git status' and resolve them first."
	}

	Write-Host "[mizuki] pulling latest code..."
	git pull --ff-only
} finally {
	Write-Host "[mizuki] restoring runtime paths from backup..."
	foreach ($p in $RuntimePaths) {
		$src = Join-Path $BackupDir $p
		if (Test-Path $src) {
			if (Test-Path $p) {
				Remove-Item -Path $p -Recurse -Force
			}
			$parent = Split-Path -Parent $p
			if ($parent -and -not (Test-Path $parent)) {
				New-Item -ItemType Directory -Path $parent -Force | Out-Null
			}
			Copy-Item -Path $src -Destination $p -Recurse -Force
		}
	}
	if (Test-Path $BackupDir) {
		Remove-Item -Path $BackupDir -Recurse -Force
	}
}

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
