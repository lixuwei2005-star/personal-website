import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AnnouncementConfig } from "../../types/config";

const GENERATED_ANNOUNCEMENTS_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"announcements.ts",
);

function serializeAnnouncements(items: AnnouncementConfig[]): string {
	return `import type { AnnouncementConfig } from "../types/config";

export const announcementOverrideConfigLoaded = true;
export const announcementOverrideConfig: AnnouncementConfig[] = ${JSON.stringify(items, null, 2)};
`;
}

export function syncAnnouncementsToGeneratedConfig(
	items: AnnouncementConfig[],
): string {
	mkdirSync(path.dirname(GENERATED_ANNOUNCEMENTS_PATH), { recursive: true });
	writeFileSync(
		GENERATED_ANNOUNCEMENTS_PATH,
		serializeAnnouncements(items),
		"utf-8",
	);
	return GENERATED_ANNOUNCEMENTS_PATH;
}
