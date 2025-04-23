import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const client = await createClient();
		const { data: userData, error: userError } = await client.auth.getUser();

		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { name, parent_id } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Folder name is required" },
				{ status: 400 }
			);
		}

		const folder = {
			name,
			user_id: userData.user.id,
			parent_id: parent_id || null, // Handle parent_id which can be null
		};

		const { data, error } = await client
			.from("folders")
			.insert(folder)
			.select();

		if (error) throw error;

		return NextResponse.json(
			{ success: true, folder: data?.[0] },
			{ status: 201 }
		);
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
		const client = await createClient();
		const {
			data: { user },
			error: authError,
		} = await client.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const { ids } = await request.json();

		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json(
				{ error: "No folder IDs provided" },
				{ status: 400 }
			);
		}

		// Step 1: Find all folders to delete (including subfolders)
		const foldersToDelete = await findAllFoldersRecursively(
			client,
			ids,
			user.id
		);

		if (foldersToDelete.length === 0) {
			return NextResponse.json(
				{
					error: "No folders found or you don't have permission to delete them",
				},
				{ status: 404 }
			);
		}

		const folderIds = foldersToDelete.map((folder) => folder.id);
		console.log(`Deleting ${folderIds.length} folders:`, folderIds);

		// Step 2: Find and delete all files in these folders
		const { deletedFiles, storageErrors } = await deleteFilesInFolders(
			client,
			folderIds,
			user.id
		);

		// Step 3: Delete all folders (will delete from bottom up)
		const { data, error } = await client
			.from("folders")
			.delete()
			.in("id", folderIds)
			.eq("user_id", user.id);

		if (error) throw error;

		return NextResponse.json(
			{
				success: true,
				deletedFolders: foldersToDelete.length,
				deletedFiles: deletedFiles.length,
				storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Folder delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete folders", details: (error as Error).message },
			{ status: 500 }
		);
	}
}

/**
 * Recursively finds all folders to delete, including subfolders
 */
async function findAllFoldersRecursively(client, initialFolderIds, userId) {
	const result = [];
	const processedIds = new Set();
	const idsToProcess = [...initialFolderIds];

	while (idsToProcess.length > 0) {
		const batchIds = idsToProcess.splice(0, 100); // Process in batches of 100
		const uniqueBatchIds = batchIds.filter((id) => !processedIds.has(id));

		if (uniqueBatchIds.length === 0) continue;

		// Mark these IDs as processed
		uniqueBatchIds.forEach((id) => processedIds.add(id));

		// Get folders that match these IDs and belong to the user
		const { data: folders, error } = await client
			.from("folders")
			.select("id, name, parent_id")
			.in("id", uniqueBatchIds)
			.eq("user_id", userId);

		if (error || !folders || folders.length === 0) continue;

		// Add these folders to the result
		result.push(...folders);

		// Find all subfolders of these folders
		const { data: subfolders, error: subfoldersError } = await client
			.from("folders")
			.select("id")
			.in(
				"parent_id",
				folders.map((f) => f.id)
			)
			.eq("user_id", userId);

		if (subfoldersError || !subfolders || subfolders.length === 0) continue;

		// Add subfolders to the processing queue
		idsToProcess.push(...subfolders.map((f) => f.id));
	}

	return result;
}

/**
 * Deletes all files in the specified folders
 */
async function deleteFilesInFolders(client, folderIds, userId) {
	// Find all files in these folders
	const { data: files, error: filesError } = await client
		.from("files")
		.select("id, name, path")
		.in("folder_id", folderIds)
		.eq("user_id", userId);

	if (filesError || !files || files.length === 0) {
		return { deletedFiles: [], storageErrors: [] };
	}

	console.log(`Found ${files.length} files to delete`);

	// Delete files from storage
	const storageErrors = [];
	const storagePromises = files.map(async (file) => {
		if (file.path) {
			const { error: storageError } = await client.storage
				.from("files") // Replace with your bucket name if different
				.remove([file.path]);

			if (storageError) {
				console.error(
					`Error deleting file ${file.id} from storage:`,
					storageError
				);
				storageErrors.push({
					id: file.id,
					name: file.name,
					error: storageError.message,
				});
			}
		}
	});

	// Wait for all storage operations to complete
	await Promise.all(storagePromises);

	// Delete files from database
	const { error: deleteError } = await client
		.from("files")
		.delete()
		.in(
			"id",
			files.map((file) => file.id)
		)
		.eq("user_id", userId);

	if (deleteError) {
		console.error("Error deleting files from database:", deleteError);
		throw deleteError;
	}

	return { deletedFiles: files, storageErrors };
}
