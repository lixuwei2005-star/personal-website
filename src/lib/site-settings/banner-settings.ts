import type { SiteConfig } from "../../types/config";

export type WallpaperImageItem = {
	url: string;
	enabled: boolean;
};

export type BannerSettings = {
	src: {
		desktop: WallpaperImageItem[];
		mobile: WallpaperImageItem[];
	};
	position: "top" | "center" | "bottom";
	carousel: {
		enable: boolean;
		interval: number;
	};
	waves: {
		enable: boolean;
		performanceMode: boolean;
		mobileDisable: boolean;
	};
	imageApi: {
		enable: boolean;
		url: string;
	};
	homeText: {
		enable: boolean;
		title: string;
		subtitle: string[];
		typewriter: {
			enable: boolean;
			speed: number;
			deleteSpeed: number;
			pauseTime: number;
		};
	};
	credit: {
		enable: boolean;
		text: string;
		url: string;
	};
	navbar: {
		transparentMode: "semi" | "full" | "semifull";
	};
};

export const DEFAULT_BANNER_SETTINGS: BannerSettings = {
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
		interval: 3,
	},
	waves: {
		enable: true,
		performanceMode: false,
		mobileDisable: false,
	},
	imageApi: {
		enable: false,
		url: "http://domain.com/api_v2.php?format=text&count=4",
	},
	homeText: {
		enable: true,
		title: "わたしの部屋",
		subtitle: [
			"特別なことはないけど、君がいると十分です",
			"今でもあなたは私の光",
			"君ってさ、知らないうちに私の毎日になってたよ",
			"君と話すと、なんか毎日がちょっと楽しくなるんだ",
			"今日はなんでもない日。でも、ちょっとだけいい日",
		],
		typewriter: {
			enable: true,
			speed: 100,
			deleteSpeed: 50,
			pauseTime: 2000,
		},
	},
	credit: {
		enable: false,
		text: "Describe",
		url: "",
	},
	navbar: {
		transparentMode: "semifull",
	},
};

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

function normalizeBannerPosition(
	value: unknown,
	fallback: BannerSettings["position"],
): BannerSettings["position"] {
	return value === "top" || value === "bottom" ? value : value === "center" ? "center" : fallback;
}

function normalizeTransparentMode(
	value: unknown,
	fallback: BannerSettings["navbar"]["transparentMode"],
): BannerSettings["navbar"]["transparentMode"] {
	return value === "semi" || value === "full" || value === "semifull"
		? value
		: fallback;
}

function normalizeInteger(
	value: unknown,
	fallback: number,
	min: number,
): number {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}

	return Math.max(min, Math.round(num));
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

export function cloneBannerSettings(settings: BannerSettings): BannerSettings {
	return {
		src: {
			desktop: settings.src.desktop.map(cloneWallpaperImageItem),
			mobile: settings.src.mobile.map(cloneWallpaperImageItem),
		},
		position: settings.position,
		carousel: { ...settings.carousel },
		waves: { ...settings.waves },
		imageApi: { ...settings.imageApi },
		homeText: {
			enable: settings.homeText.enable,
			title: settings.homeText.title,
			subtitle: [...settings.homeText.subtitle],
			typewriter: { ...settings.homeText.typewriter },
		},
		credit: { ...settings.credit },
		navbar: { ...settings.navbar },
	};
}

export function normalizeBannerSettings(
	value: unknown,
	base: BannerSettings = DEFAULT_BANNER_SETTINGS,
): BannerSettings {
	const fallback = cloneBannerSettings(base);
	const input = asRecord(value);
	const src = asRecord(input.src);
	const carousel = asRecord(input.carousel);
	const waves = asRecord(input.waves);
	const imageApi = asRecord(input.imageApi);
	const homeText = asRecord(input.homeText);
	const typewriter = asRecord(homeText.typewriter);
	const credit = asRecord(input.credit);
	const navbar = asRecord(input.navbar);

	return {
		src: {
			desktop: toWallpaperImageArray(src.desktop, fallback.src.desktop),
			mobile: toWallpaperImageArray(src.mobile, fallback.src.mobile),
		},
		position: normalizeBannerPosition(input.position, fallback.position),
		carousel: {
			enable:
				typeof carousel.enable === "boolean"
					? carousel.enable
					: fallback.carousel.enable,
			interval: normalizeInteger(
				carousel.interval,
				fallback.carousel.interval,
				1,
			),
		},
		waves: {
			enable:
				typeof waves.enable === "boolean" ? waves.enable : fallback.waves.enable,
			performanceMode:
				typeof waves.performanceMode === "boolean"
					? waves.performanceMode
					: fallback.waves.performanceMode,
			mobileDisable:
				typeof waves.mobileDisable === "boolean"
					? waves.mobileDisable
					: fallback.waves.mobileDisable,
		},
		imageApi: {
			enable:
				typeof imageApi.enable === "boolean"
					? imageApi.enable
					: fallback.imageApi.enable,
			url:
				typeof imageApi.url === "string"
					? imageApi.url.trim()
					: fallback.imageApi.url,
		},
		homeText: {
			enable:
				typeof homeText.enable === "boolean"
					? homeText.enable
					: fallback.homeText.enable,
			title:
				typeof homeText.title === "string"
					? homeText.title
					: fallback.homeText.title,
			subtitle:
				typeof homeText.subtitle === "string" || Array.isArray(homeText.subtitle)
					? (typeof homeText.subtitle === "string"
							? homeText.subtitle
									.split(/\r?\n/)
									.map((item) => item.trim())
									.filter(Boolean)
							: homeText.subtitle
									.map((item) => (typeof item === "string" ? item.trim() : ""))
									.filter(Boolean))
					: [...fallback.homeText.subtitle],
			typewriter: {
				enable:
					typeof typewriter.enable === "boolean"
						? typewriter.enable
						: fallback.homeText.typewriter.enable,
				speed: normalizeInteger(
					typewriter.speed,
					fallback.homeText.typewriter.speed,
					0,
				),
				deleteSpeed: normalizeInteger(
					typewriter.deleteSpeed,
					fallback.homeText.typewriter.deleteSpeed,
					0,
				),
				pauseTime: normalizeInteger(
					typewriter.pauseTime,
					fallback.homeText.typewriter.pauseTime,
					0,
				),
			},
		},
		credit: {
			enable:
				typeof credit.enable === "boolean"
					? credit.enable
					: fallback.credit.enable,
			text:
				typeof credit.text === "string" ? credit.text : fallback.credit.text,
			url:
				typeof credit.url === "string" ? credit.url.trim() : fallback.credit.url,
		},
		navbar: {
			transparentMode: normalizeTransparentMode(
				navbar.transparentMode,
				fallback.navbar.transparentMode,
			),
		},
	};
}

export function parseBannerSettingsJson(
	value: string | undefined,
	base: BannerSettings = DEFAULT_BANNER_SETTINGS,
): BannerSettings {
	if (!value || typeof value !== "string") {
		return cloneBannerSettings(base);
	}

	try {
		return normalizeBannerSettings(JSON.parse(value), base);
	} catch {
		return cloneBannerSettings(base);
	}
}

export function bannerSettingsToSiteConfigBanner(
	settings: BannerSettings,
): SiteConfig["banner"] {
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
		waves: { ...settings.waves },
		imageApi: { ...settings.imageApi },
		homeText: {
			enable: settings.homeText.enable,
			title: settings.homeText.title,
			subtitle: [...settings.homeText.subtitle],
			typewriter: { ...settings.homeText.typewriter },
		},
		credit: { ...settings.credit },
		navbar: { ...settings.navbar },
	};
}
