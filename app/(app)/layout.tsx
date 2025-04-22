import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import QueryClientProvider from "@/providers/query-client";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { Toaster } from "sonner";

const layout = async ({ children }: { children: ReactNode }) => {
	const cookieStore = await cookies();
	const defaultOpen =
		cookieStore.get("sidebar_state")?.value === "true" ||
		cookieStore.get("sidebar_state") === undefined;
	return (
		<QueryClientProvider>
			<SidebarProvider defaultOpen={defaultOpen}>
				<Sidebar />
				<SidebarInset>
					<Header />
					<div className="p-4 pb-0 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto xl:group-data-[theme-content-layout=centered]/layout:mt-8">
						{children}
					</div>
					<Toaster position="top-center" />
				</SidebarInset>
			</SidebarProvider>
		</QueryClientProvider>
	);
};

export default layout;
