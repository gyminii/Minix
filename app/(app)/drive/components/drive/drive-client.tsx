"use client";
import { useParams } from "next/navigation";
import Table from "../table";
import { useDriveData } from "@/hooks/use-drive-data";

const DriveClient = () => {
	const { path } = useParams();
	const folderId = path ? path[1] : null;

	// Use our enhanced hook that combines React Query with Supabase realtime
	const {
		data,
		isLoading,
		error,
		createFolder,
		deleteFolder,
		deleteFile,
		uploadFiles,
		isUploading,
		isCreatingFolder,
		isDeletingFolder,
		isDeletingFile,
	} = useDriveData(folderId);
	console.log(data);
	return (
		<Table
			data={data || []}
			isLoading={isLoading}
			error={error}
			createFolder={createFolder}
			deleteFolder={deleteFolder}
			deleteFile={deleteFile}
			uploadFiles={uploadFiles}
			isUploading={isUploading}
			isCreatingFolder={isCreatingFolder}
			isDeletingFolder={isDeletingFolder}
			isDeletingFile={isDeletingFile}
		/>
	);
};

export default DriveClient;
