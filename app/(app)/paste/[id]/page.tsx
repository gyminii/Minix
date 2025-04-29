"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
	ArrowLeft,
	Check,
	Clock,
	Copy,
	Edit,
	Folder,
	Loader2,
	Save,
	Share2,
	Trash2,
	Code2,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import type { Paste } from "@/lib/types/pastes";

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 20,
		},
	},
};

// Syntax highlighting options
const syntaxOptions = [
	{ value: "plaintext", label: "Plain Text" },
	{ value: "javascript", label: "JavaScript" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "python", label: "Python" },
	{ value: "html", label: "HTML" },
	{ value: "css", label: "CSS" },
	{ value: "json", label: "JSON" },
	{ value: "markdown", label: "Markdown" },
	{ value: "sql", label: "SQL" },
	{ value: "bash", label: "Bash" },
	{ value: "java", label: "Java" },
	{ value: "csharp", label: "C#" },
	{ value: "cpp", label: "C++" },
	{ value: "go", label: "Go" },
	{ value: "rust", label: "Rust" },
	{ value: "php", label: "PHP" },
	{ value: "ruby", label: "Ruby" },
];

// Expiration options
const expirationOptions = [
	{ value: "never", label: "Never" },
	{ value: "30m", label: "30 Minutes" },
	{ value: "1h", label: "1 Hour" },
	{ value: "1d", label: "1 Day" },
	{ value: "1w", label: "1 Week" },
	{ value: "1m", label: "1 Month" },
];

export default function PasteViewPage() {
	const router = useRouter();
	const { id } = useParams() as { id: string };
	const [paste, setPaste] = useState<Paste | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showShareDialog, setShowShareDialog] = useState(false);
	const [copySuccess, setCopySuccess] = useState(false);

	// Edit form state
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [syntax, setSyntax] = useState("plaintext");
	const [expiration, setExpiration] = useState("never");
	const [folderId, setFolderId] = useState<string | null>(null);

	const { data: folders, isLoading: foldersLoading } = useFolders();

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

				// Initialize form state with paste data
				setTitle(data.title);
				setContent(data.content);
				setSyntax(data.syntax || "plaintext");
				setFolderId(data.folder_id);

				// Set expiration dropdown value based on expires_at
				if (data.expires_at) {
					const expiresAt = new Date(data.expires_at);
					const now = new Date();
					const diffMs = expiresAt.getTime() - now.getTime();
					const diffMins = Math.round(diffMs / 60000);

					if (diffMins <= 30) setExpiration("30m");
					else if (diffMins <= 60) setExpiration("1h");
					else if (diffMins <= 1440) setExpiration("1d");
					else if (diffMins <= 10080) setExpiration("1w");
					else setExpiration("1m");
				} else {
					setExpiration("never");
				}
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

	const handleSave = async () => {
		if (!content.trim()) {
			toast.error("Please enter some content for your paste");
			return;
		}

		setIsSubmitting(true);

		try {
			// Calculate expiration date if selected
			let expiresAt = null;
			if (expiration !== "never") {
				const now = new Date();
				if (expiration === "30m")
					expiresAt = new Date(now.getTime() + 30 * 60000);
				else if (expiration === "1h")
					expiresAt = new Date(now.getTime() + 60 * 60000);
				else if (expiration === "1d")
					expiresAt = new Date(now.getTime() + 24 * 60 * 60000);
				else if (expiration === "1w")
					expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60000);
				else if (expiration === "1m")
					expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60000);
			}

			const response = await fetch(`/api/pastes/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title,
					content,
					syntax,
					expiresAt,
					folderId,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update paste");
			}

			// Update the paste data
			if (paste) {
				const updatedPaste: Paste = {
					...paste,
					title,
					content,
					syntax,
					expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
					folder_id: folderId,
				};

				setPaste(updatedPaste);
			}

			setIsEditing(false);
			toast.success("Paste updated successfully!");
		} catch (error) {
			console.error("Error updating paste:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update paste"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);

		try {
			const response = await fetch(`/api/pastes/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete paste");
			}

			toast.success("Paste deleted successfully!");
			router.push("/paste");
		} catch (error) {
			console.error("Error deleting paste:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to delete paste"
			);
			setIsDeleting(false);
		}
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

	const handleCopyLink = () => {
		const url = `${window.location.origin}/paste/${id}`;
		navigator.clipboard.writeText(url);
		toast.success("Link copied to clipboard!");
		setShowShareDialog(false);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-4xlflex items-center justify-center min-h-[60vh]">
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
						{/* <Button asChild className="mt-4">
							<Link href="/paste">Create New Paste</Link>
						</Button> */}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<motion.div
			className="container mx-auto max-w-4xl"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			<motion.div
				variants={itemVariants}
				className="mb-6 flex items-center justify-between"
			>
				<div className="flex items-center">
					<Button variant="outline" size="icon" asChild className="mr-4">
						<Link href="/paste">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{paste.title}</h1>
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
					<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
						<DialogTrigger asChild>
							<Button variant="outline" size="icon" title="Share">
								<Share2 className="h-4 w-4" />
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Share Paste</DialogTitle>
								<DialogDescription>
									Anyone with this link can view this paste.
								</DialogDescription>
							</DialogHeader>
							<div className="flex items-center space-x-2 mt-4">
								<Input
									readOnly
									value={`${window.location.origin}/paste/${id}`}
									className="flex-1"
								/>
								<Button variant="outline" size="icon" onClick={handleCopyLink}>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							<DialogFooter className="mt-4">
								<Button onClick={() => setShowShareDialog(false)}>Close</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setIsEditing(!isEditing)}
						title="Edit paste"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="text-destructive"
								title="Delete paste"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									your paste.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									disabled={isDeleting}
								>
									{isDeleting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Deleting...
										</>
									) : (
										"Delete"
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</motion.div>

			<motion.div variants={itemVariants}>
				{isEditing ? (
					<Card>
						<CardHeader>
							<CardTitle>Edit Paste</CardTitle>
							<CardDescription>
								Make changes to your paste content, syntax highlighting, or
								expiration time.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Enter a title for your paste"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="content">Content</Label>
								<Textarea
									id="content"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="Paste your code or text here..."
									className="min-h-[300px] font-mono"
								/>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="syntax">Syntax Highlighting</Label>
									<Select value={syntax} onValueChange={setSyntax}>
										<SelectTrigger id="syntax">
											<SelectValue placeholder="Select language" />
										</SelectTrigger>
										<SelectContent>
											{syntaxOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="expiration">Expiration</Label>
									<Select value={expiration} onValueChange={setExpiration}>
										<SelectTrigger id="expiration">
											<SelectValue placeholder="Select expiration" />
										</SelectTrigger>
										<SelectContent>
											{expirationOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="folder">Save in Folder (Optional)</Label>
									<Select
										value={folderId || "root"}
										onValueChange={(value) =>
											setFolderId(value === "root" ? null : value)
										}
									>
										<SelectTrigger id="folder">
											<SelectValue placeholder="Select folder" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="root">Root (No Folder)</SelectItem>
											{folders?.map((folder) => (
												<SelectItem key={folder.id} value={folder.id}>
													{folder.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => setIsEditing(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSubmitting || !content.trim()}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</CardFooter>
					</Card>
				) : (
					<Card>
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
						<CardContent>
							<div className="rounded-md border overflow-hidden">
								<SyntaxHighlighter
									language={
										paste.syntax === "plaintext" ? "text" : paste.syntax
									}
									style={vscDarkPlus}
									showLineNumbers
									customStyle={{
										margin: 0,
										padding: "1rem",
										fontSize: "0.875rem",
										borderRadius: "0",
										maxHeight: "500px",
									}}
								>
									{paste.content}
								</SyntaxHighlighter>
							</div>
						</CardContent>
					</Card>
				)}
			</motion.div>
		</motion.div>
	);
}
