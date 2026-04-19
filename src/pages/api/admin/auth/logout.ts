export const prerender = false;

import type { APIRoute } from "astro";
import { deleteSession } from "../../../../lib/auth";

function shouldUseSecureCookies(request: Request): boolean {
	const forwardedProto = request.headers
		.get("x-forwarded-proto")
		?.split(",")[0]
		?.trim()
		?.toLowerCase();
	if (forwardedProto) {
		return forwardedProto === "https";
	}

	try {
		return new URL(request.url).protocol === "https:";
	} catch {
		return false;
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const token = cookies.get("session")?.value;
	if (token) {
		deleteSession(token);
	}
	cookies.delete("session", {
		path: "/",
		secure: shouldUseSecureCookies(request),
		sameSite: "lax",
		httpOnly: true,
	});
	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
