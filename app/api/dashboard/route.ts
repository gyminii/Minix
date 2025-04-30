import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// File type categories based on MIME types
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

const TOTAL_STORAGE = Number(process.env.TOTAL_STORAGE_GB || 25); // Default: 25 GB

export async function GET() {
	try {
		const client = await createClient();
		const { data: userData, error: userError } = await client.auth.getUser();
		if (userError || !userData?.user) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const userId = userData.user.id;

		// Get all files for the user
		const { data: files, error: filesError } = await client
			.from("files")
			.select("id, name, size, type, folder_id, created_at")
			.eq("user_id", userId);

		if (filesError) {
			return NextResponse.json(
				{ error: "Failed to fetch files" },
				{ status: 500 }
			);
		}

		// Get all folders for the user
		const { data: folders, error: foldersError } = await client
			.from("folders")
			.select("id, name, created_at, parent_id")
			.eq("user_id", userId);

		if (foldersError) {
			return NextResponse.json(
				{ error: "Failed to fetch folders" },
				{ status: 500 }
			);
		}

		// Initialize counters and storage usage
		const stats = {
			documents: { count: 0, size: 0, percentage: 0 },
			images: { count: 0, size: 0, percentage: 0 },
			videos: { count: 0, size: 0, percentage: 0 },
			others: { count: 0, size: 0, percentage: 0 },
			total: { count: 0, size: 0, percentage: 0 },
		};

		// Process files
		files.forEach((file) => {
			stats.total.count++;
			stats.total.size += file.size || 0;

			// Categorize by file type
			if (FILE_TYPES.DOCUMENTS.some((type) => file.type?.startsWith(type))) {
				stats.documents.count++;
				stats.documents.size += file.size || 0;
			} else if (
				FILE_TYPES.IMAGES.some((type) => file.type?.startsWith(type))
			) {
				stats.images.count++;
				stats.images.size += file.size || 0;
			} else if (
				FILE_TYPES.VIDEOS.some((type) => file.type?.startsWith(type))
			) {
				stats.videos.count++;
				stats.videos.size += file.size || 0;
			} else {
				stats.others.count++;
				stats.others.size += file.size || 0;
			}
		});

		// Calculate total size in GB
		const totalSizeGB = stats.total.size / (1024 * 1024 * 1024);

		// Calculate percentages based on total usage
		const totalPercentage =
			Math.round((totalSizeGB / TOTAL_STORAGE) * 100) || 0;

		// For each category, calculate percentage of total used space
		const documentsSizeGB = stats.documents.size / (1024 * 1024 * 1024);
		const imagesSizeGB = stats.images.size / (1024 * 1024 * 1024);
		const videosSizeGB = stats.videos.size / (1024 * 1024 * 1024);
		const othersSizeGB = stats.others.size / (1024 * 1024 * 1024);

		// Calculate percentage of total storage for each category
		stats.documents.percentage =
			totalSizeGB > 0 ? Math.round((documentsSizeGB / TOTAL_STORAGE) * 100) : 0;
		stats.images.percentage =
			totalSizeGB > 0 ? Math.round((imagesSizeGB / TOTAL_STORAGE) * 100) : 0;
		stats.videos.percentage =
			totalSizeGB > 0 ? Math.round((videosSizeGB / TOTAL_STORAGE) * 100) : 0;
		stats.others.percentage =
			totalSizeGB > 0 ? Math.round((othersSizeGB / TOTAL_STORAGE) * 100) : 0;
		stats.total.percentage = totalPercentage;

		// Convert sizes to GB with 1 decimal place
		stats.documents.size = Number.parseFloat(
			(stats.documents.size / (1024 * 1024 * 1024)).toFixed(1)
		);
		stats.images.size = Number.parseFloat(
			(stats.images.size / (1024 * 1024 * 1024)).toFixed(1)
		);
		stats.videos.size = Number.parseFloat(
			(stats.videos.size / (1024 * 1024 * 1024)).toFixed(1)
		);
		stats.others.size = Number.parseFloat(
			(stats.others.size / (1024 * 1024 * 1024)).toFixed(1)
		);
		stats.total.size = Number.parseFloat(
			(stats.total.size / (1024 * 1024 * 1024)).toFixed(1)
		);

		// Get top-level folders (for the folder cards)
		const topFolders = folders.filter((folder) => !folder.parent_id);

		// Count items in each folder (including nested items)
		const folderStats = topFolders.map((folder) => {
			// Count direct files in this folder
			const directFiles = files.filter(
				(file) => file.folder_id === folder.id
			).length;

			// Count subfolders
			const subfolders = folders.filter(
				(f) => f.parent_id === folder.id
			).length;

			// Calculate last update time
			const folderFiles = files.filter((file) => file.folder_id === folder.id);
			let lastUpdate = folder.created_at;

			if (folderFiles.length > 0) {
				const latestFile = folderFiles.reduce((latest, file) => {
					return new Date(file.created_at) > new Date(latest.created_at)
						? file
						: latest;
				}, folderFiles[0]);

				if (new Date(latestFile.created_at) > new Date(lastUpdate)) {
					lastUpdate = latestFile.created_at;
				}
			}

			// Format the last update time
			let lastUpdateText = "";
			const updateDate = new Date(lastUpdate);
			const today = new Date();
			const diffTime = Math.abs(today.getTime() - updateDate.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 1) {
				lastUpdateText = "Yesterday";
			} else if (diffDays <= 30) {
				lastUpdateText = `${diffDays} days ago`;
			} else {
				lastUpdateText = updateDate.toLocaleDateString();
			}

			return {
				id: folder.id,
				name: folder.name,
				items: directFiles + subfolders,
				lastUpdate: lastUpdateText,
				starred: false, // This would need to be implemented with a separate "starred" table
			};
		});

		// Try to get bucket information
		let bucketInfo = null;
		try {
			const { data: bucketData, error: bucketError } =
				await client.storage.getBucket("minix");
			if (!bucketError && bucketData) {
				bucketInfo = {
					name: bucketData.name,
					id: bucketData.id,
					public: bucketData.public,
				};
			}
		} catch (error) {
			console.error("Failed to get bucket info:", error);
			// Continue without bucket info
		}

		return NextResponse.json({
			stats,
			folderStats,
			storageInfo: {
				used: stats.total.size,
				total: TOTAL_STORAGE,
				percentage: stats.total.percentage,
			},
			bucketInfo,
		});
	} catch (error) {
		console.error("Dashboard API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
