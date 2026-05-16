import type { APIRoute } from "astro";

import { siteConfig } from "../config";
import { getSortedPosts } from "../utils/content-utils";
import { removeFileExtension } from "../utils/url-utils";

export const prerender = false;

// W3C datetime — date-only form is valid and matches Astro sitemap defaults
function toLastmod(value: unknown): string | null {
	if (!value) return null;
	const d = value instanceof Date ? value : new Date(value as string);
	if (Number.isNaN(d.getTime())) return null;
	return d.toISOString().split("T")[0];
}

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL(siteConfig.siteURL)).href.replace(/\/$/, "");

	const posts = await getSortedPosts();

	const postEntries = posts.map((entry) => {
		const slug = removeFileExtension(entry.id);
		const lastmod =
			toLastmod(entry.data.updated) ?? toLastmod(entry.data.published);
		return {
			loc: `${base}/posts/${encodeURI(slug)}/`,
			lastmod,
		};
	});

	// Homepage lastmod tracks the most recent post update so search engines
	// re-crawl the index when new content lands.
	const homeLastmod =
		postEntries
			.map((e) => e.lastmod)
			.filter((d): d is string => !!d)
			.sort()
			.pop() ?? null;

	const entries = [
		{ loc: `${base}/`, lastmod: homeLastmod },
		{ loc: `${base}/about/`, lastmod: null },
		{ loc: `${base}/about-site/`, lastmod: null },
		...postEntries,
	];

	const urlBlocks = entries
		.map(({ loc, lastmod }) => {
			const lines = [`    <loc>${xmlEscape(loc)}</loc>`];
			if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
			return `  <url>\n${lines.join("\n")}\n  </url>`;
		})
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks}
</urlset>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
};
