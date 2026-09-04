"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";

export default function UserMenu() {
	const { user } = useUser();
	const { signOut } = useClerk();
	const name = user?.fullName ?? user?.username ?? "";
	const email = user?.primaryEmailAddress?.emailAddress;
	const avatarurl = user?.imageUrl;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar>
					<AvatarImage src={avatarurl} alt="shadcn ui kit" />
					<AvatarFallback className="rounded-lg">
						{name.substring(0, 2)}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
				align="end"
			>
				<DropdownMenuLabel className="p-0">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar>
							<AvatarImage src={avatarurl} alt="shadcn ui kit" />
							<AvatarFallback className="rounded-lg">
								{name.substring(0, 2)}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{name}</span>
							<span className="text-muted-foreground truncate text-xs">
								{email}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				{/* <DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Sparkles />
						Upgrade to Pro
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<BadgeCheck />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem>
						<CreditCard />
						Billing
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Bell />
						Notifications
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator /> */}
				<DropdownMenuItem
					onClick={() => {
						void signOut({ redirectUrl: "/auth/login" });
					}}
				>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
