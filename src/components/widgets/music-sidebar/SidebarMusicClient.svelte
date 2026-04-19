<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	import { musicPlayerConfig } from "@/config";
	import type { MusicPlayerState } from "@/stores/musicPlayerStore";
	import { musicPlayerStore } from "@/stores/musicPlayerStore";

	import type { Song } from "../music-player/types";
	import SidebarControls from "./components/SidebarControls.svelte";
	import SidebarCover from "./components/SidebarCover.svelte";
	import SidebarPlaylist from "./components/SidebarPlaylist.svelte";
	import SidebarProgress from "./components/SidebarProgress.svelte";
	import SidebarTrackInfo from "./components/SidebarTrackInfo.svelte";

	let state: MusicPlayerState = $state(musicPlayerStore.getState());
	let showPlaylist = $state(false);
	const showPlaylistPanel = musicPlayerConfig.showPlaylistPanel !== false;
	let unsubscribe: (() => void) | undefined;

	function handleStateUpdate(event: Event) {
		const custom = event as CustomEvent<MusicPlayerState>;
		if (custom.detail) {
			state = custom.detail;
		}
	}

	onMount(() => {
		unsubscribe = musicPlayerStore.subscribe((nextState) => {
			state = nextState;
		});
		musicPlayerStore.initialize();
		window.addEventListener("music-sidebar:state", handleStateUpdate);
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (typeof window !== "undefined") {
			window.removeEventListener(
				"music-sidebar:state",
				handleStateUpdate,
			);
		}
	});

	function togglePlay() {
		musicPlayerStore.toggle();
	}

	function prev() {
		musicPlayerStore.prev();
	}

	function next() {
		musicPlayerStore.next();
	}

	function toggleMode() {
		musicPlayerStore.toggleMode();
	}

	function togglePlaylistView() {
		if (!showPlaylistPanel) {
			showPlaylist = false;
			return;
		}
		showPlaylist = !showPlaylist;
	}

	function playIndex(index: number) {
		musicPlayerStore.playIndex(index);
	}

	function seek(time: number) {
		musicPlayerStore.seek(time);
	}

	function toggleMute() {
		musicPlayerStore.toggleMute();
	}

	function setVolume(volume: number) {
		musicPlayerStore.setVolume(volume);
	}
</script>

<div class="music-sidebar-widget">
	<div class="flex items-center gap-3 mb-2.5">
		<SidebarCover
			currentSong={state.currentSong}
			isPlaying={state.isPlaying}
			isLoading={state.isLoading}
		/>
		<SidebarTrackInfo
			currentSong={state.currentSong}
			currentTime={state.currentTime}
			duration={state.duration}
			volume={state.volume}
			isMuted={state.isMuted}
			onToggleMute={toggleMute}
			onSetVolume={setVolume}
		/>
	</div>

	<SidebarProgress
		currentTime={state.currentTime}
		duration={state.duration}
		onSeek={seek}
	/>

	<SidebarControls
		isPlaying={state.isPlaying}
		isShuffled={state.isShuffled}
		repeatMode={state.isRepeating}
		showPlaylistButton={showPlaylistPanel}
		onToggleMode={toggleMode}
		onPrev={prev}
		onNext={next}
		onTogglePlay={togglePlay}
		onTogglePlaylist={togglePlaylistView}
	/>

	<SidebarPlaylist
		playlist={state.playlist}
		currentIndex={state.currentIndex}
		isPlaying={state.isPlaying}
		show={showPlaylistPanel && showPlaylist}
		onClose={togglePlaylistView}
		onPlaySong={playIndex}
	/>
</div>

<style>
	@media (max-width: 520px) {
		.music-sidebar-widget {
			min-width: 0;
		}

		.music-sidebar-widget > :global(div:first-child) {
			gap: 0.75rem;
			margin-bottom: 0.5rem;
		}
	}
</style>
