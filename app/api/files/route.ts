import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {}

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
		console.log("formdata: ", formData);
		if (!files || files.length === 0) {
			return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
		}

		// Log the raw files to see what we're working with
		console.log(
			"Raw files:",
			files.map((file) => ({
				name: file.name,
				type: file.type,
				size: file.size,
			}))
		);

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
					const { data: uploadData, error: uploadError } = await client.storage
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
					const { data: urlData } = client.storage
						.from("minix")
						.getPublicUrl(filePath);

					// Return complete metadata object
					return {
						name: file.name,
						path: filePath,
						size: file.size,
						type: file.type,
						folder_id: folderId || null,
						user_id: user.id,
						publicUrl: urlData.publicUrl,
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
			console.log("Successful uploads:", successful.length);

			// Prepare data for database insertion
			const dbRecords = successful.map(({ publicUrl, ...meta }) => meta);

			// Log what we're inserting
			console.log("Inserting records:", JSON.stringify(dbRecords, null, 2));

			// Insert metadata into database
			const { data: insertData, error: insertError } = await client
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

			console.log("Inserted data:", insertData);
		}

		return NextResponse.json({
			success: successful.map((f) => ({ name: f.name, url: f.publicUrl })),
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
