import { getDb } from "../db";
import type { SiteConfig } from "../../types/config";
import {
	DEFAULT_FONT_LABELS,
	listAvailableFonts,
	type AvailableFontOption,
} from "../font-files";
import {
	DEFAULT_BANNER_SETTINGS,
	type BannerSettings,
	parseBannerSettingsJson,
	normalizeBannerSettings,
} from "../site-settings/banner-settings";
import {
	DEFAULT_FULLSCREEN_WALLPAPER_SETTINGS,
	type FullscreenWallpaperSettings,
	parseFullscreenWallpaperSettingsJson,
	normalizeFullscreenWallpaperSettings,
} from "../site-settings/fullscreen-wallpaper-settings";
import {
	DEFAULT_MUSIC_SETTINGS,
	type MusicSettings,
	parseMusicSettingsJson,
	normalizeMusicSettings,
} from "../site-settings/music-settings";

type FeaturePagesConfig = SiteConfig["featurePages"];
type PostListLayoutSettings = {
	defaultMode: SiteConfig["postListLayout"]["defaultMode"];
	allowSwitch: boolean;
	categoryBar: {
		enable: boolean;
	};
};
type WallpaperModeSettings = {
	defaultMode: SiteConfig["wallpaperMode"]["defaultMode"];
	showModeSwitchOnMobile: NonNullable<
		SiteConfig["wallpaperMode"]["showModeSwitchOnMobile"]
	>;
};
type TagStyleSettings = {
	useNewStyle: boolean;
};
type TocSettings = {
	enable: boolean;
	mobileTop: boolean;
	desktopSidebar: boolean;
	floating: boolean;
	depth: SiteConfig["toc"]["depth"];
	useJapaneseBadge: boolean;
};
type PageScalingSettings = {
	enable: boolean;
	targetWidth: number;
};
type NavbarTitleSettings = {
	mode: Exclude<NonNullable<SiteConfig["navbarTitle"]>["mode"], undefined>;
	text: string;
	icon: string;
	logo: string;
};
type ManagedFontSettings = {
	selectedFile: string;
	fontFamily: string;
	fontWeight: string;
	enableCompress: boolean;
};
type SiteFontSettings = {
	asciiFont: ManagedFontSettings;
	cjkFont: ManagedFontSettings;
};

export interface SiteSettingsData {
	siteEnabled: boolean;
	title: string;
	subtitle: string;
	siteStartDate: string;
	themeColorHue: number;
	themeColorFixed: boolean;
	featurePages: FeaturePagesConfig;
	banner: BannerSettings;
	fullscreenWallpaper: FullscreenWallpaperSettings;
	wallpaperMode: WallpaperModeSettings;
	postListLayout: PostListLayoutSettings;
	tagStyle: TagStyleSettings;
	toc: TocSettings;
	pageScaling: PageScalingSettings;
	navbarTitle: NavbarTitleSettings;
	font: SiteFontSettings;
	availableFonts: AvailableFontOption[];
	showLastModified: boolean;
	music: MusicSettings;
}

const DEFAULT_FEATURE_PAGES: FeaturePagesConfig = {
	anime: true,
	diary: true,
	friends: true,
	projects: true,
	skills: true,
	timeline: true,
	albums: true,
	devices: true,
};

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
	siteEnabled: true,
	title: "Mizuki",
	subtitle: "One demo website",
	siteStartDate: "2025-01-01",
	themeColorHue: 240,
	themeColorFixed: false,
	featurePages: DEFAULT_FEATURE_PAGES,
	banner: DEFAULT_BANNER_SETTINGS,
	fullscreenWallpaper: DEFAULT_FULLSCREEN_WALLPAPER_SETTINGS,
	wallpaperMode: {
		defaultMode: "banner",
		showModeSwitchOnMobile: "desktop",
	},
	postListLayout: {
		defaultMode: "list",
		allowSwitch: true,
		categoryBar: {
			enable: true,
		},
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
			selectedFile: "ZenMaruGothic-Medium.ttf",
			fontFamily: DEFAULT_FONT_LABELS["ZenMaruGothic-Medium.ttf"],
			fontWeight: "400",
			enableCompress: true,
		},
		cjkFont: {
			selectedFile: "loli.ttf",
			fontFamily: DEFAULT_FONT_LABELS["loli.ttf"],
			fontWeight: "500",
			enableCompress: true,
		},
	},
	availableFonts: [],
	showLastModified: true,
	music: DEFAULT_MUSIC_SETTINGS,
};

function normalizeSiteStartDate(value: string | undefined): string {
	if (typeof value !== "string") {
		return DEFAULT_SITE_SETTINGS.siteStartDate;
	}

	const trimmed = value.trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
		? trimmed
		: DEFAULT_SITE_SETTINGS.siteStartDate;
}

function normalizeThemeHue(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return DEFAULT_SITE_SETTINGS.themeColorHue;
	}

	return Math.min(360, Math.max(0, Math.round(value)));
}

function normalizePostListDefaultMode(
	value: string | undefined,
): PostListLayoutSettings["defaultMode"] {
	return value === "grid" ? "grid" : "list";
}

function normalizeWallpaperDefaultMode(
	value: string | undefined,
): WallpaperModeSettings["defaultMode"] {
	if (value === "fullscreen" || value === "none") {
		return value;
	}

	return "banner";
}

function normalizeWallpaperSwitchDisplay(
	value: string | undefined,
): WallpaperModeSettings["showModeSwitchOnMobile"] {
	if (
		value === "off" ||
		value === "mobile" ||
		value === "desktop" ||
		value === "both"
	) {
		return value;
	}

	return DEFAULT_SITE_SETTINGS.wallpaperMode.showModeSwitchOnMobile;
}

function normalizePageScalingTargetWidth(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return DEFAULT_SITE_SETTINGS.pageScaling.targetWidth;
	}

	return Math.max(320, Math.round(value));
}

function normalizeNavbarTitleMode(
	value: string | undefined,
): NavbarTitleSettings["mode"] {
	return value === "logo" ? "logo" : "text-icon";
}

function normalizeNavbarTitleText(value: string | undefined): string {
	if (typeof value !== "string") {
		return DEFAULT_SITE_SETTINGS.navbarTitle.text;
	}

	return value.trim();
}

function normalizeNavbarTitleAsset(
	value: string | undefined,
	fallback: string,
): string {
	if (typeof value !== "string") {
		return fallback;
	}

	const trimmed = value.trim();
	return trimmed || fallback;
}

function normalizeTocDepth(value: number | undefined): TocSettings["depth"] {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return DEFAULT_SITE_SETTINGS.toc.depth;
	}

	return Math.min(6, Math.max(1, Math.round(value))) as TocSettings["depth"];
}

function normalizeFontWeight(
	value: string | number | undefined,
	fallback: string,
): string {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(Math.round(value));
	}

	if (typeof value !== "string") {
		return fallback;
	}

	const trimmed = value.trim();
	return trimmed ? trimmed : fallback;
}

function normalizeFontFileSelection(
	value: string | undefined,
	availableFonts: AvailableFontOption[],
	fallback: string,
): string {
	const fallbackFile =
		availableFonts.find((font) => font.fileName === fallback)?.fileName ||
		availableFonts[0]?.fileName ||
		fallback;

	if (typeof value !== "string") {
		return fallbackFile;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return fallbackFile;
	}

	return (
		availableFonts.find((font) => font.fileName === trimmed)?.fileName ||
		fallbackFile
	);
}

function resolveFontLabel(
	fileName: string,
	availableFonts: AvailableFontOption[],
	fallback: string,
): string {
	return (
		availableFonts.find((font) => font.fileName === fileName)?.label || fallback
	);
}

export function getSiteSettings(): SiteSettingsData {
	const db = getDb();
	const row = db
		.prepare(
			`SELECT site_enabled, title, subtitle, site_start_date, theme_color_hue, theme_color_fixed,
					feature_anime, feature_diary, feature_friends, feature_projects,
					feature_skills, feature_timeline, feature_albums, feature_devices,
					banner_settings_json,
					fullscreen_wallpaper_settings_json,
					wallpaper_default_mode, wallpaper_mode_switch_display,
					post_list_default_mode, post_list_allow_switch, tag_style_use_new_style,
					toc_enable, toc_mobile_top, toc_desktop_sidebar, toc_floating, toc_depth, toc_use_japanese_badge,
					page_scaling_enable, page_scaling_target_width,
					navbar_title_mode, navbar_title_text, navbar_title_icon, navbar_title_logo,
					font_ascii_file, font_ascii_family, font_ascii_weight, font_ascii_enable_compress,
					font_cjk_file, font_cjk_family, font_cjk_weight, font_cjk_enable_compress,
					show_last_modified, music_settings_json
			 FROM site_settings
			 WHERE id = 1`,
		)
		.get() as
		| {
				site_enabled: number;
				title: string;
				subtitle: string;
				site_start_date: string;
				theme_color_hue: number;
				theme_color_fixed: number;
				feature_anime: number;
				feature_diary: number;
				feature_friends: number;
				feature_projects: number;
				feature_skills: number;
				feature_timeline: number;
				feature_albums: number;
				feature_devices: number;
				banner_settings_json: string;
				fullscreen_wallpaper_settings_json: string;
				wallpaper_default_mode: string;
				wallpaper_mode_switch_display: string;
				post_list_default_mode: string;
				post_list_allow_switch: number;
				tag_style_use_new_style: number;
				toc_enable: number;
				toc_mobile_top: number;
				toc_desktop_sidebar: number;
				toc_floating: number;
				toc_depth: number;
				toc_use_japanese_badge: number;
				page_scaling_enable: number;
				page_scaling_target_width: number;
				navbar_title_mode: string;
				navbar_title_text: string;
				navbar_title_icon: string;
				navbar_title_logo: string;
				font_ascii_file: string;
				font_ascii_family: string;
				font_ascii_weight: string;
				font_ascii_enable_compress: number;
				font_cjk_file: string;
				font_cjk_family: string;
				font_cjk_weight: string;
				font_cjk_enable_compress: number;
				show_last_modified: number;
				music_settings_json: string;
		  }
		| undefined;

	const availableFonts = listAvailableFonts({
		[row?.font_ascii_file || DEFAULT_SITE_SETTINGS.font.asciiFont.selectedFile]:
			row?.font_ascii_family || DEFAULT_SITE_SETTINGS.font.asciiFont.fontFamily,
		[row?.font_cjk_file || DEFAULT_SITE_SETTINGS.font.cjkFont.selectedFile]:
			row?.font_cjk_family || DEFAULT_SITE_SETTINGS.font.cjkFont.fontFamily,
	});

	const asciiSelectedFile = normalizeFontFileSelection(
		row?.font_ascii_file,
		availableFonts,
		DEFAULT_SITE_SETTINGS.font.asciiFont.selectedFile,
	);
	const cjkSelectedFile = normalizeFontFileSelection(
		row?.font_cjk_file,
		availableFonts,
		DEFAULT_SITE_SETTINGS.font.cjkFont.selectedFile,
	);

	return {
		siteEnabled: row ? row.site_enabled === 1 : DEFAULT_SITE_SETTINGS.siteEnabled,
		title: row ? row.title : DEFAULT_SITE_SETTINGS.title,
		subtitle: row ? row.subtitle : DEFAULT_SITE_SETTINGS.subtitle,
		siteStartDate: normalizeSiteStartDate(row?.site_start_date),
		themeColorHue: normalizeThemeHue(row?.theme_color_hue),
		themeColorFixed: row ? row.theme_color_fixed === 1 : DEFAULT_SITE_SETTINGS.themeColorFixed,
		featurePages: {
			anime: row ? row.feature_anime === 1 : DEFAULT_SITE_SETTINGS.featurePages.anime,
			diary: row ? row.feature_diary === 1 : DEFAULT_SITE_SETTINGS.featurePages.diary,
			friends: row ? row.feature_friends === 1 : DEFAULT_SITE_SETTINGS.featurePages.friends,
			projects: row ? row.feature_projects === 1 : DEFAULT_SITE_SETTINGS.featurePages.projects,
			skills: row ? row.feature_skills === 1 : DEFAULT_SITE_SETTINGS.featurePages.skills,
			timeline: row ? row.feature_timeline === 1 : DEFAULT_SITE_SETTINGS.featurePages.timeline,
			albums: row ? row.feature_albums === 1 : DEFAULT_SITE_SETTINGS.featurePages.albums,
			devices: row ? row.feature_devices === 1 : DEFAULT_SITE_SETTINGS.featurePages.devices,
		},
		banner: parseBannerSettingsJson(
			row?.banner_settings_json,
			DEFAULT_SITE_SETTINGS.banner,
		),
		fullscreenWallpaper: parseFullscreenWallpaperSettingsJson(
			row?.fullscreen_wallpaper_settings_json,
			DEFAULT_SITE_SETTINGS.fullscreenWallpaper,
		),
		wallpaperMode: {
			defaultMode: normalizeWallpaperDefaultMode(row?.wallpaper_default_mode),
			showModeSwitchOnMobile: normalizeWallpaperSwitchDisplay(
				row?.wallpaper_mode_switch_display,
			),
		},
		postListLayout: {
			...DEFAULT_SITE_SETTINGS.postListLayout,
			defaultMode: normalizePostListDefaultMode(row?.post_list_default_mode),
			allowSwitch: row ? row.post_list_allow_switch === 1 : DEFAULT_SITE_SETTINGS.postListLayout.allowSwitch,
		},
		tagStyle: {
			useNewStyle: row ? row.tag_style_use_new_style === 1 : DEFAULT_SITE_SETTINGS.tagStyle.useNewStyle,
		},
		toc: {
			enable: row ? row.toc_enable === 1 : DEFAULT_SITE_SETTINGS.toc.enable,
			mobileTop: row ? row.toc_mobile_top === 1 : DEFAULT_SITE_SETTINGS.toc.mobileTop,
			desktopSidebar:
				row ? row.toc_desktop_sidebar === 1 : DEFAULT_SITE_SETTINGS.toc.desktopSidebar,
			floating: row ? row.toc_floating === 1 : DEFAULT_SITE_SETTINGS.toc.floating,
			depth: normalizeTocDepth(row?.toc_depth),
			useJapaneseBadge:
				row ? row.toc_use_japanese_badge === 1 : DEFAULT_SITE_SETTINGS.toc.useJapaneseBadge,
		},
		pageScaling: {
			enable: row ? row.page_scaling_enable === 1 : DEFAULT_SITE_SETTINGS.pageScaling.enable,
			targetWidth: normalizePageScalingTargetWidth(row?.page_scaling_target_width),
		},
		navbarTitle: {
			mode: normalizeNavbarTitleMode(row?.navbar_title_mode),
			text: normalizeNavbarTitleText(row?.navbar_title_text),
			icon: normalizeNavbarTitleAsset(
				row?.navbar_title_icon,
				DEFAULT_SITE_SETTINGS.navbarTitle.icon,
			),
			logo: normalizeNavbarTitleAsset(
				row?.navbar_title_logo,
				DEFAULT_SITE_SETTINGS.navbarTitle.logo,
			),
		},
		font: {
			asciiFont: {
				selectedFile: asciiSelectedFile,
				fontFamily:
					typeof row?.font_ascii_family === "string" &&
					row.font_ascii_family.trim()
						? row.font_ascii_family.trim()
						: resolveFontLabel(
								asciiSelectedFile,
								availableFonts,
								DEFAULT_SITE_SETTINGS.font.asciiFont.fontFamily,
							),
				fontWeight: normalizeFontWeight(
					row?.font_ascii_weight,
					DEFAULT_SITE_SETTINGS.font.asciiFont.fontWeight,
				),
				enableCompress:
					row
						? row.font_ascii_enable_compress === 1
						: DEFAULT_SITE_SETTINGS.font.asciiFont.enableCompress,
			},
			cjkFont: {
				selectedFile: cjkSelectedFile,
				fontFamily:
					typeof row?.font_cjk_family === "string" &&
					row.font_cjk_family.trim()
						? row.font_cjk_family.trim()
						: resolveFontLabel(
								cjkSelectedFile,
								availableFonts,
								DEFAULT_SITE_SETTINGS.font.cjkFont.fontFamily,
							),
				fontWeight: normalizeFontWeight(
					row?.font_cjk_weight,
					DEFAULT_SITE_SETTINGS.font.cjkFont.fontWeight,
				),
				enableCompress:
					row
						? row.font_cjk_enable_compress === 1
						: DEFAULT_SITE_SETTINGS.font.cjkFont.enableCompress,
			},
		},
		availableFonts,
		showLastModified: row ? row.show_last_modified === 1 : DEFAULT_SITE_SETTINGS.showLastModified,
		music: parseMusicSettingsJson(
			row?.music_settings_json,
			DEFAULT_SITE_SETTINGS.music,
		),
	};
}

export function updateSiteSettings(data: Partial<SiteSettingsData>): void {
	const db = getDb();
	const current = getSiteSettings();
	const merged: SiteSettingsData = {
		...current,
		...data,
		siteEnabled:
			typeof data.siteEnabled === "boolean"
				? data.siteEnabled
				: current.siteEnabled,
		title:
			typeof data.title === "string"
				? data.title.trim()
				: current.title,
		subtitle:
			typeof data.subtitle === "string" ? data.subtitle.trim() : current.subtitle,
		siteStartDate: normalizeSiteStartDate(data.siteStartDate ?? current.siteStartDate),
		themeColorHue: normalizeThemeHue(data.themeColorHue ?? current.themeColorHue),
		themeColorFixed:
			typeof data.themeColorFixed === "boolean"
				? data.themeColorFixed
				: current.themeColorFixed,
		featurePages: {
			anime:
				typeof data.featurePages?.anime === "boolean"
					? data.featurePages.anime
					: current.featurePages.anime,
			diary:
				typeof data.featurePages?.diary === "boolean"
					? data.featurePages.diary
					: current.featurePages.diary,
			friends:
				typeof data.featurePages?.friends === "boolean"
					? data.featurePages.friends
					: current.featurePages.friends,
			projects:
				typeof data.featurePages?.projects === "boolean"
					? data.featurePages.projects
					: current.featurePages.projects,
			skills:
				typeof data.featurePages?.skills === "boolean"
					? data.featurePages.skills
					: current.featurePages.skills,
			timeline:
				typeof data.featurePages?.timeline === "boolean"
					? data.featurePages.timeline
					: current.featurePages.timeline,
			albums:
				typeof data.featurePages?.albums === "boolean"
					? data.featurePages.albums
					: current.featurePages.albums,
			devices:
				typeof data.featurePages?.devices === "boolean"
					? data.featurePages.devices
					: current.featurePages.devices,
		},
		banner: normalizeBannerSettings(data.banner, current.banner),
		fullscreenWallpaper: normalizeFullscreenWallpaperSettings(
			data.fullscreenWallpaper,
			current.fullscreenWallpaper,
		),
		wallpaperMode: {
			defaultMode: normalizeWallpaperDefaultMode(
				data.wallpaperMode?.defaultMode ?? current.wallpaperMode.defaultMode,
			),
			showModeSwitchOnMobile: normalizeWallpaperSwitchDisplay(
				data.wallpaperMode?.showModeSwitchOnMobile ??
					current.wallpaperMode.showModeSwitchOnMobile,
			),
		},
		postListLayout: {
			...current.postListLayout,
			defaultMode: normalizePostListDefaultMode(
				data.postListLayout?.defaultMode ?? current.postListLayout.defaultMode,
			),
			allowSwitch:
				typeof data.postListLayout?.allowSwitch === "boolean"
					? data.postListLayout.allowSwitch
					: current.postListLayout.allowSwitch,
		},
		tagStyle: {
			useNewStyle:
				typeof data.tagStyle?.useNewStyle === "boolean"
					? data.tagStyle.useNewStyle
					: current.tagStyle.useNewStyle,
		},
		toc: {
			enable:
				typeof data.toc?.enable === "boolean"
					? data.toc.enable
					: current.toc.enable,
			mobileTop:
				typeof data.toc?.mobileTop === "boolean"
					? data.toc.mobileTop
					: current.toc.mobileTop,
			desktopSidebar:
				typeof data.toc?.desktopSidebar === "boolean"
					? data.toc.desktopSidebar
					: current.toc.desktopSidebar,
			floating:
				typeof data.toc?.floating === "boolean"
					? data.toc.floating
					: current.toc.floating,
			depth: normalizeTocDepth(data.toc?.depth ?? current.toc.depth),
			useJapaneseBadge:
				typeof data.toc?.useJapaneseBadge === "boolean"
					? data.toc.useJapaneseBadge
					: current.toc.useJapaneseBadge,
		},
		pageScaling: {
			enable:
				typeof data.pageScaling?.enable === "boolean"
					? data.pageScaling.enable
					: current.pageScaling.enable,
			targetWidth: normalizePageScalingTargetWidth(
				data.pageScaling?.targetWidth ?? current.pageScaling.targetWidth,
			),
		},
		navbarTitle: {
			mode: normalizeNavbarTitleMode(
				data.navbarTitle?.mode ?? current.navbarTitle.mode,
			),
			text: normalizeNavbarTitleText(
				data.navbarTitle?.text ?? current.navbarTitle.text,
			),
			icon: normalizeNavbarTitleAsset(
				data.navbarTitle?.icon ?? current.navbarTitle.icon,
				current.navbarTitle.icon,
			),
			logo: normalizeNavbarTitleAsset(
				data.navbarTitle?.logo ?? current.navbarTitle.logo,
				current.navbarTitle.logo,
			),
		},
		font: {
			asciiFont: {
				selectedFile: normalizeFontFileSelection(
					data.font?.asciiFont?.selectedFile ?? current.font.asciiFont.selectedFile,
					current.availableFonts,
					current.font.asciiFont.selectedFile,
				),
				fontFamily:
					typeof data.font?.asciiFont?.fontFamily === "string" &&
					data.font.asciiFont.fontFamily.trim()
						? data.font.asciiFont.fontFamily.trim()
						: current.font.asciiFont.fontFamily,
				fontWeight: normalizeFontWeight(
					data.font?.asciiFont?.fontWeight,
					current.font.asciiFont.fontWeight,
				),
				enableCompress:
					typeof data.font?.asciiFont?.enableCompress === "boolean"
						? data.font.asciiFont.enableCompress
						: current.font.asciiFont.enableCompress,
			},
			cjkFont: {
				selectedFile: normalizeFontFileSelection(
					data.font?.cjkFont?.selectedFile ?? current.font.cjkFont.selectedFile,
					current.availableFonts,
					current.font.cjkFont.selectedFile,
				),
				fontFamily:
					typeof data.font?.cjkFont?.fontFamily === "string" &&
					data.font.cjkFont.fontFamily.trim()
						? data.font.cjkFont.fontFamily.trim()
						: current.font.cjkFont.fontFamily,
				fontWeight: normalizeFontWeight(
					data.font?.cjkFont?.fontWeight,
					current.font.cjkFont.fontWeight,
				),
				enableCompress:
					typeof data.font?.cjkFont?.enableCompress === "boolean"
						? data.font.cjkFont.enableCompress
						: current.font.cjkFont.enableCompress,
			},
		},
		availableFonts: current.availableFonts,
		showLastModified:
			typeof data.showLastModified === "boolean"
				? data.showLastModified
				: current.showLastModified,
		music: normalizeMusicSettings(data.music, current.music),
	};

	db.prepare(
		`UPDATE site_settings
		 SET site_enabled = ?,
			 title = ?,
			 subtitle = ?,
			 site_start_date = ?,
			 theme_color_hue = ?,
			 theme_color_fixed = ?,
			 feature_anime = ?,
			 feature_diary = ?,
			 feature_friends = ?,
			 feature_projects = ?,
			 feature_skills = ?,
			 feature_timeline = ?,
			 feature_albums = ?,
			 feature_devices = ?,
			 banner_settings_json = ?,
			 fullscreen_wallpaper_settings_json = ?,
			 wallpaper_default_mode = ?,
			 wallpaper_mode_switch_display = ?,
			 post_list_default_mode = ?,
			 post_list_allow_switch = ?,
			 tag_style_use_new_style = ?,
			 toc_enable = ?,
			 toc_mobile_top = ?,
			 toc_desktop_sidebar = ?,
			 toc_floating = ?,
			 toc_depth = ?,
			 toc_use_japanese_badge = ?,
			 page_scaling_enable = ?,
			 page_scaling_target_width = ?,
			 navbar_title_mode = ?,
			 navbar_title_text = ?,
			 navbar_title_icon = ?,
			 navbar_title_logo = ?,
			 font_ascii_file = ?,
			 font_ascii_family = ?,
			 font_ascii_weight = ?,
			 font_ascii_enable_compress = ?,
			 font_cjk_file = ?,
			 font_cjk_family = ?,
			 font_cjk_weight = ?,
			 font_cjk_enable_compress = ?,
			 show_last_modified = ?,
			 music_settings_json = ?
		 WHERE id = 1`,
	).run(
		merged.siteEnabled ? 1 : 0,
		merged.title,
		merged.subtitle,
		merged.siteStartDate,
		merged.themeColorHue,
		merged.themeColorFixed ? 1 : 0,
		merged.featurePages.anime ? 1 : 0,
		merged.featurePages.diary ? 1 : 0,
		merged.featurePages.friends ? 1 : 0,
		merged.featurePages.projects ? 1 : 0,
		merged.featurePages.skills ? 1 : 0,
		merged.featurePages.timeline ? 1 : 0,
		merged.featurePages.albums ? 1 : 0,
		merged.featurePages.devices ? 1 : 0,
		JSON.stringify(merged.banner),
		JSON.stringify(merged.fullscreenWallpaper),
		merged.wallpaperMode.defaultMode,
		merged.wallpaperMode.showModeSwitchOnMobile,
		merged.postListLayout.defaultMode,
		merged.postListLayout.allowSwitch ? 1 : 0,
		merged.tagStyle.useNewStyle ? 1 : 0,
		merged.toc.enable ? 1 : 0,
		merged.toc.mobileTop ? 1 : 0,
		merged.toc.desktopSidebar ? 1 : 0,
		merged.toc.floating ? 1 : 0,
		merged.toc.depth,
		merged.toc.useJapaneseBadge ? 1 : 0,
		merged.pageScaling.enable ? 1 : 0,
		merged.pageScaling.targetWidth,
		merged.navbarTitle.mode,
		merged.navbarTitle.text,
		merged.navbarTitle.icon,
		merged.navbarTitle.logo,
		merged.font.asciiFont.selectedFile,
		merged.font.asciiFont.fontFamily,
		merged.font.asciiFont.fontWeight,
		merged.font.asciiFont.enableCompress ? 1 : 0,
		merged.font.cjkFont.selectedFile,
		merged.font.cjkFont.fontFamily,
		merged.font.cjkFont.fontWeight,
		merged.font.cjkFont.enableCompress ? 1 : 0,
		merged.showLastModified ? 1 : 0,
		JSON.stringify(merged.music),
	);
}

export function isSiteEnabled(): boolean {
	const db = getDb();
	const row = db
		.prepare("SELECT site_enabled FROM site_settings WHERE id = 1")
		.get() as { site_enabled: number } | undefined;

	if (!row) {
		return DEFAULT_SITE_SETTINGS.siteEnabled;
	}

	return row.site_enabled === 1;
}
