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
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".webp":
			return "image/webp";
		case ".gif":
			return "image/gif";
		case ".svg":
			return "image/svg+xml";
		case ".ico":
			return "image/x-icon";
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

export const GET: APIRoute = async ({ url }) => {
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

	const fileBuffer = readFileSync(resolvedPath);
	return new Response(fileBuffer, {
		headers: {
			"Content-Type": getMimeType(resolvedPath),
			"Cache-Control": "no-store",
		},
	});
};
