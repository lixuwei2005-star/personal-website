export const prerender = false;

import type { APIRoute } from "astro";
import { getAllProjects, createProject } from "../../../../lib/repositories/projects";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllProjects()), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	const item = createProject(data);
	return new Response(JSON.stringify(item), { status: 201, headers: { "Content-Type": "application/json" } });
};
