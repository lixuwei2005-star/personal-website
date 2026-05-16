import { loadEnv } from "./load-env.js";

loadEnv();

// 从线上 sitemap 端点抓取 URL 列表
async function fetchSitemap(sitemapUrl) {
	const response = await fetch(sitemapUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch sitemap (${response.status}): ${sitemapUrl}`,
		);
	}
	const xml = await response.text();
	const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
	if (!urlMatches) {
		console.error("❌ No URLs found in sitemap");
		return [];
	}
	const urls = urlMatches.map((m) => m.replace(/<loc>|<\/loc>/g, "").trim());
	console.log(`✓ Parsed ${urls.length} URLs from ${sitemapUrl}`);
	return urls;
}

// 提交 URL 到 Bing IndexNow API
async function submitToIndexNow(urls) {
	if (!urls || urls.length === 0) {
		console.log("⚠ No URLs to submit");
		return;
	}

	// 限制每次提交的 URL 数量（IndexNow API 有数量限制）
	const MAX_URLS_PER_REQUEST = 10000; // IndexNow API 限制最大 10000 个URL
	const urlChunks = [];

	for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
		urlChunks.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));
	}

	const apiKey = process.env.INDEXNOW_KEY;
	const host = process.env.INDEXNOW_HOST;
	const keyLocation = `https://${host}/${apiKey}.txt`;

	if (!apiKey || !host) {
		console.error(
			"❌ Missing required environment variables: INDEXNOW_KEY or INDEXNOW_HOST",
		);
		console.error("   Please configure these variables in the .env file");
		return;
	}

	for (let i = 0; i < urlChunks.length; i++) {
		const chunk = urlChunks[i];
		console.log(
			`\n📊 Submitting batch ${i + 1}/${urlChunks.length} URLs (${chunk.length} URLs)...`,
		);

		try {
			const response = await fetch("https://api.indexnow.org/IndexNow", {
				method: "POST",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
				body: JSON.stringify({
					host: host,
					key: apiKey,
					keyLocation: keyLocation,
					urlList: chunk,
				}),
			});

			if (response.status === 200) {
				console.log(`✅ Batch ${i + 1} URLs submitted successfully`);
			} else if (response.status === 202) {
				console.warn(
					`⚠ Batch ${i + 1} request accepted but still processing (Status code: ${response.status})`,
				);
				console.warn(
					"This is not a standard success status code, you may need to check API documentation",
				);
			} else {
				console.error(
					`❌ Batch ${i + 1} URLs submission failed, Status code: ${response.status}`,
				);
				const responseBody = await response.text();
				console.error(`   Response body: ${responseBody}`);

				// 根据状态码提供更详细的错误信息
				switch (response.status) {
					case 400:
						console.error("   Error: Request format is invalid");
						break;
					case 403:
						console.error(
							"   Error: API key is invalid or authentication failed",
						);
						break;
					case 422:
						console.error(
							"   Error: URL does not belong to specified host or key mismatch",
						);
						break;
					case 429:
						console.error(
							"   Error: Request too frequent, may be considered as spam",
						);
						break;
					default:
						console.error(
							`   Error: Other error, status code ${response.status}`,
						);
				}
			}
		} catch (error) {
			console.error(
				`❌ Error occurred during batch ${i + 1} URL submission:`,
				error.message,
			);
		}
	}
}

// 主函数
async function main() {
	console.log("🚀 Starting Bing IndexNow URL submission task...\n");

	const host = process.env.INDEXNOW_HOST;
	if (!host) {
		console.error("❌ Missing required env var: INDEXNOW_HOST");
		process.exit(1);
	}
	const sitemapUrl = `https://${host}/sitemap.xml`;

	try {
		const urls = await fetchSitemap(sitemapUrl);

		if (urls.length === 0) {
			console.log("⚠ No URLs found in sitemap, skipping submission");
			return;
		}

		const filteredUrls = urls.filter(
			(url) =>
				url.startsWith(`https://${host}/`) ||
				url.startsWith(`http://${host}/`),
		);

		console.log(`✓ Filtered to ${filteredUrls.length} valid URLs`);

		if (filteredUrls.length === 0) {
			console.log("⚠ No URLs matching the host found, skipping submission");
			return;
		}

		await submitToIndexNow(filteredUrls);

		console.log("\n🎉 Bing IndexNow URL submission task completed!");
	} catch (error) {
		console.error("❌ Error occurred during execution:", error.message);
		process.exit(1);
	}
}

// 运行主函数
await main();
