import { getDb } from "../db";
import type { TimelineItem, TimelineLink } from "../../components/features/timeline/types";
import { ensureUniqueId, repairMissingIds } from "./id-utils";

interface TimelineRow {
	id: string;
	title: string;
	description: string;
	type: string;
	start_date: string;
	end_date: string | null;
	location: string | null;
	organization: string | null;
	position: string | null;
	skills: string;
	achievements: string;
	links: string;
	icon: string | null;
	color: string | null;
	featured: number;
	sort_order: number;
}

function rowToTimeline(row: TimelineRow): TimelineItem {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		type: row.type as TimelineItem["type"],
		startDate: row.start_date,
		endDate: row.end_date || undefined,
		location: row.location || undefined,
		organization: row.organization || undefined,
		position: row.position || undefined,
		skills: JSON.parse(row.skills),
		achievements: JSON.parse(row.achievements),
		links: JSON.parse(row.links) as TimelineLink[],
		icon: row.icon || undefined,
		color: row.color || undefined,
		featured: row.featured === 1,
	};
}

export function getAllTimeline(): TimelineItem[] {
	const db = getDb();
	repairMissingIds(db, "timeline", "title", "timeline");
	const rows = db.prepare("SELECT * FROM timeline ORDER BY start_date DESC, sort_order").all() as TimelineRow[];
	return rows.map(rowToTimeline);
}

export function getTimelineById(id: string): TimelineItem | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM timeline WHERE id = ?").get(id) as TimelineRow | undefined;
	return row ? rowToTimeline(row) : null;
}

export function createTimeline(data: TimelineItem): TimelineItem {
	const db = getDb();
	const timelineId = ensureUniqueId(db, "timeline", data.id, data.title, "timeline");
	const item = { ...data, id: timelineId };
	db.prepare(`
		INSERT INTO timeline (id, title, description, type, start_date, end_date, location, organization, position, skills, achievements, links, icon, color, featured)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		item.id, item.title, item.description, item.type,
		item.startDate, item.endDate || null, item.location || null,
		item.organization || null, item.position || null,
		JSON.stringify(item.skills || []), JSON.stringify(item.achievements || []),
		JSON.stringify(item.links || []), item.icon || null, item.color || null,
		item.featured ? 1 : 0,
	);
	return item;
}

export function updateTimeline(id: string, data: Partial<TimelineItem>): TimelineItem | null {
	const current = getTimelineById(id);
	if (!current) return null;

	const db = getDb();
	const merged = {
		...current,
		...data,
		id: ensureUniqueId(db, "timeline", data.id ?? current.id, data.title ?? current.title, "timeline", id),
	};
	db.prepare(`
		UPDATE timeline SET id = ?, title = ?, description = ?, type = ?, start_date = ?, end_date = ?, location = ?, organization = ?, position = ?, skills = ?, achievements = ?, links = ?, icon = ?, color = ?, featured = ?
		WHERE id = ?
	`).run(
		merged.id, merged.title, merged.description, merged.type,
		merged.startDate, merged.endDate || null, merged.location || null,
		merged.organization || null, merged.position || null,
		JSON.stringify(merged.skills || []), JSON.stringify(merged.achievements || []),
		JSON.stringify(merged.links || []), merged.icon || null, merged.color || null,
		merged.featured ? 1 : 0, id,
	);
	return getTimelineById(merged.id);
}

export function deleteTimeline(id: string): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM timeline WHERE id = ?").run(id);
	return result.changes > 0;
}
