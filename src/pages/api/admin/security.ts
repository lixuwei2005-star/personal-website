export const prerender = false;

import type { APIRoute } from "astro";
import {
	createSession,
	deleteSessionsForUser,
	getAdminUserById,
	isAdminUsernameTaken,
	updateAdminCredentials,
	verifyAdminCurrentPassword,
} from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies, locals }) => {
	const userId = Number(locals.userId);
	const currentUser = getAdminUserById(userId);
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = await request.json().catch(() => ({}));
	const username = typeof body?.username === "string" ? body.username.trim() : "";
	const confirmUsername =
		typeof body?.confirmUsername === "string" ? body.confirmUsername.trim() : "";
	const currentPassword =
		typeof body?.currentPassword === "string" ? body.currentPassword : "";
	const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
	const confirmPassword =
		typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

	if (!username || !confirmUsername) {
		return new Response(JSON.stringify({ error: "Username is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (username !== confirmUsername) {
		return new Response(JSON.stringify({ error: "Usernames do not match" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!currentPassword.trim()) {
		return new Response(JSON.stringify({ error: "Current password is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const shouldChangePassword = newPassword.length > 0 || confirmPassword.length > 0;
	if (shouldChangePassword && newPassword !== confirmPassword) {
		return new Response(JSON.stringify({ error: "Passwords do not match" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (!verifyAdminCurrentPassword(userId, currentPassword)) {
		return new Response(JSON.stringify({ error: "Current password is incorrect" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (isAdminUsernameTaken(username, userId)) {
		return new Response(JSON.stringify({ error: "Username is already in use" }), {
			status: 409,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const updatedUser = updateAdminCredentials(userId, {
			username,
			newPassword: shouldChangePassword ? newPassword : undefined,
		});

		if (!updatedUser) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		deleteSessionsForUser(userId);
		const sessionToken = createSession(userId);
		cookies.set("session", sessionToken, {
			path: "/",
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60,
		});

		return new Response(
			JSON.stringify({
				success: true,
				username: updatedUser.username,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to update credentials";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
