"use client";
import { FileText, Video, File, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import CountAnimation from "@/components/ui/custom/count-animation";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const cardVariants = {
	hidden: { opacity: 0, scale: 0.95, y: 20 },
	show: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 20,
		},
	},
};

export function SummaryCards() {
	const { data, isLoading, error } = useDashboardStats();

	if (isLoading) {
		return <SummaryCardsSkeleton />;
	}

	if (error || !data) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<p className="text-muted-foreground">
							Error loading dashboard data
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<motion.div
			className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
			variants={containerVariants}
			initial="hidden"
			animate="show"
		>
			{/* Documents Card */}
			<motion.div variants={cardVariants} layout>
				<Card>
					<CardHeader>
						<CardTitle>Documents</CardTitle>
						<CardAction>
							<span className="text-blue-500">
								<FileText className="size-6" />
							</span>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-2xl font-semibold lg:text-3xl">
							<CountAnimation number={data.stats.documents.count} />
						</div>
						{/* <div className="space-y-2">
							<div className="text-muted-foreground text-sm">
								{data.stats.documents.sizeGB} GB used
							</div>
							<Progress value={data.stats.documents.percentage} />
							<div className="text-muted-foreground text-sm">
								{data.stats.documents.percentage}% of storage used
							</div>
						</div> */}
					</CardContent>
				</Card>
			</motion.div>

			{/* Images Card */}
			<motion.div variants={cardVariants} layout>
				<Card>
					<CardHeader>
						<CardTitle>Images</CardTitle>
						<CardAction>
							<span className="text-green-500">
								<ImageIcon className="size-6" />
							</span>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-2xl font-semibold lg:text-3xl">
							<CountAnimation number={data.stats.images.count} />
						</div>
						{/* <div className="space-y-2">
							<div className="text-muted-foreground text-sm">
								{data.stats.images.sizeGB} GB used
							</div>
							<Progress value={data.stats.images.percentage} />
							<div className="text-muted-foreground text-sm">
								{data.stats.images.percentage}% of storage used
							</div>
						</div> */}
					</CardContent>
				</Card>
			</motion.div>

			{/* Videos Card */}
			<motion.div variants={cardVariants} layout>
				<Card>
					<CardHeader>
						<CardTitle>Videos</CardTitle>
						<CardAction>
							<span className="text-red-500">
								<Video className="size-6" />
							</span>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-2xl font-semibold lg:text-3xl">
							<CountAnimation number={data.stats.videos.count} />
						</div>
						{/* <div className="space-y-2">
							<div className="text-muted-foreground text-sm">
								{data.stats.videos.sizeGB} GB used
							</div>
							<Progress value={data.stats.videos.percentage} />
							<div className="text-muted-foreground text-sm">
								{data.stats.videos.percentage}% of storage used
							</div>
						</div> */}
					</CardContent>
				</Card>
			</motion.div>

			{/* Others Card */}
			<motion.div variants={cardVariants} layout>
				<Card>
					<CardHeader>
						<CardTitle>Others</CardTitle>
						<CardAction>
							<span className="text-yellow-500">
								<File className="size-6" />
							</span>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-2xl font-semibold lg:text-3xl">
							<CountAnimation number={data.stats.others.count} />
						</div>
						{/* <div className="space-y-2">
							<div className="text-muted-foreground text-sm">
								{data.stats.others.sizeGB} GB used
							</div>
							<Progress value={data.stats.others.percentage} />
							<div className="text-muted-foreground text-sm">
								{data.stats.others.percentage}% of storage used
							</div>
						</div> */}
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	);
}

function SummaryCardsSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array(4)
				.fill(0)
				.map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-24" />
							<CardAction>
								<Skeleton className="h-6 w-6 rounded-full" />
							</CardAction>
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-8 w-16" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-2 w-full" />
								<Skeleton className="h-4 w-32" />
							</div>
						</CardContent>
					</Card>
				))}
		</div>
	);
}
