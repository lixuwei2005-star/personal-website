<script lang="ts">
	import { onMount } from "svelte";

	import type { Skill } from "../../data/skills";
	import TagInput from "./TagInput.svelte";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Props {
		items: Skill[];
	}

	interface SkillFormState {
		name: string;
		description: string;
		icon: string;
		category: Skill["category"];
		level: Skill["level"];
		experienceYears: string;
		experienceMonths: string;
		projects: string[];
		certifications: string[];
		color: string;
	}

	const categoryOrder: Record<Skill["category"], number> = {
		frontend: 0,
		backend: 1,
		database: 2,
		tools: 3,
		other: 4,
	};

	let { items: initialItems }: Props = $props();

	function slugifySkillId(value: string) {
		return value
			.toLowerCase()
			.trim()
			.replace(/['"]/g, "")
			.replace(/[^a-z0-9-_]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function sortSkills(items: Skill[]) {
		return [...items].sort((a, b) => {
			const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
			if (categoryDiff !== 0) {
				return categoryDiff;
			}
			return a.name.localeCompare(b.name);
		});
	}

	function normalizePositiveInt(value: string, max: number) {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed < 0) {
			return 0;
		}

		return Math.min(Math.floor(parsed), max);
	}

	function normalizeHexColor(value: string) {
		const normalized = value.trim();
		return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)
			? normalized
			: "#3B82F6";
	}

	function toFormState(skill?: Skill): SkillFormState {
		return {
			name: skill?.name ?? "",
			description: skill?.description ?? "",
			icon: skill?.icon ?? "",
			category: skill?.category ?? "other",
			level: skill?.level ?? "beginner",
			experienceYears: String(skill?.experience?.years ?? 0),
			experienceMonths: String(skill?.experience?.months ?? 0),
			projects: [...(skill?.projects ?? [])],
			certifications: [...(skill?.certifications ?? [])],
			color: skill?.color ?? "",
		};
	}

	function toPayload(formState: SkillFormState): Partial<Skill> {
		return {
			name: formState.name.trim(),
			description: formState.description.trim(),
			icon: formState.icon.trim(),
			category: formState.category,
			level: formState.level,
			experience: {
				years: normalizePositiveInt(formState.experienceYears, 99),
				months: normalizePositiveInt(formState.experienceMonths, 11),
			},
			projects: formState.projects,
			certifications: formState.certifications,
			color: formState.color.trim() || undefined,
		};
	}

	function formatExperience(skill: Skill) {
		const parts: string[] = [];
		if (skill.experience.years > 0) {
			parts.push(`${skill.experience.years}${t("Years")}`);
		}
		if (skill.experience.months > 0) {
			parts.push(`${skill.experience.months}${t("Months")}`);
		}
		return parts.join(" ") || `0${t("Months")}`;
	}

	function excerpt(value: string, maxLength = 80) {
		if (value.length <= maxLength) {
			return value;
		}
		return `${value.slice(0, maxLength)}...`;
	}

	function uniqueStrings(values: string[]) {
		return values.filter(
			(value, index, list) =>
				value &&
				list.findIndex((entry) => entry.toLowerCase() === value.toLowerCase()) === index,
		);
	}

	let items = $state(sortSkills(initialItems));
	let editorMode = $state<"create" | "edit" | null>(null);
	let editingId = $state("");
	let form = $state<SkillFormState>(toFormState());
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());
	let certificationPresets = $derived(
		uniqueStrings(items.flatMap((item) => item.certifications ?? [])),
	);
	let skillIdPreview = $derived(slugifySkillId(form.name));
	let colorPreview = $derived(normalizeHexColor(form.color));

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

	function openEdit(skill: Skill) {
		editorMode = "edit";
		editingId = skill.id;
		form = toFormState(skill);
		message = "";
		messageKind = "";
	}

	function closeEditor() {
		editorMode = null;
		editingId = "";
		form = toFormState();
	}

	async function saveSkill() {
		if (!form.name.trim()) {
			setMessage("error", t("Skill name is required"));
			return;
		}

		saving = true;
		try {
			const response = await fetch(
				editorMode === "create"
					? "/api/admin/skills/"
					: `/api/admin/skills/${encodeURIComponent(editingId)}/`,
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
					? sortSkills([...items, result])
					: sortSkills(items.map((item) => (item.id === editingId ? result : item)));

			setMessage(
				"success",
				editorMode === "create" ? t("Skill created!") : t("Skill updated!"),
			);
			closeEditor();
		} catch (error) {
			setMessage("error", error instanceof Error ? error.message : t("Save failed"));
		} finally {
			saving = false;
		}
	}

	async function deleteSkillById(skillId: string) {
		if (!confirm(t("Delete this skill?"))) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/skills/${encodeURIComponent(skillId)}/`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(t("Delete failed"));
			}

			items = items.filter((item) => item.id !== skillId);
			setMessage("success", t("Skill deleted!"));
		} catch (error) {
			setMessage("error", error instanceof Error ? error.message : t("Delete failed"));
		}
	}
</script>

<div class="skill-admin">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="toolbar">
		<div>
			<h3>{t("Skill Management")}</h3>
			<p>{t("The system generates the skill ID automatically from the skill name. Existing skills keep their current ID when edited.")}</p>
		</div>
		<button class="primary-btn" type="button" onclick={openCreate}>
			+ {t("New Skill")}
		</button>
	</div>

	<div class="table-card">
		<table class="skill-table">
			<thead>
				<tr>
					<th>{t("Name")}</th>
					<th>{t("Category")}</th>
					<th>{t("Level")}</th>
					<th>{t("Experience")}</th>
					<th>{t("Certifications")}</th>
					<th>{t("Color")}</th>
					<th>ID</th>
					<th>{t("Actions")}</th>
				</tr>
			</thead>
			<tbody>
				{#if items.length === 0}
					<tr>
						<td colspan="8" class="empty-row">{t("No skills yet")}</td>
					</tr>
				{:else}
					{#each items as skill}
						<tr>
							<td>
								<div class="name-cell">
									<strong>{skill.name}</strong>
									<span>{excerpt(skill.description)}</span>
								</div>
							</td>
							<td>{t(skill.category)}</td>
							<td>{t(skill.level)}</td>
							<td>{formatExperience(skill)}</td>
							<td>{skill.certifications?.length ?? 0}</td>
							<td>
								<div class="color-cell">
									<span class="color-dot" style={`background:${skill.color || "#3B82F6"}`}></span>
									<span>{skill.color || "-"}</span>
								</div>
							</td>
							<td class="mono-cell">{skill.id}</td>
							<td>
								<div class="row-actions">
									<button class="ghost-btn" type="button" onclick={() => openEdit(skill)}>
										{t("Edit")}
									</button>
									<button class="danger-btn" type="button" onclick={() => deleteSkillById(skill.id)}>
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
			<div class="modal-card" role="dialog" aria-modal="true" aria-label={t("Skill Editor")}>
				<div class="modal-header">
					<div>
						<h3>{editorMode === "create" ? t("New Skill") : t("Edit Skill")}</h3>
						<p class="modal-subtitle">
							{editorMode === "create"
								? t("ID will be generated automatically from the skill name when you save.")
								: t("Skill ID is managed by the system and stays unchanged when you edit.")}
						</p>
						<p class="mono-subtitle">
							ID: {editorMode === "edit" ? editingId : skillIdPreview || t("Auto-generated after saving")}
						</p>
					</div>
					<button class="close-btn" type="button" onclick={closeEditor} aria-label={t("Close")}>
						x
					</button>
				</div>

				<div class="form-grid">
					<div class="form-group">
						<label for="skill-name">{t("Name")}</label>
						<input id="skill-name" type="text" bind:value={form.name} />
					</div>
					<div class="form-group">
						<label for="skill-icon">{t("Icon")}</label>
						<input
							id="skill-icon"
							type="text"
							bind:value={form.icon}
							placeholder="logos:java"
						/>
						<p class="helper-text">{t("Supports Iconify icon names such as logos:java or devicon:python.")}</p>
					</div>
					<div class="form-group">
						<label for="skill-category">{t("Category")}</label>
						<select id="skill-category" bind:value={form.category}>
							<option value="frontend">{t("frontend")}</option>
							<option value="backend">{t("backend")}</option>
							<option value="database">{t("database")}</option>
							<option value="tools">{t("tools")}</option>
							<option value="other">{t("other")}</option>
						</select>
					</div>
					<div class="form-group">
						<label for="skill-level">{t("Level")}</label>
						<select id="skill-level" bind:value={form.level}>
							<option value="beginner">{t("beginner")}</option>
							<option value="intermediate">{t("intermediate")}</option>
							<option value="advanced">{t("advanced")}</option>
							<option value="expert">{t("expert")}</option>
						</select>
					</div>
					<div class="form-group full">
						<label for="skill-description">{t("Description")}</label>
						<textarea id="skill-description" rows="4" bind:value={form.description}></textarea>
					</div>
					<div class="form-group">
						<label for="skill-years">{t("Experience (Years)")}</label>
						<input id="skill-years" type="number" min="0" max="99" bind:value={form.experienceYears} />
					</div>
					<div class="form-group">
						<label for="skill-months">{t("Experience (Months)")}</label>
						<input id="skill-months" type="number" min="0" max="11" bind:value={form.experienceMonths} />
					</div>
					<div class="form-group full">
						<label for="skill-certifications">{t("Certifications")}</label>
						<TagInput
							tags={form.certifications}
							presets={certificationPresets}
							presetStorageKey="admin-presets:skills:certifications"
							placeholder={t("Enter a certification")}
							addLabel={t("Add")}
							emptyLabel={t("No certifications yet")}
							onChange={(nextTags) => {
								form.certifications = nextTags;
								form = { ...form };
							}}
						/>
					</div>
					<div class="form-group full">
						<label for="skill-color">{t("Theme Color")}</label>
						<div class="color-editor">
							<input
								id="skill-color"
								type="text"
								bind:value={form.color}
								placeholder="#3B82F6"
							/>
							<input
								type="color"
								value={colorPreview}
								oninput={(event) => {
									form.color = (event.currentTarget as HTMLInputElement).value;
									form = { ...form };
								}}
								aria-label={t("Theme Color")}
							/>
							<div class="color-preview">
								<span class="color-dot large" style={`background:${colorPreview}`}></span>
								<span>{t("Color Preview")}</span>
							</div>
						</div>
						<p class="helper-text">{t("Use a hex color such as #3B82F6.")}</p>
					</div>
				</div>

				<div class="modal-actions">
					<button class="primary-btn" type="button" onclick={saveSkill} disabled={saving}>
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
	.skill-admin {
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
	.empty-row {
		color: #6b7280;
	}

	.primary-btn,
	.secondary-btn,
	.ghost-btn,
	.danger-btn,
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

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 9999px;
		background: #f3f4f6;
		color: #374151;
		font-size: 1.25rem;
		line-height: 1;
	}

	.skill-table {
		width: 100%;
		border-collapse: collapse;
	}

	.skill-table th,
	.skill-table td {
		padding: 16px;
		border-bottom: 1px solid #f3f4f6;
		text-align: left;
		vertical-align: top;
	}

	.skill-table th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6b7280;
	}

	.skill-table tbody tr:last-child td {
		border-bottom: none;
	}

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 320px;
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
		.color-editor {
			grid-template-columns: 1fr;
		}

		.skill-table {
			display: block;
			overflow-x: auto;
		}
	}
</style>
