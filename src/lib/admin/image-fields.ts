export interface UploadedAdminImage {
	url: string;
	name?: string;
	size?: number;
}

export function getAdminImagePreviewUrl(
	imagePath: string,
	options: { thumbnail?: boolean } = {},
): string {
	if (!imagePath) {
		return "";
	}

	if (
		imagePath.startsWith("http://") ||
		imagePath.startsWith("https://") ||
		imagePath.startsWith("data:")
	) {
		return imagePath;
	}

	// 默认走缩略图优化（admin 列表里都是 88-96 px 的方块，原图纯浪费）。
	// 调用方需要原图（如全屏预览）时显式传 thumbnail: false。
	const wantThumb = options.thumbnail !== false;

	if (imagePath.startsWith("/")) {
		const base = `/api/image-preview/?path=${encodeURIComponent(imagePath)}`;
		return wantThumb ? `${base}&w=400&format=webp&q=85` : base;
	}

	return `/api/admin/upload-preview/?path=${encodeURIComponent(imagePath)}`;
}

export async function uploadAdminImage(file: File): Promise<UploadedAdminImage> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/api/admin/upload/", {
		method: "POST",
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(payload.error || "Upload failed");
	}

	return payload as UploadedAdminImage;
}
