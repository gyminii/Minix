import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import { deletePaste, insertPaste, listPastes } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const { content, name, expiresAt, folderId, syntax } =
			(await req.json()) as {
				content?: string;
				name?: string;
				expiresAt?: string | null;
				folderId?: string | null;
				syntax?: string;
			};

		if (!content) {
			return NextResponse.json(
				{ error: "Content is required" },
				{ status: 400 }
			);
		}

		const db = await getDb();
		const now = new Date().toISOString();

		// Create paste metadata first
		const paste = await insertPaste(db, {
			id: crypto.randomUUID(),
			user_id: userId,
			name: name || "Untitled Paste",
			syntax: syntax || "plaintext",
			folder_id: folderId || null,
			expires_at: expiresAt || null,
			created_at: now,
			updated_at: now,
		});

		// Store the actual content in the bucket
		try {
			const bucket = await getBucket();
			await bucket.put(`pastes/${paste.id}.txt`, content, {
				httpMetadata: { contentType: "text/plain" },
			});
		} catch (storageError) {
			console.error("Error storing paste content:", storageError);
			await deletePaste(db, paste.id);
			return NextResponse.json(
				{ error: "Failed to store paste content" },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				id: paste.id,
				name: paste.name,
				syntax: paste.syntax,
				expiresAt: paste.expires_at,
				created_at: paste.created_at,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10);
		const folderId = url.searchParams.get("folderId") || null;

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();
		const pastes = await listPastes(
			db,
			userId,
			folderId,
			limit,
			new Date().toISOString()
		);

		return NextResponse.json(
			pastes.map((paste) => ({
				id: paste.id,
				name: paste.name,
				syntax: paste.syntax,
				folder_id: paste.folder_id,
				expires_at: paste.expires_at,
				created_at: paste.created_at,
				url: null,
			}))
		);
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
