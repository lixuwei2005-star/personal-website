import fs from "node:fs";
import path from "node:path";

const POST_ASSET_ROOT = path.join(process.cwd(), "public", "uploads", "posts");
const DIST_POST_ASSET_ROOT = path.join(
	process.cwd(),
	"dist",
	"client",
	"uploads",
	"posts",
);

export interface PostAssetFile {
	fileName: string;
	path: string;
	size: number;
}

function ensureDir(dirPath: string) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function getPostAssetDirectory(postId: number) {
	return path.join(POST_ASSET_ROOT, String(postId));
}

function getDistPostAssetDirectory(postId: number) {
	return path.join(DIST_POST_ASSET_ROOT, String(postId));
}

function syncPostAssetsToDist(postId: number) {
	const sourceDir = getPostAssetDirectory(postId);
	const distDir = getDistPostAssetDirectory(postId);

	if (!fs.existsSync(sourceDir)) {
		fs.rmSync(distDir, { recursive: true, force: true });
		return;
	}

	ensureDir(distDir);
	for (const fileName of fs.readdirSync(sourceDir)) {
		const sourceFile = path.join(sourceDir, fileName);
		if (!fs.statSync(sourceFile).isFile()) {
			continue;
		}
		fs.copyFileSync(sourceFile, path.join(distDir, fileName));
	}
}

function toPublicPath(postId: number, fileName: string) {
	return `/uploads/posts/${postId}/${fileName}`;
}

export function listPostAssets(postId: number): PostAssetFile[] {
	const assetDir = getPostAssetDirectory(postId);
	if (!fs.existsSync(assetDir)) {
		return [];
	}

	return fs
		.readdirSync(assetDir)
		.filter((fileName) => fs.statSync(path.join(assetDir, fileName)).isFile())
		.sort((a, b) => a.localeCompare(b))
		.map((fileName) => {
			const stats = fs.statSync(path.join(assetDir, fileName));
			return {
				fileName,
				path: toPublicPath(postId, fileName),
				size: stats.size,
			};
		});
}

export function savePostAsset(
	postId: number,
	fileName: string,
	buffer: Buffer,
): PostAssetFile {
	const assetDir = getPostAssetDirectory(postId);
	ensureDir(assetDir);

	const targetPath = path.join(assetDir, fileName);
	fs.writeFileSync(targetPath, buffer);
	syncPostAssetsToDist(postId);

	return {
		fileName,
		path: toPublicPath(postId, fileName),
		size: buffer.byteLength,
	};
}

export function removePostAsset(postId: number, assetPath: string): void {
	const normalizedPath = assetPath.trim();
	const expectedPrefix = `/uploads/posts/${postId}/`;
	if (!normalizedPath.startsWith(expectedPrefix)) {
		throw new Error("The selected file does not belong to this post.");
	}

	const fileName = path.basename(normalizedPath);
	const publicFile = path.join(getPostAssetDirectory(postId), fileName);
	const distFile = path.join(getDistPostAssetDirectory(postId), fileName);
	fs.rmSync(publicFile, { force: true });
	fs.rmSync(distFile, { force: true });
	syncPostAssetsToDist(postId);
}

export function deletePostAssets(postId: number): void {
	fs.rmSync(getPostAssetDirectory(postId), { recursive: true, force: true });
	fs.rmSync(getDistPostAssetDirectory(postId), { recursive: true, force: true });
}
