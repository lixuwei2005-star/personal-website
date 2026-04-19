<script lang="ts">
	import { onMount } from "svelte";
	import {
		getAdminImagePreviewUrl,
		uploadAdminImage,
	} from "../../lib/admin/image-fields";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface ProfileLink {
		name: string;
		icon: string;
		url: string;
	}

	interface ProfileData {
		name: string;
		bio: string;
		avatar_path: string;
		footer_name: string;
		links: ProfileLink[];
	}

	let {
		profile: initialProfile,
		showLastModified: initialShowLastModified,
		aboutContent: initialAboutContent,
	}: {
		profile: ProfileData;
		showLastModified: boolean;
		aboutContent: string;
	} = $props();

	let name = $state(initialProfile.name);
	let bio = $state(initialProfile.bio);
	let avatar_path = $state(initialProfile.avatar_path);
	let footer_name = $state(initialProfile.footer_name);
	let links = $state<ProfileLink[]>([...initialProfile.links]);
	let showLastModified = $state(initialShowLastModified);
	let aboutContent = $state(initialAboutContent);
	let aboutDraft = $state(initialAboutContent);
	let editingAbout = $state(false);
	let aboutSaving = $state(false);
	let aboutMessage = $state("");
	let aboutMessageKind = $state<"success" | "error" | "">("");
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let uploading = $state(false);
	let lang = $state<AdminLanguage>(getAdminLanguage());

	onMount(() => onAdminLanguageChange((nextLang) => {
		lang = nextLang;
	}));

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	async function handleAvatarUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;

		try {
			const data = await uploadAdminImage(file);
			avatar_path = data.url;
			message = t("Upload successful. Click Save Changes to persist it.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		}
		input.value = "";
		uploading = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	function addLink() {
		links = [...links, { name: "", icon: "", url: "" }];
	}

	function removeLink(index: number) {
		links = links.filter((_, i) => i !== index);
	}

	function openAboutEditor() {
		aboutDraft = aboutContent;
		aboutMessage = "";
		aboutMessageKind = "";
		editingAbout = true;
	}

	function closeAboutEditor() {
		editingAbout = false;
		aboutDraft = aboutContent;
		aboutMessage = "";
		aboutMessageKind = "";
	}

	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			closeAboutEditor();
		}
	}

	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			closeAboutEditor();
		}
	}

	async function saveAboutPage() {
		aboutSaving = true;
		aboutMessage = "";
		try {
			const res = await fetch("/api/admin/spec/about/", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: aboutDraft }),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error || t("Save failed"));
			}

			aboutContent = typeof data?.content === "string" ? data.content : aboutDraft;
			editingAbout = false;
			message = t("About page saved!");
			messageKind = "success";
		} catch (error) {
			aboutMessage = error instanceof Error ? error.message : t("Save failed");
			aboutMessageKind = "error";
		}
		aboutSaving = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 3000);
	}

	async function save() {
		saving = true;
		message = "";
		try {
			const res = await fetch("/api/admin/profile/", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					bio,
					avatar_path,
					footer_name,
					links,
					showLastModified,
				}),
			});
			if (res.ok) {
				message = t("Saved successfully!");
				messageKind = "success";
			} else {
				message = t("Save failed");
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

<div class="editor">
	<div class="form-section">
		<h3>{t("Basic Info")}</h3>
		<div class="form-group">
			<label for="name">{t("Name")}</label>
			<input id="name" type="text" bind:value={name} />
		</div>
		<div class="form-group">
			<label for="bio">{t("Bio")}</label>
			<input id="bio" type="text" bind:value={bio} />
		</div>
		<div class="form-group">
			<label for="footer-name">{t("Footer Signature")}</label>
			<input id="footer-name" type="text" bind:value={footer_name} />
			<p class="helper-text">
				{t("Shown after the copyright year in the footer. Leave empty to reuse your profile name.")}
			</p>
		</div>
		<div class="form-group">
			<label for="avatar-path">{t("Avatar")}</label>
			<div class="avatar-row">
				{#if avatar_path}
					<img src={getAdminImagePreviewUrl(avatar_path)} alt={t("Avatar")} class="avatar-preview" />
				{/if}
				<div>
					<input
						id="avatar-path"
						type="text"
						bind:value={avatar_path}
						placeholder={t("Path or URL")}
					/>
					<label class="upload-btn">
						{uploading ? t("Uploading...") : t("Upload Image")}
						<input type="file" accept="image/*" onchange={handleAvatarUpload} hidden />
					</label>
				</div>
			</div>
		</div>
	</div>

	<div class="form-section">
		<h3>{t("Post Display")}</h3>
		<label class="checkbox-row" for="show-last-modified">
			<input
				id="show-last-modified"
				type="checkbox"
				bind:checked={showLastModified}
			/>
			<span>{t("Show last modified card below posts")}</span>
		</label>
		<p class="helper-text">
			{t('Controls the "distance since last edit" card shown at the bottom of article pages.')}
		</p>
	</div>

	<div class="form-section">
		<h3>{t("About Page")}</h3>
		<p class="helper-text">
			{t("Edit the Markdown content shown when visitors open the About page from your avatar.")}
		</p>
		<div class="about-actions">
			<button class="btn-secondary" onclick={openAboutEditor}>
				{t("Edit About Page")}
			</button>
			<a class="btn-secondary btn-link" href="/about/" target="_blank" rel="noreferrer">
				{t("Open About Page")}
			</a>
		</div>
	</div>

	<div class="form-section">
		<h3>{t("Social Links")}</h3>
		{#each links as link, i}
			<div class="link-row">
				<input type="text" bind:value={link.name} placeholder={t("Name")} />
				<input type="text" bind:value={link.icon} placeholder={t("Icon (e.g. fa7-brands:github)")} />
				<input type="text" bind:value={link.url} placeholder={t("URL")} />
				<button class="btn-remove" onclick={() => removeLink(i)}>X</button>
			</div>
		{/each}
		<button class="btn-add" onclick={addLink}>+ {t("Add Link")}</button>
	</div>

	<div class="actions">
		<button class="btn-save" onclick={save} disabled={saving}>
			{saving ? t("Saving...") : t("Save Changes")}
		</button>
		{#if message}
			<span class="message" class:success={messageKind === "success"}>{message}</span>
		{/if}
	</div>
</div>

{#if editingAbout}
	<div
		class="modal-overlay"
		onclick={closeAboutEditor}
		onkeydown={handleOverlayKeydown}
		role="button"
		tabindex="0"
		aria-label={t("Cancel")}
	>
		<div
			class="about-modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleDialogKeydown}
			role="dialog"
			aria-modal="true"
			aria-label={t("Edit About Page")}
			tabindex="0"
		>
			<div class="about-modal-header">
				<h3>{t("Edit About Page")}</h3>
				<button class="btn-close" onclick={closeAboutEditor} aria-label={t("Cancel")}>
					x
				</button>
			</div>
			<p class="helper-text">
				{t("Supports Markdown. Content is saved to src/content/spec/about.md.")}
			</p>
			<textarea
				class="about-textarea"
				rows="18"
				bind:value={aboutDraft}
				placeholder={t("Content")}
			></textarea>
			{#if aboutMessage}
				<div class="message" class:success={aboutMessageKind === "success"}>{aboutMessage}</div>
			{/if}
			<div class="modal-actions">
				<button class="btn-add" onclick={closeAboutEditor} disabled={aboutSaving}>
					{t("Cancel")}
				</button>
				<button class="btn-save" onclick={saveAboutPage} disabled={aboutSaving}>
					{aboutSaving ? t("Saving...") : t("Save About Page")}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.editor { width: 100%; max-width: 700px; }
	.form-section { width: 100%; overflow: hidden; background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	.form-section h3 { font-size: 15px; margin-bottom: 16px; color: #555; }
	.form-group { margin-bottom: 14px; min-width: 0; }
	.form-group label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
	.form-group input { display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
	.form-group input:focus { outline: none; border-color: #6366f1; }
	.avatar-row { display: flex; gap: 16px; align-items: flex-start; min-width: 0; }
	.avatar-preview { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #eee; }
	.avatar-row > div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
	.checkbox-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; cursor: pointer; }
	.checkbox-row input { width: 16px; height: 16px; }
	.helper-text { margin-top: 8px; font-size: 12px; color: #6b7280; }
	.upload-btn { display: inline-block; padding: 6px 14px; background: #f0f0f0; border-radius: 6px; font-size: 13px; cursor: pointer; text-align: center; }
	.upload-btn:hover { background: #e5e5e5; }
	.about-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
	.link-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; min-width: 0; }
	.link-row input { flex: 1 1 0; min-width: 0; max-width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
	.link-row input:focus { outline: none; border-color: #6366f1; }
	.btn-remove { padding: 6px 10px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
	.btn-add { padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; margin-top: 4px; }
	.btn-add:hover { background: #e5e5e5; }
	.btn-secondary { padding: 8px 16px; background: #f0f0f0; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; text-decoration: none; }
	.btn-secondary:hover { background: #e5e5e5; }
	.btn-link { display: inline-flex; align-items: center; justify-content: center; }
	.actions { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
	.btn-save { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
	.btn-save:hover { background: #4f46e5; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.message { font-size: 13px; color: #dc2626; }
	.message.success { color: #16a34a; }
	.modal-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 1000; }
	.about-modal { width: min(900px, 100%); max-height: calc(100vh - 48px); overflow: auto; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18); }
	.about-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
	.about-modal-header h3 { margin: 0; font-size: 18px; color: #1f2937; }
	.btn-close { width: 32px; height: 32px; border: none; border-radius: 999px; background: #f3f4f6; color: #374151; cursor: pointer; font-size: 16px; line-height: 1; }
	.btn-close:hover { background: #e5e7eb; }
	.about-textarea { width: 100%; min-height: 420px; box-sizing: border-box; resize: vertical; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font: 14px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; color: #111827; margin-top: 12px; }
	.about-textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
	.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
	@media (max-width: 640px) {
		.avatar-row,
		.link-row {
			flex-direction: column;
			align-items: stretch;
		}
		.modal-overlay { padding: 12px; }
		.about-modal { padding: 16px; max-height: calc(100vh - 24px); }
		.modal-actions { flex-direction: column-reverse; }
		.modal-actions .btn-add,
		.modal-actions .btn-save { width: 100%; }
	}
</style>
