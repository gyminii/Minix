import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

		const formData = await req.formData();
		const files = formData.getAll("files") as File[];
		const folderId = formData.get("folder_id") as string | null;
		if (!files || files.length === 0) {
			return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
		}

		const uploads = await Promise.all(
			files.map(async (file) => {
				try {
					// Make sure we have a valid file name
					if (!file.name || file.name === "undefined") {
						console.error("Invalid file name:", file);
						return {
							error: "Invalid file name",
							name: "unknown",
						};
					}
					console.log("filename: ", JSON.stringify(file, null, 4));

					// Update the file path to include the "files" folder
					const filePath = `files/${Date.now()}-${file.name}`;

					// Upload file to Supabase Storage in the "files" folder
					const { error: uploadError } = await client.storage
						.from("minix")
						.upload(filePath, file, {
							cacheControl: "3600",
							upsert: false,
						});

					if (uploadError) {
						console.error("Upload error:", uploadError);
						return {
							error: uploadError.message,
							name: file.name,
						};
					}

					// Get public URL for the uploaded file
					const { data } = await client.storage
						.from("minix")
						.createSignedUrl(filePath, 604800);

					// Return complete metadata object
					return {
						name: file.name,
						path: filePath,
						size: file.size,
						type: file.type,
						folder_id: folderId || null,
						user_id: user.id,
						url: data ? data.signedUrl : null,
					};
				} catch (err) {
					console.error("Error processing file:", err);
					return {
						error: String(err),
						name: file.name || "unknown",
					};
				}
			})
		);

		// Properly filter successful uploads
		const successful = uploads.filter(
			(upload) =>
				!upload.error &&
				upload.name &&
				upload.path &&
				upload.size &&
				upload.type &&
				upload.user_id
		);

		const failed = uploads.filter((upload) => upload.error || !upload.name);

		if (successful.length > 0) {
			// Prepare data for database insertion
			const dbRecords = successful.map((meta) => meta);

			// Insert metadata into database
			const { error: insertError } = await client
				.from("files")
				.insert(dbRecords)
				.select();

			if (insertError) {
				console.error("Insert error:", insertError);
				return NextResponse.json(
					{ error: "Insert failed", details: insertError },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({
			success: successful.map((f) => ({ name: f.name, url: f.url })),
			failed: failed.map((f) => ({
				name: f.name || "Unknown",
				error: f.error,
			})),
		});
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
		// Parse the request body to get the array of file IDs
		const { fileIds } = await req.json();

		// Validate input
		if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
			return NextResponse.json(
				{ error: "Invalid input: fileIds must be a non-empty array" },
				{ status: 400 }
			);
		}

		// Initialize Supabase client
		const supabase = await createClient();

		// Get the current user to ensure they can only delete their own files
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const userId = String(user.id);
		// Step 1: Get file paths for all files to be deleted
		const { data: filesToDelete, error: fetchError } = await supabase
			.from("files")
			.select("id, path, name")
			.in("id", fileIds)
			.eq("user_id", userId); // Security check: only delete own files

		if (fetchError) {
			console.error("Error fetching files to delete:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch files", details: fetchError.message },
				{ status: 500 }
			);
		}

		// If no files found or fewer files than requested, some might not exist or belong to the user
		if (!filesToDelete || filesToDelete.length === 0) {
			return NextResponse.json(
				{
					error:
						"No files found or you do not have permission to delete these files",
				},
				{ status: 404 }
			);
		}

		// If some files weren't found, inform the user
		if (filesToDelete.length < fileIds.length) {
			console.warn(
				`Only ${filesToDelete.length} out of ${fileIds.length} files were found and will be deleted`
			);
		}

		// Step 2: Delete files from storage bucket
		const storageResults = [];
		const storageErrors = [];

		for (const file of filesToDelete) {
			if (file.path) {
				const { error: storageError } = await supabase.storage
					.from("files") // Replace with your actual bucket name if different
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
				} else {
					storageResults.push({
						id: file.id,
						name: file.name,
						path: file.path,
					});
				}
			}
		}

		// Step 3: Delete files from the database
		const { error: deleteError } = await supabase
			.from("files")
			.delete()
			.in(
				"id",
				filesToDelete.map((file) => file.id)
			);

		if (deleteError) {
			console.error("Error deleting files from database:", deleteError);
			return NextResponse.json(
				{
					error: "Failed to delete files from database",
					details: deleteError.message,
					storageResults:
						storageResults.length > 0 ? storageResults : undefined,
					storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
				},
				{ status: 500 }
			);
		}

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
