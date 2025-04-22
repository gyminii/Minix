"use client";

import {
	AlertCircle,
	CheckCircle,
	FileIcon,
	Upload,
	UploadIcon,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "next/navigation";
import { useUploadFiles } from "@/hooks/use-upload-files";

interface FileWithPreview extends File {
	preview: string;
	progress: number;
	id: string;
	uploaded?: boolean;
	error?: string;
	name: string;
	size: number;
	type: string;
	lastModified: number;
}

interface FileUploadDropzoneProps {
	maxFiles?: number;
	maxSize?: number;
	accept?: Accept;
	onUpload?: (files: File[]) => Promise<void>;
	className?: string;
}

export function FileUploadDialog({
	maxFiles = 10,
	maxSize = 4 * 1024 * 1024, // 4MB
	accept = {
		"image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
	},
	onUpload,
}: FileUploadDropzoneProps) {
	const { mutate: uploadFiles, isPending, isIdle } = useUploadFiles();

	const { folderId } = useParams<{ folderId: string }>();
	const [files, setFiles] = useState<FileWithPreview[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
	const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
	const [open, setOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			// Handle rejected files
			setFileRejections(rejectedFiles);

			// Clear rejections after 3 seconds
			if (rejectedFiles.length > 0) {
				setTimeout(() => setFileRejections([]), 5000);
			}

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

			const newFiles = acceptedFiles.map((file) =>
				Object.assign({}, file, {
					preview: URL.createObjectURL(file),
					progress: 0,
					id: crypto.randomUUID(),
					name: file.name,
					size: file.size,
					type: file.type,
					lastModified: file.lastModified,
				})
			);

			setFiles((prev) => [...prev, ...newFiles]);

			// Simulate upload progress
			newFiles.forEach((file) => {
				simulateUploadProgress(file);
			});
		},
		[files, maxFiles]
	);

	// Function to handle the actual file upload
	const uploadFile = async (file: FileWithPreview) => {
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));
			return {
				url: file.preview, // Use the existing preview URL instead of creating a new one
				success: true,
			};
		} catch (error) {
			console.error(`Error uploading file ${file.name}:`, error);
			throw error;
		}
	};

	const simulateUploadProgress = (file: FileWithPreview) => {
		let progress = 0;
		setIsUploading(true);

		const interval = setInterval(() => {
			progress += 5;
			setFiles((prevFiles) =>
				prevFiles.map((f) => (f.id === file.id ? { ...f, progress } : f))
			);

			if (progress >= 100) {
				clearInterval(interval);

				// When progress reaches 100%, perform the actual upload
				uploadFile(file)
					.then((result) => {
						// Mark file as successfully uploaded
						setFiles((prevFiles) => prevFiles.filter((f) => f.id !== file.id));

						// Make sure we preserve all file metadata when moving to uploadedFiles
						const fileWithMetadata = {
							...file,
							uploaded: true,
							progress: 100,
						};

						setUploadedFiles((prev) => [...prev, fileWithMetadata]);
					})
					.catch((error) => {
						// Mark file as failed
						setFiles((prevFiles) =>
							prevFiles.map((f) =>
								f.id === file.id
									? {
											...f,
											progress: 100,
											error: "Upload failed. Click to retry.",
									  }
									: f
							)
						);
					})
					.finally(() => {
						// Check if there are any files still uploading
						setTimeout(() => {
							const stillUploading = files.some(
								(f) => f.progress < 100 && !f.error
							);
							if (!stillUploading) {
								setIsUploading(false);
							}
						}, 0);
					});
			}
		}, 100);
	};

	const removeFile = (id: string) => {
		setFiles((prevFiles) => {
			const fileToRemove = prevFiles.find((f) => f.id === id);
			if (fileToRemove) {
				URL.revokeObjectURL(fileToRemove.preview);
			}
			return prevFiles.filter((f) => f.id !== id);
		});
	};

	const removeUploadedFile = (id: string) => {
		setUploadedFiles((prevFiles) => {
			const fileToRemove = prevFiles.find((f) => f.id === id);
			if (fileToRemove && fileToRemove.preview) {
				try {
					URL.revokeObjectURL(fileToRemove.preview);
				} catch (error) {
					console.error("Error revoking object URL:", error);
				}
			}
			return prevFiles.filter((f) => f.id !== id);
		});
	};

	const retryUpload = (file: FileWithPreview) => {
		// Reset progress and error
		setFiles((prevFiles) =>
			prevFiles.map((f) =>
				f.id === file.id ? { ...f, progress: 0, error: undefined } : f
			)
		);

		// Start upload process again
		simulateUploadProgress(file);
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
				"border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 border-primary/30 bg-accent/20",
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
			files.forEach((file) => {
				if (file.preview) {
					try {
						URL.revokeObjectURL(file.preview);
					} catch (error) {
						console.error("Error revoking object URL:", error);
					}
				}
			});
			uploadedFiles.forEach((file) => {
				if (file.preview) {
					try {
						URL.revokeObjectURL(file.preview);
					} catch (error) {
						console.error("Error revoking object URL:", error);
					}
				}
			});
		};
	}, [files, uploadedFiles]);

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
			return "Unknown date";
		}
	};

	// Get file type icon
	const getFileTypeIcon = (type: string) => {
		if (type.startsWith("image/")) {
			return "🖼️";
		} else if (type.startsWith("video/")) {
			return "🎬";
		} else if (type.startsWith("audio/")) {
			return "🎵";
		} else if (type.includes("pdf")) {
			return "📄";
		} else if (type.includes("word") || type.includes("document")) {
			return "📝";
		} else if (type.includes("excel") || type.includes("sheet")) {
			return "📊";
		} else if (type.includes("powerpoint") || type.includes("presentation")) {
			return "📑";
		} else if (type.includes("drawio")) {
			return "📊";
		} else {
			return "📁";
		}
	};

	// Function to handle all uploads completion
	const handleAllUploadsComplete = useCallback(async () => {
		// TODO: Implement what happens when all uploads are complete
		console.log("All uploads complete:", uploadedFiles);

		// You might want to call the onUpload prop here
		try {
			if (onUpload) {
				await onUpload(uploadedFiles);
				setOpen(false);
			} else {
				// Do it here
				uploadFiles(
					{ files: uploadedFiles, folderId },
					{
						onSuccess: (res) => {
							console.log("Upload success:", res.success);
							if (res.failed.length) console.log("Failed:", res.failed);
							setOpen(false);
						},
						onError: (err) => {
							console.error("Upload error:", err);
							setOpen(false);
						},
					}
				);
			}
			setOpen(false);
		} catch (error) {
			console.log(error);
		}
	}, [uploadedFiles, onUpload, folderId]);

	// // Check if all uploads are complete
	// useEffect(() => {
	// 	if (files.length === 0 && uploadedFiles.length > 0 && !isUploading) {
	// 		handleAllUploadsComplete();
	// 	}
	// }, [files, uploadedFiles, isUploading, handleAllUploadsComplete]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="gap-2 transition-all duration-200 hover:bg-primary/10"
				>
					<Upload className="h-4 w-4" />
					Upload Files
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-xl">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold">
						Upload Files
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Drag and drop files or click to browse
					</DialogDescription>
				</DialogHeader>
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
					<>
						{files.length > 0 && (
							<div className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground">
									Uploading
								</h3>
								<ScrollArea className="space-y-2 h-[250px] w-full gap-y-2">
									{files.map((file) => (
										<div
											key={file.id}
											className="rounded-lg border border-border bg-card/50 p-3 shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-3"
										>
											<div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
												{file.type.startsWith("image/") ? (
													<img
														src={file.preview || "/placeholder.svg"}
														alt={file.name}
														className="h-full w-full object-cover"
														onLoad={() => {
															// Don't revoke during load as we need it later
															// URL.revokeObjectURL(file.preview)
														}}
													/>
												) : (
													<FileIcon className="h-5 w-5 text-muted-foreground" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate max-w-[50%]">
													{file.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatFileSize(file.size)}
												</p>
												<div className="mt-2 w-full">
													{file.error ? (
														<div className="flex items-center justify-between">
															<p className="text-xs text-destructive">
																{file.error}
															</p>
															<Button
																variant="ghost"
																size="sm"
																className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
																onClick={() => retryUpload(file)}
															>
																Retry
															</Button>
														</div>
													) : (
														<Progress
															value={file.progress}
															className="h-1.5 w-full"
														/>
													)}
												</div>
											</div>
											<button
												type="button"
												onClick={() => removeFile(file.id)}
												className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
											>
												<X className="h-4 w-4" />
											</button>
										</div>
									))}
								</ScrollArea>
							</div>
						)}
						{uploadedFiles.length > 0 && (
							<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
								<div className="flex flex-row justify-between items-center mb-3">
									<h3 className="text-sm font-medium text-muted-foreground">
										Uploaded files
									</h3>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 p-0 w-8 rounded-full hover:bg-muted"
										onClick={() => setUploadedFiles([])}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								{/* className="h-[200px] w-full rounded-md" */}
								<ScrollArea className="space-y-2 h-[250px] w-full gap-y-2">
									{uploadedFiles.map((file) => (
										<div
											key={file.id}
											className="my-2 relative overflow-hidden bg-card rounded-lg border border-border shadow-sm transition-all duration-200 hover:shadow-md"
										>
											<div className="p-3 flex items-center gap-3">
												<div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
													<span className="text-lg">
														{getFileTypeIcon(file.type)}
													</span>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<p className="text-sm font-medium truncate max-w-[50%]">
															{file.name || "Unnamed file"}
														</p>
														<div className="text-primary">
															<CheckCircle className="h-3.5 w-3.5" />
														</div>
													</div>
													<div className="flex items-center justify-between mt-1">
														<p className="text-xs text-muted-foreground">
															{formatFileSize(file.size)}
														</p>
														<p className="text-xs text-muted-foreground">
															{formatDate(file.lastModified)}
														</p>
													</div>
												</div>
												<button
													type="button"
													onClick={() => removeUploadedFile(file.id)}
													className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</ScrollArea>
							</div>
						)}
					</>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						className="transition-all duration-200 hover:bg-muted"
					>
						Close
					</Button>
					<Button
						onClick={() => {
							handleAllUploadsComplete();
						}}
						className="transition-all duration-200"
						disabled={uploadedFiles.length < 0}
					>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
