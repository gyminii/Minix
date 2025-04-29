"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Code2, Loader2, Plus, Save } from "lucide-react";
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
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { usePastes } from "@/hooks/use-pastes";
import { PasteTable } from "./components/table";

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

	const { data: folders, isLoading: foldersLoading } = useFolders();
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
					<Button onClick={() => router.push("/paste?tab=create")}>
						<Plus className="mr-2 h-4 w-4" />
						New Paste
					</Button>
				</div>
			</motion.div>

			<motion.div variants={itemVariants}>
				<Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
					<div className="flex items-center justify-between mb-6">
						<TabsList>
							<TabsTrigger value="create">Create</TabsTrigger>
							<TabsTrigger value="list">My Pastes</TabsTrigger>
						</TabsList>

						{activeTab === "list" && (
							<Select
								value={folderId || "root"}
								onValueChange={handleFolderChange}
							>
								<SelectTrigger className="w-[200px]">
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
								<div className="flex items-center text-sm text-muted-foreground">
									<div className="flex items-center mr-4">
										<Code2 className="mr-1 h-4 w-4" />
										<span>
											Syntax:{" "}
											{syntaxOptions.find((o) => o.value === syntax)?.label}
										</span>
									</div>
									{expiration !== "never" && (
										<div className="flex items-center">
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
								</div>
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting || !content.trim()}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Creating...
										</>
									) : (
										<>
											<Save className="mr-2 h-4 w-4" />
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
