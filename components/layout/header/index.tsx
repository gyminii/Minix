"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import Search from "@/components/layout/header/search";
import UserMenu from "@/components/layout/header/user-menu";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import Notifications from "@/components/layout/header/notifications";
import { Button } from "@/components/ui/button";

export default function Header() {
	const { toggleSidebar } = useSidebar();

	return (
		<div className="sticky top-0 z-50 flex flex-col">
			<header className="bg-background/50 flex h-14 items-center gap-3 px-4 backdrop-blur-xl lg:h-[60px] justify-between">
				<Button
					onClick={toggleSidebar}
					size="icon"
					variant="outline"
					className="flex md:hidden lg:flex"
				>
					<PanelLeftIcon />
				</Button>
				{/* <Search /> */}
				{/* <Notifications /> */}
				<div className="flex flex-row gap-x-2 items-center">
					<UserMenu />

					<ThemeSwitch />
				</div>
			</header>
		</div>
	);
}
