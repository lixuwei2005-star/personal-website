import { announcementConfig, sidebarLayoutConfig } from "../config";
import type {
	SidebarLayoutConfig,
	WidgetComponentConfig,
	WidgetComponentType,
} from "../types/config";

export const WIDGET_COMPONENT_MAP = {
	profile: "../components/widgets/profile/Profile.astro",
	announcement: "../components/widgets/announcement/Announcement.astro",
	categories: "../components/widgets/categories/Categories.astro",
	tags: "../components/widgets/tags/Tags.astro",
	toc: "../components/widgets/toc/TOC.astro",
	"card-toc": "../components/widgets/card-toc/CardTOC.astro",
	"music-player": "../components/widgets/music-player/MusicPlayer.svelte",
	pio: "../components/widget/Pio.astro",
	"site-stats": "../components/widgets/site-stats/SiteStats.astro",
	"visitor-info": "../components/widgets/visitor-info/VisitorInfo.astro",
	calendar: "../components/widgets/calendar/Calendar.astro",
	custom: null,
} as const;

export class WidgetManager {
	private config: SidebarLayoutConfig;

	constructor(config: SidebarLayoutConfig = sidebarLayoutConfig) {
		this.config = config;
	}

	getConfig(): SidebarLayoutConfig {
		return this.config;
	}

	getComponentsByPosition(
		position: "top" | "sticky",
		sidebar: "left" | "right" | "drawer" = "left",
		deviceType: "mobile" | "tablet" | "desktop" = "desktop",
	): WidgetComponentConfig[] {
		let activeSidebar = sidebar;

		if (deviceType === "mobile") {
			activeSidebar = "drawer";
		} else if (deviceType === "tablet") {
			if (sidebar === "right") {
				return [];
			}
			if (sidebar === "left") {
				activeSidebar =
					this.config.components.left.length > 0 ? "left" : "right";
			}
		}

		const componentTypes = this.config.components[activeSidebar] || [];

		return componentTypes.flatMap((type) => {
			const prop = this.config.properties.find((item) => item.type === type);
			const baseConfig =
				prop || ({ type, position: "top" } as WidgetComponentConfig);

			if (type === "announcement") {
				return this.expandAnnouncementComponents(baseConfig).filter(
					(component) => component.position === position,
				);
			}

			return baseConfig.position === position ? [baseConfig] : [];
		});
	}

	private expandAnnouncementComponents(
		baseConfig: WidgetComponentConfig,
	): WidgetComponentConfig[] {
		return announcementConfig.map((announcement, index) => ({
			...baseConfig,
			position: announcement.position === "sticky" ? "sticky" : "top",
			animationDelay:
				typeof announcement.animationDelay === "number"
					? announcement.animationDelay
					: baseConfig.animationDelay,
			customProps: {
				...(baseConfig.customProps || {}),
				announcement,
				widgetId: `announcement-${announcement.id ?? index + 1}`,
			},
		}));
	}

	getAnimationDelay(component: WidgetComponentConfig, index: number): number {
		if (component.animationDelay !== undefined) {
			return component.animationDelay;
		}

		if (this.config.defaultAnimation.enable) {
			return (
				this.config.defaultAnimation.baseDelay +
				index * this.config.defaultAnimation.increment
			);
		}

		return 0;
	}

	getComponentClass(component: WidgetComponentConfig, _index: number): string {
		const classes: string[] = [];

		if (component.class) {
			classes.push(component.class);
		}

		if (component.responsive?.hidden) {
			component.responsive.hidden.forEach((device) => {
				switch (device) {
					case "mobile":
						classes.push("hidden", "md:block");
						break;
					case "tablet":
						classes.push("md:hidden", "lg:block");
						break;
					case "desktop":
						classes.push("lg:hidden");
						break;
				}
			});
		}

		return classes.join(" ");
	}

	getComponentStyle(component: WidgetComponentConfig, index: number): string {
		const styles: string[] = [];

		if (component.style) {
			styles.push(component.style);
		}

		const animationDelay = this.getAnimationDelay(component, index);
		if (animationDelay > 0) {
			styles.push(`animation-delay: ${animationDelay}ms`);
		}

		return styles.join("; ");
	}

	isCollapsed(component: WidgetComponentConfig, itemCount: number): boolean {
		if (!component.responsive?.collapseThreshold) {
			return false;
		}
		return itemCount >= component.responsive.collapseThreshold;
	}

	getComponentPath(componentType: WidgetComponentType): string | null {
		return WIDGET_COMPONENT_MAP[componentType];
	}

	shouldShowSidebar(deviceType: "mobile" | "tablet" | "desktop"): boolean {
		if (deviceType === "mobile") {
			return this.config.components.drawer.length > 0;
		}
		if (deviceType === "tablet") {
			return (
				this.config.components.left.length > 0 ||
				this.config.components.right.length > 0
			);
		}
		return (
			this.config.components.left.length > 0 ||
			this.config.components.right.length > 0
		);
	}

	getBreakpoints() {
		return this.config.responsive.breakpoints;
	}

	updateConfig(newConfig: Partial<SidebarLayoutConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	addComponentToLayout(
		type: WidgetComponentType,
		sidebar: "left" | "right" | "drawer" = "left",
	): void {
		if (!this.config.components[sidebar].includes(type)) {
			this.config.components[sidebar].push(type);
		}
	}

	removeComponentFromLayout(type: WidgetComponentType): void {
		this.config.components.left = this.config.components.left.filter(
			(item) => item !== type,
		);
		this.config.components.right = this.config.components.right.filter(
			(item) => item !== type,
		);
		this.config.components.drawer = this.config.components.drawer.filter(
			(item) => item !== type,
		);
	}

	isSidebarComponent(componentType: WidgetComponentType): boolean {
		return componentType !== "pio";
	}
}

export const widgetManager = new WidgetManager();

export function getComponentConfig(
	componentType: WidgetComponentType,
): WidgetComponentConfig | undefined {
	return widgetManager
		.getConfig()
		.properties.find((item) => item.type === componentType);
}

export function isComponentEnabled(
	componentType: WidgetComponentType,
): boolean {
	const config = widgetManager.getConfig().components;
	return (
		config.left.includes(componentType) ||
		config.right.includes(componentType) ||
		config.drawer.includes(componentType)
	);
}

export function getEnabledComponentTypes(): WidgetComponentType[] {
	return widgetManager.getConfig().components.left;
}
