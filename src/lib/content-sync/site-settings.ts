import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { SiteSettingsData } from "../repositories/site-settings";
import { bannerSettingsToSiteConfigBanner } from "../site-settings/banner-settings";
import { fullscreenWallpaperSettingsToConfig } from "../site-settings/fullscreen-wallpaper-settings";

const GENERATED_SITE_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"site.ts",
);

function serializeSiteSettings(settings: SiteSettingsData): string {
	const banner = bannerSettingsToSiteConfigBanner(settings.banner);
	const fullscreenWallpaper = fullscreenWallpaperSettingsToConfig(
		settings.fullscreenWallpaper,
	);

	return `import type { FullscreenWallpaperConfig, MusicPlayerConfig, SiteConfig } from "../types/config";

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
\tbanner: ${JSON.stringify(banner, null, 2).replace(/\n/g, "\n\t")},
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
\t\t\tlocalFonts: ${JSON.stringify([settings.font.asciiFont.selectedFile])},
\t\t\tenableCompress: ${settings.font.asciiFont.enableCompress ? "true" : "false"},
\t\t},
\t\tcjkFont: {
\t\t\tfontFamily: ${JSON.stringify(settings.font.cjkFont.fontFamily)},
\t\t\tfontWeight: ${JSON.stringify(settings.font.cjkFont.fontWeight)},
\t\t\tlocalFonts: ${JSON.stringify([settings.font.cjkFont.selectedFile])},
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

export const fullscreenWallpaperOverrideConfig: Partial<FullscreenWallpaperConfig> = ${JSON.stringify(fullscreenWallpaper, null, 2).replace(/\n/g, "\n\t")};
`;
}

export function syncSiteSettingsToGeneratedConfig(
	settings: SiteSettingsData,
): string {
	mkdirSync(path.dirname(GENERATED_SITE_PATH), { recursive: true });
	writeFileSync(
		GENERATED_SITE_PATH,
		serializeSiteSettings(settings),
		"utf-8",
	);
	return GENERATED_SITE_PATH;
}
