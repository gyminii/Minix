export interface PasteMetadata {
	id: string;
	title: string;
	syntax: string;
	folder_id: string | null;
	expires_at: string | null;
	created_at: string;
}

export interface Paste extends PasteMetadata {
	content: string;
	user_id: string;
}
