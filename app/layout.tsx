import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata: Metadata = {
	title: "Minix",
	description: "My personal drive",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Minix",
	},
	icons: {
		icon: [
			{
				url: "/icon-light-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				url: "/icon-light-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		shortcut: ["/favicon.ico"],
	},
};
export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={cn("bg-background group/layout font-poppins", fontVariables)}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<div className="pb-0 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto xl:group-data-[theme-content-layout=centered]/layout:mt-8">
						{children}
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
