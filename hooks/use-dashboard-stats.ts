"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export type DashboardStats = {
	stats: {
		documents: {
			count: number;
			size: number;
			sizeGB: number;
			percentage: number;
		};
		images: { count: number; size: number; sizeGB: number; percentage: number };
		videos: { count: number; size: number; sizeGB: number; percentage: number };
		others: { count: number; size: number; sizeGB: number; percentage: number };
		total: { count: number; size: number; sizeGB: number; percentage: number };
	};
	folderStats: Array<{
		id: string;
		name: string;
		items: number;
		lastUpdate: string;
		starred: boolean;
	}>;
	storageInfo: {
		used: number;
		total: number;
		percentage: number;
	};
};

export function useDashboardStats() {
	const queryClient = useQueryClient();

	const query = useQuery<DashboardStats>({
		queryKey: ["dashboard-stats"],
		queryFn: async () => {
			const response = await fetch("/api/dashboard");
			if (!response.ok) {
				throw new Error("Failed to fetch dashboard stats");
			}
			return response.json();
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		refetchOnMount: true, // Refetch when component mounts
		refetchOnWindowFocus: true, // Refetch when window regains focus
	});

	// Add a function to manually refresh the data
	const refreshDashboardStats = () =>
		queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

	return {
		...query,
		refreshDashboardStats,
	};
}
