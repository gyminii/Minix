import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PasteMetadata } from "@/lib/types/pastes";

export function usePastes(folderId?: string | null) {
	const queryClient = useQueryClient();

	const fetchPastes = async (): Promise<PasteMetadata[]> => {
		const url = new URL("/api/pastes", window.location.origin);

		if (folderId) {
			url.searchParams.append("folderId", folderId);
		}

		const response = await fetch(url.toString());

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to fetch pastes");
		}

		return response.json();
	};

	const deletePaste = async (id: string): Promise<void> => {
		const response = await fetch(`/api/pastes/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to delete paste");
		}
	};

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["pastes", folderId],
		queryFn: fetchPastes,
	});

	const { mutateAsync: deletePasteMutation } = useMutation({
		mutationFn: deletePaste,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pastes"] });
		},
		onError: (error) => {
			console.error("Error deleting paste:", error);
			toast.error("Failed to delete paste");
		},
	});

	return {
		data: data || [],
		isLoading,
		error,
		refetch,
		deletePaste: deletePasteMutation,
	};
}
