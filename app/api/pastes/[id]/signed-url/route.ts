import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
	_req: Request,
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
		const { data: paste, error: pasteError } = await client
			.from("pastes")
			.select("id, user_id")
			.eq("id", id)
			.single();

		if (pasteError) {
			return NextResponse.json(
				{ error: "Failed to fetch paste" },
				{ status: 500 }
			);
		}

		if (!paste) {
			return NextResponse.json({ error: "Paste not found" }, { status: 404 });
		}

		if (paste.user_id !== user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		const pastePath = `pastes/${id}.txt`;
		const { data: signedUrlData, error: signedUrlError } = await client.storage
			.from("minix")
			.createSignedUrl(pastePath, 604800);

		if (signedUrlError) {
			console.error("Error generating signed URL:", signedUrlError);
			return NextResponse.json(
				{ error: "Failed to generate signed URL" },
				{ status: 500 }
			);
		}
		const { error: updateError } = await client
			.from("pastes")
			.update({ url: signedUrlData.signedUrl })
			.eq("id", id);
		if (updateError) {
			console.error("Error updating paste URL:", updateError);
			return NextResponse.json(
				{ error: "Failed to update paste URL" },
				{ status: 500 }
			);
		}
		return NextResponse.json({
			signedUrl: signedUrlData.signedUrl,
			expiresAt: new Date(Date.now() + 604800 * 1000).toISOString(),
		});
	} catch (error) {
		console.error("Server error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
