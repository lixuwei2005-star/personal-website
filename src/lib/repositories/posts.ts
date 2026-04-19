import { getDb } from "../db";

export interface PostData {
	id: number;
	slug: string;
	title: string;
	content_md: string;
	content_html: string;
	description: string;
	image: string;
	category: string;
	tags: string[];
	published: string;
	updated: string | null;
	draft: boolean;
	pinned: boolean;
	priority: number | null;
	comment: boolean;
	author: string;
	source_link: string;
	license_name: string;
	license_url: string;
	lang: string;
	encrypted: boolean;
	password: string;
	password_hint: string;
	alias: string | null;
	permalink: string | null;
}

interface PostRow {
	id: number;
	slug: string;
	title: string;
	content_md: string;
	content_html: string;
	description: string;
	image: string;
	category: string;
	tags: string;
	published: string;
	updated: string | null;
	draft: number;
	pinned: number;
	priority: number | null;
	comment: number;
	author: string;
	source_link: string;
	license_name: string;
	license_url: string;
	lang: string;
	encrypted: number;
	password: string;
	password_hint: string;
	alias: string | null;
	permalink: string | null;
}

function slugifyPostTitle(title: string) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
		.replace(/^-|-$/g, "");
}

function getUniquePostSlug(baseTitle: string, currentId?: number) {
	const db = getDb();
	const baseSlug = slugifyPostTitle(baseTitle) || "post";
	let slug = baseSlug;
	let suffix = 2;

	while (true) {
		const existing = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug) as { id: number } | undefined;
		if (!existing || existing.id === currentId) {
			return slug;
		}

		slug = `${baseSlug}-${suffix}`;
		suffix += 1;
	}
}

function rowToPost(row: PostRow): PostData {
	return {
		...row,
		tags: JSON.parse(row.tags),
		draft: row.draft === 1,
		pinned: row.pinned === 1,
		comment: row.comment === 1,
		encrypted: row.encrypted === 1,
	};
}

export function getAllPosts(includeDrafts = false): PostData[] {
	const db = getDb();
	const where = includeDrafts ? "" : "WHERE draft = 0";
	const rows = db.prepare(`SELECT * FROM posts ${where} ORDER BY pinned DESC, published DESC`).all() as PostRow[];
	return rows.map(rowToPost);
}

export function getPostBySlug(slug: string): PostData | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug) as PostRow | undefined;
	return row ? rowToPost(row) : null;
}

export function getPostById(id: number): PostData | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as PostRow | undefined;
	return row ? rowToPost(row) : null;
}

export function createPost(data: Omit<PostData, "id">): PostData {
	const db = getDb();
	const normalizedData = {
		...data,
		slug: getUniquePostSlug(data.slug || data.title),
		updated: data.updated || new Date().toISOString(),
	};
	const result = db.prepare(`
		INSERT INTO posts (slug, title, content_md, content_html, description, image, category, tags, published, updated, draft, pinned, priority, comment, author, source_link, license_name, license_url, lang, encrypted, password, password_hint, alias, permalink)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		normalizedData.slug, normalizedData.title, normalizedData.content_md, normalizedData.content_html,
		normalizedData.description, normalizedData.image, normalizedData.category, JSON.stringify(normalizedData.tags),
		normalizedData.published, normalizedData.updated, normalizedData.draft ? 1 : 0, normalizedData.pinned ? 1 : 0,
		normalizedData.priority, normalizedData.comment ? 1 : 0, normalizedData.author, normalizedData.source_link,
		normalizedData.license_name, normalizedData.license_url, normalizedData.lang,
		normalizedData.encrypted ? 1 : 0, normalizedData.password, normalizedData.password_hint,
		normalizedData.alias, normalizedData.permalink,
	);
	return getPostById(Number(result.lastInsertRowid))!;
}

export function updatePost(id: number, data: Partial<Omit<PostData, "id">>): PostData | null {
	const db = getDb();
	const current = getPostById(id);
	if (!current) return null;

	const shouldRegenerateSlug =
		typeof data.slug === "string" && data.slug.trim().length > 0;

	const merged = {
		...current,
		...data,
		slug: shouldRegenerateSlug
			? getUniquePostSlug(data.slug!, id)
			: current.slug,
		updated: data.updated ?? new Date().toISOString(),
	};
	db.prepare(`
		UPDATE posts SET slug = ?, title = ?, content_md = ?, content_html = ?, description = ?, image = ?, category = ?, tags = ?, published = ?, updated = ?, draft = ?, pinned = ?, priority = ?, comment = ?, author = ?, source_link = ?, license_name = ?, license_url = ?, lang = ?, encrypted = ?, password = ?, password_hint = ?, alias = ?, permalink = ?
		WHERE id = ?
	`).run(
		merged.slug, merged.title, merged.content_md, merged.content_html,
		merged.description, merged.image, merged.category, JSON.stringify(merged.tags),
		merged.published, merged.updated, merged.draft ? 1 : 0, merged.pinned ? 1 : 0,
		merged.priority, merged.comment ? 1 : 0, merged.author, merged.source_link,
		merged.license_name, merged.license_url, merged.lang,
		merged.encrypted ? 1 : 0, merged.password, merged.password_hint,
		merged.alias, merged.permalink, id,
	);
	return getPostById(id);
}

export function deletePost(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
	return result.changes > 0;
}

export function getPostCategories(): string[] {
	const db = getDb();
	const rows = db.prepare("SELECT DISTINCT category FROM posts WHERE category != '' AND draft = 0 ORDER BY category").all() as { category: string }[];
	return rows.map((r) => r.category);
}

export function getPostTags(): string[] {
	const posts = getAllPosts();
	const tagSet = new Set<string>();
	posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
	return Array.from(tagSet).sort();
}
