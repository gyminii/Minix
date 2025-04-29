import { createClient } from "@/lib/supabase/server";
import { Folder } from "@/lib/types/type";
import { SupabaseClient } from "@supabase/supabase-js";
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
		const { data: userData, error: userError } = await client.auth.getUser();
		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}
		const userId = String(userData.user.id);

		const body = await request.json();
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

		// Process each folder ID
		const results = await Promise.all(
			folderIdsArray.map(async (folderId: string) => {
				try {
					// Verify folder ownership
					const { data: folderData, error: folderError } = await client
						.from("folders")
						.select("id")
						.eq("id", folderId)
						.eq("user_id", userId)
						.single();

					if (folderError || !folderData) {
						return {
							id: folderId,
							success: false,
							error: "Folder not found or access denied",
						};
					}

					// Recursively delete the folder and its contents
					await recursivelyDeleteFolder(client, folderId, userId);

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

// Recursive function to delete a folder and all its contents with proper types
async function recursivelyDeleteFolder(
	client: SupabaseClient,
	folderId: string,
	userId: string
): Promise<void> {
	// Step 1: Find all nested folders
	const { data: nestedFolders } = (await client
		.from("folders")
		.select("id")
		.eq("parent_id", folderId)) as { data: Pick<Folder, "id">[] | null };

	// Step 2: Recursively delete each nested folder
	if (nestedFolders && nestedFolders.length > 0) {
		await Promise.all(
			nestedFolders.map((folder) =>
				recursivelyDeleteFolder(client, folder.id, userId)
			)
		);
	}

	// Step 3: Find all files in this folder
	const { data: files } = await client
		.from("files")
		.select("id, path")
		.eq("folder_id", folderId)
		.eq("user_id", userId);
	console.log("FILES TO DELETE ALONGSIDE: ", JSON.stringify(files, null, 4));
	// Step 4: Delete all files from storage and database
	if (files && files.length > 0) {
		// Delete files from storage bucket
		const filePaths = files
			.map((file) => file.path)
			.filter((path): path is string => path !== undefined);
		console.log("FIle paths to delete", filePaths);
		if (filePaths.length > 0) {
			const { error: storageErrors, data } = await client.storage
				.from("minix")
				.remove(filePaths);
			console.log(storageErrors, data);
			if (storageErrors) {
				console.log("Error deleting: ", storageErrors);
			}
		}

		// Delete files from database
		await client.from("files").delete().eq("folder_id", folderId);
	}

	// Step 5: Finally delete the folder itself
	await client.from("folders").delete().eq("id", folderId);
}

export async function GET(request: Request) {
	try {
		const client = await createClient();
		const { data: userData, error: userError } = await client.auth.getUser();

		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const { data: folders, error: foldersError } = await client
			.from("folders")
			.select("id, name, parent_id, created_at")
			.eq("user_id", userData.user.id)
			.order("name", { ascending: true });

		if (foldersError) {
			return NextResponse.json(
				{ error: "Failed to fetch folders" },
				{ status: 500 }
			);
		}

		return NextResponse.json(folders);
	} catch (error) {
		console.error("Folder fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch folders" },
			{ status: 500 }
		);
	}
}
