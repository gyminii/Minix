import { getUserId } from "@/lib/auth";
import { getBucket, getDb } from "@/lib/cf";
import { getFile } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = await getDb();
		const file = await getFile(db, userId, id);
		if (!file) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		const bucket = await getBucket();
		const object = await bucket.get(file.key);
		if (!object) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		const download =
			new URL(request.url).searchParams.get("download") === "1"
				? "attachment"
				: "inline";

		return new Response(object.body, {
			headers: {
				"Content-Type": file.type || "application/octet-stream",
				"Content-Length": String(object.size),
				ETag: object.httpEtag,
				"Content-Disposition": `${download}; filename*=UTF-8''${encodeURIComponent(
					file.name
				)}`,
			},
		});
	} catch (error) {
		console.error("Error streaming file:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
