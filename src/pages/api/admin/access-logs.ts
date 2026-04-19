export const prerender = false;

import type { APIRoute } from "astro";
import {
	clearAccessLogs,
	getRecentAccessLogs,
} from "../../../lib/repositories/access-logs";

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify({ logs: getRecentAccessLogs(100) }), {
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE: APIRoute = async () => {
	const deleted = clearAccessLogs();
	return new Response(JSON.stringify({ success: true, deleted }), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async () => {
	const deleted = clearAccessLogs();
	return new Response(JSON.stringify({ success: true, deleted }), {
		headers: { "Content-Type": "application/json" },
	});
};
