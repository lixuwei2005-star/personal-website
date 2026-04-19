import { getDb } from "../db";
import type { Device, DeviceCategory } from "../../data/devices";

interface DeviceRow {
	id: number;
	category_name: string;
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
	sort_order: number;
}

export function getAllDevices(): DeviceCategory {
	const db = getDb();
	const rows = db.prepare("SELECT * FROM devices ORDER BY sort_order, id").all() as DeviceRow[];
	const result: DeviceCategory = {};
	for (const row of rows) {
		if (!result[row.category_name]) {
			result[row.category_name] = [];
		}
		result[row.category_name].push({
			name: row.name,
			image: row.image,
			specs: row.specs,
			description: row.description,
			link: row.link,
		});
	}
	return result;
}

export function getAllDevicesFlat(): (Device & { id: number; category_name: string })[] {
	const db = getDb();
	const rows = db.prepare("SELECT * FROM devices ORDER BY sort_order, id").all() as DeviceRow[];
	return rows.map((row) => ({
		id: row.id,
		category_name: row.category_name,
		name: row.name,
		image: row.image,
		specs: row.specs,
		description: row.description,
		link: row.link,
	}));
}

export function getDeviceById(id: number): (Device & { id: number; category_name: string }) | null {
	const db = getDb();
	const row = db.prepare("SELECT * FROM devices WHERE id = ?").get(id) as DeviceRow | undefined;
	if (!row) return null;
	return {
		id: row.id,
		category_name: row.category_name,
		name: row.name,
		image: row.image,
		specs: row.specs,
		description: row.description,
		link: row.link,
	};
}

export function createDevice(data: { category_name: string } & Device): Device & { id: number; category_name: string } {
	const db = getDb();
	const result = db.prepare(
		"INSERT INTO devices (category_name, name, image, specs, description, link) VALUES (?, ?, ?, ?, ?, ?)",
	).run(data.category_name, data.name, data.image, data.specs, data.description, data.link);
	return getDeviceById(Number(result.lastInsertRowid))!;
}

export function updateDevice(id: number, data: Partial<{ category_name: string } & Device>): (Device & { id: number; category_name: string }) | null {
	const current = getDeviceById(id);
	if (!current) return null;

	const merged = { ...current, ...data };
	const db = getDb();
	db.prepare(
		"UPDATE devices SET category_name = ?, name = ?, image = ?, specs = ?, description = ?, link = ? WHERE id = ?",
	).run(merged.category_name, merged.name, merged.image, merged.specs, merged.description, merged.link, id);
	return getDeviceById(id);
}

export function deleteDevice(id: number): boolean {
	const db = getDb();
	const result = db.prepare("DELETE FROM devices WHERE id = ?").run(id);
	return result.changes > 0;
}
