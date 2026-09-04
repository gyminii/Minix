CREATE TABLE folders (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL
);

CREATE TABLE files (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	key TEXT NOT NULL UNIQUE,
	size INTEGER NOT NULL,
	type TEXT NOT NULL,
	folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE pastes (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	syntax TEXT NOT NULL DEFAULT 'plaintext',
	folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
	expires_at TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE shares (
	token TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('file', 'paste')),
	target_id TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE INDEX idx_folders_user_parent ON folders(user_id, parent_id);
CREATE INDEX idx_files_user_folder ON files(user_id, folder_id);
CREATE INDEX idx_pastes_user_folder ON pastes(user_id, folder_id);
CREATE INDEX idx_shares_target ON shares(target_id);
