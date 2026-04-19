export const prerender = false;

import type { APIRoute } from "astro";
import {
	deletePostContent,
	syncPostToContent,
} from "../../../../lib/content-sync/posts";
import { deletePostAssets } from "../../../../lib/repositories/post-assets";
import {
	deletePost,
	getPostById,
	updatePost,
} from "../../../../lib/repositories/posts";

export const GET: APIRoute = async ({ params }) => {
	const id = Number(params.id);
	const post = getPostById(id);
	if (!post) {
		return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	}
	return new Response(JSON.stringify(post), { headers: { "Content-Type": "application/json" } });
};

export const PUT: APIRoute = async ({ params, request }) => {
	const id = Number(params.id);
	const currentPost = getPostById(id);
	if (!currentPost) {
		return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	}

	const previousSlug = currentPost.slug;
	const { id: _currentId, ...rollbackData } = currentPost;

	try {
		const data = await request.json();
		const post = updatePost(id, data);
		if (!post) {
			return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
		}

		try {
			syncPostToContent(post, previousSlug);
		} catch (error) {
			updatePost(id, rollbackData);
			syncPostToContent(currentPost, post.slug);
			throw error;
		}

		return new Response(JSON.stringify(post), { headers: { "Content-Type": "application/json" } });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to update post";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const id = Number(params.id);
	const currentPost = getPostById(id);
	if (!currentPost) {
		return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
	}

	try {
		deletePostContent(currentPost.slug);
		deletePostAssets(id);
		const ok = deletePost(id);
		if (!ok) {
			syncPostToContent(currentPost);
			return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
		}

		return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to delete post";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
