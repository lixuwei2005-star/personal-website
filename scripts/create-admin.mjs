/**
 * Create admin user.
 * Usage: node scripts/create-admin.mjs <username> <password>
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");

const args = process.argv.slice(2);
if (args.length < 2) {
	console.error("Usage: node scripts/create-admin.mjs <username> <password>");
	process.exit(1);
}

const [username, password] = args;

const dir = path.dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Ensure tables exist
db.exec(readFileSync(path.join(ROOT, "scripts", "schema.sql"), "utf-8"));

const hash = bcrypt.hashSync(password, 10);

try {
	db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run(username, hash);
	console.log(`Admin user '${username}' created successfully.`);
} catch (err) {
	if (err.message.includes("UNIQUE constraint")) {
		// Update existing
		db.prepare("UPDATE admin_users SET password_hash = ? WHERE username = ?").run(hash, username);
		console.log(`Admin user '${username}' password updated.`);
	} else {
		throw err;
	}
}

db.close();
