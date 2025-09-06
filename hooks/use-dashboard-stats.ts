"use client";

import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/lib/types/dashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// ────────────────────────────────────────────────────────────────
// Query key (export if you want to reuse elsewhere)
// ────────────────────────────────────────────────────────────────
export const DASHBOARD_STATS_KEY = ["dashboard-stats"] as const;

export function useDashboardStats() {
	const queryClient = useQueryClient();
	const supabase = createClient();

	// Core query with AbortSignal so fast navigations don't leak requests
	const query = useQuery<DashboardStats>({
		queryKey: DASHBOARD_STATS_KEY,
		queryFn: async ({ signal }) => {
			const res = await fetch("/api/dashboard", { signal });
			if (!res.ok) throw new Error("Failed to fetch dashboard stats");
			return res.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 30 * 60 * 1000, // keep cached for 30 minutes
	});

	// Single realtime subscription; invalidates on any files/folders change
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
				// Optional: handle CHANNEL_ERROR if you want to surface a toast
				if (status === "CHANNEL_ERROR") {
					// e.g., toast.error("Live stats unavailable. Refresh to update.");
				}
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient, supabase]);

	// Manual refresh helper (returns a Promise)
	const refreshDashboardStats = () =>
		queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });

	return {
		...query,
		refreshDashboardStats,
	};
}
