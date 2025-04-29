"use client";

import { useQuery } from "@tanstack/react-query";

type Folder = {
	id: string;
	name: string;
	parent_id: string | null;
	created_at: string;
};

export function useFolders() {
	return useQuery<Folder[]>({
		queryKey: ["folders"],
		queryFn: async () => {
			const response = await fetch("/api/folders");
			if (!response.ok) {
				throw new Error("Failed to fetch folders");
			}
			return response.json();
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
