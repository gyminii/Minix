import { generateMeta } from "@/lib/utils";
import Client from "./client";

export async function generateMetadata() {
	return generateMeta({
		title: "File Manager Admin Dashboard",
		description:
			"An admin dashboard template for managing files, folders, and monitoring storage status. Perfect for building streamlined file management systems.",
		canonical: "/file-manager",
	});
}
const Page = () => <Client />;

export default Page;
