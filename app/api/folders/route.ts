import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import {
	deleteFolder,
	getFolder,
	insertFolder,
	listFolders,
	listSubtreeFileKeys,
	listSubtreePasteIds,
} from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const body = (await request.json()) as {
			name?: string;
			parent_id?: string | null;
		};
		const { name, parent_id } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Folder name is required" },
				{ status: 400 }
			);
		}

		const db = await getDb();
		const folder = await insertFolder(db, {
			id: crypto.randomUUID(),
			user_id: userId,
			name,
			parent_id: parent_id || null,
			created_at: new Date().toISOString(),
		});

		return NextResponse.json({ success: true, folder }, { status: 201 });
	} catch (error) {
		console.error("Folder creation error:", error);
		return NextResponse.json(
			{ error: "Failed to create folder" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const body = (await request.json()) as { folderIds?: string | string[] };
		const { folderIds } = body;

		// Validate input
		if (!folderIds || (Array.isArray(folderIds) && folderIds.length === 0)) {
			return NextResponse.json(
				{ error: "At least one folder ID is required" },
				{ status: 400 }
			);
		}

		// Convert to array if single ID is provided
		const folderIdsArray = Array.isArray(folderIds) ? folderIds : [folderIds];

		const db = await getDb();
		const bucket = await getBucket();

		// Process each folder ID
		const results = await Promise.all(
			folderIdsArray.map(async (folderId: string) => {
				try {
					const folder = await getFolder(db, userId, folderId);
					if (!folder) {
						return {
							id: folderId,
							success: false,
							error: "Folder not found or access denied",
						};
					}

					// The folder rows below cascade on delete, their stored objects do not
					const keys = await listSubtreeFileKeys(db, userId, folderId);
					const pasteIds = await listSubtreePasteIds(db, userId, folderId);
					const objects = [
						...keys,
						...pasteIds.map((id) => `pastes/${id}.txt`),
					];
					if (objects.length > 0) await bucket.delete(objects);

					await deleteFolder(db, userId, folderId);

					return { id: folderId, success: true };
				} catch (error) {
					console.error(`Error deleting folder ${folderId}:`, error);
					return {
						id: folderId,
						success: false,
						error: "Failed to delete folder",
					};
				}
			})
		);

		return NextResponse.json({ results });
	} catch (error) {
		console.error("Folder deletion error:", error);
		return NextResponse.json(
			{ error: "Failed to process folder deletion" },
			{ status: 500 }
		);
	}
}

export async function GET(_request: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();
		const folders = await listFolders(db, userId);

		return NextResponse.json(
			folders.map((f) => ({
				id: f.id,
				name: f.name,
				parent_id: f.parent_id,
				created_at: f.created_at,
			}))
		);
	} catch (error) {
		console.error("Folder fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch folders" },
			{ status: 500 }
		);
	}
}
