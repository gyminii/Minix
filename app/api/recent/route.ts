import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
const FILE_TYPES = {
	DOCUMENTS: [
		"pdf",
		"doc",
		"docx",
		"txt",
		"rtf",
		"odt",
		"xls",
		"xlsx",
		"ppt",
		"pptx",
	],
	IMAGES: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff", "ico"],
	VIDEOS: ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v", "3gp"],
	// All other file types will be categorized as "OTHERS"
};
export async function GET(req: Request) {
	try {
		const client = await createClient();
		const { data: userData, error: userError } = await client.auth.getUser();
		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}
	} catch (error) {}
}
