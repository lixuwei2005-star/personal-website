import type I18nKey from "@i18n/i18nKey";
import {
	FRONTEND_LANGUAGE_CHANGE_EVENT,
	type FrontendLanguage,
	getCurrentLanguage,
	getStoredFrontendLanguage,
	normalizeFrontendLanguage,
	setStoredFrontendLanguage,
	translate,
} from "@i18n/translation";

declare global {
	interface Window {
		__mizukiFrontendLanguageInitialized?: boolean;
		__mizukiFrontendLanguageHooked?: boolean;
		__mizukiI18n?: {
			getLanguage: () => FrontendLanguage;
			setLanguage: (lang: FrontendLanguage) => void;
			translate: (key: I18nKey) => string;
		};
	}
}

function getFrontendLanguage(): FrontendLanguage {
	return normalizeFrontendLanguage(getStoredFrontendLanguage() ?? getCurrentLanguage());
}

function updateDocumentLanguage(lang: FrontendLanguage): void {
	document.documentElement.lang = lang === "zh_CN" ? "zh-CN" : "en";
	document.documentElement.dataset.uiLanguage = lang;
}

function applyAttributeTranslation(
	root: ParentNode,
	selector: string,
	attribute: string,
	lang: FrontendLanguage,
): void {
	root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
		const key = element.dataset[attribute] as I18nKey | undefined;
		if (!key) {
			return;
		}

		const targetAttribute = attribute
			.replace(/^i18n/, "")
			.replace(/Key$/, "")
			.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
			.replace(/^-/, "");

		element.setAttribute(targetAttribute, translate(lang, key));
	});
}

export function applyFrontendTranslations(root: ParentNode = document): void {
	const lang = getFrontendLanguage();
	updateDocumentLanguage(lang);

	root.querySelectorAll<HTMLElement>("[data-i18n-key]").forEach((element) => {
		const key = element.dataset.i18nKey as I18nKey | undefined;
		if (!key) {
			return;
		}

		element.textContent = translate(lang, key);
	});

	applyAttributeTranslation(root, "[data-i18n-placeholder-key]", "i18nPlaceholderKey", lang);
	applyAttributeTranslation(root, "[data-i18n-aria-label-key]", "i18nAriaLabelKey", lang);
	applyAttributeTranslation(root, "[data-i18n-title-key]", "i18nTitleKey", lang);
}

export function setFrontendLanguage(lang: FrontendLanguage): void {
	const normalized = normalizeFrontendLanguage(lang);
	setStoredFrontendLanguage(normalized);
	applyFrontendTranslations(document);
	document.dispatchEvent(
		new CustomEvent(FRONTEND_LANGUAGE_CHANGE_EVENT, {
			detail: { lang: normalized },
		}),
	);
}

function bindFrontendLanguageLifecycle(): void {
	if (window.__mizukiFrontendLanguageHooked) {
		return;
	}

	window.__mizukiFrontendLanguageHooked = true;

	document.addEventListener(FRONTEND_LANGUAGE_CHANGE_EVENT, () => {
		applyFrontendTranslations(document);
	});

	document.addEventListener("astro:page-load", () => {
		applyFrontendTranslations(document);
	});

	document.addEventListener("swup:contentReplaced", () => {
		applyFrontendTranslations(document);
	});

	const attachSwupHook = () => {
		if (window.swup?.hooks) {
			window.swup.hooks.on("content:replace", () => {
				applyFrontendTranslations(document);
			});
		}
	};

	if (window.swup?.hooks) {
		attachSwupHook();
	} else {
		document.addEventListener("swup:enable", attachSwupHook, { once: true });
	}
}

function initFrontendLanguage(): void {
	if (typeof window === "undefined" || window.__mizukiFrontendLanguageInitialized) {
		return;
	}

	window.__mizukiFrontendLanguageInitialized = true;
	window.__mizukiI18n = {
		getLanguage: getFrontendLanguage,
		setLanguage: setFrontendLanguage,
		translate: (key: I18nKey) => translate(getFrontendLanguage(), key),
	};

	applyFrontendTranslations(document);
	bindFrontendLanguageLifecycle();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initFrontendLanguage, {
		once: true,
	});
} else {
	initFrontendLanguage();
}
