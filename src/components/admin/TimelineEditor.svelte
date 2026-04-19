<script lang="ts">
	import { onMount } from "svelte";

	import TagInput from "./TagInput.svelte";
	import type {
		TimelineItem,
		TimelineLink,
	} from "../../components/features/timeline/types";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Props {
		items: TimelineItem[];
	}

	interface TimelineFormState {
		title: string;
		description: string;
		type: TimelineItem["type"];
		startDate: string;
		endDate: string;
		location: string;
		organization: string;
		position: string;
		icon: string;
		color: string;
		featured: boolean;
		skills: string[];
		achievements: string[];
		links: TimelineLink[];
	}

	const typeOptions: TimelineItem["type"][] = [
		"education",
		"work",
		"project",
		"achievement",
	];

	const linkTypeOptions: TimelineLink["type"][] = [
		"website",
		"certificate",
		"project",
		"other",
	];

	let { items: initialItems }: Props = $props();

	function sortItems(items: TimelineItem[]) {
		return [...items].sort((a, b) => {
			const dateDiff =
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
			if (dateDiff !== 0) {
				return dateDiff;
			}
			return a.title.localeCompare(b.title);
		});
	}

	function slugifyTimelineId(value: string) {
		return value
			.toLowerCase()
			.trim()
			.replace(/['"]/g, "")
			.replace(/[^a-z0-9-_]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function normalizeHexColor(value: string) {
		const normalized = value.trim();
		return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)
			? normalized
			: "#3B82F6";
	}

	function uniqueStrings(values: string[]) {
		return values.filter(
			(value, index, list) =>
				value &&
				list.findIndex(
					(entry) => entry.toLowerCase() === value.toLowerCase(),
				) === index,
		);
	}

	function toFormState(item?: TimelineItem): TimelineFormState {
		return {
			title: item?.title ?? "",
			description: item?.description ?? "",
			type: item?.type ?? "project",
			startDate: item?.startDate ?? "",
			endDate: item?.endDate ?? "",
			location: item?.location ?? "",
			organization: item?.organization ?? "",
			position: item?.position ?? "",
			icon: item?.icon ?? "",
			color: item?.color ?? "",
			featured: item?.featured ?? false,
			skills: [...(item?.skills ?? [])],
			achievements: [...(item?.achievements ?? [])],
			links: [...(item?.links ?? [])],
		};
	}

	function toPayload(formState: TimelineFormState): Partial<TimelineItem> {
		return {
			title: formState.title.trim(),
			description: formState.description.trim(),
			type: formState.type,
			startDate: formState.startDate,
			endDate: formState.endDate.trim() || undefined,
			location: formState.location.trim() || undefined,
			organization: formState.organization.trim() || undefined,
			position: formState.position.trim() || undefined,
			icon: formState.icon.trim() || undefined,
			color: formState.color.trim() || undefined,
			featured: formState.featured,
			skills: formState.skills,
			achievements: formState.achievements,
			links: formState.links
				.map((link) => ({
					name: link.name.trim(),
					url: link.url.trim(),
					type: link.type,
				}))
				.filter((link) => link.name && link.url),
		};
	}

	function formatDateRange(item: TimelineItem) {
		const start = item.startDate || "-";
		const end = item.endDate || t("Present");
		return `${start} - ${end}`;
	}

	function excerpt(value: string, maxLength = 80) {
		if (value.length <= maxLength) {
			return value;
		}
		return `${value.slice(0, maxLength)}...`;
	}

	let items = $state(sortItems(initialItems));
	let editorMode = $state<"create" | "edit" | null>(null);
	let editingId = $state("");
	let form = $state<TimelineFormState>(toFormState());
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let colorPreview = $derived(normalizeHexColor(form.color));
	let skillPresets = $derived(
		uniqueStrings(items.flatMap((item) => item.skills ?? [])),
	);
	let achievementPresets = $derived(
		uniqueStrings(items.flatMap((item) => item.achievements ?? [])),
	);
	let timelineIdPreview = $derived(slugifyTimelineId(form.title));

	onMount(() =>
		onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		}),
	);

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function setMessage(kind: "success" | "error", value: string) {
		messageKind = kind;
		message = value;
	}

	function openCreate() {
		editorMode = "create";
		editingId = "";
		form = toFormState();
		message = "";
		messageKind = "";
	}

	function openEdit(item: TimelineItem) {
		editorMode = "edit";
		editingId = item.id;
		form = toFormState(item);
		message = "";
		messageKind = "";
	}

	function closeEditor() {
		editorMode = null;
		editingId = "";
		form = toFormState();
	}

	function addLink() {
		form.links = [
			...form.links,
			{ name: "", url: "", type: "website" },
		];
		form = { ...form };
	}

	function updateLink(
		index: number,
		key: keyof TimelineLink,
		value: string,
	) {
		form.links = form.links.map((link, linkIndex) =>
			linkIndex === index ? { ...link, [key]: value } : link,
		);
		form = { ...form };
	}

	function removeLink(index: number) {
		form.links = form.links.filter((_, linkIndex) => linkIndex !== index);
		form = { ...form };
	}

	async function saveTimeline() {
		if (!form.title.trim()) {
			setMessage("error", t("Timeline title is required"));
			return;
		}

		if (!form.startDate) {
			setMessage("error", t("Please choose a start date"));
			return;
		}

		if (
			form.endDate &&
			new Date(form.endDate).getTime() < new Date(form.startDate).getTime()
		) {
			setMessage("error", t("End date cannot be earlier than start date"));
			return;
		}

		saving = true;
		try {
			const response = await fetch(
				editorMode === "create"
					? "/api/admin/timeline/"
					: `/api/admin/timeline/${encodeURIComponent(editingId)}/`,
				{
					method: editorMode === "create" ? "POST" : "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(toPayload(form)),
				},
			);
			const result = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(result?.error || t("Save failed"));
			}

			items =
				editorMode === "create"
					? sortItems([...items, result])
					: sortItems(
							items.map((item) =>
								item.id === editingId ? result : item,
							),
						);

			setMessage(
				"success",
				editorMode === "create"
					? t("Timeline entry created!")
					: t("Timeline entry updated!"),
			);
			closeEditor();
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Save failed"),
			);
		} finally {
			saving = false;
		}
	}

	async function deleteTimelineItem(id: string) {
		if (!confirm(t("Delete this timeline entry?"))) {
			return;
		}

		try {
			const response = await fetch(
				`/api/admin/timeline/${encodeURIComponent(id)}/`,
				{
					method: "DELETE",
				},
			);
			if (!response.ok) {
				throw new Error(t("Delete failed"));
			}
			items = items.filter((item) => item.id !== id);
			setMessage("success", t("Timeline entry deleted!"));
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Delete failed"),
			);
		}
	}
</script>

<div class="timeline-admin">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="toolbar">
		<div>
			<h3>{t("Timeline Management")}</h3>
			<p>
				{t(
					"The system generates the timeline ID automatically from the title when creating a new entry. Front-end fields like achievements, skills, links, colors, and icons can all be edited here.",
				)}
			</p>
		</div>
		<button class="primary-btn" type="button" onclick={openCreate}>
			+ {t("New Timeline Entry")}
		</button>
	</div>

	<div class="table-card">
		<table class="timeline-table">
			<thead>
				<tr>
					<th>{t("Title")}</th>
					<th>{t("Type")}</th>
					<th>{t("Date Range")}</th>
					<th>{t("Organization")}</th>
					<th>{t("Achievements")}</th>
					<th>{t("Color")}</th>
					<th>ID</th>
					<th>{t("Actions")}</th>
				</tr>
			</thead>
			<tbody>
				{#if items.length === 0}
					<tr>
						<td colspan="8" class="empty-row">
							{t("No timeline entries yet")}
						</td>
					</tr>
				{:else}
					{#each items as item}
						<tr>
							<td>
								<div class="name-cell">
									<strong>{item.title}</strong>
									<span>{excerpt(item.description)}</span>
								</div>
							</td>
							<td>{t(item.type)}</td>
							<td>{formatDateRange(item)}</td>
							<td>{item.organization || "-"}</td>
							<td>{item.achievements?.length ?? 0}</td>
							<td>
								<div class="color-cell">
									<span
										class="color-dot"
										style={`background:${item.color || "#3B82F6"}`}
									></span>
									<span>{item.color || "-"}</span>
								</div>
							</td>
							<td class="mono-cell">{item.id}</td>
							<td>
								<div class="row-actions">
									<button
										class="ghost-btn"
										type="button"
										onclick={() => openEdit(item)}
									>
										{t("Edit")}
									</button>
									<button
										class="danger-btn"
										type="button"
										onclick={() => deleteTimelineItem(item.id)}
									>
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
			<div
				class="modal-card"
				role="dialog"
				aria-modal="true"
				aria-label={t("Timeline Editor")}
			>
				<div class="modal-header">
					<div>
						<h3>
							{editorMode === "create"
								? t("New Timeline Entry")
								: t("Edit Timeline Entry")}
						</h3>
						<p class="modal-subtitle">
							{editorMode === "create"
								? t(
										"ID will be generated automatically from the title when you save.",
									)
								: t(
										"Timeline ID is managed by the system and stays unchanged when you edit.",
									)}
						</p>
						<p class="mono-subtitle">
							ID: {editorMode === "edit"
								? editingId
								: timelineIdPreview || t("Auto-generated after saving")}
						</p>
					</div>
					<button
						class="close-btn"
						type="button"
						onclick={closeEditor}
						aria-label={t("Close")}
					>
						x
					</button>
				</div>

				<div class="form-grid">
					<div class="form-group">
						<label for="timeline-title">{t("Title")}</label>
						<input id="timeline-title" type="text" bind:value={form.title} />
					</div>
					<div class="form-group">
						<label for="timeline-type">{t("Type")}</label>
						<select id="timeline-type" bind:value={form.type}>
							{#each typeOptions as option}
								<option value={option}>{t(option)}</option>
							{/each}
						</select>
					</div>

					<div class="form-group full">
						<label for="timeline-description">{t("Description")}</label>
						<textarea
							id="timeline-description"
							rows="5"
							bind:value={form.description}
						></textarea>
					</div>

					<div class="form-group">
						<label for="timeline-start-date">{t("Start Date")}</label>
						<input
							id="timeline-start-date"
							type="date"
							bind:value={form.startDate}
						/>
					</div>
					<div class="form-group">
						<label for="timeline-end-date">{t("End Date")}</label>
						<input
							id="timeline-end-date"
							type="date"
							bind:value={form.endDate}
						/>
						<p class="helper-text">
							{t("Leave end date empty if this entry is still ongoing.")}
						</p>
					</div>

					<div class="form-group">
						<label for="timeline-location">{t("Location")}</label>
						<input
							id="timeline-location"
							type="text"
							bind:value={form.location}
						/>
					</div>
					<div class="form-group">
						<label for="timeline-organization">{t("Organization")}</label>
						<input
							id="timeline-organization"
							type="text"
							bind:value={form.organization}
						/>
					</div>

					<div class="form-group">
						<label for="timeline-position">{t("Position")}</label>
						<input
							id="timeline-position"
							type="text"
							bind:value={form.position}
						/>
					</div>
					<div class="form-group">
						<label for="timeline-icon">{t("Icon")}</label>
						<input
							id="timeline-icon"
							type="text"
							bind:value={form.icon}
							placeholder="material-symbols:emoji-events"
						/>
						<p class="helper-text">
							{t("Supports Iconify icon names such as material-symbols:work or logos:java.")}
						</p>
					</div>

					<div class="form-group full">
						<label for="timeline-color">{t("Theme Color")}</label>
						<div class="color-editor">
							<input
								id="timeline-color"
								type="text"
								bind:value={form.color}
								placeholder="#3B82F6"
							/>
							<input
								type="color"
								value={colorPreview}
								oninput={(event) => {
									form.color = (
										event.currentTarget as HTMLInputElement
									).value;
									form = { ...form };
								}}
								aria-label={t("Theme Color")}
							/>
							<div class="color-preview">
								<span
									class="color-dot large"
									style={`background:${colorPreview}`}
								></span>
								<span>{t("Color Preview")}</span>
							</div>
						</div>
						<p class="helper-text">{t("Use a hex color such as #3B82F6.")}</p>
					</div>

					<div class="form-group full">
						<label for="timeline-skills">{t("Skills")}</label>
						<TagInput
							tags={form.skills}
							presets={skillPresets}
							presetStorageKey="admin-presets:timeline:skills"
							placeholder={t("Enter a skill")}
							addLabel={t("Add")}
							emptyLabel={t("No skills yet")}
							onChange={(nextTags) => {
								form.skills = nextTags;
								form = { ...form };
							}}
						/>
					</div>

					<div class="form-group full">
						<label for="timeline-achievements">{t("Achievements")}</label>
						<TagInput
							tags={form.achievements}
							presets={achievementPresets}
							presetStorageKey="admin-presets:timeline:achievements"
							placeholder={t("Enter an achievement")}
							addLabel={t("Add")}
							emptyLabel={t("No achievements yet")}
							onChange={(nextTags) => {
								form.achievements = nextTags;
								form = { ...form };
							}}
						/>
					</div>

					<div class="form-group full">
						<label>{t("Links")}</label>
						<div class="links-panel">
							{#if form.links.length === 0}
								<div class="empty-links">{t("No links yet")}</div>
							{:else}
								{#each form.links as link, index}
									<div class="link-card">
										<div class="link-grid">
											<input
												type="text"
												value={link.name}
												placeholder={t("Name")}
												oninput={(event) =>
													updateLink(
														index,
														"name",
														(event.currentTarget as HTMLInputElement)
															.value,
													)}
											/>
											<select
												value={link.type}
												onchange={(event) =>
													updateLink(
														index,
														"type",
														(event.currentTarget as HTMLSelectElement)
															.value,
													)}
											>
												{#each linkTypeOptions as option}
													<option value={option}>{t(option)}</option>
												{/each}
											</select>
											<input
												type="url"
												value={link.url}
												placeholder="https://example.com"
												oninput={(event) =>
													updateLink(
														index,
														"url",
														(event.currentTarget as HTMLInputElement)
															.value,
													)}
											/>
										</div>
										<button
											type="button"
											class="link-remove-btn"
											onclick={() => removeLink(index)}
										>
											{t("Remove")}
										</button>
									</div>
								{/each}
							{/if}
							<button class="secondary-btn" type="button" onclick={addLink}>
								+ {t("Add Link")}
							</button>
						</div>
					</div>

					<div class="form-group full checkbox-field">
						<label class="checkbox-row" for="timeline-featured">
							<input
								id="timeline-featured"
								type="checkbox"
								bind:checked={form.featured}
							/>
							<span>{t("Featured")}</span>
						</label>
					</div>
				</div>

				<div class="modal-actions">
					<button
						class="primary-btn"
						type="button"
						onclick={saveTimeline}
						disabled={saving}
					>
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
	.timeline-admin {
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

	.toolbar h3,
	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		color: #111827;
	}

	.toolbar p,
	.helper-text,
	.modal-subtitle,
	.name-cell span,
	.empty-row,
	.empty-links {
		color: #6b7280;
	}

	.primary-btn,
	.secondary-btn,
	.ghost-btn,
	.danger-btn,
	.close-btn,
	.link-remove-btn {
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

	.danger-btn,
	.link-remove-btn {
		padding: 10px 16px;
		border-radius: 12px;
		background: #fef2f2;
		color: #dc2626;
	}

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 9999px;
		background: #f3f4f6;
		color: #374151;
		font-size: 1.25rem;
		line-height: 1;
	}

	.timeline-table {
		width: 100%;
		border-collapse: collapse;
	}

	.timeline-table th,
	.timeline-table td {
		padding: 16px;
		border-bottom: 1px solid #f3f4f6;
		text-align: left;
		vertical-align: top;
	}

	.timeline-table th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6b7280;
	}

	.timeline-table tbody tr:last-child td {
		border-bottom: none;
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 340px;
	}

	.color-cell,
	.color-preview {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.color-dot {
		display: inline-block;
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		border: 1px solid rgba(15, 23, 42, 0.12);
	}

	.color-dot.large {
		width: 18px;
		height: 18px;
	}

	.mono-cell,
	.mono-subtitle {
		font-family: "JetBrains Mono", Consolas, monospace;
		font-size: 0.85rem;
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
		width: min(1100px, 100%);
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
	.form-group textarea,
	.form-group select {
		width: 100%;
		min-width: 0;
		padding: 12px 14px;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		background: #fff;
		font-size: 0.95rem;
		box-sizing: border-box;
	}

	.form-group textarea {
		resize: vertical;
		line-height: 1.7;
		min-height: 130px;
	}

	.checkbox-field {
		margin-top: 2px;
	}

	.checkbox-row {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-weight: 600;
		color: #374151;
	}

	.checkbox-row input {
		width: 18px;
		height: 18px;
		margin: 0;
	}

	.color-editor {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 12px;
		align-items: center;
	}

	.color-editor input[type="color"] {
		width: 56px;
		height: 48px;
		padding: 4px;
		border-radius: 12px;
		cursor: pointer;
	}

	.links-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.link-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px;
		border: 1px solid #e5e7eb;
		border-radius: 14px;
		background: #f8fafc;
	}

	.link-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 180px minmax(0, 1.2fr);
		gap: 12px;
	}

	.empty-links,
	.empty-row {
		text-align: center;
		padding: 20px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	@media (max-width: 960px) {
		.toolbar,
		.modal-header {
			flex-direction: column;
			align-items: stretch;
		}

		.form-grid,
		.color-editor,
		.link-grid {
			grid-template-columns: 1fr;
		}

		.timeline-table {
			display: block;
			overflow-x: auto;
		}
	}
</style>
