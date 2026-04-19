import crypto from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const FONT_UPLOAD_DIR = path.join(
	process.cwd(),
	"public",
	"assets",
	"font",
);

export const DIST_FONT_UPLOAD_DIR = path.join(
	process.cwd(),
	"dist",
	"client",
	"assets",
	"font",
);

export const DEFAULT_FONT_LABELS: Record<string, string> = {
	"ZenMaruGothic-Medium.ttf": "ZenMaruGothic-Medium",
	"loli.ttf": "萝莉体 第二版",
};

export type SupportedFontExtension = ".ttf" | ".otf" | ".woff" | ".woff2";

export interface AvailableFontOption {
	fileName: string;
	label: string;
	format: SupportedFontExtension;
}

const SUPPORTED_FONT_EXTENSIONS: SupportedFontExtension[] = [
	".ttf",
	".otf",
	".woff",
	".woff2",
];

export function isSupportedFontExtension(
	ext: string,
): ext is SupportedFontExtension {
	return SUPPORTED_FONT_EXTENSIONS.includes(ext.toLowerCase() as SupportedFontExtension);
}

export function isSupportedFontFileName(fileName: string): boolean {
	return isSupportedFontExtension(path.extname(fileName));
}

export function getFontFormatFromFileName(
	fileName: string,
): "truetype" | "opentype" | "woff" | "woff2" | null {
	const ext = path.extname(fileName).toLowerCase();
	switch (ext) {
		case ".ttf":
			return "truetype";
		case ".otf":
			return "opentype";
		case ".woff":
			return "woff";
		case ".woff2":
			return "woff2";
		default:
			return null;
	}
}

export function inferFontLabel(
	fileName: string,
	overrides: Record<string, string> = {},
): string {
	return (
		overrides[fileName] ||
		DEFAULT_FONT_LABELS[fileName] ||
		path.basename(fileName, path.extname(fileName))
	);
}

export function listAvailableFonts(
	overrides: Record<string, string> = {},
): AvailableFontOption[] {
	if (!existsSync(FONT_UPLOAD_DIR)) {
		return [];
	}

	return readdirSync(FONT_UPLOAD_DIR)
		.filter(isSupportedFontFileName)
		.sort((a, b) => a.localeCompare(b))
		.map((fileName) => ({
			fileName,
			label: inferFontLabel(fileName, overrides),
			format: path.extname(fileName).toLowerCase() as SupportedFontExtension,
		}));
}

function sanitizeFontBaseName(fileName: string): string {
	const baseName = path.basename(fileName, path.extname(fileName));
	const normalized = baseName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
	const sanitized = normalized.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-");
	return sanitized.replace(/^-|-$/g, "") || "font";
}

export function createStoredFontFileName(originalName: string): string {
	const ext = path.extname(originalName).toLowerCase();
	const safeExt = isSupportedFontExtension(ext) ? ext : ".ttf";
	const safeBaseName = sanitizeFontBaseName(originalName);
	return `${safeBaseName}-${crypto.randomUUID().slice(0, 8)}${safeExt}`;
}
