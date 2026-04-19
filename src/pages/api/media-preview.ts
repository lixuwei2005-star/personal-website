export const prerender = false;

import type { APIRoute } from "astro";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SRC_ROOT = path.resolve(process.cwd(), "src");
const PUBLIC_ROOT = path.resolve(process.cwd(), "public");
const DIST_PUBLIC_ROOT = path.resolve(process.cwd(), "dist", "client");

function getMimeType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".mp3":
			return "audio/mpeg";
		case ".wav":
			return "audio/wav";
		case ".ogg":
			return "audio/ogg";
		case ".m4a":
			return "audio/mp4";
		case ".aac":
			return "audio/aac";
		case ".flac":
			return "audio/flac";
		case ".webm":
			return "audio/webm";
		default:
			return "application/octet-stream";
	}
}

function resolveSafeFile(baseDir: string, requestedPath: string): string | null {
	const normalized = requestedPath.replace(/^\/+/, "");
	const resolvedPath = path.resolve(baseDir, normalized);
	const relativePath = path.relative(baseDir, resolvedPath);

	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		return null;
	}

	if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
		return null;
	}

	return resolvedPath;
}

export const GET: APIRoute = async ({ request, url }) => {
	const requestedPath = url.searchParams.get("path");
	if (!requestedPath) {
		return new Response("Missing path", { status: 400 });
	}

	if (
		requestedPath.startsWith("http://") ||
		requestedPath.startsWith("https://") ||
		requestedPath.startsWith("data:")
	) {
		return new Response("External paths are not supported", { status: 400 });
	}

	const resolvedPath = requestedPath.startsWith("/")
		? resolveSafeFile(PUBLIC_ROOT, requestedPath) ??
			resolveSafeFile(DIST_PUBLIC_ROOT, requestedPath)
		: resolveSafeFile(SRC_ROOT, requestedPath);

	if (!resolvedPath) {
		return new Response("File not found", { status: 404 });
	}

	const fileStat = statSync(resolvedPath);
	const totalSize = fileStat.size;
	const rangeHeader = request.headers.get("range");

	if (rangeHeader) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
		if (!match) {
			return new Response("Invalid Range", {
				status: 416,
				headers: {
					"Content-Range": `bytes */${totalSize}`,
				},
			});
		}

		const start = match[1] ? Number.parseInt(match[1], 10) : 0;
		const end = match[2]
			? Number.parseInt(match[2], 10)
			: totalSize - 1;

		if (
			!Number.isFinite(start) ||
			!Number.isFinite(end) ||
			start < 0 ||
			end < start ||
			start >= totalSize
		) {
			return new Response("Range Not Satisfiable", {
				status: 416,
				headers: {
					"Content-Range": `bytes */${totalSize}`,
				},
			});
		}

		const safeEnd = Math.min(end, totalSize - 1);
		const chunkSize = safeEnd - start + 1;
		const fileBuffer = readFileSync(resolvedPath);
		const chunk = fileBuffer.subarray(start, safeEnd + 1);

		return new Response(chunk, {
			status: 206,
			headers: {
				"Content-Type": getMimeType(resolvedPath),
				"Content-Length": String(chunkSize),
				"Content-Range": `bytes ${start}-${safeEnd}/${totalSize}`,
				"Accept-Ranges": "bytes",
				"Cache-Control": "no-store",
			},
		});
	}

	const fileBuffer = readFileSync(resolvedPath);
	return new Response(fileBuffer, {
		headers: {
			"Content-Type": getMimeType(resolvedPath),
			"Content-Length": String(totalSize),
			"Accept-Ranges": "bytes",
			"Cache-Control": "no-store",
		},
	});
};
