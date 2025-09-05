import { createClient } from "@/lib/supabase/server";
import type { FileEntry, Folder } from "@/lib/types/type";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const folderId = url.searchParams.get("folderId") || null;

		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}
		if (!user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const userId = user.id;

		const foldersQuery = supabase
			.from("folders")
			.select("id, name, created_at")
			.eq("user_id", userId);
		const filesQuery = supabase
			.from("files")
			.select("id, name, created_at, size, type, url")
			.eq("user_id", userId);
		const pastesQuery = supabase
			.from("pastes")
			.select("id, title, created_at, url")
			.eq("user_id", userId);
		if (folderId === null) {
			foldersQuery.is("parent_id", null);
			filesQuery.is("folder_id", null);
		} else {
			foldersQuery.eq("parent_id", folderId);
			filesQuery.eq("folder_id", folderId);
		}

		// Execute both queries in parallel
		const [foldersRes, filesRes] = await Promise.all([
			foldersQuery,
			filesQuery,
		]);

		if (foldersRes.error || filesRes.error) {
			return NextResponse.json(
				{ error: foldersRes.error?.message || filesRes.error?.message },
				{ status: 500 }
			);
		}

		const folderEntries: Folder[] = foldersRes.data.map((f) => ({
			...f,
			type: "folder",
		}));

		const fileEntries: FileEntry[] = filesRes.data.map((f) => ({
			...f,
			type: "file",
		}));

		return NextResponse.json([...folderEntries, ...fileEntries]);
	} catch (error) {
		console.error("Error in drive API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
