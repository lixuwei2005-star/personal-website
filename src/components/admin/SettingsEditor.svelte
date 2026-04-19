<script lang="ts">
	import { onMount } from "svelte";
	import {
		getAdminImagePreviewUrl,
		uploadAdminImage,
	} from "../../lib/admin/image-fields";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";
	import { cloneBannerSettings } from "../../lib/site-settings/banner-settings";
	import { cloneFullscreenWallpaperSettings } from "../../lib/site-settings/fullscreen-wallpaper-settings";
	import { cloneMusicSettings } from "../../lib/site-settings/music-settings";

	type WallpaperImageItem = {
		url: string;
		enabled: boolean;
	};

	interface SiteSettingsData {
		siteEnabled: boolean;
		title: string;
		subtitle: string;
		siteStartDate: string;
		themeColorHue: number;
		themeColorFixed: boolean;
		featurePages: {
			anime: boolean;
			diary: boolean;
			friends: boolean;
			projects: boolean;
			skills: boolean;
			timeline: boolean;
			albums: boolean;
			devices: boolean;
		};
		banner: {
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
		fullscreenWallpaper: {
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
		wallpaperMode: {
			defaultMode: "banner" | "fullscreen" | "none";
			showModeSwitchOnMobile: "off" | "mobile" | "desktop" | "both";
		};
		postListLayout: {
			defaultMode: "list" | "grid";
			allowSwitch: boolean;
		};
		tagStyle: {
			useNewStyle: boolean;
		};
		toc: {
			enable: boolean;
			mobileTop: boolean;
			desktopSidebar: boolean;
			floating: boolean;
			depth: 1 | 2 | 3 | 4 | 5 | 6;
			useJapaneseBadge: boolean;
		};
		pageScaling: {
			enable: boolean;
			targetWidth: number;
		};
		navbarTitle: {
			mode: "text-icon" | "logo";
			text: string;
			icon: string;
			logo: string;
		};
		font: {
			asciiFont: {
				selectedFile: string;
				fontFamily: string;
				fontWeight: string;
				enableCompress: boolean;
			};
			cjkFont: {
				selectedFile: string;
				fontFamily: string;
				fontWeight: string;
				enableCompress: boolean;
			};
		};
		availableFonts: Array<{
			fileName: string;
			label: string;
			format: string;
		}>;
		music: {
			enable: boolean;
			showSidebarWidget: boolean;
			showFloatingPlayer: boolean;
			floatingEntryMode: "default" | "fab";
			showPlaylistPanel: boolean;
			defaultShuffle: boolean;
			defaultVolume: number;
			defaultExpanded: boolean;
			localPlaylist: Array<{
				id: number;
				title: string;
				artist: string;
				cover: string;
				url: string;
				duration: number;
			}>;
		};
	}

	let {
		settings: initialSettings,
		aboutSiteContent: initialAboutSiteContent,
	}: {
		settings: SiteSettingsData;
		aboutSiteContent: string;
	} = $props();

	const getInitialSettings = () => initialSettings;
	const initialSettingsSnapshot = getInitialSettings();
	const initialTitle = initialSettingsSnapshot.title;
	const initialSiteEnabled = initialSettingsSnapshot.siteEnabled;
	const initialSubtitle = initialSettingsSnapshot.subtitle;
	const initialSiteStartDate = initialSettingsSnapshot.siteStartDate;
	const initialThemeColorHue = initialSettingsSnapshot.themeColorHue;
	const initialThemeColorFixed = initialSettingsSnapshot.themeColorFixed;
	const initialFeaturePages = { ...initialSettingsSnapshot.featurePages };
	const initialBanner = cloneBannerSettings(initialSettingsSnapshot.banner);
	const initialFullscreenWallpaper = cloneFullscreenWallpaperSettings(
		initialSettingsSnapshot.fullscreenWallpaper,
	);
	const initialWallpaperMode = { ...initialSettingsSnapshot.wallpaperMode };
	const initialPostListLayout = { ...initialSettingsSnapshot.postListLayout };
	const initialTagStyle = { ...initialSettingsSnapshot.tagStyle };
	const initialToc = { ...initialSettingsSnapshot.toc };
	const initialPageScaling = { ...initialSettingsSnapshot.pageScaling };
	const initialNavbarTitle = { ...initialSettingsSnapshot.navbarTitle };
	const initialFont = {
		asciiFont: { ...initialSettingsSnapshot.font.asciiFont },
		cjkFont: { ...initialSettingsSnapshot.font.cjkFont },
	};
	const initialAvailableFonts = [...initialSettingsSnapshot.availableFonts];
	const initialMusic = cloneMusicSettings(initialSettingsSnapshot.music);

	const featurePageItems: Array<{
		key: keyof SiteSettingsData["featurePages"];
		label: string;
	}> = [
		{ key: "anime", label: "Anime" },
		{ key: "diary", label: "Diary" },
		{ key: "friends", label: "Friends" },
		{ key: "projects", label: "Projects" },
		{ key: "skills", label: "Skills" },
		{ key: "timeline", label: "Timeline" },
		{ key: "albums", label: "Gallery" },
		{ key: "devices", label: "Devices" },
	];

	let siteEnabled = $state(initialSiteEnabled);
	let title = $state(initialTitle);
	let subtitle = $state(initialSubtitle);
	let siteStartDate = $state(initialSiteStartDate);
	let themeColorHue = $state(initialThemeColorHue);
	let themeColorFixed = $state(initialThemeColorFixed);
	let featurePages = $state(initialFeaturePages);
	let banner = $state(initialBanner);
	let bannerSubtitleText = $state(initialBanner.homeText.subtitle.join("\n"));
	let fullscreenWallpaper = $state(initialFullscreenWallpaper);
	let wallpaperMode = $state(initialWallpaperMode);
	let postListLayout = $state(initialPostListLayout);
	let tagStyle = $state(initialTagStyle);
	let toc = $state(initialToc);
	let pageScaling = $state(initialPageScaling);
	let navbarTitle = $state(initialNavbarTitle);
	let font = $state(initialFont);
	let availableFonts = $state(initialAvailableFonts);
	let music = $state(initialMusic);
	let bannerSectionCollapsed = $state(true);
	let fullscreenWallpaperSectionCollapsed = $state(true);
	let musicSectionCollapsed = $state(true);
	let wallpaperUploading = $state(false);
	let navbarIconUploading = $state(false);
	let saving = $state(false);
	let fontUploading = $state(false);
	let musicUploading = $state(false);
	let musicCoverUploadingIndex = $state<number | null>(null);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let aboutSiteContent = $state(initialAboutSiteContent);
	let aboutSiteDraft = $state(initialAboutSiteContent);
	let editingAboutSite = $state(false);
	let aboutSiteSaving = $state(false);
	let aboutSiteMessage = $state("");
	let aboutSiteMessageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let fontUploadInput: HTMLInputElement | null = null;
	let musicUploadInput: HTMLInputElement | null = null;
	let musicSingleUploadInput: HTMLInputElement | null = null;
	let musicCoverUploadInput: HTMLInputElement | null = null;
	let wallpaperUploadInput: HTMLInputElement | null = null;
	let navbarBrandIconUploadInput: HTMLInputElement | null = null;
	let pendingWallpaperCollection = $state<
		"bannerDesktop" | "bannerMobile" | "fullscreenDesktop" | "fullscreenMobile" | null
	>(null);
	let pendingMusicTrackIndex = $state<number | null>(null);
	let pendingMusicCoverIndex = $state<number | null>(null);
	let musicTrackUploadingIndex = $state<number | null>(null);

	onMount(() =>
		onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		}),
	);

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function siteEnabledLabel() {
		return lang === "zh-CN" ? "开启前台访问" : "Enable public site access";
	}

	function siteEnabledHelper() {
		return lang === "zh-CN"
			? "关闭后，前台访问会跳转到 403.html，但后台管理仍然可以正常访问。"
			: "When this is turned off, the public site redirects to 403.html while the admin panel stays available.";
	}

	function navbarBrandSectionLabel() {
		return lang === "zh-CN" ? "顶部品牌" : "Navbar Brand";
	}

	function navbarBrandTextLabel() {
		return lang === "zh-CN" ? "顶部文字" : "Navbar Text";
	}

	function navbarBrandIconLabel() {
		return lang === "zh-CN" ? "顶部图标" : "Navbar Icon";
	}

	function navbarBrandHelper() {
		return lang === "zh-CN"
			? "控制顶部导航栏最左侧的图标和名称。上传本地图标后，保存即可在前台生效。"
			: "Controls the icon and text shown at the far left of the top navigation bar. Upload a local icon and save to apply it on the front end.";
	}

	function openNavbarBrandIconUploadPicker() {
		navbarBrandIconUploadInput?.click();
	}

	async function handleNavbarBrandIconUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		navbarIconUploading = true;
		message = "";

		try {
			const uploaded = await uploadAdminImage(file);
			if (!uploaded?.url) {
				throw new Error(t("Upload failed"));
			}

			navbarTitle = {
				...navbarTitle,
				mode: "text-icon",
				icon: uploaded.url,
			};
			message = t("Upload successful. Click Save Changes to persist it.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		navbarIconUploading = false;
		input.value = "";
	}

	function openAboutSiteEditor() {
		aboutSiteDraft = aboutSiteContent;
		aboutSiteMessage = "";
		aboutSiteMessageKind = "";
		editingAboutSite = true;
	}

	function closeAboutSiteEditor() {
		editingAboutSite = false;
		aboutSiteDraft = aboutSiteContent;
		aboutSiteMessage = "";
		aboutSiteMessageKind = "";
	}

	function handleAboutSiteOverlayKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			closeAboutSiteEditor();
		}
	}

	function handleAboutSiteDialogKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			closeAboutSiteEditor();
		}
	}

	async function saveAboutSitePage() {
		aboutSiteSaving = true;
		aboutSiteMessage = "";
		try {
			const res = await fetch("/api/admin/spec/about-site/", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: aboutSiteDraft }),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Save failed"));
			}

			aboutSiteContent =
				typeof data?.content === "string" ? data.content : aboutSiteDraft;
			editingAboutSite = false;
			message = t("About This Site page saved!");
			messageKind = "success";
		} catch (error) {
			aboutSiteMessage =
				error instanceof Error ? error.message : t("Save failed");
			aboutSiteMessageKind = "error";
		}
		aboutSiteSaving = false;
		setTimeout(() => {
			message = "";
			messageKind = "";
		}, 3000);
	}

	function updateThemeHue(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		themeColorHue = Number(target.value);
	}

	function parseLineList(value: string): string[] {
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}

	function setBannerTextState(nextBanner: SiteSettingsData["banner"]) {
		bannerSubtitleText = nextBanner.homeText.subtitle.join("\n");
	}

	function setFullscreenWallpaperTextState(
		_nextConfig: SiteSettingsData["fullscreenWallpaper"],
	) {}

	function cloneWallpaperImageItem(
		image: WallpaperImageItem,
	): WallpaperImageItem {
		return {
			url: image.url,
			enabled: image.enabled,
		};
	}

	function wallpaperVisibilityButtonLabel(image: WallpaperImageItem) {
		if (lang === "zh-CN") {
			return image.enabled ? "\u9690\u85cf" : "\u663e\u793a";
		}

		return image.enabled ? "Hide" : "Show";
	}

	function wallpaperVisibilityStatusLabel(image: WallpaperImageItem) {
		if (lang === "zh-CN") {
			return image.enabled
				? "\u5f53\u524d\u663e\u793a"
				: "\u5df2\u9690\u85cf";
		}

		return image.enabled ? "Visible" : "Hidden";
	}

	type WallpaperCollectionKey =
		| "bannerDesktop"
		| "bannerMobile"
		| "fullscreenDesktop"
		| "fullscreenMobile";

	function getWallpaperCollection(
		target: WallpaperCollectionKey,
	): WallpaperImageItem[] {
		switch (target) {
			case "bannerDesktop":
				return banner.src.desktop;
			case "bannerMobile":
				return banner.src.mobile;
			case "fullscreenDesktop":
				return fullscreenWallpaper.src.desktop;
			case "fullscreenMobile":
				return fullscreenWallpaper.src.mobile;
		}
	}

	function setWallpaperCollection(
		target: WallpaperCollectionKey,
		nextImages: WallpaperImageItem[],
	) {
		if (target === "bannerDesktop" || target === "bannerMobile") {
			banner = {
				...banner,
				src: {
					...banner.src,
					[target === "bannerDesktop" ? "desktop" : "mobile"]: nextImages,
				},
			};
			return;
		}

		fullscreenWallpaper = {
			...fullscreenWallpaper,
			src: {
				...fullscreenWallpaper.src,
				[target === "fullscreenDesktop" ? "desktop" : "mobile"]: nextImages,
			},
		};
	}

	function updateWallpaperCollection(
		target: WallpaperCollectionKey,
		updater: (images: WallpaperImageItem[]) => WallpaperImageItem[],
	) {
		const nextImages = updater(
			getWallpaperCollection(target).map(cloneWallpaperImageItem),
		);
		setWallpaperCollection(target, nextImages);
	}

	function addWallpaperImage(target: WallpaperCollectionKey) {
		updateWallpaperCollection(target, (images) => [
			...images,
			{ url: "", enabled: true },
		]);
	}

	function updateWallpaperImage(
		target: WallpaperCollectionKey,
		index: number,
		value: string,
	) {
		updateWallpaperCollection(target, (images) =>
			images.map((image, imageIndex) =>
				imageIndex === index
					? {
							...image,
							url: value,
						}
					: image,
			),
		);
	}

	function toggleWallpaperImageVisibility(
		target: WallpaperCollectionKey,
		index: number,
	) {
		updateWallpaperCollection(target, (images) =>
			images.map((image, imageIndex) =>
				imageIndex === index
					? {
							...image,
							enabled: !image.enabled,
						}
					: image,
			),
		);
	}

	function removeWallpaperImage(target: WallpaperCollectionKey, index: number) {
		updateWallpaperCollection(target, (images) =>
			images.filter((_, imageIndex) => imageIndex !== index),
		);
	}

	function moveWallpaperImage(
		target: WallpaperCollectionKey,
		index: number,
		direction: -1 | 1,
	) {
		const images = [...getWallpaperCollection(target)];
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= images.length) {
			return;
		}

		[images[index], images[nextIndex]] = [images[nextIndex], images[index]];
		setWallpaperCollection(target, images);
	}

	function openWallpaperUploadPicker(target: WallpaperCollectionKey) {
		pendingWallpaperCollection = target;
		wallpaperUploadInput?.click();
	}

	async function handleWallpaperUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const target = pendingWallpaperCollection;
		if (!target || !input.files || input.files.length === 0) {
			return;
		}

		wallpaperUploading = true;
		message = "";

		try {
			const uploadedUrls: string[] = [];
			for (const file of Array.from(input.files)) {
				const uploaded = await uploadAdminImage(file);
				if (uploaded?.url) {
					uploadedUrls.push(uploaded.url);
				}
			}

			if (uploadedUrls.length > 0) {
				updateWallpaperCollection(target, (images) => [
					...images,
					...uploadedUrls.map((url) => ({ url, enabled: true })),
				]);
			}

			message = t("Images uploaded! You can now preview, reorder, hide or remove them before saving.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		wallpaperUploading = false;
		pendingWallpaperCollection = null;
		input.value = "";
	}

	type FontSlotKey = keyof SiteSettingsData["font"];

	function getFontOptionLabel(fileName: string): string {
		return (
			availableFonts.find((item) => item.fileName === fileName)?.label ||
			fileName.replace(/\.[^.]+$/, "")
		);
	}

	function updateFontSelection(slot: FontSlotKey, nextFile: string) {
		const currentSlot = font[slot];
		const nextLabel = getFontOptionLabel(nextFile);
		const nextSlot = {
			...currentSlot,
			selectedFile: nextFile,
			fontFamily: nextLabel,
		};

		font = {
			...font,
			[slot]: nextSlot,
		};
	}

	function openFontUploadPicker() {
		fontUploadInput?.click();
	}

	function isFontFileInUse(fileName: string) {
		return (
			font.asciiFont.selectedFile === fileName || font.cjkFont.selectedFile === fileName
		);
	}

	function fontInUseText(fileName: string) {
		const usedBy: string[] = [];
		if (font.asciiFont.selectedFile === fileName) {
			usedBy.push("ASCII");
		}
		if (font.cjkFont.selectedFile === fileName) {
			usedBy.push(lang === "zh-CN" ? "中日韩" : "CJK");
		}

		if (lang === "zh-CN") {
			return `使用中${usedBy.length > 0 ? ` (${usedBy.join(" / ")})` : ""}`;
		}
		return `In use${usedBy.length > 0 ? ` (${usedBy.join(" / ")})` : ""}`;
	}

	async function handleFontUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (!input.files || input.files.length === 0) {
			return;
		}

		fontUploading = true;
		message = "";

		try {
			const formData = new FormData();
			for (const file of Array.from(input.files)) {
				formData.append("files", file);
			}

			const res = await fetch("/api/admin/upload-font/", {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(data?.error || t("Upload failed"));
			}

			if (Array.isArray(data?.fonts)) {
				const mergedFonts = [...availableFonts];
				for (const uploadedFont of data.fonts) {
					if (
						uploadedFont &&
						typeof uploadedFont.fileName === "string" &&
						!mergedFonts.some((item) => item.fileName === uploadedFont.fileName)
					) {
						mergedFonts.push({
							fileName: uploadedFont.fileName,
							label:
								typeof uploadedFont.label === "string"
									? uploadedFont.label
									: uploadedFont.fileName.replace(/\.[^.]+$/, ""),
							format:
								typeof uploadedFont.format === "string"
									? uploadedFont.format
									: ".ttf",
						});
					}
				}

				availableFonts = mergedFonts.sort((a, b) =>
					a.label.localeCompare(b.label),
				);
			}

			message = t("Font files uploaded. Select one and click Save Changes to apply.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		fontUploading = false;
		input.value = "";
	}

	async function deleteFontFile(fileName: string) {
		if (isFontFileInUse(fileName)) {
			message =
				lang === "zh-CN"
					? "当前正在使用这个字体文件，不能删除。"
					: "This font file is currently in use and cannot be deleted.";
			messageKind = "error";
			return;
		}

		const confirmed = window.confirm(
			lang === "zh-CN"
				? "确定要删除这个字体文件吗？"
				: "Delete this font file?",
		);
		if (!confirmed) {
			return;
		}

		fontUploading = true;
		message = "";

		try {
			const res = await fetch(
				`/api/admin/upload-font/?fileName=${encodeURIComponent(fileName)}`,
				{
					method: "DELETE",
				},
			);
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(data?.error || t("Delete failed"));
			}

			if (Array.isArray(data?.availableFonts)) {
				availableFonts = data.availableFonts;
			}

			message =
				lang === "zh-CN" ? "字体文件已删除。" : "Font file deleted successfully.";
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Delete failed");
			messageKind = "error";
		}

		fontUploading = false;
	}

	function openMusicUploadPicker() {
		musicUploadInput?.click();
	}

	function openSingleMusicUploadPicker(index: number) {
		pendingMusicTrackIndex = index;
		musicSingleUploadInput?.click();
	}

	function getPublicAudioUrl(audioPath: string) {
		if (!audioPath) {
			return "";
		}

		if (
			audioPath.startsWith("http://") ||
			audioPath.startsWith("https://") ||
			audioPath.startsWith("data:")
		) {
			return audioPath;
		}

		return audioPath.startsWith("/") ? audioPath : `/${audioPath}`;
	}

	function getAudioDurationFromSource(
		src: string,
		revokeUrl = false,
	): Promise<number> {
		return new Promise((resolve) => {
			if (!src) {
				resolve(0);
				return;
			}

			const audio = document.createElement("audio");
			audio.preload = "metadata";

			const cleanup = () => {
				audio.onloadedmetadata = null;
				audio.onerror = null;
				if (revokeUrl) {
					URL.revokeObjectURL(src);
				}
			};

			audio.onloadedmetadata = () => {
				const nextDuration = Number.isFinite(audio.duration)
					? Math.max(0, Math.round(audio.duration))
					: 0;
				cleanup();
				resolve(nextDuration);
			};

			audio.onerror = () => {
				cleanup();
				resolve(0);
			};

			audio.src = src;
		});
	}

	function getAudioDurationFromFile(file: File) {
		return getAudioDurationFromSource(URL.createObjectURL(file), true);
	}

	async function refreshMusicTrackDuration(index: number) {
		const track = music.localPlaylist[index];
		if (!track?.url) {
			updateMusicTrackField(index, "duration", 0);
			return;
		}

		const nextDuration = await getAudioDurationFromSource(
			getPublicAudioUrl(track.url),
		);
		updateMusicTrackField(index, "duration", nextDuration);
	}

	function getNextMusicTrackId() {
		return (
			music.localPlaylist.reduce(
				(maxId, track) => Math.max(maxId, track.id || 0),
				0,
			) + 1
		);
	}

	function updateMusicTracks(
		updater: (
			tracks: SiteSettingsData["music"]["localPlaylist"],
		) => SiteSettingsData["music"]["localPlaylist"],
	) {
		music = {
			...music,
			localPlaylist: updater(music.localPlaylist).map((track, index) => ({
				...track,
				id: index + 1,
			})),
		};
	}

	function addMusicTrack() {
		updateMusicTracks((tracks) => [
			...tracks,
			{
				id: getNextMusicTrackId(),
				title: "",
				artist: "",
				cover: "",
				url: "",
				duration: 0,
			},
		]);
	}

	function removeMusicTrack(index: number) {
		updateMusicTracks((tracks) => tracks.filter((_, itemIndex) => itemIndex !== index));
	}

	function moveMusicTrack(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= music.localPlaylist.length) {
			return;
		}

		updateMusicTracks((tracks) => {
			const nextTracks = tracks.map((track) => ({ ...track }));
			[nextTracks[index], nextTracks[nextIndex]] = [
				nextTracks[nextIndex],
				nextTracks[index],
			];
			return nextTracks;
		});
	}

	function updateMusicTrackField<
		Key extends keyof SiteSettingsData["music"]["localPlaylist"][number],
	>(index: number, key: Key, value: SiteSettingsData["music"]["localPlaylist"][number][Key]) {
		updateMusicTracks((tracks) =>
			tracks.map((track, itemIndex) =>
				itemIndex === index ? { ...track, [key]: value } : track,
			),
		);
	}

	async function handleMusicUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (!input.files || input.files.length === 0) {
			return;
		}

		musicUploading = true;
		message = "";

		try {
			const files = Array.from(input.files);
			const durations = await Promise.all(
				files.map((file) => getAudioDurationFromFile(file)),
			);
			const formData = new FormData();
			for (const file of files) {
				formData.append("files", file);
			}

			const res = await fetch("/api/admin/upload-music/", {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(data?.error || t("Upload failed"));
			}

			if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
				updateMusicTracks((tracks) => [
					...tracks,
					...data.tracks.map(
						(
							track: { title?: string; url?: string },
							offset: number,
						) => ({
							id: getNextMusicTrackId() + offset,
							title:
								typeof track.title === "string" ? track.title.trim() : "",
							artist: "",
							cover: "",
							url: typeof track.url === "string" ? track.url.trim() : "",
							duration: durations[offset] ?? 0,
						}),
					),
				]);
			}

			message = t("Audio files uploaded. Edit the titles and artist names if needed, then click Save Changes.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		musicUploading = false;
		input.value = "";
	}

	async function handleSingleMusicTrackUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		const targetIndex = pendingMusicTrackIndex;
		if (!file || targetIndex === null) {
			return;
		}

		musicTrackUploadingIndex = targetIndex;
		message = "";

		try {
			const duration = await getAudioDurationFromFile(file);
			const formData = new FormData();
			formData.append("files", file);

			const res = await fetch("/api/admin/upload-music/", {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(data?.error || t("Upload failed"));
			}

			const uploadedTrack = Array.isArray(data?.tracks) ? data.tracks[0] : null;
			if (!uploadedTrack?.url) {
				throw new Error(t("Upload failed"));
			}

			const currentTrack = music.localPlaylist[targetIndex];
			updateMusicTracks((tracks) =>
				tracks.map((track, itemIndex) =>
					itemIndex === targetIndex
						? {
								...track,
								title:
									typeof currentTrack?.title === "string" &&
									currentTrack.title.trim()
										? currentTrack.title
										: (uploadedTrack.title ?? track.title ?? "").trim(),
								url: uploadedTrack.url,
								duration,
							}
						: track,
				),
			);

			message = t("Audio files uploaded. Edit the titles and artist names if needed, then click Save Changes.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		musicTrackUploadingIndex = null;
		pendingMusicTrackIndex = null;
		input.value = "";
	}

	function openMusicCoverUpload(index: number) {
		pendingMusicCoverIndex = index;
		musicCoverUploadInput?.click();
	}

	async function handleMusicCoverUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const targetIndex = pendingMusicCoverIndex;
		if (!input.files || input.files.length === 0 || targetIndex === null) {
			return;
		}

		musicCoverUploadingIndex = targetIndex;
		message = "";

		try {
			const formData = new FormData();
			formData.append("file", input.files[0]);

			const res = await fetch("/api/admin/upload/", {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(data?.error || t("Upload failed"));
			}

			updateMusicTrackField(targetIndex, "cover", data?.url || "");
			message = t("Upload successful. Click Save Changes to persist it.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}

		musicCoverUploadingIndex = null;
		pendingMusicCoverIndex = null;
		input.value = "";
	}

	async function save() {
		saving = true;
		message = "";
		try {
			const bannerPayload = {
				...banner,
				homeText: {
					...banner.homeText,
					subtitle: parseLineList(bannerSubtitleText),
				},
			};
			const fullscreenWallpaperPayload = {
				...fullscreenWallpaper,
			};

			const res = await fetch("/api/admin/site-settings/", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					siteEnabled,
					title,
					subtitle,
					siteStartDate,
					themeColorHue,
					themeColorFixed,
					featurePages,
					banner: bannerPayload,
					fullscreenWallpaper: fullscreenWallpaperPayload,
					wallpaperMode,
					postListLayout,
					tagStyle,
					toc,
					pageScaling,
					navbarTitle: {
						...navbarTitle,
						mode: "text-icon",
					},
					font,
					music,
				}),
			});

			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Save failed"));
			}

			siteEnabled = typeof data?.siteEnabled === "boolean" ? data.siteEnabled : siteEnabled;
			title = data?.title ?? title;
			subtitle = data?.subtitle ?? subtitle;
			siteStartDate = data?.siteStartDate ?? siteStartDate;
			themeColorHue = typeof data?.themeColorHue === "number" ? data.themeColorHue : themeColorHue;
			themeColorFixed = typeof data?.themeColorFixed === "boolean" ? data.themeColorFixed : themeColorFixed;
			if (data?.featurePages && typeof data.featurePages === "object") {
				featurePages = { ...featurePages, ...data.featurePages };
			}
			if (data?.banner && typeof data.banner === "object") {
				banner = data.banner;
				setBannerTextState(data.banner);
			}
			if (
				data?.fullscreenWallpaper &&
				typeof data.fullscreenWallpaper === "object"
			) {
				fullscreenWallpaper = data.fullscreenWallpaper;
				setFullscreenWallpaperTextState(data.fullscreenWallpaper);
			}
			if (data?.wallpaperMode && typeof data.wallpaperMode === "object") {
				wallpaperMode = { ...wallpaperMode, ...data.wallpaperMode };
			}
			if (data?.postListLayout && typeof data.postListLayout === "object") {
				postListLayout = { ...postListLayout, ...data.postListLayout };
			}
			if (data?.tagStyle && typeof data.tagStyle === "object") {
				tagStyle = { ...tagStyle, ...data.tagStyle };
			}
			if (data?.toc && typeof data.toc === "object") {
				toc = { ...toc, ...data.toc };
			}
			if (data?.pageScaling && typeof data.pageScaling === "object") {
				pageScaling = { ...pageScaling, ...data.pageScaling };
			}
			if (data?.navbarTitle && typeof data.navbarTitle === "object") {
				navbarTitle = { ...navbarTitle, ...data.navbarTitle };
			}
			if (data?.font && typeof data.font === "object") {
				font = {
					asciiFont: { ...font.asciiFont, ...data.font.asciiFont },
					cjkFont: { ...font.cjkFont, ...data.font.cjkFont },
				};
			}
			if (Array.isArray(data?.availableFonts)) {
				availableFonts = data.availableFonts;
			}
			if (data?.music && typeof data.music === "object") {
				music = cloneMusicSettings(data.music);
			}
			message = t("Saved successfully!");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Save failed");
			messageKind = "error";
		}
		saving = false;
		setTimeout(() => {
			message = "";
			messageKind = "";
		}, 3000);
	}

	let themePreview = $derived(`hsl(${themeColorHue}, 80%, 62%)`);
</script>

<div class="editor">
	<div class="form-section">
		<h3>{t("Site Configuration")}</h3>

		<input
			class="font-file-input"
			type="file"
			accept="image/*"
			bind:this={navbarBrandIconUploadInput}
			onchange={handleNavbarBrandIconUpload}
		/>

		<div class="form-group">
			<label class="checkbox-row" for="site-enabled">
				<input id="site-enabled" type="checkbox" bind:checked={siteEnabled} />
				<span>{siteEnabledLabel()}</span>
			</label>
			<p class="helper-text">{siteEnabledHelper()}</p>
		</div>

		<div class="form-group">
			<label for="site-start-date">{t("Site Start Date")}</label>
			<input id="site-start-date" type="date" bind:value={siteStartDate} />
			<p class="helper-text">{t("Used by the site statistics widget to calculate running days.")}</p>
		</div>

		<div class="form-group">
			<label for="site-title">{t("Site Title")}</label>
			<input id="site-title" type="text" bind:value={title} />
		</div>

		<div class="form-group">
			<label for="site-subtitle">{t("Site Subtitle")}</label>
			<input id="site-subtitle" type="text" bind:value={subtitle} />
		</div>

		<div class="form-section nested-section">
			<h4>{navbarBrandSectionLabel()}</h4>
			<p class="helper-text">{navbarBrandHelper()}</p>

			<div class="two-column-grid">
				<div class="form-group">
					<label for="navbar-title-text">{navbarBrandTextLabel()}</label>
					<input
						id="navbar-title-text"
						type="text"
						bind:value={navbarTitle.text}
						oninput={() =>
							(navbarTitle = {
								...navbarTitle,
								mode: "text-icon",
							})}
					/>
				</div>

				<div class="form-group">
					<label for="navbar-title-icon">{navbarBrandIconLabel()}</label>
					<div class="music-cover-row">
						<input
							id="navbar-title-icon"
							type="text"
							bind:value={navbarTitle.icon}
							oninput={() =>
								(navbarTitle = {
									...navbarTitle,
									mode: "text-icon",
								})}
						/>
						<button
							type="button"
							class="btn-secondary"
							onclick={openNavbarBrandIconUploadPicker}
							disabled={navbarIconUploading}
						>
							{navbarIconUploading ? t("Uploading...") : t("Upload Image")}
						</button>
					</div>
				</div>
			</div>

			{#if navbarTitle.icon}
				<div class="music-cover-preview">
					<img
						src={getAdminImagePreviewUrl(navbarTitle.icon)}
						alt={navbarTitle.text || "navbar icon"}
					/>
				</div>
			{/if}
		</div>

		<div class="form-section nested-section">
			<h4>{t("About This Site Page")}</h4>
			<p class="helper-text">
				{t(
					"Edit the Markdown content shown when visitors open the About This Site page from the navigation menu.",
				)}
			</p>
			<div class="page-actions">
				<button type="button" class="btn-secondary" onclick={openAboutSiteEditor}>
					{t("Edit About This Site Page")}
				</button>
				<a class="btn-secondary btn-link" href="/about-site/" target="_blank" rel="noreferrer">
					{t("Open About This Site Page")}
				</a>
			</div>
		</div>

		<div class="form-group">
			<div class="theme-header">
				<label for="theme-color-hue">{t("Default Theme Hue")}</label>
				<div class="theme-value-row">
					<span class="theme-swatch" style={`background:${themePreview};`}></span>
					<span class="theme-value">{themeColorHue}</span>
				</div>
			</div>
			<input
				id="theme-color-hue"
				class="theme-range"
				type="range"
				min="0"
				max="360"
				step="1"
				value={themeColorHue}
				oninput={updateThemeHue}
				aria-label={t("Default Theme Hue")}
			/>
			<div class="theme-scale">
				<span>0</span>
				<span>180</span>
				<span>360</span>
			</div>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="theme-color-fixed">
				<input
					id="theme-color-fixed"
					type="checkbox"
					bind:checked={themeColorFixed}
				/>
				<span>{t("Lock theme color picker")}</span>
			</label>
			<p class="helper-text">{t("Turn this on to prevent visitors from changing the theme color.")}</p>
		</div>

		<div class="form-section nested-section">
			<h4>{t("Page Scaling")}</h4>
			<div class="form-group">
				<label class="checkbox-row" for="page-scaling-enable">
					<input
						id="page-scaling-enable"
						type="checkbox"
						bind:checked={pageScaling.enable}
					/>
					<span>{t("Enable automatic page scaling")}</span>
				</label>
			</div>

			<div class="form-group">
				<label for="page-scaling-target-width">{t("Target Width")}</label>
				<input
					id="page-scaling-target-width"
					type="number"
					min="320"
					step="10"
					bind:value={pageScaling.targetWidth}
				/>
				<p class="helper-text">
					{t(
						"The page starts scaling when the viewport width is smaller than this value.",
					)}
				</p>
			</div>
		</div>

		<div class="form-section nested-section">
			<h4>{t("Font Settings")}</h4>
			<div class="form-group">
				<input
					class="font-file-input"
					type="file"
					accept=".ttf,.otf,.woff,.woff2"
					multiple
					bind:this={fontUploadInput}
					onchange={handleFontUpload}
				/>
				<button
					type="button"
					class="btn-secondary"
					onclick={openFontUploadPicker}
					disabled={fontUploading}
				>
					{fontUploading ? t("Uploading...") : t("Upload Font Files")}
				</button>
				<p class="helper-text">
					{t(
						"Upload one or more local font files. TTF works best with build-time compression.",
					)}
				</p>
				{#if availableFonts.length > 0}
					<p class="helper-text">
						{t("Available Fonts")}: {availableFonts
							.map((item) => item.label)
							.join(", ")}
					</p>
					<div class="font-file-list">
						{#each availableFonts as option}
							<div class="font-file-chip" class:in-use={isFontFileInUse(option.fileName)}>
								<div class="font-file-chip-copy">
									<strong>{option.label}</strong>
									<span>{option.fileName}</span>
								</div>
								{#if isFontFileInUse(option.fileName)}
									<span class="font-file-badge">{fontInUseText(option.fileName)}</span>
								{:else}
									<button
										type="button"
										class="btn-chip danger"
										onclick={() => deleteFontFile(option.fileName)}
										disabled={fontUploading}
									>
										{lang === "zh-CN" ? "删除" : "Delete"}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="helper-text">
						{t(
							"No uploaded fonts detected yet. The default project fonts will still work.",
						)}
					</p>
				{/if}
			</div>

			<div class="two-column-grid">
				<div class="form-section nested-section font-settings-card">
					<h4>{t("ASCII Font")}</h4>
					<div class="form-group">
						<label for="ascii-font-select">{t("Active Font File")}</label>
						<select
							id="ascii-font-select"
							value={font.asciiFont.selectedFile}
							onchange={(event) =>
								updateFontSelection(
									"asciiFont",
									(event.currentTarget as HTMLSelectElement).value,
								)}
						>
							{#each availableFonts as option}
								<option value={option.fileName}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="ascii-font-family">{t("Font Family Name")}</label>
						<input
							id="ascii-font-family"
							type="text"
							class="readonly-input"
							value={font.asciiFont.fontFamily}
							readonly
						/>
						<p class="helper-text">
							{lang === "zh-CN"
								? "字体族名称会根据当前字体文件自动生成。"
								: "The font family name is generated automatically from the selected font file."}
						</p>
					</div>

					<div class="form-group">
						<label for="ascii-font-weight">{t("Font Weight")}</label>
						<input
							id="ascii-font-weight"
							type="text"
							bind:value={font.asciiFont.fontWeight}
						/>
					</div>

					<div class="form-group">
						<label class="checkbox-row" for="ascii-font-compress">
							<input
								id="ascii-font-compress"
								type="checkbox"
								bind:checked={font.asciiFont.enableCompress}
							/>
							<span>{t("Enable font compression")}</span>
						</label>
						<p class="helper-text">
							{t(
								"When enabled, this font will be subset/compressed during build when possible.",
							)}
						</p>
					</div>
				</div>

				<div class="form-section nested-section font-settings-card">
					<h4>{t("CJK Font")}</h4>
					<div class="form-group">
						<label for="cjk-font-select">{t("Active Font File")}</label>
						<select
							id="cjk-font-select"
							value={font.cjkFont.selectedFile}
							onchange={(event) =>
								updateFontSelection(
									"cjkFont",
									(event.currentTarget as HTMLSelectElement).value,
								)}
						>
							{#each availableFonts as option}
								<option value={option.fileName}>{option.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="cjk-font-family">{t("Font Family Name")}</label>
						<input
							id="cjk-font-family"
							type="text"
							class="readonly-input"
							value={font.cjkFont.fontFamily}
							readonly
						/>
						<p class="helper-text">
							{lang === "zh-CN"
								? "字体族名称会根据当前字体文件自动生成。"
								: "The font family name is generated automatically from the selected font file."}
						</p>
					</div>

					<div class="form-group">
						<label for="cjk-font-weight">{t("Font Weight")}</label>
						<input
							id="cjk-font-weight"
							type="text"
							bind:value={font.cjkFont.fontWeight}
						/>
					</div>

					<div class="form-group">
						<label class="checkbox-row" for="cjk-font-compress">
							<input
								id="cjk-font-compress"
								type="checkbox"
								bind:checked={font.cjkFont.enableCompress}
							/>
							<span>{t("Enable font compression")}</span>
						</label>
						<p class="helper-text">
							{t(
								"When enabled, this font will be subset/compressed during build when possible.",
							)}
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<input
		class="font-file-input"
		type="file"
		accept="image/*"
		multiple
		bind:this={wallpaperUploadInput}
		onchange={handleWallpaperUpload}
	/>

	<div class="form-section collapsible-section" class:collapsed={bannerSectionCollapsed}>
		<button
			type="button"
			class="section-toggle"
			onclick={() => (bannerSectionCollapsed = !bannerSectionCollapsed)}
			aria-expanded={!bannerSectionCollapsed}
		>
			<span class="section-toggle-title">{t("Banner Background")}</span>
			<span class="section-toggle-icon" aria-hidden="true">{bannerSectionCollapsed ? "＋" : "－"}</span>
		</button>

		{#if !bannerSectionCollapsed}
			<div class="form-group">
				<label>{t("Desktop Banner Images")}</label>
				<div class="wallpaper-toolbar">
					<button
						type="button"
						class="btn-secondary"
						onclick={() => openWallpaperUploadPicker("bannerDesktop")}
						disabled={wallpaperUploading}
					>
						{wallpaperUploading ? t("Uploading...") : t("Upload Images")}
					</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => addWallpaperImage("bannerDesktop")}
					>
						{t("Add Image")}
					</button>
				</div>
				<p class="helper-text">{t("Upload local images or paste a path/URL, then preview, reorder or remove them here.")}</p>
				{#if banner.src.desktop.length === 0}
					<div class="empty-images">{t("No images yet")}</div>
				{:else}
					<div class="wallpaper-list">
						{#each banner.src.desktop as image, index}
							<div class="wallpaper-card" class:is-hidden={!image.enabled}>
								<div class="wallpaper-preview-shell">
									{#if image.url}
										<img
											class="wallpaper-preview"
											src={getAdminImagePreviewUrl(image.url)}
											alt={`${t("Desktop Banner Images")} ${index + 1}`}
										/>
									{:else}
										<div class="image-placeholder">{t("No image")}</div>
									{/if}
								</div>
								<div class="wallpaper-card-body">
									<div class="wallpaper-card-meta">
										<span class="wallpaper-status-chip" class:inactive={!image.enabled}>
											{wallpaperVisibilityStatusLabel(image)}
										</span>
									</div>
									<input
										type="text"
										value={image.url}
										placeholder={t("Path or URL")}
										oninput={(event) =>
											updateWallpaperImage(
												"bannerDesktop",
												index,
												(event.currentTarget as HTMLInputElement).value,
											)}
									/>
									<div class="track-card-actions">
										<button
											type="button"
											class="btn-chip"
											onclick={() => toggleWallpaperImageVisibility("bannerDesktop", index)}
										>
											{wallpaperVisibilityButtonLabel(image)}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("bannerDesktop", index, -1)}
											disabled={index === 0}
										>
											{t("Up")}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("bannerDesktop", index, 1)}
											disabled={index === banner.src.desktop.length - 1}
										>
											{t("Down")}
										</button>
										<button
											type="button"
											class="btn-chip danger"
											onclick={() => removeWallpaperImage("bannerDesktop", index)}
										>
											{t("Remove")}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="form-group">
				<label>{t("Mobile Banner Images")}</label>
				<div class="wallpaper-toolbar">
					<button
						type="button"
						class="btn-secondary"
						onclick={() => openWallpaperUploadPicker("bannerMobile")}
						disabled={wallpaperUploading}
					>
						{wallpaperUploading ? t("Uploading...") : t("Upload Images")}
					</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => addWallpaperImage("bannerMobile")}
					>
						{t("Add Image")}
					</button>
				</div>
				<p class="helper-text">{t("Upload local images or paste a path/URL for mobile banners. Leave this list empty to reuse desktop images.")}</p>
				{#if banner.src.mobile.length === 0}
					<div class="empty-images">{t("No images yet")}</div>
				{:else}
					<div class="wallpaper-list">
						{#each banner.src.mobile as image, index}
							<div class="wallpaper-card" class:is-hidden={!image.enabled}>
								<div class="wallpaper-preview-shell">
									{#if image.url}
										<img
											class="wallpaper-preview"
											src={getAdminImagePreviewUrl(image.url)}
											alt={`${t("Mobile Banner Images")} ${index + 1}`}
										/>
									{:else}
										<div class="image-placeholder">{t("No image")}</div>
									{/if}
								</div>
								<div class="wallpaper-card-body">
									<div class="wallpaper-card-meta">
										<span class="wallpaper-status-chip" class:inactive={!image.enabled}>
											{wallpaperVisibilityStatusLabel(image)}
										</span>
									</div>
									<input
										type="text"
										value={image.url}
										placeholder={t("Path or URL")}
										oninput={(event) =>
											updateWallpaperImage(
												"bannerMobile",
												index,
												(event.currentTarget as HTMLInputElement).value,
											)}
									/>
									<div class="track-card-actions">
										<button
											type="button"
											class="btn-chip"
											onclick={() => toggleWallpaperImageVisibility("bannerMobile", index)}
										>
											{wallpaperVisibilityButtonLabel(image)}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("bannerMobile", index, -1)}
											disabled={index === 0}
										>
											{t("Up")}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("bannerMobile", index, 1)}
											disabled={index === banner.src.mobile.length - 1}
										>
											{t("Down")}
										</button>
										<button
											type="button"
											class="btn-chip danger"
											onclick={() => removeWallpaperImage("bannerMobile", index)}
										>
											{t("Remove")}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="form-group">
				<div class="field-label">{t("Banner Position")}</div>
				<div class="option-grid">
					<label class="option-card" for="banner-position-top">
						<input
							id="banner-position-top"
							type="radio"
							name="banner-position"
							value="top"
							bind:group={banner.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Top")}</span>
							<span class="option-description">{t("Align banner images to the top.")}</span>
						</div>
					</label>

					<label class="option-card" for="banner-position-center">
						<input
							id="banner-position-center"
							type="radio"
							name="banner-position"
							value="center"
							bind:group={banner.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Center")}</span>
							<span class="option-description">{t("Center banner images vertically.")}</span>
						</div>
					</label>

					<label class="option-card" for="banner-position-bottom">
						<input
							id="banner-position-bottom"
							type="radio"
							name="banner-position"
							value="bottom"
							bind:group={banner.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Bottom")}</span>
							<span class="option-description">{t("Align banner images to the bottom.")}</span>
						</div>
					</label>
				</div>
			</div>

			<div class="form-group">
				<div class="field-label">{t("Navbar transparency mode")}</div>
				<div class="option-grid">
					<label class="option-card" for="banner-navbar-semi">
						<input
							id="banner-navbar-semi"
							type="radio"
							name="banner-navbar-transparent-mode"
							value="semi"
							bind:group={banner.navbar.transparentMode}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Semi Transparent")}</span>
							<span class="option-description">{t("Use the classic semi-transparent navbar style.")}</span>
						</div>
					</label>

					<label class="option-card" for="banner-navbar-full">
						<input
							id="banner-navbar-full"
							type="radio"
							name="banner-navbar-transparent-mode"
							value="full"
							bind:group={banner.navbar.transparentMode}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Fully Transparent")}</span>
							<span class="option-description">{t("Keep the navbar fully transparent over the banner.")}</span>
						</div>
					</label>

					<label class="option-card" for="banner-navbar-semifull">
						<input
							id="banner-navbar-semifull"
							type="radio"
							name="banner-navbar-transparent-mode"
							value="semifull"
							bind:group={banner.navbar.transparentMode}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Dynamic Transparent")}</span>
							<span class="option-description">{t("Use the dynamic transparent navbar mode.")}</span>
						</div>
					</label>
				</div>
			</div>

			<div class="two-column-grid">
				<div class="form-group">
					<label class="checkbox-row" for="banner-carousel-enable">
						<input
							id="banner-carousel-enable"
							type="checkbox"
							bind:checked={banner.carousel.enable}
						/>
						<span>{t("Enable Banner Carousel")}</span>
					</label>
					<p class="helper-text">{t("When enabled, multiple banner images will rotate automatically.")}</p>
				</div>

				<div class="form-group">
					<label for="banner-carousel-interval">{t("Carousel Interval (seconds)")}</label>
					<input
						id="banner-carousel-interval"
						type="number"
						min="1"
						step="1"
						bind:value={banner.carousel.interval}
					/>
				</div>
			</div>

			<div class="form-section nested-section">
				<h4>{t("Wave Effects")}</h4>
				<div class="two-column-grid">
					<div class="form-group">
						<label class="checkbox-row" for="banner-waves-enable">
							<input
								id="banner-waves-enable"
								type="checkbox"
								bind:checked={banner.waves.enable}
							/>
							<span>{t("Enable wave effects")}</span>
						</label>
					</div>

					<div class="form-group">
						<label class="checkbox-row" for="banner-waves-performance">
							<input
								id="banner-waves-performance"
								type="checkbox"
								bind:checked={banner.waves.performanceMode}
							/>
							<span>{t("Performance mode")}</span>
						</label>
					</div>

					<div class="form-group">
						<label class="checkbox-row" for="banner-waves-mobile-disable">
							<input
								id="banner-waves-mobile-disable"
								type="checkbox"
								bind:checked={banner.waves.mobileDisable}
							/>
							<span>{t("Disable waves on mobile")}</span>
						</label>
					</div>
				</div>
			</div>

			<div class="form-section nested-section">
				<h4>{t("Banner Image API")}</h4>
				<div class="form-group">
					<label class="checkbox-row" for="banner-image-api-enable">
						<input
							id="banner-image-api-enable"
							type="checkbox"
							bind:checked={banner.imageApi.enable}
						/>
						<span>{t("Enable banner image API")}</span>
					</label>
					<p class="helper-text">{t("Use a text API that returns one image URL per line.")}</p>
				</div>

				<div class="form-group">
					<label for="banner-image-api-url">{t("Banner Image API URL")}</label>
					<input
						id="banner-image-api-url"
						type="url"
						bind:value={banner.imageApi.url}
					/>
				</div>
			</div>

			<div class="form-section nested-section">
				<h4>{t("Banner Text Overlay")}</h4>
				<div class="form-group">
					<label class="checkbox-row" for="banner-home-text-enable">
						<input
							id="banner-home-text-enable"
							type="checkbox"
							bind:checked={banner.homeText.enable}
						/>
						<span>{t("Enable banner text overlay")}</span>
					</label>
				</div>

				<div class="form-group">
					<label for="banner-home-title">{t("Banner Title")}</label>
					<input
						id="banner-home-title"
						type="text"
						bind:value={banner.homeText.title}
					/>
				</div>

				<div class="form-group">
					<label for="banner-home-subtitles">{t("Banner Subtitles")}</label>
					<textarea
						id="banner-home-subtitles"
						rows="5"
						bind:value={bannerSubtitleText}
					></textarea>
					<p class="helper-text">{t("Enter one subtitle per line. Multiple lines will be used for the typewriter rotation.")}</p>
				</div>

				<div class="two-column-grid">
					<div class="form-group">
						<label class="checkbox-row" for="banner-typewriter-enable">
							<input
								id="banner-typewriter-enable"
								type="checkbox"
								bind:checked={banner.homeText.typewriter.enable}
							/>
							<span>{t("Enable typewriter effect")}</span>
						</label>
					</div>

					<div class="form-group">
						<label for="banner-typewriter-speed">{t("Typewriter speed (ms)")}</label>
						<input
							id="banner-typewriter-speed"
							type="number"
							min="0"
							step="1"
							bind:value={banner.homeText.typewriter.speed}
						/>
					</div>

					<div class="form-group">
						<label for="banner-typewriter-delete-speed">{t("Delete speed (ms)")}</label>
						<input
							id="banner-typewriter-delete-speed"
							type="number"
							min="0"
							step="1"
							bind:value={banner.homeText.typewriter.deleteSpeed}
						/>
					</div>

					<div class="form-group">
						<label for="banner-typewriter-pause">{t("Pause time (ms)")}</label>
						<input
							id="banner-typewriter-pause"
							type="number"
							min="0"
							step="1"
							bind:value={banner.homeText.typewriter.pauseTime}
						/>
					</div>
				</div>
			</div>

			<div class="form-section nested-section">
				<h4>{t("Banner Credit")}</h4>
				<div class="form-group">
					<label class="checkbox-row" for="banner-credit-enable">
						<input
							id="banner-credit-enable"
							type="checkbox"
							bind:checked={banner.credit.enable}
						/>
						<span>{t("Show banner credit")}</span>
					</label>
				</div>

				<div class="two-column-grid">
					<div class="form-group">
						<label for="banner-credit-text">{t("Banner Credit Text")}</label>
						<input
							id="banner-credit-text"
							type="text"
							bind:value={banner.credit.text}
						/>
					</div>

					<div class="form-group">
						<label for="banner-credit-url">{t("Banner Credit URL")}</label>
						<input
							id="banner-credit-url"
							type="url"
							bind:value={banner.credit.url}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div
		class="form-section collapsible-section"
		class:collapsed={fullscreenWallpaperSectionCollapsed}
	>
		<button
			type="button"
			class="section-toggle"
			onclick={() =>
				(fullscreenWallpaperSectionCollapsed =
					!fullscreenWallpaperSectionCollapsed)}
			aria-expanded={!fullscreenWallpaperSectionCollapsed}
		>
			<span class="section-toggle-title">{t("Fullscreen Wallpaper Settings")}</span>
			<span class="section-toggle-icon" aria-hidden="true"
				>{fullscreenWallpaperSectionCollapsed ? "＋" : "－"}</span
			>
		</button>

		{#if !fullscreenWallpaperSectionCollapsed}
			<div class="form-group">
				<label>{t("Fullscreen Desktop Images")}</label>
				<div class="wallpaper-toolbar">
					<button
						type="button"
						class="btn-secondary"
						onclick={() => openWallpaperUploadPicker("fullscreenDesktop")}
						disabled={wallpaperUploading}
					>
						{wallpaperUploading ? t("Uploading...") : t("Upload Images")}
					</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => addWallpaperImage("fullscreenDesktop")}
					>
						{t("Add Image")}
					</button>
				</div>
				<p class="helper-text">
					{t("Upload local images or paste a path/URL for desktop fullscreen wallpapers.")}
				</p>
				{#if fullscreenWallpaper.src.desktop.length === 0}
					<div class="empty-images">{t("No images yet")}</div>
				{:else}
					<div class="wallpaper-list">
						{#each fullscreenWallpaper.src.desktop as image, index}
							<div class="wallpaper-card" class:is-hidden={!image.enabled}>
								<div class="wallpaper-preview-shell">
									{#if image.url}
										<img
											class="wallpaper-preview"
											src={getAdminImagePreviewUrl(image.url)}
											alt={`${t("Fullscreen Desktop Images")} ${index + 1}`}
										/>
									{:else}
										<div class="image-placeholder">{t("No image")}</div>
									{/if}
								</div>
								<div class="wallpaper-card-body">
									<div class="wallpaper-card-meta">
										<span class="wallpaper-status-chip" class:inactive={!image.enabled}>
											{wallpaperVisibilityStatusLabel(image)}
										</span>
									</div>
									<input
										type="text"
										value={image.url}
										placeholder={t("Path or URL")}
										oninput={(event) =>
											updateWallpaperImage(
												"fullscreenDesktop",
												index,
												(event.currentTarget as HTMLInputElement).value,
											)}
									/>
									<div class="track-card-actions">
										<button
											type="button"
											class="btn-chip"
											onclick={() =>
												toggleWallpaperImageVisibility("fullscreenDesktop", index)}
										>
											{wallpaperVisibilityButtonLabel(image)}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("fullscreenDesktop", index, -1)}
											disabled={index === 0}
										>
											{t("Up")}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("fullscreenDesktop", index, 1)}
											disabled={index === fullscreenWallpaper.src.desktop.length - 1}
										>
											{t("Down")}
										</button>
										<button
											type="button"
											class="btn-chip danger"
											onclick={() => removeWallpaperImage("fullscreenDesktop", index)}
										>
											{t("Remove")}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="form-group">
				<label>{t("Fullscreen Mobile Images")}</label>
				<div class="wallpaper-toolbar">
					<button
						type="button"
						class="btn-secondary"
						onclick={() => openWallpaperUploadPicker("fullscreenMobile")}
						disabled={wallpaperUploading}
					>
						{wallpaperUploading ? t("Uploading...") : t("Upload Images")}
					</button>
					<button
						type="button"
						class="btn-secondary"
						onclick={() => addWallpaperImage("fullscreenMobile")}
					>
						{t("Add Image")}
					</button>
				</div>
				<p class="helper-text">
					{t("Upload local images or paste a path/URL for mobile fullscreen wallpapers. Leave this list empty to reuse desktop images.")}
				</p>
				{#if fullscreenWallpaper.src.mobile.length === 0}
					<div class="empty-images">{t("No images yet")}</div>
				{:else}
					<div class="wallpaper-list">
						{#each fullscreenWallpaper.src.mobile as image, index}
							<div class="wallpaper-card" class:is-hidden={!image.enabled}>
								<div class="wallpaper-preview-shell">
									{#if image.url}
										<img
											class="wallpaper-preview"
											src={getAdminImagePreviewUrl(image.url)}
											alt={`${t("Fullscreen Mobile Images")} ${index + 1}`}
										/>
									{:else}
										<div class="image-placeholder">{t("No image")}</div>
									{/if}
								</div>
								<div class="wallpaper-card-body">
									<div class="wallpaper-card-meta">
										<span class="wallpaper-status-chip" class:inactive={!image.enabled}>
											{wallpaperVisibilityStatusLabel(image)}
										</span>
									</div>
									<input
										type="text"
										value={image.url}
										placeholder={t("Path or URL")}
										oninput={(event) =>
											updateWallpaperImage(
												"fullscreenMobile",
												index,
												(event.currentTarget as HTMLInputElement).value,
											)}
									/>
									<div class="track-card-actions">
										<button
											type="button"
											class="btn-chip"
											onclick={() =>
												toggleWallpaperImageVisibility("fullscreenMobile", index)}
										>
											{wallpaperVisibilityButtonLabel(image)}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("fullscreenMobile", index, -1)}
											disabled={index === 0}
										>
											{t("Up")}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveWallpaperImage("fullscreenMobile", index, 1)}
											disabled={index === fullscreenWallpaper.src.mobile.length - 1}
										>
											{t("Down")}
										</button>
										<button
											type="button"
											class="btn-chip danger"
											onclick={() => removeWallpaperImage("fullscreenMobile", index)}
										>
											{t("Remove")}
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="form-group">
				<div class="field-label">{t("Fullscreen Wallpaper Position")}</div>
				<div class="option-grid">
					<label class="option-card" for="fullscreen-position-top">
						<input
							id="fullscreen-position-top"
							type="radio"
							name="fullscreen-position"
							value="top"
							bind:group={fullscreenWallpaper.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Top")}</span>
							<span class="option-description"
								>{t(
									"Align fullscreen wallpaper images to the top.",
								)}</span
							>
						</div>
					</label>

					<label class="option-card" for="fullscreen-position-center">
						<input
							id="fullscreen-position-center"
							type="radio"
							name="fullscreen-position"
							value="center"
							bind:group={fullscreenWallpaper.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Center")}</span>
							<span class="option-description"
								>{t(
									"Center fullscreen wallpaper images vertically.",
								)}</span
							>
						</div>
					</label>

					<label class="option-card" for="fullscreen-position-bottom">
						<input
							id="fullscreen-position-bottom"
							type="radio"
							name="fullscreen-position"
							value="bottom"
							bind:group={fullscreenWallpaper.position}
						/>
						<div class="option-copy">
							<span class="option-title">{t("Bottom")}</span>
							<span class="option-description"
								>{t(
									"Align fullscreen wallpaper images to the bottom.",
								)}</span
							>
						</div>
					</label>
				</div>
			</div>

			<div class="two-column-grid">
				<div class="form-group">
					<label class="checkbox-row" for="fullscreen-carousel-enable">
						<input
							id="fullscreen-carousel-enable"
							type="checkbox"
							bind:checked={fullscreenWallpaper.carousel.enable}
						/>
						<span>{t("Enable Fullscreen Wallpaper Carousel")}</span>
					</label>
					<p class="helper-text">
						{t(
							"When enabled, multiple fullscreen wallpaper images will rotate automatically.",
						)}
					</p>
				</div>

				<div class="form-group">
					<label for="fullscreen-carousel-interval"
						>{t("Fullscreen Carousel Interval (seconds)")}</label
					>
					<input
						id="fullscreen-carousel-interval"
						type="number"
						min="1"
						step="1"
						bind:value={fullscreenWallpaper.carousel.interval}
					/>
				</div>
			</div>

			<div class="two-column-grid">
				<div class="form-group">
					<label for="fullscreen-z-index">{t("Fullscreen Wallpaper Z-Index")}</label>
					<input
						id="fullscreen-z-index"
						type="number"
						step="1"
						bind:value={fullscreenWallpaper.zIndex}
					/>
				</div>

				<div class="form-group">
					<div class="theme-header">
						<label for="fullscreen-opacity">{t("Fullscreen Wallpaper Opacity")}</label>
						<div class="theme-value-row">
							<span class="theme-value">{fullscreenWallpaper.opacity.toFixed(2)}</span>
						</div>
					</div>
					<input
						id="fullscreen-opacity"
						class="theme-range"
						type="range"
						min="0"
						max="1"
						step="0.05"
						bind:value={fullscreenWallpaper.opacity}
					/>
					<div class="theme-scale">
						<span>0</span>
						<span>0.5</span>
						<span>1</span>
					</div>
				</div>

				<div class="form-group">
					<label for="fullscreen-blur">{t("Fullscreen Wallpaper Blur (px)")}</label>
					<input
						id="fullscreen-blur"
						type="number"
						min="0"
						step="0.5"
						bind:value={fullscreenWallpaper.blur}
					/>
				</div>
			</div>
		{/if}
	</div>

	<div class="form-section">
		<h3>{t("Feature Pages")}</h3>
		<p class="helper-text section-helper">
			{t("Turn off a page to hide its navigation entry. Existing data stays untouched and will show again when you turn it back on.")}
		</p>

		<div class="feature-grid">
			{#each featurePageItems as item}
				<label class="feature-card" for={`feature-${item.key}`}>
					<input
						id={`feature-${item.key}`}
						type="checkbox"
						bind:checked={featurePages[item.key]}
					/>
					<span>{t(item.label)}</span>
				</label>
			{/each}
		</div>
	</div>

	<div class="form-section">
		<h3>{t("Overall Layout")}</h3>

		<div class="form-group">
			<div class="field-label">{t("Default Wallpaper Mode")}</div>
			<div class="option-grid">
				<label class="option-card" for="wallpaper-banner">
					<input
						id="wallpaper-banner"
						type="radio"
						name="default-wallpaper-mode"
						value="banner"
						bind:group={wallpaperMode.defaultMode}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Banner Wallpaper")}</span>
						<span class="option-description">{t("Top banner wallpaper layout.")}</span>
					</div>
				</label>

				<label class="option-card" for="wallpaper-fullscreen">
					<input
						id="wallpaper-fullscreen"
						type="radio"
						name="default-wallpaper-mode"
						value="fullscreen"
						bind:group={wallpaperMode.defaultMode}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Fullscreen Wallpaper")}</span>
						<span class="option-description">{t("Fullscreen wallpaper layout.")}</span>
					</div>
				</label>

				<label class="option-card" for="wallpaper-none">
					<input
						id="wallpaper-none"
						type="radio"
						name="default-wallpaper-mode"
						value="none"
						bind:group={wallpaperMode.defaultMode}
					/>
					<div class="option-copy">
						<span class="option-title">{t("No Wallpaper")}</span>
						<span class="option-description">{t("No wallpaper layout.")}</span>
					</div>
				</label>
			</div>
		</div>

		<div class="form-group">
			<div class="field-label">{t("Wallpaper switch button visibility")}</div>
			<div class="option-grid">
				<label class="option-card" for="wallpaper-switch-off">
					<input
						id="wallpaper-switch-off"
						type="radio"
						name="wallpaper-switch-visibility"
						value="off"
						bind:group={wallpaperMode.showModeSwitchOnMobile}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Off")}</span>
						<span class="option-description">{t("Do not show the wallpaper mode switch button.")}</span>
					</div>
				</label>

				<label class="option-card" for="wallpaper-switch-mobile">
					<input
						id="wallpaper-switch-mobile"
						type="radio"
						name="wallpaper-switch-visibility"
						value="mobile"
						bind:group={wallpaperMode.showModeSwitchOnMobile}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Mobile only")}</span>
						<span class="option-description">{t("Show only on mobile devices.")}</span>
					</div>
				</label>

				<label class="option-card" for="wallpaper-switch-desktop">
					<input
						id="wallpaper-switch-desktop"
						type="radio"
						name="wallpaper-switch-visibility"
						value="desktop"
						bind:group={wallpaperMode.showModeSwitchOnMobile}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Desktop only")}</span>
						<span class="option-description">{t("Show only on desktop devices.")}</span>
					</div>
				</label>

				<label class="option-card" for="wallpaper-switch-both">
					<input
						id="wallpaper-switch-both"
						type="radio"
						name="wallpaper-switch-visibility"
						value="both"
						bind:group={wallpaperMode.showModeSwitchOnMobile}
					/>
					<div class="option-copy">
						<span class="option-title">{t("All devices")}</span>
						<span class="option-description">{t("Show on all devices.")}</span>
					</div>
				</label>
			</div>
		</div>
	</div>

	<div class="form-section">
		<h3>{t("Homepage Layout")}</h3>

		<div class="form-group">
			<div class="field-label">{t("Default Post Layout")}</div>
			<div class="option-grid">
				<label class="option-card" for="layout-list">
					<input
						id="layout-list"
						type="radio"
						name="default-post-layout"
						value="list"
						bind:group={postListLayout.defaultMode}
					/>
					<div class="option-copy">
						<span class="option-title">{t("List Layout")}</span>
						<span class="option-description">{t("Single-column post list layout.")}</span>
					</div>
				</label>

				<label class="option-card" for="layout-grid">
					<input
						id="layout-grid"
						type="radio"
						name="default-post-layout"
						value="grid"
						bind:group={postListLayout.defaultMode}
					/>
					<div class="option-copy">
						<span class="option-title">{t("Grid Layout")}</span>
						<span class="option-description">{t("Two-column card grid layout.")}</span>
					</div>
				</label>
			</div>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="post-layout-allow-switch">
				<input
					id="post-layout-allow-switch"
					type="checkbox"
					bind:checked={postListLayout.allowSwitch}
				/>
				<span>{t("Allow visitors to switch post layout")}</span>
			</label>
			<p class="helper-text">{t("Turn this off to always use the default layout and hide the layout switch button.")}</p>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="tag-style-use-new">
				<input
					id="tag-style-use-new"
					type="checkbox"
					bind:checked={tagStyle.useNewStyle}
				/>
				<span>{t("Use new hover-highlight tag style")}</span>
			</label>
			<p class="helper-text">{t("Turn this on to use the new hover-highlight tag style instead of the always-outlined classic style.")}</p>
		</div>
	</div>

	<div class="form-section">
		<h3>{t("Table of Contents")}</h3>

		<div class="form-group">
			<label class="checkbox-row" for="toc-enable">
				<input id="toc-enable" type="checkbox" bind:checked={toc.enable} />
				<span>{t("Enable table of contents")}</span>
			</label>
			<p class="helper-text">{t("Turn this off to hide all TOC entry points across the site.")}</p>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="toc-mobile-top">
				<input id="toc-mobile-top" type="checkbox" bind:checked={toc.mobileTop} />
				<span>{t("Show mobile top TOC button")}</span>
			</label>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="toc-desktop-sidebar">
				<input
					id="toc-desktop-sidebar"
					type="checkbox"
					bind:checked={toc.desktopSidebar}
				/>
				<span>{t("Show desktop sidebar TOC")}</span>
			</label>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="toc-floating">
				<input id="toc-floating" type="checkbox" bind:checked={toc.floating} />
				<span>{t("Show floating TOC button")}</span>
			</label>
		</div>

		<div class="form-group">
			<label for="toc-depth">{t("TOC Depth")}</label>
			<select id="toc-depth" bind:value={toc.depth}>
				<option value={1}>1</option>
				<option value={2}>2</option>
				<option value={3}>3</option>
				<option value={4}>4</option>
				<option value={5}>5</option>
				<option value={6}>6</option>
			</select>
			<p class="helper-text">{t("Controls how many heading levels are included in the generated table of contents.")}</p>
		</div>

		<div class="form-group">
			<label class="checkbox-row" for="toc-japanese-badge">
				<input
					id="toc-japanese-badge"
					type="checkbox"
					bind:checked={toc.useJapaneseBadge}
				/>
				<span>{t("Use Japanese badge markers")}</span>
			</label>
			<p class="helper-text">{t("Use Japanese kana badges instead of numeric markers in the TOC widget.")}</p>
		</div>
	</div>

	<div class="form-section collapsible-section" class:collapsed={musicSectionCollapsed}>
		<button
			type="button"
			class="section-toggle"
			onclick={() => (musicSectionCollapsed = !musicSectionCollapsed)}
			aria-expanded={!musicSectionCollapsed}
		>
			<span class="section-toggle-title">{t("Music Player")}</span>
			<span class="section-toggle-icon" aria-hidden="true">{musicSectionCollapsed ? "+" : "-"}</span>
		</button>

		{#if !musicSectionCollapsed}
			<p class="helper-text section-helper">
				{t("This section only manages the local music player. Online music APIs are intentionally removed here.")}
			</p>

			<input
				class="font-file-input"
				type="file"
				accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/*"
				multiple
				bind:this={musicUploadInput}
				onchange={handleMusicUpload}
			/>
			<input
				class="font-file-input"
				type="file"
				accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/*"
				bind:this={musicSingleUploadInput}
				onchange={handleSingleMusicTrackUpload}
			/>
			<input
				class="font-file-input"
				type="file"
				accept="image/*"
				bind:this={musicCoverUploadInput}
				onchange={handleMusicCoverUpload}
			/>

			<div class="two-column-grid">
				<div class="form-group">
					<label class="checkbox-row" for="music-enable">
						<input id="music-enable" type="checkbox" bind:checked={music.enable} />
						<span>{t("Show music player on the front end")}</span>
					</label>
				</div>

				<div class="form-group">
					<label class="checkbox-row" for="music-sidebar-enable">
						<input
							id="music-sidebar-enable"
							type="checkbox"
							bind:checked={music.showSidebarWidget}
						/>
						<span>{t("Show sidebar music widget")}</span>
					</label>
				</div>

				<div class="form-group">
					<label class="checkbox-row" for="music-floating-enable">
						<input
							id="music-floating-enable"
							type="checkbox"
							bind:checked={music.showFloatingPlayer}
						/>
						<span>{t("Show floating music player")}</span>
					</label>
				</div>

				<div class="form-group">
					<label class="checkbox-row" for="music-playlist-enable">
						<input
							id="music-playlist-enable"
							type="checkbox"
							bind:checked={music.showPlaylistPanel}
						/>
						<span>{t("Allow playlist panel on the front end")}</span>
					</label>
				</div>

				<div class="form-group">
					<label class="checkbox-row" for="music-default-shuffle">
						<input
							id="music-default-shuffle"
							type="checkbox"
							bind:checked={music.defaultShuffle}
						/>
						<span>{t("Enable shuffle mode by default")}</span>
					</label>
				</div>

				<div class="form-group">
					<label class="checkbox-row" for="music-default-expanded">
						<input
							id="music-default-expanded"
							type="checkbox"
							bind:checked={music.defaultExpanded}
						/>
						<span>{t("Expand player UI by default")}</span>
					</label>
				</div>
			</div>

			<div class="two-column-grid">
				<div class="form-group">
					<label for="music-floating-mode">{t("Floating entry mode")}</label>
					<select id="music-floating-mode" bind:value={music.floatingEntryMode}>
						<option value="fab">{t("FAB group")}</option>
						<option value="default">{t("Standalone player")}</option>
					</select>
				</div>

				<div class="form-group">
					<div class="theme-header">
						<label for="music-default-volume">{t("Default Volume")}</label>
						<div class="theme-value-row">
							<span class="theme-value">{Math.round(music.defaultVolume * 100)}%</span>
						</div>
					</div>
					<input
						id="music-default-volume"
						class="theme-range"
						type="range"
						min="0"
						max="100"
						step="1"
						value={Math.round(music.defaultVolume * 100)}
						oninput={(event) =>
							(music = {
								...music,
								defaultVolume:
									Number((event.currentTarget as HTMLInputElement).value) / 100,
							})}
					/>
					<div class="theme-scale">
						<span>0%</span>
						<span>50%</span>
						<span>100%</span>
					</div>
				</div>
			</div>

			<div class="form-section nested-section">
				<h4>{t("Local Playlist")}</h4>
				<div class="music-toolbar">
					<button
						type="button"
						class="btn-secondary"
						onclick={openMusicUploadPicker}
						disabled={musicUploading}
					>
						{musicUploading ? t("Uploading...") : t("Upload Audio Files")}
					</button>
					<button type="button" class="btn-secondary" onclick={addMusicTrack}>
						{t("Add Track")}
					</button>
				</div>
				<p class="helper-text">
					{t("Upload local audio files in bulk, then adjust title, artist, cover and order below. The list order here is the playback order when shuffle is off.")}
				</p>

				{#if music.localPlaylist.length === 0}
					<p class="helper-text">{t("No local tracks yet")}</p>
				{:else}
					<div class="track-list">
						{#each music.localPlaylist as track, index}
							<div class="track-card">
								<div class="track-card-header">
									<div class="track-card-title">
										<span>{t("Track")} #{index + 1}</span>
										<code>{track.url || t("No audio uploaded yet")}</code>
									</div>
									<div class="track-card-actions">
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveMusicTrack(index, -1)}
											disabled={index === 0}
										>
											{t("Up")}
										</button>
										<button
											type="button"
											class="btn-chip"
											onclick={() => moveMusicTrack(index, 1)}
											disabled={index === music.localPlaylist.length - 1}
										>
											{t("Down")}
										</button>
										<button
											type="button"
											class="btn-chip danger"
											onclick={() => removeMusicTrack(index)}
										>
											{t("Remove")}
										</button>
									</div>
								</div>

								<div class="two-column-grid">
									<div class="form-group">
										<label for={`music-track-title-${index}`}>{t("Title")}</label>
										<input
											id={`music-track-title-${index}`}
											type="text"
											value={track.title}
											oninput={(event) =>
												updateMusicTrackField(
													index,
													"title",
													(event.currentTarget as HTMLInputElement).value,
												)}
										/>
									</div>

									<div class="form-group">
										<label for={`music-track-artist-${index}`}>{t("Artist")}</label>
										<input
											id={`music-track-artist-${index}`}
											type="text"
											value={track.artist}
											oninput={(event) =>
												updateMusicTrackField(
													index,
													"artist",
													(event.currentTarget as HTMLInputElement).value,
												)}
										/>
									</div>

									<div class="form-group">
										<label for={`music-track-url-${index}`}>{t("Audio File URL")}</label>
										<div class="music-cover-row">
											<input
												id={`music-track-url-${index}`}
												type="text"
												value={track.url}
												oninput={(event) =>
													updateMusicTrackField(
														index,
														"url",
														(event.currentTarget as HTMLInputElement).value,
													)}
												onblur={() => refreshMusicTrackDuration(index)}
											/>
											<button
												type="button"
												class="btn-secondary"
												onclick={() => openSingleMusicUploadPicker(index)}
												disabled={musicTrackUploadingIndex === index}
											>
												{musicTrackUploadingIndex === index
													? t("Uploading...")
													: t("Upload Audio Files")}
											</button>
										</div>
									</div>

									<div class="form-group">
										<label for={`music-track-duration-${index}`}>{t("Duration (seconds)")}</label>
										<input
											id={`music-track-duration-${index}`}
											type="number"
											value={track.duration}
											readonly
										/>
										<p class="helper-text">
											{t("Duration is detected automatically after you upload or update the audio file URL.")}
										</p>
									</div>
								</div>

								<div class="form-group">
									<label for={`music-track-cover-${index}`}>{t("Cover Image")}</label>
									<div class="music-cover-row">
										<input
											id={`music-track-cover-${index}`}
											type="text"
											value={track.cover}
											oninput={(event) =>
												updateMusicTrackField(
													index,
													"cover",
													(event.currentTarget as HTMLInputElement).value,
												)}
										/>
										<button
											type="button"
											class="btn-secondary"
											onclick={() => openMusicCoverUpload(index)}
											disabled={musicCoverUploadingIndex === index}
										>
											{musicCoverUploadingIndex === index
												? t("Uploading...")
												: t("Upload Image")}
										</button>
									</div>
									{#if track.cover}
										<div class="music-cover-preview">
											<img
												src={getAdminImagePreviewUrl(track.cover)}
												alt={track.title || "cover"}
											/>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="actions">
		<button class="btn-save" onclick={save} disabled={saving}>
			{saving ? t("Saving...") : t("Save Changes")}
		</button>
		{#if message}
			<span class="message" class:success={messageKind === "success"}>{message}</span>
		{/if}
	</div>

	{#if editingAboutSite}
		<div
			class="modal-overlay"
			onclick={closeAboutSiteEditor}
			onkeydown={handleAboutSiteOverlayKeydown}
			role="button"
			tabindex="0"
			aria-label={t("Cancel")}
		>
			<div
				class="about-page-modal"
				onclick={(event) => event.stopPropagation()}
				onkeydown={handleAboutSiteDialogKeydown}
				role="dialog"
				aria-modal="true"
				aria-label={t("Edit About This Site Page")}
				tabindex="0"
			>
				<div class="about-page-modal-header">
					<h3>{t("Edit About This Site Page")}</h3>
					<button
						type="button"
						class="btn-close"
						onclick={closeAboutSiteEditor}
						aria-label={t("Cancel")}
					>
						x
					</button>
				</div>
				<p class="helper-text">
					{t("Supports Markdown. Content is saved to src/content/spec/about-site.md.")}
				</p>
				<textarea
					class="about-page-textarea"
					rows="18"
					bind:value={aboutSiteDraft}
					placeholder={t("Content")}
				></textarea>
				{#if aboutSiteMessage}
					<div class="message" class:success={aboutSiteMessageKind === "success"}>
						{aboutSiteMessage}
					</div>
				{/if}
				<div class="modal-actions">
					<button
						type="button"
						class="btn-secondary"
						onclick={closeAboutSiteEditor}
						disabled={aboutSiteSaving}
					>
						{t("Cancel")}
					</button>
					<button
						type="button"
						class="btn-save"
						onclick={saveAboutSitePage}
						disabled={aboutSiteSaving}
					>
						{aboutSiteSaving ? t("Saving...") : t("Save Changes")}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.editor { width: 100%; max-width: 760px; }
	.form-section { width: 100%; box-sizing: border-box; overflow: hidden; background: #fff; border-radius: 12px; padding: 22px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.form-section h3 { font-size: 16px; margin-bottom: 18px; color: #374151; }
	.collapsible-section.collapsed { padding-bottom: 12px; }
	.section-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 0;
		margin: 0 0 18px;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}
	.collapsible-section.collapsed .section-toggle { margin-bottom: 0; }
	.section-toggle-title { font-size: 16px; font-weight: 700; color: #374151; }
	.section-toggle-icon {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: #eef2ff;
		color: #4f46e5;
		font-size: 18px;
		font-weight: 700;
		line-height: 1;
	}
	.nested-section { margin-top: 18px; margin-bottom: 0; background: #f8fafc; box-shadow: none; border: 1px solid #e5e7eb; }
	.nested-section h4 { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 14px; }
	.form-group { margin-bottom: 18px; min-width: 0; }
	.form-group label { display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
	.field-label { display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
	.form-group input[type="text"],
	.form-group input[type="date"],
	.form-group input[type="url"],
	.form-group input[type="number"],
	.form-group select,
	.form-group textarea { display: block; width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: #fff; }
	.form-group input[type="text"]:focus,
	.form-group input[type="date"]:focus,
	.form-group input[type="url"]:focus,
	.form-group input[type="number"]:focus,
	.form-group select:focus,
	.form-group textarea:focus,
	.theme-range:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
	.form-group textarea { resize: vertical; min-height: 5.5rem; }
	.font-file-input { display: none; }
	.helper-text { margin-top: 8px; font-size: 12px; color: #6b7280; }
	.section-helper { margin-top: -6px; margin-bottom: 16px; }
	.theme-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
	.theme-value-row { display: inline-flex; align-items: center; gap: 8px; }
	.theme-swatch { width: 18px; height: 18px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35); }
	.theme-value { font-size: 13px; font-weight: 700; color: #4b5563; min-width: 2.5rem; text-align: right; }
	.theme-range { width: 100%; appearance: none; height: 12px; border-radius: 999px; border: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); background: linear-gradient(90deg, hsl(0 80% 62%), hsl(60 80% 62%), hsl(120 80% 62%), hsl(180 80% 62%), hsl(240 80% 62%), hsl(300 80% 62%), hsl(360 80% 62%)); cursor: pointer; }
	.theme-range::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 999px; background: #fff; border: 2px solid #6366f1; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2); }
	.theme-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 999px; background: #fff; border: 2px solid #6366f1; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2); }
	.theme-scale { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #6b7280; }
	.checkbox-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; cursor: pointer; }
	.checkbox-row input { width: 16px; height: 16px; margin: 0; }
	.two-column-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
	.two-column-grid > * { min-width: 0; }
	.font-settings-card { min-width: 0; width: 100%; box-sizing: border-box; overflow: hidden; align-self: start; }
	.readonly-input {
		background: #f8fafc !important;
		color: #6b7280;
		cursor: default;
	}
	.font-file-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
	}
	.font-file-chip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #fff;
	}
	.font-file-chip.in-use {
		background: #f8fafc;
	}
	.font-file-chip-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.font-file-chip-copy strong {
		font-size: 13px;
		color: #1f2937;
		word-break: break-word;
	}
	.font-file-chip-copy span {
		font-size: 12px;
		color: #6b7280;
		word-break: break-all;
	}
	.font-file-badge {
		flex-shrink: 0;
		padding: 5px 10px;
		border-radius: 999px;
		background: #e0e7ff;
		color: #4338ca;
		font-size: 12px;
		font-weight: 700;
	}
	.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
	.feature-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #f8fafc;
		font-size: 14px;
		font-weight: 600;
		color: #374151;
		cursor: pointer;
	}
	.feature-card input { width: 16px; height: 16px; margin: 0; }
	.option-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
	.option-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #f8fafc;
		cursor: pointer;
	}
	.option-card input { width: 16px; height: 16px; margin: 2px 0 0; }
	.option-copy { display: flex; flex-direction: column; gap: 4px; }
	.option-title { font-size: 14px; font-weight: 700; color: #374151; }
	.option-description { font-size: 12px; color: #6b7280; line-height: 1.5; }
	.wallpaper-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
	.wallpaper-list { display: flex; flex-direction: column; gap: 12px; }
	.wallpaper-card {
		display: grid;
		grid-template-columns: 120px minmax(0, 1fr);
		gap: 14px;
		align-items: center;
		padding: 14px;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: #fff;
	}
	.wallpaper-card.is-hidden {
		opacity: 0.72;
		background: #f8fafc;
	}
	.wallpaper-preview-shell {
		width: 120px;
		height: 80px;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		background: #f8fafc;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.wallpaper-preview {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.wallpaper-card-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	.wallpaper-card-meta {
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}
	.wallpaper-status-chip {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 999px;
		background: rgba(59, 130, 246, 0.12);
		color: #1d4ed8;
		font-size: 12px;
		font-weight: 700;
	}
	.wallpaper-status-chip.inactive {
		background: rgba(107, 114, 128, 0.14);
		color: #4b5563;
	}
	.image-placeholder,
	.empty-images {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		border: 1px dashed #d1d5db;
		border-radius: 12px;
		background: #f8fafc;
		color: #6b7280;
		font-size: 13px;
		text-align: center;
	}
	.music-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
	.track-list { display: flex; flex-direction: column; gap: 14px; }
	.track-card {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 16px;
		background: #fff;
	}
	.track-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}
	.track-card-title { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
	.track-card-title span { font-size: 14px; font-weight: 700; color: #1f2937; }
	.track-card-title code {
		display: inline-block;
		max-width: 100%;
		font-size: 12px;
		color: #6b7280;
		word-break: break-all;
		background: #f8fafc;
		padding: 2px 6px;
		border-radius: 6px;
	}
	.track-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
	.btn-chip {
		padding: 6px 10px;
		border-radius: 999px;
		border: 1px solid #d1d5db;
		background: #fff;
		font-size: 12px;
		font-weight: 600;
		color: #374151;
		cursor: pointer;
	}
	.btn-chip:disabled { opacity: 0.45; cursor: not-allowed; }
	.btn-chip.danger {
		border-color: #fecaca;
		color: #dc2626;
		background: #fff5f5;
	}
	.music-cover-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: center;
	}
	.music-cover-preview {
		margin-top: 10px;
		width: 72px;
		height: 72px;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		background: #f8fafc;
	}
	.music-cover-preview img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.page-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 12px;
	}
	.actions { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
	.btn-secondary { padding: 10px 18px; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 8px; font-size: 14px; cursor: pointer; }
	.btn-secondary:hover { background: #e0e7ff; }
	.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-link { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
	.btn-save { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
	.btn-save:hover { background: #4f46e5; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.message { font-size: 13px; color: #dc2626; }
	.message.success { color: #16a34a; }
	.modal-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(15, 23, 42, 0.5);
		z-index: 1100;
	}
	.about-page-modal {
		width: min(900px, 100%);
		max-height: 90vh;
		overflow: auto;
		background: #fff;
		border-radius: 14px;
		padding: 20px;
		box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
	}
	.about-page-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}
	.about-page-modal-header h3 {
		margin: 0;
		font-size: 18px;
		color: #111827;
	}
	.btn-close {
		width: 34px;
		height: 34px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #fff;
		color: #4b5563;
		font-size: 18px;
		cursor: pointer;
	}
	.btn-close:hover { background: #f8fafc; }
	.about-page-textarea {
		display: block;
		width: 100%;
		box-sizing: border-box;
		min-height: 420px;
		margin-top: 8px;
		padding: 12px 14px;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		font-size: 14px;
		line-height: 1.7;
		resize: vertical;
		background: #fff;
	}
	.about-page-textarea:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 16px;
	}
	@media (max-width: 640px) {
		.theme-header { flex-direction: column; align-items: flex-start; }
		.font-file-chip { flex-direction: column; align-items: flex-start; }
		.wallpaper-card {
			grid-template-columns: 1fr;
		}
		.wallpaper-preview-shell {
			width: 100%;
			height: 160px;
		}
		.track-card-header { flex-direction: column; }
		.music-cover-row { grid-template-columns: 1fr; }
		.page-actions,
		.modal-actions { flex-direction: column; }
	}
</style>
