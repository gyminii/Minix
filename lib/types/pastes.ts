export interface PasteMetadata {
	id: string;
	title: string;
	syntax: string;
	folder_id: string | null;
	expires_at: string | null;
	created_at: string;
	url: string | null;
}

export interface Paste extends PasteMetadata {
	content: string;
	user_id: string;
}
