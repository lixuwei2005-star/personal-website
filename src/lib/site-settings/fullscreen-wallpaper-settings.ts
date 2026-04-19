import type { FullscreenWallpaperConfig } from "../../types/config";

export type WallpaperImageItem = {
	url: string;
	enabled: boolean;
};

export type FullscreenWallpaperSettings = {
	src: {
		desktop: WallpaperImageItem[];
		mobile: WallpaperImageItem[];
	};
	position: "top" | "center" | "bottom";
	carousel: {
		enable: boolean;
		interval: number;
	};
	zIndex: number;
	opacity: number;
	blur: number;
};

export const DEFAULT_FULLSCREEN_WALLPAPER_SETTINGS: FullscreenWallpaperSettings = {
	src: {
		desktop: [
			{ url: "/assets/desktop-banner/1.webp", enabled: true },
			{ url: "/assets/desktop-banner/2.webp", enabled: true },
			{ url: "/assets/desktop-banner/3.webp", enabled: true },
			{ url: "/assets/desktop-banner/4.webp", enabled: true },
		],
		mobile: [
			{ url: "/assets/mobile-banner/1.webp", enabled: true },
			{ url: "/assets/mobile-banner/2.webp", enabled: true },
			{ url: "/assets/mobile-banner/3.webp", enabled: true },
			{ url: "/assets/mobile-banner/4.webp", enabled: true },
		],
	},
	position: "center",
	carousel: {
		enable: true,
		interval: 5,
	},
	zIndex: -1,
	opacity: 0.8,
	blur: 1,
};

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function cloneWallpaperImageItem(
	value: WallpaperImageItem,
): WallpaperImageItem {
	return {
		url: value.url,
		enabled: value.enabled,
	};
}

function toWallpaperImageArray(
	value: unknown,
	fallback: WallpaperImageItem[],
): WallpaperImageItem[] {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? [{ url: trimmed, enabled: true }] : [];
	}

	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (typeof item === "string") {
					const trimmed = item.trim();
					return trimmed ? { url: trimmed, enabled: true } : null;
				}

				if (item && typeof item === "object" && !Array.isArray(item)) {
					const record = item as Record<string, unknown>;
					const rawUrl =
						typeof record.url === "string"
							? record.url
							: typeof record.path === "string"
								? record.path
								: typeof record.src === "string"
									? record.src
									: "";
					const trimmed = rawUrl.trim();
					if (!trimmed) {
						return null;
					}

					return {
						url: trimmed,
						enabled:
							typeof record.enabled === "boolean" ? record.enabled : true,
					};
				}

				return null;
			})
			.filter((item): item is WallpaperImageItem => item !== null);
	}

	return fallback.map(cloneWallpaperImageItem);
}

function wallpaperImagesToEnabledStrings(
	value: WallpaperImageItem[],
): string[] {
	return value
		.filter((item) => item.enabled && item.url.trim())
		.map((item) => item.url.trim());
}

function normalizeInteger(value: unknown, fallback: number): number {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}

	return Math.round(num);
}

function normalizeNonNegativeNumber(value: unknown, fallback: number): number {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}

	return Math.max(0, num);
}

function normalizeOpacity(value: unknown, fallback: number): number {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}

	return Math.min(1, Math.max(0, num));
}

export function cloneFullscreenWallpaperSettings(
	settings: FullscreenWallpaperSettings,
): FullscreenWallpaperSettings {
	return {
		src: {
			desktop: settings.src.desktop.map(cloneWallpaperImageItem),
			mobile: settings.src.mobile.map(cloneWallpaperImageItem),
		},
		position: settings.position,
		carousel: { ...settings.carousel },
		zIndex: settings.zIndex,
		opacity: settings.opacity,
		blur: settings.blur,
	};
}

export function normalizeFullscreenWallpaperSettings(
	value: unknown,
	base: FullscreenWallpaperSettings = DEFAULT_FULLSCREEN_WALLPAPER_SETTINGS,
): FullscreenWallpaperSettings {
	const fallback = cloneFullscreenWallpaperSettings(base);
	const input = asRecord(value);
	const src = asRecord(input.src);
	const carousel = asRecord(input.carousel);

	return {
		src: {
			desktop: toWallpaperImageArray(src.desktop, fallback.src.desktop),
			mobile: toWallpaperImageArray(src.mobile, fallback.src.mobile),
		},
		position:
			input.position === "top" ||
			input.position === "bottom" ||
			input.position === "center"
				? input.position
				: fallback.position,
		carousel: {
			enable:
				typeof carousel.enable === "boolean"
					? carousel.enable
					: fallback.carousel.enable,
			interval: Math.max(
				1,
				normalizeInteger(carousel.interval, fallback.carousel.interval),
			),
		},
		zIndex: normalizeInteger(input.zIndex, fallback.zIndex),
		opacity: normalizeOpacity(input.opacity, fallback.opacity),
		blur: normalizeNonNegativeNumber(input.blur, fallback.blur),
	};
}

export function parseFullscreenWallpaperSettingsJson(
	value: string | undefined,
	base: FullscreenWallpaperSettings = DEFAULT_FULLSCREEN_WALLPAPER_SETTINGS,
): FullscreenWallpaperSettings {
	if (!value || typeof value !== "string") {
		return cloneFullscreenWallpaperSettings(base);
	}

	try {
		return normalizeFullscreenWallpaperSettings(JSON.parse(value), base);
	} catch {
		return cloneFullscreenWallpaperSettings(base);
	}
}

export function fullscreenWallpaperSettingsToConfig(
	settings: FullscreenWallpaperSettings,
): FullscreenWallpaperConfig {
	const desktopImages = wallpaperImagesToEnabledStrings(settings.src.desktop);
	const mobileImages = wallpaperImagesToEnabledStrings(settings.src.mobile);
	const normalizedDesktopImages =
		desktopImages.length > 0 ? desktopImages : [...mobileImages];
	const normalizedMobileImages =
		mobileImages.length > 0 ? mobileImages : [...normalizedDesktopImages];

	return {
		src: {
			desktop: normalizedDesktopImages,
			mobile: normalizedMobileImages,
		},
		position: settings.position,
		carousel: { ...settings.carousel },
		zIndex: settings.zIndex,
		opacity: settings.opacity,
		blur: settings.blur,
	};
}
