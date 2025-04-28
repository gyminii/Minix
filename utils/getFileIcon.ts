// Get file type icon
export const getFileTypeIcon = (type: string) => {
	if (type.startsWith("video/")) {
		return "🎬";
	} else if (type.startsWith("audio/")) {
		return "🎵";
	} else if (type.includes("pdf")) {
		return "📄";
	} else if (type.includes("word") || type.includes("document")) {
		return "📝";
	} else if (
		type.includes("excel") ||
		type.includes("sheet") ||
		type.includes("drawio")
	) {
		return "📊";
	} else if (type.includes("powerpoint") || type.includes("presentation")) {
		return "📑";
	} else if (type.includes("image/")) {
		return "🖼️";
	} else if (type.includes("text/")) {
		return "📄";
	} else {
		return "📁";
	}
};
