"use client";

import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	AlertCircle,
	CheckCircle,
	FileIcon,
	Loader2,
	Upload,
	UploadIcon,
	X,
	Camera,
	Smartphone,
	FilePlus2Icon as FileIcon2,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { useParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDriveData } from "@/hooks/use-drive-data";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileTypeIcon } from "@/utils/getFileIcon";

interface FileUploadDropzoneProps {
	maxFiles?: number;
	maxSize?: number;
	accept?: Accept;
	children?: React.ReactNode;
}

// Form schema with zod validation
const UploadSchema = z.object({
	files: z.array(z.instanceof(File)),
	previews: z.array(
		z.object({
			preview: z.string(),
			progress: z.number(),
			id: z.string(),
			uploaded: z.boolean().optional(),
			error: z.string().optional(),
			name: z.string(),
			size: z.number(),
			type: z.string(),
			lastModified: z.number(),
		})
	),
});

type UploadFormValues = z.infer<typeof UploadSchema>;

// Format file size
const formatFileSize = (bytes: number) => {
	if (bytes === undefined || isNaN(bytes)) return "0 B";
	if (bytes < 1024) return bytes + " B";
	else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
	else return (bytes / 1048576).toFixed(2) + " MB";
};

// Format date
const formatDate = (timestamp: number) => {
	if (!timestamp) return "";
	try {
		return new Date(timestamp).toLocaleDateString();
	} catch (error) {
		console.log(error);
		return "Unknown date";
	}
};

export function FileUploadDialog({
	maxFiles = 10,
	maxSize = 10 * 1024 * 1024, // 10MB
	accept = {
		// Documents
		"application/pdf": [".pdf"],
		"application/msword": [".doc"],
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
			".docx",
		],
		"application/vnd.oasis.opendocument.text": [".odt"],
		"application/rtf": [".rtf"],
		"text/plain": [".txt"],
		"text/markdown": [".md"],
		// Spreadsheets
		"application/vnd.ms-excel": [".xls"],
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
			".xlsx",
		],
		"application/vnd.oasis.opendocument.spreadsheet": [".ods"],
		"text/csv": [".csv"],
		// Presentations
		"application/vnd.ms-powerpoint": [".ppt"],
		"application/vnd.openxmlformats-officedocument.presentationml.presentation":
			[".pptx"],
		"application/vnd.oasis.opendocument.presentation": [".odp"],
		// Images
		"image/*": [
			".jpeg",
			".jpg",
			".png",
			".gif",
			".svg",
			".webp",
			".tiff",
			".bmp",
		],
		// Videos
		"video/*": [
			".mp4",
			".mov",
			".avi",
			".mkv",
			".wmv",
			".flv",
			".webm",
			".m4v",
			".mpeg",
		],
		// Audio
		"audio/*": [".mp3", ".wav", ".ogg", ".m4a", ".flac"],
		// Archives
		"application/zip": [".zip"],
		"application/x-rar-compressed": [".rar"],
		"application/x-7z-compressed": [".7z"],
		"application/gzip": [".tar.gz"],
	},
	children,
}: FileUploadDropzoneProps) {
	// Using the existing useIsMobile hook
	const isMobile = useIsMobile();
	const { path } = useParams();
	const folderId = path ? path[1] : null;
	const { uploadFiles, isUploading: isPending } = useDriveData(folderId);
	const { refreshDashboardStats } = useDashboardStats();
	const {
		control,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { isSubmitting },
	} = useForm<UploadFormValues>({
		resolver: zodResolver(UploadSchema),
		defaultValues: {
			files: [],
			previews: [],
		},
	});

	const [files, previews] = watch(["files", "previews"]);
	const [open, setOpen] = useState(false);
	const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
	const [activeTab, setActiveTab] = useState<string>("browse");

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			// Handle rejected files
			setFileRejections(rejectedFiles);
			// Clear rejections after 3 seconds
			if (rejectedFiles.length > 0)
				setTimeout(() => setFileRejections([]), 5000);

			if (files.length + acceptedFiles.length > maxFiles) {
				setFileRejections([
					...rejectedFiles,
					{
						file: {} as File,
						errors: [
							{
								code: "too-many-files",
								message: `You can only upload up to ${maxFiles} files`,
							},
						],
					},
				]);
				return;
			}

			const newPreviews = acceptedFiles.map((file) =>
				Object.assign(
					{},
					{
						preview: URL.createObjectURL(file),
						progress: 0,
						id: crypto.randomUUID(),
						name: file.name,
						size: file.size,
						type: file.type,
						lastModified: file.lastModified,
					}
				)
			);

			setValue("files", [...files, ...acceptedFiles]);
			setValue("previews", [...previews, ...newPreviews]);
		},
		[files, maxFiles, previews, setValue]
	);

	const removeFile = (id: string, index: number) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		setValue("files", newFiles);

		const newPreviews = [...previews];
		const previewToRemove = newPreviews.find((p) => p.id === id);
		if (previewToRemove && previewToRemove.preview) {
			URL.revokeObjectURL(previewToRemove.preview);
		}
		setValue(
			"previews",
			newPreviews.filter((p) => p.id !== id)
		);
	};

	const {
		getRootProps,
		getInputProps,
		isDragActive,
		isDragAccept,
		isDragReject,
		open: openFileDialog,
	} = useDropzone({
		onDrop,
		maxSize,
		maxFiles: maxFiles - files.length,
		accept,
		noClick: false,
		noKeyboard: false,
	});

	// Style based on drag state
	const dropzoneStyle = useMemo(
		() =>
			cn(
				"border-2 border-dashed rounded-xl p-6 md:p-10 text-center cursor-pointer transition-all duration-200 border-primary/30 bg-accent/20",
				"hover:border-primary/50 hover:bg-accent/30",
				isDragActive && "border-primary/70 bg-accent/40 scale-[1.01]",
				isDragAccept && "border-primary bg-accent/50 scale-[1.02]",
				isDragReject && "border-destructive bg-destructive/10"
			),
		[isDragActive, isDragAccept, isDragReject]
	);

	// Clean up previews when component unmounts
	useEffect(() => {
		return () => {
			previews.forEach((file) => {
				if (file.preview) {
					try {
						URL.revokeObjectURL(file.preview);
					} catch (error) {
						console.error("Error revoking object URL:", error);
					}
				}
			});
		};
	}, [previews]);

	const onSubmit = useCallback(
		async (data: UploadFormValues) => {
			try {
				// Call uploadFiles with just the files and folderId
				await uploadFiles(data.files, folderId);

				// These actions happen after successful upload
				refreshDashboardStats();
				reset();
				setOpen(false);
			} catch (error) {
				console.error("Upload error:", error);
				// Keep dialog open on error so user can retry
			}
		},
		[folderId, uploadFiles, refreshDashboardStats, reset, setOpen]
	);

	// Handle camera capture
	const handleCameraCapture = () => {
		// Create a file input element with camera capture
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.capture = "environment"; // Use "user" for front camera

		// Handle file selection
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files.length > 0) {
				onDrop(Array.from(target.files), []);
			}
		};

		// Trigger the file input
		input.click();
	};

	// Handle document capture
	const handleDocumentCapture = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/pdf,image/*";
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files.length > 0) {
				onDrop(Array.from(target.files), []);
			}
		};

		input.click();
	};
	const CustomTrigger = useCallback(() => {
		const handleClick = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setOpen(true);
		};

		if (children) {
			return (
				<div onClick={handleClick} className="cursor-pointer">
					{children}
				</div>
			);
		}

		return (
			<Button
				variant="outline"
				className="gap-2 transition-all duration-200 hover:bg-primary/10"
				onClick={handleClick}
			>
				<Upload className="h-4 w-4" />
				Upload Files
			</Button>
		);
	}, [children, setOpen]);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<CustomTrigger />
			<DialogContent
				className="sm:max-w-md md:min-w-xl"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold">
						Upload Files
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						{isMobile
							? "Select files from your device"
							: "Drag and drop files or click to browse"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-6 py-4">
						{fileRejections.length > 0 && (
							<Alert
								variant="destructive"
								className="animate-in fade-in-0 zoom-in-95 duration-200"
							>
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Errors</AlertTitle>

								{fileRejections.map((rejection, index) => (
									<AlertDescription key={index} className="text-sm">
										{rejection.errors.map((error) => (
											<p key={error.code}>{error.message}</p>
										))}
									</AlertDescription>
								))}
							</Alert>
						)}

						{isMobile ? (
							<Tabs
								defaultValue="browse"
								className="w-full"
								value={activeTab}
								onValueChange={setActiveTab}
							>
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="browse">Browse</TabsTrigger>
									<TabsTrigger value="camera">Camera</TabsTrigger>
									<TabsTrigger value="document">Document</TabsTrigger>
								</TabsList>
								<TabsContent value="browse" className="mt-4">
									<div className="flex flex-col items-center justify-center gap-y-3 p-6 border-2 border-dashed rounded-xl border-primary/30 bg-accent/20">
										<div className="rounded-full bg-primary/10 p-4 text-primary">
											<Smartphone className="h-8 w-8" />
										</div>
										<p className="text-lg font-medium">
											Select files from your device
										</p>
										<Button
											type="button"
											variant="secondary"
											className="mt-2 transition-all duration-200 w-full"
											onClick={openFileDialog}
										>
											Browse files
										</Button>
										<input {...getInputProps()} />
									</div>
								</TabsContent>
								<TabsContent value="camera" className="mt-4">
									<div className="flex flex-col items-center justify-center gap-y-3 p-6 border-2 border-dashed rounded-xl border-primary/30 bg-accent/20">
										<div className="rounded-full bg-primary/10 p-4 text-primary">
											<Camera className="h-8 w-8" />
										</div>
										<p className="text-lg font-medium">Take a photo</p>
										<Button
											type="button"
											variant="secondary"
											className="mt-2 transition-all duration-200 w-full"
											onClick={handleCameraCapture}
										>
											Open Camera
										</Button>
									</div>
								</TabsContent>
								<TabsContent value="document" className="mt-4">
									<div className="flex flex-col items-center justify-center gap-y-3 p-6 border-2 border-dashed rounded-xl border-primary/30 bg-accent/20">
										<div className="rounded-full bg-primary/10 p-4 text-primary">
											<FileIcon2 className="h-8 w-8" />
										</div>
										<p className="text-lg font-medium">Scan a document</p>
										<Button
											type="button"
											variant="secondary"
											className="mt-2 transition-all duration-200 w-full"
											onClick={handleDocumentCapture}
										>
											Select Document
										</Button>
									</div>
								</TabsContent>
							</Tabs>
						) : (
							<div {...getRootProps()} className={dropzoneStyle}>
								<input {...getInputProps()} />
								<div className="flex flex-col items-center justify-center gap-y-3">
									<div className="rounded-full bg-primary/10 p-4 text-primary">
										<UploadIcon className="h-8 w-8" />
									</div>
									<p className="text-lg font-medium">Drag & drop files here</p>
									<p className="text-sm text-muted-foreground">
										Or click to browse (max {maxFiles} files, up to{" "}
										{maxSize / (1024 * 1024)}MB each)
									</p>
									<Button
										type="button"
										variant="secondary"
										className="mt-2 transition-all duration-200"
										onClick={(e) => {
											e.stopPropagation();
											openFileDialog();
										}}
									>
										Browse files
									</Button>
								</div>
							</div>
						)}

						<Controller
							name="previews"
							control={control}
							render={({ field }) => (
								<>
									{field.value.length > 0 && (
										<div className="space-y-3">
											<h3 className="text-sm font-medium text-muted-foreground">
												Files to Upload
											</h3>
											<ScrollArea className="space-y-2 h-[200px] md:h-[250px] w-full gap-y-2">
												{field.value.map((file, index) => (
													<div
														key={file.id}
														className="my-2 rounded-lg border border-border bg-card/50 p-3 shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-3"
													>
														<div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
															{file.type.startsWith("image/") ? (
																<Image
																	src={file.preview || "/placeholder.svg"}
																	alt={file.name}
																	width={40}
																	height={40}
																	className="h-full w-full object-cover"
																	unoptimized
																	onLoad={() => {
																		// Do not revoke preview here
																	}}
																/>
															) : (
																<FileIcon className="h-5 w-5 text-muted-foreground" />
															)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex flex-row gap-2 items-center">
																<p className="text-sm font-medium truncate max-w-[50%]">
																	{file.name}
																</p>
																<div className="text-primary">
																	<CheckCircle className="h-3.5 w-3.5" />
																</div>
															</div>
															<div className="text-xs text-muted-foreground">
																<div className="flex items-center justify-between mt-1">
																	<div className="flex flex-row gap-1 items-center">
																		<div>{getFileTypeIcon(file.type)}</div>
																		<div>{formatFileSize(file.size)}</div>
																	</div>
																	<p className="text-xs text-muted-foreground">
																		{formatDate(file.lastModified)}
																	</p>
																</div>
															</div>
														</div>
														<button
															type="button"
															onClick={() => removeFile(file.id, index)}
															className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
														>
															<X className="h-4 w-4" />
														</button>
													</div>
												))}
											</ScrollArea>
										</div>
									)}
								</>
							)}
						/>
					</div>
					<DialogFooter className="flex flex-col sm:flex-row gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							className="transition-all duration-200 hover:bg-muted w-full sm:w-auto"
						>
							Close
						</Button>
						<Button
							type="submit"
							className="transition-all duration-200 w-full sm:w-auto"
							disabled={files.length <= 0 || isPending || isSubmitting}
						>
							{isPending || isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Uploading...
								</>
							) : (
								"Upload"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
