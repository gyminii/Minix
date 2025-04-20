import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";
import React from "react";

const Layout = async ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const cookieStore = await cookies();
	const defaultOpen =
		cookieStore.get("sidebar_state")?.value === "true" ||
		cookieStore.get("sidebar_state") === undefined;

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar />
			<SidebarInset>
				<Header />
				<div className="p-4 pb-0 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto xl:group-data-[theme-content-layout=centered]/layout:mt-8">
					{children}
				</div>
				{/* <ThemeCustomizerPanel /> */}
				<Toaster position="top-center" />
			</SidebarInset>
		</SidebarProvider>
	);
};

export default Layout;
