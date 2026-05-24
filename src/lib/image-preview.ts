export interface ImagePreviewOptions {
	w?: number;
	q?: number;
	format?: "webp" | "jpeg" | "avif" | "png";
}

export function toImagePreviewUrl(
	src: string | undefined | null,
	opts: ImagePreviewOptions = {},
): string {
	if (!src) {
		return "";
	}

	if (
		src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:") ||
		src.startsWith("/api/image-preview/")
	) {
		return src;
	}

	if (!src.startsWith("/")) {
		return src;
	}

	const params = new URLSearchParams({ path: src });
	if (opts.w) params.set("w", String(opts.w));
	params.set("format", opts.format ?? "webp");
	params.set("q", String(opts.q ?? 85));
	return `/api/image-preview/?${params.toString()}`;
}
