"use client";

import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/lib/types/dashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const DASHBOARD_STATS_KEY = ["dashboard-stats"] as const;

export function useDashboardStats() {
	const queryClient = useQueryClient();
	const supabase = createClient();

	const query = useQuery<DashboardStats>({
		queryKey: DASHBOARD_STATS_KEY,
		queryFn: async ({ signal }) => {
			const res = await fetch("/api/dashboard", { signal });
			if (!res.ok) throw new Error("Failed to fetch dashboard stats");
			return res.json();
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});

	useEffect(() => {
		const channel = supabase
			.channel("dashboard-stats-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "files" },
				() => {
					queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
				}
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "folders" },
				() => {
					queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
				}
			)
			.subscribe((status) => {
				if (status === "CHANNEL_ERROR") {
				}
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient, supabase]);

	const refreshDashboardStats = () =>
		queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });

	return {
		...query,
		refreshDashboardStats,
	};
}
