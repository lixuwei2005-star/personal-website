import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");
const GENERATED_SITE_PATH = path.join(ROOT, "src", "generated", "site.ts");
function toWallpaperImage(url) {
	return {
		url,
		enabled: true,
	};
}

const DEFAULT_SITE_SETTINGS = {
	title: "Mizuki",
	subtitle: "One demo website",
	siteStartDate: "2025-01-01",
	themeColorHue: 240,
	themeColorFixed: false,
	featurePages: {
		anime: true,
		diary: true,
		friends: true,
		projects: true,
		skills: true,
		timeline: true,
		albums: true,
		devices: true,
	},
	banner: {
		src: {
			desktop: [
				toWallpaperImage("/assets/desktop-banner/1.webp"),
				toWallpaperImage("/assets/desktop-banner/2.webp"),
				toWallpaperImage("/assets/desktop-banner/3.webp"),
				toWallpaperImage("/assets/desktop-banner/4.webp"),
			],
			mobile: [
				toWallpaperImage("/assets/mobile-banner/1.webp"),
				toWallpaperImage("/assets/mobile-banner/2.webp"),
				toWallpaperImage("/assets/mobile-banner/3.webp"),
				toWallpaperImage("/assets/mobile-banner/4.webp"),
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
	},
	fullscreenWallpaper: {
		src: {
			desktop: [
				toWallpaperImage("/assets/desktop-banner/1.webp"),
				toWallpaperImage("/assets/desktop-banner/2.webp"),
				toWallpaperImage("/assets/desktop-banner/3.webp"),
				toWallpaperImage("/assets/desktop-banner/4.webp"),
			],
			mobile: [
				toWallpaperImage("/assets/mobile-banner/1.webp"),
				toWallpaperImage("/assets/mobile-banner/2.webp"),
				toWallpaperImage("/assets/mobile-banner/3.webp"),
				toWallpaperImage("/assets/mobile-banner/4.webp"),
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
	},
	wallpaperMode: {
		defaultMode: "banner",
		showModeSwitchOnMobile: "desktop",
	},
	postListLayout: {
		defaultMode: "list",
		allowSwitch: true,
	},
	tagStyle: {
		useNewStyle: false,
	},
	toc: {
		enable: true,
		mobileTop: true,
		desktopSidebar: true,
		floating: true,
		depth: 2,
		useJapaneseBadge: true,
	},
	pageScaling: {
		enable: true,
		targetWidth: 2000,
	},
	navbarTitle: {
		mode: "text-icon",
		text: "MizukiUI",
		icon: "assets/home/home.webp",
		logo: "assets/home/default-logo.webp",
	},
	font: {
		asciiFont: {
			fontFamily: "ZenMaruGothic-Medium",
			fontWeight: "400",
			localFonts: ["ZenMaruGothic-Medium.ttf"],
			enableCompress: true,
		},
		cjkFont: {
			fontFamily: "萝莉体 第二版",
			fontWeight: "500",
			localFonts: ["loli.ttf"],
			enableCompress: true,
		},
	},
	music: {
		enable: true,
		showSidebarWidget: true,
		showFloatingPlayer: true,
		floatingEntryMode: "fab",
		showPlaylistPanel: true,
		defaultShuffle: false,
		defaultVolume: 0.7,
		defaultExpanded: false,
		localPlaylist: [
			{
				id: 1,
				title: "Sample Song 1",
				artist: "Dazbee",
				cover: "assets/music/cover/dazbee.webp",
				url: "assets/music/url/dazbee.mp3",
				duration: 0,
			},
			{
				id: 2,
				title: "Sample Song 2",
				artist: "Kaya",
				cover: "assets/music/cover/hitori.webp",
				url: "assets/music/url/hitori.mp3",
				duration: 240,
			},
			{
				id: 3,
				title: "Sample Song 3",
				artist: "Sample Artist",
				cover: "assets/music/cover/xryx.webp",
				url: "assets/music/url/xryx.mp3",
				duration: 180,
			},
			{
				id: 4,
				title: "Sample Song 4",
				artist: "22/7",
				cover: "assets/music/cover/cl.webp",
				url: "assets/music/url/cl.mp3",
				duration: 200,
			},
		],
	},
	showLastModified: true,
};

function writeSiteOverrideFile(settings) {
	const bannerConfig = bannerSettingsToSiteConfigBanner(settings.banner);
	const fullscreenWallpaperConfig = fullscreenWallpaperSettingsToConfig(
		settings.fullscreenWallpaper,
	);
	const fileContent = `import type { FullscreenWallpaperConfig, MusicPlayerConfig, SiteConfig } from "../types/config";

export const siteOverrideConfig: Partial<SiteConfig> = {
\ttitle: ${JSON.stringify(settings.title)},
\tsubtitle: ${JSON.stringify(settings.subtitle)},
\tsiteStartDate: ${JSON.stringify(settings.siteStartDate)},
\tthemeColor: {
\t\thue: ${settings.themeColorHue},
\t\tfixed: ${settings.themeColorFixed ? "true" : "false"},
\t},
\tfeaturePages: {
\t\tanime: ${settings.featurePages.anime ? "true" : "false"},
\t\tdiary: ${settings.featurePages.diary ? "true" : "false"},
\t\tfriends: ${settings.featurePages.friends ? "true" : "false"},
\t\tprojects: ${settings.featurePages.projects ? "true" : "false"},
\t\tskills: ${settings.featurePages.skills ? "true" : "false"},
\t\ttimeline: ${settings.featurePages.timeline ? "true" : "false"},
\t\talbums: ${settings.featurePages.albums ? "true" : "false"},
\t\tdevices: ${settings.featurePages.devices ? "true" : "false"},
\t},
\tbanner: ${JSON.stringify(bannerConfig, null, 2).replace(/\n/g, "\n\t")},
\twallpaperMode: {
\t\tdefaultMode: ${JSON.stringify(settings.wallpaperMode.defaultMode)},
\t\tshowModeSwitchOnMobile: ${JSON.stringify(settings.wallpaperMode.showModeSwitchOnMobile)},
\t},
\tpostListLayout: {
\t\tdefaultMode: ${JSON.stringify(settings.postListLayout.defaultMode)},
\t\tallowSwitch: ${settings.postListLayout.allowSwitch ? "true" : "false"},
\t},
\ttoc: {
\t\tenable: ${settings.toc.enable ? "true" : "false"},
\t\tmobileTop: ${settings.toc.mobileTop ? "true" : "false"},
\t\tdesktopSidebar: ${settings.toc.desktopSidebar ? "true" : "false"},
\t\tfloating: ${settings.toc.floating ? "true" : "false"},
\t\tdepth: ${settings.toc.depth},
\t\tuseJapaneseBadge: ${settings.toc.useJapaneseBadge ? "true" : "false"},
\t},
\tfont: {
\t\tasciiFont: {
\t\t\tfontFamily: ${JSON.stringify(settings.font.asciiFont.fontFamily)},
\t\t\tfontWeight: ${JSON.stringify(settings.font.asciiFont.fontWeight)},
\t\t\tlocalFonts: ${JSON.stringify(settings.font.asciiFont.localFonts)},
\t\t\tenableCompress: ${settings.font.asciiFont.enableCompress ? "true" : "false"},
\t\t},
\t\tcjkFont: {
\t\t\tfontFamily: ${JSON.stringify(settings.font.cjkFont.fontFamily)},
\t\t\tfontWeight: ${JSON.stringify(settings.font.cjkFont.fontWeight)},
\t\t\tlocalFonts: ${JSON.stringify(settings.font.cjkFont.localFonts)},
\t\t\tenableCompress: ${settings.font.cjkFont.enableCompress ? "true" : "false"},
\t\t},
\t},
\ttagStyle: {
\t\tuseNewStyle: ${settings.tagStyle.useNewStyle ? "true" : "false"},
\t},
\tpageScaling: {
\t\tenable: ${settings.pageScaling.enable ? "true" : "false"},
\t\ttargetWidth: ${settings.pageScaling.targetWidth},
\t},
\tnavbarTitle: {
\t\tmode: ${JSON.stringify(settings.navbarTitle.mode)},
\t\ttext: ${JSON.stringify(settings.navbarTitle.text)},
\t\ticon: ${JSON.stringify(settings.navbarTitle.icon)},
\t\tlogo: ${JSON.stringify(settings.navbarTitle.logo)},
\t},
\tshowLastModified: ${settings.showLastModified ? "true" : "false"},
};

export const musicOverrideConfig: Partial<MusicPlayerConfig> & {
\tshowSidebarWidget?: boolean;
\tshowPlaylistPanel?: boolean;
\tdefaultShuffle?: boolean;
\tdefaultVolume?: number;
\tdefaultExpanded?: boolean;
\tlocalPlaylist?: Array<{
\t\tid: number;
\t\ttitle: string;
\t\tartist: string;
\t\tcover: string;
\t\turl: string;
\t\tduration: number;
\t}>;
} = ${JSON.stringify(settings.music, null, 2).replace(/\n/g, "\n\t")};

export const fullscreenWallpaperOverrideConfig: Partial<FullscreenWallpaperConfig> = ${JSON.stringify(fullscreenWallpaperConfig, null, 2).replace(/\n/g, "\n\t")};
`;

	mkdirSync(path.dirname(GENERATED_SITE_PATH), { recursive: true });
	writeFileSync(GENERATED_SITE_PATH, fileContent, "utf-8");
}

function cloneWallpaperImageItem(image) {
	return {
		url: image.url,
		enabled: image.enabled,
	};
}

function cloneBannerSettings(banner) {
	return {
		src: {
			desktop: banner.src.desktop.map(cloneWallpaperImageItem),
			mobile: banner.src.mobile.map(cloneWallpaperImageItem),
		},
		position: banner.position,
		carousel: { ...banner.carousel },
		waves: { ...banner.waves },
		imageApi: { ...banner.imageApi },
		homeText: {
			enable: banner.homeText.enable,
			title: banner.homeText.title,
			subtitle: [...banner.homeText.subtitle],
			typewriter: { ...banner.homeText.typewriter },
		},
		credit: { ...banner.credit },
		navbar: { ...banner.navbar },
	};
}

function cloneFullscreenWallpaperSettings(config) {
	return {
		src: {
			desktop: config.src.desktop.map(cloneWallpaperImageItem),
			mobile: config.src.mobile.map(cloneWallpaperImageItem),
		},
		position: config.position,
		carousel: { ...config.carousel },
		zIndex: config.zIndex,
		opacity: config.opacity,
		blur: config.blur,
	};
}

function asObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toWallpaperImageArray(value, fallback) {
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
					const rawUrl =
						typeof item.url === "string"
							? item.url
							: typeof item.path === "string"
								? item.path
								: typeof item.src === "string"
									? item.src
									: "";
					const trimmed = rawUrl.trim();
					if (!trimmed) {
						return null;
					}

					return {
						url: trimmed,
						enabled: typeof item.enabled === "boolean" ? item.enabled : true,
					};
				}

				return null;
			})
			.filter(Boolean);
	}

	return fallback.map(cloneWallpaperImageItem);
}

function wallpaperImagesToEnabledStrings(images) {
	return images
		.filter((image) => image.enabled && image.url.trim())
		.map((image) => image.url.trim());
}

function toStringArray(value, fallback) {
	if (typeof value === "string") {
		return value
			.split(/\r?\n/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	if (Array.isArray(value)) {
		return value
			.map((item) => (typeof item === "string" ? item.trim() : ""))
			.filter(Boolean);
	}

	return [...fallback];
}

function normalizeInteger(value, fallback, min) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}
	return Math.max(min, Math.round(num));
}

function normalizeFloat(value, fallback, min, max = Number.POSITIVE_INFINITY) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, num));
}

function normalizeBannerSettings(value, base = DEFAULT_SITE_SETTINGS.banner) {
	const fallback = cloneBannerSettings(base);
	const input = asObject(value);
	const src = asObject(input.src);
	const carousel = asObject(input.carousel);
	const waves = asObject(input.waves);
	const imageApi = asObject(input.imageApi);
	const homeText = asObject(input.homeText);
	const typewriter = asObject(homeText.typewriter);
	const credit = asObject(input.credit);
	const navbar = asObject(input.navbar);

	return {
		src: {
			desktop: toWallpaperImageArray(src.desktop, fallback.src.desktop),
			mobile: toWallpaperImageArray(src.mobile, fallback.src.mobile),
		},
		position:
			input.position === "top" || input.position === "bottom" || input.position === "center"
				? input.position
				: fallback.position,
		carousel: {
			enable:
				typeof carousel.enable === "boolean"
					? carousel.enable
					: fallback.carousel.enable,
			interval: normalizeInteger(carousel.interval, fallback.carousel.interval, 1),
		},
		waves: {
			enable: typeof waves.enable === "boolean" ? waves.enable : fallback.waves.enable,
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
			url: typeof imageApi.url === "string" ? imageApi.url.trim() : fallback.imageApi.url,
		},
		homeText: {
			enable:
				typeof homeText.enable === "boolean"
					? homeText.enable
					: fallback.homeText.enable,
			title: typeof homeText.title === "string" ? homeText.title : fallback.homeText.title,
			subtitle: toStringArray(homeText.subtitle, fallback.homeText.subtitle),
			typewriter: {
				enable:
					typeof typewriter.enable === "boolean"
						? typewriter.enable
						: fallback.homeText.typewriter.enable,
				speed: normalizeInteger(typewriter.speed, fallback.homeText.typewriter.speed, 0),
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
			text: typeof credit.text === "string" ? credit.text : fallback.credit.text,
			url: typeof credit.url === "string" ? credit.url.trim() : fallback.credit.url,
		},
		navbar: {
			transparentMode:
				navbar.transparentMode === "semi" ||
				navbar.transparentMode === "full" ||
				navbar.transparentMode === "semifull"
					? navbar.transparentMode
					: fallback.navbar.transparentMode,
		},
	};
}

function parseBannerSettingsJson(value) {
	if (!value || typeof value !== "string") {
		return cloneBannerSettings(DEFAULT_SITE_SETTINGS.banner);
	}

	try {
		return normalizeBannerSettings(JSON.parse(value), DEFAULT_SITE_SETTINGS.banner);
	} catch {
		return cloneBannerSettings(DEFAULT_SITE_SETTINGS.banner);
	}
}

function normalizeFullscreenWallpaperSettings(
	value,
	base = DEFAULT_SITE_SETTINGS.fullscreenWallpaper,
) {
	const fallback = cloneFullscreenWallpaperSettings(base);
	const input = asObject(value);
	const src = asObject(input.src);
	const carousel = asObject(input.carousel);

	return {
		src: {
			desktop: toWallpaperImageArray(src.desktop, fallback.src.desktop),
			mobile: toWallpaperImageArray(src.mobile, fallback.src.mobile),
		},
		position:
			input.position === "top" || input.position === "bottom" || input.position === "center"
				? input.position
				: fallback.position,
		carousel: {
			enable:
				typeof carousel.enable === "boolean"
					? carousel.enable
					: fallback.carousel.enable,
			interval: normalizeInteger(carousel.interval, fallback.carousel.interval, 1),
		},
		zIndex: normalizeInteger(input.zIndex, fallback.zIndex, Number.NEGATIVE_INFINITY),
		opacity: normalizeFloat(input.opacity, fallback.opacity, 0, 1),
		blur: normalizeFloat(input.blur, fallback.blur, 0),
	};
}

function parseFullscreenWallpaperSettingsJson(value) {
	if (!value || typeof value !== "string") {
		return cloneFullscreenWallpaperSettings(DEFAULT_SITE_SETTINGS.fullscreenWallpaper);
	}

	try {
		return normalizeFullscreenWallpaperSettings(
			JSON.parse(value),
			DEFAULT_SITE_SETTINGS.fullscreenWallpaper,
		);
	} catch {
		return cloneFullscreenWallpaperSettings(DEFAULT_SITE_SETTINGS.fullscreenWallpaper);
	}
}

function bannerSettingsToSiteConfigBanner(settings) {
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

function fullscreenWallpaperSettingsToConfig(settings) {
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

function cloneMusicSettings(music) {
	return {
		...music,
		localPlaylist: Array.isArray(music.localPlaylist)
			? music.localPlaylist.map((track) => ({ ...track }))
			: [],
	};
}

function parseMusicSettingsJson(value) {
	if (!value || typeof value !== "string") {
		return cloneMusicSettings(DEFAULT_SITE_SETTINGS.music);
	}

	try {
		const parsed = JSON.parse(value);
		const source =
			parsed && typeof parsed === "object" && !Array.isArray(parsed)
				? parsed
				: {};
		const playlist = Array.isArray(source.localPlaylist)
			? source.localPlaylist
					.map((track, index) => {
						if (!track || typeof track !== "object") {
							return null;
						}

						const url =
							typeof track.url === "string" ? track.url.trim() : "";
						if (!url) {
							return null;
						}

						const title =
							typeof track.title === "string" && track.title.trim()
								? track.title.trim()
								: `Track ${index + 1}`;

						return {
							id: index + 1,
							title,
							artist:
								typeof track.artist === "string" && track.artist.trim()
									? track.artist.trim()
									: "Unknown Artist",
							cover:
								typeof track.cover === "string" ? track.cover.trim() : "",
							url,
							duration: Number.isFinite(track.duration)
								? Math.max(0, Math.round(track.duration))
								: 0,
						};
					})
					.filter(Boolean)
			: [];

		return {
			enable:
				typeof source.enable === "boolean"
					? source.enable
					: DEFAULT_SITE_SETTINGS.music.enable,
			showSidebarWidget:
				typeof source.showSidebarWidget === "boolean"
					? source.showSidebarWidget
					: DEFAULT_SITE_SETTINGS.music.showSidebarWidget,
			showFloatingPlayer:
				typeof source.showFloatingPlayer === "boolean"
					? source.showFloatingPlayer
					: DEFAULT_SITE_SETTINGS.music.showFloatingPlayer,
			floatingEntryMode:
				source.floatingEntryMode === "default" ||
				source.floatingEntryMode === "fab"
					? source.floatingEntryMode
					: DEFAULT_SITE_SETTINGS.music.floatingEntryMode,
			showPlaylistPanel:
				typeof source.showPlaylistPanel === "boolean"
					? source.showPlaylistPanel
					: DEFAULT_SITE_SETTINGS.music.showPlaylistPanel,
			defaultShuffle:
				typeof source.defaultShuffle === "boolean"
					? source.defaultShuffle
					: DEFAULT_SITE_SETTINGS.music.defaultShuffle,
			defaultVolume: Number.isFinite(source.defaultVolume)
				? Math.max(0, Math.min(1, source.defaultVolume))
				: DEFAULT_SITE_SETTINGS.music.defaultVolume,
			defaultExpanded:
				typeof source.defaultExpanded === "boolean"
					? source.defaultExpanded
					: DEFAULT_SITE_SETTINGS.music.defaultExpanded,
			localPlaylist: playlist,
		};
	} catch {
		return cloneMusicSettings(DEFAULT_SITE_SETTINGS.music);
	}
}

function writeEmptyOverrideFile() {
	mkdirSync(path.dirname(GENERATED_SITE_PATH), { recursive: true });
	writeFileSync(
		GENERATED_SITE_PATH,
		'import type { FullscreenWallpaperConfig, MusicPlayerConfig, SiteConfig } from "../types/config";\n\nexport const siteOverrideConfig: Partial<SiteConfig> = {};\nexport const musicOverrideConfig: Partial<MusicPlayerConfig> & {\n\tshowSidebarWidget?: boolean;\n\tshowPlaylistPanel?: boolean;\n\tdefaultShuffle?: boolean;\n\tdefaultVolume?: number;\n\tdefaultExpanded?: boolean;\n\tlocalPlaylist?: Array<{\n\t\tid: number;\n\t\ttitle: string;\n\t\tartist: string;\n\t\tcover: string;\n\t\turl: string;\n\t\tduration: number;\n\t}>;\n} = {};\nexport const fullscreenWallpaperOverrideConfig: Partial<FullscreenWallpaperConfig> = {};\n',
		"utf-8",
	);
}

if (!existsSync(DB_PATH)) {
	writeEmptyOverrideFile();
	console.log(`[sync-db-site-settings] Database not found, wrote empty override: ${DB_PATH}`);
	process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });
const settingsTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'site_settings'")
	.get();

if (!settingsTable) {
	db.close();
	writeEmptyOverrideFile();
	console.log("[sync-db-site-settings] Site settings table not found, wrote empty override.");
	process.exit(0);
}

const columns = db.prepare("PRAGMA table_info(site_settings)").all();
const columnNames = new Set(columns.map((column) => column.name));
const selectParts = [
	columnNames.has("title")
		? "title"
		: `'${DEFAULT_SITE_SETTINGS.title}' AS title`,
	columnNames.has("subtitle")
		? "subtitle"
		: `'${DEFAULT_SITE_SETTINGS.subtitle}' AS subtitle`,
	columnNames.has("site_start_date")
		? "site_start_date"
		: `'${DEFAULT_SITE_SETTINGS.siteStartDate}' AS site_start_date`,
	columnNames.has("theme_color_hue")
		? "theme_color_hue"
		: `${DEFAULT_SITE_SETTINGS.themeColorHue} AS theme_color_hue`,
	columnNames.has("theme_color_fixed")
		? "theme_color_fixed"
		: `${DEFAULT_SITE_SETTINGS.themeColorFixed ? 1 : 0} AS theme_color_fixed`,
	columnNames.has("feature_anime")
		? "feature_anime"
		: `${DEFAULT_SITE_SETTINGS.featurePages.anime ? 1 : 0} AS feature_anime`,
	columnNames.has("feature_diary")
		? "feature_diary"
		: `${DEFAULT_SITE_SETTINGS.featurePages.diary ? 1 : 0} AS feature_diary`,
	columnNames.has("feature_friends")
		? "feature_friends"
		: `${DEFAULT_SITE_SETTINGS.featurePages.friends ? 1 : 0} AS feature_friends`,
	columnNames.has("feature_projects")
		? "feature_projects"
		: `${DEFAULT_SITE_SETTINGS.featurePages.projects ? 1 : 0} AS feature_projects`,
	columnNames.has("feature_skills")
		? "feature_skills"
		: `${DEFAULT_SITE_SETTINGS.featurePages.skills ? 1 : 0} AS feature_skills`,
	columnNames.has("feature_timeline")
		? "feature_timeline"
		: `${DEFAULT_SITE_SETTINGS.featurePages.timeline ? 1 : 0} AS feature_timeline`,
	columnNames.has("feature_albums")
		? "feature_albums"
		: `${DEFAULT_SITE_SETTINGS.featurePages.albums ? 1 : 0} AS feature_albums`,
	columnNames.has("feature_devices")
		? "feature_devices"
		: `${DEFAULT_SITE_SETTINGS.featurePages.devices ? 1 : 0} AS feature_devices`,
	columnNames.has("banner_settings_json")
		? "banner_settings_json"
		: `'{}' AS banner_settings_json`,
	columnNames.has("fullscreen_wallpaper_settings_json")
		? "fullscreen_wallpaper_settings_json"
		: `'{}' AS fullscreen_wallpaper_settings_json`,
	columnNames.has("wallpaper_default_mode")
		? "wallpaper_default_mode"
		: `'${DEFAULT_SITE_SETTINGS.wallpaperMode.defaultMode}' AS wallpaper_default_mode`,
	columnNames.has("wallpaper_mode_switch_display")
		? "wallpaper_mode_switch_display"
		: `'${DEFAULT_SITE_SETTINGS.wallpaperMode.showModeSwitchOnMobile}' AS wallpaper_mode_switch_display`,
	columnNames.has("post_list_default_mode")
		? "post_list_default_mode"
		: `'${DEFAULT_SITE_SETTINGS.postListLayout.defaultMode}' AS post_list_default_mode`,
	columnNames.has("post_list_allow_switch")
		? "post_list_allow_switch"
		: `${DEFAULT_SITE_SETTINGS.postListLayout.allowSwitch ? 1 : 0} AS post_list_allow_switch`,
	columnNames.has("tag_style_use_new_style")
		? "tag_style_use_new_style"
		: `${DEFAULT_SITE_SETTINGS.tagStyle.useNewStyle ? 1 : 0} AS tag_style_use_new_style`,
	columnNames.has("toc_enable")
		? "toc_enable"
		: `${DEFAULT_SITE_SETTINGS.toc.enable ? 1 : 0} AS toc_enable`,
	columnNames.has("toc_mobile_top")
		? "toc_mobile_top"
		: `${DEFAULT_SITE_SETTINGS.toc.mobileTop ? 1 : 0} AS toc_mobile_top`,
	columnNames.has("toc_desktop_sidebar")
		? "toc_desktop_sidebar"
		: `${DEFAULT_SITE_SETTINGS.toc.desktopSidebar ? 1 : 0} AS toc_desktop_sidebar`,
	columnNames.has("toc_floating")
		? "toc_floating"
		: `${DEFAULT_SITE_SETTINGS.toc.floating ? 1 : 0} AS toc_floating`,
	columnNames.has("toc_depth")
		? "toc_depth"
		: `${DEFAULT_SITE_SETTINGS.toc.depth} AS toc_depth`,
	columnNames.has("toc_use_japanese_badge")
		? "toc_use_japanese_badge"
		: `${DEFAULT_SITE_SETTINGS.toc.useJapaneseBadge ? 1 : 0} AS toc_use_japanese_badge`,
	columnNames.has("page_scaling_enable")
		? "page_scaling_enable"
		: `${DEFAULT_SITE_SETTINGS.pageScaling.enable ? 1 : 0} AS page_scaling_enable`,
	columnNames.has("page_scaling_target_width")
		? "page_scaling_target_width"
		: `${DEFAULT_SITE_SETTINGS.pageScaling.targetWidth} AS page_scaling_target_width`,
	columnNames.has("navbar_title_mode")
		? "navbar_title_mode"
		: `'${DEFAULT_SITE_SETTINGS.navbarTitle.mode}' AS navbar_title_mode`,
	columnNames.has("navbar_title_text")
		? "navbar_title_text"
		: `'${DEFAULT_SITE_SETTINGS.navbarTitle.text}' AS navbar_title_text`,
	columnNames.has("navbar_title_icon")
		? "navbar_title_icon"
		: `'${DEFAULT_SITE_SETTINGS.navbarTitle.icon}' AS navbar_title_icon`,
	columnNames.has("navbar_title_logo")
		? "navbar_title_logo"
		: `'${DEFAULT_SITE_SETTINGS.navbarTitle.logo}' AS navbar_title_logo`,
	columnNames.has("font_ascii_file")
		? "font_ascii_file"
		: `'${DEFAULT_SITE_SETTINGS.font.asciiFont.localFonts[0]}' AS font_ascii_file`,
	columnNames.has("font_ascii_family")
		? "font_ascii_family"
		: `'${DEFAULT_SITE_SETTINGS.font.asciiFont.fontFamily}' AS font_ascii_family`,
	columnNames.has("font_ascii_weight")
		? "font_ascii_weight"
		: `'${DEFAULT_SITE_SETTINGS.font.asciiFont.fontWeight}' AS font_ascii_weight`,
	columnNames.has("font_ascii_enable_compress")
		? "font_ascii_enable_compress"
		: `${DEFAULT_SITE_SETTINGS.font.asciiFont.enableCompress ? 1 : 0} AS font_ascii_enable_compress`,
	columnNames.has("font_cjk_file")
		? "font_cjk_file"
		: `'${DEFAULT_SITE_SETTINGS.font.cjkFont.localFonts[0]}' AS font_cjk_file`,
	columnNames.has("font_cjk_family")
		? "font_cjk_family"
		: `'${DEFAULT_SITE_SETTINGS.font.cjkFont.fontFamily}' AS font_cjk_family`,
	columnNames.has("font_cjk_weight")
		? "font_cjk_weight"
		: `'${DEFAULT_SITE_SETTINGS.font.cjkFont.fontWeight}' AS font_cjk_weight`,
	columnNames.has("font_cjk_enable_compress")
		? "font_cjk_enable_compress"
		: `${DEFAULT_SITE_SETTINGS.font.cjkFont.enableCompress ? 1 : 0} AS font_cjk_enable_compress`,
	columnNames.has("show_last_modified")
		? "show_last_modified"
		: `${DEFAULT_SITE_SETTINGS.showLastModified ? 1 : 0} AS show_last_modified`,
	columnNames.has("music_settings_json")
		? "music_settings_json"
		: `'{}' AS music_settings_json`,
];

const row = db
	.prepare(`SELECT ${selectParts.join(", ")} FROM site_settings WHERE id = 1`)
	.get();

db.close();

if (!row) {
	writeEmptyOverrideFile();
	console.log("[sync-db-site-settings] Site settings row not found, wrote empty override.");
	process.exit(0);
}

writeSiteOverrideFile({
	title: typeof row.title === "string" ? row.title : DEFAULT_SITE_SETTINGS.title,
	subtitle: typeof row.subtitle === "string" ? row.subtitle : DEFAULT_SITE_SETTINGS.subtitle,
	siteStartDate: row.site_start_date || DEFAULT_SITE_SETTINGS.siteStartDate,
	themeColorHue: Number.isFinite(row.theme_color_hue) ? row.theme_color_hue : DEFAULT_SITE_SETTINGS.themeColorHue,
	themeColorFixed: row.theme_color_fixed === 1,
	featurePages: {
		anime: row.feature_anime === 1,
		diary: row.feature_diary === 1,
		friends: row.feature_friends === 1,
		projects: row.feature_projects === 1,
		skills: row.feature_skills === 1,
		timeline: row.feature_timeline === 1,
		albums: row.feature_albums === 1,
		devices: row.feature_devices === 1,
	},
	banner: parseBannerSettingsJson(row.banner_settings_json),
	fullscreenWallpaper: parseFullscreenWallpaperSettingsJson(
		row.fullscreen_wallpaper_settings_json,
	),
	wallpaperMode: {
		defaultMode:
			row.wallpaper_default_mode === "fullscreen"
				? "fullscreen"
				: row.wallpaper_default_mode === "none"
					? "none"
					: "banner",
		showModeSwitchOnMobile:
			row.wallpaper_mode_switch_display === "off" ||
			row.wallpaper_mode_switch_display === "mobile" ||
			row.wallpaper_mode_switch_display === "both"
				? row.wallpaper_mode_switch_display
				: "desktop",
	},
	postListLayout: {
		defaultMode: row.post_list_default_mode === "grid" ? "grid" : "list",
		allowSwitch: row.post_list_allow_switch === 1,
	},
	tagStyle: {
		useNewStyle: row.tag_style_use_new_style === 1,
	},
	toc: {
		enable: row.toc_enable === 1,
		mobileTop: row.toc_mobile_top === 1,
		desktopSidebar: row.toc_desktop_sidebar === 1,
		floating: row.toc_floating === 1,
		depth:
			Number.isFinite(row.toc_depth)
				? Math.min(6, Math.max(1, Math.round(row.toc_depth)))
				: DEFAULT_SITE_SETTINGS.toc.depth,
		useJapaneseBadge: row.toc_use_japanese_badge === 1,
	},
	pageScaling: {
		enable: row.page_scaling_enable === 1,
		targetWidth: Number.isFinite(row.page_scaling_target_width)
			? Math.max(320, Math.round(row.page_scaling_target_width))
			: DEFAULT_SITE_SETTINGS.pageScaling.targetWidth,
	},
	navbarTitle: {
		mode: row.navbar_title_mode === "logo" ? "logo" : "text-icon",
		text:
			typeof row.navbar_title_text === "string"
				? row.navbar_title_text.trim()
				: DEFAULT_SITE_SETTINGS.navbarTitle.text,
		icon:
			typeof row.navbar_title_icon === "string" && row.navbar_title_icon.trim()
				? row.navbar_title_icon.trim()
				: DEFAULT_SITE_SETTINGS.navbarTitle.icon,
		logo:
			typeof row.navbar_title_logo === "string" && row.navbar_title_logo.trim()
				? row.navbar_title_logo.trim()
				: DEFAULT_SITE_SETTINGS.navbarTitle.logo,
	},
	font: {
		asciiFont: {
			fontFamily:
				typeof row.font_ascii_family === "string" && row.font_ascii_family.trim()
					? row.font_ascii_family.trim()
					: DEFAULT_SITE_SETTINGS.font.asciiFont.fontFamily,
			fontWeight:
				typeof row.font_ascii_weight === "string" && row.font_ascii_weight.trim()
					? row.font_ascii_weight.trim()
					: DEFAULT_SITE_SETTINGS.font.asciiFont.fontWeight,
			localFonts: [
				typeof row.font_ascii_file === "string" && row.font_ascii_file.trim()
					? row.font_ascii_file.trim()
					: DEFAULT_SITE_SETTINGS.font.asciiFont.localFonts[0],
			],
			enableCompress: row.font_ascii_enable_compress === 1,
		},
		cjkFont: {
			fontFamily:
				typeof row.font_cjk_family === "string" && row.font_cjk_family.trim()
					? row.font_cjk_family.trim()
					: DEFAULT_SITE_SETTINGS.font.cjkFont.fontFamily,
			fontWeight:
				typeof row.font_cjk_weight === "string" && row.font_cjk_weight.trim()
					? row.font_cjk_weight.trim()
					: DEFAULT_SITE_SETTINGS.font.cjkFont.fontWeight,
			localFonts: [
				typeof row.font_cjk_file === "string" && row.font_cjk_file.trim()
					? row.font_cjk_file.trim()
					: DEFAULT_SITE_SETTINGS.font.cjkFont.localFonts[0],
			],
			enableCompress: row.font_cjk_enable_compress === 1,
		},
	},
	music: parseMusicSettingsJson(row.music_settings_json),
	showLastModified: row.show_last_modified === 1,
});
console.log("[sync-db-site-settings] Synced site settings override from database.");
