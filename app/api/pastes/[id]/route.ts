import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import { deletePaste, getPaste, updatePaste } from "@/lib/db";
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

		const userId = await getUserId();
		const db = await getDb();
		const pasteData = await getPaste(db, id);

		if (!pasteData) {
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

		if (userId && pasteData.user_id !== userId) {
			return NextResponse.json(
				{ error: "You don't have permission to access this paste" },
				{ status: 403 }
			);
		}

		// Get the paste content from the bucket
		const bucket = await getBucket();
		const object = await bucket.get(`pastes/${id}.txt`);

		if (!object) {
			console.error("Error fetching paste content: object missing");
			return NextResponse.json(
				{ error: "Failed to fetch paste content" },
				{ status: 500 }
			);
		}

		const content = await object.text();
		const paste: Paste = {
			id: pasteData.id,
			name: pasteData.name,
			content,
			created_at: pasteData.created_at,
			folder_id: pasteData.folder_id,
			syntax: pasteData.syntax || "plaintext",
			expires_at: pasteData.expires_at || null,
			user_id: pasteData.user_id,
			url: null,
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

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get the paste to check ownership
		const db = await getDb();
		const pasteData = await getPaste(db, id);

		if (!pasteData) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		// Check ownership
		if (pasteData.user_id !== userId) {
			return NextResponse.json(
				{ error: "You don't have permission to update this paste" },
				{ status: 403 }
			);
		}

		// Get update data
		const { content, name, expiresAt, folderId, syntax } =
			(await request.json()) as {
				content?: string;
				name?: string;
				expiresAt?: string | null;
				folderId?: string | null;
				syntax?: string;
			};

		// Update paste metadata
		const updateData: Record<string, string | null> = {};
		if (name) updateData.name = name;
		if (folderId !== undefined) updateData.folder_id = folderId;
		if (syntax) updateData.syntax = syntax;
		if (expiresAt !== undefined) updateData.expires_at = expiresAt;
		updateData.updated_at = new Date().toISOString();

		await updatePaste(db, id, updateData);

		// Update content if provided
		if (content) {
			const bucket = await getBucket();
			await bucket.put(`pastes/${id}.txt`, content, {
				httpMetadata: { contentType: "text/plain" },
			});
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

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get the paste to check ownership
		const db = await getDb();
		const pasteData = await getPaste(db, id);

		if (!pasteData) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		// Check ownership
		if (pasteData.user_id !== userId) {
			return NextResponse.json(
				{ error: "You don't have permission to delete this paste" },
				{ status: 403 }
			);
		}

		// Delete paste metadata
		await deletePaste(db, id);

		// Delete content from the bucket
		try {
			const bucket = await getBucket();
			await bucket.delete(`pastes/${id}.txt`);
		} catch (storageError) {
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
