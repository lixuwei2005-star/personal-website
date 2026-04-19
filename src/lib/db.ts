import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { runMigrations } from "./migrate";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "site.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!_db) {
		const dir = path.dirname(DB_PATH);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		_db = new Database(DB_PATH);
		_db.pragma("journal_mode = WAL");
		_db.pragma("foreign_keys = ON");

		runMigrations(_db);
	}
	return _db;
}
