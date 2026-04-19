export const prerender = false;

import type { APIRoute } from "astro";

import { removeAlbumPhoto } from "../../../../lib/repositories/albums";

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const { albumId, path } = (await request.json()) as {
			albumId?: string;
			path?: string;
		};

		if (!albumId || !path) {
			return new Response(JSON.stringify({ error: "albumId and path are required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		removeAlbumPhoto(albumId, path);
		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Failed to delete file",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
