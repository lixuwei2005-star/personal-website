import { getDb } from "../db";
import type { FootprintItem } from "../../data/footprints";
import { resolveFootprintLocation } from "../footprints/location-service";

interface FootprintRow {
	id: number;
	title: string;
	country: string;
	province: string;
	city: string;
	latitude: number;
	longitude: number;
	visited_at: string;
	notes: string;
}

function normalizeText(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number.parseFloat(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return 0;
}

function normalizeFootprintInput(
	data: Partial<Omit<FootprintItem, "id">>,
): Omit<FootprintItem, "id"> {
	const country = normalizeText(data.country);
	const province = normalizeText(data.province);
	const city = normalizeText(data.city);
	const title =
		normalizeText(data.title) ||
		city ||
		province ||
		country ||
		"Untitled Place";

	return {
		title,
		country,
		province,
		city,
		latitude: normalizeNumber(data.latitude),
		longitude: normalizeNumber(data.longitude),
		visitedAt: normalizeText(data.visitedAt),
		notes: normalizeText(data.notes),
	};
}

interface FootprintMutationInput {
	countryCode?: string;
	province?: string;
	visitedAt?: string;
	notes?: string;
}

function rowToFootprint(row: FootprintRow): FootprintItem {
	return {
		id: row.id,
		title: row.title,
		country: row.country,
		province: row.province,
		city: row.city,
		latitude: row.latitude,
		longitude: row.longitude,
		visitedAt: row.visited_at,
		notes: row.notes,
	};
}

export function getAllFootprints(): FootprintItem[] {
	const db = getDb();
	const rows = db
		.prepare(
			"SELECT * FROM footprints ORDER BY CASE WHEN visited_at = '' THEN 1 ELSE 0 END, visited_at DESC, id DESC",
		)
		.all() as FootprintRow[];
	return rows.map(rowToFootprint);
}

export function getFootprintById(id: number): FootprintItem | null {
	const db = getDb();
	const row = db
		.prepare("SELECT * FROM footprints WHERE id = ?")
		.get(id) as FootprintRow | undefined;
	return row ? rowToFootprint(row) : null;
}

export async function createFootprint(
	data: FootprintMutationInput,
): Promise<FootprintItem> {
	const db = getDb();
	const visitedAt = normalizeText(data.visitedAt);
	const notes = normalizeText(data.notes);
	const resolved = await resolveFootprintLocation(
		normalizeText(data.countryCode),
		normalizeText(data.province),
	);
	const normalized = normalizeFootprintInput({
		title: resolved.title,
		country: resolved.country,
		province: resolved.province,
		city: "",
		latitude: resolved.latitude,
		longitude: resolved.longitude,
		visitedAt,
		notes,
	});
	const result = db
		.prepare(
			`INSERT INTO footprints (
				title,
				country,
				province,
				city,
				latitude,
				longitude,
				visited_at,
				notes
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			normalized.title,
			normalized.country,
			normalized.province,
			normalized.city,
			normalized.latitude,
			normalized.longitude,
			normalized.visitedAt,
			normalized.notes,
		);

	return getFootprintById(Number(result.lastInsertRowid))!;
}

export async function updateFootprint(
	id: number,
	data: FootprintMutationInput,
): Promise<FootprintItem | null> {
	const current = getFootprintById(id);
	if (!current) {
		return null;
	}

	const hasVisitedAt = Object.prototype.hasOwnProperty.call(data, "visitedAt");
	const hasNotes = Object.prototype.hasOwnProperty.call(data, "notes");
	const visitedAt = hasVisitedAt
		? normalizeText(data.visitedAt)
		: current.visitedAt;
	const notes = hasNotes ? normalizeText(data.notes) : current.notes;
	const resolved = await resolveFootprintLocation(
		normalizeText(data.countryCode) || current.country,
		normalizeText(data.province) || current.province,
	);
	const normalized = normalizeFootprintInput({
		title: resolved.title,
		country: resolved.country,
		province: resolved.province,
		city: "",
		latitude: resolved.latitude,
		longitude: resolved.longitude,
		visitedAt,
		notes,
	});

	const db = getDb();
	db.prepare(
		`UPDATE footprints
		SET title = ?, country = ?, province = ?, city = ?, latitude = ?, longitude = ?, visited_at = ?, notes = ?
		WHERE id = ?`,
	).run(
		normalized.title,
		normalized.country,
		normalized.province,
		normalized.city,
		normalized.latitude,
		normalized.longitude,
		normalized.visitedAt,
		normalized.notes,
		id,
	);

	return getFootprintById(id);
}

export function deleteFootprint(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM footprints WHERE id = ?").run(id);
	return result.changes > 0;
}
