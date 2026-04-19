export const prerender = false;

import { getLastAdminLoginAt } from "../../lib/auth";

export async function GET() {
	return new Response(
		JSON.stringify({
			lastAdminLoginAt: getLastAdminLoginAt(),
		}),
		{
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
			},
		},
	);
}
