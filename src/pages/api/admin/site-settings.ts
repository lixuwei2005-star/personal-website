export const prerender = false;

import type { APIRoute } from "astro";
import { syncSiteSettingsToGeneratedConfig } from "../../../lib/content-sync/site-settings";
import {
	getSiteSettings,
	updateSiteSettings,
} from "../../../lib/repositories/site-settings";

export const GET: APIRoute = async () => {
	const settings = getSiteSettings();
	return new Response(JSON.stringify(settings), {
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ request }) => {
	const current = getSiteSettings();

	try {
		const data = await request.json();
		updateSiteSettings(data);
		const updated = getSiteSettings();

		try {
			syncSiteSettingsToGeneratedConfig(updated);
		} catch (error) {
			updateSiteSettings(current);
			throw error;
		}

		return new Response(JSON.stringify(updated), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to update site settings";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
