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
	try {
		const body = await request.json();
		const created = await createFootprint(body);
		return new Response(JSON.stringify(created), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to create footprint";
		return new Response(JSON.stringify({ error: message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
};
