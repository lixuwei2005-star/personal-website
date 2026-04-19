# Server Update Guide (PM2 + Source Code)

This project is designed to be updated on the server by keeping the full source code, rebuilding, and restarting the PM2 app.

## Keep these runtime data paths

Do not delete or overwrite these paths during updates:

- `data/site.db`
- `public/uploads/`

They contain your runtime data:

- admin content and settings stored in SQLite
- uploaded images, music, and other assets

## Recommended update flow

After pushing your latest code to Git, run this on the server inside the project directory:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
npm run build
pm2 restart mizuki
```

If this is the first deployment and the PM2 app does not exist yet:

```bash
pnpm install --frozen-lockfile
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

## One-command update scripts

This repository includes two helper scripts:

- Linux: `scripts/update-server.sh`
- Windows Server / PowerShell: `scripts/update-server.ps1`

### Linux

```bash
chmod +x scripts/update-server.sh
./scripts/update-server.sh
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-server.ps1
```

## What the scripts do

The update scripts will:

1. check that `git`, `node`, and `pm2` are available
2. stop if tracked files have local changes
3. pull the latest code with `git pull --ff-only`
4. install dependencies with `pnpm` if `pnpm-lock.yaml` exists, otherwise `npm`
5. run `npm run build`
6. restart the PM2 app `mizuki`, or start it from `ecosystem.config.cjs` if it does not exist yet

## Important note about tracked file changes

The scripts intentionally abort if the repository has tracked local changes.

This is a safety guard. It prevents `git pull` from overwriting server-side changes.

Before updating, check:

```bash
git status
```

If you see tracked file changes, resolve them first by committing, stashing, or backing them up manually.

## Verify after each update

After the update completes, check:

- the home page loads normally
- `/admin/` still opens and login works
- your latest article or setting change is visible
- uploaded files still exist

## Rollback

If an update fails and you need to go back quickly:

```bash
git log --oneline
git checkout <old-commit>
npm run build
pm2 restart mizuki
```

Do not remove `data/site.db` or `public/uploads/` during rollback.
