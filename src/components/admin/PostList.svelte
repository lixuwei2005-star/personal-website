<script lang="ts">
	import { onMount } from "svelte";
	import {
		type AdminLanguage,
		formatAdminDate,
		getAdminLanguage,
		onAdminLanguageChange,
		translateAdminLiteral,
	} from "../../lib/admin/i18n";

	interface Post {
		id: number;
		slug: string;
		title: string;
		published: string;
		category: string;
		draft: boolean;
		pinned: boolean;
		encrypted: boolean;
	}

	let { posts: initialPosts }: { posts: Post[] } = $props();
	let posts = $state([...initialPosts]);
	let deleting = $state<number | null>(null);
	let lang = $state<AdminLanguage>(getAdminLanguage());

	onMount(() => onAdminLanguageChange((nextLang) => {
		lang = nextLang;
	}));

	function t(literal: string) {
		return translateAdminLiteral(lang, literal);
	}

	async function deletePost(id: number) {
		if (!confirm(t("Are you sure you want to delete this post?"))) return;
		deleting = id;
		try {
			const res = await fetch(`/api/admin/posts/${id}/`, { method: "DELETE" });
			if (res.ok) {
				posts = posts.filter(p => p.id !== id);
			}
		} catch {
			/* ignore */
		}
		deleting = null;
	}
</script>

<div class="post-table">
	<table>
		<thead>
			<tr>
				<th>{t("Title")}</th>
				<th>{t("Category")}</th>
				<th>{t("Published")}</th>
				<th>{t("Status")}</th>
				<th>{t("Actions")}</th>
			</tr>
		</thead>
		<tbody>
			{#each posts as post}
				<tr>
					<td>
						<a href={`/admin/posts/${post.id}/`} class="post-title">
							{post.pinned ? "📌 " : ""}{post.title}
						</a>
					</td>
					<td><span class="cat">{post.category || "-"}</span></td>
					<td class="date">{formatAdminDate(post.published, lang)}</td>
					<td>
						{#if post.draft}
							<span class="badge draft">{t("Draft")}</span>
						{:else}
							<span class="badge published">{t("Published")}</span>
						{/if}
						{#if post.encrypted}
							<span class="badge encrypted">{t("Encrypted")}</span>
						{/if}
					</td>
					<td class="actions-cell">
						<a href={`/admin/posts/${post.id}/`} class="btn-edit">{t("Edit")}</a>
						<button class="btn-del" onclick={() => deletePost(post.id)} disabled={deleting === post.id}>
							{deleting === post.id ? "..." : t("Delete")}
						</button>
					</td>
				</tr>
			{/each}
			{#if posts.length === 0}
				<tr><td colspan="5" class="empty">{t("No posts found")}</td></tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.post-table { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
	table { width: 100%; border-collapse: collapse; }
	th { text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #888; background: #fafafa; border-bottom: 1px solid #eee; }
	td { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
	.post-title { color: #333; text-decoration: none; font-weight: 500; }
	.post-title:hover { color: #6366f1; }
	.cat { font-size: 12px; color: #666; }
	.date { font-size: 13px; color: #999; }
	.badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; }
	.badge.draft { background: #fef3c7; color: #92400e; }
	.badge.published { background: #dcfce7; color: #166534; }
	.badge.encrypted { background: #e0e7ff; color: #4338ca; margin-left: 6px; }
	.actions-cell { display: flex; gap: 8px; }
	.btn-edit { padding: 4px 12px; background: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333; font-size: 13px; }
	.btn-edit:hover { background: #e5e5e5; }
	.btn-del { padding: 4px 12px; background: #fee2e2; border: none; border-radius: 4px; color: #dc2626; font-size: 13px; cursor: pointer; }
	.btn-del:hover { background: #fecaca; }
	.empty { text-align: center; color: #999; padding: 24px; }
</style>
