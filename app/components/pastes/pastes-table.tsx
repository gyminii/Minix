"use client";

import { format } from "date-fns";
import {
	ArrowRight,
	Blocks,
	Clock,
	List as ListIcon,
	Trash2,
	Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useFolders } from "@/hooks/use-folders";
import { usePastes } from "@/hooks/use-pastes";
import { syntaxOptions } from "@/utils/pastes/options";
import CreatePasteDialog from "./create-paste-dialog";
import { PasteTable } from "./table";

type ViewMode = "cards" | "list";

export default function PastesTable({
	initialFolderId,
	initialView = "cards",
}: {
	initialFolderId: string | null;
	initialView?: ViewMode;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Local state seeded from server props
	const [view, setView] = useState<ViewMode>(initialView);
	const [folderId, setFolderId] = useState<string | null>(initialFolderId);

	// Keep local state in sync if URL changes client-side
	useEffect(() => {
		const v = searchParams.get("view");
		setView(v === "list" ? "list" : "cards");
	}, [searchParams]);

	useEffect(() => {
		setFolderId(searchParams.get("folder") || null);
	}, [searchParams]);

	const { data: folders, isLoading: foldersLoading } = useFolders();
	const {
		data: pastes,
		isLoading: pastesLoading,
		deletePaste,
	} = usePastes(folderId);

	const setQueryParam = (key: string, value?: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (!value || value === "root") params.delete(key);
		else params.set(key, value);
		router.push(`/paste?${params.toString()}`);
	};

	const onChangeFolder = (value: string) => {
		const next = value === "root" ? null : value;
		setFolderId(next);
		setQueryParam("folder", next);
	};

	const onChangeView = (next: ViewMode) => {
		setView(next);
		setQueryParam("view", next);
	};

	const onDelete = async (id: string) => {
		if (!confirm("Delete this paste?")) return;
		try {
			await deletePaste(id);
			toast.success("Paste deleted.");
		} catch (e) {
			toast.error("Failed to delete paste.");
			console.error(e);
		}
	};

	const folderName = useMemo(() => {
		if (!folderId) return "Root (No Folder)";
		return folders?.find((f) => f.id === folderId)?.name ?? "Folder";
	}, [folderId, folders]);

	const formatExpiry = (expiresAt: string | null) => {
		if (!expiresAt) return "Never";
		const expiry = new Date(expiresAt);
		const now = new Date();
		if (expiry <= now) return "Expired";
		const diffMs = expiry.getTime() - now.getTime();
		const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (days > 7) return format(expiry, "MMM d, yyyy");
		if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
		const hours = Math.floor(diffMs / (1000 * 60 * 60));
		if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
		const mins = Math.floor(diffMs / (1000 * 60));
		return `${mins} minute${mins > 1 ? "s" : ""}`;
	};

	return (
		<div className="w-full space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Pastes</h1>
					<p className="mt-1 text-muted-foreground">
						Create, organize, and share text/code snippets.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{/* Folder Filter */}
					<Select value={folderId || "root"} onValueChange={onChangeFolder}>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder="Filter by folder" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="root">Root (No Folder)</SelectItem>
							{foldersLoading && (
								<SelectItem value="loading" disabled>
									Loading folders…
								</SelectItem>
							)}
							{folders?.map((folder) => (
								<SelectItem key={folder.id} value={folder.id}>
									{folder.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* View Toggle */}
					<div className="inline-flex rounded-lg border bg-background p-0.5">
						<Button
							variant={view === "cards" ? "default" : "ghost"}
							size="sm"
							className="rounded-md"
							onClick={() => onChangeView("cards")}
						>
							<Blocks className="mr-2 h-4 w-4" />
							Cards
						</Button>
						<Button
							variant={view === "list" ? "default" : "ghost"}
							size="sm"
							className="rounded-md"
							onClick={() => onChangeView("list")}
						>
							<ListIcon className="mr-2 h-4 w-4" />
							List
						</Button>
					</div>

					{/* Create Paste */}
					<CreatePasteDialog defaultFolderId={folderId} />
				</div>
			</div>

			{/* Content */}
			{pastesLoading ? (
				<Card>
					<CardHeader>
						<CardTitle>Loading Pastes</CardTitle>
						<CardDescription>Please wait…</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: view === "cards" ? 6 : 3 }).map((_, i) => (
							<Skeleton key={i} className="h-28 w-full rounded-xl" />
						))}
					</CardContent>
				</Card>
			) : !pastes || pastes.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>No pastes found</CardTitle>
						<CardDescription>
							{folderId
								? `This folder (${folderName}) has no pastes yet.`
								: "Create your first paste to get started."}
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<CreatePasteDialog defaultFolderId={folderId} />
					</CardFooter>
				</Card>
			) : view === "list" ? (
				<PasteTable pastes={pastes} onDelete={onDelete} isLoading={false} />
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{pastes.map((p) => {
						const syntaxLabel =
							syntaxOptions.find((s) => s.value === (p.syntax ?? "plaintext"))
								?.label ?? "Plaintext";
						const folderLabel = !p.folder_id
							? "Root"
							: folders?.find((f) => f.id === p.folder_id)?.name ?? "Folder";
						const expiryLabel = formatExpiry(p.expires_at);

						const copyLink = async () => {
							if (!p.url) {
								toast.error("No URL available for this paste");
								return;
							}
							try {
								await navigator.clipboard.writeText(p.url);
								toast.success("Link copied");
							} catch {
								toast.error("Failed to copy link");
							}
						};

						return (
							<Card key={p.id} className="group">
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between gap-2">
										<CardTitle className="line-clamp-1 text-base">
											{p.name || "Untitled Paste"}
										</CardTitle>
										<Badge variant="outline" className="shrink-0">
											{syntaxLabel}
										</Badge>
									</div>

									<CardDescription className="mt-2 flex flex-wrap items-center gap-2 text-xs">
										<span className="text-muted-foreground">
											Created {format(new Date(p.created_at), "MMM d, yyyy")}
										</span>

										<Separator orientation="vertical" className="h-4" />

										<span
											className={`inline-flex items-center gap-1 ${
												expiryLabel === "Expired"
													? "text-destructive"
													: "text-muted-foreground"
											}`}
										>
											<Clock className="h-3.5 w-3.5" />
											{expiryLabel}
										</span>

										<Separator orientation="vertical" className="h-4" />

										<Badge variant="secondary" className="px-2 py-0.5">
											{folderLabel}
										</Badge>
									</CardDescription>
								</CardHeader>

								<CardContent className="py-2">
									<p className="text-sm text-muted-foreground">
										{p.url ? "Public link available" : "No public link"}
									</p>
								</CardContent>

								<CardFooter className="flex items-center justify-between">
									<Button
										asChild
										variant="ghost"
										size="sm"
										className="hover:text-primary"
									>
										<Link
											href={`/paste/${p.id}`}
											className="inline-flex items-center"
										>
											Open
											<ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
										</Link>
									</Button>

									<div className="flex items-center gap-1.5">
										<Button
											variant="ghost"
											size="sm"
											onClick={copyLink}
											disabled={!p.url}
										>
											<LinkIcon className="mr-1.5 h-4 w-4" />
											Copy Link
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive"
											onClick={() => onDelete(p.id)}
										>
											<Trash2 className="mr-1.5 h-4 w-4" />
											Delete
										</Button>
									</div>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
