export const prerender = false;

import type { APIRoute } from "astro";
import { getAllFriends, createFriend } from "../../../../lib/repositories/friends";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllFriends()), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	const item = createFriend(data);
	return new Response(JSON.stringify(item), { status: 201, headers: { "Content-Type": "application/json" } });
};
