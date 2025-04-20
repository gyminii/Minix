"use client";

import { Fragment, useEffect } from "react";
import Link from "next/link";
// import { page_routes } from "@/lib/routes-config";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sidebar as SidebarContainer,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Icon from "@/components/icon";
// import Logo from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
	const pathname = usePathname();
	const { setOpen, setOpenMobile, isMobile } = useSidebar();
	const isTablet = useIsTablet();

	useEffect(() => {
		if (isMobile) setOpenMobile(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	useEffect(() => {
		setOpen(!isTablet);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isTablet]);

	return (
		<SidebarContainer
			collapsible="icon"
			variant="floating"
			className="bg-background"
		>
			<SidebarHeader className="items-center justify-center pt-3 transition-all group-data-[collapsible=icon]:pt-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="rounded-none group-data-[collapsible=icon]:px-0!">
									{/* <Logo /> */}
									<div className="truncate font-semibold group-data-[collapsible=icon]:hidden">
										Shadcn UI Kit
									</div>
									<ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-(--radix-popper-anchor-width)">
								<DropdownMenuItem>
									<span>Ecommerce</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<span>Web Analiytics</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className="overflow-hidden">
				<ScrollArea className="h-full">scroll area</ScrollArea>
			</SidebarContent>
		</SidebarContainer>
	);
}
