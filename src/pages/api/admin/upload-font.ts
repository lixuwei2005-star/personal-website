export const prerender = false;

import type { APIRoute } from "astro";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
	DIST_FONT_UPLOAD_DIR,
	FONT_UPLOAD_DIR,
	createStoredFontFileName,
	inferFontLabel,
	isSupportedFontFileName,
	isSupportedFontExtension,
	listAvailableFonts,
} from "../../../lib/font-files";
import { getSiteSettings } from "../../../lib/repositories/site-settings";

function ensureDir(dirPath: string) {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
}

export const POST: APIRoute = async ({ request }) => {
	const formData = await request.formData();
	const files = formData
		.getAll("files")
		.filter((value): value is File => value instanceof File);

	if (files.length === 0) {
		return new Response(JSON.stringify({ error: "No font files provided" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const uploadedFonts: Array<{
		fileName: string;
		label: string;
		format: string;
	}> = [];

	ensureDir(FONT_UPLOAD_DIR);
	const shouldMirrorToDist = existsSync(path.dirname(DIST_FONT_UPLOAD_DIR));
	if (shouldMirrorToDist) {
		ensureDir(DIST_FONT_UPLOAD_DIR);
	}

	for (const file of files) {
		const extension = path.extname(file.name).toLowerCase();
		if (!isSupportedFontExtension(extension)) {
			return new Response(
				JSON.stringify({
					error: "Only .ttf, .otf, .woff and .woff2 font uploads are supported",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const storedFileName = createStoredFontFileName(file.name);
		const filePath = path.join(FONT_UPLOAD_DIR, storedFileName);
		const distFilePath = path.join(DIST_FONT_UPLOAD_DIR, storedFileName);
		const buffer = Buffer.from(await file.arrayBuffer());

		writeFileSync(filePath, buffer);
		if (shouldMirrorToDist) {
			writeFileSync(distFilePath, buffer);
		}

		uploadedFonts.push({
			fileName: storedFileName,
			label: inferFontLabel(storedFileName, {
				[storedFileName]: path.basename(file.name, extension),
			}),
			format: extension,
		});
	}

	return new Response(JSON.stringify({ fonts: uploadedFonts }), {
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async ({ url }) => {
	const fileName = url.searchParams.get("fileName")?.trim() || "";

	if (!fileName || !isSupportedFontFileName(fileName)) {
		return new Response(JSON.stringify({ error: "Invalid font file" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const settings = getSiteSettings();
	const inUseFiles = [
		settings.font.asciiFont.selectedFile,
		settings.font.cjkFont.selectedFile,
	];

	if (inUseFiles.includes(fileName)) {
		return new Response(
			JSON.stringify({
				error: "This font file is currently in use and cannot be deleted",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const filePath = path.join(FONT_UPLOAD_DIR, fileName);
	const distFilePath = path.join(DIST_FONT_UPLOAD_DIR, fileName);

	if (!existsSync(filePath)) {
		return new Response(JSON.stringify({ error: "Font file not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	unlinkSync(filePath);
	if (existsSync(distFilePath)) {
		unlinkSync(distFilePath);
	}

	return new Response(
		JSON.stringify({
			success: true,
			availableFonts: listAvailableFonts({
				[settings.font.asciiFont.selectedFile]: settings.font.asciiFont.fontFamily,
				[settings.font.cjkFont.selectedFile]: settings.font.cjkFont.fontFamily,
			}),
		}),
		{
			headers: { "Content-Type": "application/json" },
		},
	);
};
