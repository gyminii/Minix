"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFolders } from "@/hooks/use-folders";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Check,
	Clock,
	Code2,
	Copy,
	Edit,
	Folder,
	Loader2,
	Share2,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DeleteDialog } from "@/app/components/pastes/delete-dialog";
import { EditForm } from "@/app/components/pastes/edit-form";
import { ShareDialog } from "@/app/components/pastes/share-dialog";
import { CodeHighlighter } from "@/app/components/pastes/syntax-highlighter";
import type { Paste } from "@/lib/types/pastes";
import { syntaxOptions } from "@/utils/pastes/options";
import NextLink from "next/link";

export default function PasteViewPage() {
	const router = useRouter();
	const { id } = useParams() as { id: string };
	const [paste, setPaste] = useState<Paste | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [showShareDialog, setShowShareDialog] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);
	const { data: folders } = useFolders();
	useEffect(() => {
		const fetchPaste = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(`/api/pastes/${id}`);

				if (!response.ok) {
					if (response.status === 404) {
						toast.error("Paste not found");
						router.push("/paste");
						return;
					} else if (response.status === 410) {
						toast.error("This paste has expired");
						router.push("/paste");
						return;
					}

					const error = await response.json();
					throw new Error(error.error || "Failed to fetch paste");
				}

				const data = (await response.json()) as Paste;
				setPaste(data);
			} catch (error) {
				console.error("Error fetching paste:", error);
				toast.error(
					error instanceof Error ? error.message : "Failed to fetch paste"
				);
			} finally {
				setIsLoading(false);
			}
		};

		if (id) {
			fetchPaste();
		}
	}, [id, router]);

	const handleSavePaste = (updatedPaste: Paste) => {
		setPaste(updatedPaste);
		setIsEditing(false);
	};

	const handleCopyContent = () => {
		if (paste) {
			navigator.clipboard.writeText(paste.content);
			setCopySuccess(true);
			toast.success("Content copied to clipboard!");

			setTimeout(() => {
				setCopySuccess(false);
			}, 2000);
		}
	};

	if (isLoading) {
		return (
			<div className="h-full flex-1 flex items-center justify-center min-h-[80dvh]">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">Loading paste...</p>
				</div>
			</div>
		);
	}

	if (!paste) {
		return (
			<div className="container mx-auto max-w-4xl">
				<Card>
					<CardContent className="p-6 text-center">
						<p className="text-muted-foreground">
							Paste not found or has expired
						</p>
						<Button asChild className="mt-4">
							<NextLink href="/paste">Create New Paste</NextLink>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			className="w-full max-w-full"
		>
			<motion.div className="mb-6 flex items-center justify-between">
				<div className="flex items-center">
					<Button variant="outline" size="icon" asChild className="mr-4">
						<NextLink href="/paste">
							<ArrowLeft className="h-4 w-4" />
						</NextLink>
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{paste.name}</h1>
						<div className="flex items-center text-sm text-muted-foreground mt-1">
							<span className="mr-4">
								Created:{" "}
								{format(new Date(paste.created_at), "MMM d, yyyy h:mm a")}
							</span>
							{paste.expires_at && (
								<span className="flex items-center">
									<Clock className="mr-1 h-4 w-4" />
									Expires:{" "}
									{format(new Date(paste.expires_at), "MMM d, yyyy h:mm a")}
								</span>
							)}
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={handleCopyContent}
						title="Copy content"
					>
						{copySuccess ? (
							<Check className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
					<ShareDialog
						open={showShareDialog}
						onOpenChange={setShowShareDialog}
						pasteId={id as string}
						paste={paste}
						trigger={
							<Button variant="outline" size="icon" title="Share">
								<Share2 className="h-4 w-4" />
							</Button>
						}
					/>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setIsEditing(!isEditing)}
						title="Edit paste"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<DeleteDialog
						pasteId={id as string}
						trigger={
							<Button
								variant="outline"
								size="icon"
								className="text-destructive"
								title="Delete paste"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						}
					/>
				</div>
			</motion.div>

			<div className="w-full max-w-full">
				{isEditing ? (
					<EditForm
						paste={paste}
						folders={folders}
						onCancel={() => setIsEditing(false)}
						onSave={handleSavePaste}
					/>
				) : (
					<Card className="w-full max-w-full">
						<CardHeader>
							<CardTitle className="flex items-center">
								<Code2 className="mr-2 h-5 w-5" />
								{syntaxOptions.find((o) => o.value === paste.syntax)?.label ||
									"Plain Text"}
								{paste.folder_id && (
									<div className="ml-4 flex items-center text-sm text-muted-foreground">
										<Folder className="mr-1 h-4 w-4" />
										<span>
											{folders?.find((f) => f.id === paste.folder_id)?.name ||
												"Loading folder..."}
										</span>
									</div>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="w-full max-w-full overflow-hidden">
							<div className="rounded-md border w-full max-w-full overflow-hidden">
								<CodeHighlighter
									content={paste.content}
									language={paste.syntax || "plaintext"}
								/>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</motion.div>
	);
}
