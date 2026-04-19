<script lang="ts">
	import Icon from "@iconify/svelte";
	import {
		FRONTEND_LANGUAGE_CHANGE_EVENT,
		type FrontendLanguage,
		getStoredFrontendLanguage,
		normalizeFrontendLanguage,
		setStoredFrontendLanguage,
	} from "@i18n/translation";
	import { onMount } from "svelte";

	let currentLanguage: FrontendLanguage = $state("zh_CN");

	function syncLanguage(nextLanguage?: string | null) {
		currentLanguage = normalizeFrontendLanguage(nextLanguage);
	}

	function toggleLanguage() {
		const nextLanguage: FrontendLanguage =
			currentLanguage === "zh_CN" ? "en" : "zh_CN";
		setStoredFrontendLanguage(nextLanguage);
		syncLanguage(nextLanguage);
		document.dispatchEvent(
			new CustomEvent(FRONTEND_LANGUAGE_CHANGE_EVENT, {
				detail: { lang: nextLanguage },
			}),
		);
	}

	onMount(() => {
		syncLanguage(getStoredFrontendLanguage());

		const handleLanguageChange = (event: Event) => {
			const nextLanguage = (event as CustomEvent<{ lang?: string }>).detail?.lang;
			syncLanguage(nextLanguage);
		};

		document.addEventListener(
			FRONTEND_LANGUAGE_CHANGE_EVENT,
			handleLanguageChange,
		);

		return () => {
			document.removeEventListener(
				FRONTEND_LANGUAGE_CHANGE_EVENT,
				handleLanguageChange,
			);
		};
	});

	const ariaLabel = $derived(
		currentLanguage === "zh_CN" ? "Switch to English" : "切换到中文",
	);
</script>

<button
	aria-label={ariaLabel}
	class="btn-plain scale-animation rounded-lg h-11 px-3 min-w-[3.75rem] active:scale-90 flex items-center justify-center gap-1 font-bold"
	id="language-switch"
	onclick={toggleLanguage}
>
	<Icon icon="material-symbols:translate-rounded" class="text-[1.1rem]" />
	<span class="flex items-center gap-1 text-[0.78rem] leading-none">
		<span class:active={currentLanguage === "zh_CN"}>中</span>
		<span class="text-black/30 dark:text-white/30">/</span>
		<span class:active={currentLanguage === "en"}>EN</span>
	</span>
</button>

<style>
	span.active {
		color: var(--primary);
	}
</style>
