import { visit } from "unist-util-visit";

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?(#.*)?$/i;
const WIDTH_REGEX = / w-([0-9]+)%/;

export function rehypeVideoEmbed() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "img" || !node.properties || !node.properties.src) {
				return;
			}

			const src = String(node.properties.src);
			if (!VIDEO_EXTENSIONS.test(src)) {
				return;
			}

			const rawAlt =
				typeof node.properties.alt === "string" ? node.properties.alt : "";
			const widthMatch = rawAlt.match(WIDTH_REGEX);
			const cleanedAlt = widthMatch ? rawAlt.replace(WIDTH_REGEX, "").trim() : rawAlt;
			const widthStyle = widthMatch
				? `width: ${widthMatch[1]}%;`
				: "width: 100%; max-width: 800px;";

			const video = {
				type: "element",
				tagName: "video",
				properties: {
					src,
					controls: true,
					preload: "metadata",
					playsinline: true,
					style: `${widthStyle} display: block; margin: 0 auto; border-radius: 8px;`,
				},
				children: [
					{
						type: "text",
						value: "Your browser does not support HTML5 video.",
					},
				],
			};

			const figureChildren = [video];

			const captionText = node.properties.title || cleanedAlt;
			if (captionText) {
				figureChildren.push({
					type: "element",
					tagName: "figcaption",
					properties: {
						style:
							"text-align: center; margin-top: 0.5em; font-size: 0.9em; color: #666;",
					},
					children: [{ type: "text", value: captionText }],
				});
			}

			const figure = {
				type: "element",
				tagName: "figure",
				properties: { style: "margin: 1em 0;" },
				children: figureChildren,
			};

			if (parent && index !== undefined) {
				parent.children[index] = figure;
			}
		});
	};
}
