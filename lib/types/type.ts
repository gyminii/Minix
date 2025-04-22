export type File = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string; // MIME type
};

export type Folder = {
	id: string;
	name: string;
	created_at: string;
	type: "folder";
};

export type DriveEntry = Folder | (File & { type: "file" });
