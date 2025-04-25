import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUploadFiles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			files,
			folderId,
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
			// Add folder ID if provided
			if (folderId) formData.append("folder_id", folderId);

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
				variables.folderId
			);

			// Invalidate the drive query to refresh the data
			queryClient.invalidateQueries({
				queryKey: ["drive", variables.folderId],
			});

			// Also invalidate dashboard stats
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
		},
		onError: (error) => {
			console.error("Upload error:", error);
		},
	});
}
