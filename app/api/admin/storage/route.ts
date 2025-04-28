import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		try {
			const { data: bucket, error: bucketError } =
				await supabase.storage.getBucket("minix");

			if (bucketError) {
				throw bucketError;
			}
			console.log(bucket);
			return NextResponse.json({
				bucket: {
					name: bucket.name,
					id: bucket.id,
					owner: bucket.owner,
					public: bucket.public,
					created_at: bucket.created_at,
					updated_at: bucket.updated_at,
				},
			});
		} catch (error) {
			console.error("Error fetching bucket information:", error);
			return NextResponse.json(
				{ error: "Failed to fetch bucket information" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in storage admin endpoint:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
