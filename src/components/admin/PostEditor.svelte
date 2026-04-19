<script lang="ts">
	import { marked } from "marked";
	import { onMount } from "svelte";
	import {
		getAdminImagePreviewUrl,
		uploadAdminImage,
	} from "../../lib/admin/image-fields";
	import TagInput from "./TagInput.svelte";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface PostData {
		id?: number;
		slug: string;
		title: string;
		content_md: string;
		description: string;
		image: string;
		category: string;
		tags: string[];
		published: string;
		draft: boolean;
		pinned: boolean;
		priority?: number | null;
		comment?: boolean;
		author?: string;
		source_link?: string;
		license_name?: string;
		license_url?: string;
		lang?: string;
		encrypted: boolean;
		password: string;
		password_hint: string;
		alias?: string | null;
		permalink?: string | null;
	}

	interface PostAsset {
		fileName: string;
		path: string;
		size: number;
	}

	let { post }: { post?: PostData } = $props();

	let slug = $state(post?.slug || "");
	let title = $state(post?.title || "");
	let content_md = $state(post?.content_md || "");
	let description = $state(post?.description || "");
	let image = $state(post?.image || "");
	let category = $state(post?.category || "");
	let tags = $state<string[]>([...(post?.tags || [])]);
	let published = $state(post?.published ? post.published.substring(0, 10) : new Date().toISOString().substring(0, 10));
	let draft = $state(post?.draft || false);
	let pinned = $state(post?.pinned || false);
	let encrypted = $state(post?.encrypted || false);
	let password = $state(post?.password || "");
	let password_hint = $state(post?.password_hint || "");

	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let showPreview = $state(false);
	let uploadingImage = $state(false);
	let uploadingAssets = $state(false);
	let loadingAssets = $state(false);
	let assetFiles = $state<PostAsset[]>([]);
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let assetUploadInput: HTMLInputElement | null = null;

	const preservedPriority = post?.priority ?? null;
	const preservedComment = post?.comment ?? true;
	const preservedAuthor = post?.author || "";
	const preservedSourceLink = post?.source_link || "";
	const preservedLicenseName = post?.license_name || "";
	const preservedLicenseUrl = post?.license_url || "";
	const preservedLang = post?.lang || "";
	const preservedAlias = post?.alias ?? null;
	const preservedPermalink = post?.permalink ?? null;

	let preview = $derived(marked.parse(content_md) as string);

	onMount(() => onAdminLanguageChange((nextLang) => {
		lang = nextLang;
	}));

	onMount(() => {
		if (post?.id) {
			void loadAssets(post.id);
		}
	});

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function buildSlugFromTitle(value: string) {
		return value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	let displaySlug = $derived(post?.id ? (slug || buildSlugFromTitle(title)) : buildSlugFromTitle(title));

	async function loadAssets(postId: number) {
		loadingAssets = true;
		try {
			const res = await fetch(`/api/admin/posts/${postId}/assets/`);
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Failed to load post assets"));
			}
			assetFiles = Array.isArray(data?.assets) ? data.assets : [];
		} catch (error) {
			message = error instanceof Error ? error.message : t("Failed to load post assets");
			messageKind = "error";
		}
		loadingAssets = false;
	}

	function openAssetUploadPicker() {
		assetUploadInput?.click();
	}

	async function handleAssetUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (!post?.id || !input.files || input.files.length === 0) {
			return;
		}

		uploadingAssets = true;
		try {
			const formData = new FormData();
			for (const file of Array.from(input.files)) {
				formData.append("files", file);
			}

			const res = await fetch(`/api/admin/posts/${post.id}/assets/`, {
				method: "POST",
				body: formData,
			});
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Upload failed"));
			}

			await loadAssets(post.id);
			message = t("Post images uploaded. Copy the path below and insert it into your Markdown.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}
		input.value = "";
		uploadingAssets = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	async function deleteAsset(assetPath: string) {
		if (!post?.id) {
			return;
		}

		try {
			const res = await fetch(`/api/admin/posts/${post.id}/assets/`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: assetPath }),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Delete failed"));
			}

			assetFiles = assetFiles.filter((item) => item.path !== assetPath);
			message = t("Image deleted");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Delete failed");
			messageKind = "error";
		}
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	async function copyAssetPath(assetPath: string) {
		try {
			await navigator.clipboard.writeText(assetPath);
			message = t("Image path copied");
			messageKind = "success";
		} catch {
			message = t("Failed to copy image path");
			messageKind = "error";
		}
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	async function handleCoverUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingImage = true;
		try {
			const data = await uploadAdminImage(file);
			image = data.url;
			message = t("Image uploaded. Click Save to persist it.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}
		input.value = "";
		uploadingImage = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	async function save() {
		const resolvedSlug = post?.id ? (slug || buildSlugFromTitle(title)) : buildSlugFromTitle(title);
		if (!title || !resolvedSlug) {
			message = t("Title is required");
			messageKind = "error";
			return;
		}
		if (encrypted && !password.trim()) {
			message = t("Encrypted posts require a password");
			messageKind = "error";
			return;
		}

		saving = true;
		message = "";
		const data = {
			slug: resolvedSlug, title, content_md, content_html: "",
			description, image, category, tags,
			published: new Date(published).toISOString(),
			updated: new Date().toISOString(),
			draft, pinned,
			priority: preservedPriority,
			comment: preservedComment,
			author: preservedAuthor,
			source_link: preservedSourceLink,
			license_name: preservedLicenseName,
			license_url: preservedLicenseUrl,
			lang: preservedLang,
			encrypted,
			password: encrypted ? password : "",
			password_hint: encrypted ? password_hint : "",
			alias: preservedAlias,
			permalink: preservedPermalink,
		};

		try {
			const url = post?.id ? `/api/admin/posts/${post.id}/` : "/api/admin/posts/";
			const method = post?.id ? "PUT" : "POST";
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (res.ok) {
				const result = await res.json();
				message = t("Saved!");
				messageKind = "success";
				if (!post?.id) {
					window.location.href = `/admin/posts/${result.id}/`;
				}
			} else {
				const err = await res.json();
				message = err.error || t("Save failed");
				messageKind = "error";
			}
		} catch {
			message = t("Network error");
			messageKind = "error";
		}
		saving = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}
</script>

<div class="editor-container">
	<div class="editor-meta">
		<div class="meta-row">
			<div class="form-group" style="flex:2">
				<label for="title">{t("Title")}</label>
				<input id="title" type="text" bind:value={title} />
			</div>
			<div class="form-group" style="flex:1">
				<label for="slug">{t("Slug")}</label>
				<input
					id="slug"
					type="text"
					value={displaySlug}
					readonly
					placeholder={t("Auto-generated after saving")}
				/>
			</div>
		</div>
		<div class="meta-row">
			<div class="form-group">
				<label for="category">{t("Category")}</label>
				<input id="category" type="text" bind:value={category} />
			</div>
			<div class="form-group">
				<label>{t("Tags")}</label>
				<TagInput
					tags={tags}
					placeholder={t("Enter a tag")}
					addLabel={t("Add")}
					emptyLabel={t("No tags yet")}
					onChange={(nextTags) => {
						tags = nextTags;
					}}
				/>
			</div>
			<div class="form-group">
				<label for="published">{t("Published Date")}</label>
				<input id="published" type="date" bind:value={published} />
			</div>
		</div>
		<div class="meta-row">
			<div class="form-group" style="flex:2">
				<label for="description">{t("Description")}</label>
				<input id="description" type="text" bind:value={description} />
			</div>
			<div class="form-group image-form-group" style="flex:1">
				<label for="image">{t("Cover Image")}</label>
				<div class="image-field-row">
					{#if image}
						<img
							src={getAdminImagePreviewUrl(image)}
							alt={t("Cover preview")}
							class="image-preview"
						/>
					{/if}
					<div class="image-field-controls">
						<input id="image" type="text" bind:value={image} placeholder={t("URL or path")} />
						<label class="upload-btn">
							{uploadingImage ? t("Uploading...") : t("Upload Image")}
							<input type="file" accept="image/*" onchange={handleCoverUpload} hidden />
						</label>
					</div>
				</div>
			</div>
		</div>
		<div class="meta-row">
			<label class="checkbox">
				<input type="checkbox" bind:checked={draft} /> {t("Draft")}
			</label>
			<label class="checkbox">
				<input type="checkbox" bind:checked={pinned} /> {t("Pinned")}
			</label>
			<label class="checkbox">
				<input type="checkbox" bind:checked={encrypted} /> {t("Encrypted")}
			</label>
		</div>
		{#if encrypted}
			<div class="meta-row">
				<div class="form-group">
					<label for="password">{t("Password")}</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder={t("Required to unlock this post")}
					/>
				</div>
				<div class="form-group">
					<label for="password-hint">{t("Password Hint")}</label>
					<input
						id="password-hint"
						type="text"
						bind:value={password_hint}
						placeholder={t("Optional hint shown to readers")}
					/>
				</div>
			</div>
			<p class="encryption-tip">
				{t("Encrypted posts will show a password unlock box on the front end.")}
			</p>
		{/if}
	</div>

	<div class="editor-toolbar">
		<button class:active={!showPreview} onclick={() => showPreview = false}>{t("Edit")}</button>
		<button class:active={showPreview} onclick={() => showPreview = true}>{t("Preview")}</button>
	</div>

	<div class="post-assets-card">
		<div class="post-assets-header">
			<div>
				<h3>{t("Post Images")}</h3>
				<p>{t("Upload content images for this post, preview them here, then copy the path into your Markdown.")}</p>
			</div>
			{#if post?.id}
				<button
					type="button"
					class="upload-btn compact"
					onclick={openAssetUploadPicker}
					disabled={uploadingAssets}
				>
					{uploadingAssets ? t("Uploading...") : t("Upload Images")}
				</button>
			{/if}
		</div>

		<input
			type="file"
			accept="image/*"
			multiple
			bind:this={assetUploadInput}
			onchange={handleAssetUpload}
			hidden
		/>

		{#if !post?.id}
			<div class="asset-empty">{t("Save this post first to start managing content images.")}</div>
		{:else if loadingAssets}
			<div class="asset-empty">{t("Loading...")}</div>
		{:else if assetFiles.length === 0}
			<div class="asset-empty">{t("No post images yet")}</div>
		{:else}
			<div class="asset-grid">
				{#each assetFiles as asset}
					<div class="asset-card">
						<img
							class="asset-preview"
							src={getAdminImagePreviewUrl(asset.path)}
							alt={asset.fileName}
						/>
						<div class="asset-meta">
							<code>{asset.path}</code>
							<div class="asset-actions">
								<button
									type="button"
									class="asset-btn"
									onclick={() => copyAssetPath(asset.path)}
								>
									{t("Copy Path")}
								</button>
								<button
									type="button"
									class="asset-btn danger"
									onclick={() => deleteAsset(asset.path)}
								>
									{t("Delete")}
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showPreview}
		<div class="preview-pane">
			{@html preview}
		</div>
	{:else}
		<textarea class="content-editor" bind:value={content_md} placeholder={t("Write your post in Markdown...")} rows="20"></textarea>
	{/if}

	<div class="actions">
		<button class="btn-save" onclick={save} disabled={saving}>
			{saving ? t("Saving...") : (post?.id ? t("Update Post") : t("Create Post"))}
		</button>
		{#if message}
			<span class="message" class:success={messageKind === "success"}>{message}</span>
		{/if}
	</div>
</div>

<style>
	.editor-container { width: 100%; max-width: 900px; margin-top: 16px; }
	.editor-meta { width: 100%; overflow: hidden; background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.meta-row { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
	.form-group { flex: 1 1 0; min-width: 0; }
	.form-group label { display: block; font-size: 12px; font-weight: 500; color: #777; margin-bottom: 4px; }
	.form-group input { display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
	.form-group input:focus { outline: none; border-color: #6366f1; }
	.form-group input[readonly] { background: #f8fafc; color: #6b7280; cursor: default; }
	.image-form-group { min-width: min(320px, 100%); }
	.image-field-row { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
	.image-preview { width: 96px; height: 72px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; background: #f8fafc; flex-shrink: 0; }
	.image-field-controls { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
	.checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
	.encryption-tip { font-size: 12px; color: #6b7280; margin-top: -2px; }
	.upload-btn { display: inline-block; width: 100%; padding: 7px 12px; background: #f3f4f6; border-radius: 6px; font-size: 13px; cursor: pointer; text-align: center; }
	.upload-btn:hover { background: #e5e7eb; }
	.upload-btn.compact { width: auto; min-width: 132px; }
	.editor-toolbar { display: flex; gap: 0; margin-bottom: 0; }
	.editor-toolbar button { padding: 8px 20px; background: #e5e7eb; border: none; font-size: 13px; cursor: pointer; }
	.editor-toolbar button:first-child { border-radius: 8px 0 0 0; }
	.editor-toolbar button:last-child { border-radius: 0 8px 0 0; }
	.editor-toolbar button.active { background: #fff; font-weight: 600; }
	.post-assets-card { background: #fff; border-radius: 8px; padding: 16px; margin: 14px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.post-assets-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
	.post-assets-header h3 { margin: 0; font-size: 15px; color: #111827; }
	.post-assets-header p { margin: 6px 0 0; font-size: 12px; color: #6b7280; }
	.asset-empty {
		padding: 18px;
		border: 1px dashed #d1d5db;
		border-radius: 10px;
		background: #f8fafc;
		color: #6b7280;
		font-size: 13px;
		text-align: center;
	}
	.asset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 14px;
	}
	.asset-card {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
		background: #fff;
	}
	.asset-preview {
		display: block;
		width: 100%;
		height: 150px;
		object-fit: cover;
		background: #f8fafc;
	}
	.asset-meta {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.asset-meta code {
		font-size: 12px;
		color: #4b5563;
		word-break: break-all;
		background: #f8fafc;
		border-radius: 8px;
		padding: 8px 10px;
	}
	.asset-actions { display: flex; gap: 8px; }
	.asset-btn {
		flex: 1;
		padding: 8px 10px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #fff;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}
	.asset-btn.danger {
		border-color: #fecaca;
		color: #dc2626;
		background: #fff5f5;
	}
	.content-editor { display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 16px; border: none; border-radius: 0 0 8px 8px; font-family: "JetBrains Mono", monospace; font-size: 14px; line-height: 1.6; resize: vertical; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.content-editor:focus { outline: none; }
	.preview-pane { width: 100%; max-width: 100%; box-sizing: border-box; background: #fff; padding: 20px; border-radius: 0 0 8px 8px; min-height: 300px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); line-height: 1.7; }
	.preview-pane :global(h1) { font-size: 24px; margin: 16px 0 8px; }
	.preview-pane :global(h2) { font-size: 20px; margin: 14px 0 6px; }
	.preview-pane :global(p) { margin: 8px 0; }
	.preview-pane :global(code) { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
	.preview-pane :global(pre) { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
	.actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
	.btn-save { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
	.btn-save:hover { background: #4f46e5; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.message { font-size: 13px; color: #dc2626; }
	.message.success { color: #16a34a; }
	@media (max-width: 640px) {
		.post-assets-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.image-field-row {
			flex-direction: column;
		}
		.image-preview {
			width: 100%;
			height: 180px;
		}
	}
</style>
