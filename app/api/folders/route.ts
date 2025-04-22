import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type FileNode = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string; // MIME type
};

type FolderEntry = {
	id: string;
	name: string;
	created_at: string;
	type: "folder";
};

type FileEntry = FileNode & { type: "file" };

type Entry = FolderEntry | FileEntry;
// app/api/folders/route.ts

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

		const userId = userData.user.id;
		const allFolders: FolderEntry[] = [];

		const readFolders = async (parentId: string | null) => {
			const { data, error } = await client
				.from("folders")
				.select("id, name, created_at")
				.eq("user_id", userId)
				.is("parent_id", parentId);

			if (error) throw error;

			const folders: FolderEntry[] = data.map((f) => ({
				...f,
				type: "folder",
			}));
			allFolders.push(...folders);

			for (const folder of data) {
				await readFolders(folder.id);
			}
		};

		await readFolders(null);

		return NextResponse.json({ data: allFolders }, { status: 200 });
	} catch (error) {
		console.error("Folder fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch folders" },
			{ status: 500 }
		);
	}
}

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
		const { name } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Folder name is required" },
				{ status: 400 }
			);
		}

		const folder = {
			name,
			user_id: userData.user.id,
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

		const { ids } = await request.json();

		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json(
				{ error: "No folder IDs provided" },
				{ status: 400 }
			);
		}

		const { data, error } = await client
			.from("folders")
			.delete()
			.in("id", ids)
			.eq("user_id", user.id);

		if (error) throw error;

		return NextResponse.json({ success: true, deleted: data }, { status: 200 });
	} catch (error) {
		console.error("Folder delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete folders" },
			{ status: 500 }
		);
	}
}
