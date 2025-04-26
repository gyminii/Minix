"use client";

// Create a new hook that combines React Query with Supabase realtime
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DriveEntry } from "@/lib/types/type";
import { toast } from "sonner";

export function useDriveData(folderId: string | null) {
	const queryClient = useQueryClient();
	const supabase = createClient();

	// Use React Query for data fetching
	const query = useQuery<DriveEntry[]>({
		queryKey: ["drive", folderId],
		queryFn: async () => {
			const response = await fetch(`/api/drive?folderId=${folderId || ""}`);
			if (!response.ok) {
				throw new Error("Failed to fetch drive data");
			}
			return response.json();
		},
		staleTime: 1000 * 60, // 1 minute
	});

	// Set up Supabase realtime subscriptions
	useEffect(() => {
		console.log(
			"Setting up Supabase realtime subscriptions for folder:",
			folderId
		);

		// Create a channel for real-time updates
		const channel = supabase
			.channel("drive-changes")
			// Handle folder insertions
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "folders",
					filter:
						folderId === null
							? "parent_id=is.null"
							: `parent_id=eq.${folderId}`,
				},
				(payload) => {
					console.log("New folder created:", payload.new);
					// Invalidate the query to refetch data
					queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
					toast.success(`Folder "${payload.new.name}" created`);
				}
			)
			// Handle file insertions - REMOVE THE FILTER to catch all file changes
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "files",
				},
				(payload) => {
					console.log("File insert detected:", payload);

					// Check if this file belongs in the current view
					const newFile = payload.new as any;
					const fileFolder = newFile.folder_id;

					// Log more details for debugging
					console.log(
						`File inserted: ${newFile.name}, folder_id: ${fileFolder}, current folder: ${folderId}`
					);

					// Always invalidate queries to ensure we catch all changes
					queryClient.invalidateQueries({
						queryKey: ["drive", folderId],
						exact: false, // This will invalidate all drive queries
					});

					// Also invalidate dashboard stats
					queryClient.invalidateQueries({
						queryKey: ["dashboard-stats"],
						exact: false,
					});

					// Force an immediate refetch
					queryClient.refetchQueries({ queryKey: ["drive", folderId] });

					// Only show toast if it belongs to current folder
					if (
						(folderId === null && fileFolder === null) ||
						(folderId && fileFolder === folderId)
					) {
						toast.success(`File "${newFile.name}" uploaded`);
					}
				}
			)
			// Handle folder deletions
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "folders",
				},
				(payload) => {
					console.log("Folder deleted:", payload.old);
					// Invalidate the query to refetch data
					queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
					toast.info(`Folder deleted`);
				}
			)
			// Handle file deletions
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "files",
				},
				(payload) => {
					console.log("File deleted:", payload.old);
					// Invalidate the query to refetch data
					queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
					toast.info(`File deleted`);
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

			return data.folder;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
		},
		onError: (error) => {
			console.error("Error deleting folder:", error);
			toast.error(`Failed to delete folder: ${(error as Error).message}`);
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drive", folderId] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
		},
		onError: (error) => {
			console.error("Error deleting file:", error);
			toast.error(`Failed to delete file: ${(error as Error).message}`);
		},
	});

	// Upload files mutation (merged from useUploadFiles)
	const uploadFilesMutation = useMutation({
		mutationFn: async ({
			files,
			folderId: targetFolderId,
		}: {
			files: File[];
			folderId?: string | null;
		}) => {
			const formData = new FormData();

			// Log the files we're about to upload
			console.log("Files to upload:", files);

			// Append each file to the FormData
			files.forEach((file: File) => {
				formData.append("files", file);
			});

			// Add folder ID if provided (use the targetFolderId if specified, otherwise use the current folderId)
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
				console.error("Upload failed:", result);
				throw new Error(result.error || "Upload failed");
			}

			console.log("Upload success:", result);
			return result;
		},
		onSuccess: (_, variables) => {
			console.log(
				"Upload successful, invalidating queries for folder:",
				variables.folderId || folderId
			);

			// Force a refetch by invalidating the query
			queryClient.invalidateQueries({
				queryKey: ["drive", variables.folderId || folderId],
				refetchType: "active",
			});

			// Also invalidate dashboard stats
			queryClient.invalidateQueries({
				queryKey: ["dashboard-stats"],
				refetchType: "active",
			});

			// Manually refetch the current drive data to ensure it updates
			queryClient.refetchQueries({
				queryKey: ["drive", variables.folderId || folderId],
			});
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
		return uploadFilesMutation.mutateAsync({ files, folderId: targetFolderId });
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
