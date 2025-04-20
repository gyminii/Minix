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
		maxFiles: 2,
		maxFileSize: 1000 * 1000 * 10, // 10MB,
	});

	return (
		<div className="w-[500px]">
			<Dropzone {...props}>
				<DropzoneEmptyState />
				<DropzoneContent />
			</Dropzone>
		</div>
	);
};

export { FileUploadForm };
