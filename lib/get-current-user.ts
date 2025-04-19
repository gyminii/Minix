import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
export const getCurrentUser = cache(async (): Promise<User | null> => {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();
	if (error) throw new Error("Failed to get current user");

	return data.user ?? null;
});
