"use client";
import { format } from "date-fns";
import {
	ChevronRight,
	Download,
	MoreHorizontal,
	Share2,
	Trash2,
} from "lucide-react";

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
import {
	Table as DataTable,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DriveEntry } from "@/lib/types/type";
import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUploadForm } from "@/components/upload-form";
import { FileUploadDialog } from "@/app/components";
import { useRouter } from "next/navigation";
import CreateFolderDialog from "@/components/dialogs/create-folder-dialog";

const Table = ({ data }: { data: DriveEntry[] }) => {
	const supabase = createClient();
	const router = useRouter();
	useEffect(() => {
		supabase
			.channel("drive")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "folders" },
				(payload) => {
					console.log("Drive changes", payload.new);
				}
			)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "files" },
				async (payload) => {
					console.log(payload.new);
				}
			)
			.subscribe();
	}, [supabase]);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Drive</CardTitle>
				<CardAction>
					<div className="flex gap-x-2">
						<FileUploadDialog />
						<CreateFolderDialog />
					</div>
				</CardAction>
			</CardHeader>
			<CardContent>
				<DataTable>
					<TableHeader>
						<TableRow>
							<TableHead className="lg:w-[300px]">Name</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Upload Date</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((entity) => (
							<TableRow
								key={entity.id}
								onClick={() => router.push(`/drive/folders/${entity.id}`)}
							>
								<TableCell className="font-medium">
									<Link
										href="#"
										className="text-muted-foreground hover:text-primary flex items-center space-x-2 hover:underline"
									>
										{/* {getFileIcon(file.type)} */}
										<span>{entity.name}</span>
									</Link>
								</TableCell>
								{/* {entity?.size && (
									<TableCell>{formatFileSize(file.size)}</TableCell>
								)} */}
								<TableCell />

								<TableCell>
									{format(entity.created_at, "MMM d, yyyy")}
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal />
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
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</DataTable>
			</CardContent>
		</Card>
	);
};

export default Table;
