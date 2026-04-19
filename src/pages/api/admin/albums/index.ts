export const prerender = false;

import type { APIRoute } from "astro";
import { createAlbum, getAllAlbumsForAdmin } from "../../../../lib/repositories/albums";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(await getAllAlbumsForAdmin()), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		const album = await createAlbum(data);
		return new Response(JSON.stringify(album), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Failed to create album",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
