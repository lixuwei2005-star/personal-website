export const prerender = false;

import type { APIRoute } from "astro";
import {
	deleteAlbum,
	getAlbumForAdmin,
	updateAlbum,
} from "../../../../lib/repositories/albums";

export const GET: APIRoute = async ({ params }) => {
	const album = await getAlbumForAdmin(params.id!);
	if (!album) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify(album), {
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ params, request }) => {
	try {
		const data = await request.json();
		const album = await updateAlbum(params.id!, data);
		if (!album) {
			return new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify(album), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Failed to update album",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const ok = deleteAlbum(params.id!);
	if (!ok) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
