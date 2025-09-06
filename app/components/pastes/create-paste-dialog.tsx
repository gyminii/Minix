"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Code2, Clock, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { useFolders } from "@/hooks/use-folders";
import { expirationOptions, syntaxOptions } from "@/utils/pastes/options";

type Props = {
	defaultFolderId?: string | null;
};

const initialForm = (defaultFolderId: string | null) => ({
	open: false,
	submitting: false,
	name: "Untitled Paste",
	content: "",
	syntax: "plaintext" as string,
	expiration: "never" as string,
	folderId: defaultFolderId as string | null,
});

export default function CreatePasteDialog({ defaultFolderId = null }: Props) {
	const router = useRouter();
	const { data: folders } = useFolders();

	const [form, setForm] = useState(() => initialForm(defaultFolderId));

	const resetForm = () => setForm(initialForm(defaultFolderId));

	const setField = <K extends keyof typeof form>(
		key: K,
		val: (typeof form)[K]
	) => setForm((f) => ({ ...f, [key]: val }));

	const canSubmit = useMemo(
		() => form.content.trim().length > 0 && !form.submitting,
		[form]
	);

	async function handleSubmit() {
		if (!form.content.trim()) {
			toast.error("Please enter some content for your paste");
			return;
		}
		setField("submitting", true);

		try {
			// compute expiration
			let expiresAt: Date | null = null;
			if (form.expiration !== "never") {
				const now = new Date();
				const add = (ms: number) => new Date(now.getTime() + ms);
				if (form.expiration === "30m") expiresAt = add(30 * 60 * 1000);
				else if (form.expiration === "1h") expiresAt = add(60 * 60 * 1000);
				else if (form.expiration === "1d") expiresAt = add(24 * 60 * 60 * 1000);
				else if (form.expiration === "1w")
					expiresAt = add(7 * 24 * 60 * 60 * 1000);
				else if (form.expiration === "1m")
					expiresAt = add(30 * 24 * 60 * 60 * 1000);
			}

			const res = await fetch("/api/pastes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: form.name,
					content: form.content,
					syntax: form.syntax,
					expiresAt,
					folderId: form.folderId,
				}),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to create paste");
			}

			const data = await res.json();
			toast.success("Paste created!");
			setField("open", false);
			resetForm();
			router.push(`/paste/${data.id}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to create paste");
		} finally {
			setField("submitting", false);
		}
	}

	return (
		<Dialog
			open={form.open}
			onOpenChange={(v) => {
				setField("open", v);
				if (!v) resetForm();
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm">New Paste</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create New Paste</DialogTitle>
					<DialogDescription>
						Enter content, choose syntax and optional expiration. You can also
						save into a folder.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					<div className="space-y-2">
						<Label htmlFor="paste-name">Name</Label>
						<Input
							id="paste-name"
							value={form.name}
							onChange={(e) => setField("name", e.target.value)}
							placeholder="Enter a name for your paste"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="paste-content">Content</Label>
						<Textarea
							id="paste-content"
							value={form.content}
							onChange={(e) => setField("content", e.target.value)}
							className="min-h-[220px] font-mono"
							placeholder="Paste your code or text here..."
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
							<div className="mb-1 flex items-center gap-2">
								<Code2 className="h-4 w-4 text-primary" />
								<Label htmlFor="syntax">Syntax</Label>
							</div>
							<Select
								value={form.syntax}
								onValueChange={(v) => setField("syntax", v)}
							>
								<SelectTrigger id="syntax">
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
								<SelectContent className="max-h-[300px]">
									{syntaxOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
							<div className="mb-1 flex items-center gap-2">
								<Clock className="h-4 w-4 text-primary" />
								<Label htmlFor="expiration">Expiration</Label>
							</div>
							<Select
								value={form.expiration}
								onValueChange={(v) => setField("expiration", v)}
							>
								<SelectTrigger id="expiration">
									<SelectValue placeholder="Select expiration" />
								</SelectTrigger>
								<SelectContent>
									{expirationOptions.map((o) => (
										<SelectItem key={o.value} value={o.value}>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
							<div className="mb-1 flex items-center gap-2">
								<FileText className="h-4 w-4 text-primary" />
								<Label htmlFor="folder">Folder</Label>
							</div>
							<Select
								value={form.folderId || "root"}
								onValueChange={(v) =>
									setField("folderId", v === "root" ? null : v)
								}
							>
								<SelectTrigger id="folder">
									<SelectValue placeholder="Select folder" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="root">Root (No Folder)</SelectItem>
									{folders?.map((f) => (
										<SelectItem key={f.id} value={f.id}>
											{f.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:justify-between">
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
							<Code2 className="h-3.5 w-3.5" />
							{syntaxOptions.find((o) => o.value === form.syntax)?.label}
						</span>
						{form.expiration !== "never" && (
							<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
								<Clock className="h-3.5 w-3.5" />
								{
									expirationOptions.find((o) => o.value === form.expiration)
										?.label
								}
							</span>
						)}
					</div>

					<Button onClick={handleSubmit} disabled={!canSubmit}>
						{form.submitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating…
							</>
						) : (
							<>
								<Save className="mr-2 h-4 w-4" />
								Create Paste
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
