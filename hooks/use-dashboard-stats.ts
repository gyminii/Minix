"use client";

import type { DashboardStats } from "@/lib/types/dashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const DASHBOARD_STATS_KEY = ["dashboard-stats"] as const;

export function useDashboardStats() {
	const queryClient = useQueryClient();

	const query = useQuery<DashboardStats>({
		queryKey: DASHBOARD_STATS_KEY,
		queryFn: async ({ signal }) => {
			const res = await fetch("/api/dashboard", { signal });
			if (!res.ok) throw new Error("Failed to fetch dashboard stats");
			return (await res.json()) as DashboardStats;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchInterval: 30_000,
	});

	const refreshDashboardStats = () =>
		queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });

	return {
		...query,
		refreshDashboardStats,
	};
}
