export const prerender = false;

import type { APIRoute } from "astro";
import { updateSkill, deleteSkill } from "../../../../lib/repositories/skills";

export const PUT: APIRoute = async ({ params, request }) => {
	const data = await request.json();
	const item = updateSkill(params.id!, data);
	if (!item) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	return new Response(JSON.stringify(item), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ params }) => {
	const ok = deleteSkill(params.id!);
	if (!ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
