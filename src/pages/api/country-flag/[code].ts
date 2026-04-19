import type { APIRoute } from "astro";

export const prerender = false;

const FLAG_UPSTREAMS = [
	(code: string) => `https://flagcdn.com/${code}.svg`,
	(code: string) => `https://flagcdn.io/flags/4x3/${code}.svg`,
];

export const GET: APIRoute = async ({ params }) => {
	const code = (params.code || "").toLowerCase();

	if (!/^[a-z]{2}$/.test(code)) {
		return new Response("Invalid country code", { status: 400 });
	}

	for (const getUrl of FLAG_UPSTREAMS) {
		try {
			const response = await fetch(getUrl(code), {
				headers: {
					Accept: "image/svg+xml,image/*;q=0.8,*/*;q=0.5",
				},
			});

			if (!response.ok) {
				continue;
			}

			const contentType =
				response.headers.get("content-type") || "image/svg+xml";
			const body = await response.arrayBuffer();

			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
				},
			});
		} catch (_error) {
			// Try the next upstream.
		}
	}

	return new Response("Flag not found", { status: 404 });
};
