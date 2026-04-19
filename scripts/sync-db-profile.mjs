import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");
const GENERATED_PROFILE_PATH = path.join(ROOT, "src", "generated", "profile.ts");

function writeProfileOverrideFile(profile) {
	const links = JSON.stringify(profile.links, null, "\t")
		.split("\n")
		.map((line) => `\t${line}`)
		.join("\n");

	const fileContent = `import type { ProfileConfig } from "../types/config";

export const profileOverrideConfig: Partial<ProfileConfig> = {
\tavatar: ${JSON.stringify(profile.avatar_path || "")},
\tname: ${JSON.stringify(profile.name || "")},
\tbio: ${JSON.stringify(profile.bio || "")},
\tlinks: ${links},
};
`;

	mkdirSync(path.dirname(GENERATED_PROFILE_PATH), { recursive: true });
	writeFileSync(GENERATED_PROFILE_PATH, fileContent, "utf-8");
}

function writeEmptyOverrideFile() {
	mkdirSync(path.dirname(GENERATED_PROFILE_PATH), { recursive: true });
	writeFileSync(
		GENERATED_PROFILE_PATH,
		'import type { ProfileConfig } from "../types/config";\n\nexport const profileOverrideConfig: Partial<ProfileConfig> = {};\n',
		"utf-8",
	);
}

if (!existsSync(DB_PATH)) {
	writeEmptyOverrideFile();
	console.log(`[sync-db-profile] Database not found, wrote empty override: ${DB_PATH}`);
	process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });
const profileTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'profile'")
	.get();

if (!profileTable) {
	db.close();
	writeEmptyOverrideFile();
	console.log("[sync-db-profile] Profile table not found, wrote empty override.");
	process.exit(0);
}

const row = db
	.prepare("SELECT name, bio, avatar_path, links FROM profile WHERE id = 1")
	.get();

db.close();

if (!row) {
	writeEmptyOverrideFile();
	console.log("[sync-db-profile] Profile row not found, wrote empty override.");
	process.exit(0);
}

writeProfileOverrideFile({
	...row,
	links: (() => {
		try {
			return JSON.parse(row.links || "[]");
		} catch {
			return [];
		}
	})(),
});

console.log("[sync-db-profile] Synced profile override from database.");
