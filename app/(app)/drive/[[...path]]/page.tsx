import React from "react";
import Table from "../components/table";
import { readDrive } from "@/lib/actions/read-drive";

const DrivePage = async ({ params }: { params: { path?: string[] } }) => {
	const { path } = await params;
	const folderId = path ? path[1] : null;
	const data = await readDrive({ folderId });
	return <Table initialData={data} folderId={folderId} />;
};

export default DrivePage;
