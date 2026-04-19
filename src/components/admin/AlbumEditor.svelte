<script lang="ts">
	import { onMount } from "svelte";

	import type { AlbumGroup, AlbumMode, Photo } from "../../types/album";
	import {
		getAdminImagePreviewUrl,
	} from "../../lib/admin/image-fields";
	import TagInput from "./TagInput.svelte";
	import {
		type AdminLanguage,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Props {
		items: AlbumGroup[];
		tagPresets?: string[];
	}

	interface ExternalPhotoForm {
		id: string;
		src: string;
		thumbnail: string;
		alt: string;
		title: string;
		description: string;
		tags: string[];
		date: string;
		location: string;
		width: string;
		height: string;
	}

	interface AlbumFormState {
		id: string;
		title: string;
		description: string;
		date: string;
		location: string;
		tags: string[];
		hidden: boolean;
		mode: AlbumMode;
		layout: "grid" | "masonry";
		columns: 2 | 3 | 4;
		cover: string;
		localPhotos: string[];
		externalPhotos: ExternalPhotoForm[];
	}

	let { items: initialItems, tagPresets = [] }: Props = $props();

	function buildTagPresets(items: AlbumGroup[], seeds: string[] = []) {
		return [...new Set([...seeds, ...items.flatMap((album) => album.tags ?? [])])].sort();
	}

	function sortAlbums(items: AlbumGroup[]) {
		return [...items].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	}

	function slugifyAlbumId(value: string) {
		return value
			.toLowerCase()
			.trim()
			.replace(/['"]/g, "")
			.replace(/[^a-z0-9-_]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function createDraftAlbumId() {
		return `album-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
	}

	function pad(value: number) {
		return String(value).padStart(2, "0");
	}

	function toDateValue(value?: string) {
		const date = value ? new Date(value) : new Date();
		const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
		return `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}`;
	}

	function createEmptyExternalPhoto(): ExternalPhotoForm {
		return {
			id: "",
			src: "",
			thumbnail: "",
			alt: "",
			title: "",
			description: "",
			tags: [],
			date: toDateValue(),
			location: "",
			width: "",
			height: "",
		};
	}

	function toExternalPhotoForm(photo: Photo): ExternalPhotoForm {
		return {
			id: photo.id ?? "",
			src: photo.src ?? "",
			thumbnail: photo.thumbnail ?? "",
			alt: photo.alt ?? "",
			title: photo.title ?? "",
			description: photo.description ?? "",
			tags: [...(photo.tags ?? [])],
			date: toDateValue(photo.date),
			location: photo.location ?? "",
			width: photo.width ? String(photo.width) : "",
			height: photo.height ? String(photo.height) : "",
		};
	}

	function toFormState(album?: AlbumGroup): AlbumFormState {
		const mode: AlbumMode = album?.mode === "external" ? "external" : "local";
		return {
			id: album?.id ?? "",
			title: album?.title ?? "",
			description: album?.description ?? "",
			date: toDateValue(album?.date),
			location: album?.location ?? "",
			tags: [...(album?.tags ?? [])],
			hidden: Boolean(album?.hidden),
			mode,
			layout: album?.layout === "masonry" ? "masonry" : "grid",
			columns: album?.columns === 2 || album?.columns === 4 ? album.columns : 3,
			cover: album?.cover ?? "",
			localPhotos:
				mode === "local" ? [...(album?.photos?.map((photo) => photo.src) ?? [])] : [],
			externalPhotos:
				mode === "external"
					? [...(album?.photos?.map(toExternalPhotoForm) ?? [])]
					: [],
		};
	}

	function toPayload(formState: AlbumFormState) {
		return {
			id: formState.id,
			title: formState.title.trim(),
			description: formState.description.trim(),
			date: formState.date,
			location: formState.location.trim(),
			tags: formState.tags,
			hidden: formState.hidden,
			mode: formState.mode,
			layout: formState.layout,
			columns: formState.columns,
			cover: formState.mode === "external" ? formState.cover.trim() : "",
			photos:
				formState.mode === "external"
					? formState.externalPhotos
							.map((photo) => ({
								id: photo.id.trim(),
								src: photo.src.trim(),
								thumbnail: photo.thumbnail.trim(),
								alt: photo.alt.trim(),
								title: photo.title.trim(),
								description: photo.description.trim(),
								tags: photo.tags,
								date: photo.date,
								location: photo.location.trim(),
								width: photo.width ? Number(photo.width) : undefined,
								height: photo.height ? Number(photo.height) : undefined,
							}))
							.filter((photo) => photo.src)
					: [],
		};
	}

	function photoCount(album: AlbumGroup) {
		return album.photos.length;
	}

	function formatDate(date: string) {
		return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date(date));
	}

	let items = $state(sortAlbums(initialItems));
	let availableTagPresets = $state(buildTagPresets(initialItems, tagPresets));
	let editorMode = $state<"create" | "edit" | null>(null);
	let editingId = $state("");
	let form = $state<AlbumFormState>(toFormState());
	let saving = $state(false);
	let loading = $state(initialItems.length === 0);
	let uploadState = $state<"cover" | "photos" | "">("");
	let message = $state("");
	let messageKind = $state<"success" | "error" | "">("");
	let lang = $state<AdminLanguage>(getAdminLanguage());

	function loadingAlbumsText() {
		return lang === "zh-CN" ? "正在加载相册..." : "Loading albums...";
	}

	function loadAlbumsErrorText() {
		return lang === "zh-CN" ? "加载相册失败" : "Failed to load albums";
	}

	onMount(() => {
		loadAlbums();
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

	async function loadAlbums() {
		loading = true;
		try {
			const response = await fetch("/api/admin/albums/");
			const payload = await response.json().catch(() => []);
			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(loadAlbumsErrorText());
			}

			items = sortAlbums(payload as AlbumGroup[]);
			availableTagPresets = buildTagPresets(items, tagPresets);
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : loadAlbumsErrorText(),
			);
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editorMode = "create";
		editingId = "";
		form = { ...toFormState(), id: createDraftAlbumId() };
		message = "";
		messageKind = "";
	}

	function openEdit(album: AlbumGroup) {
		editorMode = "edit";
		editingId = album.id;
		form = toFormState(album);
		message = "";
		messageKind = "";
	}

	function closeEditor() {
		editorMode = null;
		editingId = "";
		form = toFormState();
	}

	function handleTitleInput(value: string) {
		form.title = value;
		form = { ...form };
	}

	function ensureAlbumIdForUpload() {
		const nextId = slugifyAlbumId(form.id || "") || createDraftAlbumId();
		if (!nextId) {
			setMessage("error", t("Please enter the album title or ID first"));
			return "";
		}

		form.id = nextId;
		form = { ...form };
		return nextId;
	}

	async function uploadLocalImage(event: Event, kind: "cover" | "photo") {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) {
			return;
		}

		const albumId = ensureAlbumIdForUpload();
		if (!albumId) {
			input.value = "";
			return;
		}

		uploadState = kind === "cover" ? "cover" : "photos";
		try {
			if (kind === "cover") {
				const formData = new FormData();
				formData.append("albumId", albumId);
				formData.append("kind", "cover");
				formData.append("file", files[0]);
				const response = await fetch("/api/admin/albums/upload/", {
					method: "POST",
					body: formData,
				});
				const payload = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error(payload.error || t("Upload failed"));
				}
				form.cover = payload.url;
			} else {
				const uploadedUrls = [...form.localPhotos];
				for (const file of files) {
					const formData = new FormData();
					formData.append("albumId", albumId);
					formData.append("kind", "photo");
					formData.append("file", file);
					const response = await fetch("/api/admin/albums/upload/", {
						method: "POST",
						body: formData,
					});
					const payload = await response.json().catch(() => ({}));
					if (!response.ok) {
						throw new Error(payload.error || t("Upload failed"));
					}
					uploadedUrls.push(payload.url);
				}
				form.localPhotos = uploadedUrls;
			}

			form = { ...form };
			setMessage("success", t("Album image uploaded!"));
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Upload failed"),
			);
		} finally {
			uploadState = "";
			input.value = "";
		}
	}

	async function removeLocalPhoto(photoPath: string) {
		if (!form.id) {
			form.localPhotos = form.localPhotos.filter((photo) => photo !== photoPath);
			form = { ...form };
			return;
		}

		try {
			const response = await fetch("/api/admin/albums/file/", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ albumId: form.id, path: photoPath }),
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload.error || t("Delete failed"));
			}

			form.localPhotos = form.localPhotos.filter((photo) => photo !== photoPath);
			form = { ...form };
			setMessage("success", t("Photo removed!"));
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Delete failed"),
			);
		}
	}

	function addExternalPhoto() {
		form.externalPhotos = [...form.externalPhotos, createEmptyExternalPhoto()];
		form = { ...form };
	}

	function removeExternalPhoto(index: number) {
		form.externalPhotos = form.externalPhotos.filter((_, current) => current !== index);
		form = { ...form };
	}

	function updateExternalPhoto(
		index: number,
		patch: Partial<ExternalPhotoForm>,
	) {
		form.externalPhotos = form.externalPhotos.map((photo, currentIndex) =>
			currentIndex === index ? { ...photo, ...patch } : photo,
		);
		form = { ...form };
	}

	async function saveAlbum() {
		if (!form.title.trim()) {
			setMessage("error", t("Album title is required"));
			return;
		}

		form.id = slugifyAlbumId(form.id || "") || createDraftAlbumId();
		if (!form.id) {
			setMessage("error", t("Album ID is required"));
			return;
		}

		if (form.mode === "local" && !form.cover) {
			setMessage("error", t("Upload a cover image before saving a local album"));
			return;
		}

		if (
			form.mode === "external" &&
			form.externalPhotos.filter((photo) => photo.src.trim()).length === 0
		) {
			setMessage("error", t("Add at least one external photo before saving"));
			return;
		}

		saving = true;
		try {
			const payload = toPayload(form);
			const response = await fetch(
				editorMode === "create"
					? "/api/admin/albums/"
					: `/api/admin/albums/${encodeURIComponent(editingId)}/`,
				{
					method: editorMode === "create" ? "POST" : "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			const result = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(result?.error || t("Save failed"));
			}

			items =
				editorMode === "create"
					? sortAlbums([...items, result])
					: sortAlbums(
							items.map((item) => (item.id === editingId ? result : item)),
						);
			availableTagPresets = buildTagPresets(items, tagPresets);

			setMessage(
				"success",
				editorMode === "create"
					? t("Album created!")
					: t("Album updated!"),
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

	async function deleteAlbumById(albumId: string) {
		if (!confirm(t("Delete this album?"))) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/albums/${encodeURIComponent(albumId)}/`, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(t("Delete failed"));
			}
			items = items.filter((item) => item.id !== albumId);
			availableTagPresets = buildTagPresets(items, tagPresets);
			setMessage("success", t("Album deleted!"));
		} catch (error) {
			setMessage(
				"error",
				error instanceof Error ? error.message : t("Delete failed"),
			);
		}
	}
</script>

<div class="album-admin">
	{#if message}
		<div class="toast" class:error={messageKind === "error"}>{message}</div>
	{/if}

	<div class="toolbar">
		<div>
			<h3>{t("Album Management")}</h3>
			<p>{t("Manage local and external albums. Local albums store files in public/images/albums/<id>/.")}</p>
		</div>
		<button class="primary-btn" type="button" onclick={openCreate}>
			+ {t("New Album")}
		</button>
	</div>

	<div class="table-card">
		{#if loading}
			<div class="empty-row">{loadingAlbumsText()}</div>
		{:else}
			<table class="album-table">
				<thead>
					<tr>
						<th>{t("Cover")}</th>
						<th>{t("Title")}</th>
						<th>ID</th>
						<th>{t("Mode")}</th>
						<th>{t("Date")}</th>
						<th>{t("Layout")}</th>
						<th>{t("Photos")}</th>
						<th>{t("Visibility")}</th>
						<th>{t("Tags")}</th>
						<th>{t("Actions")}</th>
					</tr>
				</thead>
				<tbody>
					{#if items.length === 0}
						<tr>
							<td colspan="10" class="empty-row">{t("No albums yet")}</td>
						</tr>
					{:else}
						{#each items as album}
							<tr>
								<td class="cover-cell">
									<img
										src={getAdminImagePreviewUrl(album.cover)}
										alt={album.title}
										class="cover-preview"
									/>
								</td>
								<td>
									<div class="title-cell">
										<strong>{album.title}</strong>
										{#if album.description}
											<span>{album.description}</span>
										{/if}
									</div>
								</td>
								<td class="mono-cell">{album.id}</td>
								<td>{album.mode === "external" ? t("External") : t("Local")}</td>
								<td>{formatDate(album.date)}</td>
								<td>
									{album.layout === "masonry" ? t("Masonry") : t("Grid")}
									<span class="muted">({album.columns ?? 3})</span>
								</td>
								<td>{photoCount(album)}</td>
								<td>{album.hidden ? t("Hidden") : t("Visible")}</td>
								<td class="tags-cell">{album.tags?.join(", ") || "-"}</td>
								<td>
									<div class="row-actions">
										<button class="ghost-btn" type="button" onclick={() => openEdit(album)}>
											{t("Edit")}
										</button>
										<button class="danger-btn" type="button" onclick={() => deleteAlbumById(album.id)}>
											{t("Delete")}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		{/if}
	</div>

	{#if editorMode}
		<div class="modal-shell">
			<div class="modal-card" role="dialog" aria-modal="true" aria-label={t("Album Editor")}>
				<div class="modal-header">
					<div>
						<h3>{editorMode === "create" ? t("New Album") : t("Edit Album")}</h3>
						<p class="modal-subtitle">
							{editorMode === "create"
								? t("The system generates the album ID automatically and uses it as the folder name.")
								: t("Album ID is managed by the system and stays unchanged when you edit an album.")}
						</p>
						<p class="modal-subtitle mono-subtitle">ID: {editorMode === "edit" ? editingId : form.id}</p>
					</div>
					<button class="close-btn" type="button" onclick={closeEditor} aria-label={t("Close")}>
						x
					</button>
				</div>

				<div class="form-grid">
					<div class="form-group">
						<label for="album-title">{t("Title")}</label>
						<input
							id="album-title"
							type="text"
							value={form.title}
							oninput={(event) => handleTitleInput((event.currentTarget as HTMLInputElement).value)}
						/>
					</div>
					<div class="form-group full">
						<label for="album-description">{t("Description")}</label>
						<textarea
							id="album-description"
							rows="3"
							bind:value={form.description}
						></textarea>
					</div>
					<div class="form-group">
						<label for="album-date">{t("Date")}</label>
						<input id="album-date" type="date" bind:value={form.date} />
					</div>
					<div class="form-group">
						<label for="album-location">{t("Location")}</label>
						<input id="album-location" type="text" bind:value={form.location} />
					</div>
					<div class="form-group">
						<label for="album-mode">{t("Mode")}</label>
						<select id="album-mode" bind:value={form.mode}>
							<option value="local">{t("Local")}</option>
							<option value="external">{t("External")}</option>
						</select>
					</div>
					<div class="form-group">
						<label for="album-layout">{t("Layout")}</label>
						<select id="album-layout" bind:value={form.layout}>
							<option value="grid">{t("Grid")}</option>
							<option value="masonry">{t("Masonry")}</option>
						</select>
					</div>
					<div class="form-group">
						<label for="album-columns">{t("Columns")}</label>
						<select
							id="album-columns"
							bind:value={form.columns}
						>
							<option value={2}>2</option>
							<option value={3}>3</option>
							<option value={4}>4</option>
						</select>
					</div>
					<div class="form-group toggle-group">
						<label class="check">
							<input type="checkbox" bind:checked={form.hidden} />
							<span>{t("Hide from album list")}</span>
						</label>
						<p class="helper-text">{t("Hidden albums stay accessible by direct URL, but disappear from the albums list.")}</p>
					</div>
					<div class="form-group full">
						<label for="album-tags">{t("Tags")}</label>
						<TagInput
							tags={form.tags}
							presets={availableTagPresets}
							presetStorageKey="admin-presets:albums:tags"
							placeholder={t("Enter a tag")}
							addLabel={t("Add")}
							emptyLabel={t("No tags yet")}
							onChange={(nextTags) => {
								form.tags = nextTags;
								form = { ...form };
							}}
						/>
					</div>

					{#if form.mode === "local"}
						<div class="form-group full">
							<label>{t("Cover Image")}</label>
							<p class="helper-text">{t("Upload a local cover image named cover.* for this album.")}</p>
							<div class="image-field">
								{#if form.cover}
									<img
										src={getAdminImagePreviewUrl(form.cover)}
										alt={t("Cover")}
										class="cover-large-preview"
									/>
								{:else}
									<div class="image-placeholder">{t("No cover")}</div>
								{/if}
								<div class="image-actions">
									<div class="path-preview">{form.cover || t("No cover uploaded yet")}</div>
									<label class="upload-btn">
										{uploadState === "cover" ? t("Uploading...") : t("Upload Cover")}
										<input
											type="file"
											accept="image/*"
											onchange={(event) => uploadLocalImage(event, "cover")}
											hidden
										/>
									</label>
								</div>
							</div>
						</div>

						<div class="form-group full">
							<label>{t("Photos")}</label>
							<p class="helper-text">{t("Upload one or more local photos. The cover image is uploaded separately.")}</p>
							<div class="image-actions top">
								<label class="upload-btn">
									{uploadState === "photos" ? t("Uploading...") : t("Upload Photos")}
									<input
										type="file"
										accept="image/*"
										multiple
										onchange={(event) => uploadLocalImage(event, "photo")}
										hidden
									/>
								</label>
							</div>
							{#if form.localPhotos.length === 0}
								<div class="empty-images">{t("No photos yet")}</div>
							{:else}
								<div class="photo-grid">
									{#each form.localPhotos as photoPath}
										<div class="photo-card">
											<img src={getAdminImagePreviewUrl(photoPath)} alt={t("Album photo")} />
											<div class="photo-meta">
												<span class="photo-path">{photoPath}</span>
												<button type="button" class="link-btn" onclick={() => removeLocalPhoto(photoPath)}>
													{t("Remove")}
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="form-group full">
							<label for="album-cover-url">{t("Cover URL")}</label>
							<input id="album-cover-url" type="text" bind:value={form.cover} placeholder="https://example.com/cover.jpg" />
						</div>

						<div class="form-group full">
							<div class="section-head">
								<label>{t("External Photos")}</label>
								<button type="button" class="ghost-btn" onclick={addExternalPhoto}>
									+ {t("Add External Photo")}
								</button>
							</div>
							{#if form.externalPhotos.length === 0}
								<div class="empty-images">{t("No external photos yet")}</div>
							{:else}
								<div class="external-photo-list">
									{#each form.externalPhotos as photo, index}
										<div class="external-photo-card">
											<div class="section-head compact">
												<h4>{t("External Photo")} #{index + 1}</h4>
												<button type="button" class="link-btn" onclick={() => removeExternalPhoto(index)}>
													{t("Remove")}
												</button>
											</div>
											<div class="external-grid">
												<div class="form-group">
													<label>{t("Photo ID")}</label>
													<input
														type="text"
														value={photo.id}
														oninput={(event) => updateExternalPhoto(index, { id: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Image URL")}</label>
													<input
														type="text"
														value={photo.src}
														oninput={(event) => updateExternalPhoto(index, { src: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Thumbnail URL")}</label>
													<input
														type="text"
														value={photo.thumbnail}
														oninput={(event) => updateExternalPhoto(index, { thumbnail: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Alt Text")}</label>
													<input
														type="text"
														value={photo.alt}
														oninput={(event) => updateExternalPhoto(index, { alt: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Title")}</label>
													<input
														type="text"
														value={photo.title}
														oninput={(event) => updateExternalPhoto(index, { title: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Date")}</label>
													<input
														type="date"
														value={photo.date}
														oninput={(event) => updateExternalPhoto(index, { date: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Location")}</label>
													<input
														type="text"
														value={photo.location}
														oninput={(event) => updateExternalPhoto(index, { location: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Width")}</label>
													<input
														type="number"
														value={photo.width}
														oninput={(event) => updateExternalPhoto(index, { width: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group">
													<label>{t("Height")}</label>
													<input
														type="number"
														value={photo.height}
														oninput={(event) => updateExternalPhoto(index, { height: (event.currentTarget as HTMLInputElement).value })}
													/>
												</div>
												<div class="form-group full">
													<label>{t("Tags")}</label>
													<TagInput
														tags={photo.tags}
														placeholder={t("Enter a tag")}
														addLabel={t("Add")}
														emptyLabel={t("No tags yet")}
														onChange={(nextTags) => updateExternalPhoto(index, { tags: nextTags })}
													/>
												</div>
												<div class="form-group full">
													<label>{t("Description")}</label>
													<textarea
														rows="3"
														value={photo.description}
														oninput={(event) => updateExternalPhoto(index, { description: (event.currentTarget as HTMLTextAreaElement).value })}
													></textarea>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="modal-actions">
					<button class="primary-btn" type="button" onclick={saveAlbum} disabled={saving}>
						{saving ? t("Saving...") : t("Save Album")}
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
	.album-admin {
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
	.modal-header h3,
	.section-head h4 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		color: #111827;
	}

	.toolbar p,
	.helper-text,
	.modal-subtitle,
	.title-cell span,
	.muted,
	.empty-images,
	.empty-row {
		color: #6b7280;
	}

	.primary-btn,
	.secondary-btn,
	.ghost-btn,
	.danger-btn,
	.link-btn,
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

	.link-btn {
		background: transparent;
		color: #dc2626;
		padding: 0;
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

	.album-table {
		width: 100%;
		border-collapse: collapse;
	}

	.album-table th,
	.album-table td {
		padding: 16px;
		border-bottom: 1px solid #f3f4f6;
		text-align: left;
		vertical-align: top;
	}

	.album-table th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6b7280;
	}

	.album-table tbody tr:last-child td {
		border-bottom: none;
	}

	.cover-cell {
		width: 104px;
	}

	.cover-preview {
		width: 72px;
		height: 72px;
		border-radius: 14px;
		object-fit: cover;
		border: 1px solid #e5e7eb;
	}

	.title-cell {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 300px;
	}

	.mono-cell {
		font-family: "JetBrains Mono", Consolas, monospace;
		font-size: 0.85rem;
	}

	.mono-subtitle {
		font-family: "JetBrains Mono", Consolas, monospace;
		font-size: 0.85rem;
	}

	.tags-cell {
		max-width: 220px;
		line-height: 1.6;
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
		width: min(1180px, 100%);
		max-height: calc(100vh - 48px);
		overflow: auto;
		padding: 24px;
	}

	.modal-header,
	.section-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}

	.modal-header {
		margin-bottom: 20px;
	}

	.section-head.compact {
		align-items: center;
	}

	.form-grid,
	.external-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
	}

	.external-grid {
		margin-top: 16px;
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

	.form-group.toggle-group {
		justify-content: center;
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

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.95rem;
	}

	.check input {
		width: 18px;
		height: 18px;
	}

	.image-field {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr);
		gap: 16px;
		align-items: start;
	}

	.cover-large-preview,
	.image-placeholder {
		width: 220px;
		height: 148px;
		border-radius: 16px;
		object-fit: cover;
		border: 1px solid #e5e7eb;
		background: #f8fafc;
	}

	.image-placeholder,
	.empty-images {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.image-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.image-actions.top {
		margin-bottom: 12px;
	}

	.path-preview {
		padding: 12px 14px;
		border: 1px dashed #cbd5e1;
		border-radius: 12px;
		background: #f8fafc;
		color: #475569;
		word-break: break-all;
	}

	.upload-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		padding: 12px 16px;
		border-radius: 12px;
		background: #eef2ff;
		color: #4338ca;
		font-weight: 600;
		cursor: pointer;
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 14px;
	}

	.photo-card,
	.external-photo-card {
		border: 1px solid #e5e7eb;
		border-radius: 18px;
		background: #f8fafc;
		overflow: hidden;
	}

	.photo-card img {
		display: block;
		width: 100%;
		height: 150px;
		object-fit: cover;
	}

	.photo-meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
	}

	.photo-path {
		font-size: 0.8rem;
		color: #475569;
		word-break: break-all;
	}

	.external-photo-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.external-photo-card {
		padding: 18px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	@media (max-width: 960px) {
		.toolbar,
		.modal-header,
		.section-head {
			flex-direction: column;
			align-items: stretch;
		}

		.form-grid,
		.external-grid,
		.image-field {
			grid-template-columns: 1fr;
		}

		.cover-large-preview,
		.image-placeholder {
			width: 100%;
			height: 220px;
		}

		.album-table {
			display: block;
			overflow-x: auto;
		}
	}
</style>
