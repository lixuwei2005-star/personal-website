import Database from "better-sqlite3";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");
const FILE_EXTENSIONS = [".md", ".mdx"];

function normalizeSlug(slug) {
	const normalized = String(slug).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	if (!normalized) {
		throw new Error("Post slug cannot be empty.");
	}

	const targetPath = path.resolve(POSTS_DIR, `${normalized}.md`);
	const relativePath = path.relative(POSTS_DIR, targetPath);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("Post slug points outside src/content/posts.");
	}

	return normalized;
}

function buildCandidatePaths(slug) {
	const normalized = normalizeSlug(slug);
	const segments = normalized.split("/").filter(Boolean);
	const directFiles = FILE_EXTENSIONS.map((ext) =>
		path.resolve(POSTS_DIR, ...segments.slice(0, -1), `${segments.at(-1)}${ext}`),
	);
	const indexFiles = FILE_EXTENSIONS.map((ext) =>
		path.resolve(POSTS_DIR, ...segments, `index${ext}`),
	);
	return [...directFiles, ...indexFiles];
}

function findExistingPostFile(slug) {
	for (const candidate of buildCandidatePaths(slug)) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}
	return null;
}

function resolveTargetPostFile(slug) {
	return findExistingPostFile(slug) || path.resolve(POSTS_DIR, `${normalizeSlug(slug)}.md`);
}

function cleanupEmptyDirectories(directoryPath) {
	let currentPath = directoryPath;
	while (
		currentPath.startsWith(POSTS_DIR) &&
		currentPath !== POSTS_DIR &&
		existsSync(currentPath) &&
		readdirSync(currentPath).length === 0
	) {
		rmSync(currentPath, { recursive: true, force: true });
		currentPath = path.dirname(currentPath);
	}
}

function yamlString(value) {
	return JSON.stringify(value);
}

function yamlBoolean(value) {
	return value ? "true" : "false";
}

function yamlDate(value) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return yamlString(String(value));
	}
	return parsed.toISOString().slice(0, 10);
}

function pushField(lines, key, value) {
	if (value === undefined || value === null || value === "") {
		return;
	}

	if (typeof value === "boolean") {
		lines.push(`${key}: ${yamlBoolean(value)}`);
		return;
	}

	if (typeof value === "number") {
		lines.push(`${key}: ${value}`);
		return;
	}

	lines.push(`${key}: ${yamlString(String(value))}`);
}

function serializePostToMarkdown(post) {
	const lines = [
		"---",
		`title: ${yamlString(post.title)}`,
		`published: ${yamlDate(post.published)}`,
	];

	if (post.updated) {
		lines.push(`updated: ${yamlDate(post.updated)}`);
	}

	lines.push(`draft: ${yamlBoolean(Boolean(post.draft))}`);
	lines.push(`pinned: ${yamlBoolean(Boolean(post.pinned))}`);

	pushField(lines, "description", post.description);
	pushField(lines, "image", post.image);
	if (Array.isArray(post.tags) && post.tags.length > 0) {
		lines.push(`tags: ${JSON.stringify(post.tags)}`);
	}
	pushField(lines, "category", post.category);
	if (post.priority !== null && post.priority !== undefined) {
		pushField(lines, "priority", Number(post.priority));
	}
	if (!post.comment) {
		lines.push(`comment: ${yamlBoolean(Boolean(post.comment))}`);
	}
	pushField(lines, "author", post.author);
	pushField(lines, "sourceLink", post.source_link);
	pushField(lines, "licenseName", post.license_name);
	pushField(lines, "licenseUrl", post.license_url);
	pushField(lines, "lang", post.lang);
	if (post.encrypted) {
		lines.push(`encrypted: ${yamlBoolean(Boolean(post.encrypted))}`);
		pushField(lines, "password", post.password);
		pushField(lines, "passwordHint", post.password_hint);
	}
	pushField(lines, "alias", post.alias);
	pushField(lines, "permalink", post.permalink);

	lines.push("---", "");
	const markdownBody = String(post.content_md || "").replace(/\r\n/g, "\n");
	return `${lines.join("\n")}${markdownBody ? `${markdownBody}\n` : ""}`;
}

function syncPostToContent(post) {
	const targetFile = resolveTargetPostFile(post.slug);
	mkdirSync(path.dirname(targetFile), { recursive: true });
	writeFileSync(targetFile, serializePostToMarkdown(post), "utf-8");
}

if (!existsSync(DB_PATH)) {
	console.log(`[sync-db-posts] Database not found, skipped: ${DB_PATH}`);
	process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });
const postsTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'")
	.get();

if (!postsTable) {
	db.close();
	console.log("[sync-db-posts] Posts table not found, skipped.");
	process.exit(0);
}

const rows = db.prepare(`
	SELECT
		slug,
		title,
		content_md,
		description,
		image,
		category,
		tags,
		published,
		updated,
		draft,
		pinned,
		priority,
		comment,
		author,
		source_link,
		license_name,
		license_url,
		lang,
		encrypted,
		password,
		password_hint,
		alias,
		permalink
	FROM posts
	ORDER BY pinned DESC, published DESC
`).all();

let syncedCount = 0;
for (const row of rows) {
	syncPostToContent({
		...row,
		draft: row.draft === 1,
		pinned: row.pinned === 1,
		comment: row.comment === 1,
		encrypted: row.encrypted === 1,
		tags: (() => {
			try {
				return JSON.parse(row.tags || "[]");
			} catch {
				return [];
			}
		})(),
	});
	syncedCount += 1;
}

db.close();
console.log(`[sync-db-posts] Synced ${syncedCount} posts to src/content/posts.`);
