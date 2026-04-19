import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

import type { PostData } from "../repositories/posts";

type SyncedPost = Omit<PostData, "id" | "content_html">;

const POSTS_DIR = path.resolve(process.cwd(), "src", "content", "posts");
const GENERATED_POSTS_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"posts.ts",
);
const CONTENT_CONFIG_PATH = path.resolve(
	process.cwd(),
	"src",
	"content.config.ts",
);
const ROUTE_FILES_TO_TOUCH = [
	path.resolve(process.cwd(), "src", "pages", "[...page].astro"),
	path.resolve(process.cwd(), "src", "pages", "posts", "[...slug].astro"),
	path.resolve(process.cwd(), "src", "pages", "[...permalink].astro"),
];
const FILE_EXTENSIONS = [".md", ".mdx"] as const;

function normalizeSlug(slug: string): string {
	const normalized = slug.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	if (!normalized) {
		throw new Error("Post slug cannot be empty.");
	}

	const targetPath = path.resolve(POSTS_DIR, `${normalized}.md`);
	const relativePath = path.relative(POSTS_DIR, targetPath);
	if (
		relativePath.startsWith("..") ||
		path.isAbsolute(relativePath)
	) {
		throw new Error("Post slug points outside src/content/posts.");
	}

	return normalized;
}

function buildCandidatePaths(slug: string): string[] {
	const segments = slug.split("/").filter(Boolean);
	const directFiles = FILE_EXTENSIONS.map((ext) =>
		path.resolve(POSTS_DIR, ...segments.slice(0, -1), `${segments.at(-1)}${ext}`),
	);
	const indexFiles = FILE_EXTENSIONS.map((ext) =>
		path.resolve(POSTS_DIR, ...segments, `index${ext}`),
	);
	return [...directFiles, ...indexFiles];
}

function findExistingPostFile(slug: string): string | null {
	for (const candidate of buildCandidatePaths(normalizeSlug(slug))) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}
	return null;
}

function resolveTargetPostFile(slug: string): string {
	const normalizedSlug = normalizeSlug(slug);
	return (
		findExistingPostFile(normalizedSlug) ||
		path.resolve(POSTS_DIR, `${normalizedSlug}.md`)
	);
}

function cleanupEmptyDirectories(directoryPath: string) {
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

function yamlString(value: string): string {
	return JSON.stringify(value);
}

function yamlBoolean(value: boolean): string {
	return value ? "true" : "false";
}

function yamlDate(value: string): string {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return yamlString(value);
	}
	return parsed.toISOString().slice(0, 10);
}

function yamlDateTime(value: string): string {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return yamlString(value);
	}
	return parsed.toISOString();
}

function pushField(
	lines: string[],
	key: string,
	value: string | number | boolean | null | undefined,
) {
	if (value === undefined || value === null) {
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

	lines.push(`${key}: ${yamlString(value)}`);
}

function serializePostToMarkdown(post: SyncedPost): string {
	const lines = [
		"---",
		`title: ${yamlString(post.title)}`,
		`published: ${yamlDate(post.published)}`,
	];

	if (post.updated) {
		lines.push(`updated: ${yamlDateTime(post.updated)}`);
	}

	lines.push(`draft: ${yamlBoolean(post.draft)}`);
	lines.push(`pinned: ${yamlBoolean(post.pinned)}`);

	if (post.description) {
		pushField(lines, "description", post.description);
	}
	if (post.image) {
		pushField(lines, "image", post.image);
	}
	if (post.tags.length > 0) {
		lines.push(`tags: ${JSON.stringify(post.tags)}`);
	}
	if (post.category) {
		pushField(lines, "category", post.category);
	}
	if (post.priority !== null) {
		pushField(lines, "priority", post.priority);
	}
	if (!post.comment) {
		lines.push(`comment: ${yamlBoolean(post.comment)}`);
	}
	if (post.author) {
		pushField(lines, "author", post.author);
	}
	if (post.source_link) {
		pushField(lines, "sourceLink", post.source_link);
	}
	if (post.license_name) {
		pushField(lines, "licenseName", post.license_name);
	}
	if (post.license_url) {
		pushField(lines, "licenseUrl", post.license_url);
	}
	if (post.lang) {
		pushField(lines, "lang", post.lang);
	}
	if (post.encrypted) {
		lines.push(`encrypted: ${yamlBoolean(post.encrypted)}`);
		pushField(lines, "password", post.password);
		pushField(lines, "passwordHint", post.password_hint);
	}
	if (post.alias) {
		pushField(lines, "alias", post.alias);
	}
	if (post.permalink) {
		pushField(lines, "permalink", post.permalink);
	}

	lines.push("---", "");

	const markdownBody = post.content_md.replace(/\r\n/g, "\n");
	return `${lines.join("\n")}${markdownBody ? `${markdownBody}\n` : ""}`;
}

function syncPostsContentVersion(timestamp = new Date().toISOString()): string {
	mkdirSync(path.dirname(GENERATED_POSTS_PATH), { recursive: true });
	writeFileSync(
		GENERATED_POSTS_PATH,
		`export const postsContentVersion = ${JSON.stringify(timestamp)};\n`,
		"utf-8",
	);
	return GENERATED_POSTS_PATH;
}

function touchPostRouteFiles() {
	for (const routeFile of ROUTE_FILES_TO_TOUCH) {
		if (!existsSync(routeFile)) {
			continue;
		}
		try {
			const source = readFileSync(routeFile, "utf-8");
			writeFileSync(routeFile, source, "utf-8");
		} catch {
			// Ignore refresh failures; the content files are already synced.
		}
	}
}

function touchContentConfig() {
	if (!existsSync(CONTENT_CONFIG_PATH)) {
		return;
	}

	try {
		const source = readFileSync(CONTENT_CONFIG_PATH, "utf-8");
		writeFileSync(CONTENT_CONFIG_PATH, source, "utf-8");
	} catch {
		// Ignore refresh failures; content files are already synced.
	}
}

export function syncPostToContent(
	post: SyncedPost,
	previousSlug?: string | null,
	skipVersionSync = false,
): string {
	const normalizedSlug = normalizeSlug(post.slug);
	const targetFile = resolveTargetPostFile(normalizedSlug);
	const hadExistingFile = existsSync(targetFile);

	if (previousSlug) {
		const normalizedPreviousSlug = normalizeSlug(previousSlug);
		if (normalizedPreviousSlug !== normalizedSlug) {
			const previousFile = findExistingPostFile(normalizedPreviousSlug);
			if (previousFile && previousFile !== targetFile) {
				rmSync(previousFile, { force: true });
				cleanupEmptyDirectories(path.dirname(previousFile));
			}
		}
	}

	mkdirSync(path.dirname(targetFile), { recursive: true });
	const markdown = serializePostToMarkdown(post);
	writeFileSync(targetFile, markdown, "utf-8");

	// On Windows dev setups, Astro/Vite can miss the initial "file added"
	// event for a newly created content entry. Rewriting the now-existing file
	// immediately produces a normal "change" event, which keeps the front-end
	// post list in sync right after creating a post.
	if (!hadExistingFile) {
		writeFileSync(targetFile, markdown, "utf-8");
	}

	if (!skipVersionSync) {
		syncPostsContentVersion();
		touchPostRouteFiles();
		touchContentConfig();
	}

	return targetFile;
}

export function deletePostContent(slug: string): void {
	const existingFile = findExistingPostFile(slug);
	if (!existingFile) {
		return;
	}

	rmSync(existingFile, { force: true });
	cleanupEmptyDirectories(path.dirname(existingFile));
	syncPostsContentVersion();
	touchPostRouteFiles();
	touchContentConfig();
}

export function syncAllPostsToContent(posts: SyncedPost[]): number {
	posts.forEach((post) => syncPostToContent(post, null, true));
	syncPostsContentVersion();
	touchPostRouteFiles();
	touchContentConfig();
	return posts.length;
}
