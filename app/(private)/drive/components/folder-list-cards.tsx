import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StarFilledIcon } from "@radix-ui/react-icons";
import {
	Download,
	Folder,
	MoreVertical,
	Share2,
	Star,
	Trash2,
} from "lucide-react";

interface Folder {
	id: string;
	name: string;
	items: number;
	starred: boolean;
	lastModified: string;
}

const folders: Folder[] = [
	{
		id: "1",
		name: "Documents",
		items: 120,
		starred: true,
		lastModified: "10 days ago",
	},
	{
		id: "2",
		name: "Images",
		items: 250,
		starred: false,
		lastModified: "2 days ago",
	},
	{
		id: "4",
		name: "Downloads",
		items: 80,
		starred: false,
		lastModified: "Yesterday",
	},
];

export function FolderListCards() {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{folders.map((folder) => (
				<Card key={folder.id} className="hover:bg-muted transition-colors">
					<CardHeader>
						<CardTitle className="flex gap-2">
							<Folder className="size-4 text-yellow-600" />
							<h3 className="leading-none font-semibold tracking-tight">
								{folder.name}
							</h3>
						</CardTitle>
						<CardAction>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreVertical className="size-4" />
										<span className="sr-only">More options</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>
										<Download />
										<span>Download</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Share2 />
										<span>Share</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Trash2 />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CardAction>
					</CardHeader>
					<CardContent className="spcae-y-4">
						<div className="bg-muted rounded-md border px-4 py-2 text-sm">
							{folder.items} items
						</div>
						<div className="flex items-center justify-between">
							<div className="text-muted-foreground text-xs">
								Last update: {folder.lastModified}
							</div>
							<Button variant="ghost" size="icon">
								{folder.starred ? (
									<StarFilledIcon className="size-4 text-orange-400" />
								) : (
									<Star className="text-muted-foreground size-4" />
								)}
								<span className="sr-only">
									{folder.starred ? "Unstar" : "Star"} folder
								</span>
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
