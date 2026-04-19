import type { FullscreenWallpaperConfig, MusicPlayerConfig, SiteConfig } from "../types/config";

export const siteOverrideConfig: Partial<SiteConfig> = {
	title: "demo",
	subtitle: "",
	siteStartDate: "2026-04-17",
	themeColor: {
		hue: 338,
		fixed: false,
	},
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
	  "src": {
	    "desktop": [
	      "/assets/desktop-banner/1.webp",
	      "/assets/desktop-banner/2.webp",
	      "/assets/desktop-banner/3.webp",
	      "/assets/desktop-banner/4.webp"
	    ],
	    "mobile": [
	      "/assets/mobile-banner/1.webp",
	      "/assets/mobile-banner/2.webp",
	      "/assets/mobile-banner/3.webp",
	      "/assets/mobile-banner/4.webp"
	    ]
	  },
	  "position": "center",
	  "carousel": {
	    "enable": true,
	    "interval": 3
	  },
	  "waves": {
	    "enable": true,
	    "performanceMode": false,
	    "mobileDisable": false
	  },
	  "imageApi": {
	    "enable": false,
	    "url": "http://domain.com/api_v2.php?format=text&count=4"
	  },
	  "homeText": {
	    "enable": true,
	    "title": "わたしの部屋",
	    "subtitle": [
	      "特別なことはないけど、君がいると十分です",
	      "今でもあなたは私の光",
	      "君ってさ、知らないうちに私の毎日になってたよ",
	      "君と話すと、なんか毎日がちょっと楽しくなるんだ",
	      "今日はなんでもない日。でも、ちょっとだけいい日"
	    ],
	    "typewriter": {
	      "enable": true,
	      "speed": 100,
	      "deleteSpeed": 50,
	      "pauseTime": 2000
	    }
	  },
	  "credit": {
	    "enable": false,
	    "text": "Describe",
	    "url": ""
	  },
	  "navbar": {
	    "transparentMode": "semifull"
	  }
	},
	wallpaperMode: {
		defaultMode: "none",
		showModeSwitchOnMobile: "both",
	},
	postListLayout: {
		defaultMode: "list",
		allowSwitch: false,
	},
	toc: {
		enable: true,
		mobileTop: true,
		desktopSidebar: true,
		floating: true,
		depth: 6,
		useJapaneseBadge: true,
	},
	font: {
		asciiFont: {
			fontFamily: "AaGuDianKeBenSongYouMoBan-2",
			fontWeight: "400",
			localFonts: ["AaGuDianKeBenSongYouMoBan-2-f3e0589f.ttf"],
			enableCompress: true,
		},
		cjkFont: {
			fontFamily: "AaGuDianKeBenSongYouMoBan-2",
			fontWeight: "500",
			localFonts: ["AaGuDianKeBenSongYouMoBan-2-f3e0589f.ttf"],
			enableCompress: true,
		},
	},
	tagStyle: {
		useNewStyle: true,
	},
	pageScaling: {
		enable: true,
		targetWidth: 2000,
	},
	navbarTitle: {
		mode: "text-icon",
		text: "hand",
		icon: "/uploads/8f363cbb-3512-4634-b912-02ed9ceff583.png",
		logo: "assets/home/default-logo.webp",
	},
	showLastModified: true,
};

export const musicOverrideConfig: Partial<MusicPlayerConfig> & {
	showSidebarWidget?: boolean;
	showPlaylistPanel?: boolean;
	defaultShuffle?: boolean;
	defaultVolume?: number;
	defaultExpanded?: boolean;
	localPlaylist?: Array<{
		id: number;
		title: string;
		artist: string;
		cover: string;
		url: string;
		duration: number;
	}>;
} = {
	  "enable": true,
	  "showSidebarWidget": true,
	  "showFloatingPlayer": true,
	  "floatingEntryMode": "fab",
	  "showPlaylistPanel": true,
	  "defaultShuffle": false,
	  "defaultVolume": 0.7,
	  "defaultExpanded": false,
	  "localPlaylist": [
	    {
	      "id": 1,
	      "title": "Helena Paparizou - My Number One - Greece ð__¬ð__· - Grand Final - Eurovision 2005",
	      "artist": "徐志东",
	      "cover": "/uploads/47432817-295c-4e84-9915-dd37ad5c6dfa.jpg",
	      "url": "/uploads/music/6464c377-b8e6-4b92-b6d2-8076ca95d782.mp3",
	      "duration": 188
	    }
	  ]
	};

export const fullscreenWallpaperOverrideConfig: Partial<FullscreenWallpaperConfig> = {
	  "src": {
	    "desktop": [
	      "/assets/desktop-banner/1.webp",
	      "/assets/desktop-banner/2.webp",
	      "/assets/desktop-banner/3.webp",
	      "/assets/desktop-banner/4.webp"
	    ],
	    "mobile": [
	      "/assets/mobile-banner/1.webp",
	      "/assets/mobile-banner/2.webp",
	      "/assets/mobile-banner/3.webp",
	      "/assets/mobile-banner/4.webp"
	    ]
	  },
	  "position": "center",
	  "carousel": {
	    "enable": true,
	    "interval": 5
	  },
	  "zIndex": -1,
	  "opacity": 0.8,
	  "blur": 1
	};
