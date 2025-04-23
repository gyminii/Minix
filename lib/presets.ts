export type UploadFormats = {
	// Documents
	"application/pdf": [".pdf"];
	"application/msword": [".doc"];
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx"
	];
	"application/vnd.oasis.opendocument.text": [".odt"];
	"application/rtf": [".rtf"];
	"text/plain": [".txt"];
	"text/markdown": [".md"];

	// Spreadsheets
	"application/vnd.ms-excel": [".xls"];
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
		".xlsx"
	];
	"application/vnd.oasis.opendocument.spreadsheet": [".ods"];
	"text/csv": [".csv"];
	"text/tab-separated-values": [".tsv"];

	// Presentations
	"application/vnd.ms-powerpoint": [".ppt"];
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [
		".pptx"
	];
	"application/vnd.oasis.opendocument.presentation": [".odp"];

	// Images
	"image/*": [".jpeg", ".jpg", ".png", ".gif", ".svg", ".webp"];

	// Archives
	"application/zip": [".zip"];
	"application/x-rar-compressed": [".rar"];
	"application/x-7z-compressed": [".7z"];
	"application/gzip": [".tar.gz"];
};
