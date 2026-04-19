import { getDb } from "../db";

export interface AccessLogData {
	id: number;
	ip: string;
	path: string;
	countryCode: string;
	countryName: string;
	region: string;
	city: string;
	visitedAt: string;
	userAgent: string;
}

interface AccessLogRow {
	id: number;
	ip: string;
	path: string;
	country_code: string;
	country_name: string;
	region: string;
	city: string;
	visited_at: string;
	user_agent: string;
}

interface GeoCacheRow {
	ip: string;
	country_code: string;
	country_name: string;
	region: string;
	city: string;
	fetched_at: string;
}

interface GeoSnapshot {
	countryCode: string;
	countryName: string;
	region: string;
	city: string;
}

const GEO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GEO_LOOKUP_TIMEOUT_MS = 1500;
const MAX_ACCESS_LOGS = 1000;
const DUPLICATE_ACCESS_WINDOW_MS = 15 * 60 * 1000;

function rowToAccessLog(row: AccessLogRow): AccessLogData {
	return {
		id: row.id,
		ip: row.ip,
		path: row.path,
		countryCode: row.country_code,
		countryName: row.country_name,
		region: row.region,
		city: row.city,
		visitedAt: row.visited_at,
		userAgent: row.user_agent,
	};
}

function normalizeIp(value: string): string {
	const trimmed = String(value || "").trim();
	if (!trimmed) {
		return "unknown";
	}

	const firstForwarded = trimmed.split(",")[0]?.trim() || trimmed;
	if (!firstForwarded) {
		return "unknown";
	}

	if (firstForwarded.startsWith("[")) {
		const closingIndex = firstForwarded.indexOf("]");
		if (closingIndex > 0) {
			return firstForwarded.slice(1, closingIndex).trim();
		}
	}

	const ipv4WithPort = firstForwarded.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
	if (ipv4WithPort) {
		return ipv4WithPort[1];
	}

	if (firstForwarded.startsWith("::ffff:")) {
		return firstForwarded.slice("::ffff:".length);
	}

	return firstForwarded;
}

function isPrivateIp(ip: string): boolean {
	if (!ip || ip === "unknown") {
		return false;
	}

	if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
		return true;
	}

	if (/^10\./.test(ip) || /^192\.168\./.test(ip)) {
		return true;
	}

	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
		return true;
	}

	return (
		ip.startsWith("fc") ||
		ip.startsWith("fd") ||
		ip.startsWith("fe80:") ||
		ip.startsWith("::ffff:10.") ||
		ip.startsWith("::ffff:192.168.") ||
		/^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
	);
}

function deriveCountryName(countryCode: string): string {
	if (!countryCode || countryCode.length !== 2) {
		return "";
	}

	try {
		return (
			new Intl.DisplayNames(["en"], { type: "region" }).of(
				countryCode.toUpperCase(),
			) || ""
		);
	} catch {
		return "";
	}
}

function getHeaderValue(headers: Headers, keys: string[]): string {
	for (const key of keys) {
		const value = headers.get(key);
		if (value) {
			return value.trim();
		}
	}
	return "";
}

function mergeGeoSnapshot(
	primary?: Partial<GeoSnapshot> | null,
	fallback?: Partial<GeoSnapshot> | null,
): GeoSnapshot {
	return {
		countryCode:
			primary?.countryCode?.trim() ||
			fallback?.countryCode?.trim() ||
			"",
		countryName:
			primary?.countryName?.trim() ||
			fallback?.countryName?.trim() ||
			"",
		region: primary?.region?.trim() || fallback?.region?.trim() || "",
		city: primary?.city?.trim() || fallback?.city?.trim() || "",
	};
}

function hasGeoData(geo: GeoSnapshot): boolean {
	return Boolean(geo.countryName || geo.countryCode || geo.region || geo.city);
}

export function extractClientIp(headers: Headers): string {
	return normalizeIp(
		getHeaderValue(headers, [
			"cf-connecting-ip",
			"x-forwarded-for",
			"x-real-ip",
			"x-client-ip",
			"fly-client-ip",
			"x-vercel-forwarded-for",
			"fastly-client-ip",
			"x-cluster-client-ip",
		]),
	);
}

export function getHeaderGeoSnapshot(headers: Headers, ip: string): GeoSnapshot {
	if (isPrivateIp(ip)) {
		return {
			countryCode: "LOCAL",
			countryName: "Local Network",
			region: "",
			city: ip === "::1" || ip === "127.0.0.1" ? "Localhost" : "",
		};
	}

	const countryCode = getHeaderValue(headers, [
		"cf-ipcountry",
		"x-vercel-ip-country",
		"x-country-code",
	]).toUpperCase();
	const countryName =
		getHeaderValue(headers, ["x-vercel-ip-country-name", "x-country-name"]) ||
		deriveCountryName(countryCode);

	return {
		countryCode,
		countryName,
		region: getHeaderValue(headers, [
			"x-vercel-ip-country-region",
			"x-vercel-ip-region",
			"x-region-name",
		]),
		city: getHeaderValue(headers, [
			"x-vercel-ip-city",
			"x-city-name",
			"x-city",
		]),
	};
}

function getCachedGeo(ip: string): GeoSnapshot | null {
	const db = getDb();
	const row = db
		.prepare(
			"SELECT * FROM visitor_ip_geo_cache WHERE ip = ?",
		)
		.get(ip) as GeoCacheRow | undefined;

	if (!row) {
		return null;
	}

	const fetchedAt = new Date(row.fetched_at).getTime();
	if (
		Number.isNaN(fetchedAt) ||
		Date.now() - fetchedAt > GEO_CACHE_TTL_MS
	) {
		return null;
	}

	return {
		countryCode: row.country_code,
		countryName: row.country_name,
		region: row.region,
		city: row.city,
	};
}

function upsertGeoCache(ip: string, geo: GeoSnapshot): void {
	const db = getDb();
	db.prepare(`
		INSERT INTO visitor_ip_geo_cache (ip, country_code, country_name, region, city, fetched_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(ip) DO UPDATE SET
			country_code = excluded.country_code,
			country_name = excluded.country_name,
			region = excluded.region,
			city = excluded.city,
			fetched_at = excluded.fetched_at
	`).run(
		ip,
		geo.countryCode,
		geo.countryName,
		geo.region,
		geo.city,
		new Date().toISOString(),
	);
}

async function fetchGeoFromIpApi(ip: string): Promise<GeoSnapshot | null> {
	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		GEO_LOOKUP_TIMEOUT_MS,
	);

	try {
		const response = await fetch(
			`https://ipapi.co/${encodeURIComponent(ip)}/json/`,
			{
				headers: {
					Accept: "application/json",
				},
				signal: controller.signal,
			},
		);

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as Record<string, unknown>;
		if (data.error === true || data.reserved === true) {
			return null;
		}

		return {
			countryCode: String(data.country_code || "").toUpperCase(),
			countryName: String(data.country_name || ""),
			region: String(data.region || ""),
			city: String(data.city || ""),
		};
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

function updateAccessLogGeo(logId: number, geo: GeoSnapshot): void {
	const db = getDb();
	db.prepare(`
		UPDATE visitor_access_logs
		SET country_code = ?, country_name = ?, region = ?, city = ?
		WHERE id = ?
	`).run(geo.countryCode, geo.countryName, geo.region, geo.city, logId);
}

function pruneAccessLogs(): void {
	const db = getDb();
	db.prepare(`
		DELETE FROM visitor_access_logs
		WHERE id NOT IN (
			SELECT id FROM visitor_access_logs
			ORDER BY visited_at DESC, id DESC
			LIMIT ?
		)
	`).run(MAX_ACCESS_LOGS);
}

function findRecentDuplicateAccess(ip: string, path: string): number | null {
	const db = getDb();
	const threshold = new Date(Date.now() - DUPLICATE_ACCESS_WINDOW_MS).toISOString();
	const row = db
		.prepare(`
			SELECT id
			FROM visitor_access_logs
			WHERE ip = ? AND path = ? AND visited_at >= ?
			ORDER BY visited_at DESC, id DESC
			LIMIT 1
		`)
		.get(ip, path, threshold) as { id: number } | undefined;

	return row?.id ?? null;
}

export function createAccessLog(input: {
	ip: string;
	path: string;
	userAgent: string;
	geo?: Partial<GeoSnapshot>;
}): number | null {
	const geo = mergeGeoSnapshot(input.geo);
	const db = getDb();
	const duplicateId = findRecentDuplicateAccess(input.ip, input.path);
	if (duplicateId !== null) {
		return null;
	}

	const result = db.prepare(`
		INSERT INTO visitor_access_logs (ip, path, country_code, country_name, region, city, visited_at, user_agent)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		input.ip,
		input.path,
		geo.countryCode,
		geo.countryName,
		geo.region,
		geo.city,
		new Date().toISOString(),
		input.userAgent,
	);

	pruneAccessLogs();
	return Number(result.lastInsertRowid);
}

export async function enrichAccessLogWithGeo(
	logId: number,
	ip: string,
	headers: Headers,
): Promise<void> {
	if (!ip || ip === "unknown") {
		return;
	}

	const headerGeo = getHeaderGeoSnapshot(headers, ip);
	if (isPrivateIp(ip)) {
		updateAccessLogGeo(logId, headerGeo);
		return;
	}

	const cached = getCachedGeo(ip);
	if (cached) {
		updateAccessLogGeo(logId, mergeGeoSnapshot(cached, headerGeo));
		return;
	}

	const fetchedGeo = await fetchGeoFromIpApi(ip);
	const mergedGeo = mergeGeoSnapshot(fetchedGeo, headerGeo);

	if (hasGeoData(mergedGeo)) {
		upsertGeoCache(ip, mergedGeo);
		updateAccessLogGeo(logId, mergedGeo);
	} else if (hasGeoData(headerGeo)) {
		updateAccessLogGeo(logId, headerGeo);
	}
}

export function getRecentAccessLogs(limit = 30): AccessLogData[] {
	const db = getDb();
	const rows = db.prepare(`
		SELECT *
		FROM visitor_access_logs
		ORDER BY visited_at DESC, id DESC
		LIMIT ?
	`).all(limit) as AccessLogRow[];

	return rows.map(rowToAccessLog);
}

export function clearAccessLogs(): number {
	const db = getDb();
	const result = db.prepare("DELETE FROM visitor_access_logs").run();
	return result.changes;
}
