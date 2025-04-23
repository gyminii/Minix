"use server";

import { createClient } from "../supabase/server";
import { DriveEntry, File, Folder } from "../types/type";

// // Types
// type FileNode = {
// 	id: string;
// 	name: string;
// 	created_at: string;
// 	size: number;
// 	type: string; // MIME type
// };

// type FolderEntry = {
// 	id: string;
// 	name: string;
// 	created_at: string;
// 	type: "folder";
// };

// type FileEntry = FileNode & { type: "file" };

// type Entry = FolderEntry | FileEntry;
/**
 * Creating folders
 * @param param0 name, parent folder
 * @returns
 */
export const readDrive = async ({
	folderId = null,
}: {
	folderId?: string | null;
} = {}): Promise<DriveEntry[]> => {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError) throw authError;
	if (!user) throw new Error("User not authenticated");

	const userId = user.id;

	// Query for folders
	const foldersQuery = supabase
		.from("folders")
		.select("id, name, created_at")
		.eq("user_id", userId);

	// Query for files
	const filesQuery = supabase
		.from("files")
		.select("id, name, created_at, size, type, url")
		.eq("user_id", userId);

	// Apply parent/folder filter based on folderId
	if (folderId === null) {
		foldersQuery.is("parent_id", null);
		filesQuery.is("folder_id", null);
	} else {
		foldersQuery.eq("parent_id", folderId);
		filesQuery.eq("folder_id", folderId);
	}

	// Execute both queries in parallel
	const [foldersRes, filesRes] = await Promise.all([foldersQuery, filesQuery]);

	if (foldersRes.error || filesRes.error) {
		throw foldersRes.error || filesRes.error;
	}

	// Map the results to the expected format
	const folderEntries: Folder[] = foldersRes.data.map((f) => ({
		...f,
		type: "folder",
	}));

	const fileEntries: File[] = filesRes.data.map((f) => ({
		...f,
		type: "file",
	}));

	// Return only the direct children of the specified folder (or root)
	return [...folderEntries, ...fileEntries];
};
