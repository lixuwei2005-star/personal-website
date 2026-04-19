export interface MusicTrackSettings {
	id: number;
	title: string;
	artist: string;
	cover: string;
	url: string;
	duration: number;
}

export interface MusicSettings {
	enable: boolean;
	showSidebarWidget: boolean;
	showFloatingPlayer: boolean;
	floatingEntryMode: "default" | "fab";
	showPlaylistPanel: boolean;
	defaultShuffle: boolean;
	defaultVolume: number;
	defaultExpanded: boolean;
	localPlaylist: MusicTrackSettings[];
}

export const DEFAULT_LOCAL_PLAYLIST: MusicTrackSettings[] = [
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
];

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
	enable: true,
	showSidebarWidget: true,
	showFloatingPlayer: true,
	floatingEntryMode: "fab",
	showPlaylistPanel: true,
	defaultShuffle: false,
	defaultVolume: 0.7,
	defaultExpanded: false,
	localPlaylist: DEFAULT_LOCAL_PLAYLIST.map((track) => ({ ...track })),
};

export function cloneMusicSettings(settings: MusicSettings): MusicSettings {
	return {
		...settings,
		localPlaylist: settings.localPlaylist.map((track) => ({ ...track })),
	};
}

function normalizeFloatingEntryMode(
	value: string | undefined,
	fallback: MusicSettings["floatingEntryMode"],
): MusicSettings["floatingEntryMode"] {
	return value === "default" || value === "fab" ? value : fallback;
}

function normalizeVolume(
	value: number | undefined,
	fallback: number,
): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return fallback;
	}

	return Math.max(0, Math.min(1, value));
}

function normalizeDuration(value: number | undefined): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return 0;
	}

	return Math.max(0, Math.round(value));
}

function inferTrackTitle(rawTitle: string, rawUrl: string, index: number): string {
	const trimmedTitle = rawTitle.trim();
	if (trimmedTitle) {
		return trimmedTitle;
	}

	const source = rawUrl.split("/").pop() || "";
	const baseName = source.replace(/\.[^.]+$/, "").trim();
	return baseName || `Track ${index + 1}`;
}

function normalizeTrack(
	track: Partial<MusicTrackSettings> | undefined,
	index: number,
): MusicTrackSettings | null {
	if (!track || typeof track !== "object") {
		return null;
	}

	const rawUrl = typeof track.url === "string" ? track.url.trim() : "";
	if (!rawUrl) {
		return null;
	}

	const rawCover = typeof track.cover === "string" ? track.cover.trim() : "";
	const rawArtist = typeof track.artist === "string" ? track.artist.trim() : "";
	const rawTitle = typeof track.title === "string" ? track.title : "";

	return {
		id:
			typeof track.id === "number" && Number.isFinite(track.id)
				? Math.max(1, Math.round(track.id))
				: index + 1,
		title: inferTrackTitle(rawTitle, rawUrl, index),
		artist: rawArtist || "Unknown Artist",
		cover: rawCover,
		url: rawUrl,
		duration: normalizeDuration(track.duration),
	};
}

function normalizeLocalPlaylist(
	value: unknown,
	fallback: MusicTrackSettings[],
): MusicTrackSettings[] {
	if (!Array.isArray(value)) {
		return fallback.map((track) => ({ ...track }));
	}

	const normalized = value
		.map((item, index) => normalizeTrack(item as Partial<MusicTrackSettings>, index))
		.filter((item): item is MusicTrackSettings => Boolean(item))
		.map((track, index) => ({
			...track,
			id: index + 1,
		}));

	return normalized;
}

export function normalizeMusicSettings(
	value: Partial<MusicSettings> | undefined,
	base: MusicSettings = DEFAULT_MUSIC_SETTINGS,
): MusicSettings {
	const source = value && typeof value === "object" ? value : {};

	return {
		enable:
			typeof source.enable === "boolean" ? source.enable : base.enable,
		showSidebarWidget:
			typeof source.showSidebarWidget === "boolean"
				? source.showSidebarWidget
				: base.showSidebarWidget,
		showFloatingPlayer:
			typeof source.showFloatingPlayer === "boolean"
				? source.showFloatingPlayer
				: base.showFloatingPlayer,
		floatingEntryMode: normalizeFloatingEntryMode(
			source.floatingEntryMode,
			base.floatingEntryMode,
		),
		showPlaylistPanel:
			typeof source.showPlaylistPanel === "boolean"
				? source.showPlaylistPanel
				: base.showPlaylistPanel,
		defaultShuffle:
			typeof source.defaultShuffle === "boolean"
				? source.defaultShuffle
				: base.defaultShuffle,
		defaultVolume: normalizeVolume(
			source.defaultVolume,
			base.defaultVolume,
		),
		defaultExpanded:
			typeof source.defaultExpanded === "boolean"
				? source.defaultExpanded
				: base.defaultExpanded,
		localPlaylist: normalizeLocalPlaylist(source.localPlaylist, base.localPlaylist),
	};
}

export function parseMusicSettingsJson(
	value: string | undefined,
	fallback: MusicSettings = DEFAULT_MUSIC_SETTINGS,
): MusicSettings {
	if (!value || typeof value !== "string") {
		return cloneMusicSettings(fallback);
	}

	try {
		return normalizeMusicSettings(JSON.parse(value), fallback);
	} catch {
		return cloneMusicSettings(fallback);
	}
}
