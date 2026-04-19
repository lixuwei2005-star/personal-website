export const prerender = false;

import type { APIRoute } from "astro";
import {
	deleteFootprint,
	updateFootprint,
} from "../../../../lib/repositories/footprints";

export const PUT: APIRoute = async ({ params, request }) => {
	try {
		const id = Number(params.id);
		const body = await request.json();
		const updated = await updateFootprint(id, body);
		if (!updated) {
			return new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(JSON.stringify(updated), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Failed to update footprint";
		return new Response(JSON.stringify({ error: message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const id = Number(params.id);
	const deleted = deleteFootprint(id);
	if (!deleted) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(null, { status: 204 });
};
