"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
	const supabase = createClient();

	const query = useQuery<DashboardStats>({
		queryKey: ["dashboard-stats"],
		queryFn: async () => {
			const response = await fetch("/api/dashboard");
			if (!response.ok) {
				throw new Error("Failed to fetch dashboard stats");
			}
			return response.json();
		},
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	// Set up a simplified realtime subscription for dashboard stats
	useEffect(() => {
		const channel = supabase
			.channel("dashboard-stats-changes")
			// Listen for file changes
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "files",
				},
				() => {
					// Simply invalidate the dashboard stats when any file changes
					queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
				}
			)
			// Listen for folder changes
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "folders",
				},
				() => {
					// Simply invalidate the dashboard stats when any folder changes
					queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient, supabase]);

	// Add a function to manually refresh the data
	const refreshDashboardStats = () => {
		queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
	};

	return {
		...query,
		refreshDashboardStats,
	};
}
