export const prerender = false;

import type { APIRoute } from "astro";
import { syncAnnouncementsToGeneratedConfig } from "../../../../lib/content-sync/announcements";
import {
	createAnnouncement,
	getAllAnnouncements,
	getAnnouncementConfigs,
} from "../../../../lib/repositories/announcements";

function syncAnnouncements() {
	syncAnnouncementsToGeneratedConfig(getAnnouncementConfigs());
}

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(getAllAnnouncements()), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		const created = createAnnouncement(data);
		syncAnnouncements();

		return new Response(JSON.stringify(created), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to create announcement";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
