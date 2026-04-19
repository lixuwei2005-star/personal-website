export const prerender = false;

import type { APIRoute } from "astro";
import { syncAnnouncementsToGeneratedConfig } from "../../../../lib/content-sync/announcements";
import {
	deleteAnnouncement,
	getAnnouncementConfigs,
	updateAnnouncement,
} from "../../../../lib/repositories/announcements";

function syncAnnouncements() {
	syncAnnouncementsToGeneratedConfig(getAnnouncementConfigs());
}

function parseAnnouncementId(value: string | undefined): number | null {
	if (!value) {
		return null;
	}

	const id = Number.parseInt(value, 10);
	return Number.isFinite(id) ? id : null;
}

export const PUT: APIRoute = async ({ params, request }) => {
	const id = parseAnnouncementId(params.id);
	if (id === null) {
		return new Response(JSON.stringify({ error: "Invalid announcement id" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const data = await request.json();
		const updated = updateAnnouncement(id, data);
		if (!updated) {
			return new Response(JSON.stringify({ error: "Announcement not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		syncAnnouncements();
		return new Response(JSON.stringify(updated), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to update announcement";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const id = parseAnnouncementId(params.id);
	if (id === null) {
		return new Response(JSON.stringify({ error: "Invalid announcement id" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const deleted = deleteAnnouncement(id);
	if (!deleted) {
		return new Response(JSON.stringify({ error: "Announcement not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	syncAnnouncements();
	return new Response(null, { status: 204 });
};
