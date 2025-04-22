"use client";

import { createClient } from "@/lib/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogout() {
	const supabase = createClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async () => {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			return true;
		},
		onSuccess: () => {
			router.push("/auth/login");
			router.refresh();
		},
		onError: (error) => {
			console.error("Error signing out:", error);
		},
	});
}
