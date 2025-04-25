"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { DriveEntry, Folder, File } from "@/lib/types/type";
import { toast } from "sonner";

// Extended types for database operations
interface FileWithFolderId extends File {
	folder_id: string | null;
}

interface FolderWithParentId extends Folder {
	parent_id: string | null;
}

interface DriveState {
	data: DriveEntry[];
	isLoading: boolean;
	currentFolderId: string | null;

	// Actions
	setData: (data: DriveEntry[]) => void;
	setCurrentFolder: (folderId: string | null) => void;

	// CRUD operations
	createFolder: (
		name: string,
		parentId: string | null
	) => Promise<Folder | null>;
	deleteFolder: (folderId: string) => Promise<boolean>;
	deleteFile: (fileId: string) => Promise<boolean>;
	uploadFiles: (
		files: globalThis.File[],
		folderId: string | null
	) => Promise<{
		success: { name: string; url: string }[];
		failed: { name: string; error: string }[];
	}>;

	// Subscription
	setupSubscriptions: () => void;
	cleanup: () => void;
}

const supabase = createClient();

export const useDriveStore = create<DriveState>((set, get) => ({
	data: [],
	isLoading: false,
	currentFolderId: null,

	setData: (data) => {
		const currentData = get().data;
		if (JSON.stringify(currentData) !== JSON.stringify(data)) {
			set({ data });
		}
	},
	setCurrentFolder: (folderId) => {
		// Check if folder is different before updating
		if (get().currentFolderId !== folderId) {
			set({ currentFolderId: folderId });
		}
	},

	createFolder: async (name, parentId) => {
		try {
			const response = await fetch("/api/folders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, parent_id: parentId }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to create folder");
			}

			// No need to manually update state as the subscription will handle it
			return data.folder;
		} catch (error) {
			console.error("Error creating folder:", error);
			toast.error(`Failed to create folder: ${(error as Error).message}`);
			return null;
		}
	},

	deleteFolder: async (folderId) => {
		try {
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

			// No need to manually update state as the subscription will handle it
			return true;
		} catch (error) {
			console.error("Error deleting folder:", error);
			toast.error(`Failed to delete folder: ${(error as Error).message}`);
			return false;
		}
	},
	deleteFile: async (fileId) => {
		try {
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

			// No need to manually update state as the subscription will handle it
			return true;
		} catch (error) {
			console.error("Error deleting file:", error);
			toast.error(`Failed to delete file: ${(error as Error).message}`);
			return false;
		}
	},

	uploadFiles: async (files, folderId) => {
		try {
			const formData = new FormData();

			files.forEach((file) => {
				formData.append("files", file);
			});

			if (folderId) {
				formData.append("folder_id", folderId);
			}

			const response = await fetch("/api/files", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to upload files");
			}

			// No need to manually update state as the subscription will handle it
			return {
				success: data.success || [],
				failed: data.failed || [],
			};
		} catch (error) {
			console.error("Error uploading files:", error);
			toast.error(`Failed to upload files: ${(error as Error).message}`);
			return { success: [], failed: [] };
		}
	},

	setupSubscriptions: () => {
		const { currentFolderId } = get();

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
						currentFolderId === null
							? "parent_id=is.null"
							: `parent_id=eq.${currentFolderId}`,
				},
				(payload) => {
					console.log("New folder created:", payload.new);
					const newFolder = payload.new as FolderWithParentId;

					// Only add to current view if it belongs in the current folder
					if (
						(currentFolderId === null && newFolder.parent_id === null) ||
						(currentFolderId && newFolder.parent_id === currentFolderId)
					) {
						const folderEntry: Folder = {
							id: newFolder.id,
							name: newFolder.name,
							created_at: newFolder.created_at,
							type: "folder",
						};

						set((state) => ({
							data: [...state.data, folderEntry],
						}));

						toast.success(`Folder "${newFolder.name}" created`);
					}
				}
			)
			// Handle file insertions
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "files",
					filter:
						currentFolderId === null
							? "folder_id=is.null"
							: `folder_id=eq.${currentFolderId}`,
				},
				(payload) => {
					console.log("File insert detected:", payload);
					// Use extended type that includes folder_id
					const newFile = payload.new as FileWithFolderId;

					// Only add to current view if it belongs in the current folder
					if (
						(currentFolderId === null && newFile.folder_id === null) ||
						(currentFolderId && newFile.folder_id === currentFolderId)
					) {
						const fileEntry: File = {
							id: newFile.id,
							name: newFile.name,
							created_at: newFile.created_at,
							size: newFile.size,
							type: newFile.type || "application/octet-stream", // Default MIME type if not provided
						};

						set((state) => ({
							data: [...state.data, fileEntry],
						}));

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

					set((state) => ({
						data: state.data.filter(
							(entry) =>
								!(
									entry.type === "folder" &&
									entry.id === (payload.old as Folder).id
								)
						),
					}));

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

					set((state) => ({
						data: state.data.filter(
							(entry) =>
								!(
									entry.type !== "folder" &&
									entry.id === (payload.old as File).id
								)
						),
					}));

					toast.info(`File deleted`);
				}
			)
			.subscribe((status) => {
				console.log("Subscription status:", status);

				// Handle subscription errors
				if (status === "CHANNEL_ERROR") {
					console.error("Supabase real-time subscription error");
					toast.error(
						"Real-time updates unavailable. Please refresh the page manually."
					);
				} else if (status === "SUBSCRIBED") {
					console.log("Successfully subscribed to real-time updates");
				}
			});

		// Store the channel in window for cleanup
		interface WindowWithChannel extends Window {
			__driveChannel?: ReturnType<typeof supabase.channel>;
		}
		(window as WindowWithChannel).__driveChannel = channel;
	},

	cleanup: () => {
		// Clean up subscription
		interface WindowWithChannel extends Window {
			__driveChannel?: ReturnType<typeof supabase.channel>;
		}
		const typedWindow = window as WindowWithChannel;
		if (typedWindow.__driveChannel) {
			console.log("Cleaning up Supabase channel subscription");
			supabase.removeChannel(typedWindow.__driveChannel);
			typedWindow.__driveChannel = undefined;
		}
	},
}));
