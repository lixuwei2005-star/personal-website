import { getDb } from "../db";
import type { AnimeItem } from "../../data/anime";

interface AnimeRow {
	id: number;
	title: string;
	status: string;
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string;
	studio: string;
	link: string;
	progress: number;
	total_episodes: number;
	start_date: string | null;
	end_date: string | null;
	sort_order: number;
}

function rowToAnime(row: AnimeRow): AnimeItem {
	return {
		title: row.title,
		status: row.status as AnimeItem["status"],
		rating: row.rating,
		cover: row.cover,
		description: row.description,
		episodes: row.episodes,
		year: row.year,
		genre: JSON.parse(row.genre),
		studio: row.studio,
		link: row.link,
		progress: row.progress,
		totalEpisodes: row.total_episodes,
		startDate: row.start_date || "",
		endDate: row.end_date || "",
	};
}

export function getAllAnime(): (AnimeItem & { id: number })[] {
	const db = getDb();
	const rows = db.prepare("SELECT * FROM anime ORDER BY sort_order, id").all() as AnimeRow[];
	return rows.map((row) => ({ ...rowToAnime(row), id: row.id }));
}

export function getAnimeById(id: number): (AnimeItem & { id: number }) | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM anime WHERE id = ?").get(id) as AnimeRow | undefined;
	return row ? { ...rowToAnime(row), id: row.id } : null;
}

export function createAnime(data: AnimeItem): AnimeItem & { id: number } {
	const db = getDb();
	const result = db.prepare(`
		INSERT INTO anime (title, status, rating, cover, description, episodes, year, genre, studio, link, progress, total_episodes, start_date, end_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		data.title, data.status, data.rating, data.cover,
		data.description, data.episodes, data.year, JSON.stringify(data.genre),
		data.studio, data.link, data.progress, data.totalEpisodes,
		data.startDate || null, data.endDate || null,
	);
	return getAnimeById(Number(result.lastInsertRowid))!;
}

export function updateAnime(id: number, data: Partial<AnimeItem>): (AnimeItem & { id: number }) | null {
	const current = getAnimeById(id);
	if (!current) return null;

	const merged = { ...current, ...data };
	const db = getDb();
	db.prepare(`
		UPDATE anime SET title = ?, status = ?, rating = ?, cover = ?, description = ?, episodes = ?, year = ?, genre = ?, studio = ?, link = ?, progress = ?, total_episodes = ?, start_date = ?, end_date = ?
		WHERE id = ?
	`).run(
		merged.title, merged.status, merged.rating, merged.cover,
		merged.description, merged.episodes, merged.year, JSON.stringify(merged.genre),
		merged.studio, merged.link, merged.progress, merged.totalEpisodes,
		merged.startDate || null, merged.endDate || null, id,
	);
	return getAnimeById(id);
}

export function deleteAnime(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM anime WHERE id = ?").run(id);
	return result.changes > 0;
}
