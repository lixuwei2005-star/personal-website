export const prerender = false;

import type { APIRoute } from "astro";
import { syncPostToContent } from "../../../../lib/content-sync/posts";
import { createPost, deletePost, getAllPosts } from "../../../../lib/repositories/posts";

export const GET: APIRoute = async () => {
	const posts = getAllPosts(true);
	return new Response(JSON.stringify(posts), {
		headers: { "Content-Type": "application/json" },
	});
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		const post = createPost(data);

		try {
			syncPostToContent(post);
		} catch (error) {
			deletePost(post.id);
			throw error;
		}

		return new Response(JSON.stringify(post), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to save post";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
