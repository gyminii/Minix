"use client";
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

	const res = await fetch(`/api/folders/${folderId}/path`);
	if (!res.ok) return [];

	return (await res.json()) as Folder[];
};
