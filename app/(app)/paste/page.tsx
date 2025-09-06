// app/paste/page.tsx

import View from "./components/view";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const folder = typeof params.folder === "string" ? params.folder : null;
	const viewParam = typeof params.view === "string" ? params.view : undefined;

	return (
		<View
			initialFolderId={folder}
			initialView={viewParam === "list" ? "list" : "cards"}
		/>
	);
}
