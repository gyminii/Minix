import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import JSZip from "jszip";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const folderId = params.id;
		if (!folderId) {
			return NextResponse.json(
				{ error: "Folder ID is required" },
				{ status: 400 }
			);
		}

		const client = await createClient();

		// Authenticate user
		const { data: userData, error: userError } = await client.auth.getUser();
		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get folder info to verify ownership and get folder name
		const { data: folderData, error: folderError } = await client
			.from("folders")
			.select("id, name")
			.eq("id", folderId)
			.eq("user_id", userData.user.id)
			.single();

		if (folderError || !folderData) {
			return NextResponse.json(
				{
					error: "Folder not found or you don't have permission to access it",
				},
				{ status: 404 }
			);
		}

		// Get all files in the folder
		const { data: files, error: filesError } = await client
			.from("files")
			.select("id, name, path, size, type")
			.eq("folder_id", folderId)
			.eq("user_id", userData.user.id);

		if (filesError) {
			return NextResponse.json(
				{ error: "Failed to fetch files" },
				{ status: 500 }
			);
		}

		// Create a zip file
		const zip = new JSZip();

		// Add files to the zip
		if (files && files.length > 0) {
			for (const file of files) {
				if (file.path) {
					// Download file from storage
					const { data: fileData, error: downloadError } = await client.storage
						.from("minix")
						.download(file.path);

					if (downloadError || !fileData) {
						console.error(
							`Error downloading file ${file.name}:`,
							downloadError
						);
						continue;
					}

					// Add file to zip
					zip.file(file.name, await fileData.arrayBuffer());
				}
			}
		}

		// Generate zip file
		const zipContent = await zip.generateAsync({ type: "arraybuffer" });

		// Return the zip file
		return new NextResponse(zipContent, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${folderData.name}.zip"`,
			},
		});
	} catch (error) {
		console.error("Error downloading folder:", error);
		return NextResponse.json(
			{
				error: "Failed to download folder",
			},
			{ status: 500 }
		);
	}
}
