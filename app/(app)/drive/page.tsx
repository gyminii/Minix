import { readDrive } from "@/lib/actions/read-drive";
import Table from "./components/table";

const Page = async () => {
	const folders = await readDrive();
	return <Table data={folders} />;
};

export default Page;
