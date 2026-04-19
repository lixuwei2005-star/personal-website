export const prerender = false;

import type { APIRoute } from "astro";
import { getAllSkills, createSkill } from "../../../../lib/repositories/skills";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllSkills()), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	const item = createSkill(data);
	return new Response(JSON.stringify(item), { status: 201, headers: { "Content-Type": "application/json" } });
};
