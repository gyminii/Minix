import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import {
	deleteFilesByIds,
	insertFile,
	listFilesByIds,
	listRecentFiles,
	listRecentPastes,
} from "@/lib/db";
import { NextResponse } from "next/server";

type Upload =
	| { name: string; url: string; error?: undefined }
	| { name: string; error: string; url?: undefined };

export async function POST(req: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const formData = await req.formData();
		const files = formData.getAll("files") as File[];
		const folderId = formData.get("folder_id") as string | null;

		if (!files || files.length === 0) {
			return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
		}

		const db = await getDb();
		const bucket = await getBucket();

		// Process uploads
		const uploads: Upload[] = await Promise.all(
			files.map(async (file): Promise<Upload> => {
				try {
					// Handling Invalid file names
					if (!file.name || file.name === "undefined") {
						return {
							error: "Invalid file name",
							name: "unknown",
						};
					}

					const id = crypto.randomUUID();
					const key = `files/${id}/${file.name}`;
					const type = file.type || "application/octet-stream";

					await bucket.put(key, await file.arrayBuffer(), {
						httpMetadata: { contentType: type },
					});

					const now = new Date().toISOString();
					await insertFile(db, {
						id,
						user_id: userId,
						name: file.name,
						key,
						size: file.size,
						type,
						folder_id: folderId || null,
						created_at: now,
						updated_at: now,
					});

					return { name: file.name, url: `/api/files/${id}/raw` };
				} catch (err) {
					console.error("Error processing file:", err);
					return {
						error: String(err),
						name: file.name || "unknown",
					};
				}
			})
		);

		const successful = uploads.filter((upload) => !upload.error);
		const failed = uploads.filter((upload) => upload.error);

		if (successful.length > 0 && failed.length > 0) {
			// Partial success case
			return NextResponse.json(
				{
					message: "Some files were uploaded successfully, but others failed",
					success: successful.map((f) => ({ name: f.name, url: f.url })),
					failed: failed.map((f) => ({
						name: f.name || "Unknown",
						error: f.error,
					})),
					totalAttempted: files.length,
					successCount: successful.length,
					failureCount: failed.length,
				},
				{ status: 207 } // Multi-Status
			);
		} else if (successful.length > 0) {
			return NextResponse.json({
				success: successful.map((f) => ({ name: f.name, url: f.url })),
				failed: [],
			});
		} else {
			// Complete failure
			return NextResponse.json(
				{
					error: "All file uploads failed",
					failed: failed.map((f) => ({
						name: f.name || "Unknown",
						error: f.error,
					})),
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal error", details: String(error) },
			{ status: 500 }
		);
	}
}
export async function DELETE(req: Request) {
	try {
		const { fileIds } = (await req.json()) as { fileIds?: string[] };

		if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
			return NextResponse.json(
				{ error: "Invalid input: fileIds must be a non-empty array" },
				{ status: 400 }
			);
		}

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = await getDb();
		const filesToDelete = await listFilesByIds(db, userId, fileIds);

		if (filesToDelete.length === 0) {
			return NextResponse.json(
				{
					error:
						"No files found or you do not have permission to delete these files",
				},
				{ status: 404 }
			);
		}

		if (filesToDelete.length < fileIds.length) {
			console.warn(
				`Only ${filesToDelete.length} out of ${fileIds.length} files were found and will be deleted`
			);
		}

		const bucket = await getBucket();
		const storageErrors = [];

		for (const file of filesToDelete) {
			try {
				await bucket.delete(file.key);
			} catch (storageError) {
				console.error(
					`Error deleting file ${file.id} from storage:`,
					storageError
				);
				storageErrors.push({
					id: file.id,
					name: file.name,
					error: String(storageError),
				});
			}
		}

		await deleteFilesByIds(
			db,
			filesToDelete.map((file) => file.id)
		);

		// Return success response with details
		return NextResponse.json({
			message: `Successfully deleted ${filesToDelete.length} files`,
			deletedCount: filesToDelete.length,
			deletedFiles: filesToDelete.map((file) => ({
				id: file.id,
				name: file.name,
			})),
			storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
		});
	} catch (error) {
		console.error("Unexpected error in DELETE handler:", error);
		return NextResponse.json(
			{
				error: "An unexpected error occurred",
				details: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}
export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const limit = Number.parseInt(url.searchParams.get("limit") || "5", 10);

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();
		const [fileItems, pasteItems] = await Promise.all([
			listRecentFiles(db, userId, limit),
			listRecentPastes(db, userId, limit),
		]);

		return NextResponse.json([
			...fileItems.map((f) => ({ ...f, url: `/api/files/${f.id}/raw` })),
			...pasteItems.map((p) => ({ ...p, url: null })),
		]);
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal error", details: String(error) },
			{ status: 500 }
		);
	}
}
