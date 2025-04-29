"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Code2, FileText, Loader2, Save } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { usePastes } from "@/hooks/use-pastes";
import { PasteTable } from "./components/table";
import { expirationOptions, syntaxOptions } from "@/utils/pastes/options";

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

export default function PastePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") || "create";
	const selectedFolder = searchParams.get("folder") || null;

	const [title, setTitle] = useState("Untitled Paste");
	const [content, setContent] = useState("");
	const [syntax, setSyntax] = useState("plaintext");
	const [expiration, setExpiration] = useState("never");
	const [folderId, setFolderId] = useState<string | null>(selectedFolder);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Update folderId when URL parameter changes
	useEffect(() => {
		setFolderId(selectedFolder);
	}, [selectedFolder]);

	const { data: folders } = useFolders();
	const {
		data: pastes,
		isLoading: pastesLoading,
		deletePaste,
	} = usePastes(folderId);

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		router.push(`/paste?${params.toString()}`);
	};

	const handleFolderChange = (value: string) => {
		setFolderId(value === "root" ? null : value);

		const params = new URLSearchParams(searchParams.toString());
		if (value === "root") {
			params.delete("folder");
		} else {
			params.set("folder", value);
		}

		router.push(`/paste?${params.toString()}`);
	};

	const handleSubmit = async () => {
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

			const response = await fetch("/api/pastes", {
				method: "POST",
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
				throw new Error(error.error || "Failed to create paste");
			}

			const data = await response.json();
			toast.success("Paste created successfully!");

			// Redirect to the paste view page
			router.push(`/paste/${data.id}`);
		} catch (error) {
			console.error("Error creating paste:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to create paste"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<motion.div
			className="w-full"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			<motion.div variants={itemVariants} className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Pastes</h1>
						<p className="text-muted-foreground mt-2">
							Create, manage, and share code snippets and text content.
						</p>
					</div>
				</div>
			</motion.div>

			<motion.div variants={itemVariants}>
				{/* Change from defaultValue to value to make tabs URL-driven */}
				<Tabs value={activeTab} onValueChange={handleTabChange}>
					<div className="flex items-center justify-between mb-6">
						<TabsList className="w-[200px]">
							<TabsTrigger value="create" className="flex-1">
								Create
							</TabsTrigger>
							<TabsTrigger value="list" className="flex-1">
								My Pastes
							</TabsTrigger>
						</TabsList>

						{activeTab === "list" && (
							<Select
								value={folderId || "root"}
								onValueChange={handleFolderChange}
							>
								<SelectTrigger className="w-[220px]">
									<SelectValue placeholder="Filter by folder" />
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
						)}
					</div>

					<TabsContent value="create">
						<Card>
							<CardHeader>
								<CardTitle>Create New Paste</CardTitle>
								<CardDescription>
									Enter the content you want to share. You can set a title,
									syntax highlighting, and expiration time.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="title" className="text-base font-medium">
										Title
									</Label>
									<Input
										id="title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Enter a title for your paste"
										className="w-full"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="content" className="text-base font-medium">
										Content
									</Label>
									<Textarea
										id="content"
										value={content}
										onChange={(e) => setContent(e.target.value)}
										placeholder="Paste your code or text here..."
										className="min-h-[300px] font-mono w-full"
									/>
								</div>

								<div className="space-y-4">
									<h3 className="text-base font-medium">Options</h3>
									<Separator />

									<div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
										<div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
											<div className="flex items-center mb-2">
												<Code2 className="h-5 w-5 mr-2 text-primary" />
												<Label htmlFor="syntax" className="font-medium">
													Syntax Highlighting
												</Label>
											</div>
											<Select value={syntax} onValueChange={setSyntax}>
												<SelectTrigger id="syntax" className="w-full">
													<SelectValue placeholder="Select language" />
												</SelectTrigger>
												<SelectContent className="max-h-[300px]">
													{syntaxOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<p className="text-xs text-muted-foreground mt-2">
												Choose the language for syntax highlighting
											</p>
										</div>

										<div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
											<div className="flex items-center mb-2">
												<Clock className="h-5 w-5 mr-2 text-primary" />
												<Label htmlFor="expiration" className="font-medium">
													Expiration Time
												</Label>
											</div>
											<Select value={expiration} onValueChange={setExpiration}>
												<SelectTrigger id="expiration" className="w-full">
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
											<p className="text-xs text-muted-foreground mt-2">
												Set when this paste should expire
											</p>
										</div>

										<div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
											<div className="flex items-center mb-2">
												<FileText className="h-5 w-5 mr-2 text-primary" />
												<Label htmlFor="folder" className="font-medium">
													Save in Folder
												</Label>
											</div>
											<Select
												value={folderId || "root"}
												onValueChange={(value) =>
													setFolderId(value === "root" ? null : value)
												}
											>
												<SelectTrigger id="folder" className="w-full">
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
											<p className="text-xs text-muted-foreground mt-2">
												Organize your paste in a specific folder
											</p>
										</div>
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
								<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
									<div className="flex items-center px-3 py-1 rounded-full bg-muted">
										<Code2 className="mr-1 h-4 w-4" />
										<span>
											{syntaxOptions.find((o) => o.value === syntax)?.label}
										</span>
									</div>
									{expiration !== "never" && (
										<div className="flex items-center px-3 py-1 rounded-full bg-muted">
											<Clock className="mr-1 h-4 w-4" />
											<span>
												Expires:{" "}
												{
													expirationOptions.find((o) => o.value === expiration)
														?.label
												}
											</span>
										</div>
									)}
									{folderId && folders?.find((f) => f.id === folderId) && (
										<div className="flex items-center px-3 py-1 rounded-full bg-muted">
											<FileText className="mr-1 h-4 w-4" />
											<span>
												Folder: {folders.find((f) => f.id === folderId)?.name}
											</span>
										</div>
									)}
								</div>
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting || !content.trim()}
									className="w-full sm:w-auto"
									size="lg"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-5 w-5 animate-spin" />
											Creating...
										</>
									) : (
										<>
											<Save className="mr-2 h-5 w-5" />
											Create Paste
										</>
									)}
								</Button>
							</CardFooter>
						</Card>
					</TabsContent>

					<TabsContent value="list">
						<PasteTable
							pastes={pastes}
							onDelete={deletePaste}
							isLoading={pastesLoading}
						/>
					</TabsContent>
				</Tabs>
			</motion.div>
		</motion.div>
	);
}
