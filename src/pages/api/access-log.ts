export const prerender = false;

import type { APIRoute } from "astro";
import {
	createAccessLog,
	enrichAccessLogWithGeo,
	extractClientIp,
	getHeaderGeoSnapshot,
} from "../../lib/repositories/access-logs";

function normalizePath(value: unknown): string {
	if (typeof value !== "string") {
		return "/";
	}

	const trimmed = value.trim();
	if (!trimmed || !trimmed.startsWith("/")) {
		return "/";
	}

	if (
		trimmed.startsWith("/admin") ||
		trimmed.startsWith("/api/") ||
		trimmed.startsWith("/_astro/") ||
		trimmed.startsWith("/pagefind/")
	) {
		return "/";
	}

	return trimmed;
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as { path?: unknown };
		const path = normalizePath(body?.path);
		const ip = extractClientIp(request.headers);
		const userAgent = request.headers.get("user-agent") || "";

		if (!userAgent.trim()) {
			return new Response(JSON.stringify({ success: true, skipped: true }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const logId = createAccessLog({
			ip,
			path,
			userAgent,
			geo: getHeaderGeoSnapshot(request.headers, ip),
		});
		if (logId === null) {
			return new Response(JSON.stringify({ success: true, skipped: true }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		void enrichAccessLogWithGeo(logId, ip, request.headers);

		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
};
