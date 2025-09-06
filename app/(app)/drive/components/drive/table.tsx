"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
	ChevronRight,
	Download,
	File,
	Folder,
	Home,
	Loader2,
	MoreHorizontal,
	Share2,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useDriveData } from "@/hooks/use-drive-data";
import { getFolderPath } from "@/lib/actions/breadcrumb";
import type { DriveEntry } from "@/lib/types/type";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table as DataTable,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const getEntryIcon = (entry: DriveEntry) =>
	entry.type === "folder" ? (
		<Folder className="mr-2 h-4 w-4" />
	) : (
		<File className="mr-2 h-4 w-4" />
	);

export default function Table() {
	const router = useRouter();
	const { path } = useParams();
	const folderId = path ? (path as string[])[1] : null;

	const {
		data = [],
		isLoading,
		deleteFolder,
		deleteFile,
		isDeletingFolder,
		isDeletingFile,
	} = useDriveData(folderId);

	const [breadcrumbs, setBreadcrumbs] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false);

	useEffect(() => {
		const fetchBreadcrumbs = async () => {
			if (!folderId) {
				setBreadcrumbs([]);
				return;
			}
			setBreadcrumbsLoading(true);
			try {
				const path = await getFolderPath(folderId);
				setBreadcrumbs(path);
			} catch (error) {
				console.error("Error fetching breadcrumbs:", error);
			} finally {
				setBreadcrumbsLoading(false);
			}
		};
		fetchBreadcrumbs();
	}, [folderId]);

	const handleEntryClick = (entry: DriveEntry) => {
		if (entry.type === "folder") {
			router.push(`/drive/folders/${entry.id}`);
		} else {
			// open or preview file here if you add that flow
			console.log(entry);
		}
	};

	const handleDelete = async (entry: DriveEntry) => {
		if (!confirm(`Are you sure you want to delete "${entry.name}"?`)) return;
		try {
			if (entry.type === "folder") {
				await deleteFolder(entry.id);
			} else {
				await deleteFile(entry.id);
			}
		} catch (error) {
			console.error(`Error deleting ${entry.type}:`, error);
		}
	};

	const handleDownload = async (entry: DriveEntry) => {
		try {
			if (entry.type === "folder") {
				const response = await fetch(`/api/folders/${entry.id}/download`);
				if (!response.ok) {
					const errorData = await response
						.json()
						.catch(() => ({ error: "Download failed" }));
					throw new Error(errorData.error || "Failed to download folder");
				}
				const contentDisposition = response.headers.get("Content-Disposition");
				let filename = `${entry.name}.zip`;
				if (contentDisposition) {
					const match = contentDisposition.match(/filename="(.+)"/i);
					if (match?.[1]) filename = match[1];
				}
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.style.display = "none";
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success(`Downloaded ${entry.name}`);
			} else {
				if ("url" in entry && entry.url) {
					const a = document.createElement("a");
					a.style.display = "none";
					a.href = entry.url;
					a.target = "_blank";
					a.rel = "noopener noreferrer";
					a.download = entry.name;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					toast.success(`Downloaded ${entry.name}`);
				} else {
					toast.error("File URL not available");
				}
			}
		} catch (error) {
			toast.error(
				`Failed to download: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/drive" className="flex items-center">
									<Home className="mr-1 h-4 w-4" />
									Home
								</BreadcrumbLink>
							</BreadcrumbItem>

							{breadcrumbsLoading ? (
								<BreadcrumbItem>
									<Skeleton className="h-4 w-24" />
								</BreadcrumbItem>
							) : (
								breadcrumbs.map((item, index) => (
									<React.Fragment key={item.id}>
										<BreadcrumbSeparator>
											<ChevronRight className="h-4 w-4" />
										</BreadcrumbSeparator>
										<BreadcrumbItem>
											{index === breadcrumbs.length - 1 ? (
												<BreadcrumbPage className="font-bold">
													{item.name}
												</BreadcrumbPage>
											) : (
												<BreadcrumbLink href={`/drive/folders/${item.id}`}>
													{item.name}
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
									</React.Fragment>
								))
							)}
						</BreadcrumbList>
					</Breadcrumb>
				</CardTitle>

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
											className="flex cursor-pointer items-center hover:underline"
											onClick={() => handleEntryClick(entry)}
										>
											{getEntryIcon(entry)}
											<span>{entry.name}</span>
										</div>
									</TableCell>
									<TableCell>
										{entry.type !== "folder" && entry.size
											? `${Math.round(entry.size / 1024)} KB`
											: ""}
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
												<DropdownMenuItem
													disabled={!Boolean(entry.url)}
													onClick={() => handleDownload(entry)}
												>
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
														(entry.type === "folder" && isDeletingFolder) ||
														(entry.type !== "folder" && isDeletingFile)
													}
												>
													{(entry.type === "folder" && isDeletingFolder) ||
													(entry.type !== "folder" && isDeletingFile) ? (
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
}
