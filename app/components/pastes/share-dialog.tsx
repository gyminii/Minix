"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2, LucideLink } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Paste } from "@/lib/types/pastes";

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pasteId: string;
	paste: Paste;
	trigger?: React.ReactNode;
}

export function ShareDialog({
	open,
	onOpenChange,
	pasteId,
	paste,
	trigger,
}: ShareDialogProps) {
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [isGeneratingSignedUrl, setIsGeneratingSignedUrl] = useState(false);
	const [signedUrlCopySuccess, setSignedUrlCopySuccess] = useState(false);
	const [directLinkCopySuccess, setDirectLinkCopySuccess] = useState(false);

	const handleCopyDirectLink = () => {
		const url = `${window.location.origin}/paste/${pasteId}`;
		navigator.clipboard.writeText(url);
		setDirectLinkCopySuccess(true);
		toast.success("Direct link copied to clipboard!");

		setTimeout(() => {
			setDirectLinkCopySuccess(false);
		}, 2000);
	};

	const handleCopySignedUrl = () => {
		const url = signedUrl || paste.url;
		if (url) {
			navigator.clipboard.writeText(url);
			setSignedUrlCopySuccess(true);
			toast.success("Content URL copied to clipboard!");

			setTimeout(() => {
				setSignedUrlCopySuccess(false);
			}, 2000);
		}
	};

	const generateNewSignedUrl = async () => {
		if (!pasteId) return;

		setIsGeneratingSignedUrl(true);

		try {
			const response = await fetch(`/api/pastes/${pasteId}/signed-url`, {
				method: "POST",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to generate new URL");
			}

			const data = await response.json();
			setSignedUrl(data.signedUrl);
			toast.success("New content URL generated!");
		} catch (error) {
			console.error("Error generating new URL:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to generate new URL"
			);
		} finally {
			setIsGeneratingSignedUrl(false);
		}
	};

	// Reset states when the dialog closes
	useEffect(() => {
		if (!open) {
			setSignedUrl(null);
			setSignedUrlCopySuccess(false);
			setDirectLinkCopySuccess(false);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share Paste</DialogTitle>
					<DialogDescription>
						Share your paste with others using these links.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{/* Direct Link */}
					<div className="space-y-2">
						<Label className="text-base font-medium">Direct Link</Label>
						<p className="text-sm text-muted-foreground">
							Share this link for others to view the paste in the browser.
						</p>
						<div className="flex items-center space-x-2">
							<Input
								readOnly
								value={`${window.location.origin}/paste/${pasteId}`}
								className="flex-1"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={handleCopyDirectLink}
							>
								{directLinkCopySuccess ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Content URL */}
					<div className="space-y-2">
						<Label className="text-base font-medium">Content URL</Label>
						<p className="text-sm text-muted-foreground">
							This URL provides direct access to the raw content. It expires
							after 7 days.
						</p>
						<div className="flex items-center space-x-2">
							<Input
								readOnly
								value={signedUrl || paste.url || ""}
								className="flex-1 text-xs"
							/>
							<Button
								variant="outline"
								size="icon"
								onClick={handleCopySignedUrl}
							>
								{signedUrlCopySuccess ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={generateNewSignedUrl}
							disabled={isGeneratingSignedUrl}
							className="mt-2"
						>
							{isGeneratingSignedUrl ? (
								<>
									<Loader2 className="mr-2 h-3 w-3 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<LucideLink className="mr-2 h-3 w-3" />
									Generate New URL
								</>
							)}
						</Button>
					</div>
				</div>

				<DialogFooter className="mt-4">
					<Button onClick={() => onOpenChange(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
