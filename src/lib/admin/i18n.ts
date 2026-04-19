export type AdminLanguage = "zh-CN" | "en";

export const ADMIN_LANGUAGE_STORAGE_KEY = "adminLanguage";
export const defaultAdminLanguage: AdminLanguage = "zh-CN";

type TranslationEntry = Partial<Record<AdminLanguage, string>>;

const literalTranslations: Record<string, TranslationEntry> = {
	Admin: { "zh-CN": "后台", en: "Admin" },
	Dashboard: { "zh-CN": "仪表盘", en: "Dashboard" },
	Announcements: { "zh-CN": "公告", en: "Announcements" },
	Profile: { "zh-CN": "个人资料", en: "Profile" },
	Posts: { "zh-CN": "文章", en: "Posts" },
	Projects: { "zh-CN": "项目", en: "Projects" },
	Friends: { "zh-CN": "友链", en: "Friends" },
	Tools: { "zh-CN": "实用工具", en: "Tools" },
	Skills: { "zh-CN": "技能", en: "Skills" },
	Timeline: { "zh-CN": "时间线", en: "Timeline" },
	Diary: { "zh-CN": "日记", en: "Diary" },
	Albums: { "zh-CN": "相册", en: "Albums" },
	Anime: { "zh-CN": "番剧", en: "Anime" },
	Devices: { "zh-CN": "设备", en: "Devices" },
	Settings: { "zh-CN": "设置", en: "Settings" },
	Security: { "zh-CN": "安全", en: "Security" },
	Language: { "zh-CN": "语言", en: "Language" },
	Login: { "zh-CN": "登录", en: "Login" },
	"Logging in...": { "zh-CN": "登录中...", en: "Logging in..." },
	Logout: { "zh-CN": "退出登录", en: "Logout" },
	"View Site": { "zh-CN": "查看前台", en: "View Site" },
	"Content Management": { "zh-CN": "内容管理", en: "Content Management" },
	"Login to manage your site content": {
		"zh-CN": "登录以管理你的网站内容",
		en: "Login to manage your site content",
	},
	Username: { "zh-CN": "用户名", en: "Username" },
	Password: { "zh-CN": "密码", en: "Password" },
	"Login failed": { "zh-CN": "登录失败", en: "Login failed" },
	"Network error": { "zh-CN": "网络错误", en: "Network error" },
	"Invalid credentials": { "zh-CN": "用户名或密码错误", en: "Invalid credentials" },
	"Username and password required": {
		"zh-CN": "请输入用户名和密码",
		en: "Username and password required",
	},
	"Security Settings": { "zh-CN": "安全设置", en: "Security Settings" },
	"Update the admin username or password here. The username and password both need confirmation before saving.": {
		"zh-CN": "可以在这里修改后台用户名或密码。用户名和密码都需要二次确认后才能保存。",
		en: "Update the admin username or password here. The username and password both need confirmation before saving.",
	},
	"Five failed login attempts will lock admin sign-in for 10 minutes.": {
		"zh-CN": "连续输错 5 次后，后台登录会被锁定 10 分钟。",
		en: "Five failed login attempts will lock admin sign-in for 10 minutes.",
	},
	"Confirm Username": { "zh-CN": "确认用户名", en: "Confirm Username" },
	"Current Password": { "zh-CN": "当前密码", en: "Current Password" },
	"New Password": { "zh-CN": "新密码", en: "New Password" },
	"Confirm New Password": { "zh-CN": "确认新密码", en: "Confirm New Password" },
	"Leave blank to keep the current password": {
		"zh-CN": "留空则保持当前密码不变",
		en: "Leave blank to keep the current password",
	},
	"Repeat the new password": {
		"zh-CN": "再次输入新密码",
		en: "Repeat the new password",
	},
	"Save Security Settings": { "zh-CN": "保存安全设置", en: "Save Security Settings" },
	"Security settings updated!": { "zh-CN": "安全设置已更新！", en: "Security settings updated!" },
	"Save failed": { "zh-CN": "保存失败", en: "Save failed" },
	Saving: { "zh-CN": "保存中", en: "Saving" },
	"Saving...": { "zh-CN": "保存中...", en: "Saving..." },
	"Username is required": { "zh-CN": "用户名不能为空", en: "Username is required" },
	"Usernames do not match": { "zh-CN": "两次输入的用户名不一致", en: "Usernames do not match" },
	"Current password is required": { "zh-CN": "请输入当前密码", en: "Current password is required" },
	"Passwords do not match": { "zh-CN": "两次输入的密码不一致", en: "Passwords do not match" },
	"Current password is incorrect": {
		"zh-CN": "当前密码不正确",
		en: "Current password is incorrect",
	},
	"Username is already in use": {
		"zh-CN": "该用户名已被使用",
		en: "Username is already in use",
	},
	"User not found": { "zh-CN": "未找到当前管理员", en: "User not found" },
	"Failed to update credentials": {
		"zh-CN": "更新用户名或密码失败",
		en: "Failed to update credentials",
	},
	Unauthorized: { "zh-CN": "未授权", en: "Unauthorized" },
};

const extendedLiteralTranslations: Record<string, TranslationEntry> = {
	Actions: { "zh-CN": "操作", en: "Actions" },
	Add: { "zh-CN": "添加", en: "Add" },
	"Add Image": { "zh-CN": "添加图片", en: "Add Image" },
	"Add Link": { "zh-CN": "添加链接", en: "Add Link" },
	"Add New": { "zh-CN": "新增", en: "Add New" },
	"Add Track": { "zh-CN": "添加曲目", en: "Add Track" },
	Avatar: { "zh-CN": "头像", en: "Avatar" },
	"About Page": { "zh-CN": "关于页面", en: "About Page" },
	"About page saved!": { "zh-CN": "关于页面已保存！", en: "About page saved!" },
	"About This Site Page": { "zh-CN": "关于本站页面", en: "About This Site Page" },
	"Edit About This Site Page": { "zh-CN": "编辑关于本站页面", en: "Edit About This Site Page" },
	"Open About This Site Page": { "zh-CN": "打开关于本站页面", en: "Open About This Site Page" },
	"About This Site page saved!": { "zh-CN": "关于本站页面已保存！", en: "About This Site page saved!" },
	"Timeline Management": { "zh-CN": "时间线管理", en: "Timeline Management" },
	"New Timeline Entry": { "zh-CN": "新建时间线条目", en: "New Timeline Entry" },
	"Edit Timeline Entry": { "zh-CN": "编辑时间线条目", en: "Edit Timeline Entry" },
	"Timeline Editor": { "zh-CN": "时间线编辑器", en: "Timeline Editor" },
	"Timeline title is required": { "zh-CN": "请输入时间线标题", en: "Timeline title is required" },
	"Please choose a start date": { "zh-CN": "请选择开始日期", en: "Please choose a start date" },
	"End date cannot be earlier than start date": { "zh-CN": "结束日期不能早于开始日期", en: "End date cannot be earlier than start date" },
	"Timeline entry created!": { "zh-CN": "时间线条目已创建！", en: "Timeline entry created!" },
	"Timeline entry updated!": { "zh-CN": "时间线条目已更新！", en: "Timeline entry updated!" },
	"Timeline entry deleted!": { "zh-CN": "时间线条目已删除！", en: "Timeline entry deleted!" },
	"Delete this timeline entry?": { "zh-CN": "确定要删除这条时间线吗？", en: "Delete this timeline entry?" },
	"No timeline entries yet": { "zh-CN": "还没有时间线条目", en: "No timeline entries yet" },
	"Date Range": { "zh-CN": "日期范围", en: "Date Range" },
	Present: { "zh-CN": "至今", en: "Present" },
	"Leave end date empty if this entry is still ongoing.": {
		"zh-CN": "如果这条经历仍在进行中，请将结束日期留空。",
		en: "Leave end date empty if this entry is still ongoing.",
	},
	"Supports Iconify icon names such as material-symbols:work or logos:java.": {
		"zh-CN": "支持 Iconify 图标名称，例如 material-symbols:work 或 logos:java。",
		en: "Supports Iconify icon names such as material-symbols:work or logos:java.",
	},
	"Use a hex color such as #3B82F6.": {
		"zh-CN": "请使用十六进制颜色，例如 #3B82F6。",
		en: "Use a hex color such as #3B82F6.",
	},
	"No skills yet": { "zh-CN": "还没有技能", en: "No skills yet" },
	"No achievements yet": { "zh-CN": "还没有成就", en: "No achievements yet" },
	"No links yet": { "zh-CN": "还没有链接", en: "No links yet" },
	"Enter a skill": { "zh-CN": "输入一个技能", en: "Enter a skill" },
	"Enter an achievement": { "zh-CN": "输入一个成就", en: "Enter an achievement" },
	"ID will be generated automatically from the title when you save.": {
		"zh-CN": "保存时会根据标题自动生成 ID。",
		en: "ID will be generated automatically from the title when you save.",
	},
	"Timeline ID is managed by the system and stays unchanged when you edit.": {
		"zh-CN": "时间线 ID 由系统管理，编辑时不会改变。",
		en: "Timeline ID is managed by the system and stays unchanged when you edit.",
	},
	"The system generates the timeline ID automatically from the title when creating a new entry. Front-end fields like achievements, skills, links, colors, and icons can all be edited here.": {
		"zh-CN": "创建新条目时，系统会根据标题自动生成时间线 ID。前台展示用到的成就、技能、链接、颜色和图标都可以在这里编辑。",
		en: "The system generates the timeline ID automatically from the title when creating a new entry. Front-end fields like achievements, skills, links, colors, and icons can all be edited here.",
	},
	Type: { "zh-CN": "类型", en: "Type" },
	"Start Date": { "zh-CN": "开始日期", en: "Start Date" },
	"End Date": { "zh-CN": "结束日期", en: "End Date" },
	Organization: { "zh-CN": "组织", en: "Organization" },
	Position: { "zh-CN": "职位", en: "Position" },
	Achievements: { "zh-CN": "成就荣誉", en: "Achievements" },
	Links: { "zh-CN": "链接", en: "Links" },
	education: { "zh-CN": "教育", en: "education" },
	work: { "zh-CN": "工作", en: "work" },
	project: { "zh-CN": "项目", en: "project" },
	achievement: { "zh-CN": "成就", en: "achievement" },
	website: { "zh-CN": "网站", en: "website" },
	certificate: { "zh-CN": "证书", en: "certificate" },
	"Back to Posts": { "zh-CN": "返回文章列表", en: "Back to Posts" },
	"Basic Info": { "zh-CN": "基础信息", en: "Basic Info" },
	Bio: { "zh-CN": "简介", en: "Bio" },
	Cancel: { "zh-CN": "取消", en: "Cancel" },
	Category: { "zh-CN": "分类", en: "Category" },
	Close: { "zh-CN": "关闭", en: "Close" },
	Color: { "zh-CN": "颜色", en: "Color" },
	"Color Preview": { "zh-CN": "颜色预览", en: "Color Preview" },
	Content: { "zh-CN": "内容", en: "Content" },
	"Copy Path": { "zh-CN": "复制路径", en: "Copy Path" },
	Cover: { "zh-CN": "封面", en: "Cover" },
	"Cover / Images": { "zh-CN": "封面 / 图片", en: "Cover / Images" },
	"Cover preview": { "zh-CN": "封面预览", en: "Cover preview" },
	"Cover URL": { "zh-CN": "封面 URL", en: "Cover URL" },
	Create: { "zh-CN": "创建", en: "Create" },
	"Create New": { "zh-CN": "新建", en: "Create New" },
	"Create Post": { "zh-CN": "创建文章", en: "Create Post" },
	"Created!": { "zh-CN": "创建成功！", en: "Created!" },
	Date: { "zh-CN": "日期", en: "Date" },
	"Date & Time": { "zh-CN": "日期与时间", en: "Date & Time" },
	Delete: { "zh-CN": "删除", en: "Delete" },
	Del: { "zh-CN": "删", en: "Del" },
	Description: { "zh-CN": "描述", en: "Description" },
	Draft: { "zh-CN": "草稿", en: "Draft" },
	Drafts: { "zh-CN": "草稿数", en: "Drafts" },
	Edit: { "zh-CN": "编辑", en: "Edit" },
	Error: { "zh-CN": "错误", en: "Error" },
	Featured: { "zh-CN": "精选", en: "Featured" },
	Height: { "zh-CN": "高度", en: "Height" },
	Icon: { "zh-CN": "图标", en: "Icon" },
	Image: { "zh-CN": "图片", en: "Image" },
	"Image URL": { "zh-CN": "图片 URL", en: "Image URL" },
	Language: { "zh-CN": "语言", en: "Language" },
	Layout: { "zh-CN": "布局", en: "Layout" },
	Loading: { "zh-CN": "加载中", en: "Loading" },
	"Loading...": { "zh-CN": "加载中...", en: "Loading..." },
	Local: { "zh-CN": "本地", en: "Local" },
	Name: { "zh-CN": "名称", en: "Name" },
	"New Post": { "zh-CN": "新建文章", en: "New Post" },
	"No cover": { "zh-CN": "暂无封面", en: "No cover" },
	"No image": { "zh-CN": "暂无图片", en: "No image" },
	"No items": { "zh-CN": "暂无内容", en: "No items" },
	"No local tracks yet": { "zh-CN": "还没有本地音频", en: "No local tracks yet" },
	"No post images yet": { "zh-CN": "还没有文章图片", en: "No post images yet" },
	"No posts found": { "zh-CN": "没有找到文章", en: "No posts found" },
	"No posts yet": { "zh-CN": "还没有文章", en: "No posts yet" },
	"No tags yet": { "zh-CN": "还没有标签", en: "No tags yet" },
	other: { "zh-CN": "其他", en: "other" },
	Path: { "zh-CN": "路径", en: "Path" },
	"Path or URL": { "zh-CN": "路径或 URL", en: "Path or URL" },
	Pinned: { "zh-CN": "置顶", en: "Pinned" },
	Posts: { "zh-CN": "文章", en: "Posts" },
	Preview: { "zh-CN": "预览", en: "Preview" },
	Published: { "zh-CN": "已发布", en: "Published" },
	"Published Date": { "zh-CN": "发布日期", en: "Published Date" },
	"Recent Posts": { "zh-CN": "最近文章", en: "Recent Posts" },
	"Access Logs": { "zh-CN": "访问记录", en: "Access Logs" },
	"Track public page visits by IP, location, and time. Logs can be cleared anytime.": {
		"zh-CN": "记录前台页面访问的 IP、地理位置和时间，可随时一键清空。",
		en: "Track public page visits by IP, location, and time. Logs can be cleared anytime.",
	},
	"Clear Access Logs": { "zh-CN": "清空访问记录", en: "Clear Access Logs" },
	"IP Address": { "zh-CN": "IP 地址", en: "IP Address" },
	Location: { "zh-CN": "地理位置", en: "Location" },
	"Visited Page": { "zh-CN": "访问页面", en: "Visited Page" },
	"Visited At": { "zh-CN": "访问时间", en: "Visited At" },
	"No access logs yet": { "zh-CN": "还没有访问记录", en: "No access logs yet" },
	Remove: { "zh-CN": "移除", en: "Remove" },
	Save: { "zh-CN": "保存", en: "Save" },
	"Save About Page": { "zh-CN": "保存关于页面", en: "Save About Page" },
	"Save Changes": { "zh-CN": "保存更改", en: "Save Changes" },
	"Saved successfully!": { "zh-CN": "保存成功！", en: "Saved successfully!" },
	"Saved!": { "zh-CN": "已保存！", en: "Saved!" },
	Slug: { "zh-CN": "Slug", en: "Slug" },
	"Social Links": { "zh-CN": "社交链接", en: "Social Links" },
	"Footer Signature": { "zh-CN": "页脚署名", en: "Footer Signature" },
	"Shown after the copyright year in the footer. Leave empty to reuse your profile name.": {
		"zh-CN": "显示在页脚年份后方。留空时会继续使用你的个人名称。",
		en: "Shown after the copyright year in the footer. Leave empty to reuse your profile name.",
	},
	Status: { "zh-CN": "状态", en: "Status" },
	Tags: { "zh-CN": "标签", en: "Tags" },
	Title: { "zh-CN": "标题", en: "Title" },
	Top: { "zh-CN": "顶部", en: "Top" },
	URL: { "zh-CN": "链接", en: "URL" },
	"URL or path": { "zh-CN": "URL 或路径", en: "URL or path" },
	Updated: { "zh-CN": "已更新", en: "Updated" },
	"Updated!": { "zh-CN": "更新成功！", en: "Updated!" },
	Up: { "zh-CN": "上移", en: "Up" },
	Down: { "zh-CN": "下移", en: "Down" },
	Visibility: { "zh-CN": "可见性", en: "Visibility" },
	Visible: { "zh-CN": "显示", en: "Visible" },
	Hidden: { "zh-CN": "隐藏", en: "Hidden" },
	Width: { "zh-CN": "宽度", en: "Width" },
	Yes: { "zh-CN": "是", en: "Yes" },
	No: { "zh-CN": "否", en: "No" },

	"Site Configuration": { "zh-CN": "站点配置", en: "Site Configuration" },
	"Site Start Date": { "zh-CN": "站点开始日期", en: "Site Start Date" },
	"Site Subtitle": { "zh-CN": "网站副标题", en: "Site Subtitle" },
	"Site Title": { "zh-CN": "网站主标题", en: "Site Title" },
	"Theme Color": { "zh-CN": "主题色", en: "Theme Color" },
	"Default Theme Hue": { "zh-CN": "默认主题色相", en: "Default Theme Hue" },
	"Lock theme color picker": { "zh-CN": "锁定主题色选择器", en: "Lock theme color picker" },
	"Turn this on to prevent visitors from changing the theme color.": {
		"zh-CN": "开启后，访客将无法修改主题色。",
		en: "Turn this on to prevent visitors from changing the theme color.",
	},
	"Feature Pages": { "zh-CN": "特色页面", en: "Feature Pages" },
	"Turn off a page to hide its navigation entry. Existing data stays untouched and will show again when you turn it back on.": {
		"zh-CN": "关闭后只会隐藏导航入口，不会删除原有数据；重新开启后会再次显示。",
		en: "Turn off a page to hide its navigation entry. Existing data stays untouched and will show again when you turn it back on.",
	},
	"Overall Layout": { "zh-CN": "整体布局配置", en: "Overall Layout" },
	"Default Wallpaper Mode": { "zh-CN": "默认壁纸模式", en: "Default Wallpaper Mode" },
	"Banner Wallpaper": { "zh-CN": "横幅壁纸", en: "Banner Wallpaper" },
	"Top banner wallpaper layout.": { "zh-CN": "顶部横幅壁纸布局。", en: "Top banner wallpaper layout." },
	"Fullscreen Wallpaper": { "zh-CN": "全屏壁纸", en: "Fullscreen Wallpaper" },
	"Fullscreen wallpaper layout.": { "zh-CN": "全屏壁纸布局。", en: "Fullscreen wallpaper layout." },
	"No Wallpaper": { "zh-CN": "无壁纸", en: "No Wallpaper" },
	"No wallpaper layout.": { "zh-CN": "不显示壁纸布局。", en: "No wallpaper layout." },
	"Wallpaper switch button visibility": { "zh-CN": "壁纸切换按钮显示范围", en: "Wallpaper switch button visibility" },
	Off: { "zh-CN": "关闭", en: "Off" },
	"Do not show the wallpaper mode switch button.": {
		"zh-CN": "不显示壁纸模式切换按钮。",
		en: "Do not show the wallpaper mode switch button.",
	},
	"Mobile only": { "zh-CN": "仅移动端", en: "Mobile only" },
	"Show only on mobile devices.": { "zh-CN": "仅在移动设备上显示。", en: "Show only on mobile devices." },
	"Desktop only": { "zh-CN": "仅桌面端", en: "Desktop only" },
	"Show only on desktop devices.": { "zh-CN": "仅在桌面设备上显示。", en: "Show only on desktop devices." },
	"All devices": { "zh-CN": "所有设备", en: "All devices" },
	"Show on all devices.": { "zh-CN": "在所有设备上显示。", en: "Show on all devices." },
	"Homepage Layout": { "zh-CN": "首页布局配置", en: "Homepage Layout" },
	"Default Post Layout": { "zh-CN": "默认文章布局", en: "Default Post Layout" },
	"List Layout": { "zh-CN": "列表布局", en: "List Layout" },
	"Single-column post list layout.": { "zh-CN": "单列文章列表布局。", en: "Single-column post list layout." },
	"Grid Layout": { "zh-CN": "网格布局", en: "Grid Layout" },
	"Two-column card grid layout.": { "zh-CN": "双列卡片网格布局。", en: "Two-column card grid layout." },
	"Allow visitors to switch post layout": { "zh-CN": "允许访客切换文章布局", en: "Allow visitors to switch post layout" },
	"Turn this off to always use the default layout and hide the layout switch button.": {
		"zh-CN": "关闭后将始终使用默认布局，并隐藏布局切换按钮。",
		en: "Turn this off to always use the default layout and hide the layout switch button.",
	},
	"Use new hover-highlight tag style": { "zh-CN": "使用新版悬停高亮标签样式", en: "Use new hover-highlight tag style" },
	"Turn this on to use the new hover-highlight tag style instead of the always-outlined classic style.": {
		"zh-CN": "开启后使用新版悬停高亮样式，而不是旧版常亮边框样式。",
		en: "Turn this on to use the new hover-highlight tag style instead of the always-outlined classic style.",
	},
	"Table of Contents": { "zh-CN": "目录设置", en: "Table of Contents" },
	"Enable table of contents": { "zh-CN": "启用目录", en: "Enable table of contents" },
	"Turn this off to hide all TOC entry points across the site.": {
		"zh-CN": "关闭后将隐藏整站所有目录入口。",
		en: "Turn this off to hide all TOC entry points across the site.",
	},
	"Show mobile top TOC button": { "zh-CN": "显示移动端顶部目录按钮", en: "Show mobile top TOC button" },
	"Show desktop sidebar TOC": { "zh-CN": "显示桌面端侧边目录", en: "Show desktop sidebar TOC" },
	"Show floating TOC button": { "zh-CN": "显示悬浮目录按钮", en: "Show floating TOC button" },
	"TOC Depth": { "zh-CN": "目录深度", en: "TOC Depth" },
	"Controls how many heading levels are included in the generated table of contents.": {
		"zh-CN": "控制自动生成目录时包含多少级标题。",
		en: "Controls how many heading levels are included in the generated table of contents.",
	},
	"Use Japanese badge markers": { "zh-CN": "使用日语徽标标记", en: "Use Japanese badge markers" },
	"Use Japanese kana badges instead of numeric markers in the TOC widget.": {
		"zh-CN": "在目录组件中使用日语假名标记，而不是数字标记。",
		en: "Use Japanese kana badges instead of numeric markers in the TOC widget.",
	},
	"Page Scaling": { "zh-CN": "页面自动缩放", en: "Page Scaling" },
	"Enable automatic page scaling": { "zh-CN": "启用页面自动缩放", en: "Enable automatic page scaling" },
	"Target Width": { "zh-CN": "目标宽度", en: "Target Width" },
	"Used by the site statistics widget to calculate running days.": {
		"zh-CN": "用于站点统计组件计算运行天数。",
		en: "Used by the site statistics widget to calculate running days.",
	},

	"Banner Background": { "zh-CN": "横幅背景设置", en: "Banner Background" },
	"Desktop Banner Images": { "zh-CN": "桌面端横幅图片", en: "Desktop Banner Images" },
	"Mobile Banner Images": { "zh-CN": "移动端横幅图片", en: "Mobile Banner Images" },
	"Upload local images or paste a path/URL, then preview, reorder or remove them here.": {
		"zh-CN": "可以上传本地图片或填写路径 / URL，并在这里预览、排序和删除。",
		en: "Upload local images or paste a path/URL, then preview, reorder or remove them here.",
	},
	"Upload local images or paste a path/URL for mobile banners. Leave this list empty to reuse desktop images.": {
		"zh-CN": "可以上传本地图片或填写移动端横幅的路径 / URL。留空时会复用桌面端图片。",
		en: "Upload local images or paste a path/URL for mobile banners. Leave this list empty to reuse desktop images.",
	},
	"Upload Images": { "zh-CN": "上传图片", en: "Upload Images" },
	"Images uploaded! You can now preview, reorder or remove them before saving.": {
		"zh-CN": "图片上传成功！现在可以在保存前预览、调整顺序或删除。",
		en: "Images uploaded! You can now preview, reorder or remove them before saving.",
	},
	"Upload successful. Click Save Changes to persist it.": {
		"zh-CN": "上传成功。点击“保存更改”后生效。",
		en: "Upload successful. Click Save Changes to persist it.",
	},
	"Upload failed": { "zh-CN": "上传失败", en: "Upload failed" },
	Uploading: { "zh-CN": "上传中", en: "Uploading" },
	"Uploading...": { "zh-CN": "上传中...", en: "Uploading..." },
	"No images yet": { "zh-CN": "还没有图片", en: "No images yet" },
	"Banner Position": { "zh-CN": "横幅图片位置", en: "Banner Position" },
	Center: { "zh-CN": "居中", en: "Center" },
	Bottom: { "zh-CN": "底部", en: "Bottom" },
	"Align banner images to the top.": { "zh-CN": "将横幅图片对齐到顶部。", en: "Align banner images to the top." },
	"Center banner images vertically.": { "zh-CN": "将横幅图片垂直居中。", en: "Center banner images vertically." },
	"Align banner images to the bottom.": { "zh-CN": "将横幅图片对齐到底部。", en: "Align banner images to the bottom." },
	"Enable Banner Carousel": { "zh-CN": "启用横幅轮播", en: "Enable Banner Carousel" },
	"When enabled, multiple banner images will rotate automatically.": {
		"zh-CN": "开启后，多张横幅图片会自动轮播。",
		en: "When enabled, multiple banner images will rotate automatically.",
	},
	"Carousel Interval (seconds)": { "zh-CN": "轮播间隔（秒）", en: "Carousel Interval (seconds)" },
	"Banner Image API": { "zh-CN": "横幅图片 API", en: "Banner Image API" },
	"Enable banner image API": { "zh-CN": "启用横幅图片 API", en: "Enable banner image API" },
	"Banner Image API URL": { "zh-CN": "横幅图片 API 地址", en: "Banner Image API URL" },
	"Use a text API that returns one image URL per line.": {
		"zh-CN": "使用每行返回一个图片 URL 的文本 API。",
		en: "Use a text API that returns one image URL per line.",
	},
	"Banner Text Overlay": { "zh-CN": "横幅文字覆盖层", en: "Banner Text Overlay" },
	"Enable banner text overlay": { "zh-CN": "启用横幅文字覆盖层", en: "Enable banner text overlay" },
	"Banner Title": { "zh-CN": "横幅标题", en: "Banner Title" },
	"Banner Subtitles": { "zh-CN": "横幅副标题", en: "Banner Subtitles" },
	"Enter one subtitle per line. Multiple lines will be used for the typewriter rotation.": {
		"zh-CN": "每行填写一个副标题，多行会用于打字机轮换显示。",
		en: "Enter one subtitle per line. Multiple lines will be used for the typewriter rotation.",
	},
	"Enable typewriter effect": { "zh-CN": "启用打字机效果", en: "Enable typewriter effect" },
	"Typewriter speed (ms)": { "zh-CN": "打字速度（毫秒）", en: "Typewriter speed (ms)" },
	"Delete speed (ms)": { "zh-CN": "删除速度（毫秒）", en: "Delete speed (ms)" },
	"Pause time (ms)": { "zh-CN": "停顿时间（毫秒）", en: "Pause time (ms)" },
	"Banner Credit": { "zh-CN": "横幅来源信息", en: "Banner Credit" },
	"Show banner credit": { "zh-CN": "显示横幅来源信息", en: "Show banner credit" },
	"Banner Credit Text": { "zh-CN": "来源文字", en: "Banner Credit Text" },
	"Banner Credit URL": { "zh-CN": "来源链接", en: "Banner Credit URL" },
	"Navbar transparency mode": { "zh-CN": "导航栏透明模式", en: "Navbar transparency mode" },
	"Semi Transparent": { "zh-CN": "半透明", en: "Semi Transparent" },
	"Use the classic semi-transparent navbar style.": {
		"zh-CN": "使用经典半透明导航栏样式。",
		en: "Use the classic semi-transparent navbar style.",
	},
	"Fully Transparent": { "zh-CN": "完全透明", en: "Fully Transparent" },
	"Keep the navbar fully transparent over the banner.": {
		"zh-CN": "让导航栏在横幅上方保持完全透明。",
		en: "Keep the navbar fully transparent over the banner.",
	},
	"Dynamic Transparent": { "zh-CN": "动态透明", en: "Dynamic Transparent" },
	"Use the dynamic transparent navbar mode.": {
		"zh-CN": "使用动态透明导航栏模式。",
		en: "Use the dynamic transparent navbar mode.",
	},
	"Wave Effects": { "zh-CN": "波浪效果", en: "Wave Effects" },
	"Enable wave effects": { "zh-CN": "启用波浪效果", en: "Enable wave effects" },
	"Performance mode": { "zh-CN": "性能模式", en: "Performance mode" },
	"Disable waves on mobile": { "zh-CN": "在移动端禁用波浪", en: "Disable waves on mobile" },

	"Fullscreen Wallpaper Settings": { "zh-CN": "全屏壁纸设置", en: "Fullscreen Wallpaper Settings" },
	"Fullscreen Desktop Images": { "zh-CN": "桌面端全屏图片", en: "Fullscreen Desktop Images" },
	"Fullscreen Mobile Images": { "zh-CN": "移动端全屏图片", en: "Fullscreen Mobile Images" },
	"Upload local images or paste a path/URL for desktop fullscreen wallpapers.": {
		"zh-CN": "可以上传本地图片或填写桌面端全屏壁纸的路径 / URL。",
		en: "Upload local images or paste a path/URL for desktop fullscreen wallpapers.",
	},
	"Upload local images or paste a path/URL for mobile fullscreen wallpapers. Leave this list empty to reuse desktop images.": {
		"zh-CN": "可以上传本地图片或填写移动端全屏壁纸的路径 / URL。留空时会复用桌面端图片。",
		en: "Upload local images or paste a path/URL for mobile fullscreen wallpapers. Leave this list empty to reuse desktop images.",
	},
	"Fullscreen Wallpaper Position": { "zh-CN": "全屏壁纸位置", en: "Fullscreen Wallpaper Position" },
	"Enable Fullscreen Wallpaper Carousel": { "zh-CN": "启用全屏壁纸轮播", en: "Enable Fullscreen Wallpaper Carousel" },
	"Fullscreen Carousel Interval (seconds)": { "zh-CN": "全屏轮播间隔（秒）", en: "Fullscreen Carousel Interval (seconds)" },
	"Fullscreen Wallpaper Z-Index": { "zh-CN": "全屏壁纸 Z-Index", en: "Fullscreen Wallpaper Z-Index" },
	"Fullscreen Wallpaper Opacity": { "zh-CN": "全屏壁纸透明度", en: "Fullscreen Wallpaper Opacity" },
	"Fullscreen Wallpaper Blur (px)": { "zh-CN": "全屏壁纸模糊（px）", en: "Fullscreen Wallpaper Blur (px)" },

	"Music Player": { "zh-CN": "音乐播放器", en: "Music Player" },
	"This section only manages the local music player. Online music APIs are intentionally removed here.": {
		"zh-CN": "这里仅管理本地音乐播放器，在线音乐 API 已从后台设置中移除。",
		en: "This section only manages the local music player. Online music APIs are intentionally removed here.",
	},
	"Show music player on the front end": { "zh-CN": "在前台显示音乐播放器", en: "Show music player on the front end" },
	"Show sidebar music widget": { "zh-CN": "显示侧边栏音乐组件", en: "Show sidebar music widget" },
	"Show floating music player": { "zh-CN": "显示悬浮音乐播放器", en: "Show floating music player" },
	"Allow playlist panel on the front end": { "zh-CN": "允许前台显示播放列表面板", en: "Allow playlist panel on the front end" },
	"Enable shuffle mode by default": { "zh-CN": "默认启用随机播放", en: "Enable shuffle mode by default" },
	"Expand player UI by default": { "zh-CN": "默认展开播放器界面", en: "Expand player UI by default" },
	"Floating entry mode": { "zh-CN": "悬浮入口模式", en: "Floating entry mode" },
	"FAB group": { "zh-CN": "FAB 按钮组", en: "FAB group" },
	"Standalone player": { "zh-CN": "独立播放器", en: "Standalone player" },
	"Default Volume": { "zh-CN": "默认音量", en: "Default Volume" },
	"Local Playlist": { "zh-CN": "本地播放列表", en: "Local Playlist" },
	"Upload Audio Files": { "zh-CN": "上传音频文件", en: "Upload Audio Files" },
	"Upload local audio files in bulk, then adjust title, artist, cover and order below. The list order here is the playback order when shuffle is off.": {
		"zh-CN": "可以批量上传本地音频文件，再在下方调整标题、歌手、封面和顺序。关闭随机播放时，这里的顺序就是实际播放顺序。",
		en: "Upload local audio files in bulk, then adjust title, artist, cover and order below. The list order here is the playback order when shuffle is off.",
	},
	Track: { "zh-CN": "曲目", en: "Track" },
	Artist: { "zh-CN": "歌手", en: "Artist" },
	"Audio File URL": { "zh-CN": "音频文件地址", en: "Audio File URL" },
	"Audio files uploaded. Edit the titles and artist names if needed, then click Save Changes.": {
		"zh-CN": "音频文件上传成功。如有需要请继续编辑标题和歌手，然后点击“保存更改”。",
		en: "Audio files uploaded. Edit the titles and artist names if needed, then click Save Changes.",
	},
	"Duration (seconds)": { "zh-CN": "时长（秒）", en: "Duration (seconds)" },
	"Duration is detected automatically after you upload or update the audio file URL.": {
		"zh-CN": "上传音频或修改音频地址后，系统会自动识别时长。",
		en: "Duration is detected automatically after you upload or update the audio file URL.",
	},
	"No audio uploaded yet": { "zh-CN": "还没有上传音频", en: "No audio uploaded yet" },

	"Font Settings": { "zh-CN": "字体设置", en: "Font Settings" },
	"Available Fonts": { "zh-CN": "可用字体", en: "Available Fonts" },
	"Upload Font Files": { "zh-CN": "上传字体文件", en: "Upload Font Files" },
	"Font files uploaded. Select one and click Save Changes to apply.": {
		"zh-CN": "字体文件上传成功。选择一个字体并点击“保存更改”后生效。",
		en: "Font files uploaded. Select one and click Save Changes to apply.",
	},
	"ASCII Font": { "zh-CN": "ASCII 字体", en: "ASCII Font" },
	"CJK Font": { "zh-CN": "中日韩字体", en: "CJK Font" },
	"Active Font File": { "zh-CN": "当前字体文件", en: "Active Font File" },
	"Font Family Name": { "zh-CN": "字体族名称", en: "Font Family Name" },
	"Font Weight": { "zh-CN": "字重", en: "Font Weight" },
	"Enable font compression": { "zh-CN": "启用字体压缩", en: "Enable font compression" },
	woff2: { "zh-CN": "woff2", en: "woff2" },

	"Post Display": { "zh-CN": "文章显示", en: "Post Display" },
	"Show last modified card below posts": { "zh-CN": "在文章底部显示最后修改时间卡片", en: "Show last modified card below posts" },

	"Open About Page": { "zh-CN": "打开关于页面", en: "Open About Page" },
	"Edit About Page": { "zh-CN": "编辑关于页面", en: "Edit About Page" },
	"Edit the Markdown content shown when visitors open the About page from your avatar.": {
		"zh-CN": "编辑访客点击头像后打开的 About 页面 Markdown 内容。",
		en: "Edit the Markdown content shown when visitors open the About page from your avatar.",
	},
	"Supports Markdown. Content is saved to src/content/spec/about.md.": {
		"zh-CN": "支持 Markdown，内容会保存到 src/content/spec/about.md。",
		en: "Supports Markdown. Content is saved to src/content/spec/about.md.",
	},
	"Edit the Markdown content shown when visitors open the About This Site page from the navigation menu.": {
		"zh-CN": "编辑访客从顶部导航菜单打开“关于本站”时看到的 Markdown 内容。",
		en: "Edit the Markdown content shown when visitors open the About This Site page from the navigation menu.",
	},
	"Supports Markdown. Content is saved to src/content/spec/about-site.md.": {
		"zh-CN": "支持 Markdown，内容会保存到 src/content/spec/about-site.md。",
		en: "Supports Markdown. Content is saved to src/content/spec/about-site.md.",
	},

	"Are you sure you want to delete this post?": { "zh-CN": "确定要删除这篇文章吗？", en: "Are you sure you want to delete this post?" },
	"Post Images": { "zh-CN": "文章图片", en: "Post Images" },
	"Save this post first to start managing content images.": {
		"zh-CN": "请先保存这篇文章，再开始管理正文图片。",
		en: "Save this post first to start managing content images.",
	},
	"Upload content images for this post, preview them here, then copy the path into your Markdown.": {
		"zh-CN": "在这里上传这篇文章的正文图片、预览图片，然后复制路径插入到 Markdown 中。",
		en: "Upload content images for this post, preview them here, then copy the path into your Markdown.",
	},
	"Post images uploaded. Copy the path below and insert it into your Markdown.": {
		"zh-CN": "文章图片上传成功。复制下方路径并插入到 Markdown 中即可。",
		en: "Post images uploaded. Copy the path below and insert it into your Markdown.",
	},
	"Image path copied": { "zh-CN": "图片路径已复制", en: "Image path copied" },
	"Failed to copy image path": { "zh-CN": "复制图片路径失败", en: "Failed to copy image path" },
	"Failed to load post assets": { "zh-CN": "加载文章素材失败", en: "Failed to load post assets" },
	"Write your post in Markdown...": { "zh-CN": "使用 Markdown 编写文章内容...", en: "Write your post in Markdown..." },
	Encrypted: { "zh-CN": "加密", en: "Encrypted" },
	"Password Hint": { "zh-CN": "密码提示", en: "Password Hint" },
	"Encrypted posts require a password": { "zh-CN": "加密文章需要设置密码", en: "Encrypted posts require a password" },
	"Encrypted posts will show a password unlock box on the front end.": {
		"zh-CN": "加密文章会在前台显示密码解锁框。",
		en: "Encrypted posts will show a password unlock box on the front end.",
	},
	"Required to unlock this post": { "zh-CN": "用于解锁这篇文章", en: "Required to unlock this post" },
	"Optional hint shown to readers": { "zh-CN": "可选，展示给读者的提示信息", en: "Optional hint shown to readers" },
	"Update Post": { "zh-CN": "更新文章", en: "Update Post" },
	"Auto-generated after saving": { "zh-CN": "保存后自动生成", en: "Auto-generated after saving" },

	"Image uploaded!": { "zh-CN": "图片上传成功！", en: "Image uploaded!" },
	"Image uploaded. Click Save to persist it.": { "zh-CN": "图片上传成功。点击保存后生效。", en: "Image uploaded. Click Save to persist it." },
	"Images uploaded! The first image will be used as the cover.": {
		"zh-CN": "图片上传成功！第一张图片会作为封面。",
		en: "Images uploaded! The first image will be used as the cover.",
	},
	"Delete this item?": { "zh-CN": "确定要删除这条内容吗？", en: "Delete this item?" },
	"Delete this diary entry?": { "zh-CN": "确定要删除这条日记吗？", en: "Delete this diary entry?" },
	"Delete this album?": { "zh-CN": "确定要删除这个相册吗？", en: "Delete this album?" },
	"Delete this skill?": { "zh-CN": "确定要删除这个技能吗？", en: "Delete this skill?" },
};

const literalTranslationOverrides: Record<string, TranslationEntry> = {
	"Album Management": { "zh-CN": "相册管理", en: "Album Management" },
	"Manage local and external albums. Local albums store files in public/images/albums/<id>/.": {
		"zh-CN": "管理本地相册和外链相册。本地相册文件会存放在 public/images/albums/<id>/ 目录中。",
		en: "Manage local and external albums. Local albums store files in public/images/albums/<id>/.",
	},
	"Album Editor": { "zh-CN": "相册编辑器", en: "Album Editor" },
	"New Album": { "zh-CN": "新建相册", en: "New Album" },
	"Album created!": { "zh-CN": "相册已创建！", en: "Album created!" },
	"Album updated!": { "zh-CN": "相册已更新！", en: "Album updated!" },
	"Album deleted!": { "zh-CN": "相册已删除！", en: "Album deleted!" },
	"Loading albums...": { "zh-CN": "正在加载相册...", en: "Loading albums..." },
	"Failed to load albums": { "zh-CN": "加载相册失败", en: "Failed to load albums" },
	"Diary Management": { "zh-CN": "日记管理", en: "Diary Management" },
	"ID is generated automatically. The first image is used as the cover on the front end.": {
		"zh-CN": "ID 会自动生成，第一张图片会作为前台封面图使用。",
		en: "ID is generated automatically. The first image is used as the cover on the front end.",
	},
	"New Diary Entry": { "zh-CN": "新建日记", en: "New Diary Entry" },
	"Skill Management": { "zh-CN": "技能管理", en: "Skill Management" },
	"The system generates the skill ID automatically from the skill name. Existing skills keep their current ID when edited.": {
		"zh-CN": "系统会根据技能名称自动生成技能 ID。编辑已有技能时会保留当前 ID 不变。",
		en: "The system generates the skill ID automatically from the skill name. Existing skills keep their current ID when edited.",
	},
	"New Skill": { "zh-CN": "新建技能", en: "New Skill" },
	Gallery: { "zh-CN": "相册", en: "Gallery" },
	"Upload one or more local font files. TTF works best with build-time compression.": {
		"zh-CN": "上传一个或多个本地字体文件。TTF 最适合构建时压缩处理。",
		en: "Upload one or more local font files. TTF works best with build-time compression.",
	},
	"The page starts scaling when the viewport width is smaller than this value.": {
		"zh-CN": "当页面宽度小于这个值时，会开始自动缩放。",
		en: "The page starts scaling when the viewport width is smaller than this value.",
	},
	Episodes: { "zh-CN": "集数", en: "Episodes" },
	Year: { "zh-CN": "年份", en: "Year" },
	Genre: { "zh-CN": "类型", en: "Genre" },
	Studio: { "zh-CN": "制作公司", en: "Studio" },
	Link: { "zh-CN": "链接", en: "Link" },
	Progress: { "zh-CN": "进度", en: "Progress" },
	"Total Episodes": { "zh-CN": "总集数", en: "Total Episodes" },
	Footprints: { "zh-CN": "足迹", en: "Footprints" },
	"Place Name": { "zh-CN": "地点名称", en: "Place Name" },
	"Footprint Management": { "zh-CN": "足迹管理", en: "Footprint Management" },
	"Select a country and administrative region. The system will automatically locate and mark the place on the map.": {
		"zh-CN": "选择国家和行政区后，系统会自动定位并在地图上标注这个地点。",
		en: "Select a country and administrative region. The system will automatically locate and mark the place on the map.",
	},
	"New Footprint": { "zh-CN": "新建足迹", en: "New Footprint" },
	"Edit Footprint": { "zh-CN": "编辑足迹", en: "Edit Footprint" },
	"Administrative Region": { "zh-CN": "行政区", en: "Administrative Region" },
	"Loading countries...": { "zh-CN": "正在加载国家...", en: "Loading countries..." },
	"Select a country": { "zh-CN": "请选择国家", en: "Select a country" },
	"Loading administrative regions...": {
		"zh-CN": "正在加载行政区...",
		en: "Loading administrative regions...",
	},
	"Select an administrative region": {
		"zh-CN": "请选择行政区",
		en: "Select an administrative region",
	},
	"Please choose a country": { "zh-CN": "请选择国家", en: "Please choose a country" },
	"Please choose an administrative region": {
		"zh-CN": "请选择行政区",
		en: "Please choose an administrative region",
	},
	"Failed to load footprint options": {
		"zh-CN": "加载足迹地点选项失败",
		en: "Failed to load footprint options",
	},
	"Failed to load administrative regions": {
		"zh-CN": "加载行政区失败",
		en: "Failed to load administrative regions",
	},
	"Footprint created!": { "zh-CN": "足迹创建成功！", en: "Footprint created!" },
	"Footprint updated!": { "zh-CN": "足迹更新成功！", en: "Footprint updated!" },
	"Footprint deleted!": { "zh-CN": "足迹删除成功！", en: "Footprint deleted!" },
	"Delete this footprint?": { "zh-CN": "确定要删除这条足迹吗？", en: "Delete this footprint?" },
	"No footprints yet": { "zh-CN": "还没有足迹记录", en: "No footprints yet" },
	"Optional notes about this trip": {
		"zh-CN": "可选：补充这次足迹的备注",
		en: "Optional notes about this trip",
	},
	Country: { "zh-CN": "国家", en: "Country" },
	Province: { "zh-CN": "省 / 州", en: "Province" },
	City: { "zh-CN": "城市", en: "City" },
	Latitude: { "zh-CN": "纬度", en: "Latitude" },
	Longitude: { "zh-CN": "经度", en: "Longitude" },
	"Visited Date": { "zh-CN": "到访日期", en: "Visited Date" },
	Notes: { "zh-CN": "备注", en: "Notes" },
};

const mergedLiteralTranslations: Record<string, TranslationEntry> = {
	...literalTranslations,
	...extendedLiteralTranslations,
	...literalTranslationOverrides,
};

const keyTranslations: Record<string, TranslationEntry> = {
	"brand.admin": { "zh-CN": "Mizuki 后台", en: "Mizuki Admin" },
	"layout.documentTitle": { "zh-CN": "{title} - Mizuki 后台", en: "{title} - Mizuki Admin" },
	"post.editTitle": { "zh-CN": "编辑文章：{title}", en: "Edit: {title}" },
	"dataTable.saveFailedStatus": { "zh-CN": "保存失败（{status}）", en: "Save failed ({status})" },
	"auth.loginLocked": {
		"zh-CN": "连续输错 5 次后已被锁定，请在 {time} 后重试",
		en: "Too many failed login attempts. Try again in {time}.",
	},
};

function normalizeAdminLanguage(value: string | null | undefined): AdminLanguage {
	return value === "en" ? "en" : "zh-CN";
}

function renderTemplate(
	template: string,
	params?: Record<string, string | number>,
): string {
	if (!params) {
		return template;
	}

	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = params[key];
		return value === undefined || value === null ? "" : String(value);
	});
}

function getEntryText(
	entry: TranslationEntry | undefined,
	lang: AdminLanguage,
	fallback: string,
): string {
	if (!entry) {
		return fallback;
	}

	return entry[lang] ?? entry[defaultAdminLanguage] ?? fallback;
}

export function translateAdminLiteral(lang: AdminLanguage, literal: string): string {
	return getEntryText(mergedLiteralTranslations[literal], lang, literal);
}

export function translateAdminKey(
	lang: AdminLanguage,
	key: string,
	params?: Record<string, string | number>,
): string {
	const template = getEntryText(keyTranslations[key], lang, key);
	return renderTemplate(template, params);
}

export function formatAdminDate(value: string, lang: AdminLanguage): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function getAdminLanguage(): AdminLanguage {
	if (typeof window === "undefined") {
		return defaultAdminLanguage;
	}

	try {
		return normalizeAdminLanguage(window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY));
	} catch {
		return defaultAdminLanguage;
	}
}

export function setAdminLanguage(lang: AdminLanguage): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, lang);
	} catch {
		// Ignore storage errors and still notify listeners.
	}

	window.dispatchEvent(new CustomEvent<AdminLanguage>("admin-language-change", { detail: lang }));
}

export function onAdminLanguageChange(callback: (lang: AdminLanguage) => void): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}

	const handler = (event: Event) => {
		const nextLang =
			event instanceof CustomEvent
				? normalizeAdminLanguage(event.detail)
				: getAdminLanguage();
		callback(nextLang);
	};

	window.addEventListener("admin-language-change", handler);
	return () => window.removeEventListener("admin-language-change", handler);
}

function parseParams(raw: string | null): Record<string, string | number> | undefined {
	if (!raw) {
		return undefined;
	}

	try {
		const parsed = JSON.parse(raw) as Record<string, string | number>;
		return parsed && typeof parsed === "object" ? parsed : undefined;
	} catch {
		return undefined;
	}
}

export function applyAdminTranslations(
	root: ParentNode = document,
	lang: AdminLanguage = getAdminLanguage(),
): void {
	if (typeof document === "undefined") {
		return;
	}

	const elements = root.querySelectorAll<HTMLElement>("[data-admin-i18n-literal], [data-admin-i18n-key]");
	for (const element of elements) {
		const key = element.dataset.adminI18nKey;
		const literal = element.dataset.adminI18nLiteral;
		const params = parseParams(element.dataset.adminI18nParams ?? null);
		const text = key
			? translateAdminKey(lang, key, params)
			: translateAdminLiteral(lang, literal ?? "");

		element.textContent = text;
	}
}
