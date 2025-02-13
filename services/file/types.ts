export interface FileEntry {
  kind: 'file'
  name: string
  handle: FileSystemFileHandle
}

export function isFileEntry(entry: FileEntry | DirectoryEntry): entry is FileEntry {
  return entry.kind === 'file'
}

export interface DirectoryEntry {
  kind: 'directory'
  name: string
  handle: FileSystemDirectoryHandle
  files: (FileEntry | DirectoryEntry)[]
}

export function isDirectoryEntry(entry: FileEntry | DirectoryEntry): entry is DirectoryEntry {
  return entry.kind === 'directory'
}

export type FileContent = string | ArrayBuffer | Blob | Uint8Array
