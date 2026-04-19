export const prerender = false;

import type { APIRoute } from "astro";
import { getProfile } from "../../lib/repositories/profile";

export const GET: APIRoute = async () => {
	const profile = getProfile();
	return new Response(JSON.stringify(profile), {
		headers: { "Content-Type": "application/json" },
	});
};
