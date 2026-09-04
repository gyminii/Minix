import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { getPaste, insertShare } from "@/lib/db";
import { NextResponse } from "next/server";

const SHARE_TTL_SECONDS = 604800;

const createToken = () => {
	const random = crypto.getRandomValues(new Uint8Array(16));
	const suffix = Array.from(random, (byte) =>
		byte.toString(16).padStart(2, "0")
	).join("");
	return `${crypto.randomUUID().replaceAll("-", "")}${suffix}`;
};

export async function POST(
	req: Request,
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

		const db = await getDb();
		const paste = await getPaste(db, id);

		if (!paste) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		if (paste.user_id !== userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		const expiresAt = new Date(
			Date.now() + SHARE_TTL_SECONDS * 1000
		).toISOString();
		const share = await insertShare(db, {
			token: createToken(),
			user_id: userId,
			kind: "paste",
			target_id: id,
			expires_at: expiresAt,
			created_at: new Date().toISOString(),
		});

		return NextResponse.json({
			signedUrl: `${new URL(req.url).origin}/s/${share.token}`,
			expiresAt,
		});
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
