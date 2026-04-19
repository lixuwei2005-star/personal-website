import { siteConfig } from "../config";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { ja } from "./languages/ja";
import { zh_CN } from "./languages/zh_CN";
import { zh_TW } from "./languages/zh_TW";

export type Translation = Record<I18nKey, string>;
export type FrontendLanguage = "zh_CN" | "en";

export const FRONTEND_LANGUAGE_STORAGE_KEY = "frontendLanguage";
export const FRONTEND_LANGUAGE_CHANGE_EVENT =
	"mizuki:frontend-language-change";

const defaultTranslation = en;

const map: Record<string, Translation> = {
	en: en,
	en_us: en,
	en_gb: en,
	en_au: en,
	zh_cn: zh_CN,
	zh_tw: zh_TW,
	ja: ja,
	ja_jp: ja,
};

export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

export function normalizeTranslationLanguage(lang?: string | null): string {
	if (!lang) {
		return siteConfig.lang || "en";
	}

	const normalized = lang.replace("-", "_").toLowerCase();
	if (normalized.startsWith("zh")) {
		return normalized.includes("tw") ? "zh_TW" : "zh_CN";
	}
	if (normalized.startsWith("ja")) {
		return "ja";
	}
	if (normalized.startsWith("en")) {
		return "en";
	}

	return siteConfig.lang || "en";
}

export function normalizeFrontendLanguage(
	lang?: string | null,
): FrontendLanguage {
	return normalizeTranslationLanguage(lang).startsWith("zh") ? "zh_CN" : "en";
}

export function getStoredFrontendLanguage(): FrontendLanguage | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const stored = window.localStorage.getItem(FRONTEND_LANGUAGE_STORAGE_KEY);
		return stored ? normalizeFrontendLanguage(stored) : null;
	} catch {
		return null;
	}
}

export function setStoredFrontendLanguage(lang: FrontendLanguage): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(
			FRONTEND_LANGUAGE_STORAGE_KEY,
			normalizeFrontendLanguage(lang),
		);
	} catch {
		// Ignore storage errors.
	}
}

export function getCurrentLanguage(): string {
	if (typeof window !== "undefined") {
		return getStoredFrontendLanguage() ?? normalizeTranslationLanguage(siteConfig.lang);
	}

	return normalizeTranslationLanguage(siteConfig.lang || "en");
}

export function translate(lang: string, key: I18nKey): string {
	const translation = getTranslation(lang);
	return translation[key] || defaultTranslation[key] || key;
}

export function i18n(key: I18nKey): string {
	return translate(getCurrentLanguage(), key);
}
