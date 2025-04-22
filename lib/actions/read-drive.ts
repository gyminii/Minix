"use server";

import { createClient } from "../supabase/server";

// Types
type FileNode = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string; // MIME type
};

type FolderEntry = {
	id: string;
	name: string;
	created_at: string;
	type: "folder";
};

type FileEntry = FileNode & { type: "file" };

type Entry = FolderEntry | FileEntry;
/**
 * Creating folders
 * @param param0 name, parent folder
 * @returns
 */
export const readDrive = async ({
	folderId = null,
}: {
	folderId?: string | null;
} = {}): Promise<Entry[]> => {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError) throw authError;
	if (!user) throw new Error("User not authenticated");

	const userId = user.id;
	const allEntries: Entry[] = [];

	const readAll = async (parentId: string | null) => {
		const foldersQuery = supabase
			.from("folders")
			.select("id, name, created_at")
			.eq("user_id", userId);

		const filesQuery = supabase
			.from("files")
			.select("id, name, created_at, size, type")
			.eq("user_id", userId);

		if (parentId === null) {
			foldersQuery.is("parent_id", null);
			filesQuery.is("folder_id", null);
		} else {
			foldersQuery.eq("parent_id", parentId);
			filesQuery.eq("folder_id", parentId);
		}

		const [foldersRes, filesRes] = await Promise.all([
			foldersQuery,
			filesQuery,
		]);

		if (foldersRes.error || filesRes.error) {
			throw foldersRes.error || filesRes.error;
		}

		const folderEntries: FolderEntry[] = foldersRes.data.map((f) => ({
			...f,
			type: "folder",
		}));
		const fileEntries: FileEntry[] = filesRes.data.map((f) => ({
			...f,
			type: "file",
		}));

		allEntries.push(...folderEntries, ...fileEntries);

		for (const folder of foldersRes.data) {
			await readAll(folder.id);
		}
	};

	await readAll(folderId);
	return allEntries;
};
