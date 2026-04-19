import { getDb } from "../db";
import type { FriendItem } from "../../data/friends";

interface FriendRow {
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

function normalizeFriendInput(data: Partial<Omit<FriendItem, "id">>) {
	return {
		title: normalizeText(data.title),
		imgurl: normalizeText(data.imgurl),
		desc: normalizeText(data.desc),
		siteurl: normalizeSiteUrl(data.siteurl),
		tags: normalizeTags(data.tags),
	};
}

function rowToFriend(row: FriendRow): FriendItem {
	return {
		id: row.id,
		title: row.title,
		imgurl: row.imgurl,
		desc: row.description,
		siteurl: row.siteurl,
		tags: JSON.parse(row.tags),
	};
}

export function getAllFriends(): FriendItem[] {
	const db = getDb();
	const rows = db.prepare("SELECT * FROM friends ORDER BY sort_order, id").all() as FriendRow[];
	return rows.map(rowToFriend);
}

export function getFriendById(id: number): FriendItem | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM friends WHERE id = ?").get(id) as FriendRow | undefined;
	return row ? rowToFriend(row) : null;
}

export function createFriend(data: Omit<FriendItem, "id">): FriendItem {
	const db = getDb();
	const normalized = normalizeFriendInput(data);
	const result = db.prepare(
		"INSERT INTO friends (title, imgurl, description, siteurl, tags) VALUES (?, ?, ?, ?, ?)",
	).run(
		normalized.title,
		normalized.imgurl,
		normalized.desc,
		normalized.siteurl,
		JSON.stringify(normalized.tags),
	);
	return getFriendById(Number(result.lastInsertRowid))!;
}

export function updateFriend(id: number, data: Partial<Omit<FriendItem, "id">>): FriendItem | null {
	const current = getFriendById(id);
	if (!current) return null;

	const merged = normalizeFriendInput({ ...current, ...data });
	const db = getDb();
	db.prepare(
		"UPDATE friends SET title = ?, imgurl = ?, description = ?, siteurl = ?, tags = ? WHERE id = ?",
	).run(merged.title, merged.imgurl, merged.desc, merged.siteurl, JSON.stringify(merged.tags), id);
	return getFriendById(id);
}

export function deleteFriend(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM friends WHERE id = ?").run(id);
	return result.changes > 0;
}
