export type FolderRow = {
	id: string;
	user_id: string;
	name: string;
	parent_id: string | null;
	created_at: string;
};

export type FileRow = {
	id: string;
	user_id: string;
	name: string;
	key: string;
	size: number;
	type: string;
	folder_id: string | null;
	created_at: string;
	updated_at: string;
};

export type PasteRow = {
	id: string;
	user_id: string;
	name: string;
	syntax: string;
	folder_id: string | null;
	expires_at: string | null;
	created_at: string;
	updated_at: string;
};

export type ShareRow = {
	token: string;
	user_id: string;
	kind: "file" | "paste";
	target_id: string;
	expires_at: string;
	created_at: string;
};

const placeholders = (count: number, offset = 0) =>
	Array.from({ length: count }, (_, i) => `?${i + 1 + offset}`).join(", ");

export async function listFolders(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			"SELECT id, user_id, name, parent_id, created_at FROM folders WHERE user_id = ?1 ORDER BY name ASC"
		)
		.bind(userId)
		.all<FolderRow>();
	return results;
}

export async function listChildFolders(
	db: D1Database,
	userId: string,
	parentId: string | null
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, parent_id, created_at FROM folders
			 WHERE user_id = ?1 AND parent_id IS ?2`
		)
		.bind(userId, parentId)
		.all<FolderRow>();
	return results;
}

export async function getFolder(db: D1Database, userId: string, id: string) {
	return db
		.prepare(
			"SELECT id, user_id, name, parent_id, created_at FROM folders WHERE id = ?1 AND user_id = ?2"
		)
		.bind(id, userId)
		.first<FolderRow>();
}

export async function insertFolder(db: D1Database, folder: FolderRow) {
	await db
		.prepare(
			"INSERT INTO folders (id, user_id, name, parent_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
		)
		.bind(
			folder.id,
			folder.user_id,
			folder.name,
			folder.parent_id,
			folder.created_at
		)
		.run();
	return folder;
}

export async function getFolderPath(
	db: D1Database,
	userId: string,
	id: string
) {
	const { results } = await db
		.prepare(
			`WITH RECURSIVE path(id, name, created_at, parent_id, depth) AS (
				SELECT id, name, created_at, parent_id, 0 FROM folders WHERE id = ?1 AND user_id = ?2
				UNION ALL
				SELECT f.id, f.name, f.created_at, f.parent_id, p.depth + 1
				FROM folders f JOIN path p ON f.id = p.parent_id
			)
			SELECT id, name, created_at FROM path ORDER BY depth DESC`
		)
		.bind(id, userId)
		.all<Pick<FolderRow, "id" | "name" | "created_at">>();
	return results;
}

export async function listSubtreeFileKeys(
	db: D1Database,
	userId: string,
	folderId: string
) {
	const { results } = await db
		.prepare(
			`WITH RECURSIVE subtree(id) AS (
				SELECT id FROM folders WHERE id = ?1 AND user_id = ?2
				UNION ALL
				SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
			)
			SELECT key FROM files WHERE folder_id IN (SELECT id FROM subtree)`
		)
		.bind(folderId, userId)
		.all<{ key: string }>();
	return results.map((r) => r.key);
}

export async function listSubtreePasteIds(
	db: D1Database,
	userId: string,
	folderId: string
) {
	const { results } = await db
		.prepare(
			`WITH RECURSIVE subtree(id) AS (
				SELECT id FROM folders WHERE id = ?1 AND user_id = ?2
				UNION ALL
				SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
			)
			SELECT id FROM pastes WHERE folder_id IN (SELECT id FROM subtree)`
		)
		.bind(folderId, userId)
		.all<{ id: string }>();
	return results.map((r) => r.id);
}

export async function deleteFolder(db: D1Database, userId: string, id: string) {
	await db
		.prepare("DELETE FROM folders WHERE id = ?1 AND user_id = ?2")
		.bind(id, userId)
		.run();
}

export async function listAllFiles(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE user_id = ?1`
		)
		.bind(userId)
		.all<FileRow>();
	return results;
}

export async function listChildFiles(
	db: D1Database,
	userId: string,
	folderId: string | null
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE user_id = ?1 AND folder_id IS ?2`
		)
		.bind(userId, folderId)
		.all<FileRow>();
	return results;
}

export async function listRecentFiles(
	db: D1Database,
	userId: string,
	limit: number
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2`
		)
		.bind(userId, limit)
		.all<FileRow>();
	return results;
}

export async function getFile(db: D1Database, userId: string, id: string) {
	return db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE id = ?1 AND user_id = ?2`
		)
		.bind(id, userId)
		.first<FileRow>();
}

export async function getFileById(db: D1Database, id: string) {
	return db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE id = ?1`
		)
		.bind(id)
		.first<FileRow>();
}

export async function getFileByKey(
	db: D1Database,
	userId: string,
	key: string
) {
	return db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE key = ?1 AND user_id = ?2`
		)
		.bind(key, userId)
		.first<FileRow>();
}

export async function listFilesByIds(
	db: D1Database,
	userId: string,
	ids: string[]
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, key, size, type, folder_id, created_at, updated_at
			 FROM files WHERE id IN (${placeholders(ids.length)}) AND user_id = ?${
				ids.length + 1
			}`
		)
		.bind(...ids, userId)
		.all<FileRow>();
	return results;
}

export async function insertFile(db: D1Database, file: FileRow) {
	await db
		.prepare(
			`INSERT INTO files (id, user_id, name, key, size, type, folder_id, created_at, updated_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
		)
		.bind(
			file.id,
			file.user_id,
			file.name,
			file.key,
			file.size,
			file.type,
			file.folder_id,
			file.created_at,
			file.updated_at
		)
		.run();
	return file;
}

export async function deleteFilesByIds(db: D1Database, ids: string[]) {
	await db
		.prepare(`DELETE FROM files WHERE id IN (${placeholders(ids.length)})`)
		.bind(...ids)
		.run();
}

export async function listPastes(
	db: D1Database,
	userId: string,
	folderId: string | null,
	limit: number,
	now: string
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, syntax, folder_id, expires_at, created_at, updated_at
			 FROM pastes
			 WHERE user_id = ?1 AND folder_id IS ?2 AND (expires_at IS NULL OR expires_at > ?3)
			 ORDER BY created_at DESC LIMIT ?4`
		)
		.bind(userId, folderId, now, limit)
		.all<PasteRow>();
	return results;
}

export async function listRecentPastes(
	db: D1Database,
	userId: string,
	limit: number
) {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, name, syntax, folder_id, expires_at, created_at, updated_at
			 FROM pastes WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2`
		)
		.bind(userId, limit)
		.all<PasteRow>();
	return results;
}

export async function getPaste(db: D1Database, id: string) {
	return db
		.prepare(
			`SELECT id, user_id, name, syntax, folder_id, expires_at, created_at, updated_at
			 FROM pastes WHERE id = ?1`
		)
		.bind(id)
		.first<PasteRow>();
}

export async function insertPaste(db: D1Database, paste: PasteRow) {
	await db
		.prepare(
			`INSERT INTO pastes (id, user_id, name, syntax, folder_id, expires_at, created_at, updated_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
		)
		.bind(
			paste.id,
			paste.user_id,
			paste.name,
			paste.syntax,
			paste.folder_id,
			paste.expires_at,
			paste.created_at,
			paste.updated_at
		)
		.run();
	return paste;
}

export async function updatePaste(
	db: D1Database,
	id: string,
	fields: Record<string, string | null>
) {
	const keys = Object.keys(fields);
	await db
		.prepare(
			`UPDATE pastes SET ${keys
				.map((key, i) => `${key} = ?${i + 1}`)
				.join(", ")} WHERE id = ?${keys.length + 1}`
		)
		.bind(...keys.map((key) => fields[key]), id)
		.run();
}

export async function deletePaste(db: D1Database, id: string) {
	await db.prepare("DELETE FROM pastes WHERE id = ?1").bind(id).run();
}

export async function insertShare(db: D1Database, share: ShareRow) {
	await db
		.prepare(
			`INSERT INTO shares (token, user_id, kind, target_id, expires_at, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
		)
		.bind(
			share.token,
			share.user_id,
			share.kind,
			share.target_id,
			share.expires_at,
			share.created_at
		)
		.run();
	return share;
}

export async function getShare(db: D1Database, token: string) {
	return db
		.prepare(
			"SELECT token, user_id, kind, target_id, expires_at, created_at FROM shares WHERE token = ?1"
		)
		.bind(token)
		.first<ShareRow>();
}
