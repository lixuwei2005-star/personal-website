import { spawn } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

export type RebuildStatus = "idle" | "running" | "succeeded" | "failed";

export interface RebuildState {
	status: RebuildStatus;
	pid: number | null;
	startedAt: string | null;
	finishedAt: string | null;
	exitCode: number | null;
	triggeredBy: string | null;
	logPath: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const STATE_PATH = path.join(DATA_DIR, "rebuild.state.json");
const LOG_PATH = path.join(DATA_DIR, "rebuild.log");
const DEFAULT_SCRIPT = path.resolve(process.cwd(), "scripts", "rebuild.sh");

function ensureDataDir(): void {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

function emptyState(): RebuildState {
	return {
		status: "idle",
		pid: null,
		startedAt: null,
		finishedAt: null,
		exitCode: null,
		triggeredBy: null,
		logPath: LOG_PATH,
	};
}

function isPidAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

export function readRebuildState(): RebuildState {
	ensureDataDir();
	if (!existsSync(STATE_PATH)) {
		return emptyState();
	}

	try {
		const raw = readFileSync(STATE_PATH, "utf8");
		const parsed = JSON.parse(raw) as Partial<RebuildState>;
		const state: RebuildState = { ...emptyState(), ...parsed, logPath: LOG_PATH };

		// If the state claims "running" but the pid is gone (e.g. server was
		// restarted and the child was also killed), fall back to "failed" so
		// the UI does not stay stuck forever.
		if (state.status === "running") {
			if (state.pid && isPidAlive(state.pid)) {
				return state;
			}
			return {
				...state,
				status: "failed",
				finishedAt: state.finishedAt ?? new Date().toISOString(),
				exitCode: state.exitCode ?? -1,
			};
		}

		return state;
	} catch {
		return emptyState();
	}
}

function writeRebuildState(state: RebuildState): void {
	ensureDataDir();
	writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function readRebuildLogTail(maxLines = 200): string {
	if (!existsSync(LOG_PATH)) {
		return "";
	}

	try {
		const content = readFileSync(LOG_PATH, "utf8");
		const lines = content.split(/\r?\n/);
		return lines.slice(-maxLines).join("\n");
	} catch {
		return "";
	}
}

export interface StartRebuildResult {
	ok: boolean;
	state: RebuildState;
	error?: "already-running" | "script-missing" | "spawn-failed";
	message?: string;
}

export function startRebuild(options: {
	scriptPath?: string;
	triggeredBy?: string | null;
}): StartRebuildResult {
	const current = readRebuildState();
	if (current.status === "running") {
		return {
			ok: false,
			state: current,
			error: "already-running",
			message: "A rebuild is already in progress",
		};
	}

	const scriptPath = options.scriptPath ?? DEFAULT_SCRIPT;
	if (!existsSync(scriptPath)) {
		return {
			ok: false,
			state: current,
			error: "script-missing",
			message: `Rebuild script not found at ${scriptPath}`,
		};
	}

	ensureDataDir();
	writeFileSync(LOG_PATH, "", "utf8");

	const startedAt = new Date().toISOString();
	const placeholder: RebuildState = {
		status: "running",
		pid: null,
		startedAt,
		finishedAt: null,
		exitCode: null,
		triggeredBy: options.triggeredBy ?? null,
		logPath: LOG_PATH,
	};
	writeRebuildState(placeholder);

	try {
		const logFd = openSync(LOG_PATH, "a");
		const child = spawn("bash", [scriptPath], {
			cwd: process.cwd(),
			detached: true,
			stdio: ["ignore", logFd, logFd],
			env: {
				...process.env,
				MIZUKI_REBUILD_STATE_PATH: STATE_PATH,
			},
		});

		const pid = child.pid ?? null;

		const running: RebuildState = {
			...placeholder,
			pid,
		};
		writeRebuildState(running);

		child.on("exit", (code) => {
			const finalState: RebuildState = {
				status: code === 0 ? "succeeded" : "failed",
				pid,
				startedAt,
				finishedAt: new Date().toISOString(),
				exitCode: code ?? -1,
				triggeredBy: options.triggeredBy ?? null,
				logPath: LOG_PATH,
			};
			try {
				writeRebuildState(finalState);
			} catch {
				// Best-effort; the next poll will still classify the state.
			}
		});

		child.unref();

		return { ok: true, state: running };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const failed: RebuildState = {
			...placeholder,
			status: "failed",
			finishedAt: new Date().toISOString(),
			exitCode: -1,
		};
		writeRebuildState(failed);
		return { ok: false, state: failed, error: "spawn-failed", message };
	}
}

