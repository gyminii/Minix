"use client";

import { useTheme } from "next-themes";

export default function Logo() {
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-5 md:size-8 text-primary me-1 rounded-sm transition-all group-data-collapsible:size-7 group-data-[collapsible=icon]:size-8 flex-shrink-0"
			role="img"
			aria-label="Minix logo"
		>
			<path
				d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"
				className={isDarkMode ? "stroke-sky-400" : "stroke-primary"}
			/>
			<path
				d="M18 14h-8"
				className={isDarkMode ? "stroke-sky-400" : "stroke-primary"}
			/>
			<path
				d="M15 18h-5"
				className={isDarkMode ? "stroke-sky-400" : "stroke-primary"}
			/>
			<path
				d="M10 6h8v4h-8V6Z"
				className={
					isDarkMode
						? "stroke-sky-400 fill-sky-950/20"
						: "stroke-primary fill-primary/5"
				}
			/>
		</svg>
	);
}
