export const prerender = false;

import type { APIRoute } from "astro";
import {
	deleteTool,
	updateTool,
} from "../../../../lib/repositories/tools";

export const PUT: APIRoute = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json();
	const updated = updateTool(id, body);
	if (!updated) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(JSON.stringify(updated), {
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async ({ params }) => {
	const id = Number(params.id);
	const deleted = deleteTool(id);
	if (!deleted) {
		return new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(null, { status: 204 });
};
