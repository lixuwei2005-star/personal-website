export const prerender = false;

import type { APIRoute } from "astro";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const SOURCE_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const DIST_UPLOAD_DIR = path.join(process.cwd(), "dist", "client", "uploads");

function ensureDir(dirPath: string) {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
}

export const POST: APIRoute = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return new Response(JSON.stringify({ error: "No file provided" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!file.type.startsWith("image/")) {
		return new Response(JSON.stringify({ error: "Only image uploads are supported" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Generate unique filename
	const ext = path.extname(file.name) || ".bin";
	const uniqueName = `${crypto.randomUUID()}${ext}`;
	const sourceFilePath = path.join(SOURCE_UPLOAD_DIR, uniqueName);
	const distFilePath = path.join(DIST_UPLOAD_DIR, uniqueName);

	// Write file
	const buffer = Buffer.from(await file.arrayBuffer());
	ensureDir(SOURCE_UPLOAD_DIR);
	writeFileSync(sourceFilePath, buffer);

	// Keep production `npm start` previews/front-end reads in sync with fresh uploads.
	if (existsSync(path.dirname(DIST_UPLOAD_DIR))) {
		ensureDir(DIST_UPLOAD_DIR);
		writeFileSync(distFilePath, buffer);
	}

	// Return public URL
	const publicUrl = `/uploads/${uniqueName}`;
	return new Response(JSON.stringify({ url: publicUrl, name: file.name, size: file.size }), {
		headers: { "Content-Type": "application/json" },
	});
};
