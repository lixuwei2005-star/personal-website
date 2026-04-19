import { defineMiddleware } from "astro:middleware";
import { recordAdminActivity, validateSession } from "./lib/auth";
import { isSiteEnabled } from "./lib/repositories/site-settings";

function isForbiddenPageRoute(pathname: string): boolean {
	return pathname === "/403.html" || pathname === "/403.html/";
}

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	const isAdminRoute = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
	const isLoginRoute = url.pathname.startsWith("/admin/login");
	const isLoginApi = url.pathname.startsWith("/api/admin/auth/login");

	if (!isAdminRoute) {
		if (!isForbiddenPageRoute(url.pathname) && !isSiteEnabled()) {
			return context.redirect("/403.html");
		}

		return next();
	}

	// Skip auth check for login page and login API
	if (isLoginRoute || isLoginApi) {
		return next();
	}

	// Check session cookie
	const sessionToken = context.cookies.get("session")?.value;
	if (!sessionToken) {
		if (url.pathname.startsWith("/api/")) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		return context.redirect("/admin/login/");
	}

	const session = validateSession(sessionToken);
	if (!session) {
		// Invalid/expired session
		context.cookies.delete("session", { path: "/" });
		if (url.pathname.startsWith("/api/")) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		return context.redirect("/admin/login/");
	}

	// Attach user info to locals
	context.locals.userId = session.userId;

	// Treat any successful backend page access as activity so existing
	// persistent sessions still update "last activity" without requiring
	// a fresh password login.
	if (url.pathname.startsWith("/admin/")) {
		recordAdminActivity();
	}

	return next();
});
