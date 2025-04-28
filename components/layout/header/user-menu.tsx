import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCurrentUser } from "@/hooks/use-get-current-user";
import { useLogout } from "@/hooks/use-logout";

export default function UserMenu() {
	const user = useGetCurrentUser();
	const { mutate: logout } = useLogout();
	const avatarurl = user?.user_metadata.avatar_url;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar>
					<AvatarImage src={avatarurl} alt="shadcn ui kit" />
					<AvatarFallback className="rounded-lg">
						{user?.user_metadata.name?.substring(0, 2)}
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
							<AvatarImage
								src={`${process.env.ASSETS_URL}/avatars/01.png`}
								alt="shadcn ui kit"
							/>
							<AvatarFallback className="rounded-lg">
								{user?.user_metadata.name?.substring(0, 2)}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">
								{user?.user_metadata.name}
							</span>
							<span className="text-muted-foreground truncate text-xs">
								{user?.email}
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
						logout();
					}}
				>
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
