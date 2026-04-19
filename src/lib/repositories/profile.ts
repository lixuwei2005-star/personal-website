import { getDb } from "../db";

export interface ProfileData {
	name: string;
	bio: string;
	avatar_path: string;
	footer_name: string;
	links: { name: string; icon: string; url: string }[];
}

export function getProfile(): ProfileData {
	const db = getDb();
	const row = db.prepare("SELECT name, bio, avatar_path, footer_name, links FROM profile WHERE id = 1").get() as {
		name: string;
		bio: string;
		avatar_path: string;
		footer_name: string;
		links: string;
	};
	return {
		name: row.name,
		bio: row.bio,
		avatar_path: row.avatar_path,
		footer_name: row.footer_name,
		links: JSON.parse(row.links),
	};
}

export function updateProfile(data: Partial<ProfileData>): void {
	const db = getDb();
	const current = getProfile();
	const merged = { ...current, ...data };
	db.prepare(
		"UPDATE profile SET name = ?, bio = ?, avatar_path = ?, footer_name = ?, links = ? WHERE id = 1",
	).run(
		merged.name,
		merged.bio,
		merged.avatar_path,
		merged.footer_name,
		JSON.stringify(merged.links),
	);
}
