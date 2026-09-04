import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { getFileByKey, getFileById } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULT_TTL_SECONDS = 60; // 1 minute link

type DownloadBody =
	| { id: string; ttlSeconds?: number; redirect?: boolean }
	| { path: string; ttlSeconds?: number; redirect?: boolean };

// ───────────────────────────────────────────
// Type guards (no "any" needed)
// ───────────────────────────────────────────
function hasId(
	body: DownloadBody
): body is { id: string; ttlSeconds?: number; redirect?: boolean } {
	return "id" in body;
}

function hasPath(
	body: DownloadBody
): body is { path: string; ttlSeconds?: number; redirect?: boolean } {
	return "path" in body;
}

export async function POST(req: Request) {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await req.json()) as DownloadBody;
		const ttlSeconds =
			"ttlSeconds" in body && typeof body.ttlSeconds === "number"
				? body.ttlSeconds
				: DEFAULT_TTL_SECONDS;
		const ttl = Math.max(10, Math.min(60 * 60, ttlSeconds)); // clamp 10s..1h
		const redirect = "redirect" in body ? Boolean(body.redirect) : false;

		const db = await getDb();

		let id: string | null = null;
		let filename: string | null = null;

		if (hasId(body)) {
			const file = await getFileById(db, body.id);

			if (!file) {
				return NextResponse.json({ error: "File not found" }, { status: 404 });
			}
			if (file.user_id !== userId) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}

			id = file.id;
			filename = file.name;
		} else if (hasPath(body)) {
			const file = await getFileByKey(db, userId, body.path);

			if (!file) {
				return NextResponse.json({ error: "File not found" }, { status: 404 });
			}

			id = file.id;
			filename = file.name;
		} else {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		const url = `/api/files/${id}/raw?download=1`;

		if (redirect) {
			return NextResponse.redirect(new URL(url, req.url), { status: 302 });
		}

		return NextResponse.json({
			url,
			expiresIn: ttl,
			filename: filename ?? undefined,
		});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
