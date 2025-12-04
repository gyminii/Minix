"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Progress } from "@/components/ui/progress";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export function StorageStatusCard() {
	const { data, isLoading } = useDashboardStats();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
					<CardAction>
						<Skeleton className="h-8 w-8 rounded-full" />
					</CardAction>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="h-2 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const storageInfo = data?.storageInfo || { used: 0, total: 0, percentage: 0 };

	return (
		<motion.div initial="hidden" animate="show" layout>
			<Card>
				<CardHeader>
					<CardTitle>Storage Space Used</CardTitle>
					<CardAction>
						<Button size="icon" variant="outline">
							<ChevronRight />
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="text-muted-foreground flex justify-between text-sm">
							<span>{storageInfo.used.toFixed(1)} GB used</span>
							<span>{storageInfo.total} GB total</span>
						</div>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: "100%" }}
							transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
						>
							<Progress value={storageInfo.percentage} className="w-full" />
						</motion.div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
