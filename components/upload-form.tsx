"use client";

import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";

const FileUploadForm = () => {
	const props = useSupabaseUpload({
		bucketName: "minix",
		path: "files",
		allowedMimeTypes: [
			"image/*",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.oasis.opendocument.text",
			"application/rtf",
			"text/plain",
			"text/markdown",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.oasis.opendocument.spreadsheet",
			"text/csv",
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"application/vnd.oasis.opendocument.presentation",
			"video/*",
			"audio/*",
			"application/zip",
			"application/x-rar-compressed",
			"application/x-7z-compressed",
			"application/gzip",
		],
		maxFiles: 5,
		maxFileSize: 1000 * 1000 * 10, // 10MB,
	});
	return (
		<div className="w-full">
			<Dropzone {...props}>
				<DropzoneEmptyState />
				<DropzoneContent />
			</Dropzone>
		</div>
	);
};

export { FileUploadForm };
