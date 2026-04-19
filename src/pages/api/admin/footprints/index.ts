export const prerender = false;

import type { APIRoute } from "astro";
import {
	createFootprint,
	getAllFootprints,
} from "../../../../lib/repositories/footprints";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllFootprints()), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json();
	const created = await createFootprint(body);
	return new Response(JSON.stringify(created), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};
