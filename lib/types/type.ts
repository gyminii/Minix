type File = {
	id: string;
	name: string;
	created_at: string;
	size: number;
	url?: string;
	path?: string;
	type: string;
};

type Folder = {
	id: string;
	name: string;
	created_at: string;
	size?: number;
	url?: string;
	type: "folder";
};

type DriveEntry = Folder | File;

export type { File, Folder, DriveEntry };
