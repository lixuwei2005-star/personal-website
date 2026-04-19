import { getDb } from "../db";
import type { FriendItem as ToolItem } from "../../data/friends";

interface ToolRow {
	id: number;
	title: string;
	imgurl: string;
	description: string;
	siteurl: string;
	tags: string;
	sort_order: number;
}

function normalizeText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

function normalizeTags(value: unknown) {
	if (Array.isArray(value)) {
		return value
			.map((tag) => (typeof tag === "string" ? tag.trim() : ""))
			.filter(Boolean);
	}

	return [];
}

function normalizeSiteUrl(value: unknown) {
	const raw = normalizeText(value);
	if (!raw) {
		return "";
	}

	try {
		return new URL(raw).toString();
	} catch {
		try {
			return new URL(`https://${raw}`).toString();
		} catch {
			return raw;
		}
	}
}

function normalizeToolInput(data: Partial<Omit<ToolItem, "id">>) {
	return {
		title: normalizeText(data.title),
		imgurl: normalizeText(data.imgurl),
		desc: normalizeText(data.desc),
		siteurl: normalizeSiteUrl(data.siteurl),
		tags: normalizeTags(data.tags),
	};
}

function rowToTool(row: ToolRow): ToolItem {
	return {
		id: row.id,
		title: row.title,
		imgurl: row.imgurl,
		desc: row.description,
		siteurl: row.siteurl,
		tags: JSON.parse(row.tags),
	};
}

export function getAllTools(): ToolItem[] {
	const db = getDb();
	const rows = db
		.prepare("SELECT * FROM tools ORDER BY sort_order, id")
		.all() as ToolRow[];
	return rows.map(rowToTool);
}

export function getToolById(id: number): ToolItem | null {
	const db = getDb();
	const row = db
		.prepare("SELECT * FROM tools WHERE id = ?")
		.get(id) as ToolRow | undefined;
	return row ? rowToTool(row) : null;
}

export function createTool(data: Omit<ToolItem, "id">): ToolItem {
	const db = getDb();
	const normalized = normalizeToolInput(data);
	const result = db
		.prepare(
			"INSERT INTO tools (title, imgurl, description, siteurl, tags) VALUES (?, ?, ?, ?, ?)",
		)
		.run(
			normalized.title,
			normalized.imgurl,
			normalized.desc,
			normalized.siteurl,
			JSON.stringify(normalized.tags),
		);
	return getToolById(Number(result.lastInsertRowid))!;
}

export function updateTool(
	id: number,
	data: Partial<Omit<ToolItem, "id">>,
): ToolItem | null {
	const current = getToolById(id);
	if (!current) return null;

	const merged = normalizeToolInput({ ...current, ...data });
	const db = getDb();
	db.prepare(
		"UPDATE tools SET title = ?, imgurl = ?, description = ?, siteurl = ?, tags = ? WHERE id = ?",
	).run(
		merged.title,
		merged.imgurl,
		merged.desc,
		merged.siteurl,
		JSON.stringify(merged.tags),
		id,
	);
	return getToolById(id);
}

export function deleteTool(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM tools WHERE id = ?").run(id);
	return result.changes > 0;
}
