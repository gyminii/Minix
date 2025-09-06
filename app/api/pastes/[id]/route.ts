import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Paste } from "@/lib/types/pastes";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Paste ID is required" },
				{ status: 400 }
			);
		}

		const client = await createClient();
		const {
			data: { user },
		} = await client.auth.getUser();

		const { data: pasteData, error: pasteError } = await client
			.from("pastes")
			.select(
				"id, name, syntax, folder_id, expires_at, user_id, created_at, url"
			)
			.eq("id", id)
			.single();

		if (pasteError || !pasteData) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		if (pasteData.expires_at) {
			const expiresAt = new Date(pasteData.expires_at);
			if (expiresAt < new Date()) {
				return NextResponse.json(
					{ error: "This paste has expired" },
					{ status: 410 }
				);
			}
		}

		if (user && pasteData.user_id !== user.id) {
			return NextResponse.json(
				{ error: "You don't have permission to access this paste" },
				{ status: 403 }
			);
		}

		// Get the paste content from storage
		const { data: contentData, error: contentError } = await client.storage
			.from("minix")
			.download(`pastes/${pasteData.name}.txt`);

		if (contentError) {
			console.error("Error fetching paste content:", contentError);
			return NextResponse.json(
				{ error: "Failed to fetch paste content" },
				{ status: 500 }
			);
		}

		const content = await contentData.text();
		const paste: Paste = {
			id: pasteData.id,
			name: pasteData.name,
			content,
			created_at: pasteData.created_at,
			folder_id: pasteData.folder_id,
			syntax: pasteData.syntax || "plaintext",
			expires_at: pasteData.expires_at || null,
			user_id: pasteData.user_id,
			url: pasteData.url,
		};

		return NextResponse.json(paste);
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Paste ID is required" },
				{ status: 400 }
			);
		}

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

		// Get the paste to check ownership
		const { data: pasteData, error: pasteError } = await client
			.from("pastes")
			.select("id, user_id")
			.eq("id", id)
			.single();

		if (pasteError || !pasteData) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		// Check ownership
		if (pasteData.user_id !== user.id) {
			return NextResponse.json(
				{ error: "You don't have permission to update this paste" },
				{ status: 403 }
			);
		}

		// Get update data
		const { content, name, expiresAt, folderId, syntax } = await request.json();

		// Update paste metadata
		const updateData: Record<string, unknown> = {};
		if (name) updateData.name = name;
		if (folderId !== undefined) updateData.folder_id = folderId;
		if (syntax) updateData.syntax = syntax;
		if (expiresAt !== undefined) updateData.expires_at = expiresAt;
		updateData.updated_at = new Date().toISOString();

		if (Object.keys(updateData).length > 0) {
			const { error: metaUpdateError } = await client
				.from("pastes")
				.update(updateData)
				.eq("id", id);

			if (metaUpdateError) {
				console.error("Error updating paste metadata:", metaUpdateError);
				return NextResponse.json(
					{ error: "Failed to update paste metadata" },
					{ status: 500 }
				);
			}
		}

		// Update content if provided
		if (content) {
			const { error: storageError } = await client.storage
				.from("minix")
				.upload(`pastes/${id}.txt`, content, {
					contentType: "text/plain",
					upsert: true,
				});

			if (storageError) {
				console.error("Error updating paste content:", storageError);
				return NextResponse.json(
					{ error: "Failed to update paste content" },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({
			id,
			message: "Paste updated successfully",
		});
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Paste ID is required" },
				{ status: 400 }
			);
		}

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

		// Get the paste to check ownership
		const { data: pasteData, error: pasteError } = await client
			.from("pastes")
			.select("id, user_id")
			.eq("id", id)
			.single();

		if (pasteError || !pasteData) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		// Check ownership
		if (pasteData.user_id !== user.id) {
			return NextResponse.json(
				{ error: "You don't have permission to delete this paste" },
				{ status: 403 }
			);
		}

		// Delete paste metadata
		const { error: metaDeleteError } = await client
			.from("pastes")
			.delete()
			.eq("id", id);

		if (metaDeleteError) {
			console.error("Error deleting paste metadata:", metaDeleteError);
			return NextResponse.json(
				{ error: "Failed to delete paste metadata" },
				{ status: 500 }
			);
		}

		// Delete content from storage
		const { error: storageError } = await client.storage
			.from("minix")
			.remove([`pastes/${id}.txt`]);

		if (storageError) {
			console.error("Error deleting paste content:", storageError);
			// Continue with deletion even if storage removal fails
		}

		return NextResponse.json({ message: "Paste deleted successfully" });
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
