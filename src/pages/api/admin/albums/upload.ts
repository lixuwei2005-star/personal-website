export const prerender = false;

import type { APIRoute } from "astro";
import crypto from "node:crypto";
import path from "node:path";

import {
	clearExistingCoverFiles,
	saveAlbumAsset,
} from "../../../../lib/repositories/albums";

function sanitizeBaseName(fileName: string): string {
	const baseName = path.basename(fileName, path.extname(fileName));
	return baseName
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "") || "photo";
}

export const POST: APIRoute = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	const albumId = String(formData.get("albumId") ?? "").trim();
	const kind = String(formData.get("kind") ?? "photo").trim();

	if (!albumId) {
		return new Response(JSON.stringify({ error: "Album ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

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

	const ext = path.extname(file.name).toLowerCase() || ".jpg";
	const fileName =
		kind === "cover"
			? `cover${ext}`
			: `${sanitizeBaseName(file.name)}-${crypto.randomUUID()}${ext}`;
	const buffer = Buffer.from(await file.arrayBuffer());

	if (kind === "cover") {
		clearExistingCoverFiles(albumId);
	}

	const publicUrl = saveAlbumAsset(albumId, fileName, buffer);
	return new Response(JSON.stringify({ url: publicUrl, name: file.name, size: file.size }), {
		headers: { "Content-Type": "application/json" },
	});
};
