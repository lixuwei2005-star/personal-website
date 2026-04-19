export const prerender = false;

import type { APIRoute } from "astro";
import {
	getFootprintCountries,
	getFootprintRegions,
} from "../../../../lib/footprints/location-service";

export const GET: APIRoute = async ({ url }) => {
	try {
		const countryCode = url.searchParams.get("countryCode");
		const payload = countryCode
			? await getFootprintRegions(countryCode)
			: await getFootprintCountries();

		return new Response(JSON.stringify(payload), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "Failed to load footprint options",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
