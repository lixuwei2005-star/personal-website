import { getDb } from "../db";
import type { DiaryItem } from "../../data/diary";

interface DiaryRow {
	id: number;
	content: string;
	date: string;
	images: string;
	location: string | null;
	mood: string | null;
	tags: string;
}

function rowToDiary(row: DiaryRow): DiaryItem {
	return {
		id: row.id,
		content: row.content,
		date: row.date,
		images: JSON.parse(row.images),
		location: row.location || undefined,
		mood: row.mood || undefined,
		tags: JSON.parse(row.tags),
	};
}

function normalizeText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown) {
	const normalized = normalizeText(value);
	return normalized || undefined;
}

function normalizeStringArray(value: unknown) {
	if (Array.isArray(value)) {
		return value
			.map((item) => (typeof item === "string" ? item.trim() : ""))
			.filter(Boolean);
	}

	if (typeof value === "string") {
		return value
			.split(/\r?\n|,/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [] as string[];
}

function normalizeDiaryDate(value: unknown) {
	const candidate = typeof value === "string" && value ? value : new Date().toISOString();
	const parsed = new Date(candidate);
	return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeDiaryInput(data: Partial<Omit<DiaryItem, "id">>): Omit<DiaryItem, "id"> {
	return {
		content: normalizeText(data.content),
		date: normalizeDiaryDate(data.date),
		images: normalizeStringArray(data.images),
		location: normalizeOptionalText(data.location),
		mood: normalizeOptionalText(data.mood),
		tags: normalizeStringArray(data.tags),
	};
}

export function getAllDiary(limit?: number): DiaryItem[] {
	const db = getDb();
	let sql = "SELECT * FROM diary ORDER BY date DESC";
	if (limit && limit > 0) sql += ` LIMIT ${limit}`;
	return (db.prepare(sql).all() as DiaryRow[]).map(rowToDiary);
}

export function getDiaryById(id: number): DiaryItem | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM diary WHERE id = ?").get(id) as DiaryRow | undefined;
	return row ? rowToDiary(row) : null;
}

export function createDiary(data: Partial<Omit<DiaryItem, "id">>): DiaryItem {
	const db = getDb();
	const normalized = normalizeDiaryInput(data);
	const result = db.prepare(
		"INSERT INTO diary (content, date, images, location, mood, tags) VALUES (?, ?, ?, ?, ?, ?)",
	).run(
		normalized.content,
		normalized.date,
		JSON.stringify(normalized.images || []),
		normalized.location || null,
		normalized.mood || null,
		JSON.stringify(normalized.tags || []),
	);
	return getDiaryById(Number(result.lastInsertRowid))!;
}

export function updateDiary(id: number, data: Partial<Omit<DiaryItem, "id">>): DiaryItem | null {
	const current = getDiaryById(id);
	if (!current) return null;

	const normalized = normalizeDiaryInput({ ...current, ...data });
	const db = getDb();
	db.prepare(
		"UPDATE diary SET content = ?, date = ?, images = ?, location = ?, mood = ?, tags = ? WHERE id = ?",
	).run(
		normalized.content,
		normalized.date,
		JSON.stringify(normalized.images || []),
		normalized.location || null,
		normalized.mood || null,
		JSON.stringify(normalized.tags || []),
		id,
	);
	return getDiaryById(id);
}

export function deleteDiary(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM diary WHERE id = ?").run(id);
	return result.changes > 0;
}
