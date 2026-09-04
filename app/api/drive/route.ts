import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { listChildFiles, listChildFolders } from "@/lib/db";
import type { FileEntry, Folder } from "@/lib/types/type";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const folderId = url.searchParams.get("folderId") || null;

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();
		const [folders, files] = await Promise.all([
			listChildFolders(db, userId, folderId),
			listChildFiles(db, userId, folderId),
		]);

		const folderEntries: Folder[] = folders.map((f) => ({
			id: f.id,
			name: f.name,
			created_at: f.created_at,
			type: "folder",
		}));

		const fileEntries: FileEntry[] = files.map((f) => ({
			id: f.id,
			name: f.name,
			created_at: f.created_at,
			size: f.size,
			url: `/api/files/${f.id}/raw`,
			type: "file",
		}));

		return NextResponse.json([...folderEntries, ...fileEntries]);
	} catch (error) {
		console.error("Error in drive API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
