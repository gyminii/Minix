export type StatCategory = {
	count: number;
	size: number;
	sizeGB: number;
	percentage: number;
};

export type FolderStat = {
	id: string;
	name: string;
	items: number;
	lastUpdate: string;
	starred: boolean;
};

export type StorageInfo = {
	used: number;
	total: number;
	percentage: number;
};

export type BucketInfo = {
	name: string;
	id: string;
	public: boolean;
	owner?: string;
	created_at?: string;
	updated_at?: string;
};

export type RecentFile = {
	id: string;
	name: string;
	size: number;
	type: string;
	created_at: string;
	url: string | null;
};

export type DashboardStats = {
	stats: {
		documents: StatCategory;
		images: StatCategory;
		videos: StatCategory;
		others: StatCategory;
		total: StatCategory;
	};
	folderStats: FolderStat[];
	storageInfo: StorageInfo;
	bucketInfo?: BucketInfo | null;

	recentFiles: RecentFile[];
};
