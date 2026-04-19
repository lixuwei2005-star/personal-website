import type Database from "better-sqlite3";

function hasColumn(
	db: Database.Database,
	tableName: string,
	columnName: string,
): boolean {
	const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
		name: string;
	}>;
	return columns.some((column) => column.name === columnName);
}

function ensureColumn(
	db: Database.Database,
	tableName: string,
	columnName: string,
	columnDefinition: string,
): void {
	if (!hasColumn(db, tableName, columnName)) {
		db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
	}
}

export function runMigrations(db: Database.Database): void {
	const announcementsTableExistedBefore = Boolean(
		db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'announcements'",
			)
			.get(),
	);

	db.exec(`
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
			show_last_modified INTEGER NOT NULL DEFAULT 1
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
	`);

	ensureColumn(
		db,
		"profile",
		"footer_name",
		"footer_name TEXT NOT NULL DEFAULT ''",
	);

	ensureColumn(
		db,
		"site_settings",
		"site_enabled",
		"site_enabled INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"last_admin_login_at",
		"last_admin_login_at TEXT",
	);
	ensureColumn(
		db,
		"site_settings",
		"title",
		"title TEXT NOT NULL DEFAULT 'Mizuki'",
	);
	ensureColumn(
		db,
		"site_settings",
		"subtitle",
		"subtitle TEXT NOT NULL DEFAULT 'One demo website'",
	);
	ensureColumn(
		db,
		"site_settings",
		"site_start_date",
		"site_start_date TEXT NOT NULL DEFAULT '2025-01-01'",
	);
	ensureColumn(
		db,
		"site_settings",
		"theme_color_hue",
		"theme_color_hue INTEGER NOT NULL DEFAULT 240",
	);
	ensureColumn(
		db,
		"site_settings",
		"theme_color_fixed",
		"theme_color_fixed INTEGER NOT NULL DEFAULT 0",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_anime",
		"feature_anime INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_diary",
		"feature_diary INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_friends",
		"feature_friends INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_projects",
		"feature_projects INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_skills",
		"feature_skills INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_timeline",
		"feature_timeline INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_albums",
		"feature_albums INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"feature_devices",
		"feature_devices INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"banner_settings_json",
		"banner_settings_json TEXT NOT NULL DEFAULT '{}'",
	);
	ensureColumn(
		db,
		"site_settings",
		"fullscreen_wallpaper_settings_json",
		"fullscreen_wallpaper_settings_json TEXT NOT NULL DEFAULT '{}'",
	);
	ensureColumn(
		db,
		"site_settings",
		"wallpaper_default_mode",
		"wallpaper_default_mode TEXT NOT NULL DEFAULT 'banner'",
	);
	ensureColumn(
		db,
		"site_settings",
		"wallpaper_mode_switch_display",
		"wallpaper_mode_switch_display TEXT NOT NULL DEFAULT 'desktop'",
	);
	ensureColumn(
		db,
		"site_settings",
		"post_list_default_mode",
		"post_list_default_mode TEXT NOT NULL DEFAULT 'list'",
	);
	ensureColumn(
		db,
		"site_settings",
		"post_list_allow_switch",
		"post_list_allow_switch INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"tag_style_use_new_style",
		"tag_style_use_new_style INTEGER NOT NULL DEFAULT 0",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_enable",
		"toc_enable INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_mobile_top",
		"toc_mobile_top INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_desktop_sidebar",
		"toc_desktop_sidebar INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_floating",
		"toc_floating INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_depth",
		"toc_depth INTEGER NOT NULL DEFAULT 2",
	);
	ensureColumn(
		db,
		"site_settings",
		"toc_use_japanese_badge",
		"toc_use_japanese_badge INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"page_scaling_enable",
		"page_scaling_enable INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"page_scaling_target_width",
		"page_scaling_target_width INTEGER NOT NULL DEFAULT 2000",
	);
	ensureColumn(
		db,
		"site_settings",
		"navbar_title_mode",
		"navbar_title_mode TEXT NOT NULL DEFAULT 'text-icon'",
	);
	ensureColumn(
		db,
		"site_settings",
		"navbar_title_text",
		"navbar_title_text TEXT NOT NULL DEFAULT 'MizukiUI'",
	);
	ensureColumn(
		db,
		"site_settings",
		"navbar_title_icon",
		"navbar_title_icon TEXT NOT NULL DEFAULT 'assets/home/home.webp'",
	);
	ensureColumn(
		db,
		"site_settings",
		"navbar_title_logo",
		"navbar_title_logo TEXT NOT NULL DEFAULT 'assets/home/default-logo.webp'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_ascii_file",
		"font_ascii_file TEXT NOT NULL DEFAULT 'ZenMaruGothic-Medium.ttf'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_ascii_family",
		"font_ascii_family TEXT NOT NULL DEFAULT 'ZenMaruGothic-Medium'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_ascii_weight",
		"font_ascii_weight TEXT NOT NULL DEFAULT '400'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_ascii_enable_compress",
		"font_ascii_enable_compress INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_cjk_file",
		"font_cjk_file TEXT NOT NULL DEFAULT 'loli.ttf'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_cjk_family",
		"font_cjk_family TEXT NOT NULL DEFAULT '萝莉体 第二版'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_cjk_weight",
		"font_cjk_weight TEXT NOT NULL DEFAULT '500'",
	);
	ensureColumn(
		db,
		"site_settings",
		"font_cjk_enable_compress",
		"font_cjk_enable_compress INTEGER NOT NULL DEFAULT 1",
	);
	ensureColumn(
		db,
		"site_settings",
		"announcement_position",
		"announcement_position TEXT NOT NULL DEFAULT 'top'",
	);
	ensureColumn(
		db,
		"site_settings",
		"announcement_animation_delay",
		"announcement_animation_delay INTEGER NOT NULL DEFAULT 50",
	);
	ensureColumn(
		db,
		"site_settings",
		"music_settings_json",
		"music_settings_json TEXT NOT NULL DEFAULT '{}'",
	);

	// Ensure profile row exists
	const profile = db.prepare("SELECT id FROM profile WHERE id = 1").get();
	if (!profile) {
		db.prepare("INSERT INTO profile (id, name, bio, avatar_path, footer_name, links) VALUES (1, '', '', '', '', '[]')").run();
	}

	const siteSettings = db
		.prepare("SELECT id FROM site_settings WHERE id = 1")
		.get();
	if (!siteSettings) {
		db.prepare(
			"INSERT INTO site_settings (id, site_enabled, show_last_modified) VALUES (1, 1, 1)",
		).run();
	}

	const loginSecurity = db
		.prepare("SELECT id FROM login_security WHERE id = 1")
		.get();
	if (!loginSecurity) {
		db.prepare(
			"INSERT INTO login_security (id, failed_attempts, lock_until) VALUES (1, 0, NULL)",
		).run();
	}

	const announcementCount = db
		.prepare("SELECT COUNT(*) as count FROM announcements")
		.get() as { count: number };
	if (!announcementsTableExistedBefore && announcementCount.count === 0) {
		db.prepare(
			`INSERT INTO announcements (
				title,
				content,
				closable,
				link_enable,
				link_text,
				link_url,
				link_external,
				pinned,
				position,
				animation_delay,
				sort_order
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run(
			"",
			"ブログへようこそ！これはサンプルの告知です",
			1,
			1,
			"Learn More",
			"/about/",
			0,
			1,
			"top",
			50,
			0,
		);
	}
}
