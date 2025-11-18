type FileEntry = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	title?: string;
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

// type DriveEntry1 = {
// 	id: string;
// 	created_at: string;
// 	user_id: string;
// 	folder_id: string | null;
// 	/**
// 	 * Represents the kind of entry, allowing for conditional logic.
// 	 * - 'folder': A directory for organizing other entries.
// 	 * - 'file': A user-uploaded file (e.g., image, document).
// 	 * - 'paste': A text snippet or code paste.
// 	 */
// 	entry_type: "folder" | "file" | "paste";
// 	// Optional properties for specific entry types
// 	path?: string; // For 'file' entries, the path in Supabase Storage.
// 	size?: number; // For 'file' entries, the size in bytes.
// 	url?: string; // The URL to access the content.
// 	syntax?: string; // For 'paste' entries, the code syntax.
// 	expires_at?: string | null; // For 'paste' entries, the expiration date.
// };
export type { FileEntry, Folder, DriveEntry, TableProps };
