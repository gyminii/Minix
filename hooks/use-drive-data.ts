"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DriveEntry, Folder } from "@/lib/types/type";
import { toast } from "sonner";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Define types for Supabase realtime payloads
type FolderPayload = {
	id: string;
	name: string;
	created_at: string;
	parent_id: string | null;
	user_id: string;
};

type FilePayload = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string;
	folder_id: string | null;
	user_id: string;
	path?: string;
	url?: string;
};

export function useDriveData(folderId: string | null) {
	const queryClient = useQueryClient();
	const supabase = createClient();

	// Main query for drive data
	const query = useQuery<DriveEntry[]>({
		queryKey: ["drive", folderId],
		queryFn: async () => {
			const response = await fetch(`/api/drive?folderId=${folderId || ""}`);
			if (!response.ok) {
				throw new Error("Failed to fetch drive data");
			}
			return response.json();
		},
		staleTime: 10 * (60 * 1000),
	});

	// Set up Supabase realtime subscriptions - this is still needed to trigger React Query refetches
	useEffect(() => {
		console.log(
			"Setting up Supabase realtime subscriptions for folder:",
			folderId
		);

		// Create a channel for real-time updates
		const channel = supabase
			.channel("drive-changes")
			// Handle folder changes (INSERT, UPDATE, DELETE)
			.on(
				"postgres_changes",
				{
					event: "*", // Listen to all events
					schema: "public",
					table: "folders",
				},
				(payload: RealtimePostgresChangesPayload<FolderPayload>) => {
					console.log("Folder change detected:", payload);

					// Invalidate queries to ensure data is fresh
					queryClient.invalidateQueries({ queryKey: ["drive"] });
					queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

					// Show appropriate toast based on the event
					if (payload.eventType === "INSERT" && payload.new) {
						toast.success(`Folder "${payload.new.name}" created`);
					} else if (payload.eventType === "DELETE") {
						toast.info("Folder deleted");
					} else if (payload.eventType === "UPDATE" && payload.new) {
						toast.info(`Folder "${payload.new.name}" updated`);
					}
				}
			)
			// Handle file changes (INSERT, UPDATE, DELETE)
			.on(
				"postgres_changes",
				{
					event: "*", // Listen to all events
					schema: "public",
					table: "files",
				},
				(payload: RealtimePostgresChangesPayload<FilePayload>) => {
					console.log("File change detected:", payload);

					// Invalidate queries to ensure data is fresh
					queryClient.invalidateQueries({ queryKey: ["drive"] });
					queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
					queryClient.invalidateQueries({ queryKey: ["recent-files"] });

					// Show appropriate toast based on the event
					if (payload.eventType === "INSERT" && payload.new) {
						toast.success(`File "${payload.new.name}" uploaded`);
					} else if (payload.eventType === "DELETE") {
						toast.info("File deleted");
					} else if (payload.eventType === "UPDATE" && payload.new) {
						toast.info(`File "${payload.new.name}" updated`);
					}
				}
			)
			.subscribe((status) => {
				console.log("Subscription status:", status);
				if (status === "CHANNEL_ERROR") {
					console.error("Supabase real-time subscription error");
					toast.error(
						"Real-time updates unavailable. Please refresh the page manually."
					);
				} else if (status === "SUBSCRIBED") {
					console.log("Successfully subscribed to real-time updates");
				}
			});

		// Cleanup function
		return () => {
			console.log("Cleaning up Supabase realtime subscription");
			supabase.removeChannel(channel);
		};
	}, [folderId, queryClient, supabase]);

	// Create folder mutation
	const createFolderMutation = useMutation({
		mutationFn: async (name: string) => {
			const response = await fetch("/api/folders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, parent_id: folderId }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to create folder");
			}

			return data.folder as Folder;
		},
		onSuccess: (newFolder) => {
			// Optimistically update the cache
			queryClient.setQueryData<DriveEntry[]>(["drive", folderId], (old) => {
				if (!old) return [newFolder];
				return [...old, { ...newFolder, type: "folder" }];
			});
		},
		onError: (error) => {
			console.error("Error creating folder:", error);
			toast.error(`Failed to create folder: ${(error as Error).message}`);
		},
	});

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

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to delete folder");
			}

			return true;
		},
		onMutate: async (deletedFolderId) => {
			// Optimistically update the cache
			queryClient.setQueryData<DriveEntry[]>(["drive", folderId], (old) => {
				if (!old) return [];
				return old.filter(
					(entry) => !(entry.type === "folder" && entry.id === deletedFolderId)
				);
			});
		},
		onError: (error) => {
			console.error("Error deleting folder:", error);
			toast.error(`Failed to delete folder: ${(error as Error).message}`);

			// Invalidate to refetch the correct data
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
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

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to delete file");
			}

			return true;
		},
		onMutate: async (deletedFileId) => {
			// Optimistically update the cache
			queryClient.setQueryData<DriveEntry[]>(["drive", folderId], (old) => {
				if (!old) return [];
				return old.filter(
					(entry) => !(entry.type !== "folder" && entry.id === deletedFileId)
				);
			});
		},
		onError: (error) => {
			console.error("Error deleting file:", error);
			toast.error(`Failed to delete file: ${(error as Error).message}`);

			// Invalidate to refetch the correct data
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
		},
	});

	// Upload files mutation
	const uploadFilesMutation = useMutation({
		mutationFn: async ({
			files,
			targetFolderId,
		}: {
			files: File[];
			targetFolderId?: string | null;
		}) => {
			const formData = new FormData();

			// Append each file to the FormData
			files.forEach((file: File) => {
				formData.append("files", file);
			});

			// Add folder ID if provided
			const folderIdToUse =
				targetFolderId !== undefined ? targetFolderId : folderId;
			if (folderIdToUse) formData.append("folder_id", folderIdToUse);

			// Send the request
			const res = await fetch("/api/files", {
				method: "POST",
				body: formData,
			});

			// Handle the response
			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.error || "Upload failed");
			}

			return result;
		},
		onError: (error) => {
			console.error("Upload error:", error);
			toast.error(`Upload failed: ${(error as Error).message}`);
		},
	});

	// Wrapper functions with simpler APIs
	const createFolder = async (name: string) => {
		return createFolderMutation.mutateAsync(name);
	};

	const deleteFolder = async (folderId: string) => {
		return deleteFolderMutation.mutateAsync(folderId);
	};

	const deleteFile = async (fileId: string) => {
		return deleteFileMutation.mutateAsync(fileId);
	};

	const uploadFiles = async (files: File[], targetFolderId?: string | null) => {
		return uploadFilesMutation.mutateAsync({ files, targetFolderId });
	};

	return {
		...query,
		createFolder,
		deleteFolder,
		deleteFile,
		uploadFiles,
		isUploading: uploadFilesMutation.isPending,
		isCreatingFolder: createFolderMutation.isPending,
		isDeletingFolder: deleteFolderMutation.isPending,
		isDeletingFile: deleteFileMutation.isPending,
	};
}
