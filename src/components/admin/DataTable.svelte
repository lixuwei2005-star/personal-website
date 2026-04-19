<script lang="ts">
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
		translateAdminKey,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Column {
		key: string;
		label: string;
		type?: "text" | "image" | "tags" | "boolean";
	}

	type FieldType =
		| "text"
		| "textarea"
		| "number"
		| "select"
		| "tags"
		| "boolean"
		| "image";

	interface FieldConfig {
		key: string;
		label: string;
		type?: FieldType;
		options?: string[];
		presets?: string[];
		presetRemovable?: boolean;
	}

	interface Props {
		apiBase: string;
		columns: Column[];
		items: any[];
		idField?: string;
		editFields: FieldConfig[];
		createFields?: FieldConfig[];
	}

	let { apiBase, columns, items: initialItems, idField = "id", editFields, createFields }: Props = $props();

	let items = $state([...initialItems]);
	let editingItem = $state<any>(null);
	let editingOriginalId = $state<any>(null);
	let creatingItem = $state<any>(null);
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let uploadingField = $state<string | null>(null);
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let dismissedPresetMap = $state<Record<string, string[]>>({});

	function normalizePresetKey(value: string) {
		return value.trim().toLowerCase();
	}

	function getPresetStorageKey(field: FieldConfig) {
		if (field.presetRemovable === false) {
			return "";
		}
		return `admin-presets:${apiBase}:${field.key}`;
	}

	function loadDismissedPresets(field: FieldConfig) {
		if (typeof window === "undefined" || !field.presets?.length) {
			return [];
		}

		const storageKey = getPresetStorageKey(field);
		try {
			const stored = window.localStorage.getItem(storageKey);
			if (!stored) {
				return [];
			}

			const parsed = JSON.parse(stored);
			return Array.isArray(parsed)
				? parsed.map((value) => normalizePresetKey(String(value))).filter(Boolean)
				: [];
		} catch {
			return [];
		}
	}

	function getVisiblePresets(field: FieldConfig) {
		if (field.presetRemovable === false) {
			return field.presets || [];
		}
		const hiddenPresets = dismissedPresetMap[getPresetStorageKey(field)] || [];
		return (field.presets || []).filter((preset) => !hiddenPresets.includes(normalizePresetKey(preset)));
	}

	function dismissPreset(field: FieldConfig, preset: string) {
		if (typeof window === "undefined" || field.presetRemovable === false) {
			return;
		}

		const storageKey = getPresetStorageKey(field);
		const presetKey = normalizePresetKey(preset);
		const current = dismissedPresetMap[storageKey] || [];
		if (!presetKey || current.includes(presetKey)) {
			return;
		}

		const next = [...current, presetKey];
		dismissedPresetMap = { ...dismissedPresetMap, [storageKey]: next };
		window.localStorage.setItem(storageKey, JSON.stringify(next));
	}

	onMount(() => {
		const presetFields = [...(createFields || editFields), ...editFields].filter(
			(field, index, list) => field.presets?.length && list.findIndex((entry) => entry.key === field.key) === index,
		);
		const nextPresetMap: Record<string, string[]> = {};
		for (const field of presetFields) {
			const storageKey = getPresetStorageKey(field);
			if (!storageKey) {
				continue;
			}
			nextPresetMap[storageKey] = loadDismissedPresets(field);
		}
		dismissedPresetMap = nextPresetMap;

		return onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		});
	});

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function tKey(key: string, params?: Record<string, string | number>) {
		return translateAdminKey(lang, key, params);
	}

	function startCreate() {
		const fields = createFields || editFields;
		const item: any = {};
		for (const f of fields) {
			if (f.type === "number") item[f.key] = 0;
			else if (f.type === "boolean") item[f.key] = false;
			else if (f.type === "tags") item[f.key] = [];
			else item[f.key] = "";
		}
		creatingItem = item;
	}

	function startEdit(item: any) {
		editingItem = { ...item };
		editingOriginalId = item[idField];
	}

	function closeEdit() {
		editingItem = null;
		editingOriginalId = null;
	}

	async function saveCreate() {
		saving = true;
		try {
			const res = await fetch(`${apiBase}/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(creatingItem),
			});
			if (res.ok) {
				const created = await res.json();
				items = [...items, created];
				creatingItem = null;
				message = t("Created!");
				messageKind = "success";
			}
		} catch {
			message = t("Error");
			messageKind = "error";
		}
		saving = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 2000);
	}

	async function saveEdit() {
		saving = true;
		const originalId = editingOriginalId ?? editingItem[idField];
		if (originalId === null || originalId === undefined || String(originalId).trim() === "") {
			message = t("Missing original ID. Refresh the page and try again.");
			messageKind = "error";
			saving = false;
			setTimeout(() => { message = ""; messageKind = ""; }, 3000);
			return;
		}
		try {
			const res = await fetch(`${apiBase}/${encodeURIComponent(String(originalId))}/`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(editingItem),
			});
			if (res.ok) {
				const updated = await res.json();
				items = items.map(i => i[idField] === originalId ? updated : i);
				closeEdit();
				message = t("Updated!");
				messageKind = "success";
			} else {
				message = tKey("dataTable.saveFailedStatus", { status: res.status });
				messageKind = "error";
			}
		} catch {
			message = t("Error");
			messageKind = "error";
		}
		saving = false;
		setTimeout(() => { message = ""; messageKind = ""; }, 2000);
	}

	async function deleteItem(id: any) {
		if (!confirm(t("Delete this item?"))) return;
		try {
			const res = await fetch(`${apiBase}/${id}/`, { method: "DELETE" });
			if (res.ok) {
				items = items.filter(i => i[idField] !== id);
			}
		} catch { /* ignore */ }
	}

	function getDisplayValue(item: any, col: Column): string {
		const val = item[col.key];
		if (col.type === "tags" && Array.isArray(val)) return val.join(", ");
		if (col.type === "boolean") return val ? t("Yes") : t("No");
		return t(String(val ?? ""));
	}

	function getUploadFieldState(mode: "create" | "edit", key: string): string {
		return `${mode}:${key}`;
	}

	function isUploading(mode: "create" | "edit", key: string): boolean {
		return uploadingField === getUploadFieldState(mode, key);
	}

	async function handleImageUpload(
		event: Event,
		mode: "create" | "edit",
		fieldKey: string,
	) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingField = getUploadFieldState(mode, fieldKey);
		try {
			const uploaded = await uploadAdminImage(file);
			if (mode === "create" && creatingItem) {
				creatingItem[fieldKey] = uploaded.url;
				creatingItem = { ...creatingItem };
			}
			if (mode === "edit" && editingItem) {
				editingItem[fieldKey] = uploaded.url;
				editingItem = { ...editingItem };
			}
			message = t("Image uploaded!");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : "Upload failed";
			messageKind = "error";
		}
		input.value = "";
		uploadingField = null;
		setTimeout(() => { message = ""; messageKind = ""; }, 2000);
	}
</script>

<div class="data-table-wrapper">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="table-actions">
		<button class="btn-create" onclick={startCreate}>+ {t("Add New")}</button>
	</div>

	{#if creatingItem}
		<div class="modal-overlay" onclick={() => creatingItem = null}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<h3>{t("Create New")}</h3>
				{#each (createFields || editFields) as field}
					<div class="modal-field">
						{#if field.type !== "boolean"}
							<label>{t(field.label)}</label>
						{/if}
						{#if field.type === "textarea"}
							<textarea bind:value={creatingItem[field.key]} rows="4"></textarea>
						{:else if field.type === "number"}
							<input type="number" bind:value={creatingItem[field.key]} />
						{:else if field.type === "boolean"}
							<label class="check"><input type="checkbox" bind:checked={creatingItem[field.key]} /> {t(field.label)}</label>
						{:else if field.type === "select" && field.options}
							<select bind:value={creatingItem[field.key]}>
								{#each field.options as opt}
									<option value={opt}>{t(opt)}</option>
								{/each}
							</select>
						{:else if field.type === "tags"}
							<TagInput
								tags={Array.isArray(creatingItem[field.key]) ? creatingItem[field.key] : []}
								presets={field.presets || []}
								presetStorageKey={getPresetStorageKey(field)}
								presetRemovable={field.presetRemovable !== false}
								placeholder={t("Enter a tag")}
								addLabel={t("Add")}
								emptyLabel={t("No tags yet")}
								onChange={(nextTags) => {
									creatingItem[field.key] = nextTags;
									creatingItem = { ...creatingItem };
								}}
							/>
						{:else if field.type === "image"}
							<div class="image-field">
								{#if creatingItem[field.key]}
									<img
										src={getAdminImagePreviewUrl(creatingItem[field.key])}
										alt={t(field.label)}
										class="field-image-preview"
									/>
								{/if}
								<div class="image-field-controls">
									<input type="text" bind:value={creatingItem[field.key]} placeholder={t("URL or path")} />
									<label class="upload-field-btn">
										{isUploading("create", field.key) ? t("Uploading...") : t("Upload Image")}
										<input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, "create", field.key)} hidden />
									</label>
								</div>
							</div>
						{:else}
							<input type="text" bind:value={creatingItem[field.key]} />
							{#if field.presets && field.presets.length > 0}
								<div class="field-presets">
									{#each getVisiblePresets(field) as preset}
										<div class="preset-btn">
											<button
												type="button"
												class="preset-btn-main"
												onclick={() => {
													creatingItem[field.key] = preset;
													creatingItem = { ...creatingItem };
												}}
											>
												{preset}
											</button>
											{#if field.presetRemovable !== false}
												<button
													type="button"
													class="preset-btn-remove"
													onclick={() => dismissPreset(field, preset)}
													aria-label={`Dismiss ${preset}`}
												>
													x
												</button>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				{/each}
				<div class="modal-actions">
					<button class="btn-save" onclick={saveCreate} disabled={saving}>{saving ? t("Saving...") : t("Create")}</button>
					<button class="btn-cancel" onclick={() => creatingItem = null}>{t("Cancel")}</button>
				</div>
			</div>
		</div>
	{/if}

	{#if editingItem}
		<div class="modal-overlay" onclick={closeEdit}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<h3>{t("Edit")}</h3>
				{#each editFields as field}
					<div class="modal-field">
						{#if field.type !== "boolean"}
							<label>{t(field.label)}</label>
						{/if}
						{#if field.type === "textarea"}
							<textarea bind:value={editingItem[field.key]} rows="4"></textarea>
						{:else if field.type === "number"}
							<input type="number" bind:value={editingItem[field.key]} />
						{:else if field.type === "boolean"}
							<label class="check"><input type="checkbox" bind:checked={editingItem[field.key]} /> {t(field.label)}</label>
						{:else if field.type === "select" && field.options}
							<select bind:value={editingItem[field.key]}>
								{#each field.options as opt}
									<option value={opt}>{t(opt)}</option>
								{/each}
							</select>
						{:else if field.type === "tags"}
							<TagInput
								tags={Array.isArray(editingItem[field.key]) ? editingItem[field.key] : []}
								presets={field.presets || []}
								presetStorageKey={getPresetStorageKey(field)}
								presetRemovable={field.presetRemovable !== false}
								placeholder={t("Enter a tag")}
								addLabel={t("Add")}
								emptyLabel={t("No tags yet")}
								onChange={(nextTags) => {
									editingItem[field.key] = nextTags;
									editingItem = { ...editingItem };
								}}
							/>
						{:else if field.type === "image"}
							<div class="image-field">
								{#if editingItem[field.key]}
									<img
										src={getAdminImagePreviewUrl(editingItem[field.key])}
										alt={t(field.label)}
										class="field-image-preview"
									/>
								{/if}
								<div class="image-field-controls">
									<input type="text" bind:value={editingItem[field.key]} placeholder={t("URL or path")} />
									<label class="upload-field-btn">
										{isUploading("edit", field.key) ? t("Uploading...") : t("Upload Image")}
										<input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, "edit", field.key)} hidden />
									</label>
								</div>
							</div>
						{:else}
							<input type="text" bind:value={editingItem[field.key]} />
							{#if field.presets && field.presets.length > 0}
								<div class="field-presets">
									{#each getVisiblePresets(field) as preset}
										<div class="preset-btn">
											<button
												type="button"
												class="preset-btn-main"
												onclick={() => {
													editingItem[field.key] = preset;
													editingItem = { ...editingItem };
												}}
											>
												{preset}
											</button>
											{#if field.presetRemovable !== false}
												<button
													type="button"
													class="preset-btn-remove"
													onclick={() => dismissPreset(field, preset)}
													aria-label={`Dismiss ${preset}`}
												>
													x
												</button>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				{/each}
				<div class="modal-actions">
					<button class="btn-save" onclick={saveEdit} disabled={saving}>{saving ? t("Saving...") : t("Save")}</button>
					<button class="btn-cancel" onclick={closeEdit}>{t("Cancel")}</button>
				</div>
			</div>
		</div>
	{/if}

	<table>
		<thead>
			<tr>
				{#each columns as col}
					<th>{t(col.label)}</th>
				{/each}
				<th>{t("Actions")}</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item}
				<tr>
					{#each columns as col}
						<td>
							{#if col.type === "image" && item[col.key]}
								<img src={getAdminImagePreviewUrl(item[col.key])} alt="" class="thumb" />
							{:else}
								{getDisplayValue(item, col)}
							{/if}
						</td>
					{/each}
					<td class="actions-cell">
						<button class="btn-edit" onclick={() => startEdit(item)}>{t("Edit")}</button>
						<button class="btn-del" onclick={() => deleteItem(item[idField])}>{t("Del")}</button>
					</td>
				</tr>
			{/each}
			{#if items.length === 0}
				<tr><td colspan={columns.length + 1} class="empty">{t("No items")}</td></tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.data-table-wrapper { position: relative; }
	.toast { position: fixed; top: 16px; right: 16px; background: #16a34a; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 13px; z-index: 100; }
	.toast.error { background: #dc2626; }
	.table-actions { margin-bottom: 12px; display: flex; justify-content: flex-end; }
	.btn-create { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; }
	.btn-create:hover { background: #4f46e5; }
	table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	th { text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; color: #888; background: #fafafa; border-bottom: 1px solid #eee; }
	td { padding: 10px 14px; border-bottom: 1px solid #f5f5f5; font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
	.actions-cell { display: flex; gap: 6px; white-space: nowrap; }
	.btn-edit { padding: 3px 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
	.btn-del { padding: 3px 10px; background: #fee2e2; border: none; border-radius: 4px; color: #dc2626; cursor: pointer; font-size: 12px; }
	.empty { text-align: center; color: #999; padding: 20px; }

	.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
	.modal { box-sizing: border-box; background: #fff; border-radius: 12px; padding: 24px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
	.modal h3 { margin-bottom: 16px; font-size: 16px; }
	.modal-field { margin-bottom: 12px; min-width: 0; }
	.modal-field label { display: block; font-size: 12px; font-weight: 500; color: #666; margin-bottom: 4px; }
	.modal-field input, .modal-field textarea, .modal-field select { display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
	.modal-field input:focus, .modal-field textarea:focus { outline: none; border-color: #6366f1; }
	.check { display: flex; align-items: center; gap: 6px; font-size: 13px; }
	.image-field { display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
	.field-image-preview { width: 88px; height: 88px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; background: #f8fafc; flex-shrink: 0; }
	.image-field-controls { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
	.field-presets { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
	.preset-btn { display: inline-flex; align-items: center; gap: 2px; border: 1px solid #d1d5db; background: #f8fafc; border-radius: 999px; color: #374151; transition: all 0.2s ease; }
	.preset-btn:hover { background: #eef2ff; border-color: #818cf8; color: #4338ca; }
	.preset-btn-main { padding: 4px 6px 4px 10px; border: none; background: transparent; font-size: 12px; color: inherit; cursor: pointer; }
	.preset-btn-remove { width: 18px; height: 18px; margin-right: 8px; padding: 0; border: none; border-radius: 999px; background: rgba(220, 38, 38, 0.12); color: #dc2626; font-size: 11px; font-weight: 700; line-height: 1; cursor: pointer; }
	.preset-btn-remove:hover { background: rgba(220, 38, 38, 0.18); }
	.upload-field-btn { display: inline-block; width: 100%; padding: 7px 10px; background: #f3f4f6; border-radius: 6px; font-size: 13px; cursor: pointer; text-align: center; }
	.upload-field-btn:hover { background: #e5e7eb; }
	.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
	.btn-save { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; }
	.btn-cancel { padding: 8px 20px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; }
	@media (max-width: 640px) {
		.image-field {
			flex-direction: column;
		}
		.field-image-preview {
			width: 100%;
			height: 180px;
		}
	}
</style>
