export const prerender = false;

import type { APIRoute } from "astro";
import { getAllAnime, createAnime } from "../../../../lib/repositories/anime";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllAnime()), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	const item = createAnime(data);
	return new Response(JSON.stringify(item), { status: 201, headers: { "Content-Type": "application/json" } });
};
