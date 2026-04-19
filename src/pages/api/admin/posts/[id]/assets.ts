export const prerender = false;

import type { APIRoute } from "astro";
import crypto from "node:crypto";
import path from "node:path";
import {
	listPostAssets,
	type PostAssetFile,
	removePostAsset,
	savePostAsset,
} from "../../../../../lib/repositories/post-assets";
import { getPostById } from "../../../../../lib/repositories/posts";

const ALLOWED_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".svg",
	".avif",
]);

function isSupportedImageFile(file: File) {
	const extension = path.extname(file.name).toLowerCase();
	if (ALLOWED_EXTENSIONS.has(extension)) {
		return true;
	}

	return file.type.startsWith("image/");
}

function getValidatedPostId(idParam: string | undefined) {
	const id = Number(idParam);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error("Invalid post id");
	}

	const post = getPostById(id);
	if (!post) {
		throw new Error("Post not found");
	}

	return id;
}

export const GET: APIRoute = async ({ params }) => {
	try {
		const postId = getValidatedPostId(params.id);
		return new Response(JSON.stringify({ assets: listPostAssets(postId) }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to list assets";
		return new Response(JSON.stringify({ error: message }), {
			status: message === "Post not found" ? 404 : 400,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const POST: APIRoute = async ({ params, request }) => {
	try {
		const postId = getValidatedPostId(params.id);
		const formData = await request.formData();
		const files = formData
			.getAll("files")
			.filter((value): value is File => value instanceof File);

		if (files.length === 0) {
			return new Response(JSON.stringify({ error: "No image files provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const uploadedAssets: PostAssetFile[] = [];
		for (const file of files) {
			if (!isSupportedImageFile(file)) {
				return new Response(
					JSON.stringify({ error: "Only image uploads are supported" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const extension = path.extname(file.name) || ".bin";
			const uniqueName = `${crypto.randomUUID()}${extension}`;
			const buffer = Buffer.from(await file.arrayBuffer());
			uploadedAssets.push(savePostAsset(postId, uniqueName, buffer));
		}

		return new Response(JSON.stringify({ assets: uploadedAssets }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to upload assets";
		return new Response(JSON.stringify({ error: message }), {
			status: message === "Post not found" ? 404 : 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ params, request }) => {
	try {
		const postId = getValidatedPostId(params.id);
		const body = await request.json().catch(() => ({}));
		const assetPath = typeof body?.path === "string" ? body.path : "";
		if (!assetPath) {
			return new Response(JSON.stringify({ error: "Missing asset path" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		removePostAsset(postId, assetPath);
		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to delete asset";
		return new Response(JSON.stringify({ error: message }), {
			status: message === "Post not found" ? 404 : 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
