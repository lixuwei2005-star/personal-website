export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_ROOT = path.resolve(process.cwd(), "src");
const PUBLIC_ROOT = path.resolve(process.cwd(), "public");
const DIST_PUBLIC_ROOT = path.resolve(process.cwd(), "dist", "client");

// 优化后的图片缓存目录。第一次请求生成后落盘，后续请求直接读盘，速度接近静态文件。
const CACHE_DIR = path.resolve(process.cwd(), ".cache", "image-preview");
try {
	mkdirSync(CACHE_DIR, { recursive: true });
} catch {
	// 忽略并发建目录冲突
}

// Sharp 能高效处理的格式（其他如 svg/gif 保留原文件，避免破坏动画/矢量）
const OPTIMIZABLE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

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

function parseIntParam(value: string | null, fallback: number | null): number | null {
	if (!value) return fallback;
	const n = parseInt(value, 10);
	if (Number.isNaN(n) || n <= 0) return fallback;
	return n;
}

function makeCacheKey(
	srcPath: string,
	mtimeMs: number,
	w: number | null,
	q: number,
	format: string,
): string {
	const hash = createHash("md5")
		.update(`${srcPath}|${mtimeMs}|${w ?? "auto"}|${q}|${format}`)
		.digest("hex");
	return `${hash}.${format}`;
}

const LONG_CACHE_HEADER = "public, max-age=2592000, immutable"; // 30 天，配合 mtime 走 hash 缓存键，源图变了 hash 就变

export const GET: APIRoute = async ({ url, request }) => {
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

	const ext = path.extname(resolvedPath).toLowerCase();
	const isOptimizable = OPTIMIZABLE_EXTS.has(ext);

	// 解析参数
	const w = parseIntParam(url.searchParams.get("w"), null);
	const q = parseIntParam(url.searchParams.get("q"), 85) ?? 85;
	let format = (url.searchParams.get("format") || "").toLowerCase();
	const wantOriginal = url.searchParams.get("original") === "1";

	// 不能 / 不该优化时，原样返回（但还是要带正确的缓存头！）
	if (!isOptimizable || wantOriginal) {
		const fileBuffer = readFileSync(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				"Content-Type": getMimeType(resolvedPath),
				"Cache-Control": LONG_CACHE_HEADER,
			},
		});
	}

	// 默认走 webp（现代浏览器全支持，省 60-80%）
	if (!format || !["webp", "jpeg", "jpg", "png", "avif"].includes(format)) {
		format = "webp";
	}
	if (format === "jpg") format = "jpeg";

	const stats = statSync(resolvedPath);
	const cacheKey = makeCacheKey(resolvedPath, stats.mtimeMs, w, q, format);
	const cachePath = path.join(CACHE_DIR, cacheKey);
	const contentType =
		format === "jpeg" ? "image/jpeg" : `image/${format}`;

	// 命中磁盘缓存：直接返回
	if (existsSync(cachePath)) {
		return new Response(readFileSync(cachePath), {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": LONG_CACHE_HEADER,
				"X-Image-Cache": "HIT",
			},
		});
	}

	// Miss：用 Sharp 处理后落盘
	try {
		let pipeline = sharp(resolvedPath, { failOn: "none" });
		if (w) {
			pipeline = pipeline.resize({
				width: w,
				withoutEnlargement: true, // 不放大原图（避免糊）
				fit: "inside",
			});
		}

		switch (format) {
			case "webp":
				pipeline = pipeline.webp({ quality: q, effort: 4 });
				break;
			case "avif":
				pipeline = pipeline.avif({ quality: q, effort: 4 });
				break;
			case "jpeg":
				pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
				break;
			case "png":
				pipeline = pipeline.png({ quality: q, compressionLevel: 9 });
				break;
		}

		const buffer = await pipeline.toBuffer();

		// 写缓存（失败不致命）
		try {
			writeFileSync(cachePath, buffer);
		} catch {
			// 比如磁盘满或权限问题，不影响本次返回
		}

		return new Response(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": LONG_CACHE_HEADER,
				"X-Image-Cache": "MISS",
			},
		});
	} catch (err) {
		// Sharp 处理失败（极少见，比如文件损坏），降级为原图
		const fileBuffer = readFileSync(resolvedPath);
		return new Response(fileBuffer, {
			headers: {
				"Content-Type": getMimeType(resolvedPath),
				"Cache-Control": LONG_CACHE_HEADER,
				"X-Image-Cache": "BYPASS",
			},
		});
	}
};
