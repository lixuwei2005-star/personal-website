import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");
const GENERATED_ANNOUNCEMENTS_PATH = path.join(
	ROOT,
	"src",
	"generated",
	"announcements.ts",
);

function writeAnnouncementsFile(items, loaded = true) {
	const fileContent = `import type { AnnouncementConfig } from "../types/config";

export const announcementOverrideConfigLoaded = ${loaded ? "true" : "false"};
export const announcementOverrideConfig: AnnouncementConfig[] = ${JSON.stringify(items, null, 2)};
`;

	mkdirSync(path.dirname(GENERATED_ANNOUNCEMENTS_PATH), { recursive: true });
	writeFileSync(GENERATED_ANNOUNCEMENTS_PATH, fileContent, "utf-8");
}

if (!existsSync(DB_PATH)) {
	writeAnnouncementsFile([], false);
	console.log("[sync-db-announcements] Database not found, wrote empty announcement override.");
	process.exit(0);
}

const db = new Database(DB_PATH);
const table = db
	.prepare(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'announcements'",
	)
	.get();

if (!table) {
	db.close();
	writeAnnouncementsFile([], false);
	console.log("[sync-db-announcements] Announcements table not found, wrote empty announcement override.");
	process.exit(0);
}

const rows = db
	.prepare(
		`SELECT *
		 FROM announcements
		 ORDER BY pinned DESC, sort_order ASC, id ASC`,
	)
	.all();

let globalSettingsRow = null;
const siteSettingsTable = db
	.prepare(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'site_settings'",
	)
	.get();

if (siteSettingsTable) {
	try {
		globalSettingsRow = db
			.prepare(
				`SELECT announcement_position, announcement_animation_delay
				 FROM site_settings
				 WHERE id = 1`,
			)
			.get();
	} catch {
		globalSettingsRow = null;
	}
}

db.close();

const globalPosition =
	globalSettingsRow?.announcement_position === "sticky" ? "sticky" : "top";
const globalAnimationDelay = Number.isFinite(
	globalSettingsRow?.announcement_animation_delay,
)
	? Math.max(0, Math.round(globalSettingsRow.announcement_animation_delay))
	: 50;

const items = rows.map((row) => ({
	id: row.id,
	title:
		typeof row.title === "string" && row.title.trim()
			? row.title.trim()
			: undefined,
	content:
		typeof row.content === "string"
			? row.content.trim()
			: "",
	closable: row.closable === 1,
	link: {
		enable: row.link_enable === 1,
		text:
			typeof row.link_text === "string"
				? row.link_text.trim()
				: "",
		url:
			typeof row.link_url === "string"
				? row.link_url.trim()
				: "",
		external: row.link_external === 1,
	},
	pinned: row.pinned === 1,
	sortOrder:
		Number.isFinite(row.sort_order) ? Math.max(0, Math.round(row.sort_order)) : 0,
	position: globalPosition,
	animationDelay: globalAnimationDelay,
}));

writeAnnouncementsFile(items);
console.log("[sync-db-announcements] Synced announcements override from database.");
