/**
 * Seed database from existing static data files.
 * Run once during migration: node scripts/seed-db.mjs
 */
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "site.db");

// Ensure data dir
const dir = path.dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run migrations inline (same as migrate.ts but for plain JS)
db.exec(readFileSync(path.join(ROOT, "scripts", "schema.sql"), "utf-8"));

// Ensure profile row
const profile = db.prepare("SELECT id FROM profile WHERE id = 1").get();
if (!profile) {
	db.prepare("INSERT INTO profile (id, name, bio, avatar_path, links) VALUES (1, '', '', '', '[]')").run();
}

console.log("Database initialized at:", DB_PATH);

// ── Seed Profile ──
const profileLinks = [
	{ name: "Bilibili", icon: "fa7-brands:bilibili", url: "https://space.bilibili.com/701864046" },
	{ name: "Gitee", icon: "mdi:git", url: "https://gitee.com/matsuzakayuki" },
	{ name: "GitHub", icon: "fa7-brands:github", url: "https://github.com/matsuzaka-yuki" },
	{ name: "Codeberg", icon: "simple-icons:codeberg", url: "https://codeberg.org" },
	{ name: "Discord", icon: "fa7-brands:discord", url: "https://discord.gg/MqW6TcQtVM" },
];
db.prepare("UPDATE profile SET name = ?, bio = ?, avatar_path = ?, links = ? WHERE id = 1").run(
	"まつざか ゆき",
	"世界は大きい、君は行かなければならない",
	"assets/images/avatar.webp",
	JSON.stringify(profileLinks),
);
console.log("Seeded: profile");

// ── Seed Projects ──
const projects = [
	{ id: "mizuki", title: "Mizuki", description: "A next-gen Material Design 3 blog theme built with Astro, featuring i18n, dark mode, and responsive design.", image: "/assets/projects/mizuki.webp", category: "web", techStack: ["Astro", "TypeScript", "Tailwind CSS", "Svelte"], status: "completed", sourceCode: "https://github.com/LyraVoid/Mizuki", visitUrl: "https://mizuki.mysqil.com", startDate: "2024-01-01", endDate: "2024-06-01", featured: true, tags: ["Blog", "Theme", "Open Source"], showImage: true },
	{ id: "folkpatch", title: "FolkPatch", description: "A kernel-level ROOT solution based on KernelPatch, with polished UI, APM module system, and KPM kernel module support.", image: "/assets/projects/folkpatch.webp", category: "mobile", techStack: ["Kotlin", "Rust", "C++", "Java"], status: "in-progress", sourceCode: "https://github.com/LyraVoid/FolkPatch", visitUrl: "https://fp.mysqil.com", startDate: "2024-03-01", featured: true, tags: ["Android", "Root", "Kernel"], showImage: true },
	{ id: "folktool", title: "FolkTool", description: "A fast ROOT flashing tool for FolkPatch with a graphical interface and automated operations, simplifying the complex flashing process.", image: "", category: "desktop", techStack: ["Flutter", "Dart", "C++", "CMake"], status: "completed", sourceCode: "https://github.com/LyraVoid/FolkTool", startDate: "2026-02-01", endDate: "2026-02-28", tags: ["Android", "Tool", "Desktop"], showImage: false },
	{ id: "folkadb", title: "FolkADB", description: "A portable ADB/Fastboot tool written in C, featuring interactive CLI, Tab completion, drag-and-drop module installation, and Shizuku activation.", image: "", category: "desktop", techStack: ["C"], status: "completed", sourceCode: "https://github.com/LyraVoid/FolkADB", startDate: "2025-06-01", endDate: "2026-01-01", tags: ["Android", "ADB", "CLI"], showImage: false },
	{ id: "folksplash", title: "FolkSplash", description: "A web-based splash.img visualizer for OPPO/Realme/OnePlus devices, supporting unpack, preview, replace, and repack.", image: "", category: "web", techStack: ["React", "TypeScript", "Vite", "Material-UI", "Zustand"], status: "completed", sourceCode: "https://github.com/LyraVoid/FolkSplash", visitUrl: "https://splash.mysqil.com", startDate: "2025-09-01", endDate: "2025-10-01", tags: ["Android", "Tool", "Frontend"], showImage: false },
];

const insertProject = db.prepare(`
	INSERT OR IGNORE INTO projects (id, title, description, image, category, tech_stack, status, live_demo, source_code, visit_url, start_date, end_date, featured, tags, show_image, sort_order)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const [i, p] of projects.entries()) {
	insertProject.run(p.id, p.title, p.description, p.image, p.category, JSON.stringify(p.techStack), p.status, p.liveDemo || null, p.sourceCode || null, p.visitUrl || null, p.startDate, p.endDate || null, p.featured ? 1 : 0, JSON.stringify(p.tags || []), p.showImage !== false ? 1 : 0, i);
}
console.log(`Seeded: ${projects.length} projects`);

// ── Seed Friends ──
const friends = [
	{ title: "Astro", imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640", desc: "The web framework for content-driven websites", siteurl: "https://github.com/withastro/astro", tags: ["Framework"] },
	{ title: "Mizuki Docs", imgurl: "https://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg", desc: "Mizuki User Manual", siteurl: "https://docs.mizuki.mysqil.com", tags: ["Docs"] },
	{ title: "Vercel", imgurl: "https://avatars.githubusercontent.com/u/14985020?v=4&s=640", desc: "Develop. Preview. Ship.", siteurl: "https://vercel.com", tags: ["Hosting", "Cloud"] },
	{ title: "Tailwind CSS", imgurl: "https://avatars.githubusercontent.com/u/67109815?v=4&s=640", desc: "A utility-first CSS framework for rapidly building custom designs", siteurl: "https://tailwindcss.com", tags: ["CSS", "Framework"] },
	{ title: "TypeScript", imgurl: "https://avatars.githubusercontent.com/u/6154722?v=4&s=640", desc: "TypeScript is JavaScript with syntax for types", siteurl: "https://www.typescriptlang.org", tags: ["Language", "JavaScript"] },
	{ title: "React", imgurl: "https://avatars.githubusercontent.com/u/6412038?v=4&s=640", desc: "A JavaScript library for building user interfaces", siteurl: "https://reactjs.org", tags: ["Framework", "JavaScript"] },
	{ title: "GitHub", imgurl: "https://avatars.githubusercontent.com/u/9919?v=4&s=640", desc: "Where the world builds software", siteurl: "https://github.com", tags: ["Development", "Platform"] },
	{ title: "MDN Web Docs", imgurl: "https://avatars.githubusercontent.com/u/7565578?v=4&s=640", desc: "The web's most comprehensive resource for web developers", siteurl: "https://developer.mozilla.org", tags: ["Docs", "Reference"] },
];

const insertFriend = db.prepare("INSERT INTO friends (title, imgurl, description, siteurl, tags) VALUES (?, ?, ?, ?, ?)");
// Clear existing
db.prepare("DELETE FROM friends").run();
for (const f of friends) {
	insertFriend.run(f.title, f.imgurl, f.desc, f.siteurl, JSON.stringify(f.tags));
}
console.log(`Seeded: ${friends.length} friends`);

// ── Seed Diary ──
db.prepare("DELETE FROM diary").run();
db.prepare("INSERT INTO diary (content, date, images) VALUES (?, ?, ?)").run(
	"The falling speed of cherry blossoms is five centimeters per second!",
	"2025-01-15T10:30:00Z",
	JSON.stringify(["/images/diary/sakura.jpg", "/images/diary/1.webp"]),
);
console.log("Seeded: diary");

// ── Seed Anime ──
const animeList = [
	{ title: "Lycoris Recoil", status: "completed", rating: 9.8, cover: "/assets/anime/lkls.webp", description: "Girl's gunfight", episodes: "12 episodes", year: "2022", genre: ["Action", "Slice of life"], studio: "A-1 Pictures", link: "https://www.bilibili.com/bangumi/media/md28338623", progress: 12, totalEpisodes: 12, startDate: "2022-07", endDate: "2022-09" },
	{ title: "Yowamushi Pedal", status: "watching", rating: 9.5, cover: "/assets/anime/rynh.webp", description: "Girl's daily life, sweet and healing", episodes: "12 episodes", year: "2015", genre: ["Daily life", "Healing"], studio: "Nexus", link: "https://www.bilibili.com/bangumi/media/md2590", progress: 8, totalEpisodes: 12, startDate: "2015-07", endDate: "2015-09" },
	{ title: "Asteroid in Love", status: "watching", rating: 9.2, cover: "/assets/anime/laxxx.webp", description: "Meeting girls among the stars, pure love and healing", episodes: "12 episodes", year: "2020", genre: ["Romance", "Healing"], studio: "Doga Kobo", link: "https://www.bilibili.com/bangumi/media/md28224128", progress: 5, totalEpisodes: 12, startDate: "2020-01", endDate: "2020-03" },
	{ title: "Is the Order a Rabbit?", status: "planned", rating: 9.0, cover: "/assets/anime/tz1.webp", description: "A group of girls' warm daily life", episodes: "12 episodes", year: "2014", genre: ["Daily life", "Healing"], studio: "White Fox", link: "https://www.bilibili.com/bangumi/media/md2762", progress: 12, totalEpisodes: 12, startDate: "2014-04", endDate: "2014-06" },
	{ title: "The Secret of the Magic Girl", status: "watching", rating: 9.0, cover: "/assets/anime/cmmn.webp", description: "Muli, Muli!", episodes: "12 episodes", year: "2024", genre: ["Daily life", "Healing", "Magic"], studio: "C2C", link: "https://www.bilibili.com/bangumi/media/md26625039", progress: 8, totalEpisodes: 12, startDate: "2025-07", endDate: "2025-10" },
];

const insertAnime = db.prepare(`
	INSERT INTO anime (title, status, rating, cover, description, episodes, year, genre, studio, link, progress, total_episodes, start_date, end_date)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
db.prepare("DELETE FROM anime").run();
for (const a of animeList) {
	insertAnime.run(a.title, a.status, a.rating, a.cover, a.description, a.episodes, a.year, JSON.stringify(a.genre), a.studio, a.link, a.progress, a.totalEpisodes, a.startDate || null, a.endDate || null);
}
console.log(`Seeded: ${animeList.length} anime`);

// ── Seed Devices ──
const devices = [
	{ category_name: "OnePlus", name: "OnePlus 13T", image: "/images/device/oneplus13t.webp", specs: "Gray / 16G + 1TB", description: "Flagship performance, Hasselblad imaging, 80W SuperVOOC.", link: "https://www.oneplus.com/cn/13t" },
	{ category_name: "Router", name: "GL-MT3000", image: "/images/device/mt3000.webp", specs: "1000Mbps / 2.5G", description: "Portable WiFi 6 router suitable for business trips and home use.", link: "https://www.gl-inet.cn/products/gl-mt3000/" },
];

const insertDevice = db.prepare("INSERT INTO devices (category_name, name, image, specs, description, link) VALUES (?, ?, ?, ?, ?, ?)");
db.prepare("DELETE FROM devices").run();
for (const d of devices) {
	insertDevice.run(d.category_name, d.name, d.image, d.specs, d.description, d.link);
}
console.log(`Seeded: ${devices.length} devices`);

// ── Seed Posts from Markdown files ──
const postsDir = path.join(ROOT, "src", "content", "posts");
if (existsSync(postsDir)) {
	db.prepare("DELETE FROM posts").run();
	const insertPost = db.prepare(`
		INSERT INTO posts (slug, title, content_md, description, image, category, tags, published, updated, draft, pinned, priority, comment, author, source_link, license_name, license_url, lang, encrypted, password, password_hint, alias, permalink)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	function parseMarkdown(content) {
		const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
		if (!match) return { frontmatter: {}, body: content };

		const fmStr = match[1];
		const body = match[2];
		const fm = {};

		for (const line of fmStr.split("\n")) {
			const colonIdx = line.indexOf(":");
			if (colonIdx === -1) continue;
			const key = line.substring(0, colonIdx).trim();
			let val = line.substring(colonIdx + 1).trim();
			// Remove quotes
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			// Parse booleans
			if (val === "true") val = true;
			else if (val === "false") val = false;
			fm[key] = val;
		}

		// Parse tags (simple YAML array)
		const tagsMatch = fmStr.match(/tags:\s*\n((?:\s+-\s+.*\n?)*)/);
		if (tagsMatch) {
			fm.tags = tagsMatch[1].split("\n").filter(l => l.trim().startsWith("-")).map(l => l.trim().replace(/^-\s*/, "").replace(/^["']|["']$/g, ""));
		}

		return { frontmatter: fm, body };
	}

	function walkPosts(dir, prefix = "") {
		const entries = readdirSync(dir, { withFileTypes: true });
		const results = [];
		for (const entry of entries) {
			if (entry.isDirectory()) {
				// Check for index.md inside
				const indexPath = path.join(dir, entry.name, "index.md");
				const indexMdxPath = path.join(dir, entry.name, "index.mdx");
				if (existsSync(indexPath)) {
					results.push({ slug: entry.name, filePath: indexPath });
				} else if (existsSync(indexMdxPath)) {
					results.push({ slug: entry.name, filePath: indexMdxPath });
				}
			} else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
				const slug = entry.name.replace(/\.(md|mdx)$/, "");
				results.push({ slug, filePath: path.join(dir, entry.name) });
			}
		}
		return results;
	}

	const postFiles = walkPosts(postsDir);
	let count = 0;
	for (const { slug, filePath } of postFiles) {
		const raw = readFileSync(filePath, "utf-8");
		const { frontmatter: fm, body } = parseMarkdown(raw);

		const title = fm.title || slug;
		const published = fm.published || new Date().toISOString();
		const tags = Array.isArray(fm.tags) ? fm.tags : [];

		insertPost.run(
			slug, title, body, fm.description || "", fm.image || "",
			fm.category || "", JSON.stringify(tags), published,
			fm.updated || null, fm.draft ? 1 : 0, fm.pinned ? 1 : 0,
			fm.priority || null, fm.comment !== false ? 1 : 0,
			fm.author || "", fm.sourceLink || "", fm.licenseName || "",
			fm.licenseUrl || "", fm.lang || "", fm.encrypted ? 1 : 0,
			fm.password || "", fm.passwordHint || "",
			fm.alias || null, fm.permalink || null,
		);
		count++;
	}
	console.log(`Seeded: ${count} posts`);
}

// ── Seed Timeline (skip skills - too many, keeping it as static for now) ──
const timelineItems = [
	{ id: "current-study", title: "Studying Computer Science and Technology", description: "Currently studying Computer Science and Technology, focusing on web development and software engineering.", type: "education", startDate: "2022-09-01", location: "Beijing", organization: "Beijing Institute of Technology", skills: ["Java", "Python", "JavaScript", "HTML/CSS", "MySQL"], achievements: ["Current GPA: 3.6/4.0", "Completed data structures and algorithms course project", "Participated in multiple course project developments"], icon: "material-symbols:school", color: "#059669", featured: true },
	{ id: "mizuki-blog-project", title: "Mizuki Personal Blog Project", description: "A personal blog website developed using the Astro framework as a practical project for learning frontend technologies.", type: "project", startDate: "2024-06-01", endDate: "2024-08-01", skills: ["Astro", "TypeScript", "Tailwind CSS", "Git"], achievements: ["Mastered modern frontend development tech stack", "Learned responsive design and user experience optimization", "Completed the full process from design to deployment"], links: [{ name: "GitHub Repository", url: "https://github.com/example/mizuki-blog", type: "project" }, { name: "Live Demo", url: "https://mizuki-demo.example.com", type: "website" }], icon: "material-symbols:code", color: "#7C3AED", featured: true },
	{ id: "summer-internship-2024", title: "Frontend Development Intern", description: "Summer internship at an internet company, participating in frontend development of web applications.", type: "work", startDate: "2024-07-01", endDate: "2024-08-31", location: "Beijing", organization: "TechStart Internet Company", position: "Frontend Development Intern", skills: ["React", "JavaScript", "CSS3", "Git", "Figma"], achievements: ["Completed user interface component development", "Learned team collaboration and code standards", "Received outstanding internship performance certificate"], icon: "material-symbols:work", color: "#DC2626", featured: true },
];

const insertTimeline = db.prepare(`
	INSERT OR IGNORE INTO timeline (id, title, description, type, start_date, end_date, location, organization, position, skills, achievements, links, icon, color, featured)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const t of timelineItems) {
	insertTimeline.run(t.id, t.title, t.description, t.type, t.startDate, t.endDate || null, t.location || null, t.organization || null, t.position || null, JSON.stringify(t.skills || []), JSON.stringify(t.achievements || []), JSON.stringify(t.links || []), t.icon || null, t.color || null, t.featured ? 1 : 0);
}
console.log(`Seeded: ${timelineItems.length} timeline items (partial - run full seed for all)`);

// ── Seed Skills ──
// Skills data is very large, importing directly from the TS file would require compilation
// Instead, we'll seed a few representative ones and the rest can be added via admin
console.log("Note: Skills data is large. Add remaining skills via the admin panel.");

db.close();
console.log("\nDatabase seeding complete!");
