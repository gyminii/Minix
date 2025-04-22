import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useGetCurrentUser = (): User | null => {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			const { data, error } = await createClient().auth.getSession();
			if (error) {
				console.error("Failed to fetch session:", error);
				return;
			}

			const sessionUser = data.session?.user ?? null;
			setUser(sessionUser);
		};

		fetchUser();
	}, []);

	return user;
};
