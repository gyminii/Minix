import { getBucket, getDb } from "@/lib/cf";
import { getFileById, getPaste, getShare } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params;

		const db = await getDb();
		const share = await getShare(db, token);

		if (!share) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		if (new Date(share.expires_at) < new Date()) {
			return NextResponse.json(
				{ error: "This link has expired" },
				{ status: 410 }
			);
		}

		const bucket = await getBucket();

		if (share.kind === "paste") {
			const paste = await getPaste(db, share.target_id);
			if (!paste) {
				return NextResponse.json({ error: "Not found" }, { status: 404 });
			}

			const object = await bucket.get(`pastes/${paste.id}.txt`);
			if (!object) {
				return NextResponse.json({ error: "Not found" }, { status: 404 });
			}

			return new Response(object.body, {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Content-Length": String(object.size),
					ETag: object.httpEtag,
				},
			});
		}

		const file = await getFileById(db, share.target_id);
		if (!file) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const object = await bucket.get(file.key);
		if (!object) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return new Response(object.body, {
			headers: {
				"Content-Type": file.type || "application/octet-stream",
				"Content-Length": String(object.size),
				ETag: object.httpEtag,
				"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
					file.name
				)}`,
			},
		});
	} catch (error) {
		console.error("Share link error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
