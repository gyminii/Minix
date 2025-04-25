"use client";
import { format } from "date-fns";
import {
	Download,
	File,
	Folder,
	MoreHorizontal,
	Share2,
	Trash2,
	Loader2,
} from "lucide-react";

import { FileUploadDialog } from "@/app/components";
import CreateFolderDialog from "@/components/dialogs/create-folder-dialog";
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
	Table as DataTable,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDriveStore } from "@/lib/store/drive-store";
import type { DriveEntry } from "@/lib/types/type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const getEntryIcon = (entry: DriveEntry) => {
	if (entry.type === "folder") {
		return <Folder className="h-4 w-4 mr-2" />;
	}
	return <File className="h-4 w-4 mr-2" />;
};

const Table = () => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { path } = useParams();
	const folderId = path ? path[1] : null;
	const { data, deleteFile, deleteFolder } = useDriveStore();
	const [isLoading, setIsLoading] = useState(true);

	// Set loading state to false after a short delay to simulate data fetching
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 800); // Simulate loading for 800ms

		return () => clearTimeout(timer);
	}, [data]);

	// Reset loading state when folder ID changes
	useEffect(() => {
		setIsLoading(true);
	}, [folderId]);

	// Set up delete folder mutation
	const deleteFolderMutation = useMutation({
		mutationFn: async (id: string) => {
			return await deleteFolder(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
		},
	});

	// Set up delete file mutation
	const deleteFileMutation = useMutation({
		mutationFn: async (id: string) => {
			return await deleteFile(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
		},
	});

	const handleEntryClick = (entry: DriveEntry) => {
		if (entry.type === "folder") {
			router.push(`/drive/folders/${entry.id}`);
		} else {
			// Handle file click - perhaps open a preview
			console.log("File clicked:", entry);
		}
	};

	const handleDelete = async (entry: DriveEntry) => {
		if (!confirm(`Are you sure you want to delete "${entry.name}"?`)) {
			return;
		}

		try {
			if (entry.type === "folder") {
				await deleteFolderMutation.mutateAsync(entry.id);
			} else {
				await deleteFileMutation.mutateAsync(entry.id);
			}
		} catch (error) {
			console.error(`Error deleting ${entry.type}:`, error);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Drive</CardTitle>
				<CardAction>
					<div className="flex gap-x-2">
						<FileUploadDialog />
						<CreateFolderDialog />
					</div>
				</CardAction>
			</CardHeader>
			<CardContent>
				<DataTable>
					<TableHeader>
						<TableRow>
							<TableHead className="lg:w-[300px]">Name</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Upload Date</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24">
									<div className="flex items-center justify-center">
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.3 }}
											className="flex flex-col items-center gap-2"
										>
											<Loader2 className="h-8 w-8 animate-spin text-primary" />
											<p className="text-sm text-muted-foreground">
												Loading files and folders...
											</p>
										</motion.div>
									</div>
								</TableCell>
							</TableRow>
						) : data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.3 }}
									>
										No files or folders found
									</motion.div>
								</TableCell>
							</TableRow>
						) : (
							data.map((entry, index) => (
								<motion.tr
									key={entry.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2, delay: index * 0.05 }}
									className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								>
									<TableCell className="font-medium">
										<div
											className="flex items-center cursor-pointer hover:underline"
											onClick={() => handleEntryClick(entry)}
										>
											{getEntryIcon(entry)}
											<span>{entry.name}</span>
										</div>
									</TableCell>
									<TableCell>
										{entry?.size && `${Math.round(entry.size / 1024)} KB`}
									</TableCell>
									<TableCell>
										{format(new Date(entry.created_at), "MMM d, yyyy")}
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
												<DropdownMenuItem>
													<Download className="mr-2 h-4 w-4" />
													<span>Download</span>
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Share2 className="mr-2 h-4 w-4" />
													<span>Share</span>
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => handleDelete(entry)}
													disabled={
														(entry.type === "folder" &&
															deleteFolderMutation.isPending) ||
														(entry.type !== "folder" &&
															deleteFileMutation.isPending)
													}
												>
													{(entry.type === "folder" &&
														deleteFolderMutation.isPending) ||
													(entry.type !== "folder" &&
														deleteFileMutation.isPending) ? (
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
						)}
					</TableBody>
				</DataTable>
			</CardContent>
		</Card>
	);
};

export default Table;
