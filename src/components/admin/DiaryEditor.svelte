<script lang="ts">
	import { onMount } from "svelte";
	import type { DiaryItem } from "../../data/diary";
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

	interface Props {
		items: DiaryItem[];
	}

	interface DiaryFormState {
		content: string;
		dateTime: string;
		location: string;
		mood: string;
		tags: string[];
		imagesText: string;
	}

	let { items: initialItems }: Props = $props();

	function sortItems(items: DiaryItem[]) {
		return [...items].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	}

	function pad(value: number) {
		return String(value).padStart(2, "0");
	}

	function toDateTimeLocalValue(value?: string) {
		const date = value ? new Date(value) : new Date();
		const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
		return `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}T${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}`;
	}

	function parseLineList(value: string) {
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}

	function toFormState(item?: DiaryItem): DiaryFormState {
		return {
			content: item?.content ?? "",
			dateTime: toDateTimeLocalValue(item?.date),
			location: item?.location ?? "",
			mood: item?.mood ?? "",
			tags: [...(item?.tags ?? [])],
			imagesText: item?.images?.join("\n") ?? "",
		};
	}

	function formatDateTime(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return value;
		}
		return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	}

	function excerpt(content: string, maxLength = 100) {
		if (content.length <= maxLength) {
			return content;
		}
		return `${content.slice(0, maxLength)}...`;
	}

	let items = $state(sortItems(initialItems));
	let editorMode = $state<"create" | "edit" | null>(null);
	let editingId = $state<number | null>(null);
	let form = $state<DiaryFormState>(toFormState());
	let saving = $state(false);
	let uploading = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let previewImages = $derived(parseLineList(form.imagesText));

	onMount(() =>
		onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		}),
	);

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function openCreate() {
		editorMode = "create";
		editingId = null;
		form = toFormState();
		message = "";
		messageKind = "";
	}

	function openEdit(item: DiaryItem) {
		editorMode = "edit";
		editingId = item.id;
		form = toFormState(item);
		message = "";
		messageKind = "";
	}

	function closeEditor() {
		editorMode = null;
		editingId = null;
		form = toFormState();
	}

	function removeImage(index: number) {
		const nextImages = [...previewImages];
		nextImages.splice(index, 1);
		form.imagesText = nextImages.join("\n");
	}

	async function handleImageUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) {
			return;
		}

		uploading = true;
		try {
			const uploadedUrls = [...previewImages];
			for (const file of files) {
				const uploaded = await uploadAdminImage(file);
				uploadedUrls.push(uploaded.url);
			}
			form.imagesText = uploadedUrls.join("\n");
			message = t("Images uploaded! The first image will be used as the cover.");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Upload failed");
			messageKind = "error";
		} finally {
			uploading = false;
			input.value = "";
		}
	}

	async function saveDiary() {
		if (!form.content.trim()) {
			message = t("Diary content is required");
			messageKind = "error";
			return;
		}

		const parsedDate = new Date(form.dateTime);
		if (Number.isNaN(parsedDate.getTime())) {
			message = t("Please choose a valid date and time");
			messageKind = "error";
			return;
		}

		saving = true;
		try {
			const payload = {
				content: form.content.trim(),
				date: parsedDate.toISOString(),
				location: form.location.trim(),
				mood: form.mood.trim(),
				tags: form.tags,
				images: previewImages,
			};
			const response = await fetch(
				editorMode === "create"
					? "/api/admin/diary/"
					: `/api/admin/diary/${editingId}/`,
				{
					method: editorMode === "create" ? "POST" : "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			const result = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(result?.error || t("Save failed"));
			}

			if (editorMode === "create") {
				items = sortItems([...items, result]);
			} else {
				items = sortItems(
					items.map((item) => (item.id === editingId ? result : item)),
				);
			}

			message =
				editorMode === "create"
					? t("Diary entry created!")
					: t("Diary entry updated!");
			messageKind = "success";
			closeEditor();
		} catch (error) {
			message = error instanceof Error ? error.message : t("Save failed");
			messageKind = "error";
		} finally {
			saving = false;
		}
	}

	async function deleteDiary(id: number) {
		if (!confirm(t("Delete this diary entry?"))) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/diary/${id}/`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(t("Delete failed"));
			}
			items = items.filter((item) => item.id !== id);
			message = t("Diary entry deleted!");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Delete failed");
			messageKind = "error";
		}
	}
</script>

<div class="diary-admin">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="toolbar">
		<div>
			<h3>{t("Diary Management")}</h3>
			<p>{t("ID is generated automatically. The first image is used as the cover on the front end.")}</p>
		</div>
		<button class="primary-btn" type="button" onclick={openCreate}>
			+ {t("New Diary Entry")}
		</button>
	</div>

	<div class="table-card">
		<table class="entry-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>{t("Cover")}</th>
					<th>{t("Date & Time")}</th>
					<th>{t("Mood")}</th>
					<th>{t("Location")}</th>
					<th>{t("Tags")}</th>
					<th>{t("Content")}</th>
					<th>{t("Actions")}</th>
				</tr>
			</thead>
			<tbody>
				{#if items.length === 0}
					<tr>
						<td colspan="8" class="empty-row">{t("No diary entries yet")}</td>
					</tr>
				{:else}
					{#each items as item}
						<tr>
							<td class="id-cell">#{item.id}</td>
							<td class="cover-cell">
								{#if item.images && item.images[0]}
									<img
										src={getAdminImagePreviewUrl(item.images[0])}
										alt={t("Cover")}
										class="cover-preview"
									/>
								{:else}
									<span class="muted">{t("No cover")}</span>
								{/if}
							</td>
							<td>{formatDateTime(item.date)}</td>
							<td>{item.mood || "-"}</td>
							<td>{item.location || "-"}</td>
							<td>{item.tags?.join(", ") || "-"}</td>
							<td class="content-cell">{excerpt(item.content)}</td>
							<td>
								<div class="row-actions">
									<button class="ghost-btn" type="button" onclick={() => openEdit(item)}>
										{t("Edit")}
									</button>
									<button class="danger-btn" type="button" onclick={() => deleteDiary(item.id)}>
										{t("Delete")}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if editorMode}
		<div class="modal-shell">
			<div class="modal-card" role="dialog" aria-modal="true" aria-label={t("Diary Editor")}>
				<div class="modal-header">
					<div>
						<h3>{editorMode === "create" ? t("New Diary Entry") : t("Edit Diary Entry")}</h3>
						{#if editingId !== null}
							<p class="modal-subtitle">ID #{editingId}</p>
						{/if}
					</div>
					<button class="close-btn" type="button" onclick={closeEditor} aria-label={t("Close")}>
						×
					</button>
				</div>

				<div class="form-grid">
					<div class="form-group">
						<label for="diary-date">{t("Date & Time")}</label>
						<input id="diary-date" type="datetime-local" bind:value={form.dateTime} />
					</div>
					<div class="form-group">
						<label for="diary-mood">{t("Mood")}</label>
						<input id="diary-mood" type="text" bind:value={form.mood} placeholder={t("e.g. Happy")} />
					</div>
					<div class="form-group full">
						<label for="diary-location">{t("Location")}</label>
						<input id="diary-location" type="text" bind:value={form.location} placeholder={t("Where did this happen?")} />
					</div>
					<div class="form-group full">
						<label for="diary-tags">{t("Tags")}</label>
						<TagInput
							tags={form.tags}
							placeholder={t("Enter a tag")}
							addLabel={t("Add")}
							emptyLabel={t("No tags yet")}
							onChange={(nextTags) => {
								form.tags = nextTags;
								form = { ...form };
							}}
						/>
					</div>
					<div class="form-group full">
						<label for="diary-images">{t("Cover / Images")}</label>
						<p class="helper-text">
							{t("The first image acts as the cover. You can upload multiple images or enter one path per line.")}
						</p>

						{#if previewImages.length > 0}
							<div class="image-grid">
								{#each previewImages as image, index}
									<div class="image-card">
										<img src={getAdminImagePreviewUrl(image)} alt={t("Diary image")} />
										<div class="image-meta">
											<span>{index === 0 ? t("Cover") : `${t("Image")} ${index + 1}`}</span>
											<button type="button" class="link-btn" onclick={() => removeImage(index)}>
												{t("Remove")}
											</button>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="empty-images">{t("No images yet")}</div>
						{/if}

						<div class="image-inputs">
							<textarea
								id="diary-images"
								rows="4"
								bind:value={form.imagesText}
								placeholder={t("One image path or URL per line")}
							></textarea>
							<label class="upload-btn">
								{uploading ? t("Uploading...") : t("Upload Images")}
								<input type="file" accept="image/*" multiple onchange={handleImageUpload} hidden />
							</label>
						</div>
					</div>

					<div class="form-group full">
						<label for="diary-content">{t("Content")}</label>
						<textarea
							id="diary-content"
							rows="12"
							class="content-editor"
							bind:value={form.content}
							placeholder={t("Write your diary content here")}
						></textarea>
					</div>
				</div>

				<div class="modal-actions">
					<button class="primary-btn" type="button" onclick={saveDiary} disabled={saving}>
						{saving ? t("Saving...") : t("Save Changes")}
					</button>
					<button class="secondary-btn" type="button" onclick={closeEditor}>
						{t("Cancel")}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.diary-admin {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.toast {
		padding: 12px 16px;
		border-radius: 12px;
		background: #ecfdf5;
		color: #15803d;
		font-weight: 600;
	}

	.toast.error {
		background: #fef2f2;
		color: #dc2626;
	}

	.toolbar,
	.table-card,
	.modal-card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 20px;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
	}

	.toolbar {
		padding: 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.toolbar h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		color: #111827;
	}

	.toolbar p {
		margin: 8px 0 0;
		font-size: 0.95rem;
		color: #6b7280;
	}

	.primary-btn,
	.secondary-btn,
	.ghost-btn,
	.danger-btn,
	.link-btn,
	.close-btn {
		border: none;
		cursor: pointer;
		font-weight: 600;
	}

	.primary-btn {
		padding: 10px 16px;
		border-radius: 12px;
		background: #4f46e5;
		color: #fff;
	}

	.secondary-btn,
	.ghost-btn {
		padding: 10px 16px;
		border-radius: 12px;
		background: #eef2ff;
		color: #4338ca;
	}

	.danger-btn {
		padding: 10px 16px;
		border-radius: 12px;
		background: #fef2f2;
		color: #dc2626;
	}

	.link-btn {
		background: transparent;
		color: #dc2626;
		padding: 0;
	}

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 9999px;
		background: #f3f4f6;
		color: #374151;
		font-size: 1.5rem;
		line-height: 1;
	}

	.table-card {
		overflow: hidden;
	}

	.entry-table {
		width: 100%;
		border-collapse: collapse;
	}

	.entry-table th,
	.entry-table td {
		padding: 16px;
		border-bottom: 1px solid #f3f4f6;
		vertical-align: top;
		text-align: left;
	}

	.entry-table th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6b7280;
	}

	.entry-table tbody tr:last-child td {
		border-bottom: none;
	}

	.id-cell {
		font-weight: 700;
		color: #111827;
		white-space: nowrap;
	}

	.cover-cell {
		width: 92px;
	}

	.cover-preview {
		width: 64px;
		height: 64px;
		border-radius: 12px;
		object-fit: cover;
		border: 1px solid #e5e7eb;
	}

	.muted,
	.empty-row,
	.empty-images,
	.helper-text,
	.modal-subtitle {
		color: #6b7280;
	}

	.empty-row,
	.empty-images {
		text-align: center;
		padding: 20px;
	}

	.content-cell {
		max-width: 420px;
		line-height: 1.6;
		color: #374151;
	}

	.row-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.modal-shell {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		z-index: 1000;
	}

	.modal-card {
		width: min(1040px, 100%);
		max-height: calc(100vh - 48px);
		overflow: auto;
		padding: 24px;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 20px;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.form-group.full {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-weight: 600;
		color: #374151;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		min-width: 0;
		padding: 12px 14px;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		background: #fff;
		font-size: 0.95rem;
		box-sizing: border-box;
	}

	.content-editor {
		min-height: 260px;
		resize: vertical;
		line-height: 1.7;
	}

	.image-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 14px;
		margin-bottom: 14px;
	}

	.image-card {
		border: 1px solid #e5e7eb;
		border-radius: 16px;
		overflow: hidden;
		background: #f9fafb;
	}

	.image-card img {
		display: block;
		width: 100%;
		height: 150px;
		object-fit: cover;
	}

	.image-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		font-size: 0.9rem;
	}

	.image-inputs {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px;
		align-items: start;
	}

	.upload-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 12px 16px;
		border-radius: 12px;
		background: #eef2ff;
		color: #4338ca;
		font-weight: 600;
		cursor: pointer;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	@media (max-width: 900px) {
		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.form-grid,
		.image-inputs {
			grid-template-columns: 1fr;
		}

		.entry-table {
			display: block;
			overflow-x: auto;
		}
	}
</style>
