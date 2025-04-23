import { useMutation } from "@tanstack/react-query";

export function useUploadFiles() {
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
			console.log(folderId, formData.get("folder_id"));

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
		onError: (error) => {
			console.error("Upload error:", error);
		},
	});
}
