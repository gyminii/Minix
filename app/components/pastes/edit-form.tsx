"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
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
import { expirationOptions, syntaxOptions } from "@/utils/pastes/options";
import type { Paste } from "@/lib/types/pastes";
import type { Folder } from "@/lib/types/type";

type EditFormProps = {
	paste: Paste;
	folders?: Folder[]; // Use the imported Folder type
	onCancel: () => void;
	onSave: (updatedPaste: Paste) => void;
};

export function EditForm({ paste, folders, onCancel, onSave }: EditFormProps) {
	const [name, setName] = useState(paste.name);
	const [content, setContent] = useState(paste.content);
	const [syntax, setSyntax] = useState(paste.syntax || "plaintext");
	const [expiration, setExpiration] = useState<string>(() => {
		if (!paste.expires_at) return "never";

		const expiresAt = new Date(paste.expires_at);
		const now = new Date();
		const diffMs = expiresAt.getTime() - now.getTime();
		const diffMins = Math.round(diffMs / 60000);

		if (diffMins <= 30) return "30m";
		else if (diffMins <= 60) return "1h";
		else if (diffMins <= 1440) return "1d";
		else if (diffMins <= 10080) return "1w";
		else return "1m";
	});
	const [folderId, setFolderId] = useState<string | null>(paste.folder_id);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

			const response = await fetch(`/api/pastes/${paste.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
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
			const updatedPaste: Paste = {
				...paste,
				name,
				content,
				syntax,
				expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
				folder_id: folderId,
			};

			onSave(updatedPaste);
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Paste</CardTitle>
				<CardDescription>
					Make changes to your paste content, syntax highlighting, or expiration
					time.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter a name for your paste"
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
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isSubmitting || !content.trim()}>
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
	);
}
