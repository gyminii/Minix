"use client";

import { useEffect } from "react";
import {
	useQuery,
	useQueryClient,
	useMutation,
	QueryKey,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DriveEntry, Folder } from "@/lib/types/type";
import { toast } from "sonner";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ────────────────────────────────────────────────────────────────
// Supabase realtime payload shapes (narrowed for our tables)
// ────────────────────────────────────────────────────────────────
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
	title?: string;
	created_at: string;
	size: number;
	type: string;
	folder_id: string | null;
	user_id: string;
	path?: string;
	url?: string;
};

// ────────────────────────────────────────────────────────────────
/** Query key helpers to prevent typos and enable prefix invalidation */
const DRIVE_KEY = (folderId: string | null) => ["drive", folderId] as const;
const DRIVE_PREFIX: QueryKey = ["drive"];
const DASHBOARD_STATS_KEY = ["dashboard-stats"] as const;
const RECENT_FILES_KEY = ["recent-files"] as const;
// ────────────────────────────────────────────────────────────────

export function useDriveData(folderId: string | null) {
	const queryClient = useQueryClient();
	const supabase = createClient();

	// Prefab invalidators
	const invalidateDrive = () =>
		queryClient.invalidateQueries({ queryKey: DRIVE_PREFIX, exact: false });

	const invalidateAll = () =>
		Promise.all([
			invalidateDrive(),
			queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY }),
			queryClient.invalidateQueries({ queryKey: RECENT_FILES_KEY }),
		]);

	// ────────────────────────────────────────────────────────────────
	// Data query (uses AbortSignal from RQ to avoid race conditions)
	// ────────────────────────────────────────────────────────────────
	const query = useQuery<DriveEntry[]>({
		queryKey: DRIVE_KEY(folderId),
		queryFn: async ({ signal }) => {
			const url = folderId ? `/api/drive?folderId=${folderId}` : "/api/drive";
			const res = await fetch(url, { signal });
			if (!res.ok) throw new Error("Failed to fetch drive data");
			return res.json();
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // optional: keep in cache for 30 minutes
	});

	// ────────────────────────────────────────────────────────────────
	// Realtime subscription (single subscription; not tied to folderId)
	// ────────────────────────────────────────────────────────────────
	useEffect(() => {
		const channel = supabase
			.channel("drive-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "folders" },
				(payload: RealtimePostgresChangesPayload<FolderPayload>) => {
					void invalidateAll();
					if (payload.eventType === "INSERT" && payload.new) {
						toast.success(`Folder "${payload.new.name}" created`);
					} else if (payload.eventType === "DELETE") {
						toast.info("Folder deleted");
					} else if (payload.eventType === "UPDATE" && payload.new) {
						toast.info(`Folder "${payload.new.name}" updated`);
					}
				}
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "files" },
				(payload: RealtimePostgresChangesPayload<FilePayload>) => {
					void invalidateAll();
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
				if (status === "CHANNEL_ERROR") {
					// keep UX-friendly messaging
					toast.error(
						"Real-time updates unavailable. Please refresh the page manually."
					);
				}
			});

		return () => {
			supabase.removeChannel(channel);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryClient]); // avoid resubscribing when folderId changes

	// ────────────────────────────────────────────────────────────────
	// Mutations
	// ────────────────────────────────────────────────────────────────

	// Create folder
	const createFolderMutation = useMutation({
		mutationFn: async (name: string) => {
			const res = await fetch("/api/folders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, parent_id: folderId }),
			});
			const data: { error?: string; folder?: Folder } = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create folder");
			return data.folder as Folder;
		},
		onSuccess: (newFolder) => {
			// Immediate optimistic-feel update; realtime will also reconcile
			queryClient.setQueryData<DriveEntry[]>(DRIVE_KEY(folderId), (old) => [
				...(old ?? []),
				{ ...(newFolder as Folder), type: "folder" } as DriveEntry,
			]);
			// keep other consumers fresh
			void invalidateDrive();
		},
		onError: (err) => {
			toast.error(`Failed to create folder: ${(err as Error).message}`);
		},
	});

	// Delete folder (with rollback)
	const deleteFolderMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch("/api/folders", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ folderIds: [id] }),
			});
			const data: { error?: string } = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to delete folder");
			return true;
		},
		onMutate: async (deletedId) => {
			const key = DRIVE_KEY(folderId);
			await queryClient.cancelQueries({ queryKey: key });
			const prev = queryClient.getQueryData<DriveEntry[]>(key);
			queryClient.setQueryData<DriveEntry[]>(key, (old) =>
				(old ?? []).filter((e) => !(e.type === "folder" && e.id === deletedId))
			);
			return { prev, key };
		},
		onError: (err, _vars, ctx) => {
			if (ctx?.prev) queryClient.setQueryData(ctx.key!, ctx.prev);
			toast.error(`Failed to delete folder: ${(err as Error).message}`);
		},
		onSettled: () => {
			void invalidateDrive();
		},
	});

	// Delete file (with rollback)
	const deleteFileMutation = useMutation({
		mutationFn: async (fileId: string) => {
			const res = await fetch("/api/files", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fileIds: [fileId] }),
			});
			const data: { error?: string } = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to delete file");
			return true;
		},
		onMutate: async (deletedId) => {
			const key = DRIVE_KEY(folderId);
			await queryClient.cancelQueries({ queryKey: key });
			const prev = queryClient.getQueryData<DriveEntry[]>(key);
			queryClient.setQueryData<DriveEntry[]>(key, (old) =>
				(old ?? []).filter((e) => !(e.type !== "folder" && e.id === deletedId))
			);
			return { prev, key };
		},
		onError: (err, _vars, ctx) => {
			if (ctx?.prev) queryClient.setQueryData(ctx.key!, ctx.prev);
			toast.error(`Failed to delete file: ${(err as Error).message}`);
		},
		onSettled: () => {
			void invalidateDrive();
		},
	});

	// Upload files (appends to cache if API returns created files)
	const uploadFilesMutation = useMutation({
		mutationFn: async ({
			files,
			targetFolderId,
		}: {
			files: File[];
			targetFolderId?: string | null;
		}) => {
			const formData = new FormData();
			files.forEach((file) => formData.append("files", file));

			const folderIdToUse =
				targetFolderId !== undefined ? targetFolderId : folderId;
			if (folderIdToUse) formData.append("folder_id", folderIdToUse);

			const res = await fetch("/api/files", { method: "POST", body: formData });
			const result: { error?: string; files?: DriveEntry[] } = await res.json();
			if (!res.ok) throw new Error(result.error || "Upload failed");
			return result;
		},
		onSuccess: (result) => {
			if (Array.isArray(result.files) && result.files.length) {
				queryClient.setQueryData<DriveEntry[]>(
					DRIVE_KEY(folderId),
					(old = []) => [...old, ...result.files!]
				);
			}
			void invalidateDrive();
			void queryClient.invalidateQueries({ queryKey: RECENT_FILES_KEY });
		},
		onError: (err) => {
			toast.error(`Upload failed: ${(err as Error).message}`);
		},
	});

	// ────────────────────────────────────────────────────────────────
	// Friendly wrappers
	// ────────────────────────────────────────────────────────────────
	const createFolder = (name: string) => createFolderMutation.mutateAsync(name);
	const deleteFolder = (id: string) => deleteFolderMutation.mutateAsync(id);
	const deleteFile = (id: string) => deleteFileMutation.mutateAsync(id);
	const uploadFiles = (files: File[], targetFolderId?: string | null) =>
		uploadFilesMutation.mutateAsync({ files, targetFolderId });

	return {
		// query state
		...query,

		// actions
		createFolder,
		deleteFolder,
		deleteFile,
		uploadFiles,

		// mutation flags
		isUploading: uploadFilesMutation.isPending,
		isCreatingFolder: createFolderMutation.isPending,
		isDeletingFolder: deleteFolderMutation.isPending,
		isDeletingFile: deleteFileMutation.isPending,
	};
}
