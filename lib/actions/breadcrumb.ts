import { createClient } from "../supabase/server";
// Types
export type FileNode = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string; // MIME type
};

export type FolderEntry = {
	id: string;
	name: string;
	created_at: string;
	type: "folder";
};
/**
 * Get folder breadcrumb path
 * @param folderId Current folder ID
 * @returns Array of folder objects representing the path
 */
export const getFolderPath = async (
	folderId: string | null
): Promise<FolderEntry[]> => {
	if (!folderId) return [];

	const supabase = await createClient();
	const path: FolderEntry[] = [];

	let currentId = folderId;

	while (currentId) {
		const { data, error } = await supabase
			.from("folders")
			.select("id, name, created_at, parent_id")
			.eq("id", currentId)
			.single();

		if (error || !data) break;

		path.unshift({
			id: data.id,
			name: data.name,
			created_at: data.created_at,
			type: "folder",
		});

		currentId = data.parent_id;
	}

	return path;
};
