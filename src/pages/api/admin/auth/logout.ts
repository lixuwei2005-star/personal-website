export const prerender = false;

import type { APIRoute } from "astro";
import { deleteSession } from "../../../../lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
	const token = cookies.get("session")?.value;
	if (token) {
		deleteSession(token);
	}
	cookies.delete("session", { path: "/" });
	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
