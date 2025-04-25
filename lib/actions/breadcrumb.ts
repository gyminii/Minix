"use client";
import { createClient } from "../supabase/client";
import type { Folder } from "../types/type";

/**
 * Get folder breadcrumb path
 * @param folderId Current folder ID
 * @returns Array of folder objects representing the path
 */
export const getFolderPath = async (
	folderId: string | null
): Promise<Folder[]> => {
	if (!folderId) return [];

	const supabase = createClient();
	const path: Folder[] = [];

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
