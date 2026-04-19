export const prerender = false;

import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "music");
const DIST_UPLOAD_DIR = path.join(process.cwd(), "dist", "client", "uploads", "music");

const ALLOWED_EXTENSIONS = new Set([
	".mp3",
	".wav",
	".ogg",
	".m4a",
	".aac",
	".flac",
	".webm",
]);

function ensureDir(dirPath: string) {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
}

function isSupportedAudioFile(file: File) {
	const extension = path.extname(file.name).toLowerCase();
	if (ALLOWED_EXTENSIONS.has(extension)) {
		return true;
	}

	return file.type.startsWith("audio/");
}

export const POST: APIRoute = async ({ request }) => {
	const formData = await request.formData();
	const files = formData
		.getAll("files")
		.filter((value): value is File => value instanceof File);

	if (files.length === 0) {
		return new Response(JSON.stringify({ error: "No audio files provided" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	ensureDir(SOURCE_UPLOAD_DIR);
	const shouldMirrorToDist = existsSync(path.dirname(DIST_UPLOAD_DIR));
	if (shouldMirrorToDist) {
		ensureDir(DIST_UPLOAD_DIR);
	}

	const uploadedTracks: Array<{
		fileName: string;
		title: string;
		url: string;
		size: number;
	}> = [];

	for (const file of files) {
		if (!isSupportedAudioFile(file)) {
			return new Response(
				JSON.stringify({
					error: "Only .mp3, .wav, .ogg, .m4a, .aac, .flac and .webm audio uploads are supported",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const extension = path.extname(file.name) || ".bin";
		const uniqueName = `${crypto.randomUUID()}${extension}`;
		const sourcePath = path.join(SOURCE_UPLOAD_DIR, uniqueName);
		const distPath = path.join(DIST_UPLOAD_DIR, uniqueName);
		const buffer = Buffer.from(await file.arrayBuffer());

		writeFileSync(sourcePath, buffer);
		if (shouldMirrorToDist) {
			writeFileSync(distPath, buffer);
		}

		uploadedTracks.push({
			fileName: uniqueName,
			title: path.basename(file.name, extension),
			url: `/uploads/music/${uniqueName}`,
			size: file.size,
		});
	}

	return new Response(JSON.stringify({ tracks: uploadedTracks }), {
		headers: { "Content-Type": "application/json" },
	});
};
