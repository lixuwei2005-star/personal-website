declare global {
	interface Window {
		__accessLogInitialized?: boolean;
		__accessLogLastKey?: string;
		__accessLogLastAt?: number;
		__accessLogSwupHooked?: boolean;
	}
}

function getCurrentPath(): string {
	return `${window.location.pathname}${window.location.search}`;
}

async function sendAccessLog(): Promise<void> {
	const path = getCurrentPath();
	const now = Date.now();
	const lastKey = window.__accessLogLastKey;
	const lastAt = window.__accessLogLastAt || 0;

	if (lastKey === path && now - lastAt < 1500) {
		return;
	}

	window.__accessLogLastKey = path;
	window.__accessLogLastAt = now;

	try {
		await fetch("/api/access-log/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ path }),
			credentials: "same-origin",
			keepalive: true,
		});
	} catch {
		// Ignore logging failures so page usage is never affected.
	}
}

function attachSwupHook(): void {
	if (window.__accessLogSwupHooked || !window.swup?.hooks) {
		return;
	}

	window.__accessLogSwupHooked = true;
	window.swup.hooks.on("page:view", () => {
		void sendAccessLog();
	});
}

function initAccessLog(): void {
	void sendAccessLog();
	attachSwupHook();

	if (!window.__accessLogSwupHooked) {
		document.addEventListener("swup:enable", attachSwupHook, { once: true });
	}
}

if (!window.__accessLogInitialized) {
	window.__accessLogInitialized = true;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initAccessLog, {
			once: true,
		});
	} else {
		initAccessLog();
	}
}

export {};
