import type { ProfileConfig } from "../types/config";

export const profileOverrideConfig: Partial<ProfileConfig> = {
	avatar: "/uploads/faee3192-daf0-4aae-a5f3-9e276e40e5ba.jpg",
	name: "XUZHIDONG",
	bio: "handsome boy",
	links: 	[
		{
			"name": "Gitee",
			"icon": "mdi:git",
			"url": "https://gitee.com/matsuzakayuki"
		},
		{
			"name": "GitHub",
			"icon": "fa7-brands:github",
			"url": "https://github.com/matsuzaka-yuki"
		},
		{
			"name": "Codeberg",
			"icon": "simple-icons:codeberg",
			"url": "https://codeberg.org"
		},
		{
			"name": "Discord",
			"icon": "fa7-brands:discord",
			"url": "https://discord.gg/MqW6TcQtVM"
		},
		{
			"name": "Youtube",
			"icon": "logos:youtube-icon",
			"url": ""
		}
	],
};

export const profileFooterName = "";
