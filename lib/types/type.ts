export type FileEntry = {
	id: string;
	name: string;
	created_at: string;
	size: number;

	title?: string;
	url?: string;
	path?: string;

	/**
	 * Discriminator:
	 * - "file": any regular uploaded file
	 * - "paste": a text file (we'll store it as .txt in storage)
	 */
	type: "file" | "paste";

	// tiny, optional hints (safe to ignore elsewhere)
	mime?: string;
	syntax?: string | null;
	expires_at?: string | null;
};

export type Folder = {
	id: string;
	name: string;
	created_at: string;

	size?: number;
	url?: string;
	type: "folder";
};

export type DriveEntry = Folder | FileEntry;

export type TableProps = {
	data: DriveEntry[];
	isLoading: boolean;
	error: Error | null;

	createFolder: (name: string) => Promise<Folder | null>;
	deleteFolder: (folderId: string) => Promise<boolean>;
	deleteFile: (fileId: string) => Promise<boolean>;

	uploadFiles?: (
		files: globalThis.File[],
		targetFolderId?: string | null
	) => Promise<{
		success?: Array<{ name: string; url: string | null }>;
		failed?: Array<{ name: string; error: string }>;
	}>;

	isUploading?: boolean;
	isCreatingFolder?: boolean;
	isDeletingFolder?: boolean;
	isDeletingFile?: boolean;
};

export const isFolder = (e: DriveEntry): e is Folder => e.type === "folder";
export const isFile = (e: DriveEntry): e is FileEntry =>
	e.type === "file" || e.type === "paste";
export const isPaste = (e: DriveEntry): e is FileEntry => e.type === "paste";
