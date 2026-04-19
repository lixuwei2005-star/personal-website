import { getDb } from "../db";
import type { Project } from "../../data/projects";
import { ensureUniqueId, repairMissingIds } from "./id-utils";

type ProjectInput = Omit<Project, "id"> & {
	id?: string;
};

interface ProjectRow {
	id: string;
	title: string;
	description: string;
	image: string;
	category: string;
	tech_stack: string;
	status: string;
	live_demo: string | null;
	source_code: string | null;
	visit_url: string | null;
	start_date: string;
	end_date: string | null;
	featured: number;
	tags: string;
	show_image: number;
	sort_order: number;
}

function rowToProject(row: ProjectRow): Project {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		image: row.image,
		category: row.category as Project["category"],
		techStack: JSON.parse(row.tech_stack),
		status: row.status as Project["status"],
		liveDemo: row.live_demo || undefined,
		sourceCode: row.source_code || undefined,
		visitUrl: row.visit_url || undefined,
		startDate: row.start_date,
		endDate: row.end_date || undefined,
		featured: row.featured === 1,
		tags: JSON.parse(row.tags),
		showImage: row.show_image === 1,
	};
}

export function getAllProjects(): Project[] {
	const db = getDb();
	repairMissingIds(db, "projects", "title", "project");
	const rows = db.prepare("SELECT * FROM projects ORDER BY sort_order, start_date DESC").all() as ProjectRow[];
	return rows.map(rowToProject);
}

export function getProjectById(id: string): Project | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
	return row ? rowToProject(row) : null;
}

export function createProject(data: ProjectInput): Project {
	const db = getDb();
	const projectId = ensureUniqueId(db, "projects", null, data.title, "project");
	const item = { ...data, id: projectId };
	db.prepare(`
		INSERT INTO projects (id, title, description, image, category, tech_stack, status, live_demo, source_code, visit_url, start_date, end_date, featured, tags, show_image, sort_order)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		item.id, item.title, item.description, item.image,
		item.category, JSON.stringify(item.techStack), item.status,
		item.liveDemo || null, item.sourceCode || null, item.visitUrl || null,
		item.startDate, item.endDate || null, item.featured ? 1 : 0,
		JSON.stringify(item.tags || []), item.showImage !== false ? 1 : 0, 0,
	);
	return item;
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
	const current = getProjectById(id);
	if (!current) return null;

	const db = getDb();
	const merged = {
		...current,
		...data,
		id: current.id,
	};
	db.prepare(`
		UPDATE projects SET id = ?, title = ?, description = ?, image = ?, category = ?, tech_stack = ?, status = ?, live_demo = ?, source_code = ?, visit_url = ?, start_date = ?, end_date = ?, featured = ?, tags = ?, show_image = ?
		WHERE id = ?
	`).run(
		merged.id, merged.title, merged.description, merged.image,
		merged.category, JSON.stringify(merged.techStack), merged.status,
		merged.liveDemo || null, merged.sourceCode || null, merged.visitUrl || null,
		merged.startDate, merged.endDate || null, merged.featured ? 1 : 0,
		JSON.stringify(merged.tags || []), merged.showImage !== false ? 1 : 0, id,
	);
	return getProjectById(merged.id);
}

export function deleteProject(id: string): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
	return result.changes > 0;
}
