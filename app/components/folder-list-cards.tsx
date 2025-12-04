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
import {
	Download,
	Folder,
	MoreVertical,
	Share2,
	Trash2,
	Loader2,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

import type { DashboardStats } from "@/lib/types/dashboard";

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export function FolderListCards() {
	const { data, isLoading, refreshDashboardStats } = useDashboardStats();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Delete folder mutation
	const deleteFolderMutation = useMutation({
		mutationFn: async (folderId: string) => {
			const response = await fetch("/api/folders", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ folderIds: [folderId] }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete folder");
			}

			return response.json();
		},
		onMutate: async (folderId) => {
			await queryClient.cancelQueries({ queryKey: ["dashboard-stats"] });

			const previousData = queryClient.getQueryData<DashboardStats>([
				"dashboard-stats",
			]);

			queryClient.setQueryData<DashboardStats>(["dashboard-stats"], (old) => {
				if (!old || !old.folderStats) return old;
				return {
					...old,
					folderStats: old.folderStats.filter(
						(folder) => folder.id !== folderId
					),
				};
			});

			return { previousData };
		},
		onSuccess: () => {
			toast.success("Folder deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
			queryClient.invalidateQueries({ queryKey: ["drive"] });
			refreshDashboardStats();
			setDeleteDialogOpen(false);
			setFolderToDelete(null);
		},
		onError: (error, _, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(["dashboard-stats"], context.previousData);
			}

			toast.error(
				`Error deleting folder: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		},
	});

	const handleDeleteFolder = async (folderId: string) => {
		setFolderToDelete(folderId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (folderToDelete) {
			try {
				await deleteFolderMutation.mutateAsync(folderToDelete);
			} catch (error) {
				console.error("Error deleting folder:", error);
			} finally {
				setDeleteDialogOpen(false);
				setFolderToDelete(null);
			}
		}
	};

	const handleCopyShareLink = (folderId: string, folderName: string) => {
		const shareableLink = `${window.location.origin}/drive/folders/${folderId}`;
		navigator.clipboard
			.writeText(shareableLink)
			.then(() => {
				toast.success(`Link for "${folderName}" copied to clipboard`);
			})
			.catch((err) => {
				console.error("Failed to copy link:", err);
				toast.error("Failed to copy link to clipboard");
			});
	};

	const handleDownloadFolder = (folderId: string, folderName: string) => {
		toast.info(`Preparing "${folderName}" for download...`);
		const downloadLink = document.createElement("a");
		downloadLink.href = `/api/folders/${folderId}/download`;
		downloadLink.download = `${folderName}.zip`;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		toast.success(`Download for "${folderName}" started`);
	};

	if (isLoading) {
		return <FolderListCardsSkeleton />;
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
		<>
			<motion.div
				className="grid gap-4 md:grid-cols-3"
				variants={containerVariants}
				initial="hidden"
				animate="show"
			>
				{folders.map((folder, index) => (
					<motion.div key={folder.id} custom={index} layout>
						<Card className="hover:bg-muted transition-colors">
							<CardHeader>
								<CardTitle className="flex gap-2">
									<Folder className="size-4 text-yellow-600" />
									<h3
										className="cursor-pointer hover:underline leading-none font-semibold tracking-tight"
										onClick={() => {
											router.push(`/drive/folders/${folder.id}`);
										}}
									>
										{/* {getEntryIcon(entry)} */}
										<span>{folder.name}</span>
									</h3>
									{/* <h3 className="leading-none font-semibold tracking-tight">
										{folder.name}
									</h3> */}
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
												onClick={() =>
													router.push(`/drive/folders/${folder.id}`)
												}
											>
												<Folder className="mr-2 h-4 w-4" />
												<span>Open</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													handleDownloadFolder(folder.id, folder.name)
												}
											>
												<Download className="mr-2 h-4 w-4" />
												<span>Download</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													handleCopyShareLink(folder.id, folder.name)
												}
											>
												<Share2 className="mr-2 h-4 w-4" />
												<span>Copy Share Link</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleDeleteFolder(folder.id)}
												disabled={deleteFolderMutation.isPending}
												className="text-destructive focus:text-destructive"
											>
												{deleteFolderMutation.isPending &&
												folderToDelete === folder.id ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="mr-2 h-4 w-4" />
												)}
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
									{/* <Button variant="ghost" size="icon">
										{folder.starred ? (
											<StarFilledIcon className="size-4 text-orange-400" />
										) : (
											<Star className="text-muted-foreground size-4" />
										)}
										<span className="sr-only">
											{folder.starred ? "Unstar" : "Star"} folder
										</span>
									</Button> */}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</motion.div>

			{/* Delete confirmation dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							folder and all its contents.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteFolderMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
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
