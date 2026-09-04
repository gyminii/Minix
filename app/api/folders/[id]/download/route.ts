import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import { getFolder, listChildFiles } from "@/lib/db";
import JSZip from "jszip";
import { NextResponse } from "next/server";
// Define the correct parameter types for Next.js App Router
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: folderId } = await params;
		if (!folderId) {
			return NextResponse.json(
				{ error: "Folder ID is required" },
				{ status: 400 }
			);
		}

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();

		// Get folder info to verify ownership and get folder name
		const folder = await getFolder(db, userId, folderId);
		if (!folder) {
			return NextResponse.json(
				{
					error: "Folder not found or you don't have permission to access it",
				},
				{ status: 404 }
			);
		}

		// Get all files in the folder
		const files = await listChildFiles(db, userId, folderId);

		// Create a zip file
		const zip = new JSZip();
		const bucket = await getBucket();

		// Add files to the zip
		for (const file of files) {
			const object = await bucket.get(file.key);
			if (!object) {
				console.error(`Error downloading file ${file.name}: object missing`);
				continue;
			}

			// Add file to zip
			zip.file(file.name, await object.arrayBuffer());
		}

		// Generate zip file
		const zipContent = await zip.generateAsync({ type: "arraybuffer" });

		// Return the zip file
		return new NextResponse(zipContent, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${folder.name}.zip"`,
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
