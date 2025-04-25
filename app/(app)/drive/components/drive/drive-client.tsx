"use client";
import { readDrive } from "@/lib/actions/read-drive";
import { useDriveStore } from "@/lib/store/drive-store";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Table from "../table";

const DriveClient = () => {
	const { path } = useParams();
	const folderId = path ? path[1] : null;
	const { setData, setCurrentFolder, setupSubscriptions, cleanup } =
		useDriveStore();
	const { data: initialData = [] } = useQuery({
		queryKey: ["drive", folderId],
		queryFn: async () => await readDrive({ folderId }),
		staleTime: 1000 * 60,
	});
	useEffect(() => {
		console.log("setData in drive-client", folderId);
		if (initialData) {
			setData(initialData);
			setCurrentFolder(folderId);
			setupSubscriptions();
		}
		return () => cleanup();
	}, [
		initialData,
		folderId,
		setData,
		setCurrentFolder,
		setupSubscriptions,
		cleanup,
	]);

	return <Table />;
};

export default DriveClient;
