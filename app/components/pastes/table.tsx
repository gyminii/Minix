"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { PasteMetadata } from "@/lib/types/pastes";
import { format } from "date-fns";
import {
	Clock,
	Code2,
	Copy,
	Edit2,
	ExternalLink,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PasteTableProps {
	pastes: PasteMetadata[];
	onDelete: (id: string) => Promise<void>;
	isLoading: boolean;
}

const syntaxLabels: Record<string, string> = {
	plaintext: "Plain Text",
	javascript: "JavaScript",
	typescript: "TypeScript",
	python: "Python",
	html: "HTML",
	css: "CSS",
	json: "JSON",
	markdown: "Markdown",
	sql: "SQL",
	bash: "Bash",
	java: "Java",
	csharp: "C#",
	cpp: "C++",
	go: "Go",
	rust: "Rust",
	php: "PHP",
	ruby: "Ruby",
};

export function PasteTable({ pastes, onDelete, isLoading }: PasteTableProps) {
	const router = useRouter();
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleCopyLink = async (paste: PasteMetadata) => {
		if (!paste.url) {
			toast.error("No URL available for this paste");
			return;
		}
		if (!navigator.clipboard) {
			toast.error("Clipboard API not supported in this browser");
			return;
		}
		await navigator.clipboard.writeText(paste.url);
		toast.success("Link copied to clipboard");
	};

	const handleDelete = async (id: string) => {
		try {
			setDeletingId(id);
			await onDelete(id);
			toast.success("Paste deleted successfully");
		} catch (error) {
			console.error("Error deleting paste:", error);
			toast.error("Failed to delete paste");
		} finally {
			setDeletingId(null);
		}
	};

	const formatExpiryDate = (expiresAt: string | null) => {
		if (!expiresAt) return null;

		const expiry = new Date(expiresAt);
		const now = new Date();

		// If expired
		if (expiry < now) {
			return "Expired";
		}

		// Calculate time difference
		const diffMs = expiry.getTime() - now.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays > 7) {
			return format(expiry, "MMM d, yyyy");
		} else if (diffDays > 0) {
			return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
		} else {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours > 0) {
				return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
			} else {
				const diffMinutes = Math.floor(diffMs / (1000 * 60));
				return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
			}
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (pastes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-center">
				<Code2 className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium">No pastes found</h3>
				<p className="text-muted-foreground mt-1">
					Create your first paste to see it here
				</p>
				<Button className="mt-4" onClick={() => router.push("/paste")}>
					Create Paste
				</Button>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[40%]">Title</TableHead>
						<TableHead className="w-[15%]">Syntax</TableHead>
						<TableHead className="w-[15%]">Created</TableHead>
						<TableHead className="w-[15%]">Expires</TableHead>
						<TableHead className="w-[15%] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{pastes.map((paste) => {
						const expiryFormatted = formatExpiryDate(paste.expires_at);

						return (
							<TableRow key={paste.id} className="group">
								<TableCell
									className="font-medium cursor-pointer hover:underline"
									onClick={() => router.push(`/paste/${paste.id}`)}
								>
									<div className="flex items-center">
										<Code2 className="h-4 w-4 mr-2 text-muted-foreground" />
										<span>{paste.title}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="font-mono text-xs">
										{syntaxLabels[paste.syntax] || paste.syntax}
									</Badge>
								</TableCell>
								<TableCell>
									{format(new Date(paste.created_at), "MMM d, yyyy")}
								</TableCell>
								<TableCell>
									{expiryFormatted ? (
										<div className="flex items-center">
											<Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
											<span
												className={
													expiryFormatted === "Expired"
														? "text-destructive"
														: ""
												}
											>
												{expiryFormatted}
											</span>
										</div>
									) : (
										<span className="text-muted-foreground">Never</span>
									)}
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => router.push(`/paste/${paste.id}`)}
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												View
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													router.push(`/paste/${paste.id}?edit=true`)
												}
											>
												<Edit2 className="h-4 w-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleCopyLink(paste)}
												disabled={!paste.url}
											>
												<Copy className="h-4 w-4 mr-2" />
												Copy Link
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onClick={() => handleDelete(paste.id)}
												disabled={deletingId === paste.id}
											>
												{deletingId === paste.id ? (
													<>
														<div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-destructive" />
														Deleting...
													</>
												) : (
													<>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete
													</>
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
