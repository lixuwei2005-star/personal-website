export const prerender = false;

import type { APIRoute } from "astro";
import { getAdminUserById } from "../../../lib/auth";
import {
	readRebuildLogTail,
	readRebuildState,
	startRebuild,
} from "../../../lib/admin/rebuild";

export const GET: APIRoute = async () => {
	const state = readRebuildState();
	const log = readRebuildLogTail();
	return new Response(JSON.stringify({ state, log }), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ locals }) => {
	const userId = Number(locals.userId);
	const currentUser = getAdminUserById(userId);
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const result = startRebuild({ triggeredBy: currentUser.username });
	if (!result.ok) {
		const status =
			result.error === "already-running"
				? 409
				: result.error === "script-missing"
					? 500
					: 500;
		return new Response(
			JSON.stringify({
				error: result.message ?? "Failed to start rebuild",
				errorCode: result.error,
				state: result.state,
			}),
			{
				status,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	return new Response(JSON.stringify({ state: result.state }), {
		status: 202,
		headers: { "Content-Type": "application/json" },
	});
};
