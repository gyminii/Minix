"use client";
import Link from "next/link";
import {
	MoreHorizontal,
	File,
	FileText,
	Film,
	Music,
	Archive,
	Trash2,
	Download,
	Share2,
	ChevronRight,
	ImageIcon,
	Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Animation variants
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
			delay: 0.3, // Slight delay for this component
		},
	},
};

const tableRowVariants = {
	hidden: { opacity: 0, x: -20 },
	show: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: {
			delay: 0.5 + i * 0.1,
			duration: 0.5,
			ease: "easeOut",
		},
	}),
};

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return (
		Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
	);
}

function getFileIcon(type: string) {
	if (type.startsWith("image/")) {
		return <ImageIcon className="size-4" />;
	} else if (type.startsWith("video/")) {
		return <Film className="size-4" />;
	} else if (type.startsWith("audio/")) {
		return <Music className="size-4" />;
	} else if (
		type.includes("zip") ||
		type.includes("rar") ||
		type.includes("7z") ||
		type.includes("tar") ||
		type.includes("gzip")
	) {
		return <Archive className="size-4" />;
	} else if (
		type.includes("pdf") ||
		type.includes("doc") ||
		type.includes("xls") ||
		type.includes("ppt") ||
		type.includes("text") ||
		type.includes("markdown")
	) {
		return <FileText className="size-4" />;
	} else {
		return <File className="size-4" />;
	}
}

export function TableRecentFiles() {
	const queryClient = useQueryClient();

	// Fetch recent files
	const {
		data: files,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["recent-files"],
		queryFn: async () => {
			const response = await fetch("/api/files?limit=5");
			if (!response.ok) {
				throw new Error("Failed to fetch recent files");
			}
			return response.json();
		},
	});

	// Delete file mutation
	const deleteFileMutation = useMutation({
		mutationFn: async (fileId: string) => {
			const response = await fetch("/api/files", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ fileIds: [fileId] }),
			});

			if (!response.ok) {
				throw new Error("Failed to delete file");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["recent-files"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
		},
	});

	const handleDelete = async (fileId: string) => {
		if (!confirm("Are you sure you want to delete this file?")) {
			return;
		}

		try {
			await deleteFileMutation.mutateAsync(fileId);
		} catch (error) {
			console.error("Error deleting file:", error);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="relative">
					<CardTitle>Recently Uploaded Files</CardTitle>
					<CardAction className="relative">
						<div className="absolute end-0 top-0">
							<Button variant="outline">
								<span className="hidden lg:inline">View All</span>
								<ChevronRight />
							</Button>
						</div>
					</CardAction>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="lg:w-[300px]">Name</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Upload Date</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array(5)
								.fill(0)
								.map((_, index) => (
									<TableRow key={index}>
										<TableCell>
											<Skeleton className="h-5 w-40" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-16" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-24" />
										</TableCell>
										<TableCell className="text-right">
											<Skeleton className="h-8 w-8 rounded-full ml-auto" />
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recently Uploaded Files</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4 text-muted-foreground">
						Failed to load recent files
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<motion.div variants={cardVariants} initial="hidden" animate="show" layout>
			<Card>
				<CardHeader className="relative">
					<CardTitle>Recently Uploaded Files</CardTitle>
					<CardAction className="relative">
						<div className="absolute end-0 top-0">
							<Button variant="outline" asChild>
								<Link href="/drive">
									<span className="hidden lg:inline">View All</span>
									<ChevronRight />
								</Link>
							</Button>
						</div>
					</CardAction>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="lg:w-[300px]">Name</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Upload Date</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{files && files.length > 0 ? (
								files.map((file, index) => (
									<motion.tr
										key={file.id}
										custom={index}
										variants={tableRowVariants}
										initial="hidden"
										animate="show"
										className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
									>
										<TableCell className="font-medium">
											<Link
												href={file.url || "#"}
												target={file.url ? "_blank" : undefined}
												className="text-muted-foreground hover:text-primary flex items-center space-x-2 hover:underline"
											>
												{getFileIcon(file.type)}
												<span className="ml-2">{file.name}</span>
											</Link>
										</TableCell>
										<TableCell>{formatFileSize(file.size)}</TableCell>
										<TableCell>
											{format(new Date(file.created_at), "MMM d, yyyy")}
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost">
														<span className="sr-only">Open menu</span>
														<MoreHorizontal />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<a
															href={file.url}
															download
															target="_blank"
															rel="noopener noreferrer"
														>
															<Download className="mr-2 h-4 w-4" />
															<span>Download</span>
														</a>
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Share2 className="mr-2 h-4 w-4" />
														<span>Share</span>
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => handleDelete(file.id)}
														disabled={deleteFileMutation.isPending}
													>
														{deleteFileMutation.isPending ? (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														) : (
															<Trash2 className="mr-2 h-4 w-4" />
														)}
														<span>Delete</span>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</motion.tr>
								))
							) : (
								<TableRow>
									<TableCell colSpan={4} className="h-24 text-center">
										No files found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</motion.div>
	);
}
