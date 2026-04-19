export const prerender = false;

import type { APIRoute } from "astro";
import { getAllTools, createTool } from "../../../../lib/repositories/tools";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllTools()), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json();
	const created = createTool(body);
	return new Response(JSON.stringify(created), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};
