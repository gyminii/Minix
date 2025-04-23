"use client";
import { format } from "date-fns";
import {
	Download,
	File,
	Folder,
	MoreHorizontal,
	Share2,
	Trash2,
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
import { createClient } from "@/lib/supabase/client";
import { DriveEntry } from "@/lib/types/type";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
const getEntryIcon = (entry: DriveEntry) => {
	if (entry.type === "folder") {
		return <Folder className="h-4 w-4 mr-2" />;
	}
	return <File className="h-4 w-4 mr-2" />;
};
const Table = ({
	initialData = [],
	folderId,
}: {
	initialData: DriveEntry[];
	folderId?: string | null;
}) => {
	const [entries, setEntries] = useState<DriveEntry[]>(initialData);
	const supabase = createClient();
	const router = useRouter();
	// Set up real-time subscription
	useEffect(() => {
		// Create a channel for real-time updates
		const channel = supabase
			.channel("drive-changes")

			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "folders",
					filter: folderId ? `parent_id=eq.${folderId}` : "parent_id=is.null",
				},
				(payload) => {
					console.log("New folder created:", payload.new);
					// Add the new folder to state if it belongs in the current view
					const newFolder = payload.new as any;
					if (
						(folderId === null && newFolder.parent_id === null) ||
						(folderId && newFolder.parent_id === folderId)
					) {
						const folderEntry: DriveEntry = {
							id: newFolder.id,
							name: newFolder.name,
							created_at: newFolder.created_at,
							type: "folder",
						};

						setEntries((prev) => [...prev, folderEntry]);
						toast.success(`Folder "${newFolder.name}" created`);
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "files",
					// filter: folderId ? `folder_id=eq.${folderId}` : "folder_id=is.null",
				},
				(payload) => {
					console.log("New file uploaded:", payload.new);
					// Add the new file to state if it belongs in the current view
					const newFile = payload.new as any;
					if (
						(folderId === null && newFile.folder_id === null) ||
						(folderId && newFile.folder_id === folderId)
					) {
						const fileEntry: DriveEntry = {
							id: newFile.id,
							name: newFile.name,
							created_at: newFile.created_at,
							size: newFile.size,
							type: "file",
						};

						setEntries((prev) => [...prev, fileEntry]);
						toast.success(`File "${newFile.name}" uploaded`);
					}
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "folders" },
				(payload) => {
					console.log("Folder deleted:", payload.old);
					// Remove the folder from state
					setEntries((prev) =>
						prev.filter(
							(entry) =>
								!(
									entry.type === "folder" &&
									entry.id === (payload.old as any).id
								)
						)
					);
					toast.info(`Folder deleted`);
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "files" },
				(payload) => {
					console.log("File deleted:", payload.old);
					// Remove the file from state
					setEntries((prev) =>
						prev.filter(
							(entry) =>
								!(entry.type === "file" && entry.id === (payload.old as any).id)
						)
					);
					toast.info(`File deleted`);
				}
			)
			.subscribe((status) => {
				console.log("Subscription status:", status);
			});

		// Clean up subscription on unmount
		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, folderId]);

	const handleEntryClick = (entry: DriveEntry) => {
		if (entry.type === "folder") {
			router.push(`/drive/folders/${entry.id}`);
		} else {
			// Handle file click - perhaps open a preview
			console.log("File clicked:", entry);
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
						{entries.map((entry) => (
							<TableRow key={entry.id}>
								<TableCell className="font-medium">
									<div
										className="flex items-center cursor-pointer hover:underline"
										onClick={() => handleEntryClick(entry)}
									>
										{getEntryIcon(entry)}
										<span>{entry.name}</span>
									</div>
								</TableCell>
								{/* {entity?.size && (
									<TableCell>{formatFileSize(file.size)}</TableCell>
								)} */}
								<TableCell />

								<TableCell>{format(entry.created_at, "MMM d, yyyy")}</TableCell>
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
												<Download />
												<span>Download</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Share2 />
												<span>Share</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={async () => {
													// Show confirmation dialog
													console.log(entry);
													if (entry.type === "file") {
														if (
															!confirm(
																`Are you sure you want to delete "${entry.name}"?`
															)
														) {
															return;
														}

														try {
															// Call the delete API endpoint
															const response = await fetch("/api/files", {
																method: "DELETE",
																headers: {
																	"Content-Type": "application/json",
																},
																body: JSON.stringify({ fileIds: [entry.id] }),
															});

															const result = await response.json();

															if (!response.ok) {
																throw new Error(
																	result.error || "Failed to delete file"
																);
															}

															// Show success toast
															// toast({
															// 	title: "File deleted",
															// 	description: `"${entry.name}" has been deleted successfully.`,
															// });

															// Refresh the UI
															console.log("REFRESHING~~");
															router.refresh();
														} catch (error) {
															console.error("Error deleting file:", error);

															// Show error toast
															// toast({
															// 	title: "Error",
															// 	description: (error as Error).message,
															// 	variant: "destructive",
															// });
														}
													}
												}}
											>
												<Trash2 />
												<span>Delete</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</DataTable>
			</CardContent>
		</Card>
	);
};

export default Table;
