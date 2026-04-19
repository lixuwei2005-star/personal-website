import * as fs from "node:fs";
import * as path from "node:path";

import type {
	AlbumColumns,
	AlbumGroup,
	AlbumLayout,
	AlbumMode,
	AlbumPhotoInput,
	Photo,
} from "../types/album";

interface AlbumFileInfo {
	mode?: AlbumMode;
	title?: string;
	description?: string;
	date?: string;
	location?: string;
	tags?: string[];
	layout?: AlbumLayout;
	columns?: number;
	hidden?: boolean;
	cover?: string;
	photos?: AlbumPhotoInput[];
}

export interface ScanAlbumsOptions {
	includeHidden?: boolean;
}

const ALBUMS_DIR = path.join(process.cwd(), "public", "images", "albums");
const IMAGE_EXTENSIONS = new Set([
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".svg",
	".avif",
	".bmp",
	".tiff",
	".tif",
]);

function normalizeTags(tags: unknown): string[] {
	if (!Array.isArray(tags)) {
		return [];
	}

	return tags
		.map((tag) => String(tag ?? "").trim())
		.filter(Boolean);
}

function normalizeDate(value: unknown): string {
	const trimmed = String(value ?? "").trim();
	if (!trimmed) {
		return new Date().toISOString().split("T")[0];
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return new Date().toISOString().split("T")[0];
	}

	return parsed.toISOString().split("T")[0];
}

function normalizeLayout(value: unknown): AlbumLayout {
	return value === "masonry" ? "masonry" : "grid";
}

function normalizeColumns(value: unknown): AlbumColumns {
	const numeric = Number(value);
	if (numeric === 2 || numeric === 4) {
		return numeric;
	}
	return 3;
}

function isSupportedImageFile(fileName: string): boolean {
	return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function parseFileName(fileName: string): { baseName: string; tags: string[] } {
	const parts = path.basename(fileName, path.extname(fileName)).split("_");

	if (parts.length >= 3) {
		return {
			baseName: parts.slice(0, -2).join("_") || parts[0],
			tags: parts.slice(-2).map((part) => part.trim()).filter(Boolean),
		};
	}

	return {
		baseName: path.basename(fileName, path.extname(fileName)),
		tags: [],
	};
}

function readAlbumInfo(infoPath: string, folderName: string): AlbumFileInfo | null {
	if (!fs.existsSync(infoPath)) {
		console.warn(`Album ${folderName} is missing info.json`);
		return null;
	}

	try {
		const content = fs.readFileSync(infoPath, "utf-8");
		return JSON.parse(content) as AlbumFileInfo;
	} catch (error) {
		console.error(`Failed to parse info.json for album ${folderName}:`, error);
		return null;
	}
}

function getAlbumFolderNames(): string[] {
	if (!fs.existsSync(ALBUMS_DIR)) {
		return [];
	}

	return fs
		.readdirSync(ALBUMS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

function findLocalCover(folderPath: string, albumId: string): string | null {
	const files = fs.readdirSync(folderPath);
	const coverFile = files.find((file) => {
		const baseName = path.basename(file, path.extname(file)).toLowerCase();
		return baseName === "cover" && isSupportedImageFile(file);
	});

	if (!coverFile) {
		return null;
	}

	return `/images/albums/${albumId}/${coverFile}`;
}

function buildPhotoUrl(albumId: string, fileName: string): string {
	return `/images/albums/${albumId}/${fileName}`;
}

function scanLocalPhotos(folderPath: string, albumId: string): Photo[] {
	const files = fs.readdirSync(folderPath);
	const photos: Photo[] = [];

	const imageFiles = files.filter((file) => {
		if (!isSupportedImageFile(file)) {
			return false;
		}

		const baseName = path.basename(file, path.extname(file)).toLowerCase();
		return baseName !== "cover";
	});

	const webpMap = new Map<string, string>();
	for (const file of imageFiles) {
		const ext = path.extname(file).toLowerCase();
		if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
			continue;
		}

		const baseName = path.basename(file, ext);
		const webpFile = `${baseName}.webp`;
		if (imageFiles.includes(webpFile)) {
			webpMap.set(file, webpFile);
		}
	}

	imageFiles.forEach((file, index) => {
		const filePath = path.join(folderPath, file);
		const stats = fs.statSync(filePath);
		const { baseName, tags } = parseFileName(file);
		const preferredFile = webpMap.get(file) ?? file;

		photos.push({
			id: `${albumId}-photo-${index + 1}`,
			src: buildPhotoUrl(albumId, preferredFile),
			alt: baseName,
			title: baseName,
			tags,
			date: stats.mtime.toISOString().split("T")[0],
		});
	});

	return photos;
}

function normalizeExternalPhoto(
	photo: AlbumPhotoInput,
	albumId: string,
	index: number,
): Photo | null {
	const src = String(photo?.src ?? "").trim();
	if (!src) {
		return null;
	}

	const width = Number(photo.width);
	const height = Number(photo.height);

	return {
		id: String(photo.id ?? "").trim() || `${albumId}-external-photo-${index + 1}`,
		src,
		thumbnail: String(photo.thumbnail ?? "").trim() || undefined,
		alt:
			String(photo.alt ?? "").trim() ||
			String(photo.title ?? "").trim() ||
			`Photo ${index + 1}`,
		title: String(photo.title ?? "").trim() || undefined,
		description: String(photo.description ?? "").trim() || undefined,
		tags: normalizeTags(photo.tags),
		date: normalizeDate(photo.date),
		location: String(photo.location ?? "").trim() || undefined,
		width: Number.isFinite(width) && width > 0 ? width : undefined,
		height: Number.isFinite(height) && height > 0 ? height : undefined,
	};
}

function normalizeExternalPhotos(
	photos: unknown,
	albumId: string,
): Photo[] {
	if (!Array.isArray(photos)) {
		return [];
	}

	return photos
		.map((photo, index) =>
			normalizeExternalPhoto((photo ?? {}) as AlbumPhotoInput, albumId, index),
		)
		.filter((photo): photo is Photo => Boolean(photo));
}

async function processAlbumFolder(
	folderPath: string,
	folderName: string,
	options: ScanAlbumsOptions = {},
): Promise<AlbumGroup | null> {
	const info = readAlbumInfo(path.join(folderPath, "info.json"), folderName);
	if (!info) {
		return null;
	}

	const hidden = info.hidden === true;
	if (hidden && !options.includeHidden) {
		return null;
	}

	const mode: AlbumMode = info.mode === "external" ? "external" : "local";
	const layout = normalizeLayout(info.layout);
	const columns = normalizeColumns(info.columns);
	let cover = "";
	let photos: Photo[] = [];

	if (mode === "external") {
		cover = String(info.cover ?? "").trim();
		if (!cover) {
			console.warn(`External album ${folderName} is missing a cover URL`);
			return null;
		}
		photos = normalizeExternalPhotos(info.photos, folderName);
	} else {
		const localCover = findLocalCover(folderPath, folderName);
		if (!localCover) {
			console.warn(`Local album ${folderName} is missing a cover image`);
			return null;
		}
		cover = localCover;
		photos = scanLocalPhotos(folderPath, folderName);
	}

	return {
		id: folderName,
		title: String(info.title ?? "").trim() || folderName,
		description: String(info.description ?? "").trim() || "",
		cover,
		date: normalizeDate(info.date),
		location: String(info.location ?? "").trim() || "",
		tags: normalizeTags(info.tags),
		photos,
		mode,
		layout,
		columns,
		hidden,
	};
}

export async function scanAlbums(
	options: ScanAlbumsOptions = {},
): Promise<AlbumGroup[]> {
	const albums: AlbumGroup[] = [];

	for (const folderName of getAlbumFolderNames()) {
		const albumPath = path.join(ALBUMS_DIR, folderName);
		const album = await processAlbumFolder(albumPath, folderName, options);
		if (album) {
			albums.push(album);
		}
	}

	return albums.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
}

export async function readAlbumById(
	albumId: string,
	options: ScanAlbumsOptions = {},
): Promise<AlbumGroup | null> {
	const normalizedId = albumId.trim();
	if (!normalizedId) {
		return null;
	}

	const folderPath = path.join(ALBUMS_DIR, normalizedId);
	if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
		return null;
	}

	return processAlbumFolder(folderPath, normalizedId, options);
}
