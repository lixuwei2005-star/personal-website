export const prerender = false;

import type { APIRoute } from "astro";
import {
	readSpecMarkdown,
	syncAboutContentVersion,
	writeSpecMarkdown,
} from "../../../../lib/content-sync/spec";

export const GET: APIRoute = async () => {
	try {
		const content = readSpecMarkdown("about");
		return new Response(JSON.stringify({ content }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to load about page";
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
			return new Response(JSON.stringify({ error: "Content must be a string" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		writeSpecMarkdown("about", data.content);
		syncAboutContentVersion();
		const content = readSpecMarkdown("about");

		return new Response(JSON.stringify({ content }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to save about page";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
