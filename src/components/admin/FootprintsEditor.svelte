<script lang="ts">
	import { onMount } from "svelte";

	import type { FootprintItem } from "../../data/footprints";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Props {
		items: FootprintItem[];
	}

	interface CountryOption {
		code: string;
		name: string;
	}

	interface RegionOption {
		code: string;
		name: string;
	}

	let { items: initialItems }: Props = $props();

	function sortItems(items: FootprintItem[]) {
		return [...items].sort((a, b) => {
			const aDate = a.visitedAt ? new Date(a.visitedAt).getTime() : 0;
			const bDate = b.visitedAt ? new Date(b.visitedAt).getTime() : 0;
			if (aDate !== bDate) {
				return bDate - aDate;
			}
			return b.id - a.id;
		});
	}

	function toDateInputValue(value?: string) {
		if (!value) {
			return new Date().toISOString().slice(0, 10);
		}

		const normalized = value.slice(0, 10);
		return /^\d{4}-\d{2}-\d{2}$/.test(normalized)
			? normalized
			: new Date().toISOString().slice(0, 10);
	}

	function displayTitle(item: FootprintItem) {
		return item.province || item.country || item.title;
	}

	function displayLocation(item: FootprintItem) {
		return [item.country, item.province].filter(Boolean).join(" / ");
	}

	let items = $state(sortItems(initialItems));
	let countries = $state<CountryOption[]>([]);
	let regions = $state<RegionOption[]>([]);
	let editorMode = $state<"create" | "edit" | null>(null);
	let editingId = $state<number | null>(null);
	let selectedCountryCode = $state("");
	let selectedRegionName = $state("");
	let visitedAt = $state(toDateInputValue());
	let notes = $state("");
	let loadingCountries = $state(false);
	let loadingRegions = $state(false);
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());

	onMount(() => {
		void loadCountries();
		return onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		});
	});

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function setMessage(kind: "success" | "error", value: string) {
		messageKind = kind;
		message = value;
	}

	function getCountryDisplayName(option: CountryOption) {
		try {
			const displayNames = new Intl.DisplayNames(
				[lang === "zh-CN" ? "zh-CN" : "en"],
				{ type: "region" },
			);
			return displayNames.of(option.code) || option.name;
		} catch {
			return option.name;
		}
	}

	function closeEditor() {
		editorMode = null;
		editingId = null;
		selectedCountryCode = "";
		selectedRegionName = "";
		visitedAt = toDateInputValue();
		notes = "";
		regions = [];
	}

	async function loadCountries() {
		loadingCountries = true;
		try {
			const response = await fetch("/api/admin/footprints/options/");
			const payload = (await response.json().catch(() => [])) as CountryOption[];
			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(t("Failed to load footprint options"));
			}

			countries = payload;
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error
					? error.message
					: t("Failed to load footprint options"),
			);
		} finally {
			loadingCountries = false;
		}
	}

	async function loadRegions(countryCode: string, preserveName = "") {
		if (!countryCode) {
			regions = [];
			return;
		}

		loadingRegions = true;
		try {
			const response = await fetch(
				`/api/admin/footprints/options/?countryCode=${encodeURIComponent(countryCode)}`,
			);
			const payload = (await response.json().catch(() => [])) as RegionOption[];
			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(t("Failed to load administrative regions"));
			}

			const nextRegions = [...payload];
			if (
				preserveName &&
				!nextRegions.some((region) => region.name === preserveName)
			) {
				nextRegions.unshift({
					code: preserveName,
					name: preserveName,
				});
			}

			regions = nextRegions;
		} catch (error) {
			regions = preserveName
				? [{ code: preserveName, name: preserveName }]
				: [];
			setMessage(
				"error",
				error instanceof Error
					? error.message
					: t("Failed to load administrative regions"),
			);
		} finally {
			loadingRegions = false;
		}
	}

	async function openCreate() {
		if (countries.length === 0) {
			await loadCountries();
		}

		editorMode = "create";
		editingId = null;
		selectedCountryCode = "";
		selectedRegionName = "";
		visitedAt = toDateInputValue();
		notes = "";
		regions = [];
		message = "";
		messageKind = "";
	}

	async function openEdit(item: FootprintItem) {
		if (countries.length === 0) {
			await loadCountries();
		}

		editorMode = "edit";
		editingId = item.id;
		selectedCountryCode =
			countries.find(
				(country) => country.name.toLowerCase() === item.country.toLowerCase(),
			)?.code ?? "";
		selectedRegionName = item.province || "";
		visitedAt = toDateInputValue(item.visitedAt);
		notes = item.notes || "";
		message = "";
		messageKind = "";

		if (selectedCountryCode) {
			await loadRegions(selectedCountryCode, selectedRegionName);
		} else {
			regions = selectedRegionName
				? [{ code: selectedRegionName, name: selectedRegionName }]
				: [];
		}
	}

	async function handleCountryChange(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		selectedCountryCode = target.value;
		selectedRegionName = "";
		await loadRegions(selectedCountryCode);
	}

	async function saveFootprint() {
		if (!selectedCountryCode) {
			setMessage("error", t("Please choose a country"));
			return;
		}

		if (!selectedRegionName) {
			setMessage("error", t("Please choose an administrative region"));
			return;
		}

		saving = true;
		try {
			const response = await fetch(
				editorMode === "create"
					? "/api/admin/footprints/"
					: `/api/admin/footprints/${editingId}/`,
				{
					method: editorMode === "create" ? "POST" : "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						countryCode: selectedCountryCode,
						province: selectedRegionName,
						visitedAt,
						notes,
					}),
				},
			);
			const payload = await response.json().catch(() => null);
			if (!response.ok || !payload) {
				throw new Error(payload?.error || t("Save failed"));
			}

			items =
				editorMode === "create"
					? sortItems([...items, payload as FootprintItem])
					: sortItems(
							items.map((item) =>
								item.id === editingId ? (payload as FootprintItem) : item,
							),
						);

			setMessage(
				"success",
				editorMode === "create"
					? t("Footprint created!")
					: t("Footprint updated!"),
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

	async function deleteFootprint(itemId: number) {
		if (!confirm(t("Delete this footprint?"))) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/footprints/${itemId}/`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(t("Delete failed"));
			}

			items = items.filter((item) => item.id !== itemId);
			setMessage("success", t("Footprint deleted!"));
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Delete failed"),
			);
		}
	}
</script>

<div class="footprint-admin">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="toolbar">
		<div>
			<h3>{t("Footprint Management")}</h3>
			<p>
				{t("Select a country and administrative region. The system will automatically locate and mark the place on the map.")}
			</p>
		</div>
		<button class="primary-btn" type="button" onclick={() => void openCreate()}>
			+ {t("New Footprint")}
		</button>
	</div>

	{#if items.length === 0}
		<div class="empty-state">{t("No footprints yet")}</div>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>{t("Location")}</th>
						<th>{t("Country")}</th>
						<th>{t("Visited Date")}</th>
						<th>{t("Actions")}</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item}
						<tr>
							<td>
								<div class="item-title">{displayTitle(item)}</div>
								{#if item.notes}
									<div class="item-subtitle">{item.notes}</div>
								{/if}
							</td>
							<td>{displayLocation(item)}</td>
							<td>{item.visitedAt || "-"}</td>
							<td class="actions">
								<button class="link-btn" type="button" onclick={() => void openEdit(item)}>
									{t("Edit")}
								</button>
								<button
									class="link-btn danger"
									type="button"
									onclick={() => void deleteFootprint(item.id)}
								>
									{t("Delete")}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if editorMode}
		<div class="modal-backdrop" onclick={closeEditor}>
			<div class="modal-card" onclick={(event) => event.stopPropagation()}>
				<div class="modal-header">
					<h3>
						{editorMode === "create" ? t("New Footprint") : t("Edit Footprint")}
					</h3>
				</div>

				<div class="field-grid">
					<label class="field">
						<span>{t("Country")}</span>
						<select
							value={selectedCountryCode}
							onchange={handleCountryChange}
							disabled={loadingCountries || saving}
						>
							<option value="">
								{loadingCountries
									? t("Loading countries...")
									: t("Select a country")}
							</option>
							{#each countries as country}
								<option value={country.code}>
									{getCountryDisplayName(country)}
								</option>
							{/each}
						</select>
					</label>

					<label class="field">
						<span>{t("Administrative Region")}</span>
						<select
							bind:value={selectedRegionName}
							disabled={!selectedCountryCode || loadingRegions || saving}
						>
							<option value="">
								{loadingRegions
									? t("Loading administrative regions...")
									: t("Select an administrative region")}
							</option>
							{#each regions as region}
								<option value={region.name}>{region.name}</option>
							{/each}
						</select>
					</label>
				</div>

				<div class="field-grid">
					<label class="field">
						<span>{t("Visited Date")}</span>
						<input bind:value={visitedAt} type="date" />
					</label>
				</div>

				<label class="field">
					<span>{t("Notes")}</span>
					<textarea
						bind:value={notes}
						rows="5"
						placeholder={t("Optional notes about this trip")}
					></textarea>
				</label>

				<div class="modal-actions">
					<button class="primary-btn" type="button" onclick={saveFootprint} disabled={saving}>
						{saving ? t("Saving...") : editorMode === "create" ? t("Create") : t("Save")}
					</button>
					<button class="secondary-btn" type="button" onclick={closeEditor} disabled={saving}>
						{t("Cancel")}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.footprint-admin {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.toast {
		padding: 0.9rem 1rem;
		border-radius: 1rem;
		background: rgba(34, 197, 94, 0.12);
		color: #166534;
	}

	.toast.error {
		background: rgba(239, 68, 68, 0.12);
		color: #b91c1c;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.75rem;
		border-radius: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 36px rgba(15, 23, 42, 0.06);
	}

	.toolbar h3 {
		margin: 0 0 0.4rem;
		font-size: 2rem;
	}

	.toolbar p {
		margin: 0;
		color: rgba(15, 23, 42, 0.7);
		line-height: 1.7;
		max-width: 46rem;
	}

	.primary-btn,
	.secondary-btn,
	.link-btn {
		border: none;
		border-radius: 0.95rem;
		cursor: pointer;
		font-weight: 700;
		transition: transform 0.18s ease;
	}

	.primary-btn:hover,
	.secondary-btn:hover,
	.link-btn:hover {
		transform: translateY(-1px);
	}

	.primary-btn {
		padding: 0.8rem 1.2rem;
		background: linear-gradient(135deg, #7c3aed, #4f46e5);
		color: #fff;
	}

	.secondary-btn {
		padding: 0.8rem 1.2rem;
		background: #f1f5f9;
		color: #1e293b;
	}

	.table-wrapper {
		overflow: hidden;
		border-radius: 1.5rem;
		background: #fff;
		box-shadow: 0 12px 36px rgba(15, 23, 42, 0.06);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 1rem 1.25rem;
		text-align: left;
		border-bottom: 1px solid rgba(148, 163, 184, 0.18);
		vertical-align: top;
	}

	th {
		font-size: 0.95rem;
		color: rgba(15, 23, 42, 0.72);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.item-title {
		font-weight: 700;
	}

	.item-subtitle {
		margin-top: 0.3rem;
		color: rgba(15, 23, 42, 0.64);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.actions {
		display: flex;
		gap: 0.7rem;
	}

	.link-btn {
		padding: 0.45rem 0.8rem;
		background: #eef2ff;
		color: #4338ca;
	}

	.link-btn.danger {
		background: #fee2e2;
		color: #dc2626;
	}

	.empty-state {
		padding: 2.5rem 1.5rem;
		border-radius: 1.5rem;
		background: #fff;
		text-align: center;
		color: rgba(15, 23, 42, 0.64);
		box-shadow: 0 12px 36px rgba(15, 23, 42, 0.06);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.42);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		z-index: 40;
	}

	.modal-card {
		width: min(760px, 100%);
		max-height: min(92vh, 900px);
		overflow: auto;
		background: #fff;
		border-radius: 1.5rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.6rem;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.field span {
		font-weight: 700;
	}

	.field input,
	.field select,
	.field textarea {
		width: 100%;
		box-sizing: border-box;
		min-width: 0;
		padding: 0.8rem 0.95rem;
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 0.9rem;
		font: inherit;
		background: #fff;
	}

	.field textarea {
		resize: vertical;
	}

	.modal-actions {
		display: flex;
		gap: 0.8rem;
		justify-content: flex-start;
		padding-top: 0.25rem;
	}

	@media (max-width: 768px) {
		.toolbar {
			flex-direction: column;
		}

		.field-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
