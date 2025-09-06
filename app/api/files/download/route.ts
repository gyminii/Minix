import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "minix";
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
		const supabase = await createClient();
		const {
			data: { user },
			error: userErr,
		} = await supabase.auth.getUser();
		if (userErr || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body: DownloadBody = await req.json();
		const ttlSeconds =
			"ttlSeconds" in body && typeof body.ttlSeconds === "number"
				? body.ttlSeconds
				: DEFAULT_TTL_SECONDS;
		const ttl = Math.max(10, Math.min(60 * 60, ttlSeconds)); // clamp 10s..1h
		const redirect = "redirect" in body ? Boolean(body.redirect) : false;

		let path: string | null = null;
		let filename: string | null = null;

		if (hasId(body)) {
			const { data, error } = await supabase
				.from("files")
				.select("path, name, user_id")
				.eq("id", body.id)
				.single();

			if (error || !data) {
				return NextResponse.json({ error: "File not found" }, { status: 404 });
			}
			if (data.user_id !== user.id) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}

			path = data.path;
			filename = data.name ?? null;
		} else if (hasPath(body)) {
			const { data, error } = await supabase
				.from("files")
				.select("path, name, user_id")
				.eq("path", body.path)
				.eq("user_id", user.id)
				.single();

			if (error || !data) {
				return NextResponse.json({ error: "File not found" }, { status: 404 });
			}

			path = data.path;
			filename = data.name ?? null;
		} else {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		if (!path) {
			return NextResponse.json(
				{ error: "No path available for file" },
				{ status: 400 }
			);
		}

		// Create a signed URL
		const { data: signed, error: signErr } = await supabase.storage
			.from(BUCKET)
			.createSignedUrl(path, ttl, {
				download: filename ?? undefined,
			});

		if (signErr || !signed?.signedUrl) {
			return NextResponse.json(
				{ error: "Could not sign URL" },
				{ status: 500 }
			);
		}

		if (redirect) {
			return NextResponse.redirect(signed.signedUrl, { status: 302 });
		}

		return NextResponse.json({
			url: signed.signedUrl,
			expiresIn: ttl,
			filename: filename ?? undefined,
		});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
