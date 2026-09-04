import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { getFolderPath } from "@/lib/db";
import type { Folder } from "@/lib/types/type";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();
		const path = await getFolderPath(db, userId, id);

		const folders: Folder[] = path.map((f) => ({
			id: f.id,
			name: f.name,
			created_at: f.created_at,
			type: "folder",
		}));

		return NextResponse.json(folders);
	} catch (error) {
		console.error("Folder path error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch folder path" },
			{ status: 500 }
		);
	}
}
