"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
// Import the dashboard types
import type { DashboardStats } from "@/lib/types/dashboard";

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
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

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
				() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
			)
			// Listen for folder changes
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "folders",
				},
				() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient, supabase]);

	// Add a function to manually refresh the data
	const refreshDashboardStats = () =>
		queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

	return {
		...query,
		refreshDashboardStats,
	};
}
