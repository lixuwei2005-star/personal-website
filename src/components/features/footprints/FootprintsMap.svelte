<script lang="ts">
	import { onMount } from "svelte";
	import type { FootprintItem } from "../../../data/footprints";
	import I18nKey from "../../../i18n/i18nKey";
	import {
		FRONTEND_LANGUAGE_CHANGE_EVENT,
		type FrontendLanguage,
		getCurrentLanguage,
		normalizeFrontendLanguage,
		translate,
	} from "../../../i18n/translation";

	interface Props {
		places: FootprintItem[];
	}

	interface LeafletLike {
		map: (...args: any[]) => any;
		tileLayer: (...args: any[]) => any;
		circleMarker: (...args: any[]) => any;
		latLngBounds: (...args: any[]) => any;
	}

	let { places }: Props = $props();

	let mapElement: HTMLDivElement;
	let mapInstance: any = null;
	let leaflet: LeafletLike | null = null;
	let markerMap = new Map<number, any>();
	let activeId = $state<number | null>(null);
	let lang = $state<FrontendLanguage>(
		normalizeFrontendLanguage(getCurrentLanguage()),
	);

	function t(key: I18nKey) {
		return translate(lang, key);
	}

	function escapeHtml(value: string) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function getLocationText(place: FootprintItem) {
		return [place.country, place.province]
			.filter((part) => part && part.trim())
			.join(" / ");
	}

	function getDisplayTitle(place: FootprintItem) {
		return place.province || place.country || place.title;
	}

	function getPopupContent(place: FootprintItem) {
		const locationText = getLocationText(place);
		const notes = place.notes.trim();
		return `
			<div class="footprint-popup">
				<div class="footprint-popup-title">${escapeHtml(getDisplayTitle(place))}</div>
				${locationText ? `<div class="footprint-popup-line">${escapeHtml(locationText)}</div>` : ""}
				${place.visitedAt ? `<div class="footprint-popup-line">${escapeHtml(place.visitedAt)}</div>` : ""}
				${notes ? `<div class="footprint-popup-notes">${escapeHtml(notes)}</div>` : ""}
			</div>
		`;
	}

	function hasCoordinates(place: FootprintItem) {
		return (
			Number.isFinite(place.latitude) &&
			Number.isFinite(place.longitude) &&
			!(place.latitude === 0 && place.longitude === 0)
		);
	}

	function focusPlace(id: number) {
		if (!mapInstance) {
			return;
		}

		const place = places.find((item) => item.id === id);
		const marker = markerMap.get(id);
		if (!place || !marker || !hasCoordinates(place)) {
			return;
		}

		activeId = id;
		mapInstance.flyTo([place.latitude, place.longitude], 6, {
			duration: 0.8,
		});
		marker.openPopup();
	}

	async function ensureLeaflet() {
		if (leaflet) {
			return leaflet;
		}

		if (!document.getElementById("mizuki-leaflet-style")) {
			const link = document.createElement("link");
			link.id = "mizuki-leaflet-style";
			link.rel = "stylesheet";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			document.head.appendChild(link);
		}

		if ((window as any).L) {
			leaflet = (window as any).L as LeafletLike;
			return leaflet;
		}

		await new Promise<void>((resolve, reject) => {
			let script = document.getElementById(
				"mizuki-leaflet-script",
			) as HTMLScriptElement | null;

			const onLoad = () => resolve();
			const onError = () =>
				reject(new Error("Failed to load Leaflet"));

			if (!script) {
				script = document.createElement("script");
				script.id = "mizuki-leaflet-script";
				script.src =
					"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
				script.async = true;
				script.addEventListener("load", onLoad, { once: true });
				script.addEventListener("error", onError, { once: true });
				document.body.appendChild(script);
				return;
			}

			if ((window as any).L) {
				resolve();
				return;
			}

			script.addEventListener("load", onLoad, { once: true });
			script.addEventListener("error", onError, { once: true });
		});

		leaflet = (window as any).L as LeafletLike;
		return leaflet;
	}

	function renderMap() {
		if (!leaflet || !mapElement) {
			return;
		}

		if (!mapInstance) {
			mapInstance = leaflet.map(mapElement, {
				center: [25, 105],
				zoom: 2,
				worldCopyJump: true,
			});

			leaflet
				.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					maxZoom: 19,
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				})
				.addTo(mapInstance);
		}

		for (const marker of markerMap.values()) {
			marker.remove();
		}
		markerMap = new Map();

		const boundsPoints: Array<[number, number]> = [];

		for (const place of places) {
			if (!hasCoordinates(place)) {
				continue;
			}

			const marker = leaflet
				.circleMarker([place.latitude, place.longitude], {
					radius: 8,
					color: "#38bdf8",
					weight: 2,
					fillColor: "#0ea5e9",
					fillOpacity: 0.85,
				})
				.addTo(mapInstance);

			marker.bindPopup(getPopupContent(place), {
				maxWidth: 260,
			});
			marker.on("click", () => {
				activeId = place.id;
			});

			markerMap.set(place.id, marker);
			boundsPoints.push([place.latitude, place.longitude]);
		}

		if (boundsPoints.length === 1) {
			mapInstance.setView(boundsPoints[0], 5);
		} else if (boundsPoints.length > 1) {
			mapInstance.fitBounds(leaflet.latLngBounds(boundsPoints), {
				padding: [28, 28],
			});
		}

		setTimeout(() => {
			mapInstance?.invalidateSize();
		}, 0);
	}

	onMount(() => {
		const handleLanguageChange = (event: Event) => {
			const nextLang =
				event instanceof CustomEvent && event.detail?.lang
					? normalizeFrontendLanguage(event.detail.lang)
					: normalizeFrontendLanguage(getCurrentLanguage());
			lang = nextLang;
		};

		document.addEventListener(
			FRONTEND_LANGUAGE_CHANGE_EVENT,
			handleLanguageChange,
		);

		void ensureLeaflet().then(() => {
			renderMap();
		});

		return () => {
			document.removeEventListener(
				FRONTEND_LANGUAGE_CHANGE_EVENT,
				handleLanguageChange,
			);
			if (mapInstance) {
				mapInstance.remove();
				mapInstance = null;
			}
		};
	});
</script>

<div class="footprints-wrapper">
	{#if places.length === 0}
		<div class="footprints-empty" data-i18n-key="footprintsEmpty">
			{t(I18nKey.footprintsEmpty)}
		</div>
	{:else}
		<p class="footprints-hint" data-i18n-key="footprintsMapHint">
			{t(I18nKey.footprintsMapHint)}
		</p>
		<div bind:this={mapElement} class="footprints-map"></div>
		<div class="footprints-list">
			{#each places as place}
				<button
					type="button"
					class:active={activeId === place.id}
					class="footprint-card"
					onclick={() => focusPlace(place.id)}
				>
					<div class="footprint-card-title">{getDisplayTitle(place)}</div>
					{#if getLocationText(place)}
						<div class="footprint-card-location">
							{getLocationText(place)}
						</div>
					{/if}
					{#if place.visitedAt}
						<div class="footprint-card-date">
							<span data-i18n-key="footprintsVisitedDate">
								{t(I18nKey.footprintsVisitedDate)}
							</span>
							<span>{place.visitedAt}</span>
						</div>
					{/if}
					{#if place.notes}
						<div class="footprint-card-notes">{place.notes}</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.footprints-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.footprints-hint {
		color: rgb(0 0 0 / 0.6);
		font-size: 0.95rem;
	}

	:global(.dark) .footprints-hint {
		color: rgb(255 255 255 / 0.6);
	}

	.footprints-map {
		width: 100%;
		height: 34rem;
		border-radius: var(--radius-large);
		overflow: hidden;
		border: 1px solid rgb(0 0 0 / 0.08);
	}

	:global(.dark) .footprints-map {
		border-color: rgb(255 255 255 / 0.1);
	}

	.footprints-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
	}

	.footprint-card {
		border: 1px solid rgb(0 0 0 / 0.08);
		background: var(--card-bg);
		border-radius: var(--radius-large);
		padding: 1rem;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		transition:
			border-color 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.footprint-card:hover,
	.footprint-card.active {
		border-color: var(--primary);
		transform: translateY(-1px);
		box-shadow: 0 10px 24px rgb(0 0 0 / 0.06);
	}

	:global(.dark) .footprint-card {
		border-color: rgb(255 255 255 / 0.1);
	}

	.footprint-card-title {
		font-size: 1rem;
		font-weight: 700;
		color: rgb(0 0 0 / 0.88);
	}

	:global(.dark) .footprint-card-title {
		color: rgb(255 255 255 / 0.92);
	}

	.footprint-card-location,
	.footprint-card-date,
	.footprint-card-notes,
	.footprints-empty {
		color: rgb(0 0 0 / 0.62);
		line-height: 1.6;
	}

	:global(.dark) .footprint-card-location,
	:global(.dark) .footprint-card-date,
	:global(.dark) .footprint-card-notes,
	:global(.dark) .footprints-empty {
		color: rgb(255 255 255 / 0.68);
	}

	.footprint-card-date {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.footprints-empty {
		padding: 2.5rem 1rem;
		text-align: center;
		border: 1px dashed rgb(0 0 0 / 0.14);
		border-radius: var(--radius-large);
	}

	:global(.dark) .footprints-empty {
		border-color: rgb(255 255 255 / 0.16);
	}

	:global(.footprint-popup) {
		line-height: 1.5;
		font-size: 0.92rem;
	}

	:global(.footprint-popup-title) {
		font-weight: 700;
		margin-bottom: 0.3rem;
	}

	:global(.footprint-popup-line) {
		color: #475569;
	}

	:global(.footprint-popup-notes) {
		margin-top: 0.4rem;
		color: #334155;
		white-space: pre-wrap;
	}

	@media (max-width: 768px) {
		.footprints-map {
			height: 28rem;
		}
	}
</style>
