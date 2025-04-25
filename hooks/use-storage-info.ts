"use client";

import { useQuery } from "@tanstack/react-query";

export type StorageInfo = {
	bucket: {
		name: string;
		id: string;
		owner: string;
		public: boolean;
		created_at: string;
		updated_at: string;
	};
};

export function useStorageInfo() {
	return useQuery<StorageInfo>({
		queryKey: ["storage-info"],
		queryFn: async () => {
			const response = await fetch("/api/admin/storage");
			if (!response.ok) {
				throw new Error("Failed to fetch storage information");
			}
			return response.json();
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	});
}
