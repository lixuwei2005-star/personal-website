export const prerender = false;

import type { APIRoute } from "astro";
import { syncProfileToGeneratedConfig } from "../../../lib/content-sync/profile";
import { syncSiteSettingsToGeneratedConfig } from "../../../lib/content-sync/site-settings";
import { getProfile, updateProfile } from "../../../lib/repositories/profile";
import {
	getSiteSettings,
	updateSiteSettings,
} from "../../../lib/repositories/site-settings";

export const GET: APIRoute = async () => {
	const profile = getProfile();
	const siteSettings = getSiteSettings();
	return new Response(JSON.stringify({ ...profile, ...siteSettings }), {
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ request }) => {
	const current = getProfile();
	const currentSiteSettings = getSiteSettings();

	try {
		const data = await request.json();
		const { showLastModified, ...profileData } = data;
		updateProfile(profileData);
		if (typeof showLastModified === "boolean") {
			updateSiteSettings({ showLastModified });
		}
		const updated = getProfile();
		const updatedSiteSettings = getSiteSettings();

		try {
			syncProfileToGeneratedConfig(updated);
			syncSiteSettingsToGeneratedConfig(updatedSiteSettings);
		} catch (error) {
			updateProfile(current);
			updateSiteSettings(currentSiteSettings);
			throw error;
		}

		return new Response(JSON.stringify({ ...updated, ...updatedSiteSettings }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to update profile";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
