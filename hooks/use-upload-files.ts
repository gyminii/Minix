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
			files.forEach((file: File) => {
				formData.append("files", file);
			});
			if (folderId) formData.append("folder_id", folderId);
			const res = await fetch("/api/files", {
				method: "POST",
				body: formData,
			});
			const result = await res.json();
			if (!res.ok) {
				console.error("Upload failed:", result);
				throw new Error(result.error || "Upload failed");
			}
			return result;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["drive", variables.folderId],
			});
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
		},
		onError: (error) => console.error("Upload error:", error),
	});
}
