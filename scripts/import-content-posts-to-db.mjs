import Database from "better-sqlite3";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");
const SCHEMA_PATH = path.join(ROOT, "scripts", "schema.sql");

function ensureDatabase(dbPath) {
	const dir = path.dirname(dbPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const db = new Database(dbPath);
	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");
	if (existsSync(SCHEMA_PATH)) {
		db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
	}
	return db;
}

function parseInlineArray(value) {
	if (!value.startsWith("[") || !value.endsWith("]")) {
		return [];
	}

	return value
		.slice(1, -1)
		.split(",")
		.map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
		.filter(Boolean);
}

function parseScalar(value) {
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}
	if (value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	if (value === "null") {
		return null;
	}
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value);
	}
	if (value.startsWith("[") && value.endsWith("]")) {
		return parseInlineArray(value);
	}
	return value;
}

function parseMarkdownFile(rawContent) {
	const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, body: rawContent };
	}

	const [, frontmatterBlock, body] = match;
	const frontmatter = {};
	const lines = frontmatterBlock.split(/\r?\n/);

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) {
			continue;
		}

		const key = line.slice(0, colonIndex).trim();
		const rawValue = line.slice(colonIndex + 1).trim();

		if (rawValue === "") {
			if (key === "tags") {
				const tagLines = [];
				while (index + 1 < lines.length && /^\s*-\s+/.test(lines[index + 1])) {
					index += 1;
					tagLines.push(lines[index].replace(/^\s*-\s+/, "").trim().replace(/^['"]|['"]$/g, ""));
				}
				frontmatter[key] = tagLines;
			}
			continue;
		}

		frontmatter[key] = parseScalar(rawValue);
	}

	if (!Array.isArray(frontmatter.tags)) {
		frontmatter.tags = [];
	}

	return {
		frontmatter,
		body,
	};
}

function walkPostFiles(directoryPath) {
	const entries = readdirSync(directoryPath, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(directoryPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkPostFiles(fullPath));
			continue;
		}

		if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
			files.push(fullPath);
		}
	}

	return files;
}

function toSlug(filePath) {
	const relativePath = path.relative(POSTS_DIR, filePath).replace(/\\/g, "/");
	if (relativePath.endsWith("/index.md") || relativePath.endsWith("/index.mdx")) {
		return relativePath.replace(/\/index\.(md|mdx)$/, "");
	}
	return relativePath.replace(/\.(md|mdx)$/, "");
}

if (!existsSync(POSTS_DIR)) {
	console.log(`[import-content-posts] Posts directory not found, skipped: ${POSTS_DIR}`);
	process.exit(0);
}

const db = ensureDatabase(DB_PATH);
const insertPost = db.prepare(`
	INSERT OR IGNORE INTO posts (
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
	)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const postFiles = walkPostFiles(POSTS_DIR);
let insertedCount = 0;

for (const filePath of postFiles) {
	const rawContent = readFileSync(filePath, "utf-8");
	const { frontmatter, body } = parseMarkdownFile(rawContent);
	const slug = toSlug(filePath);

	const result = insertPost.run(
		slug,
		frontmatter.title || slug,
		body.trimStart(),
		frontmatter.description || "",
		frontmatter.image || "",
		frontmatter.category || "",
		JSON.stringify(frontmatter.tags || []),
		frontmatter.published || new Date().toISOString(),
		frontmatter.updated || null,
		frontmatter.draft ? 1 : 0,
		frontmatter.pinned ? 1 : 0,
		typeof frontmatter.priority === "number" ? frontmatter.priority : null,
		frontmatter.comment === false ? 0 : 1,
		frontmatter.author || "",
		frontmatter.sourceLink || "",
		frontmatter.licenseName || "",
		frontmatter.licenseUrl || "",
		frontmatter.lang || "",
		frontmatter.encrypted ? 1 : 0,
		frontmatter.password || "",
		frontmatter.passwordHint || "",
		frontmatter.alias || null,
		frontmatter.permalink || null,
	);

	if (result.changes > 0) {
		insertedCount += 1;
	}
}

db.close();
console.log(`[import-content-posts] Imported ${insertedCount} posts into the database.`);
