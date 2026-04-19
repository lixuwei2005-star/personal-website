export const prerender = false;

import type { APIRoute } from "astro";
import { getAllDevicesFlat, createDevice } from "../../../../lib/repositories/devices";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllDevicesFlat()), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	const item = createDevice(data);
	return new Response(JSON.stringify(item), { status: 201, headers: { "Content-Type": "application/json" } });
};
