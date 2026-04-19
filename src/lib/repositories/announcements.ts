import { getDb } from "../db";
import type { AnnouncementConfig } from "../../types/config";

export interface AdminAnnouncement {
	id: number;
	title: string;
	content: string;
	closable: boolean;
	linkEnable: boolean;
	linkText: string;
	linkUrl: string;
	linkExternal: boolean;
	pinned: boolean;
	sortOrder: number;
}

export interface AnnouncementGlobalSettings {
	position: "top" | "sticky";
	animationDelay: number;
}

interface AnnouncementRow {
	id: number;
	title: string;
	content: string;
	closable: number;
	link_enable: number;
	link_text: string;
	link_url: string;
	link_external: number;
	pinned: number;
	position: string;
	animation_delay: number;
	sort_order: number;
}

function normalizePosition(
	value: string | undefined,
): AnnouncementGlobalSettings["position"] {
	return value === "sticky" ? "sticky" : "top";
}

function normalizeAnimationDelay(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return 50;
	}

	return Math.max(0, Math.round(value));
}

const DEFAULT_ANNOUNCEMENT_GLOBAL_SETTINGS: AnnouncementGlobalSettings = {
	position: "top",
	animationDelay: 50,
};

function normalizeSortOrder(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return 0;
	}

	return Math.max(0, Math.round(value));
}

function rowToAnnouncement(row: AnnouncementRow): AdminAnnouncement {
	return {
		id: row.id,
		title: row.title,
		content: row.content,
		closable: row.closable === 1,
		linkEnable: row.link_enable === 1,
		linkText: row.link_text,
		linkUrl: row.link_url,
		linkExternal: row.link_external === 1,
		pinned: row.pinned === 1,
		sortOrder: normalizeSortOrder(row.sort_order),
	};
}

function ensureSiteSettingsRow(): void {
	const db = getDb();
	db.prepare("INSERT OR IGNORE INTO site_settings (id) VALUES (1)").run();
}

export function getAnnouncementGlobalSettings(): AnnouncementGlobalSettings {
	ensureSiteSettingsRow();
	const db = getDb();
	const row = db
		.prepare(
			`SELECT announcement_position, announcement_animation_delay
			 FROM site_settings
			 WHERE id = 1`,
		)
		.get() as
			| {
					announcement_position?: string;
					announcement_animation_delay?: number;
			  }
			| undefined;

	return {
		position: normalizePosition(
			row?.announcement_position ??
				DEFAULT_ANNOUNCEMENT_GLOBAL_SETTINGS.position,
		),
		animationDelay: normalizeAnimationDelay(
			row?.announcement_animation_delay ??
				DEFAULT_ANNOUNCEMENT_GLOBAL_SETTINGS.animationDelay,
		),
	};
}

export function updateAnnouncementGlobalSettings(
	data: Partial<AnnouncementGlobalSettings>,
): AnnouncementGlobalSettings {
	const current = getAnnouncementGlobalSettings();
	const next: AnnouncementGlobalSettings = {
		position: normalizePosition(data.position ?? current.position),
		animationDelay: normalizeAnimationDelay(
			data.animationDelay ?? current.animationDelay,
		),
	};

	const db = getDb();
	db.prepare(
		`UPDATE site_settings
		 SET announcement_position = ?,
			 announcement_animation_delay = ?
		 WHERE id = 1`,
	).run(next.position, next.animationDelay);

	return getAnnouncementGlobalSettings();
}

function getAnnouncementRowById(id: number): AnnouncementRow | null {
	const db = getDb();
	const row = db
		.prepare("SELECT * FROM announcements WHERE id = ?")
		.get(id) as AnnouncementRow | undefined;
	return row ?? null;
}

export function getAllAnnouncements(): AdminAnnouncement[] {
	const db = getDb();
	const rows = db
		.prepare(
			"SELECT * FROM announcements ORDER BY pinned DESC, sort_order ASC, id ASC",
		)
		.all() as AnnouncementRow[];

	return rows.map(rowToAnnouncement);
}

export function getAnnouncementById(id: number): AdminAnnouncement | null {
	const row = getAnnouncementRowById(id);
	return row ? rowToAnnouncement(row) : null;
}

export function createAnnouncement(
	data: Partial<Omit<AdminAnnouncement, "id">>,
): AdminAnnouncement {
	const db = getDb();
	const result = db
		.prepare(
			`INSERT INTO announcements (
				title,
				content,
				closable,
				link_enable,
				link_text,
				link_url,
				link_external,
				pinned,
				sort_order
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			typeof data.title === "string" ? data.title.trim() : "",
			typeof data.content === "string" ? data.content.trim() : "",
			data.closable === false ? 0 : 1,
			data.linkEnable === true ? 1 : 0,
			typeof data.linkText === "string" ? data.linkText.trim() : "",
			typeof data.linkUrl === "string" ? data.linkUrl.trim() : "",
			data.linkExternal === true ? 1 : 0,
			data.pinned === true ? 1 : 0,
			normalizeSortOrder(data.sortOrder),
		);

	return getAnnouncementById(Number(result.lastInsertRowid))!;
}

export function updateAnnouncement(
	id: number,
	data: Partial<Omit<AdminAnnouncement, "id">>,
): AdminAnnouncement | null {
	const current = getAnnouncementById(id);
	if (!current) {
		return null;
	}

	const merged: AdminAnnouncement = {
		...current,
		...data,
		title:
			typeof data.title === "string"
				? data.title.trim()
				: current.title,
		content:
			typeof data.content === "string"
				? data.content.trim()
				: current.content,
		linkText:
			typeof data.linkText === "string"
				? data.linkText.trim()
				: current.linkText,
		linkUrl:
			typeof data.linkUrl === "string"
				? data.linkUrl.trim()
				: current.linkUrl,
		sortOrder: normalizeSortOrder(data.sortOrder ?? current.sortOrder),
	};

	const db = getDb();
	db.prepare(
		`UPDATE announcements
		 SET title = ?,
			 content = ?,
			 closable = ?,
			 link_enable = ?,
			 link_text = ?,
			 link_url = ?,
			 link_external = ?,
			 pinned = ?,
			 sort_order = ?
		 WHERE id = ?`,
	).run(
		merged.title,
		merged.content,
		merged.closable ? 1 : 0,
		merged.linkEnable ? 1 : 0,
		merged.linkText,
		merged.linkUrl,
		merged.linkExternal ? 1 : 0,
		merged.pinned ? 1 : 0,
		merged.sortOrder,
		id,
	);

	return getAnnouncementById(id);
}

export function deleteAnnouncement(id: number): boolean {
	const db = getDb();
	const result = db
		.prepare("DELETE FROM announcements WHERE id = ?")
		.run(id);
	return result.changes > 0;
}

export function announcementToConfig(
	item: AdminAnnouncement,
): AnnouncementConfig {
	return {
		id: item.id,
		title: item.title || undefined,
		content: item.content,
		closable: item.closable,
		link: {
			enable: item.linkEnable,
			text: item.linkText,
			url: item.linkUrl,
			external: item.linkExternal,
		},
		pinned: item.pinned,
		sortOrder: item.sortOrder,
	};
}

export function getAnnouncementConfigs(): AnnouncementConfig[] {
	const globalSettings = getAnnouncementGlobalSettings();
	return getAllAnnouncements().map((announcement) => ({
		...announcementToConfig(announcement),
		position: globalSettings.position,
		animationDelay: globalSettings.animationDelay,
	}));
}
