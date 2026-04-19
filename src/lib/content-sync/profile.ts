import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ProfileData } from "../repositories/profile";

const GENERATED_PROFILE_PATH = path.resolve(
	process.cwd(),
	"src",
	"generated",
	"profile.ts",
);

function serializeProfile(profile: ProfileData): string {
	const links = JSON.stringify(profile.links, null, "\t")
		.split("\n")
		.map((line) => `\t${line}`)
		.join("\n");

	return `import type { ProfileConfig } from "../types/config";

export const profileOverrideConfig: Partial<ProfileConfig> = {
\tavatar: ${JSON.stringify(profile.avatar_path || "")},
\tname: ${JSON.stringify(profile.name || "")},
\tbio: ${JSON.stringify(profile.bio || "")},
\tlinks: ${links},
};

export const profileFooterName = ${JSON.stringify(profile.footer_name || "")};
`;
}

export function syncProfileToGeneratedConfig(profile: ProfileData): string {
	mkdirSync(path.dirname(GENERATED_PROFILE_PATH), { recursive: true });
	writeFileSync(GENERATED_PROFILE_PATH, serializeProfile(profile), "utf-8");
	return GENERATED_PROFILE_PATH;
}
