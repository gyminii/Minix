import React from "react";
import Table from "../components/table";
import { readDrive } from "@/lib/actions/read-drive";
import DriveClient from "../components/drive/drive-client";

const DrivePage = async ({ params }: { params: { path?: string[] } }) => {
	// const { path } = await params;
	// const folderId = path ? path[1] : null;

	// if (!folderId) await readDrive({ folderId: null });
	return <DriveClient />;
};

export default DrivePage;
