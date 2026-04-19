import { getDb } from "../db";
import type { Skill } from "../../data/skills";
import { ensureUniqueId, repairMissingIds } from "./id-utils";

interface SkillRow {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	level: string;
	experience_years: number;
	experience_months: number;
	projects: string;
	certifications: string;
	color: string | null;
	sort_order: number;
}

function normalizeString(value: unknown): string {
	return String(value ?? "").trim();
}

function normalizeStringList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => normalizeString(item))
		.filter(Boolean)
		.filter((item, index, list) => list.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index);
}

function normalizeExperience(value: unknown): Skill["experience"] {
	const input = (value ?? {}) as Partial<Skill["experience"]>;
	const years = Number(input.years);
	const months = Number(input.months);
	const safeYears = Number.isFinite(years) && years >= 0 ? Math.floor(years) : 0;
	const safeMonths = Number.isFinite(months) && months >= 0 ? Math.floor(months) : 0;
	const totalMonths = safeYears * 12 + safeMonths;

	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
}

function normalizeSkillInput(data: Partial<Skill>, current?: Skill): Skill {
	const name = normalizeString(data.name ?? current?.name);
	const experience = normalizeExperience(data.experience ?? current?.experience);

	return {
		id: current?.id ?? normalizeString(data.id),
		name,
		description: normalizeString(data.description ?? current?.description),
		icon: normalizeString(data.icon ?? current?.icon),
		category: (normalizeString(data.category ?? current?.category) || "other") as Skill["category"],
		level: (normalizeString(data.level ?? current?.level) || "beginner") as Skill["level"],
		experience,
		projects: normalizeStringList(data.projects ?? current?.projects),
		certifications: normalizeStringList(data.certifications ?? current?.certifications),
		color: normalizeString(data.color ?? current?.color) || undefined,
	};
}

function rowToSkill(row: SkillRow): Skill {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		icon: row.icon,
		category: row.category as Skill["category"],
		level: row.level as Skill["level"],
		experience: { years: row.experience_years, months: row.experience_months },
		projects: JSON.parse(row.projects),
		certifications: JSON.parse(row.certifications),
		color: row.color || undefined,
	};
}

export function getAllSkills(): Skill[] {
	const db = getDb();
	repairMissingIds(db, "skills", "name", "skill");
	const rows = db.prepare("SELECT * FROM skills ORDER BY sort_order, name").all() as SkillRow[];
	return rows.map(rowToSkill);
}

export function getSkillById(id: string): Skill | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM skills WHERE id = ?").get(id) as SkillRow | undefined;
	return row ? rowToSkill(row) : null;
}

export function createSkill(data: Skill): Skill {
	const db = getDb();
	const normalized = normalizeSkillInput(data);
	const skillId = ensureUniqueId(db, "skills", undefined, normalized.name, "skill");
	const item = { ...normalized, id: skillId };
	db.prepare(`
		INSERT INTO skills (id, name, description, icon, category, level, experience_years, experience_months, projects, certifications, color)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		item.id, item.name, item.description, item.icon,
		item.category, item.level, item.experience.years, item.experience.months,
		JSON.stringify(item.projects || []), JSON.stringify(item.certifications || []),
		item.color || null,
	);
	return item;
}

export function updateSkill(id: string, data: Partial<Skill>): Skill | null {
	const current = getSkillById(id);
	if (!current) return null;

	const db = getDb();
	const merged = {
		...normalizeSkillInput(data, current),
		id: current.id,
	};
	db.prepare(`
		UPDATE skills SET id = ?, name = ?, description = ?, icon = ?, category = ?, level = ?, experience_years = ?, experience_months = ?, projects = ?, certifications = ?, color = ?
		WHERE id = ?
	`).run(
		merged.id, merged.name, merged.description, merged.icon,
		merged.category, merged.level, merged.experience.years, merged.experience.months,
		JSON.stringify(merged.projects || []), JSON.stringify(merged.certifications || []),
		merged.color || null, id,
	);
	return getSkillById(merged.id);
}

export function deleteSkill(id: string): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM skills WHERE id = ?").run(id);
	return result.changes > 0;
}
