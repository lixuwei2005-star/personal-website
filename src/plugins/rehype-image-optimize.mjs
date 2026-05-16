/**
 * rehype-image-optimize
 *
 * 把文章 markdown 里的 <img src="/uploads/..."> 重写成走 image-preview API：
 *   /api/image-preview/?path=<原 src>&w=<width>&format=webp&q=<quality>
 *
 * 服务端用 Sharp 按宽度上限缩放 + 转 WebP + 落盘缓存。
 * 1.5-2 MB 的 PNG 截图通常压到 300-500 KB WebP，肉眼无差别。
 *
 * 跳过：
 *   - http(s)/data: 外链
 *   - 已经指向 /api/image-preview/ 的（避免双重包装）
 *   - svg / gif（保持原样：矢量、动画）
 *   - 视频扩展名（rehype-video-embed 会处理）
 */

import { visit } from "unist-util-visit";

// Sharp 不该碰的：保持矢量/动画/视频特性
const SKIP_EXTENSIONS = /\.(svg|gif|mp4|webm|ogv|mov|m4v|avi|mkv)(\?.*)?(#.*)?$/i;

const DEFAULT_OPTIONS = {
	// 默认宽度上限：覆盖 1080p 全宽 + retina 2x。
	// 文章正文列宽通常 600-900px，给 2400px 保留 2-3 倍 retina 余量。
	width: 2400,
	// 默认质量：q=92 是 WebP 的"几乎无损"档，比 PNG/JPG 原图小很多但肉眼几乎看不出差。
	quality: 92,
	format: "webp",
};

export function rehypeImageOptimize(userOptions = {}) {
	const options = { ...DEFAULT_OPTIONS, ...userOptions };

	return (tree) => {
		visit(tree, "element", (node) => {
			if (
				node.tagName !== "img" ||
				!node.properties ||
				typeof node.properties.src !== "string"
			) {
				return;
			}

			const src = node.properties.src;

			// 1) 跳过外链和 data URI
			if (
				src.startsWith("http://") ||
				src.startsWith("https://") ||
				src.startsWith("data:")
			) {
				return;
			}

			// 2) 跳过已经走 image-preview 的，避免双重包装
			if (src.startsWith("/api/image-preview/")) {
				return;
			}

			// 3) 跳过 SVG/GIF/视频等
			if (SKIP_EXTENSIONS.test(src)) {
				return;
			}

			// 4) 仅处理 /uploads/* 路径（其他静态资源走 Astro 自己的优化流水线）
			if (!src.startsWith("/uploads/")) {
				return;
			}

			const params = new URLSearchParams({
				path: src,
				w: String(options.width),
				format: options.format,
				q: String(options.quality),
			});

			node.properties.src = `/api/image-preview/?${params.toString()}`;

			// 没显式 loading 就给个 lazy（文章里的图大多在首屏下面）
			if (!node.properties.loading) {
				node.properties.loading = "lazy";
			}
			if (!node.properties.decoding) {
				node.properties.decoding = "async";
			}
		});
	};
}
