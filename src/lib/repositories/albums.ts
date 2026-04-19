import * as fs from "node:fs";
import * as path from "node:path";

import type {
	AlbumColumns,
	AlbumGroup,
	AlbumLayout,
	AlbumMode,
	AlbumPhotoInput,
} from "../../types/album";
import { readAlbumById, scanAlbums } from "../../utils/album-scanner";

interface AlbumPayload {
	id?: string;
	title?: string;
	description?: string;
	date?: string;
	location?: string;
	tags?: string[];
	hidden?: boolean;
	mode?: AlbumMode;
	layout?: AlbumLayout;
	columns?: number;
	cover?: string;
	photos?: AlbumPhotoInput[];
}

const PUBLIC_ALBUMS_ROOT = path.join(process.cwd(), "public", "images", "albums");
const DIST_ALBUMS_ROOT = path.join(process.cwd(), "dist", "client", "images", "albums");
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

function ensureDir(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function slugifyAlbumId(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9-_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeText(value: unknown): string {
	return String(value ?? "").trim();
}

function normalizeDate(value: unknown): string {
	const trimmed = normalizeText(value);
	if (!trimmed) {
		return new Date().toISOString().split("T")[0];
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return new Date().toISOString().split("T")[0];
	}

	return parsed.toISOString().split("T")[0];
}

function normalizeTags(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((tag) => normalizeText(tag))
		.filter(Boolean)
		.filter((tag, index, list) => list.findIndex((entry) => entry.toLowerCase() === tag.toLowerCase()) === index);
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

function normalizeMode(value: unknown): AlbumMode {
	return value === "external" ? "external" : "local";
}

function normalizePhotos(value: unknown): AlbumPhotoInput[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalized = value
		.map((photo) => {
			const nextPhoto = (photo ?? {}) as AlbumPhotoInput;
			const src = normalizeText(nextPhoto.src);
			if (!src) {
				return null;
			}

			const width = Number(nextPhoto.width);
			const height = Number(nextPhoto.height);

			return {
				id: normalizeText(nextPhoto.id) || undefined,
				src,
				thumbnail: normalizeText(nextPhoto.thumbnail) || undefined,
				alt: normalizeText(nextPhoto.alt) || undefined,
				title: normalizeText(nextPhoto.title) || undefined,
				description: normalizeText(nextPhoto.description) || undefined,
				tags: normalizeTags(nextPhoto.tags),
				date: normalizeText(nextPhoto.date) || undefined,
				location: normalizeText(nextPhoto.location) || undefined,
				width: Number.isFinite(width) && width > 0 ? width : undefined,
				height: Number.isFinite(height) && height > 0 ? height : undefined,
			} satisfies AlbumPhotoInput;
		})
		.filter((photo) => Boolean(photo));

	return normalized as AlbumPhotoInput[];
}

function normalizeAlbumId(proposedId: unknown, title: unknown, currentId?: string): string {
	const explicitId = slugifyAlbumId(normalizeText(proposedId));
	if (explicitId) {
		return explicitId;
	}

	if (currentId) {
		return currentId;
	}

	const fallbackFromTitle = slugifyAlbumId(normalizeText(title));
	return fallbackFromTitle || "album";
}

function ensureUniqueAlbumId(baseId: string, currentId?: string): string {
	const normalizedBase = slugifyAlbumId(baseId) || "album";
	let candidate = normalizedBase;
	let suffix = 2;

	while (true) {
		const albumDir = getAlbumDirectory(candidate);
		if (!fs.existsSync(albumDir) || candidate === currentId) {
			return candidate;
		}
		candidate = `${normalizedBase}-${suffix}`;
		suffix += 1;
	}
}

function normalizeAlbumPayload(data: AlbumPayload, currentId?: string) {
	const title = normalizeText(data.title);
	const id = normalizeAlbumId(data.id, title, currentId);

	return {
		id,
		title: title || id,
		description: normalizeText(data.description),
		date: normalizeDate(data.date),
		location: normalizeText(data.location),
		tags: normalizeTags(data.tags),
		hidden: Boolean(data.hidden),
		mode: normalizeMode(data.mode),
		layout: normalizeLayout(data.layout),
		columns: normalizeColumns(data.columns),
		cover: normalizeText(data.cover),
		photos: normalizePhotos(data.photos),
	};
}

function getAlbumDirectory(albumId: string): string {
	return path.join(PUBLIC_ALBUMS_ROOT, albumId);
}

function getDistAlbumDirectory(albumId: string): string {
	return path.join(DIST_ALBUMS_ROOT, albumId);
}

function coverExists(albumId: string): boolean {
	const albumDir = getAlbumDirectory(albumId);
	if (!fs.existsSync(albumDir)) {
		return false;
	}

	return fs.readdirSync(albumDir).some((fileName) => {
		const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
		return baseName === "cover" && IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
	});
}

function syncAlbumToDist(albumId: string): void {
	const publicDir = getAlbumDirectory(albumId);
	const distDir = getDistAlbumDirectory(albumId);
	const distRootExists = fs.existsSync(path.join(process.cwd(), "dist", "client"));

	if (!distRootExists) {
		return;
	}

	if (fs.existsSync(distDir)) {
		fs.rmSync(distDir, { recursive: true, force: true });
	}

	if (!fs.existsSync(publicDir)) {
		return;
	}

	ensureDir(DIST_ALBUMS_ROOT);
	fs.cpSync(publicDir, distDir, { recursive: true });
}

function writeInfoFile(albumId: string, info: Record<string, unknown>): void {
	const albumDir = getAlbumDirectory(albumId);
	ensureDir(albumDir);
	fs.writeFileSync(
		path.join(albumDir, "info.json"),
		`${JSON.stringify(info, null, "\t")}\n`,
		"utf-8",
	);
	syncAlbumToDist(albumId);
}

function buildInfoPayload(payload: ReturnType<typeof normalizeAlbumPayload>) {
	const basePayload: Record<string, unknown> = {
		title: payload.title,
		hidden: payload.hidden,
		description: payload.description,
		date: payload.date,
		location: payload.location,
		tags: payload.tags,
		layout: payload.layout,
		columns: payload.columns,
	};

	if (payload.mode === "external") {
		return {
			...basePayload,
			mode: "external",
			cover: payload.cover,
			photos: payload.photos,
		};
	}

	return basePayload;
}

function assertCanSaveLocalAlbum(albumId: string): void {
	if (!coverExists(albumId)) {
		throw new Error("Please upload a cover image for the local album first.");
	}
}

function assertCanSaveExternalAlbum(payload: ReturnType<typeof normalizeAlbumPayload>): void {
	if (!payload.cover) {
		throw new Error("External albums require a cover URL.");
	}

	if (payload.photos.length === 0) {
		throw new Error("Add at least one external photo before saving.");
	}
}

export async function getAllAlbumsForAdmin(): Promise<AlbumGroup[]> {
	return scanAlbums({ includeHidden: true });
}

export async function getAlbumForAdmin(albumId: string): Promise<AlbumGroup | null> {
	return readAlbumById(albumId, { includeHidden: true });
}

export async function createAlbum(data: AlbumPayload): Promise<AlbumGroup> {
	const normalized = normalizeAlbumPayload(data);
	const payload = {
		...normalized,
		id: ensureUniqueAlbumId(normalized.id),
	};
	const albumDir = getAlbumDirectory(payload.id);

	ensureDir(albumDir);

	if (payload.mode === "external") {
		assertCanSaveExternalAlbum(payload);
	} else {
		assertCanSaveLocalAlbum(payload.id);
	}

	writeInfoFile(payload.id, buildInfoPayload(payload));
	const created = await getAlbumForAdmin(payload.id);
	if (!created) {
		throw new Error("Failed to create album.");
	}
	return created;
}

export async function updateAlbum(currentId: string, data: AlbumPayload): Promise<AlbumGroup | null> {
	const existing = await getAlbumForAdmin(currentId);
	if (!existing) {
		return null;
	}

	const normalized = normalizeAlbumPayload(data, currentId);
	const payload = {
		...normalized,
		id: currentId,
	};

	if (payload.mode === "external") {
		assertCanSaveExternalAlbum(payload);
	} else {
		assertCanSaveLocalAlbum(payload.id);
	}

	writeInfoFile(payload.id, buildInfoPayload(payload));
	return getAlbumForAdmin(payload.id);
}

export function deleteAlbum(albumId: string): boolean {
	const publicDir = getAlbumDirectory(albumId);
	const distDir = getDistAlbumDirectory(albumId);

	if (!fs.existsSync(publicDir) && !fs.existsSync(distDir)) {
		return false;
	}

	fs.rmSync(publicDir, { recursive: true, force: true });
	fs.rmSync(distDir, { recursive: true, force: true });
	return true;
}

export function ensureAlbumDirectory(albumId: string): string {
	const sanitizedId = normalizeAlbumId(albumId, albumId);
	const albumDir = getAlbumDirectory(sanitizedId);
	ensureDir(albumDir);
	return albumDir;
}

export function saveAlbumAsset(albumId: string, fileName: string, buffer: Buffer): string {
	const sanitizedId = normalizeAlbumId(albumId, albumId);
	const albumDir = ensureAlbumDirectory(sanitizedId);
	const targetPath = path.join(albumDir, fileName);

	fs.writeFileSync(targetPath, buffer);
	syncAlbumToDist(sanitizedId);
	return `/images/albums/${sanitizedId}/${fileName}`;
}

export function clearExistingCoverFiles(albumId: string): void {
	const sanitizedId = normalizeAlbumId(albumId, albumId);
	const albumDir = ensureAlbumDirectory(sanitizedId);
	const fileNames = fs.readdirSync(albumDir);

	for (const fileName of fileNames) {
		const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
		if (baseName !== "cover") {
			continue;
		}

		fs.rmSync(path.join(albumDir, fileName), { force: true });
	}
}

export function removeAlbumPhoto(albumId: string, photoPath: string): void {
	const sanitizedId = normalizeAlbumId(albumId, albumId);
	const normalizedPath = normalizeText(photoPath);
	if (!normalizedPath.startsWith(`/images/albums/${sanitizedId}/`)) {
		throw new Error("The selected file does not belong to this album.");
	}

	const fileName = path.basename(normalizedPath);
	const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
	if (baseName === "cover") {
		throw new Error("Cover images must be replaced by uploading a new cover.");
	}

	const publicFile = path.join(getAlbumDirectory(sanitizedId), fileName);
	const distFile = path.join(getDistAlbumDirectory(sanitizedId), fileName);
	fs.rmSync(publicFile, { force: true });
	fs.rmSync(distFile, { force: true });
	syncAlbumToDist(sanitizedId);
}
