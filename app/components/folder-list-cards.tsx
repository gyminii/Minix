"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StarFilledIcon } from "@radix-ui/react-icons";
import {
	Download,
	Folder,
	MoreVertical,
	Share2,
	Star,
	Trash2,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export function FolderListCards() {
	const { data, isLoading, error } = useDashboardStats();
	const router = useRouter();

	if (isLoading) {
		return <FolderListCardsSkeleton />;
	}

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">Error loading folders</p>
				</CardContent>
			</Card>
		);
	}

	const folders = data?.folderStats || [];

	if (folders.length === 0) {
		return (
			<Card>
				<CardContent className="p-6">
					<p className="text-muted-foreground">No folders found</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-3">
			{folders.map((folder) => (
				<Card key={folder.id} className="hover:bg-muted transition-colors">
					<CardHeader>
						<CardTitle className="flex gap-2">
							<Folder className="size-4 text-yellow-600" />
							<h3 className="leading-none font-semibold tracking-tight">
								{folder.name}
							</h3>
						</CardTitle>
						<CardAction>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreVertical className="size-4" />
										<span className="sr-only">More options</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => router.push(`/drive/folders/${folder.id}`)}
									>
										<Folder className="mr-2 h-4 w-4" />
										<span>Open</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Download className="mr-2 h-4 w-4" />
										<span>Download</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Share2 className="mr-2 h-4 w-4" />
										<span>Share</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Trash2 className="mr-2 h-4 w-4" />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CardAction>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="bg-muted rounded-md border px-4 py-2 text-sm">
							{folder.items} items
						</div>
						<div className="flex items-center justify-between">
							<div className="text-muted-foreground text-xs">
								Last update: {folder.lastUpdate}
							</div>
							<Button variant="ghost" size="icon">
								{folder.starred ? (
									<StarFilledIcon className="size-4 text-orange-400" />
								) : (
									<Star className="text-muted-foreground size-4" />
								)}
								<span className="sr-only">
									{folder.starred ? "Unstar" : "Star"} folder
								</span>
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function FolderListCardsSkeleton() {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{Array(3)
				.fill(0)
				.map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-24" />
							<CardAction>
								<Skeleton className="h-8 w-8 rounded-full" />
							</CardAction>
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-8 w-full" />
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-8 w-8 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
		</div>
	);
}
