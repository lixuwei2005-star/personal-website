import type Database from "better-sqlite3";

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeId(preferredId: string | null | undefined, fallbackLabel: string | null | undefined, prefix: string): string {
	const trimmedPreferredId = preferredId?.trim();
	if (trimmedPreferredId) {
		return trimmedPreferredId;
	}

	const fallbackId = slugify(fallbackLabel || "");
	return fallbackId || prefix;
}

export function ensureUniqueId(
	db: Database.Database,
	table: string,
	preferredId: string | null | undefined,
	fallbackLabel: string | null | undefined,
	prefix: string,
	currentId?: string | null,
): string {
	const baseId = normalizeId(preferredId, fallbackLabel, prefix);
	const exists = db.prepare(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`);

	let candidate = baseId;
	let suffix = 2;
	while (true) {
		const row = exists.get(candidate) as { id: string } | undefined;
		if (!row || row.id === currentId) {
			return candidate;
		}
		candidate = `${baseId}-${suffix}`;
		suffix += 1;
	}
}

export function repairMissingIds(
	db: Database.Database,
	table: string,
	labelColumn: string,
	prefix: string,
): void {
	const rows = db.prepare(
		`SELECT rowid AS rowid, ${labelColumn} AS label FROM ${table} WHERE id IS NULL OR TRIM(id) = ''`,
	).all() as Array<{ rowid: number; label: string | null }>;

	if (rows.length === 0) {
		return;
	}

	const findById = db.prepare(`SELECT rowid FROM ${table} WHERE id = ? LIMIT 1`);
	const updateId = db.prepare(`UPDATE ${table} SET id = ? WHERE rowid = ?`);

	for (const row of rows) {
		const baseId = normalizeId(null, row.label, prefix);
		let candidate = baseId;
		let suffix = 2;

		while (true) {
			const existing = findById.get(candidate) as { rowid: number } | undefined;
			if (!existing || existing.rowid === row.rowid) {
				updateId.run(candidate, row.rowid);
				break;
			}
			candidate = `${baseId}-${suffix}`;
			suffix += 1;
		}
	}
}
