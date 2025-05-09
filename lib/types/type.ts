type FileEntry = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	url?: string;
	path?: string;
	type: string;
};

type Folder = {
	id: string;
	name: string;
	created_at: string;
	size?: number;
	url?: string;
	type?: "folder" | string;
};

type DriveEntry = Folder | FileEntry;

type TableProps = {
	data: DriveEntry[];
	isLoading: boolean;
	error: Error | null;
	createFolder: (name: string) => Promise<Folder | null>;
	deleteFolder: (folderId: string) => Promise<boolean>;
	deleteFile: (fileId: string) => Promise<boolean>;
	uploadFiles?: (
		files: globalThis.File[], // Use globalThis.File to explicitly reference browser's File
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

export type { FileEntry, Folder, DriveEntry, TableProps };
