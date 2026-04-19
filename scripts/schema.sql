CREATE TABLE IF NOT EXISTS admin_users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL,
	expires_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_security (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	failed_attempts INTEGER NOT NULL DEFAULT 0,
	lock_until TEXT
);

CREATE TABLE IF NOT EXISTS visitor_ip_geo_cache (
	ip TEXT PRIMARY KEY,
	country_code TEXT NOT NULL DEFAULT '',
	country_name TEXT NOT NULL DEFAULT '',
	region TEXT NOT NULL DEFAULT '',
	city TEXT NOT NULL DEFAULT '',
	fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visitor_access_logs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ip TEXT NOT NULL,
	path TEXT NOT NULL DEFAULT '/',
	country_code TEXT NOT NULL DEFAULT '',
	country_name TEXT NOT NULL DEFAULT '',
	region TEXT NOT NULL DEFAULT '',
	city TEXT NOT NULL DEFAULT '',
	visited_at TEXT NOT NULL,
	user_agent TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS profile (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	name TEXT NOT NULL DEFAULT '',
	bio TEXT NOT NULL DEFAULT '',
	avatar_path TEXT NOT NULL DEFAULT '',
	footer_name TEXT NOT NULL DEFAULT '',
	links TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS site_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	site_enabled INTEGER NOT NULL DEFAULT 1,
	last_admin_login_at TEXT,
	title TEXT NOT NULL DEFAULT 'Mizuki',
	subtitle TEXT NOT NULL DEFAULT 'One demo website',
	site_start_date TEXT NOT NULL DEFAULT '2025-01-01',
	theme_color_hue INTEGER NOT NULL DEFAULT 240,
	theme_color_fixed INTEGER NOT NULL DEFAULT 0,
	feature_anime INTEGER NOT NULL DEFAULT 1,
	feature_diary INTEGER NOT NULL DEFAULT 1,
	feature_friends INTEGER NOT NULL DEFAULT 1,
	feature_projects INTEGER NOT NULL DEFAULT 1,
	feature_skills INTEGER NOT NULL DEFAULT 1,
	feature_timeline INTEGER NOT NULL DEFAULT 1,
	feature_albums INTEGER NOT NULL DEFAULT 1,
	feature_devices INTEGER NOT NULL DEFAULT 1,
	banner_settings_json TEXT NOT NULL DEFAULT '{}',
	fullscreen_wallpaper_settings_json TEXT NOT NULL DEFAULT '{}',
	wallpaper_default_mode TEXT NOT NULL DEFAULT 'banner',
	wallpaper_mode_switch_display TEXT NOT NULL DEFAULT 'desktop',
	post_list_default_mode TEXT NOT NULL DEFAULT 'list',
	post_list_allow_switch INTEGER NOT NULL DEFAULT 1,
	tag_style_use_new_style INTEGER NOT NULL DEFAULT 0,
	toc_enable INTEGER NOT NULL DEFAULT 1,
	toc_mobile_top INTEGER NOT NULL DEFAULT 1,
	toc_desktop_sidebar INTEGER NOT NULL DEFAULT 1,
	toc_floating INTEGER NOT NULL DEFAULT 1,
	toc_depth INTEGER NOT NULL DEFAULT 2,
	toc_use_japanese_badge INTEGER NOT NULL DEFAULT 1,
	page_scaling_enable INTEGER NOT NULL DEFAULT 1,
	page_scaling_target_width INTEGER NOT NULL DEFAULT 2000,
	navbar_title_mode TEXT NOT NULL DEFAULT 'text-icon',
	navbar_title_text TEXT NOT NULL DEFAULT 'MizukiUI',
	navbar_title_icon TEXT NOT NULL DEFAULT 'assets/home/home.webp',
	navbar_title_logo TEXT NOT NULL DEFAULT 'assets/home/default-logo.webp',
	font_ascii_file TEXT NOT NULL DEFAULT 'ZenMaruGothic-Medium.ttf',
	font_ascii_family TEXT NOT NULL DEFAULT 'ZenMaruGothic-Medium',
	font_ascii_weight TEXT NOT NULL DEFAULT '400',
	font_ascii_enable_compress INTEGER NOT NULL DEFAULT 1,
	font_cjk_file TEXT NOT NULL DEFAULT 'loli.ttf',
	font_cjk_family TEXT NOT NULL DEFAULT '萝莉体 第二版',
	font_cjk_weight TEXT NOT NULL DEFAULT '500',
	font_cjk_enable_compress INTEGER NOT NULL DEFAULT 1,
	announcement_position TEXT NOT NULL DEFAULT 'top',
	announcement_animation_delay INTEGER NOT NULL DEFAULT 50,
	show_last_modified INTEGER NOT NULL DEFAULT 1,
	music_settings_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	content_md TEXT NOT NULL DEFAULT '',
	content_html TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	image TEXT NOT NULL DEFAULT '',
	category TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]',
	published TEXT NOT NULL,
	updated TEXT,
	draft INTEGER NOT NULL DEFAULT 0,
	pinned INTEGER NOT NULL DEFAULT 0,
	priority INTEGER,
	comment INTEGER NOT NULL DEFAULT 1,
	author TEXT NOT NULL DEFAULT '',
	source_link TEXT NOT NULL DEFAULT '',
	license_name TEXT NOT NULL DEFAULT '',
	license_url TEXT NOT NULL DEFAULT '',
	lang TEXT NOT NULL DEFAULT '',
	encrypted INTEGER NOT NULL DEFAULT 0,
	password TEXT NOT NULL DEFAULT '',
	password_hint TEXT NOT NULL DEFAULT '',
	alias TEXT,
	permalink TEXT
);

CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	image TEXT NOT NULL DEFAULT '',
	category TEXT NOT NULL DEFAULT 'other',
	tech_stack TEXT NOT NULL DEFAULT '[]',
	status TEXT NOT NULL DEFAULT 'planned',
	live_demo TEXT,
	source_code TEXT,
	visit_url TEXT,
	start_date TEXT,
	end_date TEXT,
	featured INTEGER NOT NULL DEFAULT 0,
	tags TEXT NOT NULL DEFAULT '[]',
	show_image INTEGER NOT NULL DEFAULT 1,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS friends (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	imgurl TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	siteurl TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]',
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tools (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	imgurl TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	siteurl TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]',
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS footprints (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	country TEXT NOT NULL DEFAULT '',
	province TEXT NOT NULL DEFAULT '',
	city TEXT NOT NULL DEFAULT '',
	latitude REAL NOT NULL DEFAULT 0,
	longitude REAL NOT NULL DEFAULT 0,
	visited_at TEXT NOT NULL DEFAULT '',
	notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS announcements (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL DEFAULT '',
	content TEXT NOT NULL DEFAULT '',
	closable INTEGER NOT NULL DEFAULT 1,
	link_enable INTEGER NOT NULL DEFAULT 0,
	link_text TEXT NOT NULL DEFAULT '',
	link_url TEXT NOT NULL DEFAULT '',
	link_external INTEGER NOT NULL DEFAULT 0,
	pinned INTEGER NOT NULL DEFAULT 0,
	position TEXT NOT NULL DEFAULT 'top',
	animation_delay INTEGER NOT NULL DEFAULT 50,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	icon TEXT NOT NULL DEFAULT '',
	category TEXT NOT NULL DEFAULT 'other',
	level TEXT NOT NULL DEFAULT 'beginner',
	experience_years INTEGER NOT NULL DEFAULT 0,
	experience_months INTEGER NOT NULL DEFAULT 0,
	projects TEXT NOT NULL DEFAULT '[]',
	certifications TEXT NOT NULL DEFAULT '[]',
	color TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS timeline (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	type TEXT NOT NULL DEFAULT 'project',
	start_date TEXT NOT NULL,
	end_date TEXT,
	location TEXT,
	organization TEXT,
	position TEXT,
	skills TEXT NOT NULL DEFAULT '[]',
	achievements TEXT NOT NULL DEFAULT '[]',
	links TEXT NOT NULL DEFAULT '[]',
	icon TEXT,
	color TEXT,
	featured INTEGER NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS diary (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT NOT NULL DEFAULT '',
	date TEXT NOT NULL,
	images TEXT NOT NULL DEFAULT '[]',
	location TEXT,
	mood TEXT,
	tags TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS anime (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'planned',
	rating REAL NOT NULL DEFAULT 0,
	cover TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	episodes TEXT NOT NULL DEFAULT '',
	year TEXT NOT NULL DEFAULT '',
	genre TEXT NOT NULL DEFAULT '[]',
	studio TEXT NOT NULL DEFAULT '',
	link TEXT NOT NULL DEFAULT '',
	progress INTEGER NOT NULL DEFAULT 0,
	total_episodes INTEGER NOT NULL DEFAULT 0,
	start_date TEXT,
	end_date TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS devices (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	category_name TEXT NOT NULL DEFAULT '',
	name TEXT NOT NULL,
	image TEXT NOT NULL DEFAULT '',
	specs TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	link TEXT NOT NULL DEFAULT '',
	sort_order INTEGER NOT NULL DEFAULT 0
);
