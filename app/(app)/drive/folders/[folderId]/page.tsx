import { readDrive } from "@/lib/actions/read-drive";
import Table from "../../components/table";

const FolderPage = async ({ params }: { params: { folderId: string } }) => {
	const { folderId } = await params;
	const data = await readDrive({ folderId });
	return <Table data={data} />;
};

export default FolderPage;
