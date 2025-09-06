import Table from "../components/drive/table";

const Page = async ({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
	const { folder } = await searchParams;
	return <Table folder={folder} />;
};

export default Page;
