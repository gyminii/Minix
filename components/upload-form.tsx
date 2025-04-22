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
		allowedMimeTypes: ["image/*"],
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
