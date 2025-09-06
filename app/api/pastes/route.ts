import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";

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

		const { content, name, expiresAt, folderId, syntax } = await req.json();

		if (!content) {
			return NextResponse.json(
				{ error: "Content is required" },
				{ status: 400 }
			);
		}

		// Create paste metadata first
		const { data: pasteData, error: metaError } = await client
			.from("pastes")
			.insert({
				name: name || "Untitled Paste",
				user_id: user.id,
				folder_id: folderId || null,
				syntax: syntax || "plaintext",
				expires_at: expiresAt || null,
			})
			.select()
			.single();

		if (metaError) {
			console.error("Error creating paste metadata:", metaError);
			return NextResponse.json(
				{ error: "Failed to create paste" },
				{ status: 500 }
			);
		}

		const pasteId = pasteData.id;

		// Store the actual content in Supabase Storage
		const pastePath = `pastes/${pasteId}.txt`;
		const { error: storageError } = await client.storage
			.from("minix")
			.upload(pastePath, content, {
				contentType: "text/plain",
				upsert: true,
			});
		if (storageError) {
			console.error("Error storing paste content:", storageError);
			// Clean up the metadata if storage fails
			await client.from("pastes").delete().eq("id", pasteId);
			return NextResponse.json(
				{ error: "Failed to store paste content" },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				id: pasteId,
				name: pasteData.name,
				syntax: pasteData.syntax,
				expiresAt: pasteData.expires_at,
				created_at: pasteData.created_at,
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

		let query = client
			.from("pastes")
			.select("id, name, syntax, folder_id, expires_at, created_at, url")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (folderId) {
			query = query.eq("folder_id", folderId);
		} else {
			query = query.is("folder_id", null);
		}

		const { data: pastesData, error: pastesError } = await query;

		if (pastesError) {
			console.error("Error fetching pastes:", pastesError);
			return NextResponse.json(
				{ error: "Failed to fetch pastes" },
				{ status: 500 }
			);
		}

		if (!pastesData || pastesData.length === 0) {
			return NextResponse.json([]);
		}
		const now = new Date();
		const validPastes = pastesData
			.filter((paste) => {
				const expiresAt = paste.expires_at ? new Date(paste.expires_at) : null;
				return !expiresAt || expiresAt > now;
			})
			.map((paste) => ({
				id: paste.id,
				name: paste.name,
				syntax: paste.syntax,
				folder_id: paste.folder_id,
				expires_at: paste.expires_at,
				created_at: paste.created_at,
				url: paste.url,
			}));

		console.log("Valid pastes found:", validPastes.length);
		return NextResponse.json(validPastes);
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
