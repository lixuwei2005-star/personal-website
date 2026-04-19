<script lang="ts">
	import { onMount } from "svelte";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	let { username: initialUsername }: { username: string } = $props();

	let username = $state(initialUsername);
	let confirmUsername = $state(initialUsername);
	let currentPassword = $state("");
	let newPassword = $state("");
	let confirmPassword = $state("");
	let saving = $state(false);
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());

	onMount(() => onAdminLanguageChange((nextLang) => {
		lang = nextLang;
	}));

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	async function save() {
		const trimmedUsername = username.trim();
		const trimmedConfirmUsername = confirmUsername.trim();
		const shouldChangePassword = newPassword.length > 0 || confirmPassword.length > 0;

		if (!trimmedUsername) {
			message = t("Username is required");
			messageKind = "error";
			return;
		}

		if (trimmedUsername !== trimmedConfirmUsername) {
			message = t("Usernames do not match");
			messageKind = "error";
			return;
		}

		if (!currentPassword.trim()) {
			message = t("Current password is required");
			messageKind = "error";
			return;
		}

		if (shouldChangePassword && newPassword !== confirmPassword) {
			message = t("Passwords do not match");
			messageKind = "error";
			return;
		}

		saving = true;
		message = "";
		messageKind = "";

		try {
			const res = await fetch("/api/admin/security/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: trimmedUsername,
					confirmUsername: trimmedConfirmUsername,
					currentPassword,
					newPassword,
					confirmPassword,
				}),
			});

			const data = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(data?.error ? t(data.error) : t("Save failed"));
			}

			username = data?.username || trimmedUsername;
			confirmUsername = data?.username || trimmedUsername;
			currentPassword = "";
			newPassword = "";
			confirmPassword = "";
			message = t("Security settings updated!");
			messageKind = "success";
		} catch (error) {
			message = error instanceof Error ? error.message : t("Save failed");
			messageKind = "error";
		}

		saving = false;
		setTimeout(() => {
			message = "";
			messageKind = "";
		}, 4000);
	}
</script>

<div class="security-editor">
	<div class="card">
		<h2>{t("Security Settings")}</h2>
		<p class="hint">{t("Update the admin username or password here. The username and password both need confirmation before saving.")}</p>
		<p class="hint">{t("Five failed login attempts will lock admin sign-in for 10 minutes.")}</p>

		<div class="grid">
			<div class="field">
				<label for="security-username">{t("Username")}</label>
				<input id="security-username" type="text" bind:value={username} autocomplete="username" />
			</div>
			<div class="field">
				<label for="security-username-confirm">{t("Confirm Username")}</label>
				<input id="security-username-confirm" type="text" bind:value={confirmUsername} autocomplete="off" />
			</div>
		</div>

		<div class="grid">
			<div class="field">
				<label for="security-current-password">{t("Current Password")}</label>
				<input
					id="security-current-password"
					type="password"
					bind:value={currentPassword}
					autocomplete="current-password"
				/>
			</div>
			<div class="field">
				<label for="security-new-password">{t("New Password")}</label>
				<input
					id="security-new-password"
					type="password"
					bind:value={newPassword}
					autocomplete="new-password"
					placeholder={t("Leave blank to keep the current password")}
				/>
			</div>
		</div>

		<div class="grid">
			<div class="field">
				<label for="security-new-password-confirm">{t("Confirm New Password")}</label>
				<input
					id="security-new-password-confirm"
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					placeholder={t("Repeat the new password")}
				/>
			</div>
		</div>

		<div class="actions">
			<button type="button" class="save-btn" onclick={save} disabled={saving}>
				{saving ? t("Saving...") : t("Save Security Settings")}
			</button>
			{#if message}
				<span class="message" class:success={messageKind === "success"}>{message}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.security-editor {
		width: 100%;
		max-width: 900px;
		margin-top: 16px;
	}

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	h2 {
		font-size: 22px;
		color: #111827;
		margin-bottom: 10px;
	}

	.hint {
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 8px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
		margin-top: 18px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.field label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.field input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
	}

	.field input:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 24px;
		flex-wrap: wrap;
	}

	.save-btn {
		padding: 10px 16px;
		border: none;
		border-radius: 10px;
		background: #6366f1;
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.message {
		font-size: 13px;
		color: #dc2626;
	}

	.message.success {
		color: #16a34a;
	}

	@media (max-width: 760px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
