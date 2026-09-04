"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface FileAttachment {
	id: string;
	name: string;
	size: number;
	type: string;
	url: string;
	created_at: string;
	path?: string;
	folder_id?: string | null;
	user_id?: string;
}
export function useRecentFiles(limit = 5) {
	const queryClient = useQueryClient();

	const query = useQuery<FileAttachment[]>({
		queryKey: ["recent-files", limit],
		queryFn: async () => {
			const response = await fetch(`/api/files?limit=${limit}`);
			if (!response.ok) {
				throw new Error("Failed to fetch recent files");
			}
			return (await response.json()) as FileAttachment[];
		},
		staleTime: 1000 * 60, // 1 minute
		refetchOnWindowFocus: true,
		refetchInterval: 30_000,
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
				const data = (await response.json()) as { error?: string };
				throw new Error(data.error || "Failed to delete file");
			}

			return response.json();
		},
		onMutate: async (fileId) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["recent-files"] });

			// Snapshot the previous value
			const previousFiles = queryClient.getQueryData<FileAttachment[]>([
				"recent-files",
				limit,
			]);

			// Optimistically update to the new value
			if (previousFiles) {
				queryClient.setQueryData<FileAttachment[]>(
					["recent-files", limit],
					previousFiles.filter((file) => file.id !== fileId)
				);
			}

			return { previousFiles };
		},
		onSuccess: () => {
			toast.success("File deleted successfully");
		},
		onError: (error, _, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousFiles) {
				queryClient.setQueryData<FileAttachment[]>(
					["recent-files", limit],
					context.previousFiles
				);
			}
			toast.error(
				`Error deleting file: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		},
	});

	const deleteFile = async (fileId: string) => {
		return deleteFileMutation.mutateAsync(fileId);
	};

	const refreshRecentFiles = () => {
		queryClient.invalidateQueries({ queryKey: ["recent-files", limit] });
	};

	return {
		...query,
		deleteFile,
		isDeletingFile: deleteFileMutation.isPending,
		refreshRecentFiles,
	};
}
