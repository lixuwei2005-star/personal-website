export const prerender = false;

import type { APIRoute } from "astro";
import { syncAnnouncementsToGeneratedConfig } from "../../../../lib/content-sync/announcements";
import {
	getAnnouncementConfigs,
	getAnnouncementGlobalSettings,
	updateAnnouncementGlobalSettings,
} from "../../../../lib/repositories/announcements";

function syncAnnouncements() {
	syncAnnouncementsToGeneratedConfig(getAnnouncementConfigs());
}

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAnnouncementGlobalSettings()), {
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ request }) => {
	const current = getAnnouncementGlobalSettings();

	try {
		const data = await request.json();
		updateAnnouncementGlobalSettings(data);
		const updated = getAnnouncementGlobalSettings();

		try {
			syncAnnouncements();
		} catch (error) {
			updateAnnouncementGlobalSettings(current);
			throw error;
		}

		return new Response(JSON.stringify(updated), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to update announcement settings";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
