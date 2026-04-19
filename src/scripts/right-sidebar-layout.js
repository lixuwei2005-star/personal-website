// Right sidebar layout manager
// Hides the right sidebar in grid mode and restores it in list mode.

function initPageLayout() {
	const defaultPostListLayout = getEffectiveLayoutMode();

	if (defaultPostListLayout === "grid") {
		hideRightSidebar();
	} else {
		showRightSidebar();
	}

	window.addEventListener("layoutChange", (event) => {
		const layout = event.detail.layout;
		if (layout === "grid") {
			hideRightSidebar();
		} else {
			showRightSidebar();
		}
	});

	window.addEventListener("storage", (event) => {
		if (event.key === "postListLayout") {
			if (getEffectiveLayoutMode() === "grid") {
				hideRightSidebar();
			} else {
				showRightSidebar();
			}
		}
	});

	document.addEventListener("astro:page-load", () => {
		setTimeout(() => {
			const currentLayout = getEffectiveLayoutMode();
			if (currentLayout === "grid") {
				hideRightSidebar();
			} else {
				showRightSidebar();
			}
		}, 100);
	});

	document.addEventListener("swup:contentReplaced", () => {
		setTimeout(() => {
			const currentLayout = getEffectiveLayoutMode();
			if (currentLayout === "grid") {
				hideRightSidebar();
			} else {
				showRightSidebar();
			}
		}, 100);
	});
}

function getEffectiveLayoutMode() {
	const mainGrid = document.getElementById("main-grid");
	const defaultLayout =
		mainGrid?.getAttribute("data-default-layout") || "list";
	const allowLayoutSwitch =
		mainGrid?.getAttribute("data-allow-layout-switch") === "true";

	if (!allowLayoutSwitch) {
		sessionStorage.setItem("postListLayout", defaultLayout);
		localStorage.setItem("postListLayout", defaultLayout);
		return defaultLayout;
	}

	return localStorage.getItem("postListLayout") || defaultLayout;
}

function hideRightSidebar() {
	const rightSidebar = document.querySelector(".right-sidebar-container");
	if (rightSidebar) {
		rightSidebar.classList.add("hidden-in-grid-mode");
		rightSidebar.style.display = "none";

		const mainGrid = document.getElementById("main-grid");
		if (mainGrid) {
			mainGrid.style.gridTemplateColumns = "17.5rem 1fr";
			mainGrid.setAttribute("data-layout-mode", "grid");
		}
	}
}

function showRightSidebar() {
	const rightSidebar = document.querySelector(".right-sidebar-container");
	if (rightSidebar) {
		rightSidebar.classList.remove("hidden-in-grid-mode");
		rightSidebar.style.display = "";

		const mainGrid = document.getElementById("main-grid");
		if (mainGrid) {
			mainGrid.style.gridTemplateColumns = "";
			mainGrid.setAttribute("data-layout-mode", "list");
		}
	}
}

function initialize() {
	initPageLayout();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize);
} else {
	initialize();
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		initPageLayout,
		hideRightSidebar,
		showRightSidebar,
	};
}

if (typeof window !== "undefined") {
	window.rightSidebarLayout = {
		initPageLayout,
		hideRightSidebar,
		showRightSidebar,
	};
}
