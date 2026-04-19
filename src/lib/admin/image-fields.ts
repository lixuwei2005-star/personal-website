export interface UploadedAdminImage {
	url: string;
	name?: string;
	size?: number;
}

export function getAdminImagePreviewUrl(imagePath: string): string {
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

	if (imagePath.startsWith("/")) {
		return `/api/image-preview/?path=${encodeURIComponent(imagePath)}`;
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
