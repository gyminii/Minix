type File = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	type: string; // MIME type
};

type Folder = {
	id: string;
	name: string;
	created_at: string;
	size?: number;
	type: "folder";
};

type DriveEntry = Folder | File;

export type { File, Folder, DriveEntry };
