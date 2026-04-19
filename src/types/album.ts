export type AlbumMode = "local" | "external";
export type AlbumLayout = "grid" | "masonry";
export type AlbumColumns = 2 | 3 | 4;

export interface Photo {
	id?: string;
	src: string;
	alt?: string;
	title?: string;
	thumbnail?: string;
	tags?: string[];
	description?: string;
	date?: string;
	location?: string;
	width?: number;
	height?: number;
}

export interface AlbumPhotoInput extends Photo {}

export interface AlbumGroup {
	id: string;
	title: string;
	description?: string;
	cover: string;
	date: string;
	location?: string;
	tags?: string[];
	photos: Photo[];
	mode?: AlbumMode;
	layout?: AlbumLayout;
	columns?: AlbumColumns;
	hidden?: boolean;
}
