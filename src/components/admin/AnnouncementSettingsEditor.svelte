<script lang="ts">
	import { onMount } from "svelte";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface AnnouncementGlobalSettings {
		position: "top" | "sticky";
		animationDelay: number;
	}

	let {
		settings: initialSettings,
	}: {
		settings: AnnouncementGlobalSettings;
	} = $props();

	const getInitialSettings = () => initialSettings;
	const initialSettingsSnapshot = getInitialSettings();

	let position = $state<AnnouncementGlobalSettings["position"]>(
		initialSettingsSnapshot.position,
	);
	let animationDelay = $state(initialSettingsSnapshot.animationDelay);
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());

	onMount(() =>
		onAdminLanguageChange((nextLang) => {
			lang = nextLang;
		}),
	);

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	function clearMessage() {
		message = "";
		messageKind = "";
	}

	async function saveSettings() {
		saving = true;
		clearMessage();

		try {
			const response = await fetch("/api/admin/announcements/settings", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					position,
					animationDelay: Number(animationDelay),
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result?.error || t("Save failed"));
			}

			position = result.position === "sticky" ? "sticky" : "top";
			animationDelay = Number(result.animationDelay) || 0;
			message = t("Saved successfully!");
			messageKind = "success";
		} catch (error) {
			message =
				error instanceof Error ? error.message : t("Save failed");
			messageKind = "error";
		} finally {
			saving = false;
		}
	}
</script>

<section class="settings-card">
	<div class="section-header">
		<div>
			<h2>{t("Announcement Advanced Settings")}</h2>
			<p>{t("Apply one shared position and animation delay to every announcement widget.")}</p>
		</div>
	</div>

	<div class="field-grid">
		<div class="field">
			<label for="announcement-position">{t("Position")}</label>
			<select id="announcement-position" bind:value={position}>
				<option value="top">{t("Top")}</option>
				<option value="sticky">{t("Sticky")}</option>
			</select>
		</div>

		<div class="field">
			<label for="announcement-animation-delay">{t("Animation Delay")}</label>
			<input
				id="announcement-animation-delay"
				type="number"
				min="0"
				step="10"
				bind:value={animationDelay}
			/>
		</div>
	</div>

	<div class="actions">
		<button class="save-button" type="button" onclick={saveSettings} disabled={saving}>
			{saving ? t("Saving...") : t("Save Changes")}
		</button>
	</div>

	{#if message}
		<p class:success={messageKind === "success"} class:error={messageKind === "error"} class="message">
			{message}
		</p>
	{/if}
</section>

<style>
	.settings-card {
		margin-top: 24px;
		padding: 24px;
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 20px;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
	}

	.section-header p {
		margin: 8px 0 0;
		color: #6b7280;
		font-size: 0.95rem;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
		margin-top: 20px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field label {
		font-weight: 600;
		color: #374151;
	}

	.field input,
	.field select {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: 12px 14px;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		background: #fff;
		font-size: 0.95rem;
	}

	.actions {
		margin-top: 20px;
		display: flex;
		justify-content: flex-end;
	}

	.save-button {
		padding: 10px 18px;
		border: none;
		border-radius: 12px;
		background: #4f46e5;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
	}

	.save-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.message {
		margin: 14px 0 0;
		font-size: 0.95rem;
	}

	.message.success {
		color: #15803d;
	}

	.message.error {
		color: #dc2626;
	}
</style>
