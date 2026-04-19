import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getDb } from "./db";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface AdminUserRow {
	id: number;
	username: string;
	password_hash: string;
}

interface LoginSecurityRow {
	failed_attempts: number;
	lock_until: string | null;
}

export interface AdminUser {
	id: number;
	username: string;
}

export type AuthResult =
	| { ok: true; token: string; userId: number }
	| { ok: false; reason: "invalid" | "locked"; retryAfterSeconds?: number };

export function verifyPassword(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash);
}

function hashPassword(password: string): string {
	return bcrypt.hashSync(password, 10);
}

function ensureLoginSecurityRow() {
	const db = getDb();
	const row = db.prepare(
		"SELECT failed_attempts, lock_until FROM login_security WHERE id = 1",
	).get() as LoginSecurityRow | undefined;

	if (!row) {
		db.prepare(
			"INSERT INTO login_security (id, failed_attempts, lock_until) VALUES (1, 0, NULL)",
		).run();
		return { failed_attempts: 0, lock_until: null };
	}

	return row;
}

function resetLoginProtection(): void {
	const db = getDb();
	db.prepare(
		"UPDATE login_security SET failed_attempts = 0, lock_until = NULL WHERE id = 1",
	).run();
}

export function recordAdminActivity(): void {
	const db = getDb();
	db.prepare(
		"UPDATE site_settings SET last_admin_login_at = ? WHERE id = 1",
	).run(new Date().toISOString());
}

export function getLastAdminLoginAt(): string | null {
	const db = getDb();
	const row = db.prepare(
		"SELECT last_admin_login_at FROM site_settings WHERE id = 1",
	).get() as { last_admin_login_at: string | null } | undefined;
	return row?.last_admin_login_at ?? null;
}

function getRetryAfterSeconds(lockUntil: string): number {
	return Math.max(0, Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 1000));
}

function getLoginProtectionState(): {
	failedAttempts: number;
	locked: boolean;
	lockUntil: string | null;
	retryAfterSeconds: number;
} {
	const row = ensureLoginSecurityRow();

	if (!row.lock_until) {
		return {
			failedAttempts: row.failed_attempts,
			locked: false,
			lockUntil: null,
			retryAfterSeconds: 0,
		};
	}

	const retryAfterSeconds = getRetryAfterSeconds(row.lock_until);
	if (retryAfterSeconds <= 0) {
		resetLoginProtection();
		return {
			failedAttempts: 0,
			locked: false,
			lockUntil: null,
			retryAfterSeconds: 0,
		};
	}

	return {
		failedAttempts: row.failed_attempts,
		locked: true,
		lockUntil: row.lock_until,
		retryAfterSeconds,
	};
}

function recordFailedLoginAttempt(): {
	locked: boolean;
	retryAfterSeconds: number;
} {
	const db = getDb();
	const state = getLoginProtectionState();
	if (state.locked) {
		return {
			locked: true,
			retryAfterSeconds: state.retryAfterSeconds,
		};
	}

	const nextFailedAttempts = state.failedAttempts + 1;
	if (nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
		const lockUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS).toISOString();
		db.prepare(
			"UPDATE login_security SET failed_attempts = 0, lock_until = ? WHERE id = 1",
		).run(lockUntil);
		return {
			locked: true,
			retryAfterSeconds: getRetryAfterSeconds(lockUntil),
		};
	}

	db.prepare(
		"UPDATE login_security SET failed_attempts = ?, lock_until = NULL WHERE id = 1",
	).run(nextFailedAttempts);

	return {
		locked: false,
		retryAfterSeconds: 0,
	};
}

export function createSession(userId: number): string {
	const db = getDb();
	const token = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
	db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
	// Clean expired sessions
	db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
	return token;
}

export function validateSession(token: string): { userId: number } | null {
	const db = getDb();
	const row = db.prepare(
		"SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')",
	).get(token) as { user_id: number } | undefined;
	return row ? { userId: row.user_id } : null;
}

export function deleteSession(token: string): void {
	const db = getDb();
	db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function deleteSessionsForUser(userId: number): void {
	const db = getDb();
	db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

function getAdminUserRowById(userId: number): AdminUserRow | null {
	const db = getDb();
	const user = db
		.prepare("SELECT id, username, password_hash FROM admin_users WHERE id = ?")
		.get(userId) as AdminUserRow | undefined;
	return user ?? null;
}

function getAdminUserRowByUsername(username: string): AdminUserRow | null {
	const db = getDb();
	const user = db
		.prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?")
		.get(username) as AdminUserRow | undefined;
	return user ?? null;
}

export function getAdminUserById(userId: number): AdminUser | null {
	const user = getAdminUserRowById(userId);
	if (!user) {
		return null;
	}

	return {
		id: user.id,
		username: user.username,
	};
}

export function verifyAdminCurrentPassword(userId: number, password: string): boolean {
	const user = getAdminUserRowById(userId);
	if (!user) {
		return false;
	}

	return verifyPassword(password, user.password_hash);
}

export function isAdminUsernameTaken(username: string, excludeUserId?: number): boolean {
	const user = getAdminUserRowByUsername(username);
	if (!user) {
		return false;
	}

	return user.id !== excludeUserId;
}

export function updateAdminCredentials(
	userId: number,
	options: {
		username: string;
		newPassword?: string;
	},
): AdminUser | null {
	const db = getDb();
	const currentUser = getAdminUserRowById(userId);
	if (!currentUser) {
		return null;
	}

	const nextPasswordHash = options.newPassword
		? hashPassword(options.newPassword)
		: currentUser.password_hash;

	db.prepare(
		"UPDATE admin_users SET username = ?, password_hash = ? WHERE id = ?",
	).run(options.username, nextPasswordHash, userId);

	return getAdminUserById(userId);
}

export function authenticateUser(username: string, password: string): AuthResult {
	const protection = getLoginProtectionState();
	if (protection.locked) {
		return {
			ok: false,
			reason: "locked",
			retryAfterSeconds: protection.retryAfterSeconds,
		};
	}

	const user = getAdminUserRowByUsername(username);
	if (!user || !verifyPassword(password, user.password_hash)) {
		const failure = recordFailedLoginAttempt();
		if (failure.locked) {
			return {
				ok: false,
				reason: "locked",
				retryAfterSeconds: failure.retryAfterSeconds,
			};
		}

		return {
			ok: false,
			reason: "invalid",
		};
	}

	resetLoginProtection();
	recordAdminActivity();
	const token = createSession(user.id);
	return { ok: true, token, userId: user.id };
}
