// app/api/dashboard/route.ts
import { getUserId } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { listAllFiles, listFolders, listRecentFiles } from "@/lib/db";
import { NextResponse } from "next/server";

const FILE_TYPES = {
	DOCUMENTS: [
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
	],
	IMAGES: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/svg+xml",
		"image/webp",
		"image/tiff",
		"image/bmp",
	],
	VIDEOS: [
		"video/mp4",
		"video/quicktime",
		"video/x-msvideo",
		"video/x-matroska",
		"video/webm",
		"video/ogg",
		"video/mpeg",
	],
};

const TOTAL_STORAGE_GB = Number(process.env.TOTAL_STORAGE_GB || 25); // e.g., 25 GB

export async function GET() {
	try {
		const userId = await getUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const db = await getDb();

		// Files for stats (bytes kept), folders for folder cards, top 5 most recent files
		const [files, folders, recentFilesRaw] = await Promise.all([
			listAllFiles(db, userId),
			listFolders(db, userId),
			listRecentFiles(db, userId, 5),
		]);

		const recentFiles = recentFilesRaw.map((f) => ({
			id: f.id,
			name: f.name,
			size: f.size ?? 0,
			type: f.type ?? "application/octet-stream",
			created_at: f.created_at,
			url: `/api/files/${f.id}/raw`,
		}));

		const emptyCat = () => ({ count: 0, size: 0, sizeGB: 0, percentage: 0 });
		const stats = {
			documents: emptyCat(),
			images: emptyCat(),
			videos: emptyCat(),
			others: emptyCat(),
			total: emptyCat(),
		};

		const isType = (fileType: string | null | undefined, list: string[]) =>
			list.some((t) => fileType?.startsWith(t));

		for (const file of files) {
			const size = file.size || 0;
			stats.total.count += 1;
			stats.total.size += size;

			if (isType(file.type, FILE_TYPES.DOCUMENTS)) {
				stats.documents.count += 1;
				stats.documents.size += size;
			} else if (isType(file.type, FILE_TYPES.IMAGES)) {
				stats.images.count += 1;
				stats.images.size += size;
			} else if (isType(file.type, FILE_TYPES.VIDEOS)) {
				stats.videos.count += 1;
				stats.videos.size += size;
			} else {
				stats.others.count += 1;
				stats.others.size += size;
			}
		}

		const bytesToGB = (b: number) =>
			Number.parseFloat((b / 1024 ** 3).toFixed(1));

		// compute sizeGB
		stats.documents.sizeGB = bytesToGB(stats.documents.size);
		stats.images.sizeGB = bytesToGB(stats.images.size);
		stats.videos.sizeGB = bytesToGB(stats.videos.size);
		stats.others.sizeGB = bytesToGB(stats.others.size);
		stats.total.sizeGB = bytesToGB(stats.total.size);

		// percentages relative to TOTAL_STORAGE_GB
		const pct = (gb: number) =>
			TOTAL_STORAGE_GB > 0
				? Math.min(100, Math.round((gb / TOTAL_STORAGE_GB) * 100))
				: 0;

		stats.documents.percentage = pct(stats.documents.sizeGB);
		stats.images.percentage = pct(stats.images.sizeGB);
		stats.videos.percentage = pct(stats.videos.sizeGB);
		stats.others.percentage = pct(stats.others.sizeGB);
		stats.total.percentage = pct(stats.total.sizeGB);

		// Storage info
		const storageInfo = {
			used: stats.total.sizeGB,
			total: TOTAL_STORAGE_GB,
			percentage: stats.total.percentage,
		};

		// Folder cards (top-level)
		const topFolders = folders.filter((f) => !f.parent_id);
		const folderStats = topFolders.map((folder) => {
			const directFilesCount = files.filter(
				(file) => file.folder_id === folder.id
			).length;
			const subfoldersCount = folders.filter(
				(f) => f.parent_id === folder.id
			).length;

			const folderFiles = files.filter((file) => file.folder_id === folder.id);
			let lastUpdate = folder.created_at;

			if (folderFiles.length > 0) {
				const latestFile = folderFiles.reduce(
					(latest, file) =>
						new Date(file.created_at) > new Date(latest.created_at)
							? file
							: latest,
					folderFiles[0]
				);

				if (new Date(latestFile.created_at) > new Date(lastUpdate)) {
					lastUpdate = latestFile.created_at;
				}
			}

			const updateDate = new Date(lastUpdate);
			const now = new Date();
			const diffDays = Math.ceil(
				Math.abs(now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			let lastUpdateText = "";
			if (diffDays === 1) lastUpdateText = "Yesterday";
			else if (diffDays <= 30) lastUpdateText = `${diffDays} days ago`;
			else lastUpdateText = updateDate.toLocaleDateString();

			return {
				id: folder.id,
				name: folder.name,
				items: directFilesCount + subfoldersCount,
				lastUpdate: lastUpdateText,
				starred: false,
			};
		});

		return NextResponse.json({
			stats,
			folderStats,
			storageInfo,
			recentFiles,
		});
	} catch (error) {
		console.error("Dashboard API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
