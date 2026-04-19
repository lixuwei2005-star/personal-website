import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SPEC_DIR = path.resolve(process.cwd(), "src", "content", "spec");
const GENERATED_ABOUT_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"about.ts",
);
const GENERATED_ABOUT_SITE_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"about-site.ts",
);

function resolveSpecFile(slug: string): string {
	const normalizedSlug = slug.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
	if (!normalizedSlug) {
		throw new Error("Spec slug cannot be empty.");
	}

	const targetFile = path.resolve(SPEC_DIR, `${normalizedSlug}.md`);
	const relativePath = path.relative(SPEC_DIR, targetFile);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("Spec slug points outside src/content/spec.");
	}

	return targetFile;
}

export function readSpecMarkdown(slug: string): string {
	const targetFile = resolveSpecFile(slug);
	if (!existsSync(targetFile)) {
		throw new Error(`Spec content "${slug}" not found.`);
	}

	return readFileSync(targetFile, "utf-8");
}

export function writeSpecMarkdown(slug: string, content: string): string {
	const targetFile = resolveSpecFile(slug);
	mkdirSync(path.dirname(targetFile), { recursive: true });

	const normalizedContent = String(content ?? "").replace(/\r\n/g, "\n");
	const finalContent = normalizedContent.endsWith("\n")
		? normalizedContent
		: `${normalizedContent}\n`;

	writeFileSync(targetFile, finalContent, "utf-8");
	return targetFile;
}

function writeGeneratedContentVersion(
	targetFile: string,
	exportName: string,
	timestamp = new Date().toISOString(),
): string {
	mkdirSync(path.dirname(targetFile), { recursive: true });
	writeFileSync(
		targetFile,
		`export const ${exportName} = ${JSON.stringify(timestamp)};\n`,
		"utf-8",
	);
	return targetFile;
}

export function syncAboutContentVersion(timestamp = new Date().toISOString()): string {
	return writeGeneratedContentVersion(
		GENERATED_ABOUT_PATH,
		"aboutContentVersion",
		timestamp,
	);
}

export function syncAboutSiteContentVersion(
	timestamp = new Date().toISOString(),
): string {
	return writeGeneratedContentVersion(
		GENERATED_ABOUT_SITE_PATH,
		"aboutSiteContentVersion",
		timestamp,
	);
}
