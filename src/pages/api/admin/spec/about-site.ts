export const prerender = false;

import type { APIRoute } from "astro";
import {
	readSpecMarkdown,
	syncAboutSiteContentVersion,
	writeSpecMarkdown,
} from "../../../../lib/content-sync/spec";

export const GET: APIRoute = async () => {
	try {
		const content = readSpecMarkdown("about-site");
		return new Response(JSON.stringify({ content }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load About This Site page";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const PUT: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		if (typeof data?.content !== "string") {
			return new Response(
				JSON.stringify({ error: "Content must be a string" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		writeSpecMarkdown("about-site", data.content);
		syncAboutSiteContentVersion();
		const content = readSpecMarkdown("about-site");

		return new Response(JSON.stringify({ content }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to save About This Site page";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
