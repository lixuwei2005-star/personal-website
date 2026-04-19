export const prerender = false;

import type { APIRoute } from "astro";
import { authenticateUser } from "../../../../lib/auth";

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
	const body = await request.json();
	const { username, password } = body;

	if (!username || !password) {
		return new Response(JSON.stringify({ error: "Username and password required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const result = authenticateUser(username, password);
	if (!result.ok) {
		if (result.reason === "locked") {
			return new Response(
				JSON.stringify({
					errorCode: "auth.loginLocked",
					retryAfterSeconds: result.retryAfterSeconds ?? 0,
				}),
				{
					status: 429,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(JSON.stringify({ error: "Invalid credentials" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	cookies.set("session", result.token, {
		path: "/",
		httpOnly: true,
		secure: shouldUseSecureCookies(request),
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60,
	});

	return new Response(JSON.stringify({ success: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
