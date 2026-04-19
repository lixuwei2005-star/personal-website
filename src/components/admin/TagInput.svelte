<script lang="ts">
	import { onMount } from "svelte";

	interface Props {
		tags?: string[];
		presets?: string[];
		presetStorageKey?: string;
		presetRemovable?: boolean;
		placeholder?: string;
		addLabel?: string;
		emptyLabel?: string;
		disabled?: boolean;
		onChange?: (nextTags: string[]) => void;
	}

	let {
		tags = [],
		presets = [],
		presetStorageKey = "",
		presetRemovable = true,
		placeholder = "",
		addLabel = "Add",
		emptyLabel = "",
		disabled = false,
		onChange = () => {},
	}: Props = $props();

	let draft = $state("");
	let dismissedPresets = $state<string[]>([]);
	let visiblePresets = $derived(
		presets.filter((preset) => !dismissedPresets.includes(normalizePresetKey(preset))),
	);

	function normalizeTag(value: string) {
		return value.trim();
	}

	function normalizePresetKey(value: string) {
		return normalizeTag(value).toLowerCase();
	}

	function loadDismissedPresets() {
		if (typeof window === "undefined" || !presetStorageKey) {
			return;
		}

		try {
			const stored = window.localStorage.getItem(presetStorageKey);
			if (!stored) {
				dismissedPresets = [];
				return;
			}

			const parsed = JSON.parse(stored);
			dismissedPresets = Array.isArray(parsed)
				? parsed.map((value) => normalizePresetKey(String(value))).filter(Boolean)
				: [];
		} catch {
			dismissedPresets = [];
		}
	}

	function persistDismissedPresets(nextValues: string[]) {
		dismissedPresets = nextValues;
		if (typeof window === "undefined" || !presetStorageKey) {
			return;
		}

		window.localStorage.setItem(presetStorageKey, JSON.stringify(nextValues));
	}

	function emit(nextTags: string[]) {
		const deduped = nextTags.filter((tag, index, list) => {
			const normalized = normalizeTag(tag);
			if (!normalized) {
				return false;
			}
			return list.findIndex((entry) => entry.toLowerCase() === normalized.toLowerCase()) === index;
		});

		onChange(deduped.map(normalizeTag));
	}

	function isSelectedPreset(preset: string) {
		return tags.some((tag) => tag.toLowerCase() === preset.toLowerCase());
	}

	function dismissPreset(preset: string) {
		const key = normalizePresetKey(preset);
		if (!key || dismissedPresets.includes(key)) {
			return;
		}

		persistDismissedPresets([...dismissedPresets, key]);
	}

	onMount(() => {
		loadDismissedPresets();
	});

	function addTag(value = draft) {
		if (disabled) {
			return;
		}

		const nextTag = normalizeTag(value);
		draft = "";
		if (!nextTag) {
			return;
		}

		if (isSelectedPreset(nextTag)) {
			return;
		}

		emit([...tags, nextTag]);
	}

	function removeTag(index: number) {
		if (disabled) {
			return;
		}

		emit(tags.filter((_, currentIndex) => currentIndex !== index));
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			addTag();
			return;
		}

		if (event.key === "Backspace" && !draft && tags.length > 0) {
			event.preventDefault();
			removeTag(tags.length - 1);
		}
	}
</script>

<div class="tag-input">
	<div class="tag-list">
		{#if tags.length === 0 && emptyLabel}
			<span class="empty-tag">{emptyLabel}</span>
		{/if}

		{#each tags as tag, index}
			<span class="tag-chip">
				<span>{tag}</span>
				<button
					type="button"
					class="remove-btn"
					onclick={() => removeTag(index)}
					disabled={disabled}
					aria-label={`Remove ${tag}`}
				>
					x
				</button>
			</span>
		{/each}
	</div>

	<div class="tag-compose">
		<input
			type="text"
			bind:value={draft}
			placeholder={placeholder}
			onkeydown={handleKeydown}
			disabled={disabled}
		/>
		<button type="button" class="add-btn" onclick={() => addTag()} disabled={disabled}>
			{addLabel}
		</button>
	</div>

	{#if visiblePresets.length > 0}
		<div class="preset-list">
			{#each visiblePresets as preset}
				<div
					class:selected={isSelectedPreset(preset)}
					class:disabled={disabled || isSelectedPreset(preset)}
					class="preset-chip"
				>
					<button
						type="button"
						class="preset-main"
						onclick={() => addTag(preset)}
						disabled={disabled || isSelectedPreset(preset)}
					>
						{preset}
					</button>
					{#if presetStorageKey && presetRemovable}
						<button
							type="button"
							class="preset-remove-btn"
							onclick={(event) => {
								event.stopPropagation();
								dismissPreset(preset);
							}}
							disabled={disabled}
							aria-label={`Dismiss ${preset}`}
						>
							x
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tag-input {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		min-height: 18px;
	}

	.empty-tag {
		font-size: 0.85rem;
		color: #9ca3af;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border-radius: 9999px;
		background: #eef2ff;
		color: #4338ca;
		font-size: 0.9rem;
		line-height: 1;
	}

	.remove-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 9999px;
		background: rgba(67, 56, 202, 0.12);
		color: #4338ca;
		font-size: 0.85rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		text-transform: lowercase;
	}

	.tag-compose {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		width: 100%;
	}

	.tag-compose input {
		width: 100%;
		min-width: 0;
	}

	.preset-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.preset-chip {
		border: 1px solid #d1d5db;
		border-radius: 9999px;
		background: #fff;
		color: #4b5563;
		display: inline-flex;
		align-items: center;
		gap: 2px;
		transition: all 0.15s ease;
	}

	.preset-main {
		padding: 7px 6px 7px 10px;
		border: none;
		border-radius: 9999px;
		background: transparent;
		color: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.preset-chip:hover {
		border-color: #4f46e5;
		color: #4338ca;
		background: #eef2ff;
	}

	.preset-chip.selected,
	.preset-chip.disabled {
		background: #e0e7ff;
		border-color: #a5b4fc;
		color: #4338ca;
	}

	.preset-main:disabled {
		cursor: not-allowed;
	}

	.preset-remove-btn {
		width: 20px;
		height: 20px;
		margin-right: 8px;
		padding: 0;
		border: none;
		border-radius: 9999px;
		background: rgba(220, 38, 38, 0.12);
		color: #dc2626;
		font-size: 0.8rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
	}

	.preset-remove-btn:hover:not(:disabled) {
		background: rgba(220, 38, 38, 0.18);
	}

	.preset-remove-btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.add-btn {
		padding: 0 14px;
		border: none;
		border-radius: 10px;
		background: #4f46e5;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.add-btn:disabled,
	.remove-btn:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	@media (max-width: 640px) {
		.tag-compose {
			grid-template-columns: 1fr;
		}

		.add-btn {
			min-height: 42px;
		}
	}
</style>
